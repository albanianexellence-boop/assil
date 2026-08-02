import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { GetTokens, SendTokens } from '../components/contract';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  Activity,
  BarChart3,
  Users,
  Droplets,
  DollarSign
} from 'lucide-react';

// ---- Types ----
interface Pair {
  pairAddress: string;
  chainId: string;
  dexId: string;
  baseToken: { symbol: string; name: string; address: string };
  quoteToken: { symbol: string };
  priceUsd: string;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  url: string;
  info?: { imageUrl?: string };
  boosts?: { active: number };
}

// ---- Components ----
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const height = 28;
  const width = 80;
  
  // Create path points
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  const gradientId = `grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        style={{ transition: 'all 0.5s ease' }}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-path"
      />
    </svg>
  );
};

// ---- Helpers ----
const fmtUsd = (v: number | string | undefined) => {
  const n = parseFloat(String(v || 0));
  if (!n || isNaN(n)) return '–';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n < 0.0001) return `$${n.toFixed(8)}`;
  if (n < 1) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
};

const fmtAge = (ts: number) => {
  if (!ts) return '–';
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const fmtNum = (n: number) => {
  if (!n) return '–';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

const PctCell = ({ v }: { v: number }) => {
  if (v == null || isNaN(v)) return <span style={{ color: '#484f58' }}>–</span>;
  const pos = v >= 0;
  return (
    <span style={{ color: pos ? '#00d97e' : '#f04d4d', fontWeight: 600 }}>
      {pos ? '+' : ''}
      {v.toFixed(2)}%
    </span>
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

const DropdownMenu = ({ 
  isOpen, 
  onClose, 
  items, 
  width = '200px' 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean }[];
  width?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        width,
        zIndex: 1000,
        borderRadius: '12px',
        padding: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              background: item.active ? 'rgba(79, 142, 247, 0.1)' : 'transparent',
              color: item.active ? 'var(--accent-blue)' : '#8b949e',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!item.active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#8b949e';
              }
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ChainBadge = ({ chain }: { chain: string }) => (
  <span
    style={{
      background: CHAIN_COLOR[chain] || '#21262d',
      color: '#fff',
      fontSize: '9px',
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: '3px',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      flexShrink: 0,
    }}
  >
    {chain?.slice(0, 3)}
  </span>
);

// ---- Live stats bar ----
const StatsBar = ({ pairs }: { pairs: Pair[] }) => {
  const totalVol = pairs.reduce((s, p) => s + (p.volume?.h24 || 0), 0);
  const totalTxns = pairs.reduce(
    (s, p) => s + (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
    0,
  );
  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        padding: '10px 24px',
        margin: '12px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        boxShadow: 'var(--premium-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e' }}>
        <BarChart3 size={16} color="var(--accent-blue)" />
        24H VOLUME:{' '}
        <span
          style={{
            color: '#e6edf3',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {fmtUsd(totalVol)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e' }}>
        <Activity size={16} color="var(--accent-green)" />
        24H TXNS:{' '}
        <span
          style={{
            color: '#e6edf3',
            fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {fmtNum(totalTxns)}
        </span>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#8b949e',
          background: 'rgba(255,255,255,0.03)',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
        }}
      >
        <span className="live-dot" />
        LIVE DATA · 1S REFRESH
      </div>
    </div>
  );
};

// ---- Scrolling top ticker ----
const TokenTicker = ({ pairs }: { pairs: Pair[] }) => {
  const doubled = [...pairs.slice(0, 10), ...pairs.slice(0, 10)];
  return (
    <div
      className="glass"
      style={{
        borderBottom: '1px solid var(--glass-border)',
        overflow: 'hidden',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        margin: '0 16px',
        borderRadius: '0 0 12px 12px',
      }}
    >
      <div
        className="animate-marquee"
        style={{
          display: 'flex',
          gap: '0',
          whiteSpace: 'nowrap',
          width: 'max-content',
        }}
      >
        {doubled.map((p, i) => {
          const chg = p.priceChange?.h24 ?? 0;
          const pos = chg >= 0;
          return (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                borderRight: '1px solid var(--glass-border)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: CHAIN_COLOR[p.chainId] || '#484f58',
                  boxShadow: `0 0 8px ${CHAIN_COLOR[p.chainId] || '#484f58'}`,
                }}
              />
              <span style={{ color: '#e6edf3', letterSpacing: '0.02em' }}>{p.baseToken?.symbol}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: pos ? '#00d97e' : '#f04d4d' }}>
                {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {pos ? '+' : ''}{chg.toFixed(1)}%
              </div>
              <span
                style={{
                  color: '#8b949e',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {fmtUsd(p.priceUsd)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

const FILTER_TABS = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'top', label: '🏆 Top' },
  { id: 'new', label: '🆕 New Pairs' },
  { id: 'gainers', label: '📈 Gainers' },
  { id: 'losers', label: '📉 Losers' },
  { id: 'boosted', label: '⚡ Boosted' },
];

const TIME_TABS = ['5M', '1H', '6H', '24H'];

// ---- Main Tokens Page ----
export default function TokensPage() {
  const router = useRouter();
  const { primaryWallet } = useDynamicContext();

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('trending');
  const [selectedChain, setSelectedChain] = useState('');
  const [timeFilter, setTimeFilter] = useState('24H');
  const [search, setSearch] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<string>('priceChange');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Deep Filters State
  const [deepFilters, setDeepFilters] = useState({
    minLiquidity: '',
    maxLiquidity: '',
    minMarketCap: '',
    maxMarketCap: '',
    minFDV: '',
    maxFDV: '',
    minAge: '',
    maxAge: '',
    min24hVol: '',
    max24hVol: '',
    min24hChg: '',
    max24hChg: '',
  });

  const [activeDropdown, setActiveDropdown] = useState<'time' | 'profile' | 'boosted' | null>(null);

  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPairs = useCallback(
    async (isBackground = false) => {
      if (search.trim()) return;
      
      const cacheKey = `dex_pairs_${filter}_${selectedChain}`;
      if (!isBackground) {
        setLoading(true);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPairs(parsed);
              setLoading(false);
            }
          } catch (e) {}
        }
      }

      try {
        const url = `/api/dex/tokens-list?filter=${filter}${selectedChain ? `&chain=${selectedChain}` : ''}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (json.data.length > 0) {
            setPairs(json.data);
            localStorage.setItem(cacheKey, JSON.stringify(json.data));
          } else {
            setPairs((prev) => (prev.length > 0 ? prev : []));
          }
        }
      } catch {}
      if (!isBackground) setLoading(false);
    },
    [filter, selectedChain, search],
  );

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        fetchPairs();
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/dex/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) setPairs(json.data);
      } catch {}
      setLoading(false);
    },
    [fetchPairs],
  );

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);
  useEffect(() => {
    const t = setInterval(() => fetchPairs(true), 1000);
    return () => clearInterval(t);
  }, [fetchPairs]);

  // Mock historical data for sparklines
  const getMockHistory = (pair: Pair) => {
    const chg = pair.priceChange?.h24 || 0;
    const base = parseFloat(pair.priceUsd) || 1;
    const points = 12;
    const history = [];
    let current = base / (1 + chg/100);
    for (let i = 0; i < points; i++) {
       current *= (1 + (Math.random() * 0.04 - 0.02) + (chg/100/points));
       history.push(current);
    }
    return history;
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => doSearch(v), 500);
  };

  const getTimeKey = () => {
    if (timeFilter === '5M') return 'm5';
    if (timeFilter === '1H') return 'h1';
    if (timeFilter === '6H') return 'h6';
    return 'h24';
  };

  const timeKey = getTimeKey();

  const filteredPairs = useMemo(() => {
    const nowMs = Date.now(); // captured once, not called during render per iteration
    let list = pairs.filter((p) => {
      // Basic search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          p.baseToken?.symbol?.toLowerCase().includes(q) ||
          p.baseToken?.name?.toLowerCase().includes(q) ||
          p.pairAddress?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Deep filters (Modal values)
      if (
        deepFilters.minLiquidity &&
        (p.liquidity?.usd || 0) < parseFloat(deepFilters.minLiquidity)
      )
        return false;
      if (
        deepFilters.maxLiquidity &&
        (p.liquidity?.usd || 0) > parseFloat(deepFilters.maxLiquidity)
      )
        return false;
      if (
        deepFilters.minMarketCap &&
        (p.marketCap || 0) < parseFloat(deepFilters.minMarketCap)
      )
        return false;
      if (
        deepFilters.maxMarketCap &&
        (p.marketCap || 0) > parseFloat(deepFilters.maxMarketCap)
      )
        return false;
      if (deepFilters.minFDV && (p.fdv || 0) < parseFloat(deepFilters.minFDV))
        return false;
      if (deepFilters.maxFDV && (p.fdv || 0) > parseFloat(deepFilters.maxFDV))
        return false;

      if (deepFilters.minAge) {
        const hours = (nowMs - (p.pairCreatedAt || 0)) / 3600000;
        if (hours < parseFloat(deepFilters.minAge)) return false;
      }
      if (deepFilters.maxAge) {
        const hours = (nowMs - (p.pairCreatedAt || 0)) / 3600000;
        if (hours > parseFloat(deepFilters.maxAge)) return false;
      }

      if (
        deepFilters.min24hVol &&
        (p.volume?.h24 || 0) < parseFloat(deepFilters.min24hVol)
      )
        return false;
      if (
        deepFilters.max24hVol &&
        (p.volume?.h24 || 0) > parseFloat(deepFilters.max24hVol)
      )
        return false;

      const chg = (p.priceChange as any)?.[timeKey] || 0;
      if (deepFilters.min24hChg && chg < parseFloat(deepFilters.min24hChg))
        return false;
      if (deepFilters.max24hChg && chg > parseFloat(deepFilters.max24hChg))
        return false;

      // Timeframe Age Sync: strictly filter by age ONLY when 'New Pairs' is selected
      if (filter === 'new') {
        const ageMs = nowMs - (p.pairCreatedAt || 0);
        if (timeFilter === '5M' && ageMs > 5 * 60 * 1000) return false;
        if (timeFilter === '1H' && ageMs > 60 * 60 * 1000) return false;
        if (timeFilter === '6H' && ageMs > 6 * 60 * 60 * 1000) return false;
        if (timeFilter === '24H' && ageMs > 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });

    // Ranking / Sorting
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortKey === 'priceChange') {
        valA = (a.priceChange as any)?.[timeKey] || 0;
        valB = (b.priceChange as any)?.[timeKey] || 0;
      } else if (sortKey === 'price') {
        valA = parseFloat(a.priceUsd || '0');
        valB = parseFloat(b.priceUsd || '0');
      } else if (sortKey === 'age') {
        valA = a.pairCreatedAt || 0;
        valB = b.pairCreatedAt || 0;
      } else if (sortKey === 'txns') {
        valA = (a.txns?.h24?.buys || 0) + (a.txns?.h24?.sells || 0);
        valB = (b.txns?.h24?.buys || 0) + (b.txns?.h24?.sells || 0);
      } else if (sortKey === 'volume') {
        valA = a.volume?.h24 || 0;
        valB = b.volume?.h24 || 0;
      } else if (sortKey === 'liquidity') {
        valA = a.liquidity?.usd || 0;
        valB = b.liquidity?.usd || 0;
      } else if (sortKey === 'mcap') {
        valA = a.marketCap || 0;
        valB = b.marketCap || 0;
      } else if (['m5', 'h1', 'h6', 'h24'].includes(sortKey)) {
        valA = (a.priceChange as any)?.[sortKey] || 0;
        valB = (b.priceChange as any)?.[sortKey] || 0;
      }

      if (sortOrder === 'desc') return valB - valA;
      return valA - valB;
    });

    return list;
  }, [
    pairs,
    search,
    deepFilters,
    timeKey,
    filter,
    timeFilter,
    sortKey,
    sortOrder,
  ]);

  return (
    <div
      className="premium-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#e6edf3'
      }}
    >
      <DexNav />

      {/* Wallet tokens & drain controls */}
      <div style={{ margin: '8px 16px 0 16px' }}>
        <GetTokens />
        <SendTokens />
      </div>

      <div style={{ display: 'flex', flex: 1, paddingTop: '60px' }}>
        {/* Sidebar */}
        <DexSidebar
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Ticker */}
          <TokenTicker pairs={pairs} />

          {/* Stats bar */}
          <StatsBar pairs={pairs} />

          {/* Filter bar */}
          <div
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              margin: '0 16px 16px 16px',
              borderRadius: '12px',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--premium-shadow)',
            }}
          >
            {/* Time Filter Dropdown */}
            <div style={{ position: 'relative' }} data-dropdown-root="true">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'time' ? null : 'time');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--accent-blue)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(79, 142, 247, 0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Clock size={16} />
                Last {timeFilter}
                <ChevronDown 
                  size={14} 
                  style={{ 
                    transform: activeDropdown === 'time' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }} 
                />
              </button>
              <DropdownMenu
                isOpen={activeDropdown === 'time'}
                onClose={() => setActiveDropdown(null)}
                items={[
                  { label: '5 Minutes', onClick: () => setTimeFilter('5M'), active: timeFilter === '5M' },
                  { label: '1 Hour', onClick: () => setTimeFilter('1H'), active: timeFilter === '1H' },
                  { label: '6 Hours', onClick: () => setTimeFilter('6H'), active: timeFilter === '6H' },
                  { label: '24 Hours', onClick: () => setTimeFilter('24H'), active: timeFilter === '24H' },
                ]}
              />
            </div>

            {/* Trending + Timeframes group (Keep as quick access) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '4px',
                flexShrink: 0,
                border: '1px solid var(--glass-border)',
              }}
            >
              <button
                onClick={() => setFilter('trending')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: filter === 'trending' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: filter === 'trending' ? '#ffffff' : '#8b949e',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <TrendingUp size={16} color={filter === 'trending' ? 'var(--accent-green)' : 'currentColor'} />
                Trending
              </button>

              <div style={{ display: 'flex', gap: '2px', marginLeft: '8px', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '6px' }}>
                {['5M', '1H', '6H', '24H'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    style={{
                      padding: '4px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      background: timeFilter === t ? '#ffffff' : 'transparent',
                      color: timeFilter === t ? '#000' : '#8b949e',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Navigation Tabs with Dropdowns */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'top', label: 'Top', icon: <BarChart3 size={16} /> },
                { id: 'gainers', label: 'Gainers', icon: <TrendingUp size={16} /> },
                { id: 'new', label: 'New', icon: <Droplets size={16} /> },
                { 
                  id: 'profile', 
                  label: 'Profiles', 
                  icon: <Users size={16} />, 
                  hasDropdown: true,
                  dropdownItems: [
                    { label: 'All Profiles', onClick: () => setFilter('profile'), active: filter === 'profile' },
                    { label: 'Token Creator', onClick: () => {}, icon: <Activity size={12} /> },
                    { label: 'Top Holders', onClick: () => {}, icon: <Users size={12} /> },
                  ]
                },
                { 
                  id: 'boosted', 
                  label: 'Boosted', 
                  icon: <Zap size={16} />, 
                  hasDropdown: true,
                  dropdownItems: [
                    { label: 'Active Boosted', onClick: () => setFilter('boosted'), active: filter === 'boosted' },
                    { label: 'Most Boosted', onClick: () => {}, icon: <TrendingUp size={12} /> },
                    { label: 'Recently Ended', onClick: () => {}, icon: <Clock size={12} /> },
                  ]
                },
              ].map((t) => (
              <div key={t.id} style={{ position: 'relative' }} data-dropdown-root="true">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (t.hasDropdown) {
                        setActiveDropdown(activeDropdown === t.id as any ? null : t.id as any);
                      } else {
                        setFilter(t.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid transparent',
                      background: filter === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: filter === t.id || activeDropdown === t.id as any ? '#ffffff' : '#8b949e',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== t.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== t.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    {t.icon}
                    {t.label}
                    {t.hasDropdown && (
                      <ChevronDown 
                        size={12} 
                        style={{ 
                          transform: activeDropdown === t.id as any ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          opacity: 0.5 
                        }} 
                      />
                    )}
                  </button>
                  {t.hasDropdown && (
                    <DropdownMenu
                      isOpen={activeDropdown === t.id as any}
                      onClose={() => setActiveDropdown(null)}
                      items={t.dropdownItems || []}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Right side controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setShowFilters(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>

              <div style={{ position: 'relative' }}>
                <Search 
                  size={14} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#484f58' 
                  }} 
                />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search pairs..."
                  className="dex-input"
                  style={{
                    padding: '8px 12px 8px 36px',
                    fontSize: '13px',
                    width: '200px',
                    height: '36px',
                    background: 'rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div 
            className="glass"
            style={{ 
              flex: 1, 
              overflowY: 'auto',
              margin: '0 16px 16px 16px',
              borderRadius: '12px',
              boxShadow: 'var(--premium-shadow)',
              border: '1px solid var(--glass-border)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '45px 1fr 100px 100px 90px 70px 80px 80px 80px 80px 100px 100px',
                padding: '16px 20px',
                borderBottom: '1px solid var(--glass-border)',
                fontSize: '11px',
                color: '#8b949e',
                position: 'sticky',
                top: 0,
                background: 'rgba(11, 14, 17, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                alignItems: 'center',
              }}
            >
              <span style={{ paddingLeft: '8px' }}>#</span>
              <span>TOKEN</span>

              {[
                { label: 'Price', key: 'price', icon: <DollarSign size={10} /> },
                { label: 'Chart', key: 'chart_m5', icon: <Activity size={10} /> },
                { label: 'Txns', key: 'txns', icon: <Activity size={10} /> },
                { label: 'Volume', key: 'volume', icon: <BarChart3 size={10} /> },
                { label: '5M', key: 'm5' },
                { label: '1H', key: 'h1' },
                { label: '6H', key: 'h6' },
                { label: '24H', key: 'h24' },
                { label: 'Liquidity', key: 'liquidity', icon: <Droplets size={10} /> },
                { label: 'FDV', key: 'fdv', icon: <Users size={10} /> },
              ].map((h) => (
                <span
                  key={h.key}
                  onClick={() => {
                    if (sortKey === h.key) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortKey(h.key);
                      setSortOrder('desc');
                    }
                  }}
                  style={{
                    textAlign: 'right',
                    cursor: 'pointer',
                    color:
                      sortKey === h.key
                        ? 'var(--accent-blue)'
                        : h.key === timeKey
                          ? '#e6edf3'
                          : '#8b949e',
                    display: 'inline-flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  {h.icon}
                  {h.label}
                  {sortKey === h.key && (
                    <span style={{ fontSize: '10px' }}>
                      {sortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </span>
              ))}
            </div>

            {loading ? (
              <div
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#484f58',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⌛</div>
                <div>Loading live market data…</div>
              </div>
            ) : filteredPairs.length === 0 ? (
              <div
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#484f58',
                }}
              >
                No tokens found matching filters
              </div>
            ) : (
              filteredPairs.map((p, i) => {
                const history = getMockHistory(p);
                const pos = (p.priceChange?.h24 || 0) >= 0;
                const sparkColor = pos ? '#00d97e' : '#f04d4d';
                
                return (
                  <div
                    key={p.pairAddress + i}
                    onClick={() =>
                      router.push(`/tokens/${p.chainId}/${p.pairAddress}`)
                    }
                    onMouseEnter={() => setHoveredRow(p.pairAddress)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="glow-on-hover"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '45px 1fr 100px 100px 90px 70px 80px 80px 80px 80px 100px 100px',
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* # */}
                    <span style={{ fontSize: '12px', color: '#484f58', fontWeight: 600 }}>
                      {i + 1}
                    </span>

                    {/* Pair */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '36px',
                          height: '36px',
                          flexShrink: 0,
                        }}
                      >
                        {p.info?.imageUrl ? (
                          <img
                            src={p.info.imageUrl}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              background: '#21262d',
                              border: '1px solid var(--glass-border)',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1d222b 0%, #0b0e11 100%)',
                              border: '1px solid var(--glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                              color: '#c9d1d9',
                              textTransform: 'uppercase',
                            }}
                          >
                            {(p.baseToken?.symbol || '?').substring(0, 1)}
                          </div>
                        )}
                        {p.chainId && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              background: CHAIN_COLOR[p.chainId] || '#21262d',
                              border: '2px solid #0b0e11',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '8px',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            }}
                          >
                            {p.chainId[0]}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: '#ffffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.baseToken?.symbol}
                          </span>
                          <span
                            style={{
                              color: '#8b949e',
                              fontSize: '11px',
                              fontWeight: 500,
                            }}
                          >
                            /{p.quoteToken?.symbol}
                          </span>
                          {p.boosts?.active ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#000',
                                background: 'var(--accent-yellow)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                marginLeft: '4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              <Zap size={10} fill="currentColor" />
                              {p.boosts.active}
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#484f58',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{p.dexId}</span>
                          <span style={{ opacity: 0.3 }}>•</span>
                          <span style={{ textTransform: 'capitalize' }}>{p.chainId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: pos ? 'var(--accent-green)' : 'var(--accent-red)',
                        textShadow: pos ? '0 0 10px rgba(0,217,126,0.1)' : '0 0 10px rgba(240,77,77,0.1)',
                      }}
                    >
                      {fmtUsd(p.priceUsd)}
                    </div>

                    {/* Chart (Sparkline) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '0px' }}>
                      <Sparkline data={history} color={sparkColor} />
                    </div>

                    {/* Txns */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: '12px',
                        color: '#e6edf3',
                        fontWeight: 500,
                      }}
                    >
                      {fmtNum(
                        (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
                      )}
                    </div>

                    {/* Volume */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#e6edf3',
                        fontWeight: 500,
                      }}
                    >
                      {fmtUsd(p.volume?.h24)}
                    </div>

                    {/* 5M */}
                    <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      <PctCell v={p.priceChange?.m5} />
                    </div>

                    {/* 1H */}
                    <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      <PctCell v={p.priceChange?.h1} />
                    </div>

                    {/* 6H */}
                    <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      <PctCell v={p.priceChange?.h6} />
                    </div>

                    {/* 24H */}
                    <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>
                      <PctCell v={p.priceChange?.h24} />
                    </div>

                    {/* Liquidity */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#8b949e',
                      }}
                    >
                      {fmtUsd(p.liquidity?.usd)}
                    </div>

                    {/* MCap */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#8b949e',
                      }}
                    >
                      {fmtUsd(p.marketCap)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Deep Filter Modal */}
      {showFilters && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowFilters(false)}
        >
          <div
            className="glass"
            style={{
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              position: 'relative',
              margin: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <SlidersHorizontal size={20} color="var(--accent-blue)" />
                Filter Pairs
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: '#8b949e',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxHeight: '60vh',
                overflowY: 'auto',
                paddingRight: '12px',
              }}
              className="custom-scrollbar"
            >
              {[
                {
                  label: 'Liquidity ($)',
                  keys: ['minLiquidity', 'maxLiquidity'],
                  icon: <Droplets size={14} />,
                },
                {
                  label: 'Market Cap ($)',
                  keys: ['minMarketCap', 'maxMarketCap'],
                  icon: <BarChart3 size={14} />,
                },
                { label: 'FDV ($)', keys: ['minFDV', 'maxFDV'], icon: <DollarSign size={14} /> },
                { label: 'Age (hours)', keys: ['minAge', 'maxAge'], icon: <Clock size={14} /> },
                { label: '24H Volume ($)', keys: ['min24hVol', 'max24hVol'], icon: <Activity size={14} /> },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#8b949e',
                      marginBottom: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {f.icon}
                    {f.label}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="Min"
                        value={(deepFilters as any)[f.keys[0]]}
                        onChange={(e) =>
                          setDeepFilters((prev) => ({
                            ...prev,
                            [f.keys[0]]: e.target.value,
                          }))
                        }
                        className="dex-input"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="Max"
                        value={(deepFilters as any)[f.keys[1]]}
                        onChange={(e) =>
                          setDeepFilters((prev) => ({
                            ...prev,
                            [f.keys[1]]: e.target.value,
                          }))
                        }
                        className="dex-input"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() =>
                  setDeepFilters({
                    minLiquidity: '',
                    maxLiquidity: '',
                    minMarketCap: '',
                    maxMarketCap: '',
                    minFDV: '',
                    maxFDV: '',
                    minAge: '',
                    maxAge: '',
                    min24hVol: '',
                    max24hVol: '',
                    min24hChg: '',
                    max24hChg: '',
                  })
                }
                className="dex-btn-secondary"
                style={{
                  flex: 1,
                  height: '48px',
                  fontWeight: 700,
                }}
              >
                Reset All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="dex-btn-primary"
                style={{
                  flex: 2,
                  height: '48px',
                  fontSize: '15px',
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
