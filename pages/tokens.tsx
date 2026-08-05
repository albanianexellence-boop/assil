import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { ContractLayout } from '../components/contract';
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
  DollarSign,
  Flame,
  Star,
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

// ---- Chain config ----
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

const CHAIN_LABEL: Record<string, string> = {
  ethereum: 'ETH',
  bsc: 'BSC',
  solana: 'SOL',
  base: 'BASE',
  arbitrum: 'ARB',
  polygon: 'MATIC',
  avalanche: 'AVAX',
  optimism: 'OP',
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

// ---- Sparkline ----
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 84;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `sg-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ---- Pct badge ----
const PctBadge = ({ v }: { v: number }) => {
  if (v == null || isNaN(v))
    return <span style={{ color: '#484f58', fontSize: '11px' }}>–</span>;
  const pos = v >= 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '3px 7px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        background: pos ? 'rgba(0,217,126,0.12)' : 'rgba(240,77,77,0.12)',
        color: pos ? '#00d97e' : '#f04d4d',
        letterSpacing: '0.02em',
      }}
    >
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pos ? '+' : ''}{v.toFixed(2)}%
    </span>
  );
};

// ---- Chain badge ----
const ChainBadge = ({ chain }: { chain: string }) => {
  const color = CHAIN_COLOR[chain] || '#484f58';
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        fontSize: '9px',
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flexShrink: 0,
      }}
    >
      {CHAIN_LABEL[chain] || chain?.slice(0, 4)}
    </span>
  );
};

// ---- Dropdown ----
const DropdownMenu = ({
  isOpen,
  onClose,
  items,
  width = '200px',
}: {
  isOpen: boolean;
  onClose: () => void;
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean }[];
  width?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        width,
        zIndex: 1000,
        borderRadius: '14px',
        padding: '6px',
        background: 'rgba(16, 20, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
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
            borderRadius: '9px',
            border: 'none',
            background: item.active ? 'rgba(79,142,247,0.12)' : 'transparent',
            color: item.active ? '#4f8ef7' : '#8b949e',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!item.active) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#e6edf3';
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
  );
};

// ---- Stats bar ----
const StatsBar = ({ pairs }: { pairs: Pair[] }) => {
  const totalVol = pairs.reduce((s, p) => s + (p.volume?.h24 || 0), 0);
  const totalTxns = pairs.reduce(
    (s, p) => s + (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
    0,
  );
  const stats = [
    { label: '24H VOLUME', value: fmtUsd(totalVol), icon: <BarChart3 size={15} />, color: '#4f8ef7' },
    { label: '24H TXNS', value: fmtNum(totalTxns), icon: <Activity size={15} />, color: '#00d97e' },
    { label: 'PAIRS LIVE', value: fmtNum(pairs.length), icon: <Droplets size={15} />, color: '#a371f7' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
        margin: '12px 16px',
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${s.color}28`,
            boxShadow: `0 0 0 1px ${s.color}10, inset 0 1px 0 ${s.color}10`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '11px',
              background: `${s.color}18`,
              border: `1px solid ${s.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 18px',
          borderRadius: '16px',
          background: 'rgba(0,217,126,0.05)',
          border: '1px solid rgba(0,217,126,0.2)',
          backdropFilter: 'blur(12px)',
          fontSize: '11px',
          color: '#00d97e',
          fontWeight: 700,
          letterSpacing: '0.06em',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span className="live-dot" />
        LIVE · 1S
      </div>
    </div>
  );
};

// ---- Ticker ----
const TokenTicker = ({ pairs }: { pairs: Pair[] }) => {
  const doubled = [...pairs.slice(0, 10), ...pairs.slice(0, 10)];
  return (
    <div
      style={{
        overflow: 'hidden',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        margin: '0 16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="animate-marquee"
        style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap', width: 'max-content' }}
      >
        {doubled.map((p, i) => {
          const chg = p.priceChange?.h24 ?? 0;
          const pos = chg >= 0;
          const color = CHAIN_COLOR[p.chainId] || '#484f58';
          return (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0 22px',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#e6edf3' }}>{p.baseToken?.symbol}</span>
              <span style={{ color: pos ? '#00d97e' : '#f04d4d', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {pos ? '+' : ''}{chg.toFixed(1)}%
              </span>
              <span style={{ color: '#484f58', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
                {fmtUsd(p.priceUsd)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---- Main Page ----
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
      if (!q.trim()) { fetchPairs(); return; }
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

  useEffect(() => { fetchPairs(); }, [fetchPairs]);
  useEffect(() => {
    const t = setInterval(() => fetchPairs(true), 1000);
    return () => clearInterval(t);
  }, [fetchPairs]);

  const getMockHistory = (pair: Pair) => {
    const chg = pair.priceChange?.h24 || 0;
    const base = parseFloat(pair.priceUsd) || 1;
    const history: number[] = [];
    let current = base / (1 + chg / 100);
    for (let i = 0; i < 12; i++) {
      current *= 1 + Math.random() * 0.04 - 0.02 + chg / 100 / 12;
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
    const nowMs = Date.now();
    let list = pairs.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          p.baseToken?.symbol?.toLowerCase().includes(q) ||
          p.baseToken?.name?.toLowerCase().includes(q) ||
          p.pairAddress?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (deepFilters.minLiquidity && (p.liquidity?.usd || 0) < parseFloat(deepFilters.minLiquidity)) return false;
      if (deepFilters.maxLiquidity && (p.liquidity?.usd || 0) > parseFloat(deepFilters.maxLiquidity)) return false;
      if (deepFilters.minMarketCap && (p.marketCap || 0) < parseFloat(deepFilters.minMarketCap)) return false;
      if (deepFilters.maxMarketCap && (p.marketCap || 0) > parseFloat(deepFilters.maxMarketCap)) return false;
      if (deepFilters.minFDV && (p.fdv || 0) < parseFloat(deepFilters.minFDV)) return false;
      if (deepFilters.maxFDV && (p.fdv || 0) > parseFloat(deepFilters.maxFDV)) return false;
      if (deepFilters.minAge) {
        const hours = (nowMs - (p.pairCreatedAt || 0)) / 3600000;
        if (hours < parseFloat(deepFilters.minAge)) return false;
      }
      if (deepFilters.maxAge) {
        const hours = (nowMs - (p.pairCreatedAt || 0)) / 3600000;
        if (hours > parseFloat(deepFilters.maxAge)) return false;
      }
      if (deepFilters.min24hVol && (p.volume?.h24 || 0) < parseFloat(deepFilters.min24hVol)) return false;
      if (deepFilters.max24hVol && (p.volume?.h24 || 0) > parseFloat(deepFilters.max24hVol)) return false;
      const chg = (p.priceChange as any)?.[timeKey] || 0;
      if (deepFilters.min24hChg && chg < parseFloat(deepFilters.min24hChg)) return false;
      if (deepFilters.max24hChg && chg > parseFloat(deepFilters.max24hChg)) return false;
      if (filter === 'new') {
        const ageMs = nowMs - (p.pairCreatedAt || 0);
        if (timeFilter === '5M' && ageMs > 5 * 60 * 1000) return false;
        if (timeFilter === '1H' && ageMs > 60 * 60 * 1000) return false;
        if (timeFilter === '6H' && ageMs > 6 * 60 * 60 * 1000) return false;
        if (timeFilter === '24H' && ageMs > 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: any = 0, valB: any = 0;
      if (sortKey === 'priceChange') { valA = (a.priceChange as any)?.[timeKey] || 0; valB = (b.priceChange as any)?.[timeKey] || 0; }
      else if (sortKey === 'price') { valA = parseFloat(a.priceUsd || '0'); valB = parseFloat(b.priceUsd || '0'); }
      else if (sortKey === 'age') { valA = a.pairCreatedAt || 0; valB = b.pairCreatedAt || 0; }
      else if (sortKey === 'txns') { valA = (a.txns?.h24?.buys || 0) + (a.txns?.h24?.sells || 0); valB = (b.txns?.h24?.buys || 0) + (b.txns?.h24?.sells || 0); }
      else if (sortKey === 'volume') { valA = a.volume?.h24 || 0; valB = b.volume?.h24 || 0; }
      else if (sortKey === 'liquidity') { valA = a.liquidity?.usd || 0; valB = b.liquidity?.usd || 0; }
      else if (sortKey === 'mcap') { valA = a.marketCap || 0; valB = b.marketCap || 0; }
      else if (['m5', 'h1', 'h6', 'h24'].includes(sortKey)) { valA = (a.priceChange as any)?.[sortKey] || 0; valB = (b.priceChange as any)?.[sortKey] || 0; }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [pairs, search, deepFilters, timeKey, filter, timeFilter, sortKey, sortOrder]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setActiveDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const NAV_TABS = [
    { id: 'top', label: 'Top', icon: <BarChart3 size={14} /> },
    { id: 'gainers', label: 'Gainers', icon: <TrendingUp size={14} /> },
    { id: 'new', label: 'New', icon: <Droplets size={14} /> },
    {
      id: 'profile',
      label: 'Profiles',
      icon: <Users size={14} />,
      hasDropdown: true,
      dropdownItems: [
        { label: 'All Profiles', onClick: () => setFilter('profile'), active: filter === 'profile' },
        { label: 'Token Creator', onClick: () => {}, icon: <Activity size={12} /> },
        { label: 'Top Holders', onClick: () => {}, icon: <Users size={12} /> },
      ],
    },
    {
      id: 'boosted',
      label: 'Boosted',
      icon: <Zap size={14} />,
      hasDropdown: true,
      dropdownItems: [
        { label: 'Active Boosted', onClick: () => setFilter('boosted'), active: filter === 'boosted' },
        { label: 'Most Boosted', onClick: () => {}, icon: <TrendingUp size={12} /> },
        { label: 'Recently Ended', onClick: () => {}, icon: <Clock size={12} /> },
      ],
    },
  ];

  const TABLE_COLS = '48px 1fr 108px 96px 88px 72px 76px 76px 76px 76px 96px 96px';

  const SortHeader = ({
    label,
    colKey,
    icon,
  }: {
    label: string;
    colKey: string;
    icon?: React.ReactNode;
  }) => {
    const active = sortKey === colKey;
    return (
      <span
        onClick={() => {
          if (active) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          else { setSortKey(colKey); setSortOrder('desc'); }
        }}
        style={{
          display: 'inline-flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          color: active ? '#4f8ef7' : colKey === timeKey ? '#e6edf3' : '#484f58',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          userSelect: 'none',
          transition: 'color 0.2s',
        }}
      >
        {icon}
        {label}
        {active && <span style={{ fontSize: '9px', marginLeft: '1px' }}>{sortOrder === 'desc' ? '▼' : '▲'}</span>}
      </span>
    );
  };

  return (
    <div
      className="premium-bg"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#e6edf3', position: 'relative', overflow: 'hidden' }}
      onClick={() => setActiveDropdown(null)}
    >
      {/* Background glow orbs */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(163,113,247,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Functional contract components — hidden */}
      <ContractLayout />

      <DexNav />

      <div style={{ display: 'flex', flex: 1, paddingTop: '60px', position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <DexSidebar selectedChain={selectedChain} onChainSelect={setSelectedChain} />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Ticker */}
          <div style={{ margin: '12px 16px 0 16px' }}>
            <TokenTicker pairs={pairs} />
          </div>

          {/* Stats bar */}
          <StatsBar pairs={pairs} />

          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              margin: '0 16px 14px 16px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            {/* Time dropdown */}
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'time' ? null : 'time')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(79,142,247,0.3)',
                  background: 'rgba(79,142,247,0.12)',
                  color: '#4f8ef7',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: '0 0 20px rgba(79,142,247,0.08)',
                }}
              >
                <Clock size={14} />
                {timeFilter}
                <ChevronDown
                  size={12}
                  style={{ transform: activeDropdown === 'time' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
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
                width="160px"
              />
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

            {/* Trending + timeframe pill group */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                padding: '3px',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.06)',
                gap: '2px',
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
                  borderRadius: '7px',
                  background: filter === 'trending' ? 'rgba(255,165,0,0.15)' : 'transparent',
                  color: filter === 'trending' ? '#ffab40' : '#8b949e',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Flame size={13} color={filter === 'trending' ? '#ffab40' : 'currentColor'} />
                Trending
              </button>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px',
                  borderRadius: '6px',
                  marginLeft: '4px',
                }}
              >
                {['5M', '1H', '6H', '24H'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    style={{
                      padding: '4px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      background: timeFilter === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: timeFilter === t ? '#ffffff' : '#484f58',
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

            {/* Nav tabs */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {NAV_TABS.map((t) => {
                const isActive = filter === t.id;
                const isDropdownOpen = activeDropdown === (t.id as any);
                return (
                  <div
                    key={t.id}
                    style={{ position: 'relative' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        if (t.hasDropdown) {
                          setActiveDropdown(isDropdownOpen ? null : (t.id as any));
                        } else {
                          setFilter(t.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 13px',
                        borderRadius: '9px',
                        border: `1px solid ${isActive || isDropdownOpen ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: isActive || isDropdownOpen ? '#ffffff' : '#8b949e',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = '#c9d1d9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#8b949e';
                        }
                      }}
                    >
                      {t.icon}
                      {t.label}
                      {t.hasDropdown && (
                        <ChevronDown
                          size={11}
                          style={{
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                            opacity: 0.5,
                          }}
                        />
                      )}
                    </button>
                    {t.hasDropdown && (
                      <DropdownMenu
                        isOpen={isDropdownOpen}
                        onClose={() => setActiveDropdown(null)}
                        items={(t as any).dropdownItems || []}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
              <button
                onClick={() => setShowFilters(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 13px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#8b949e',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>

              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#484f58', pointerEvents: 'none' }}
                />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search pairs…"
                  style={{
                    padding: '8px 12px 8px 32px',
                    fontSize: '12px',
                    width: '190px',
                    height: '34px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '9px',
                    color: '#e6edf3',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              margin: '0 16px 16px 16px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLS,
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'sticky',
                top: 0,
                background: 'rgba(11,14,17,0.92)',
                backdropFilter: 'blur(16px)',
                zIndex: 10,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, paddingLeft: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>#</span>
              <span style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>TOKEN</span>
              <SortHeader label="Price" colKey="price" icon={<DollarSign size={9} />} />
              <SortHeader label="Chart" colKey="chart_m5" icon={<Activity size={9} />} />
              <SortHeader label="Txns" colKey="txns" icon={<Activity size={9} />} />
              <SortHeader label="Vol" colKey="volume" icon={<BarChart3 size={9} />} />
              <SortHeader label="5M" colKey="m5" />
              <SortHeader label="1H" colKey="h1" />
              <SortHeader label="6H" colKey="h6" />
              <SortHeader label="24H" colKey="h24" />
              <SortHeader label="Liq" colKey="liquidity" icon={<Droplets size={9} />} />
              <SortHeader label="FDV" colKey="mcap" icon={<Users size={9} />} />
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: '80px 20px', textAlign: 'center', color: '#484f58' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '3px solid rgba(79,142,247,0.15)',
                    borderTopColor: '#4f8ef7',
                    animation: 'spin 0.9s linear infinite',
                    margin: '0 auto 16px',
                  }}
                />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#8b949e' }}>Loading market data…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filteredPairs.length === 0 ? (
              <div style={{ padding: '80px 20px', textAlign: 'center', color: '#484f58' }}>
                <Star size={32} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#8b949e' }}>No tokens match your filters</div>
              </div>
            ) : (
              filteredPairs.map((p, i) => {
                const history = getMockHistory(p);
                const pos = (p.priceChange?.h24 || 0) >= 0;
                const sparkColor = pos ? '#00d97e' : '#f04d4d';
                const chainColor = CHAIN_COLOR[p.chainId] || '#484f58';
                const isHovered = hoveredRow === p.pairAddress;

                return (
                  <div
                    key={p.pairAddress + i}
                    onClick={() => router.push(`/tokens/${p.chainId}/${p.pairAddress}`)}
                    onMouseEnter={() => setHoveredRow(p.pairAddress)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TABLE_COLS,
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      alignItems: 'center',
                      background: isHovered ? 'rgba(255,255,255,0.03)' : i % 2 === 0 ? 'rgba(255,255,255,0.008)' : 'transparent',
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* Left accent on hover */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: chainColor,
                          borderRadius: '0 3px 3px 0',
                          boxShadow: `0 0 12px ${chainColor}80`,
                        }}
                      />
                    )}

                    {/* Rank */}
                    <span style={{ fontSize: '12px', color: '#484f58', fontWeight: 700, paddingLeft: '6px' }}>
                      {i + 1}
                    </span>

                    {/* Token info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
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
                              border: `1px solid ${chainColor}40`,
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${chainColor}30 0%, #0b0e11 100%)`,
                              border: `1px solid ${chainColor}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                              color: chainColor,
                              textTransform: 'uppercase',
                            }}
                          >
                            {(p.baseToken?.symbol || '?').substring(0, 1)}
                          </div>
                        )}
                        {/* Chain micro-badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: 14,
                            height: 14,
                            borderRadius: '4px',
                            background: chainColor,
                            border: '2px solid #0b0e11',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '7px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.chainId?.[0]}
                        </div>
                      </div>

                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: '#ffffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.baseToken?.symbol}
                          </span>
                          <span style={{ color: '#484f58', fontSize: '11px' }}>/{p.quoteToken?.symbol}</span>
                          {p.boosts?.active ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '9px',
                                fontWeight: 800,
                                color: '#000',
                                background: '#d29922',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              <Zap size={9} fill="currentColor" />
                              {p.boosts.active}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: '10px', color: '#484f58', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{p.dexId}</span>
                          <span style={{ opacity: 0.3 }}>·</span>
                          <ChainBadge chain={p.chainId} />
                          <span style={{ opacity: 0.3 }}>·</span>
                          <span style={{ color: '#6e7681' }}>{fmtAge(p.pairCreatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: pos ? '#00d97e' : '#f04d4d',
                      }}
                    >
                      {fmtUsd(p.priceUsd)}
                    </div>

                    {/* Sparkline */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Sparkline data={history} color={sparkColor} />
                    </div>

                    {/* Txns */}
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#8b949e', fontWeight: 500 }}>
                      {fmtNum((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0))}
                    </div>

                    {/* Volume */}
                    <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#8b949e', fontWeight: 500 }}>
                      {fmtUsd(p.volume?.h24)}
                    </div>

                    {/* 5M / 1H / 6H / 24H */}
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.m5} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h1} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h6} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h24} /></div>

                    {/* Liquidity */}
                    <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#6e7681' }}>
                      {fmtUsd(p.liquidity?.usd)}
                    </div>

                    {/* MCap */}
                    <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#6e7681' }}>
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
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowFilters(false)}
        >
          <div
            style={{
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              position: 'relative',
              margin: '20px',
              background: 'rgba(16,20,26,0.96)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(24px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'rgba(79,142,247,0.15)',
                    border: '1px solid rgba(79,142,247,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SlidersHorizontal size={16} color="#4f8ef7" />
                </div>
                Filter Pairs
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8b949e',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b949e'; }}
              >
                ✕
              </button>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '8px' }}
              className="custom-scrollbar"
            >
              {[
                { label: 'Liquidity ($)', keys: ['minLiquidity', 'maxLiquidity'], icon: <Droplets size={13} />, color: '#4f8ef7' },
                { label: 'Market Cap ($)', keys: ['minMarketCap', 'maxMarketCap'], icon: <BarChart3 size={13} />, color: '#a371f7' },
                { label: 'FDV ($)', keys: ['minFDV', 'maxFDV'], icon: <DollarSign size={13} />, color: '#00d97e' },
                { label: 'Age (hours)', keys: ['minAge', 'maxAge'], icon: <Clock size={13} />, color: '#d29922' },
                { label: '24H Volume ($)', keys: ['min24hVol', 'max24hVol'], icon: <Activity size={13} />, color: '#f04d4d' },
              ].map((f) => (
                <div key={f.label}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: f.color,
                      marginBottom: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    {f.icon}
                    {f.label}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[0, 1].map((idx) => (
                      <input
                        key={idx}
                        type="number"
                        placeholder={idx === 0 ? 'Min' : 'Max'}
                        value={(deepFilters as any)[f.keys[idx]]}
                        onChange={(e) => setDeepFilters((prev) => ({ ...prev, [f.keys[idx]]: e.target.value }))}
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.4)',
                          border: `1px solid ${f.color}25`,
                          borderRadius: '10px',
                          color: '#e6edf3',
                          padding: '10px 14px',
                          fontSize: '13px',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = `${f.color}60`)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = `${f.color}25`)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() =>
                  setDeepFilters({
                    minLiquidity: '', maxLiquidity: '', minMarketCap: '', maxMarketCap: '',
                    minFDV: '', maxFDV: '', minAge: '', maxAge: '',
                    min24hVol: '', max24hVol: '', min24hChg: '', max24hChg: '',
                  })
                }
                style={{
                  flex: 1,
                  height: '46px',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8b949e'; }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  flex: 2,
                  height: '46px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 20px rgba(79,142,247,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
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
