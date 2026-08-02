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

interface Props {
  selectedChain?: string;
  onChainSelect?: (chain: string) => void;
}

export const DexSidebar: React.FC<Props> = ({
  selectedChain,
  onChainSelect,
}) => {
  const router = useRouter();

  const menuItems = [
    {
      label: 'Watchlist',
      href: '/watchlist',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: 'Multicharts',
      href: '/multicharts',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22v-7l-2-2"></path>
          <path d="M12 15l2-2"></path>
          <path d="M10 13c-2.34-1.45-3.32-3.8-2.68-5.88.5-1.63 2.1-2.91 3.9-3.07 1-.09 1.95.12 2.78.65"></path>
          <path d="M14 13c2.34-1.45 3.32-3.8 2.68-5.88-.5-1.63-2.1-2.91-3.9-3.07-1-.09-1.95.12-2.78.65"></path>
        </svg>
      ),
    },
    {
      label: 'Gainers & Losers',
      href: '/tokens?filter=gainers',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14"></path>
          <path d="M19 12l-7 7-7-7"></path>
          <path d="M5 12l7-7 7 7" strokeDasharray="3 3"></path>
          <path d="M17 11V5h-6"></path>
          <path d="M7 13v6h6"></path>
        </svg>
      ),
    },
    {
      label: 'API',
      href: '#',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Advertise',
      href: '#',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
          <path d="M8 10v4" />
          <path d="M12 10v4" />
          <path d="M16 10v4" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
  ];

  const { openSearch } = useGlobalSearch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open modal on `/` key if no other input is focused
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

  return (
    <>
    <aside
      className="glass"
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
        margin: '60px 0 0 0', // Account for header
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        aside::-webkit-scrollbar { width: 4px; }
        aside::-webkit-scrollbar-track { background: transparent; }
        aside::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        aside::-webkit-scrollbar-thumb:hover { background: #484f58; }
      `,
        }}
      />

      {/* Search Bar & App Button */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderBottom: '1px solid #21262d',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg
            style={{ position: 'absolute', left: '12px', color: '#8b949e' }}
            width="16"
            height="16"
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
            placeholder="Search"
            readOnly
            onClick={openSearch}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '10px 36px 10px 36px',
              fontSize: '14px',
              color: '#e6edf3',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '12px',
              fontSize: '11px',
              color: '#8b949e',
              border: '1px solid #30363d',
              borderRadius: '4px',
              padding: '2px 5px',
              pointerEvents: 'none',
              background: '#21262d',
            }}
          >
            /
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '8px',
        }}
      >
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#8b949e',
              textDecoration: 'none',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#21262d';
              (e.currentTarget as HTMLElement).style.color = '#e6edf3';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8b949e';
            }}
          >
            <div
              style={{
                width: '20px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div
        style={{
          height: '1px',
          background: '#21262d',
          margin: '8px 16px',
        }}
      />

      {/* Chain filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '8px',
        }}
      >
        {CHAINS.map((c, index) => (
          <button
            key={`${c.id}-${index}`}
            onClick={() => onChainSelect?.(selectedChain === c.id ? '' : c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background:
                selectedChain === c.id
                  ? `${c.color || '#3b82f6'}22`
                  : 'transparent',
              color: selectedChain === c.id ? c.color || '#3b82f6' : '#8b949e',
              fontSize: '14px',
              fontWeight: selectedChain === c.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.1s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (selectedChain !== c.id) {
                (e.currentTarget as HTMLElement).style.background = '#21262d';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChain !== c.id) {
                (e.currentTarget as HTMLElement).style.background =
                  'transparent';
              }
            }}
          >
            <div
              style={{
                width: '20px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {c.icon}
            </div>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </aside>
    </>
  );
};
