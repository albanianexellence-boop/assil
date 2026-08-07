import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import NextHead from 'next/head';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DexNav } from '../../../components/DexNav';
import { DexSidebar } from '../../../components/DexSidebar';
import { ContractLayout } from '../../../components/contract';
import {
  useDynamicContext,
  DynamicConnectButton,
} from '@dynamic-labs/sdk-react-core';
import { useIsMobile } from '../../../hooks';

import type { ComponentType } from 'react';

interface LiveChartProps {
  chainId: string;
  pairAddress: string;
  resolution?: string;
}
const LiveChart = dynamic<LiveChartProps>(
  () =>
    import('../../../components/LiveChart').then(
      (m) => m.LiveChart as ComponentType<LiveChartProps>,
    ),
  { ssr: false },
);

// ---- Types ----
interface PairDetail {
  pairAddress: string;
  chainId: string;
  dexId: string;
  baseToken: { symbol: string; name: string; address: string };
  quoteToken: { symbol: string; name: string; address: string };
  liquidity: { usd: number; base?: number; quote?: number };
  priceUsd: string;
  priceNative: string;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: { m5: number; h1: number; h6: number; h24: number };
  // liquidity expanded above
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  url: string;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface Trade {
  type: 'Buy' | 'Sell';
  age: string;
  usd: number;
  tokenAmount: number;
  nativeAmount: number;
  priceUsd: number;
  maker: string;
  txHash: string;
}

// ---- Helpers ----
const fmtUsd = (v: number | string | undefined) => {
  const n = parseFloat(String(v || 0));
  if (!n || isNaN(n)) return '–';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
};

const fmtNum = (n: number, dec = 2) => {
  if (!n || isNaN(n)) return '–';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(dec);
};

const shorten = (s: string) => (s ? `${s.slice(0, 4)}…${s.slice(-4)}` : '–');

const copyText = (text: string) => {
  if (navigator.clipboard) navigator.clipboard.writeText(text);
};

const fmtAge = (ms: number) => {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const fmtNativePrice = (v: string | number, symbol = '') => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!n || isNaN(n)) return '–';
  const s = n.toFixed(10);
  const match = s.match(/^0\.00+/);
  if (match) {
    const zeros = match[0].length - 2;
    const rest = s.split(match[0])[1]?.slice(0, 4) || '';
    const sub =
      ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'][zeros] || `(${zeros})`;
    return (
      <span style={{ fontFamily: 'JetBrains Mono' }}>
        0.0
        <sub
          style={{ fontSize: '10px', verticalAlign: 'sub', color: '#8b949e' }}
        >
          {zeros}
        </sub>
        {rest} {symbol}
      </span>
    );
  }
  return (
    <span style={{ fontFamily: 'JetBrains Mono' }}>
      {n.toFixed(6)} {symbol}
    </span>
  );
};

const StatBar = ({ buys, sells }: { buys: number; sells: number }) => {
  const total = buys + sells;
  const buyPct = total > 0 ? (buys / total) * 100 : 50;
  return (
    <div
      style={{
        height: '5px',
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '999px',
        overflow: 'hidden',
        display: 'flex',
        marginTop: '7px',
      }}
    >
      <div
        style={{
          width: `${buyPct}%`,
          background: 'linear-gradient(90deg, #00d97e, #00a86b)',
          height: '100%',
          borderRadius: '999px 0 0 999px',
          boxShadow: '0 0 6px rgba(0,217,126,0.4)',
          transition: 'width 0.5s ease',
        }}
      />
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(90deg, #f04d4d, #c0392b)',
          height: '100%',
          borderRadius: '0 999px 999px 0',
          boxShadow: '0 0 6px rgba(240,77,77,0.4)',
        }}
      />
    </div>
  );
};

const PctBadge = ({ v, label }: { v: number; label: string }) => {
  const pos = v >= 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#8b949e', marginBottom: '4px' }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: '12px',
          color: pos ? '#00d97e' : '#f04d4d',
          background: pos ? 'rgba(0,217,126,0.12)' : 'rgba(240,77,77,0.12)',
          border: `1px solid ${pos ? 'rgba(0,217,126,0.25)' : 'rgba(240,77,77,0.25)'}`,
          borderRadius: '999px',
          padding: '2px 6px',
          display: 'inline-block',
        }}
      >
        {pos ? '+' : ''}
        {v?.toFixed(2) ?? '–'}%
      </div>
    </div>
  );
};

const CHAIN_COLOR: Record<string, string> = {
  ethereum: '#627eea',
  bsc: '#f0b94d',
  solana: '#9945ff',
  base: '#0052ff',
  arbitrum: '#12aaff',
  polygon: '#8247e5',
  avalanche: '#e84142',
  optimism: '#ff0420',
};

const RESOLUTIONS = [
  { label: '1s', val: '1' },
  { label: '1m', val: '1' },
  { label: '5m', val: '5' },
  { label: '15m', val: '15' },
  { label: '1H', val: '60' },
  { label: '4H', val: '240' },
  { label: 'D', val: 'D' },
];

const CHAIN_EXPLORER: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  bsc: 'https://bscscan.com/tx/',
  solana: 'https://solscan.io/tx/',
  base: 'https://basescan.org/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
};

// ---- Pair Detail Page ----
export default function PairPage() {
  const router = useRouter();
  const { chainId, pairAddress } = router.query as {
    chainId: string;
    pairAddress: string;
  };
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [tradePanelType, setTradePanelType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('0.1');
  const [pendingTradeAction, setPendingTradeAction] = useState<
    'buy' | 'sell' | null
  >(null);
  const [showBubblemaps, setShowBubblemaps] = useState(false);
  const [bubblemapsFullscreen, setBubblemapsFullscreen] = useState(false);

  // Boost / reactions / token profile
  const [tokenProfile, setTokenProfile] = useState<any>(null);
  const [boostAmount, setBoostAmount] = useState(0);
  const [reactions, setReactions] = useState({
    rocket: 0,
    fire: 0,
    poop: 0,
    flag: 0,
  });
  const [myReaction, setMyReaction] = useState<string | null>(null);

  const vote = (emoji: string) => {
    if (myReaction === emoji) {
      setMyReaction(null);
      setReactions((r) => ({
        ...r,
        [emoji]: Math.max(0, r[emoji as keyof typeof r] - 1),
      }));
    } else {
      if (myReaction) {
        setReactions((r) => ({
          ...r,
          [myReaction]: Math.max(0, r[myReaction as keyof typeof r] - 1),
        }));
      }
      setMyReaction(emoji);
      setReactions((r) => ({ ...r, [emoji]: r[emoji as keyof typeof r] + 1 }));
    }
  };

  const [pair, setPair] = useState<PairDetail | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [resolution, setResolution] = useState('15');
  const [txTab, setTxTab] = useState<
    'txns' | 'top' | 'kols' | 'holders' | 'bubble'
  >('txns');
  const prevTradesRef = useRef<string[]>([]);
  const [newTradeHashes, setNewTradeHashes] = useState<Set<string>>(new Set());
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState('');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'5M' | '1H' | '6H' | '24H'>('24H');

  const timeKey = useMemo(() => {
    if (activeTab === '5M') return 'm5';
    if (activeTab === '1H') return 'h1';
    if (activeTab === '6H') return 'h6';
    return 'h24';
  }, [activeTab]);

  const topTraders = useMemo(() => {
    const map: Record<
      string,
      { maker: string; bought: number; sold: number; txns: number }
    > = {};
    trades.forEach((t) => {
      if (!t.maker) return;
      if (!map[t.maker])
        map[t.maker] = { maker: t.maker, bought: 0, sold: 0, txns: 0 };
      const m = map[t.maker];
      m.txns++;
      if (t.type === 'Buy') m.bought += t.usd;
      else m.sold += t.usd;
    });
    return Object.values(map)
      .map((m) => ({
        ...m,
        profit: m.sold - m.bought,
        volume: m.bought + m.sold,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [trades]);

  // ---- Holders State ----
  interface HolderRow {
    rank: number;
    address: string;
    tokenAccount?: string;
    amount: number;
    percentage: number;
    usdValue: number;
  }
  const [holders, setHolders] = useState<HolderRow[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersError, setHoldersError] = useState<string | null>(null);
  const [holdersSolscanUrl, setHoldersSolscanUrl] = useState<string | null>(
    null,
  );

  // Audit state
  const [audit, setAudit] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditExpanded, setAuditExpanded] = useState(true);

  const fetchAudit = useCallback(
    async (tokenAddress: string) => {
      if (!chainId || !tokenAddress) return;
      setAuditLoading(true);
      try {
        const res = await fetch(
          `/api/dex/audit?chainId=${chainId}&tokenAddress=${tokenAddress}`,
        );
        const json = await res.json();
        if (json.success) setAudit(json.data);
      } catch {
        /* silent */
      } finally {
        setAuditLoading(false);
      }
    },
    [chainId],
  );

  const fetchTokenProfile = useCallback(
    async (tokenAddress: string) => {
      if (!chainId || !tokenAddress) return;
      try {
        const res = await fetch(
          `/api/dex/token-profile?chainId=${chainId}&tokenAddress=${tokenAddress}`,
        );
        const json = await res.json();
        if (json.success && json.data) {
          setTokenProfile(json.data.profile || null);
          setBoostAmount(json.data.boostAmount || 0);
        }
      } catch {
        /* silent */
      }
    },
    [chainId],
  );

  const fetchHolders = useCallback(async () => {
    if (!pair || !chainId) return;
    const tokenAddress = pair.baseToken.address;
    if (!tokenAddress) return;
    setHoldersLoading(true);
    setHoldersError(null);
    setHoldersSolscanUrl(null);
    try {
      const priceUsd = pair.priceUsd || '0';
      const res = await fetch(
        `${window.location.origin}/api/dex/holders?chainId=${chainId}&tokenAddress=${tokenAddress}&priceUsd=${priceUsd}`,
      );
      const json = await res.json();
      if (json.success) {
        setHolders(json.data);
      } else {
        setHoldersError(json.error || 'Failed to load holders');
        if (json.solscanUrl) setHoldersSolscanUrl(json.solscanUrl);
      }
    } catch (err: any) {
      setHoldersError(err.message);
    }
    setHoldersLoading(false);
  }, [pair, chainId]);

  // Fetch holders when tab is opened
  useEffect(() => {
    if (txTab === 'holders') fetchHolders();
  }, [txTab, fetchHolders]);

  // Auto-fetch audit + profile when pair loads
  useEffect(() => {
    if (pair?.baseToken?.address) {
      fetchAudit(pair.baseToken.address);
      fetchTokenProfile(pair.baseToken.address);
    }
  }, [pair?.baseToken?.address, fetchAudit, fetchTokenProfile]);

  // When wallet connects and there was a pending buy/sell action, open the panel
  useEffect(() => {
    if (primaryWallet && pendingTradeAction) {
      setTradePanelType(pendingTradeAction);
      setShowTradePanel(true);
      setPendingTradeAction(null);
    }
  }, [primaryWallet, pendingTradeAction]);

  useEffect(() => {
    if (!pairAddress) return;
    const saved = localStorage.getItem('dex_watchlist');
    if (saved) {
      const list = JSON.parse(saved);
      setIsInWatchlist(
        list.some((item: any) => item.pairAddress === pairAddress),
      );
    }
  }, [pairAddress]);

  const toggleWatchlist = () => {
    const saved = localStorage.getItem('dex_watchlist');
    let list = saved ? JSON.parse(saved) : [];

    if (isInWatchlist) {
      list = list.filter((item: any) => item.pairAddress !== pairAddress);
    } else {
      list.push({
        chainId,
        pairAddress,
        symbol: pair?.baseToken?.symbol || 'Unknown',
        priceUsd: pair?.priceUsd,
        priceChange24h: pair?.priceChange?.h24,
      });
    }

    localStorage.setItem('dex_watchlist', JSON.stringify(list));
    setIsInWatchlist(!isInWatchlist);
  };

  const fetchPair = useCallback(async () => {
    if (!chainId || !pairAddress) return;
    try {
      // 1. Fetch directly from DexScreener first to use Client IP and bypass Server Rate Limits (Cloudflare 1015)
      let pairData = null;
      try {
        const dsRes = await fetch(
          `https://api.dexscreener.com/latest/dex/pairs/${chainId}/${pairAddress}?t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (dsRes.ok) {
          const text = await dsRes.text();
          const json = JSON.parse(text);
          pairData = json.pair || json.pairs?.[0] || null;
        }
      } catch (err) {
        console.warn('Direct DexScreener fetch failed:', err);
      }

      // 2. Fallback to our proxy (which does a token-search fallback) if the direct pair route returned null
      if (!pairData) {
        const url = `${window.location.origin}/api/dex/pair?chainId=${chainId}&pairAddress=${pairAddress}&t=${Date.now()}`;
        console.log('Fetching pair data from proxy fallback:', url);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const json = await res.json();

        if (json.success && json.data) {
          pairData = json.data;
        } else if (json.error) {
          console.error('Pair fetch proxy error:', json.error);
          throw new Error(json.error);
        }
      }

      if (pairData) {
        setPair(pairData);
      } else {
        throw new Error('No pair data found on APIs');
      }
    } catch (err: any) {
      console.error('Pair fetch failure:', err.name, err.message);
      // Don't wipe the pair on a transient error so the UI doesn't flash black/white
    } finally {
      setLoading(false);
    }
  }, [chainId, pairAddress]);

  const fetchTrades = useCallback(async () => {
    if (!chainId || !pairAddress) return;
    try {
      const url = `${window.location.origin}/api/dex/pair-trades?chainId=${chainId}&pairAddress=${pairAddress}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        const newTrades = json.data as Trade[];
        // Identify truly "new" trades by txHash
        const prevHashes = prevTradesRef.current;
        const freshHashes = new Set<string>();

        if (prevHashes.length > 0) {
          newTrades.forEach((t) => {
            if (!prevHashes.includes(t.txHash)) {
              freshHashes.add(t.txHash);
            }
          });
        }

        setNewTradeHashes(freshHashes);
        setTrades(newTrades);
        prevTradesRef.current = newTrades.map((t) => t.txHash);
        setTradesError(json.error || null);
      } else {
        setTradesError(json.error || 'Failed to load trades');
      }
    } catch (err: any) {
      console.error('Trades fetch failure:', err.name, err.message);
      setTradesError(err.message);
    }
  }, [chainId, pairAddress]);

  const handleTradeAction = (type: 'buy' | 'sell') => {
    if (!primaryWallet) {
      // Try setShowAuthFlow first, fallback to clicking the DynamicWidget button
      try {
        setShowAuthFlow(true);
      } catch {}
      // Also programmatically click the Dynamic connect button if it exists
      const dynBtn =
        (document.querySelector(
          '[data-testid="dynamic-connect-button"]',
        ) as HTMLElement) ||
        (document.querySelector('.dynamic-connect-button') as HTMLElement) ||
        (document.querySelector(
          '[class*="DynamicWidget"] button',
        ) as HTMLElement);
      if (dynBtn) dynBtn.click();
      setPendingTradeAction(type);
      return;
    }
    setTradePanelType(type);
    setShowTradePanel(true);
  };

  useEffect(() => {
    fetchPair();
    fetchTrades();
  }, [fetchPair, fetchTrades]);
  useEffect(() => {
    const t1 = setInterval(fetchPair, 1000);
    const t2 = setInterval(fetchTrades, 1000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [fetchPair, fetchTrades]);

  const price = parseFloat(pair?.priceUsd || '0');
  const priceNative = parseFloat(pair?.priceNative || '0');
  const change24h = pair?.priceChange?.h24 ?? 0;
  const explorerBase = CHAIN_EXPLORER[chainId] || 'https://etherscan.io/tx/';

  return (
    <>
      <NextHead>
        <title>
          {pair && pair.baseToken
            ? `${pair.baseToken.symbol} $${parseFloat(pair.priceUsd || '0') < 0.0001 ? parseFloat(pair.priceUsd || '0').toPrecision(4) : parseFloat(pair.priceUsd || '0').toFixed(4)} | NexSwap`
            : 'Loading pairs... | NexSwap'}
        </title>
      </NextHead>
      <div
        style={{
          background: `radial-gradient(ellipse at 0% 0%, rgba(79,142,247,0.08) 0%, transparent 55%),
                       radial-gradient(ellipse at 100% 100%, rgba(153,69,255,0.07) 0%, transparent 55%),
                       #0b0e11`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: '100vw',
        }}
      >
        <ContractLayout />

        <DexNav onMobileSidebarToggle={() => setMobileSidebarOpen((p) => !p)} />

        <div
          style={{
            display: 'flex',
            flex: 1,
            paddingTop: '60px',
            height: isMobile ? 'auto' : 'calc(100vh - 60px - 28px)',
            overflow: isMobile ? 'visible' : 'hidden',
            width: '100%',
            minWidth: 0,
          }}
        >
          {/* Sidebar */}
          <DexSidebar
            selectedChain={selectedChain}
            onChainSelect={(c: string) => {
              setSelectedChain(c);
              router.push('/tokens');
            }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Main split: chart+txns LEFT, token info RIGHT */}
          <div className="pair-layout" style={{ flex: 1, display: 'flex', overflow: isMobile ? 'visible' : 'hidden', minWidth: 0, width: '100%' }}>
            {/* ===== LEFT: Chart + Transactions ===== */}
            <div
              className="pair-left-panel"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: isMobile ? 'visible' : 'hidden',
                minWidth: 0,
              }}
            >
              {/* Breadcrumb + Pair Header */}
              <div
                style={{
                  padding: isMobile ? '10px 12px' : '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '8px' : '14px',
                  flexWrap: 'wrap',
                  background: 'rgba(11,14,17,0.85)',
                  backdropFilter: 'blur(16px)',
                  overflow: 'hidden',
                }}
              >
                {/* Back */}
                <Link
                  href="/tokens"
                  style={{
                    color: '#8b949e',
                    textDecoration: 'none',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  ← Pairs
                </Link>
                <span style={{ color: '#21262d', flexShrink: 0 }}>|</span>

                {/* Token identity */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}
                >
                  {pair?.info?.imageUrl && (
                    <img
                      src={pair.info.imageUrl}
                      alt=""
                      style={{
                        width: isMobile ? 28 : 40,
                        height: isMobile ? 28 : 40,
                        borderRadius: '50%',
                        background: '#21262d',
                        border: `2px solid ${CHAIN_COLOR[chainId] || '#21262d'}`,
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: isMobile ? '16px' : '20px',
                      color: '#e6edf3',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pair?.baseToken?.symbol || '…'}
                  </span>
                  <span style={{ color: '#484f58', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    /{pair?.quoteToken?.symbol}
                  </span>
                  {chainId && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: `${CHAIN_COLOR[chainId] || '#21262d'}22`,
                        color: CHAIN_COLOR[chainId] || '#e6edf3',
                        border: `1px solid ${CHAIN_COLOR[chainId] || '#21262d'}44`,
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 7px',
                        borderRadius: '7px',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={`/chains/${chainId}.png`}
                        alt={chainId}
                        style={{ width: '12px', height: '12px', borderRadius: '50%' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {chainId}
                    </div>
                  )}
                  {pair?.dexId && !isMobile && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#1c2128',
                        border: '1px solid #30363d',
                        color: '#a0a5ad',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        textTransform: 'capitalize',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={`https://dd.dexscreener.com/ds-data/dexes/${pair.dexId}.png`}
                        alt={pair.dexId}
                        style={{ width: '14px', height: '14px', borderRadius: '50%' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {pair.dexId}
                    </div>
                  )}
                </div>

                {/* Price */}
                {pair && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: isMobile ? '15px' : '18px',
                        fontWeight: 800,
                        color: change24h >= 0 ? '#00d97e' : '#f04d4d',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtUsd(price)}
                    </span>
                    {!isMobile && (
                      <span style={{ fontSize: '12px', color: '#8b949e', fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>
                        {priceNative.toFixed(8)} {pair.quoteToken?.symbol}
                      </span>
                    )}
                  </div>
                )}

                {/* Watchlist star button */}
                <button
                  onClick={toggleWatchlist}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: isInWatchlist ? '1px solid rgba(0,217,126,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    background: isInWatchlist ? 'rgba(0,217,126,0.1)' : 'rgba(255,255,255,0.04)',
                    color: isInWatchlist ? '#00d97e' : '#8b949e',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>
                    {isInWatchlist ? '⭐' : '☆'}
                  </span>
                  {isInWatchlist ? 'Watching' : 'Watch'}
                </button>

                {/* DEXScreener link */}
                {pair?.url && (
                  <a
                    href={pair.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginLeft: 'auto',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(8px)',
                      color: '#8b949e',
                      fontSize: '11px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    🔗 DEXScreener
                  </a>
                )}
              </div>

              {/* DEXScreener Chart Embed */}
              <div
                style={{
                  borderBottom: '1px solid #21262d',
                  background: '#0b0e11',
                  minHeight: isMobile ? '300px' : '500px',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
                }}
              >
                {chainId && pairAddress ? (
                  <LiveChart chainId={chainId} pairAddress={pairAddress} />
                ) : (
                  <div
                    style={{
                      height: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#484f58',
                    }}
                  >
                    Loading Chart…
                  </div>
                )}
              </div>

              {/* Transactions section */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Tabs */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    padding: '0 12px',
                    gap: '2px',
                    background: 'rgba(9,12,16,0.95)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch' as any,
                    scrollbarWidth: 'none',
                  } as React.CSSProperties}
                >
                  {(
                    [
                      {
                        id: 'txns',
                        label: 'Transactions',
                        icon: (
                          <svg width="13" height="11" viewBox="0 0 14 12" fill="currentColor" style={{ flexShrink: 0 }}>
                            <rect y="0" width="14" height="1.5" rx="0.75" />
                            <rect y="5.25" width="14" height="1.5" rx="0.75" />
                            <rect y="10.5" width="14" height="1.5" rx="0.75" />
                          </svg>
                        ),
                      },
                      {
                        id: 'top',
                        label: 'Top Traders',
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M6.5 1v4.5M6.5 5.5L3 9M6.5 5.5L10 9M3 9v3M10 9v3M6.5 5.5V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ),
                      },
                      {
                        id: 'kols',
                        label: 'KOLs',
                        icon: (
                          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
                            <rect x="3.5" y="0.5" width="5" height="7" rx="2.5" fill="currentColor" />
                            <path d="M1 8.5a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="6" y1="13.5" x2="6" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="3.5" y1="13.5" x2="8.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        ),
                      },
                      {
                        id: 'holders',
                        label: `Holders${holders.length > 0 ? ' (' + holders.length.toLocaleString() + ')' : ''}`,
                        icon: (
                          <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" style={{ flexShrink: 0 }}>
                            <path d="M5.5 0.5L11 4.5L8.8 12H2.2L0 4.5Z" />
                          </svg>
                        ),
                      },
                      {
                        id: 'bubble',
                        label: 'Bubblemaps',
                        icon: (
                          <svg width="16" height="9" viewBox="0 0 16 9" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M0.5 6.5C1.5 6.5 2 3 3.5 3C5 3 5.5 6.5 7 6.5C8.5 6.5 9 3 10.5 3C12 3 12.5 6.5 14 6.5C14.8 6.5 15.3 4.5 15.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ),
                      },
                    ] as { id: string; label: string; icon: React.ReactNode }[]
                  ).map((t) => {
                    const isActive = txTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (t.id === 'bubble') { setShowBubblemaps(true); return; }
                          setTxTab(t.id as any);
                        }}
                        style={{
                          padding: '11px 13px',
                          border: 'none',
                          background: 'transparent',
                          color: isActive ? '#ffffff' : '#484f58',
                          borderBottom: isActive ? '2px solid #4f8ef7' : '2px solid transparent',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.2s',
                          position: 'relative',
                        }}
                        onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = '#8b949e'; }}
                        onMouseOut={(e) => { if (!isActive) e.currentTarget.style.color = '#484f58'; }}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* API Notice / Warning */}
                {tradesError && (
                  <div
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(210,153,34,0.08)',
                      borderBottom: '1px solid rgba(210,153,34,0.18)',
                      fontSize: '11px',
                      color: '#d29922',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(210,153,34,0.15)',
                        border: '1px solid rgba(210,153,34,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        flexShrink: 0,
                      }}
                    >
                      ⚠
                    </span>
                    <span style={{ color: '#8b949e' }}>
                      {tradesError.includes('429')
                        ? 'Rate limit hit — data may be delayed.'
                        : tradesError}
                    </span>
                    <button
                      onClick={() => fetchTrades()}
                      style={{
                        marginLeft: 'auto',
                        background: 'rgba(79,142,247,0.1)',
                        border: '1px solid rgba(79,142,247,0.25)',
                        borderRadius: '6px',
                        color: '#4f8ef7',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(79,142,247,0.2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(79,142,247,0.1)'; }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Tab Content Panes */}
                <div
                  className="custom-scrollbar"
                  style={{
                    height: isMobile ? '360px' : '400px',
                    overflowY: 'auto',
                    position: 'relative',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(9,12,16,0.8)',
                  }}
                >
                  {txTab === 'txns' && (
                    trades.length === 0 ? (
                      <div style={{ padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {loading ? '⌛' : '📭'}
                        </div>
                        <div style={{ color: '#484f58', fontSize: '13px', fontWeight: 500 }}>
                          {loading ? 'Loading transactions…' : 'No recent transactions found for this pair.'}
                        </div>
                      </div>
                    ) : isMobile ? (
                      /* ===== MOBILE: compact 2-line rows ===== */
                      <div>
                        {trades.map((t, i) => {
                          const isBuy = t.type === 'Buy';
                          const isNew = newTradeHashes.has(t.txHash);
                          return (
                            <div
                              key={t.txHash || i}
                              className={`slide-in ${isNew ? (isBuy ? 'flash-buy' : 'flash-sell') : ''}`}
                              style={{
                                borderLeft: `3px solid ${isBuy ? '#00d97e' : '#f04d4d'}`,
                                padding: '10px 14px',
                                borderBottom: '1px solid rgba(255,255,255,0.035)',
                                background: isBuy ? 'rgba(0,217,126,0.025)' : 'rgba(240,77,77,0.025)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}
                            >
                              {/* Type badge */}
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  fontSize: '10px',
                                  fontWeight: 900,
                                  letterSpacing: '0.05em',
                                  color: isBuy ? '#00d97e' : '#f04d4d',
                                  background: isBuy ? 'rgba(0,217,126,0.1)' : 'rgba(240,77,77,0.1)',
                                  border: `1px solid ${isBuy ? 'rgba(0,217,126,0.2)' : 'rgba(240,77,77,0.2)'}`,
                                  borderRadius: '5px',
                                  padding: '4px 0',
                                  flexShrink: 0,
                                }}
                              >
                                {t.type.toUpperCase()}
                              </span>

                              {/* Main info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: isBuy ? '#00d97e' : '#f04d4d' }}>
                                    {fmtNum(t.tokenAmount, 0)} <span style={{ fontSize: '10px', color: '#484f58', fontWeight: 600 }}>{pair?.baseToken?.symbol}</span>
                                  </span>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: '#e6edf3' }}>
                                    {fmtUsd(t.usd)}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: '#484f58', fontSize: '11px' }}>{t.age}</span>
                                  <a
                                    href={explorerBase + t.txHash}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: '#4f8ef7', textDecoration: 'none', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
                                  >
                                    {shorten(t.txHash)} ↗
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ===== DESKTOP: 8-column grid ===== */
                      <div className="scroll-x">
                      <div style={{ minWidth: '680px' }}>
                        {/* Table header */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(60px,0.8fr) minmax(50px,0.6fr) minmax(100px,1.2fr) minmax(100px,1fr) minmax(100px,1fr) minmax(100px,1.2fr) minmax(90px,1.2fr) minmax(80px,0.8fr)',
                            padding: '9px 16px',
                            fontSize: '10px',
                            color: '#484f58',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(9,12,16,0.97)',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            backdropFilter: 'blur(12px)',
                          }}
                        >
                          <span>Date</span>
                          <span>Type</span>
                          <span style={{ textAlign: 'right' }}>USD</span>
                          <span style={{ textAlign: 'right' }}>{pair?.baseToken?.symbol || 'Token'}</span>
                          <span style={{ textAlign: 'right' }}>{pair?.quoteToken?.symbol || 'Native'}</span>
                          <span style={{ textAlign: 'right' }}>Price</span>
                          <span style={{ textAlign: 'right' }}>Maker</span>
                          <span style={{ textAlign: 'right' }}>Txn</span>
                        </div>
                        {trades.map((t, i) => {
                          const isBuy = t.type === 'Buy';
                          const isNew = newTradeHashes.has(t.txHash);
                          return (
                            <div
                              key={t.txHash || i}
                              className={`slide-in ${isNew ? (isBuy ? 'flash-buy' : 'flash-sell') : ''}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(60px,0.8fr) minmax(50px,0.6fr) minmax(100px,1.2fr) minmax(100px,1fr) minmax(100px,1fr) minmax(100px,1.2fr) minmax(90px,1.2fr) minmax(80px,0.8fr)',
                                padding: '9px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.035)',
                                borderLeft: `3px solid ${isBuy ? '#00d97e' : '#f04d4d'}`,
                                fontSize: '12px',
                                background: isBuy ? 'rgba(0,217,126,0.025)' : 'rgba(240,77,77,0.025)',
                                alignItems: 'center',
                                transition: 'background 0.2s',
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = isBuy ? 'rgba(0,217,126,0.05)' : 'rgba(240,77,77,0.05)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = isBuy ? 'rgba(0,217,126,0.025)' : 'rgba(240,77,77,0.025)'; }}
                            >
                              <span style={{ color: '#484f58', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>{t.age}</span>
                              <span>
                                <span className={isBuy ? 'glow-buy' : 'glow-sell'} style={{ fontWeight: 800, color: isBuy ? '#00d97e' : '#f04d4d', fontSize: '10px', letterSpacing: '0.06em', background: isBuy ? 'rgba(0,217,126,0.1)' : 'rgba(240,77,77,0.1)', border: `1px solid ${isBuy ? 'rgba(0,217,126,0.2)' : 'rgba(240,77,77,0.2)'}`, borderRadius: '4px', padding: '2px 6px' }}>
                                  {t.type.toUpperCase()}
                                </span>
                              </span>
                              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#e6edf3', fontWeight: 600, fontSize: '12px' }}>{fmtUsd(t.usd)}</span>
                              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: isBuy ? '#00d97e' : '#f04d4d', fontSize: '12px' }}>{fmtNum(t.tokenAmount, 0)}</span>
                              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#6e7681', fontSize: '12px' }}>{fmtNum(t.nativeAmount, 4)}</span>
                              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#e6edf3', fontSize: '12px' }}>{fmtUsd(t.priceUsd)}</span>
                              <span style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#4f8ef7', fontSize: '11px' }}>{shorten(t.maker)}</span>
                              <span style={{ textAlign: 'right' }}>
                                <a href={explorerBase + t.txHash} target="_blank" rel="noreferrer" style={{ color: '#4f8ef7', textDecoration: 'none', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }} onMouseOver={(e: any) => { e.currentTarget.style.color = '#79b8ff'; }} onMouseOut={(e: any) => { e.currentTarget.style.color = '#4f8ef7'; }}>
                                  {shorten(t.txHash)} ↗
                                </a>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    )
                  )}

                  {txTab === 'top' && (
                    <div style={{ padding: '16px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 100px 100px 60px',
                          padding: '12px 0',
                          borderBottom: '1px solid #21262d',
                          fontSize: '10px',
                          color: '#8b949e',
                          fontWeight: 600,
                        }}
                      >
                        <span>#</span>
                        <span>MAKER</span>
                        <span style={{ textAlign: 'right' }}>BOUGHT</span>
                        <span style={{ textAlign: 'right' }}>SOLD</span>
                        <span style={{ textAlign: 'right' }}>TXNS</span>
                      </div>
                      {topTraders.length > 0 ? (
                        topTraders.map((t, i) => (
                          <div
                            key={t.maker}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '40px 1fr 100px 100px 60px',
                              padding: '12px 0',
                              borderBottom: '1px solid rgba(255,255,255,0.02)',
                              alignItems: 'center',
                              fontSize: '12px',
                            }}
                          >
                            <span
                              style={{
                                color: i < 3 ? '#e3b341' : '#8b949e',
                                fontWeight: i < 3 ? 800 : 400,
                              }}
                            >
                              {i === 0
                                ? '🥇'
                                : i === 1
                                  ? '🥈'
                                  : i === 2
                                    ? '🥉'
                                    : i + 1}
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <span
                                style={{
                                  color: '#58a6ff',
                                  fontFamily: 'JetBrains Mono',
                                }}
                              >
                                {shorten(t.maker)}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: t.profit >= 0 ? '#00d97e' : '#f04d4d',
                                }}
                              >
                                {t.profit >= 0 ? '+' : ''}
                                {fmtUsd(Math.abs(t.profit))}
                              </span>
                            </div>
                            <span style={{ textAlign: 'right', color: '#fff' }}>
                              {fmtUsd(t.bought)}
                            </span>
                            <span style={{ textAlign: 'right', color: '#fff' }}>
                              {fmtUsd(t.sold)}
                            </span>
                            <span
                              style={{ textAlign: 'right', color: '#8b949e' }}
                            >
                              {t.txns}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: '#484f58',
                          }}
                        >
                          No trader data in current slice
                        </div>
                      )}
                    </div>
                  )}

                  {txTab === 'holders' && (
                    <div
                      style={{
                        padding: '0',
                        height: '100%',
                        overflowY: 'auto',
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '48px 1fr 80px 1fr 80px 36px 36px',
                          padding: '10px 16px',
                          borderBottom: '1px solid #21262d',
                          fontSize: '10px',
                          color: '#8b949e',
                          fontWeight: 700,
                          position: 'sticky',
                          top: 0,
                          background: '#0b0e11',
                          zIndex: 2,
                        }}
                      >
                        <span>RANK</span>
                        <span>ADDRESS</span>
                        <span style={{ textAlign: 'right' }}>%</span>
                        <span
                          style={{ textAlign: 'center', paddingLeft: '8px' }}
                        >
                          AMOUNT
                        </span>
                        <span style={{ textAlign: 'right' }}>VALUE</span>
                        <span style={{ textAlign: 'center' }}>TXNS</span>
                        <span style={{ textAlign: 'center' }}>EXP</span>
                      </div>

                      {/* Loading / Error / Empty states */}
                      {holdersLoading && (
                        <div
                          style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: '#8b949e',
                            fontSize: '13px',
                          }}
                        >
                          Loading holders…
                        </div>
                      )}
                      {!holdersLoading && holdersError && (
                        <div
                          style={{ padding: '40px 24px', textAlign: 'center' }}
                        >
                          <div
                            style={{ fontSize: '32px', marginBottom: '12px' }}
                          >
                            💎
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: '#8b949e',
                              marginBottom: '16px',
                              maxWidth: '280px',
                              margin: '0 auto 16px',
                            }}
                          >
                            {holdersSolscanUrl
                              ? 'Holder data not available via public RPC for this token.'
                              : holdersError}
                          </div>
                          {holdersSolscanUrl && (
                            <a
                              href={holdersSolscanUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px',
                                background: '#1c2128',
                                border: '1px solid #21262d',
                                borderRadius: '8px',
                                color: '#58a6ff',
                                fontSize: '13px',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              View Holders on Solscan ↗
                            </a>
                          )}
                        </div>
                      )}
                      {!holdersLoading &&
                        !holdersError &&
                        holders.length === 0 && (
                          <div
                            style={{
                              padding: '40px',
                              textAlign: 'center',
                              color: '#484f58',
                              fontSize: '13px',
                            }}
                          >
                            No holder data available
                          </div>
                        )}

                      {/* Rows */}
                      {!holdersLoading &&
                        holders.map((h) => {
                          const maxAmt = holders[0]?.amount || 1;
                          const barPct = Math.min(
                            (h.amount / maxAmt) * 100,
                            100,
                          );
                          const explorerBase =
                            chainId === 'solana'
                              ? `https://solscan.io/account/${h.address}`
                              : `https://etherscan.io/address/${h.address}`;
                          return (
                            <div
                              key={h.rank}
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  '48px 1fr 80px 1fr 80px 36px 36px',
                                padding: '10px 16px',
                                borderBottom:
                                  '1px solid rgba(255,255,255,0.03)',
                                alignItems: 'center',
                                fontSize: '12px',
                              }}
                            >
                              {/* Rank */}
                              <span
                                style={{
                                  color: h.rank <= 3 ? '#e3b341' : '#8b949e',
                                  fontWeight: h.rank <= 3 ? 800 : 400,
                                }}
                              >
                                #{h.rank}
                              </span>

                              {/* Address */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <button
                                  onClick={() => copyText(h.address)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#8b949e',
                                    padding: 0,
                                    fontSize: '11px',
                                  }}
                                  title="Copy address"
                                >
                                  ⧉
                                </button>
                                <span
                                  style={{
                                    color: '#58a6ff',
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '11px',
                                  }}
                                >
                                  {shorten(h.address)}
                                </span>
                              </div>

                              {/* % */}
                              <span
                                style={{
                                  textAlign: 'right',
                                  color: '#e6edf3',
                                  fontWeight: 600,
                                }}
                              >
                                {h.percentage.toFixed(2)}%
                              </span>

                              {/* Amount bar */}
                              <div
                                style={{
                                  paddingLeft: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                }}
                              >
                                <span
                                  style={{ fontSize: '10px', color: '#e6edf3' }}
                                >
                                  {fmtNum(h.amount, 1)}
                                </span>
                                <div
                                  style={{
                                    height: '3px',
                                    background: '#21262d',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${barPct}%`,
                                      height: '100%',
                                      background: '#58a6ff',
                                      borderRadius: '2px',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Value */}
                              <span
                                style={{ textAlign: 'right', color: '#e6edf3' }}
                              >
                                {h.usdValue > 0 ? fmtUsd(h.usdValue) : '—'}
                              </span>

                              {/* TXNS filter */}
                              <a
                                href={
                                  chainId === 'solana'
                                    ? `https://solscan.io/account/${h.address}#transfers`
                                    : `https://etherscan.io/address/${h.address}#tokentxns`
                                }
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  color: '#8b949e',
                                  fontSize: '13px',
                                  textDecoration: 'none',
                                }}
                                title="View transactions"
                              >
                                ⊟
                              </a>

                              {/* Explorer */}
                              <a
                                href={explorerBase}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  color: '#8b949e',
                                  fontSize: '11px',
                                  textDecoration: 'none',
                                }}
                                title="Open in explorer"
                              >
                                ↗
                              </a>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {txTab === 'bubble' &&
                    (() => {
                      // Map chainId to Bubblemaps chain slug
                      const bmChain: Record<string, string> = {
                        solana: 'sol',
                        ethereum: 'eth',
                        eth: 'eth',
                        bsc: 'bsc',
                        polygon: 'matic',
                        arbitrum: 'arbi',
                        avalanche: 'avax',
                        base: 'base',
                        optimism: 'ftm',
                      };
                      const chain =
                        bmChain[String(chainId).toLowerCase()] || 'eth';
                      const tokenAddr = pair?.baseToken?.address || '';
                      const bmUrl = `https://app.bubblemaps.io/${chain}/token/${tokenAddr}`;
                      const tokenName =
                        pair?.baseToken?.name ||
                        pair?.baseToken?.symbol ||
                        'Token';

                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            gap: '16px',
                            minHeight: '280px',
                          }}
                        >
                          {/* Animated preview */}
                          <div
                            onClick={() => setShowBubblemaps(true)}
                            style={{
                              cursor: 'pointer',
                              width: '100%',
                              maxWidth: '300px',
                              aspectRatio: '1/1',
                              background:
                                'radial-gradient(circle at 40% 40%, rgba(79,142,247,0.15) 0%, rgba(0,217,126,0.05) 50%, transparent 70%)',
                              borderRadius: '50%',
                              border: '1px solid rgba(79,142,247,0.2)',
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'transform 0.2s, border-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.transform =
                                'scale(1.03)';
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = 'rgba(79,142,247,0.5)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.transform =
                                'scale(1)';
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = 'rgba(79,142,247,0.2)';
                            }}
                          >
                            {/* Decorative bubbles */}
                            {[
                              {
                                w: 80,
                                h: 80,
                                l: '35%',
                                t: '30%',
                                bg: 'rgba(30,50,90,0.9)',
                                border: 'rgba(79,142,247,0.4)',
                              },
                              {
                                w: 55,
                                h: 55,
                                l: '15%',
                                t: '20%',
                                bg: 'rgba(25,40,70,0.8)',
                                border: 'rgba(79,142,247,0.3)',
                              },
                              {
                                w: 40,
                                h: 40,
                                l: '60%',
                                t: '15%',
                                bg: 'rgba(25,40,70,0.8)',
                                border: 'rgba(79,142,247,0.25)',
                              },
                              {
                                w: 30,
                                h: 30,
                                l: '20%',
                                t: '58%',
                                bg: 'rgba(25,40,70,0.7)',
                                border: 'rgba(79,142,247,0.2)',
                              },
                              {
                                w: 45,
                                h: 45,
                                l: '58%',
                                t: '55%',
                                bg: 'rgba(25,40,70,0.75)',
                                border: 'rgba(79,142,247,0.25)',
                              },
                              {
                                w: 22,
                                h: 22,
                                l: '75%',
                                t: '35%',
                                bg: '#c0392b',
                                border: 'rgba(192,57,43,0.5)',
                              },
                              {
                                w: 28,
                                h: 28,
                                l: '44%',
                                t: '64%',
                                bg: '#e67e22',
                                border: 'rgba(230,126,34,0.5)',
                              },
                              {
                                w: 20,
                                h: 20,
                                l: '30%',
                                t: '74%',
                                bg: '#2ecc71',
                                border: 'rgba(46,204,113,0.5)',
                              },
                              {
                                w: 18,
                                h: 18,
                                l: '68%',
                                t: '72%',
                                bg: '#9b59b6',
                                border: 'rgba(155,89,182,0.5)',
                              },
                            ].map((b, i) => (
                              <div
                                key={i}
                                style={{
                                  position: 'absolute',
                                  width: b.w,
                                  height: b.h,
                                  borderRadius: '50%',
                                  background: b.bg,
                                  border: `1.5px solid ${b.border}`,
                                  left: b.l,
                                  top: b.t,
                                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 -2px 6px rgba(0,0,0,0.5)`,
                                }}
                              />
                            ))}
                            {/* Lines connecting bubbles */}
                            <svg
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                opacity: 0.3,
                              }}
                            >
                              <line
                                x1="40%"
                                y1="40%"
                                x2="20%"
                                y2="30%"
                                stroke="#4f8ef7"
                                strokeWidth="0.5"
                              />
                              <line
                                x1="40%"
                                y1="40%"
                                x2="60%"
                                y2="35%"
                                stroke="#4f8ef7"
                                strokeWidth="0.5"
                              />
                              <line
                                x1="40%"
                                y1="40%"
                                x2="58%"
                                y2="62%"
                                stroke="#4f8ef7"
                                strokeWidth="0.5"
                              />
                              <line
                                x1="40%"
                                y1="40%"
                                x2="25%"
                                y2="65%"
                                stroke="#4f8ef7"
                                strokeWidth="0.5"
                              />
                            </svg>
                            {/* Center play/open button */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 5,
                              }}
                            >
                              <div
                                style={{
                                  background: 'rgba(0,0,0,0.6)',
                                  backdropFilter: 'blur(4px)',
                                  borderRadius: '50%',
                                  width: '48px',
                                  height: '48px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid rgba(79,142,247,0.5)',
                                  fontSize: '20px',
                                }}
                              >
                                🔍
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#e6edf3',
                                marginBottom: '4px',
                              }}
                            >
                              {tokenName} Bubblemaps
                            </div>
                            <p
                              style={{
                                fontSize: '11px',
                                color: '#8b949e',
                                margin: 0,
                              }}
                            >
                              Top holders &amp; wallet cluster analysis
                            </p>
                          </div>

                          <button
                            onClick={() => setShowBubblemaps(true)}
                            style={{
                              padding: '10px 24px',
                              background:
                                'linear-gradient(135deg, #1c2a4a, #12183a)',
                              border: '1px solid rgba(79,142,247,0.4)',
                              borderRadius: '8px',
                              color: '#4f8ef7',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span>📊</span> Open Bubblemaps
                          </button>

                          <div
                            style={{
                              fontSize: '10px',
                              color: '#484f58',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>🫧</span> Powered
                            by Bubblemaps
                          </div>
                        </div>
                      );
                    })()}

                  {txTab === 'kols' && (
                    <div
                      style={{
                        padding: '60px 24px',
                        color: '#8b949e',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                        🎙️
                      </div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#e6edf3',
                          marginBottom: '8px',
                        }}
                      >
                        KOL Analysis
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          maxWidth: '300px',
                          margin: '0 auto',
                          lineHeight: 1.6,
                        }}
                      >
                        Monitoring influencer activity and social mentions for
                        this token.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== RIGHT: Token Info Panel ===== */}
            <div
              className="custom-scrollbar pair-right-panel"
              style={{
                width: isMobile ? '100%' : '320px',
                flexShrink: 0,
                borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.07)',
                borderTop: isMobile ? '1px solid rgba(255,255,255,0.07)' : 'none',
                background: 'rgba(11,14,17,0.6)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                overflowX: 'hidden',
                minWidth: 0,
              }}
            >
              {pair ? (
                <>
                  {/* Token image */}
                  {pair.info?.imageUrl && (
                    <div style={{ padding: '12px 14px 0' }}>
                      <img
                        src={pair.info.imageUrl}
                        alt=""
                        style={{
                          width: '100%',
                          borderRadius: '16px',
                          maxHeight: '140px',
                          objectFit: 'cover',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Name + Links */}
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, rgba(79,142,247,0.2), transparent)',
                        marginBottom: '10px',
                      }}
                    />
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '16px',
                        color: '#e6edf3',
                        marginBottom: '6px',
                      }}
                    >
                      {pair.baseToken?.name}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#8b949e',
                          marginLeft: '6px',
                        }}
                      >
                        ${pair.baseToken?.symbol}
                      </span>
                    </div>
                    <div
                      style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}
                    >
                      {pair.info?.websites?.map((w, i) => (
                        <a
                          key={i}
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'rgba(79,142,247,0.12)',
                            color: '#4f8ef7',
                            border: '1px solid rgba(79,142,247,0.25)',
                            fontSize: '11px',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          🌐 Website
                        </a>
                      ))}
                      {pair.info?.socials?.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: s.type === 'twitter'
                              ? 'rgba(0,0,0,0.4)'
                              : s.type === 'telegram'
                                ? 'rgba(40,120,230,0.12)'
                                : 'rgba(255,255,255,0.06)',
                            color: s.type === 'twitter'
                              ? '#e6edf3'
                              : s.type === 'telegram'
                                ? '#4f8ef7'
                                : '#8b949e',
                            border: s.type === 'twitter'
                              ? '1px solid rgba(255,255,255,0.15)'
                              : s.type === 'telegram'
                                ? '1px solid rgba(79,142,247,0.3)'
                                : '1px solid rgba(255,255,255,0.08)',
                            fontSize: '11px',
                            textDecoration: 'none',
                            textTransform: 'capitalize',
                            fontWeight: 600,
                          }}
                        >
                          {s.type === 'twitter'
                            ? '𝕏'
                            : s.type === 'telegram'
                              ? '✈️'
                              : '🔗'}{' '}
                          {s.type}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Timeframe Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(11,14,17,0.5)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {(['5M', '1H', '6H', '24H'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          background: activeTab === t
                            ? 'rgba(79,142,247,0.15)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${activeTab === t ? 'rgba(79,142,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '9px',
                          color: activeTab === t ? '#4f8ef7' : '#8b949e',
                          fontSize: isMobile ? '13px' : '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: 0,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Price Blocks */}
                  <div
                    style={{
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
                      gap: '8px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(0,217,126,0.04)',
                        borderRadius: '10px',
                        padding: '0',
                        border: '1px solid rgba(0,217,126,0.15)',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ height: '3px', background: 'linear-gradient(90deg, #00d97e, rgba(0,217,126,0.3))', borderRadius: '10px 10px 0 0' }} />
                      <div style={{ padding: '8px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#8b949e',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Price USD
                        </div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: '#00d97e',
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                        >
                          {fmtUsd(price)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(79,142,247,0.04)',
                        borderRadius: '10px',
                        padding: '0',
                        border: '1px solid rgba(79,142,247,0.15)',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ height: '3px', background: 'linear-gradient(90deg, #4f8ef7, rgba(79,142,247,0.3))', borderRadius: '10px 10px 0 0' }} />
                      <div style={{ padding: '8px' }}>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#8b949e',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Price Native
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#e6edf3',
                          }}
                        >
                          {fmtNativePrice(
                            pair.priceNative,
                            pair.quoteToken?.symbol,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics 3-Col Grid */}
                  <div
                    style={{
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {[
                      {
                        label: 'Liquidity',
                        value: fmtUsd(pair.liquidity?.usd),
                        color: '#4f8ef7',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                          </svg>
                        ),
                      },
                      {
                        label: 'FDV',
                        value: fmtUsd(pair.fdv),
                        color: '#a371f7',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        ),
                      },
                      {
                        label: 'MCap',
                        value: fmtUsd(pair.marketCap),
                        color: '#00d97e',
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        ),
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          textAlign: 'center',
                          background: `${m.color}08`,
                          borderRadius: '10px',
                          padding: '10px 6px 8px',
                          border: `1px solid ${m.color}20`,
                          borderTop: `2px solid ${m.color}60`,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: m.color,
                            marginBottom: '5px',
                            opacity: 0.8,
                          }}
                        >
                          {m.icon}
                        </div>
                        <div
                          style={{
                            fontSize: '9px',
                            color: '#484f58',
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            fontWeight: 700,
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 900,
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, monospace',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Grid */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '6px',
                        textAlign: 'center',
                      }}
                    >
                      {[
                        { label: '5M', v: pair.priceChange?.m5 },
                        { label: '1H', v: pair.priceChange?.h1 },
                        { label: '6H', v: pair.priceChange?.h6 },
                        { label: '24H', v: pair.priceChange?.h24 },
                      ].map((item) => {
                        const pos = (item.v || 0) >= 0;
                        return (
                          <div
                            key={item.label}
                            style={{
                              background: pos ? 'rgba(0,217,126,0.06)' : 'rgba(240,77,77,0.06)',
                              border: `1px solid ${pos ? 'rgba(0,217,126,0.18)' : 'rgba(240,77,77,0.18)'}`,
                              borderRadius: '8px',
                              padding: '7px 4px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                color: '#484f58',
                                marginBottom: '5px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: pos ? '#00d97e' : '#f04d4d',
                                fontFamily: 'JetBrains Mono, monospace',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {pos ? '+' : ''}{item.v?.toFixed(2) ?? '–'}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats with Bars */}
                  <div style={{ padding: '12px 14px' }}>
                    {(() => {
                      const stats = (pair.txns as any)?.[timeKey] || { buys: 0, sells: 0 };
                      const vol = (pair.volume as any)?.[timeKey] || 0;
                      const buys = stats.buys || 0;
                      const sells = stats.sells || 0;
                      const totalTx = buys + sells;
                      const bRatio = totalTx > 0 ? buys / totalTx : 0.5;
                      const sRatio = totalTx > 0 ? sells / totalTx : 0.5;

                      const StatRow = ({
                        label, total, leftLabel, leftVal, rightLabel, rightVal, buysV, sellsV, isLast
                      }: {
                        label: string; total: string; leftLabel: string; leftVal: string;
                        rightLabel: string; rightVal: string; buysV: number; sellsV: number; isLast?: boolean;
                      }) => (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            marginBottom: isLast ? 0 : '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'nowrap' }}>
                            <div style={{ flexShrink: 0 }}>
                              <div style={{ fontSize: '9px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                                {label}
                              </div>
                              <div style={{ fontSize: '17px', fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                {total}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', textAlign: 'right', flexShrink: 0 }}>
                              <div>
                                <div style={{ fontSize: '9px', color: '#00d97e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', whiteSpace: 'nowrap' }}>{leftLabel}</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#00d97e', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{leftVal}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '9px', color: '#f04d4d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', whiteSpace: 'nowrap' }}>{rightLabel}</div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f04d4d', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{rightVal}</div>
                              </div>
                            </div>
                          </div>
                          <StatBar buys={buysV} sells={sellsV} />
                        </div>
                      );

                      return (
                        <>
                          <StatRow label="TXNS" total={fmtNum(totalTx, 0)} leftLabel="BUYS" leftVal={fmtNum(buys, 0)} rightLabel="SELLS" rightVal={fmtNum(sells, 0)} buysV={buys} sellsV={sells} />
                          <StatRow label="VOLUME" total={fmtUsd(vol)} leftLabel="BUY VOL" leftVal={fmtUsd(vol * bRatio)} rightLabel="SELL VOL" rightVal={fmtUsd(vol * sRatio)} buysV={bRatio * 100} sellsV={sRatio * 100} />
                          <StatRow label="MAKERS" total={fmtNum(totalTx * 0.4, 0)} leftLabel="BUYERS" leftVal={fmtNum(totalTx * 0.4 * bRatio, 0)} rightLabel="SELLERS" rightVal={fmtNum(totalTx * 0.4 * sRatio, 0)} buysV={bRatio * 100} sellsV={sRatio * 100} isLast />
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '9px',
                      background: 'rgba(9,12,16,0.8)',
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {showTradePanel ? (
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '14px',
                          padding: '16px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: tradePanelType === 'buy' ? '#00d97e' : '#f04d4d', letterSpacing: '-0.2px' }}>
                            {tradePanelType === 'buy' ? '↑ Buy' : '↓ Sell'} {pair?.baseToken.symbol}
                          </span>
                          <button
                            onClick={() => setShowTradePanel(false)}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#8b949e',
                              cursor: 'pointer',
                              fontSize: '14px',
                              width: 28, height: 28,
                              borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b949e'; }}
                          >
                            ×
                          </button>
                        </div>

                        <div
                          style={{
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '10px',
                            padding: '12px',
                            marginBottom: '12px',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#484f58', marginBottom: '6px', fontWeight: 600 }}>
                            <span>AMOUNT</span>
                            <span>BALANCE: 0.00</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              value={tradeAmount}
                              onChange={(e) => setTradeAmount(e.target.value)}
                              style={{
                                background: 'none', border: 'none', color: '#fff',
                                fontSize: '22px', fontWeight: 800, width: '100%',
                                outline: 'none', fontFamily: 'JetBrains Mono, monospace',
                                letterSpacing: '-0.03em',
                              }}
                            />
                            <span style={{ color: '#484f58', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                              {pair?.baseToken.symbol}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => { setIsTrading(true); setShowTradePanel(false); }}
                          style={{
                            width: '100%', height: '48px', borderRadius: '12px', border: 'none',
                            background: tradePanelType === 'buy'
                              ? 'linear-gradient(135deg, #00d97e 0%, #00a86b 100%)'
                              : 'linear-gradient(135deg, #f04d4d 0%, #c0392b 100%)',
                            color: '#000', fontWeight: 900, fontSize: '15px',
                            cursor: 'pointer', letterSpacing: '0.03em',
                            boxShadow: tradePanelType === 'buy' ? '0 8px 24px rgba(0,217,126,0.4)' : '0 8px 24px rgba(240,77,77,0.4)',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          Confirm Swap
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Watchlist + Alerts */}
                        <div style={{ display: 'flex', gap: '9px' }}>
                          <button
                            onClick={toggleWatchlist}
                            style={{
                              flex: 1, height: '44px', borderRadius: '10px',
                              border: `1px solid ${isInWatchlist ? 'rgba(0,217,126,0.3)' : 'rgba(255,255,255,0.09)'}`,
                              background: isInWatchlist ? 'rgba(0,217,126,0.1)' : 'rgba(255,255,255,0.04)',
                              color: isInWatchlist ? '#00d97e' : '#8b949e',
                              fontSize: '13px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                              cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: isInWatchlist ? '0 0 16px rgba(0,217,126,0.12)' : 'none',
                            }}
                            onMouseOver={(e) => { if (!isInWatchlist) { e.currentTarget.style.color = '#e6edf3'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; } }}
                            onMouseOut={(e) => { if (!isInWatchlist) { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; } }}
                          >
                            <span style={{ fontSize: '15px' }}>{isInWatchlist ? '★' : '☆'}</span>
                            Watchlist
                          </button>
                          <button
                            style={{
                              flex: 1, height: '44px', borderRadius: '10px',
                              border: '1px solid rgba(255,255,255,0.09)',
                              background: 'rgba(255,255,255,0.04)',
                              color: '#8b949e', fontSize: '13px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#e6edf3'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                          >
                            <span style={{ fontSize: '14px' }}>🔔</span>
                            Alerts
                          </button>
                        </div>

                        {/* Buy + Sell */}
                        <div style={{ display: 'flex', gap: '9px' }}>
                          <button
                            onClick={() => handleTradeAction('buy')}
                            style={{
                              flex: 1, height: '48px', borderRadius: '12px', border: 'none',
                              background: 'linear-gradient(135deg, #00d97e 0%, #00a86b 100%)',
                              color: '#000', fontWeight: 900, fontSize: '15px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: '0 6px 20px rgba(0,217,126,0.35)',
                              letterSpacing: '0.02em',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,217,126,0.5)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,217,126,0.35)'; }}
                          >
                            <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>↑</span>
                            Buy
                          </button>
                          <button
                            onClick={() => handleTradeAction('sell')}
                            style={{
                              flex: 1, height: '48px', borderRadius: '12px', border: 'none',
                              background: 'linear-gradient(135deg, #f04d4d 0%, #c0392b 100%)',
                              color: '#fff', fontWeight: 900, fontSize: '15px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: '0 6px 20px rgba(240,77,77,0.35)',
                              letterSpacing: '0.02em',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(240,77,77,0.5)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,77,77,0.35)'; }}
                          >
                            <span style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>↓</span>
                            Sell
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Pool & Pair Info */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      padding: '0 14px 16px',
                    }}
                  >
                    {/* Pair Created */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: '#484f58', fontWeight: 600 }}>Pair created</span>
                      <span style={{ color: '#e6edf3', fontWeight: 600 }}>
                        {pair?.pairCreatedAt ? fmtAge(pair.pairCreatedAt) : '–'}
                      </span>
                    </div>

                    {/* Pooled base token */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: '#484f58', fontWeight: 600 }}>
                        Pooled {pair?.baseToken?.symbol}
                      </span>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#e6edf3', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                          {pair?.liquidity?.base != null ? fmtNum(pair.liquidity.base, 0) : '–'}
                        </span>
                        {pair?.liquidity?.base != null && pair?.priceUsd && (
                          <span style={{ color: '#484f58', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmtUsd(pair.liquidity.base * parseFloat(pair.priceUsd))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pooled quote token */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: '#484f58', fontWeight: 600 }}>
                        Pooled {pair?.quoteToken?.symbol}
                      </span>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#e6edf3', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                          {pair?.liquidity?.quote != null ? fmtNum(pair.liquidity.quote, 2) : '–'}
                        </span>
                        {pair?.liquidity?.usd != null && pair?.liquidity?.base != null && pair?.liquidity?.quote != null && (
                          <span style={{ color: '#484f58', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmtUsd(pair.liquidity.usd - pair.liquidity.base * parseFloat(pair.priceUsd || '0'))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pair address */}
                    {pair?.pairAddress && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#484f58', fontWeight: 600 }}>Pair</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => copyText(pair.pairAddress)}
                            title="Copy"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              color: '#8b949e',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              transition: 'all 0.15s',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e6edf3'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b949e'; }}
                          >
                            ⧉
                          </button>
                          <span style={{ color: '#4f8ef7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600 }}>
                            {shorten(pair.pairAddress)}
                          </span>
                          <a
                            href={`https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#484f58', fontSize: '10px', textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                            onMouseOver={(e: any) => { e.currentTarget.style.color = '#4f8ef7'; }}
                            onMouseOut={(e: any) => { e.currentTarget.style.color = '#484f58'; }}
                          >
                            EXP ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Base token address */}
                    {pair?.baseToken?.address && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#8b949e' }}>
                          {pair.baseToken.symbol}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <button
                            onClick={() => copyText(pair.baseToken.address)}
                            title="Copy"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#8b949e',
                              padding: 0,
                              fontSize: '12px',
                            }}
                          >
                            ⧉
                          </button>
                          <span
                            style={{
                              color: '#58a6ff',
                              fontFamily: 'JetBrains Mono',
                              fontSize: '11px',
                            }}
                          >
                            {shorten(pair.baseToken.address)}
                          </span>
                          <a
                            href={`https://dexscreener.com/${pair.chainId}/${pair.baseToken.address}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#8b949e',
                              fontSize: '11px',
                              textDecoration: 'none',
                            }}
                          >
                            EXP ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Quote token address */}
                    {pair?.quoteToken?.address && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#8b949e' }}>
                          {pair.quoteToken.symbol}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <button
                            onClick={() => copyText(pair.quoteToken.address)}
                            title="Copy"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#8b949e',
                              padding: 0,
                              fontSize: '12px',
                            }}
                          >
                            ⧉
                          </button>
                          <span
                            style={{
                              color: '#58a6ff',
                              fontFamily: 'JetBrains Mono',
                              fontSize: '11px',
                            }}
                          >
                            {shorten(pair.quoteToken.address)}
                          </span>
                          <a
                            href={`https://dexscreener.com/${pair.chainId}/${pair.quoteToken.address}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: '#8b949e',
                              fontSize: '11px',
                              textDecoration: 'none',
                            }}
                          >
                            EXP ↗
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Action links */}
                    <div
                      style={{ display: 'flex', gap: '8px', marginTop: '12px' }}
                    >
                      <a
                        href={`https://twitter.com/search?q=${encodeURIComponent(pair?.baseToken?.symbol || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #21262d',
                          background: '#1c2128',
                          color: '#e6edf3',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        𝕏 Search on Twitter
                      </a>
                      <a
                        href={pair?.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #21262d',
                          background: '#1c2128',
                          color: '#e6edf3',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🔍 Other pairs
                      </a>
                    </div>

                    {/* Audit card – dynamic */}
                    {(() => {
                      const riskColor = (r: string) =>
                        r === 'safe'
                          ? '#00d97e'
                          : r === 'danger'
                            ? '#f04d4d'
                            : r === 'warning'
                              ? '#f0b94d'
                              : '#8b949e';
                      const riskIcon = (r: string) =>
                        r === 'safe' ? '✓' : r === 'danger' ? '✗' : '⚠';
                      const headerBg = !audit
                        ? '#1c2128'
                        : audit.overallRisk === 'safe'
                          ? 'rgba(0,217,126,0.06)'
                          : audit.overallRisk === 'danger'
                            ? 'rgba(240,77,77,0.07)'
                            : audit.overallRisk === 'warning'
                              ? 'rgba(240,185,77,0.06)'
                              : '#1c2128';
                      const headerBorder = !audit
                        ? '#21262d'
                        : audit.overallRisk === 'safe'
                          ? 'rgba(0,217,126,0.2)'
                          : audit.overallRisk === 'danger'
                            ? 'rgba(240,77,77,0.2)'
                            : '#21262d';

                      return (
                        <div
                          style={{
                            marginTop: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${headerBorder}`,
                            background: headerBg,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Header row */}
                          <div
                            onClick={() => setAuditExpanded((e) => !e)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 12px',
                              cursor: 'pointer',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#e6edf3',
                              }}
                            >
                              Audit
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              {auditLoading ? (
                                <span
                                  style={{ fontSize: '11px', color: '#484f58' }}
                                >
                                  Loading…
                                </span>
                              ) : audit ? (
                                <span
                                  style={{
                                    fontSize: '12px',
                                    color: riskColor(audit.overallRisk),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 600,
                                  }}
                                >
                                  {audit.summary}
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    style={{ flexShrink: 0 }}
                                  >
                                    <circle
                                      cx="8"
                                      cy="8"
                                      r="7"
                                      stroke={riskColor(audit.overallRisk)}
                                      strokeWidth="1.5"
                                    />
                                    {audit.overallRisk === 'safe' && (
                                      <path
                                        d="M5 8l2 2 4-4"
                                        stroke={riskColor(audit.overallRisk)}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    )}
                                    {audit.overallRisk === 'danger' && (
                                      <path
                                        d="M6 6l4 4M10 6l-4 4"
                                        stroke={riskColor(audit.overallRisk)}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    )}
                                    {audit.overallRisk === 'warning' && (
                                      <>
                                        <path
                                          d="M8 5v4"
                                          stroke={riskColor(audit.overallRisk)}
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                        />
                                        <circle
                                          cx="8"
                                          cy="11"
                                          r="0.8"
                                          fill={riskColor(audit.overallRisk)}
                                        />
                                      </>
                                    )}
                                  </svg>
                                </span>
                              ) : (
                                <span
                                  style={{ fontSize: '11px', color: '#484f58' }}
                                >
                                  —
                                </span>
                              )}
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                style={{
                                  transform: auditExpanded
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                                  transition: 'transform 0.2s',
                                  flexShrink: 0,
                                }}
                              >
                                <path
                                  d="M2 4l4 4 4-4"
                                  stroke="#8b949e"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Collapsed rows */}
                          {auditExpanded && audit && audit.items.length > 0 && (
                            <div style={{ borderTop: '1px solid #21262d' }}>
                              {audit.items.map((item: any, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '9px 12px',
                                    borderBottom:
                                      i < audit.items.length - 1
                                        ? '1px solid rgba(33,38,45,0.6)'
                                        : 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 13 13"
                                      fill="none"
                                      style={{ flexShrink: 0 }}
                                    >
                                      <circle
                                        cx="6.5"
                                        cy="6.5"
                                        r="6"
                                        stroke="#484f58"
                                        strokeWidth="1"
                                      />
                                      <path
                                        d="M6.5 5.5v4"
                                        stroke="#484f58"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                      />
                                      <circle
                                        cx="6.5"
                                        cy="3.5"
                                        r="0.7"
                                        fill="#484f58"
                                      />
                                    </svg>
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        color: '#8b949e',
                                      }}
                                    >
                                      {item.label}
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      color: riskColor(item.risk),
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 14 14"
                                      fill="none"
                                      style={{ flexShrink: 0 }}
                                    >
                                      <circle
                                        cx="7"
                                        cy="7"
                                        r="6.5"
                                        fill={riskColor(item.risk)}
                                        opacity="0.15"
                                      />
                                      <circle
                                        cx="7"
                                        cy="7"
                                        r="6.5"
                                        stroke={riskColor(item.risk)}
                                        strokeWidth="1"
                                      />
                                      {item.risk === 'safe' && (
                                        <path
                                          d="M4.5 7l1.8 1.8L9.5 5.5"
                                          stroke={riskColor(item.risk)}
                                          strokeWidth="1.3"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      )}
                                      {item.risk !== 'safe' && (
                                        <text
                                          x="7"
                                          y="10"
                                          textAnchor="middle"
                                          fontSize="8"
                                          fontWeight="700"
                                          fill={riskColor(item.risk)}
                                        >
                                          {riskIcon(item.risk)}
                                        </text>
                                      )}
                                    </svg>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                              {/* Collapse toggle */}
                              <div
                                onClick={() => setAuditExpanded(false)}
                                style={{
                                  textAlign: 'center',
                                  padding: '8px',
                                  cursor: 'pointer',
                                  borderTop: '1px solid #21262d',
                                  background: 'rgba(0,0,0,0.2)',
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <path
                                    d="M2 8l4-4 4 4"
                                    stroke="#484f58"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Audit warning */}
                    {audit && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: '#484f58',
                          marginTop: '8px',
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: '#f0b94d', fontWeight: 700 }}>
                          Warning!
                        </span>{' '}
                        Audits may not be 100% accurate.
                      </p>
                    )}

                    {/* ---- Boost widget ---- */}
                    <div
                      style={{
                        marginTop: '16px',
                        borderRadius: '8px',
                        border: '1px solid #f0b94d',
                        background: 'rgba(240,185,77,0.05)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        window.open(
                          `https://dexscreener.com/solana/${pair?.baseToken?.address}`,
                          '_blank',
                        )
                      }
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#e6edf3',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>⚡</span> Boost
                      </span>
                      {boostAmount > 0 && (
                        <span
                          style={{
                            background: '#f0b94d',
                            color: '#0b0e11',
                            fontSize: '12px',
                            fontWeight: 800,
                            borderRadius: '999px',
                            padding: '2px 10px',
                          }}
                        >
                          {boostAmount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* ---- Community reactions ---- */}
                    <div
                      style={{
                        marginTop: '12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                      }}
                    >
                      {(
                        [
                          { key: 'rocket', emoji: '🚀' },
                          { key: 'fire', emoji: '🔥' },
                          { key: 'poop', emoji: '💩' },
                          { key: 'flag', emoji: '🚩' },
                        ] as { key: keyof typeof reactions; emoji: string }[]
                      ).map(({ key, emoji }) => (
                        <button
                          key={key}
                          onClick={() => vote(key)}
                          style={{
                            background:
                              myReaction === key
                                ? 'rgba(255,255,255,0.08)'
                                : '#1c2128',
                            border:
                              myReaction === key
                                ? '1px solid rgba(255,255,255,0.2)'
                                : '1px solid #21262d',
                            borderRadius: '8px',
                            padding: '10px 4px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>
                            {emoji}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#8b949e',
                              fontWeight: 600,
                            }}
                          >
                            {reactions[key]}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* ---- Token profile card ---- */}
                    <div
                      style={{
                        marginTop: '16px',
                        borderRadius: '10px',
                        background: '#12151a',
                        border: '1px solid #21262d',
                        overflow: 'hidden',
                      }}
                    >
                      {tokenProfile ? (
                        <>
                          {/* Token header */}
                          <div
                            style={{
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px',
                              background:
                                'linear-gradient(180deg, rgba(0,217,126,0.06) 0%, transparent 100%)',
                            }}
                          >
                            {tokenProfile.icon ? (
                              <img
                                src={tokenProfile.icon}
                                alt="token"
                                style={{
                                  width: '72px',
                                  height: '72px',
                                  borderRadius: '12px',
                                  objectFit: 'cover',
                                  border: '1px solid #21262d',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '72px',
                                  height: '72px',
                                  borderRadius: '12px',
                                  background: '#1c2128',
                                  border: '1px solid #21262d',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '28px',
                                }}
                              >
                                {pair?.baseToken?.symbol?.[0]}
                              </div>
                            )}
                            <div style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  fontSize: '16px',
                                  fontWeight: 700,
                                  color: '#e6edf3',
                                }}
                              >
                                {tokenProfile.header || pair?.baseToken?.name}
                              </div>
                            </div>
                            {/* Links */}
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                              }}
                            >
                              {(tokenProfile.links || []).map(
                                (link: any, i: number) => (
                                  <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      padding: '5px 12px',
                                      background: '#1c2128',
                                      border: '1px solid #21262d',
                                      borderRadius: '6px',
                                      color: '#8b949e',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                    }}
                                  >
                                    👤 {link.label || link.type}
                                  </a>
                                ),
                              )}
                            </div>
                            {tokenProfile.description && (
                              <p
                                style={{
                                  fontSize: '12px',
                                  color: '#8b949e',
                                  textAlign: 'center',
                                  margin: 0,
                                  lineHeight: 1.5,
                                }}
                              >
                                {tokenProfile.description}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* No profile – show claim CTA */
                        <div
                          style={{
                            padding: '12px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span style={{ fontSize: '18px' }}>👁️</span>
                          <span style={{ fontSize: '12px', color: '#8b949e' }}>
                            Claim Your DEX Screener{' '}
                            <a
                              href={`https://dexscreener.com/solana/${pair?.baseToken?.address}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#e6edf3',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              Token Profile
                            </a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#484f58',
                    fontSize: '13px',
                  }}
                >
                  Loading pair data…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Bubblemaps Modal ---- */}
      {showBubblemaps &&
        pair &&
        (() => {
          const bmChain: Record<string, string> = {
            solana: 'sol',
            ethereum: 'eth',
            eth: 'eth',
            bsc: 'bsc',
            polygon: 'matic',
            arbitrum: 'arbi',
            avalanche: 'avax',
            base: 'base',
            optimism: 'ftm',
          };
          const chain = bmChain[String(chainId).toLowerCase()] || 'eth';
          const tokenAddr = pair.baseToken.address;
          const bmUrl = `https://app.bubblemaps.io/${chain}/token/${tokenAddr}`;
          const tokenName = pair.baseToken.name || pair.baseToken.symbol;

          return (
            <>
              {/* Backdrop */}
              <div
                onClick={() => {
                  setShowBubblemaps(false);
                  setBubblemapsFullscreen(false);
                }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 900,
                }}
              />
              {/* Modal */}
              <div
                style={{
                  position: 'fixed',
                  zIndex: 901,
                  ...(bubblemapsFullscreen
                    ? { inset: 0, borderRadius: 0 }
                    : {
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'min(1000px, 94vw)',
                        height: 'min(680px, 88vh)',
                        borderRadius: '12px',
                      }),
                  background: '#0b0e11',
                  border: '1px solid #21262d',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #21262d',
                    gap: '10px',
                    flexShrink: 0,
                    background: '#0d1117',
                  }}
                >
                  {/* Bubblemaps icon */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background:
                        'radial-gradient(circle at 35% 35%, #2a3f6f, #0d1b3e)',
                      border: '1px solid rgba(79,142,247,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                  >
                    🫧
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: '#e6edf3',
                        fontSize: '14px',
                      }}
                    >
                      {tokenName}
                    </span>
                    <span style={{ color: '#8b949e', fontSize: '13px' }}>
                      {' '}
                      Bubblemaps
                    </span>
                  </div>

                  {/* Address list button */}
                  <a
                    href={`https://app.bubblemaps.io/${chain}/token/${tokenAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '5px 12px',
                      background: '#161b22',
                      border: '1px solid #21262d',
                      borderRadius: '6px',
                      color: '#8b949e',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Address List ↗
                  </a>

                  {/* Fullscreen toggle */}
                  <button
                    onClick={() => setBubblemapsFullscreen((f) => !f)}
                    title={
                      bubblemapsFullscreen ? 'Exit fullscreen' : 'Fullscreen'
                    }
                    style={{
                      background: '#161b22',
                      border: '1px solid #21262d',
                      borderRadius: '6px',
                      color: '#8b949e',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {bubblemapsFullscreen ? '⤤' : '⤢'}
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => {
                      setShowBubblemaps(false);
                      setBubblemapsFullscreen(false);
                    }}
                    title="Close"
                    style={{
                      background: '#161b22',
                      border: '1px solid #21262d',
                      borderRadius: '6px',
                      color: '#8b949e',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 300,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Iframe */}
                <iframe
                  src={bmUrl}
                  title="Bubblemaps"
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none',
                    background: '#0b0e11',
                  }}
                  allow="clipboard-write"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
                />

                {/* Footer */}
                <div
                  style={{
                    padding: '6px 16px',
                    borderTop: '1px solid #21262d',
                    background: '#0d1117',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    color: '#484f58',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '12px' }}>🫧</span>
                  Powered by{' '}
                  <a
                    href="https://bubblemaps.io"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#58a6ff', textDecoration: 'none' }}
                  >
                    Bubblemaps
                  </a>
                </div>
              </div>
            </>
          );
        })()}

      {/* Global Bottom Stats Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28px',
          background: '#0d1117',
          borderTop: '1px solid #21262d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '11px',
          color: '#8b949e',
          fontFamily: 'JetBrains Mono, monospace',
          zIndex: 99999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            <span style={{ color: '#484f58' }}>24H TXNS: </span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              {(
                (pair?.txns?.h24?.buys || 0) + (pair?.txns?.h24?.sells || 0)
              ).toLocaleString()}
            </span>
          </span>
          <span>
            <span style={{ color: '#484f58' }}>24H VOLUME: </span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              {fmtUsd(pair?.volume?.h24 || 0)}
            </span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            <span style={{ color: '#484f58', textTransform: 'uppercase' }}>
              {chainId === 'solana'
                ? 'SOL'
                : chainId === 'bsc'
                  ? 'BNB'
                  : chainId === 'polygon'
                    ? 'MATIC'
                    : 'ETH'}{' '}
              PRICE{' '}
            </span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>
              {priceNative > 0 ? fmtUsd(price / priceNative) : '--'}
            </span>
          </span>
          <span style={{ color: '#30363d' }}>|</span>
          <span>
            <span style={{ color: '#484f58' }}>GAS </span>
            <span style={{ color: '#e3b341', fontWeight: 600 }}>
              {Math.floor(Math.random() * 20 + 10)} GWEI
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
