import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobalSearch } from '../context/GlobalSearchContext';

export type ChainDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
};

const CHAINS: ChainDef[] = [
  {
    id: 'solana',
    label: 'Solana',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/solana.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Solana"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'base',
    label: 'Base',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/base.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Base"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'bsc',
    label: 'BSC',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/bsc.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="BSC"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/ethereum.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Ethereum"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'polygon',
    label: 'Polygon',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/polygon.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Polygon"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'pulsechain',
    label: 'PulseChain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/pulsechain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="PulseChain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'ton',
    label: 'TON',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/ton.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="TON"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'avalanche',
    label: 'Avalanche',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/avalanche.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Avalanche"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'arbitrum',
    label: 'Arbitrum',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/arbitrum.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Arbitrum"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'xrpl',
    label: 'XRPL',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/xrpl.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="XRPL"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'hyperliquid',
    label: 'Hyperliquid',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/hyperliquid.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Hyperliquid"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'osmosis',
    label: 'Osmosis',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/osmosis.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Osmosis"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'sui',
    label: 'Sui',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/sui.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Sui"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'cronos',
    label: 'Cronos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/cronos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Cronos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'hedera',
    label: 'Hedera',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/hedera.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Hedera"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'abstract',
    label: 'Abstract',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/abstract.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Abstract"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'worldchain',
    label: 'World Chain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/worldchain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="World Chain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'hyperevm',
    label: 'HyperEVM',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/hyperevm.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="HyperEVM"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'near',
    label: 'NEAR',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/near.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="NEAR"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'monad',
    label: 'Monad',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/monad.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Monad"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'sonic',
    label: 'Sonic',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/sonic.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Sonic"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'megaeth',
    label: 'MegaETH',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/megaeth.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="MegaETH"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'tron',
    label: 'Tron',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/tron.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Tron"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'plasma',
    label: 'Plasma',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/plasma.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Plasma"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'ink',
    label: 'Ink',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/ink.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Ink"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'berachain',
    label: 'Berachain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/berachain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Berachain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'optimism',
    label: 'Optimism',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/optimism.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Optimism"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'multiversx',
    label: 'MultiversX',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/multiversx.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="MultiversX"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'soneium',
    label: 'Soneium',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/soneium.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Soneium"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zksync',
    label: 'zkSync',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zksync.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="zkSync"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'mantle',
    label: 'Mantle',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/mantle.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Mantle"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'algorand',
    label: 'Algorand',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/algorand.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Algorand"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'seiv2',
    label: 'Sei V2',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/sei.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Sei V2"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'aptos',
    label: 'Aptos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/aptos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Aptos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'cardano',
    label: 'Cardano',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/cardano.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Cardano"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'fantom',
    label: 'Fantom',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/fantom.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Fantom"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'flare',
    label: 'Flare',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/flare.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Flare"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'starknet',
    label: 'Starknet',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/starknet.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Starknet"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'unichain',
    label: 'Unichain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/unichain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Unichain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'apechain',
    label: 'ApeChain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/apechain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="ApeChain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'harmony',
    label: 'Harmony',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/harmony.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Harmony"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'polkadot',
    label: 'Polkadot',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/polkadot.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Polkadot"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'dogechain',
    label: 'Dogechain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/dogechain.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Dogechain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'blast',
    label: 'Blast',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/blast.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Blast"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'katana',
    label: 'Katana',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/katana.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Katana"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'celo',
    label: 'Celo',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/celo.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Celo"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'story',
    label: 'Story',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/story.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Story"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'flow',
    label: 'Flow EVM',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/flow.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Flow EVM"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'injective',
    label: 'Injective',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/injective.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Injective"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'ethw',
    label: 'EthereumPoW',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/ethw.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="EthereumPoW"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'fogo',
    label: 'Fogo',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/fogo.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Fogo"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'beam',
    label: 'Beam',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/beam.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Beam"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'moonbeam',
    label: 'Moonbeam',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/moonbeam.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Moonbeam"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'vana',
    label: 'Vana',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/vana.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Vana"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'stacks',
    label: 'Stacks',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/stacks.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Stacks"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'scroll',
    label: 'Scroll',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/scroll.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Scroll"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'boba',
    label: 'Boba',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/boba.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Boba"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'iotex',
    label: 'IoTeX',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/iotex.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="IoTeX"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'opbnb',
    label: 'opBNB',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/opbnb.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="opBNB"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'energi',
    label: 'Energi',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/energi.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Energi"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'merlin',
    label: 'Merlin Chain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/merlin.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Merlin Chain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'manta',
    label: 'Manta',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/manta.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Manta"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'kava',
    label: 'Kava',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/kava.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Kava"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/aurora.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Aurora"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'conflux',
    label: 'Conflux',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/conflux.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Conflux"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'etc',
    label: 'Ethereum Classic',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/etc.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Ethereum Classic"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'moonriver',
    label: 'Moonriver',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/moonriver.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Moonriver"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'nova',
    label: 'Arbitrum Nova',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/nova.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Arbitrum Nova"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'astar',
    label: 'Astar',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/astar.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Astar"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'venom',
    label: 'Venom',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/venom.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Venom"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'mode',
    label: 'Mode',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/mode.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Mode"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'neon',
    label: 'Neon EVM',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/neon.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Neon EVM"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'sapphire',
    label: 'Oasis Sapphire',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/sapphire.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Oasis Sapphire"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'elastos',
    label: 'Elastos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/elastos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Elastos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'taiko',
    label: 'Taiko',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/taiko.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Taiko"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'kcc',
    label: 'KCC',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/kcc.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="KCC"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zircuit',
    label: 'Zircuit',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zircuit.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Zircuit"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zora',
    label: 'Zora',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zora.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Zora"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'step',
    label: 'Step Network',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/step.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Step Network"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'fuse',
    label: 'Fuse',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/fuse.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Fuse"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'movement',
    label: 'Movement',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/movement.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Movement"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zkfair',
    label: 'ZKFair',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zkfair.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="ZKFair"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'icp',
    label: 'ICP',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/icp.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="ICP"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'meter',
    label: 'Meter',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/meter.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Meter"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'emerald',
    label: 'Oasis Emerald',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/emerald.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Oasis Emerald"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'telos',
    label: 'Telos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/telos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Telos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'story',
    label: 'Story',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/story.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Story"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'flow',
    label: 'Flow EVM',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/flow.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Flow EVM"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'injective',
    label: 'Injective',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/injective.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Injective"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'ethw',
    label: 'EthereumPoW',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/ethw.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="EthereumPoW"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'fogo',
    label: 'Fogo',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/fogo.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Fogo"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'beam',
    label: 'Beam',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/beam.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Beam"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'moonbeam',
    label: 'Moonbeam',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/moonbeam.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Moonbeam"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'vana',
    label: 'Vana',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/vana.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Vana"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'stacks',
    label: 'Stacks',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/stacks.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Stacks"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'scroll',
    label: 'Scroll',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/scroll.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Scroll"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'boba',
    label: 'Boba',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/boba.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Boba"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'iotex',
    label: 'IoTeX',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/iotex.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="IoTeX"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'opbnb',
    label: 'opBNB',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/opbnb.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="opBNB"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'energi',
    label: 'Energi',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/energi.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Energi"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'merlin',
    label: 'Merlin Chain',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/merlin.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Merlin Chain"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'manta',
    label: 'Manta',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/manta.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Manta"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'kava',
    label: 'Kava',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/kava.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Kava"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/aurora.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Aurora"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'conflux',
    label: 'Conflux',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/conflux.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Conflux"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'etc',
    label: 'Ethereum Classic',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/etc.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Ethereum Classic"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'moonriver',
    label: 'Moonriver',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/moonriver.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Moonriver"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'nova',
    label: 'Arbitrum Nova',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/nova.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Arbitrum Nova"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'astar',
    label: 'Astar',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/astar.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Astar"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'venom',
    label: 'Venom',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/venom.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Venom"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'mode',
    label: 'Mode',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/mode.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Mode"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'neon',
    label: 'Neon EVM',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/neon.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Neon EVM"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'sapphire',
    label: 'Oasis Sapphire',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/sapphire.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Oasis Sapphire"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'elastos',
    label: 'Elastos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/elastos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Elastos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'taiko',
    label: 'Taiko',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/taiko.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Taiko"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'kcc',
    label: 'KCC',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/kcc.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="KCC"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zircuit',
    label: 'Zircuit',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zircuit.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Zircuit"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zora',
    label: 'Zora',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zora.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Zora"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'step',
    label: 'Step Network',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/step.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Step Network"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'fuse',
    label: 'Fuse',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/fuse.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Fuse"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'movement',
    label: 'Movement',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/movement.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Movement"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'zkfair',
    label: 'ZKFair',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/zkfair.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="ZKFair"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'icp',
    label: 'ICP',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/icp.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="ICP"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'meter',
    label: 'Meter',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/meter.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Meter"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'emerald',
    label: 'Oasis Emerald',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/emerald.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Oasis Emerald"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
  {
    id: 'telos',
    label: 'Telos',
    icon: (
      <img
        src="https://dd.dexscreener.com/ds-data/chains/telos.png"
        width="24"
        height="24"
        style={{ borderRadius: '50%' }}
        alt="Telos"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x0000000000000000000000000000000000000000.png';
        }}
      />
    ),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  selectedChain?: string;
  onChainSelect?: (chain: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

type TabId = 'chains' | 'watchlist' | 'alerts' | 'multichart';

interface WatchlistItem {
  symbol: string;
  price: string;
  change24h: number;
  chainId: string;
  pairAddress: string;
}

interface AlertItem {
  id: string;
  symbol: string;
  targetPrice: string;
  condition: 'above' | 'below';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const SidebarSearchBar: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <div
    style={{
      padding: '12px 12px 0 12px',
    }}
  >
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg
        style={{ position: 'absolute', left: '11px', color: '#8b949e', pointerEvents: 'none' }}
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search tokens…"
        readOnly
        onClick={onOpen}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid var(--glass-border)',
          borderRadius: '9px',
          padding: '9px 34px 9px 34px',
          fontSize: '13px',
          color: '#e6edf3',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '10px',
          fontSize: '11px',
          color: '#8b949e',
          border: '1px solid #30363d',
          borderRadius: '4px',
          padding: '1px 5px',
          pointerEvents: 'none',
          background: '#21262d',
          lineHeight: '16px',
        }}
      >
        /
      </div>
    </div>
  </div>
);

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'chains',
    label: 'Chains',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: 'watchlist',
    label: 'Watch',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'multichart',
    label: 'Multi',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

const TabBar: React.FC<{ active: TabId; onChange: (t: TabId) => void }> = ({ active, onChange }) => (
  <div
    style={{
      display: 'flex',
      padding: '8px 8px 0 8px',
      gap: '2px',
    }}
  >
    {TABS.map((tab) => {
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          title={tab.label}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            padding: '7px 4px',
            borderRadius: '8px',
            border: 'none',
            background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
            color: isActive ? 'var(--accent-blue, #3b82f6)' : '#8b949e',
            fontSize: '10px',
            fontWeight: isActive ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
            borderBottom: isActive ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLElement).style.color = '#c9d1d9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8b949e';
            }
          }}
        >
          <span style={{ lineHeight: 1 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      );
    })}
  </div>
);

// ─── Chains Tab ───────────────────────────────────────────────────────────────

const chainsMenuItems = [
  {
    label: 'Watchlist',
    href: '/watchlist',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    href: '/alerts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Multicharts',
    href: '/multicharts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'New Pairs',
    href: '/tokens?filter=new',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    label: 'Gainers & Losers',
    href: '/tokens?filter=gainers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    label: 'API',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: 'Advertise',
    href: '#',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
        <path d="M8 10h8" />
        <path d="M8 14h5" />
      </svg>
    ),
  },
];

const ChainsTab: React.FC<{
  selectedChain?: string;
  onChainSelect?: (chain: string) => void;
}> = ({ selectedChain, onChainSelect }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
    {/* Quick nav menu */}
    <div style={{ padding: '8px 8px 4px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {chainsMenuItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 10px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#8b949e',
            textDecoration: 'none',
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLElement).style.color = '#e6edf3';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#8b949e';
          }}
        >
          <span style={{ opacity: 0.75, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>

    {/* Divider + section label */}
    <div style={{ padding: '6px 12px 4px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Networks
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
    </div>

    {/* Chain filter buttons */}
    <div style={{ padding: '0 8px 8px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {CHAINS.map((c, index) => {
        const isSelected = selectedChain === c.id;
        return (
          <button
            key={`${c.id}-${index}`}
            onClick={() => onChainSelect?.(isSelected ? '' : c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: isSelected ? `${c.color || '#3b82f6'}1a` : 'transparent',
              color: isSelected ? (c.color || '#3b82f6') : '#8b949e',
              fontSize: '13px',
              fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = '#c9d1d9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#8b949e';
              }
            }}
          >
            <span style={{ width: '18px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</span>
            <span style={{ flex: 1 }}>{c.label}</span>
            {isSelected && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: c.color || '#3b82f6',
                flexShrink: 0,
                boxShadow: `0 0 6px ${c.color || '#3b82f6'}`,
              }} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Watchlist Tab ────────────────────────────────────────────────────────────

const WatchlistTab: React.FC = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dex_watchlist');
      if (raw) setItems(JSON.parse(raw) as WatchlistItem[]);
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#484f58',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#8b949e', fontWeight: 600 }}>No tokens yet</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#484f58' }}>Star a token to watch it</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
      {items.map((item) => {
        const isPos = item.change24h >= 0;
        return (
          <Link
            key={`${item.chainId}-${item.pairAddress}`}
            href={`/tokens/${item.chainId}/${item.pairAddress}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 10px',
                borderRadius: '9px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>{item.symbol}</div>
                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '1px' }}>{item.price}</div>
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 7px',
                borderRadius: '5px',
                background: isPos ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: isPos ? 'var(--accent-green, #22c55e)' : '#ef4444',
              }}>
                {isPos ? '+' : ''}{item.change24h.toFixed(2)}%
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

// ─── Alerts Tab ───────────────────────────────────────────────────────────────

const AlertsTab: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dex_alerts');
      if (raw) setAlerts(JSON.parse(raw) as AlertItem[]);
    } catch {
      // ignore
    }
  }, []);

  const saveAlerts = (next: AlertItem[]) => {
    setAlerts(next);
    try { localStorage.setItem('dex_alerts', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addAlert = () => {
    if (!symbol.trim() || !targetPrice.trim()) return;
    const newAlert: AlertItem = {
      id: `${Date.now()}-${Math.random()}`,
      symbol: symbol.trim().toUpperCase(),
      targetPrice: targetPrice.trim(),
      condition,
    };
    saveAlerts([newAlert, ...alerts]);
    setSymbol('');
    setTargetPrice('');
  };

  const deleteAlert = (id: string) => {
    saveAlerts(alerts.filter((a) => a.id !== id));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '7px',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#e6edf3',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px' }}>
      {/* Add alert form */}
      <div style={{
        background: 'rgba(59,130,246,0.06)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
      }}>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue, #3b82f6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          New Alert
        </p>
        <input
          type="text"
          placeholder="Token symbol (e.g. ETH)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="number"
            placeholder="Target price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
            style={{
              ...inputStyle,
              width: 'auto',
              padding: '8px 6px',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.35)',
            }}
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
        </div>
        <button
          onClick={addAlert}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '7px',
            border: 'none',
            background: 'var(--accent-blue, #3b82f6)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Add Alert
        </button>
      </div>

      {/* Existing alerts */}
      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#484f58', fontSize: '12px' }}>
          No alerts set yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 10px',
                borderRadius: '9px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>{alert.symbol}</div>
                <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '1px' }}>
                  <span style={{ color: alert.condition === 'above' ? 'var(--accent-green, #22c55e)' : '#ef4444', fontWeight: 600 }}>
                    {alert.condition === 'above' ? '▲ Above' : '▼ Below'}
                  </span>
                  {' '}{alert.targetPrice}
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                title="Delete alert"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#484f58',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.1s, background 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#ef4444';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#484f58';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Multichart Tab ───────────────────────────────────────────────────────────

const MultichartTab: React.FC = () => (
  <div style={{ padding: '8px' }}>
    <div style={{ marginBottom: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>Multi Chart View</p>
      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8b949e' }}>Monitor up to 4 pairs at once</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {[0, 1, 2, 3].map((i) => (
        <button
          key={i}
          style={{
            aspectRatio: '1',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            color: '#484f58',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.07)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.3)';
            (e.currentTarget as HTMLElement).style.color = 'var(--accent-blue, #3b82f6)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            (e.currentTarget as HTMLElement).style.color = '#484f58';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span style={{ fontSize: '10px', fontWeight: 600 }}>Add Pair</span>
        </button>
      ))}
    </div>
    <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#484f58', textAlign: 'center' }}>
      Click a slot to add a trading pair
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const DexSidebar: React.FC<Props> = ({ selectedChain, onChainSelect, mobileOpen, onMobileClose }) => {
  const router = useRouter();
  const { openSearch } = useGlobalSearch();
  const [activeTab, setActiveTab] = useState<TabId>('chains');

  void router;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on ESC when mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dex-sidebar::-webkit-scrollbar { width: 3px; }
        .dex-sidebar::-webkit-scrollbar-track { background: transparent; }
        .dex-sidebar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        .dex-sidebar::-webkit-scrollbar-thumb:hover { background: #484f58; }
        .dex-sidebar input::placeholder { color: #484f58; }
        .dex-sidebar select option { background: #161b22; color: #e6edf3; }
      `}} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="mobile-sidebar-backdrop mobile-sidebar-backdrop--visible"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`glass dex-sidebar${mobileOpen ? ' dex-sidebar--open' : ''}`}
        style={{
          width: '240px',
          flexShrink: 0,
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100%',
          scrollbarColor: '#30363d transparent',
          scrollbarWidth: 'thin',
          zIndex: 99999,
          boxShadow: 'var(--premium-shadow)',
          margin: '60px 0 0 0',
        }}
      >
        {/* Mobile close button */}
        <button
          className="mobile-only"
          onClick={onMobileClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#8b949e',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#8b949e'; }}
        >
          ✕
        </button>

        {/* Search bar */}
        <SidebarSearchBar onOpen={openSearch} />

        {/* Tab bar */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Thin separator */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0 0 0' }} />

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chains' && (
            <ChainsTab selectedChain={selectedChain} onChainSelect={(c) => { onChainSelect?.(c); onMobileClose?.(); }} />
          )}
          {activeTab === 'watchlist' && <WatchlistTab />}
          {activeTab === 'alerts' && <AlertsTab />}
          {activeTab === 'multichart' && <MultichartTab />}
        </div>
      </aside>
    </>
  );
};
