import type { EvmNetwork, GenericNetwork } from '@dynamic-labs/types';
import { FilterChain } from '@dynamic-labs/sdk-react-core';

export const BSC_EVM_NETWORK: EvmNetwork = {
  chainId: 56,
  networkId: 56,
  name: 'BNB Smart Chain',
  vanityName: 'BNB Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: [
    process.env.NEXT_PUBLIC_BSC_RPC_URL ||
      'https://bsc-dataseed.binance.org',
  ],
  blockExplorerUrls: ['https://bscscan.com'],
  iconUrls: ['https://dd.dexscreener.com/ds-data/chains/bsc.png'],
  isTestnet: false,
  key: 'bsc',
  hasNativeToken: true,
};

export const BITCOIN_MAINNET: GenericNetwork = {
  chainId: 1,
  networkId: 1,
  name: 'Bitcoin',
  vanityName: 'Bitcoin',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: ['https://mempool.space/api'],
  blockExplorerUrls: ['https://mempool.space'],
  iconUrls: [],
  isTestnet: false,
  key: 'bitcoin',
};

export const walletListTabsConfig = {
  type: 'wallet-list' as const,
  tabs: {
    style: 'grid' as const,
    items: [
      {
        label: { text: 'BNB / EVM', key: 'bnb-evm' },
        walletsFilter: FilterChain('EVM'),
      },
      {
        label: { text: 'Bitcoin', key: 'bitcoin' },
        walletsFilter: FilterChain('BTC'),
      },
      {
        label: { text: 'Solana', key: 'solana' },
        walletsFilter: FilterChain('SOL'),
      },
    ],
  },
};

export function mergeEvmNetworksWithBsc(
  networks: GenericNetwork[] | undefined,
): GenericNetwork[] {
  const list = networks ?? [];
  if (list.some((n) => Number(n.chainId) === 56)) return list;
  return [...list, BSC_EVM_NETWORK];
}

export function ensureBitcoinMainnet(
  networks: GenericNetwork[] | undefined,
): GenericNetwork[] {
  const list = networks ?? [];
  if (list.length > 0) return list;
  return [BITCOIN_MAINNET];
}
