import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { ContractLayout } from '../components/contract';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useIsMobile } from '../hooks';
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
  const height = 36;
  const width = 88;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));
  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `sg-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-path"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
};

// ---- Pct badge ----
const PctBadge = ({ v }: { v: number }) => {
  if (v == null || isNaN(v))
    return <span style={{ color: '#484f58', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>–</span>;
  const pos = v >= 0;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '4px 8px',
        borderRadius: '7px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        background: pos ? 'rgba(0,217,126,0.1)' : 'rgba(240,77,77,0.1)',
        color: pos ? '#00d97e' : '#f04d4d',
        letterSpacing: '0.01em',
        border: `1px solid ${pos ? 'rgba(0,217,126,0.18)' : 'rgba(240,77,77,0.18)'}`,
        boxShadow: pos ? '0 0 8px rgba(0,217,126,0.08)' : '0 0 8px rgba(240,77,77,0.08)',
        whiteSpace: 'nowrap',
      }}
    >
      {pos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
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
        background: `${color}18`,
        color,
        border: `1px solid ${color}45`,
        fontSize: '9px',
        fontWeight: 800,
        padding: '2px 7px',
        borderRadius: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
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
      className="modal-enter"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        width,
        zIndex: 1000,
        borderRadius: '14px',
        padding: '6px',
        background: 'rgba(13,17,22,0.98)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
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
    {
      label: '24H Volume',
      value: fmtUsd(totalVol),
      subLabel: 'Total traded',
      icon: <BarChart3 size={20} />,
      color: '#4f8ef7',
    },
    {
      label: '24H Transactions',
      value: fmtNum(totalTxns),
      subLabel: 'Buys & sells',
      icon: <Activity size={20} />,
      color: '#00d97e',
    },
    {
      label: 'Pairs Live',
      value: fmtNum(pairs.length),
      subLabel: 'Active markets',
      icon: <Droplets size={20} />,
      color: '#a371f7',
    },
  ];

  return (
    <div
      className="stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        gap: '8px',
        padding: '0 10px',
        margin: '8px 10px',
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderTop: `2px solid ${s.color}70`,
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${s.color}20`;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`;
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '14px',
              background: `${s.color}14`,
              border: `1px solid ${s.color}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color,
              flexShrink: 0,
              boxShadow: `0 0 20px ${s.color}20`,
            }}
          >
            {s.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '10px',
                color: '#484f58',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                marginBottom: '5px',
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#ffffff',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '10px', color: '#484f58', marginTop: '4px', fontWeight: 500 }}>
              {s.subLabel}
            </div>
          </div>
        </div>
      ))}

      {/* Live badge */}
      <div
        className="stats-grid-live"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '16px 22px',
          borderRadius: '16px',
          background: 'rgba(0,217,126,0.05)',
          border: '1px solid rgba(0,217,126,0.15)',
          borderTop: '2px solid rgba(0,217,126,0.5)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 0 20px rgba(0,217,126,0.05)',
          flexShrink: 0,
          minWidth: 90,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#00d97e',
            boxShadow: '0 0 0 3px rgba(0,217,126,0.2), 0 0 16px rgba(0,217,126,0.5)',
            animation: 'pulse-dot 1.8s infinite',
          }}
        />
        <div style={{ fontSize: '12px', color: '#00d97e', fontWeight: 900, letterSpacing: '0.1em' }}>
          LIVE
        </div>
        <div style={{ fontSize: '10px', color: '#484f58', fontWeight: 600 }}>1s refresh</div>
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
        position: 'relative',
        overflow: 'hidden',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        margin: '0 16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Left label */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          background: 'linear-gradient(90deg, rgba(11,14,17,1) 70%, transparent 100%)',
          gap: '7px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00d97e',
            boxShadow: '0 0 8px #00d97e',
            display: 'inline-block',
            animation: 'pulse-dot 1.8s infinite',
          }}
        />
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color: '#00d97e',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Live
        </span>
      </div>

      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(90deg, transparent, rgba(11,14,17,0.95))',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* Ticker content */}
      <div style={{ paddingLeft: '80px', overflow: 'hidden', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div
          className="animate-marquee"
          style={{ display: 'flex', gap: '0', whiteSpace: 'nowrap', width: 'max-content', alignItems: 'center' }}
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
                  gap: '8px',
                  padding: '0 20px',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '12px',
                  fontWeight: 600,
                  height: '40px',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: '#c9d1d9', fontWeight: 700 }}>{p.baseToken?.symbol}</span>
                <span
                  style={{
                    color: pos ? '#00d97e' : '#f04d4d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {pos ? '▲' : '▼'}{pos ? '+' : ''}{chg.toFixed(1)}%
                </span>
                <span
                  style={{
                    color: '#484f58',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {fmtUsd(p.priceUsd)}
                </span>
              </span>
            );
          })}
        </div>
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
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  useEffect(() => {
    const handler = () => setActiveDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const NAV_TABS = [
    { id: 'top', label: 'Top', icon: <BarChart3 size={13} /> },
    { id: 'gainers', label: 'Gainers', icon: <TrendingUp size={13} /> },
    { id: 'new', label: 'New', icon: <Droplets size={13} /> },
    {
      id: 'profile',
      label: 'Profiles',
      icon: <Users size={13} />,
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
      icon: <Zap size={13} />,
      hasDropdown: true,
      dropdownItems: [
        { label: 'Active Boosted', onClick: () => setFilter('boosted'), active: filter === 'boosted' },
        { label: 'Most Boosted', onClick: () => {}, icon: <TrendingUp size={12} /> },
        { label: 'Recently Ended', onClick: () => {}, icon: <Clock size={12} /> },
      ],
    },
  ];

  const TABLE_COLS = '52px 1fr 116px 100px 88px 72px 76px 76px 76px 80px 96px 96px';

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
          color: active ? '#4f8ef7' : colKey === timeKey ? '#c9d1d9' : '#484f58',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          userSelect: 'none',
          transition: 'color 0.2s',
          padding: '2px 4px',
          borderRadius: '4px',
          background: active ? 'rgba(79,142,247,0.08)' : 'transparent',
        }}
        onMouseOver={(e) => { if (!active) e.currentTarget.style.color = '#8b949e'; }}
        onMouseOut={(e) => { if (!active) e.currentTarget.style.color = colKey === timeKey ? '#c9d1d9' : '#484f58'; }}
      >
        {icon}
        {label}
        {active && (
          <span style={{ fontSize: '9px', marginLeft: '1px', color: '#4f8ef7' }}>
            {sortOrder === 'desc' ? '▼' : '▲'}
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#e6edf3',
        position: 'relative',
        overflow: 'hidden',
        background: '#0b0e11',
      }}
      onClick={() => setActiveDropdown(null)}
    >
      {/* Atmospheric background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)',
          }}
        />
        {/* Blue orb top-left */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-8%',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 65%)',
          }}
        />
        {/* Purple orb bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            right: '-8%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(163,113,247,0.07) 0%, transparent 65%)',
          }}
        />
        {/* Green orb mid-right */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '20%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0,217,126,0.04) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* Hidden logic components */}
      <ContractLayout />

      <DexNav onMobileSidebarToggle={() => setMobileSidebarOpen((p) => !p)} />

      <div style={{ display: 'flex', flex: 1, paddingTop: '60px', position: 'relative', zIndex: 1 }}>
        {/* Sidebar */}
        <DexSidebar
          selectedChain={selectedChain}
          onChainSelect={setSelectedChain}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden', minWidth: 0 }}>

          {/* Live ticker */}
          <div style={{ margin: isMobile ? '8px 10px 0' : '12px 16px 0' }}>
            <TokenTicker pairs={pairs} />
          </div>

          {/* Stats */}
          <div className="stats-grid-wrapper">
            <StatsBar pairs={pairs} />
          </div>

          {/* ===== FILTER BAR ===== */}
          <div
            className="filter-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              margin: '0 10px 10px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch' as any,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
            } as React.CSSProperties}
          >
            {/* Time dropdown */}
            <div style={{ position: 'relative', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'time' ? null : 'time')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(79,142,247,0.35)',
                  background: 'rgba(79,142,247,0.1)',
                  color: '#4f8ef7',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: '0 0 16px rgba(79,142,247,0.1)',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(79,142,247,0.18)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(79,142,247,0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(79,142,247,0.1)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(79,142,247,0.1)'; }}
              >
                <Clock size={13} />
                {timeFilter}
                <ChevronDown
                  size={11}
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

            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

            {/* Trending + timeframes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
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
                  gap: '5px',
                  padding: '5px 11px',
                  border: 'none',
                  borderRadius: '7px',
                  background: filter === 'trending'
                    ? 'rgba(255,171,64,0.15)'
                    : 'transparent',
                  color: filter === 'trending' ? '#ffab40' : '#8b949e',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: filter === 'trending' ? '0 0 16px rgba(255,171,64,0.15)' : 'none',
                }}
              >
                <Flame size={12} color={filter === 'trending' ? '#ffab40' : 'currentColor'} />
                Trending
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px',
                  borderRadius: '6px',
                  marginLeft: '2px',
                }}
              >
                {['5M', '1H', '6H', '24H'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    style={{
                      padding: '4px 9px',
                      border: 'none',
                      borderRadius: '4px',
                      background: timeFilter === t ? 'rgba(255,255,255,0.14)' : 'transparent',
                      color: timeFilter === t ? '#ffffff' : '#484f58',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: timeFilter === t ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Nav tabs */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
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
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '9px',
                        border: `1px solid ${isActive ? 'rgba(0,217,126,0.25)' : isDropdownOpen ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                        background: isActive
                          ? 'rgba(0,217,126,0.1)'
                          : isDropdownOpen
                          ? 'rgba(255,255,255,0.06)'
                          : 'transparent',
                        color: isActive ? '#00d97e' : isDropdownOpen ? '#ffffff' : '#8b949e',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 0 16px rgba(0,217,126,0.12)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !isDropdownOpen) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.color = '#c9d1d9';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !isDropdownOpen) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#8b949e';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      {t.icon}
                      {t.label}
                      {t.hasDropdown && (
                        <ChevronDown
                          size={10}
                          style={{
                            transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                            opacity: 0.6,
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

            {/* Right: Filters + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
              <button
                onClick={() => setShowFilters(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#8b949e',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#e6edf3';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8b949e';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                }}
              >
                <SlidersHorizontal size={13} />
                Filters
              </button>

              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#484f58',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search pairs…"
                  style={{
                    padding: '7px 12px 7px 32px',
                    fontSize: '12px',
                    width: '200px',
                    height: '34px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '9px',
                    color: '#e6edf3',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(79,142,247,0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* ===== TOKEN TABLE ===== */}
          <div
            style={{
              flex: isMobile ? 'none' : 1,
              overflowY: isMobile ? 'visible' : 'auto',
              margin: '0 10px 10px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.015)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
              position: 'relative',
            }}
            className="custom-scrollbar"
          >
          {/* Mobile: mini header */}
          {isMobile && !loading && filteredPairs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '22px 36px 1fr 80px 88px', gap: '10px', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,12,16,0.95)', position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(12px)' }}>
              <span style={{ fontSize: '9px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>#</span>
              <span />
              <span style={{ fontSize: '9px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Token</span>
              <span style={{ fontSize: '9px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Price</span>
              <span style={{ fontSize: '9px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Chart</span>
            </div>
          )}

          {/* Mobile card rows */}
          {isMobile && (
            loading ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,217,126,0.15)', borderTopColor: '#00d97e', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
                <div style={{ color: '#484f58', fontSize: '13px' }}>Loading…</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : filteredPairs.length === 0 ? (
              <div style={{ padding: '60px 16px', textAlign: 'center' }}>
                <Star size={36} style={{ color: '#484f58', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ color: '#484f58', fontSize: '13px' }}>No tokens match your filters</div>
              </div>
            ) : filteredPairs.map((p, i) => {
              const pos = (p.priceChange?.[timeKey as keyof typeof p.priceChange] || 0) >= 0;
              const chainColor = CHAIN_COLOR[p.chainId] || '#484f58';
              const history = getMockHistory(p);
              return (
                <div
                  key={p.pairAddress + i}
                  onClick={() => router.push(`/tokens/${p.chainId}/${p.pairAddress}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.007)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onTouchStart={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onTouchEnd={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.007)' : 'transparent'; }}
                >
                  <span style={{ width: 22, textAlign: 'center', fontSize: '11px', color: '#484f58', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                    {p.info?.imageUrl ? (
                      <img src={p.info.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${chainColor}40` }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `linear-gradient(135deg,${chainColor}30,#0b0e11)`, border: `2px solid ${chainColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: chainColor, textTransform: 'uppercase' }}>
                        {(p.baseToken?.symbol || '?').charAt(0)}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '4px', background: chainColor, border: '2px solid #0b0e11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
                      {p.chainId?.[0]}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{p.baseToken?.symbol}</span>
                      {p.boosts?.active ? <span style={{ fontSize: '9px', fontWeight: 900, color: '#000', background: 'linear-gradient(135deg,#f0b94d,#d29922)', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>⚡{p.boosts.active}</span> : null}
                    </div>
                    <div style={{ fontSize: '10px', color: '#484f58', display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dexId}</span>
                      <span>·</span>
                      <span style={{ color: chainColor, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', flexShrink: 0 }}>{CHAIN_LABEL[p.chainId] || p.chainId?.slice(0,3)}</span>
                      <span>·</span>
                      <span style={{ flexShrink: 0 }}>{fmtAge(p.pairCreatedAt)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '68px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: pos ? '#00d97e' : '#f04d4d', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{fmtUsd(p.priceUsd)}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 5px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: pos ? 'rgba(0,217,126,0.1)' : 'rgba(240,77,77,0.1)', color: pos ? '#00d97e' : '#f04d4d', marginTop: '2px', whiteSpace: 'nowrap' }}>
                      {pos ? '▲' : '▼'}{pos ? '+' : ''}{((p.priceChange as any)?.[timeKey] || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <Sparkline data={history} color={pos ? '#00d97e' : '#f04d4d'} />
                  </div>
                </div>
              );
            })
          )}

          {/* Desktop full table */}
          {!isMobile && (<div className="scroll-x"><div style={{ minWidth: '800px' }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: TABLE_COLS,
                padding: '13px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'sticky',
                top: 0,
                background: 'rgba(9,12,16,0.95)',
                backdropFilter: 'blur(20px)',
                zIndex: 10,
                alignItems: 'center',
                boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: '#484f58',
                  fontWeight: 700,
                  paddingLeft: '6px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                #
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: '#484f58',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Token
              </span>
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

            {/* ---- LOADING ---- */}
            {loading ? (
              <div style={{ padding: '0' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TABLE_COLS,
                      padding: '16px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      gap: '0',
                      opacity: 1 - i * 0.1,
                    }}
                  >
                    <div className="skeleton" style={{ width: '22px', height: '14px', marginLeft: '6px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="skeleton" style={{ width: '80px', height: '12px' }} />
                        <div className="skeleton" style={{ width: '50px', height: '10px' }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ width: '70px', height: '13px', marginLeft: 'auto' }} />
                    <div className="skeleton" style={{ width: '80px', height: '32px', marginLeft: 'auto', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ width: '44px', height: '13px', marginLeft: 'auto' }} />
                    <div className="skeleton" style={{ width: '44px', height: '13px', marginLeft: 'auto' }} />
                    <div className="skeleton" style={{ width: '52px', height: '22px', marginLeft: 'auto', borderRadius: '7px' }} />
                    <div className="skeleton" style={{ width: '52px', height: '22px', marginLeft: 'auto', borderRadius: '7px' }} />
                    <div className="skeleton" style={{ width: '52px', height: '22px', marginLeft: 'auto', borderRadius: '7px' }} />
                    <div className="skeleton" style={{ width: '52px', height: '22px', marginLeft: 'auto', borderRadius: '7px' }} />
                    <div className="skeleton" style={{ width: '58px', height: '13px', marginLeft: 'auto' }} />
                    <div className="skeleton" style={{ width: '58px', height: '13px', marginLeft: 'auto' }} />
                  </div>
                ))}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>

            ) : filteredPairs.length === 0 ? (
              <div
                style={{
                  padding: '100px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div className="float-icon">
                  <Star
                    size={44}
                    style={{ color: '#484f58', opacity: 0.4, filter: 'drop-shadow(0 0 12px rgba(163,113,247,0.3))' }}
                  />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#8b949e' }}>
                  No tokens match your filters
                </div>
                <div style={{ fontSize: '13px', color: '#484f58' }}>
                  Try adjusting your search or filter criteria
                </div>
              </div>

            ) : (
              filteredPairs.map((p, i) => {
                const history = getMockHistory(p);
                const pos = (p.priceChange?.h24 || 0) >= 0;
                const sparkColor = pos ? '#00d97e' : '#f04d4d';
                const chainColor = CHAIN_COLOR[p.chainId] || '#484f58';
                const isHovered = hoveredRow === p.pairAddress;
                const isTop3 = i < 3;

                return (
                  <div
                    key={p.pairAddress + i}
                    onClick={() => router.push(`/tokens/${p.chainId}/${p.pairAddress}`)}
                    onMouseEnter={() => setHoveredRow(p.pairAddress)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TABLE_COLS,
                      padding: '13px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.035)',
                      cursor: 'pointer',
                      alignItems: 'center',
                      background: isHovered
                        ? `linear-gradient(90deg, ${chainColor}08 0%, rgba(255,255,255,0.025) 40%)`
                        : i % 2 === 0
                        ? 'rgba(255,255,255,0.007)'
                        : 'transparent',
                      transition: 'background 0.18s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Hover accent bar */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: `linear-gradient(180deg, ${chainColor} 0%, ${chainColor}60 100%)`,
                          borderRadius: '0 3px 3px 0',
                          boxShadow: `0 0 16px ${chainColor}60`,
                        }}
                      />
                    )}

                    {/* Rank */}
                    <span
                      style={{
                        paddingLeft: '6px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {isTop3 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: '6px',
                            background: i === 0
                              ? 'rgba(210,153,34,0.2)'
                              : i === 1
                              ? 'rgba(180,180,180,0.15)'
                              : 'rgba(180,100,60,0.15)',
                            color: i === 0 ? '#d29922' : i === 1 ? '#b0b0b0' : '#b4643c',
                            fontSize: '11px',
                            fontWeight: 900,
                            border: `1px solid ${i === 0 ? 'rgba(210,153,34,0.3)' : i === 1 ? 'rgba(180,180,180,0.2)' : 'rgba(180,100,60,0.2)'}`,
                          }}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#484f58', fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      )}
                    </span>

                    {/* Token info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          position: 'relative',
                          width: 38,
                          height: 38,
                          flexShrink: 0,
                          transition: 'transform 0.2s',
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
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
                              border: `2px solid ${isHovered ? chainColor + '80' : chainColor + '35'}`,
                              transition: 'border-color 0.2s',
                              boxShadow: isHovered ? `0 0 12px ${chainColor}40` : 'none',
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${chainColor}35 0%, #0b0e11 100%)`,
                              border: `2px solid ${isHovered ? chainColor + '70' : chainColor + '30'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '14px',
                              color: chainColor,
                              textTransform: 'uppercase',
                              transition: 'border-color 0.2s, box-shadow 0.2s',
                              boxShadow: isHovered ? `0 0 14px ${chainColor}30` : 'none',
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
                            width: 15,
                            height: 15,
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
                            boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
                          }}
                        >
                          {p.chainId?.[0]}
                        </div>
                      </div>

                      {/* Token text */}
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '13px',
                              color: isHovered ? '#ffffff' : '#e6edf3',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.15s',
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {p.baseToken?.symbol}
                          </span>
                          <span style={{ color: '#30363d', fontSize: '11px', flexShrink: 0 }}>
                            /{p.quoteToken?.symbol}
                          </span>
                          {p.boosts?.active ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '9px',
                                fontWeight: 900,
                                color: '#000',
                                background: 'linear-gradient(135deg, #f0b94d, #d29922)',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                flexShrink: 0,
                                boxShadow: '0 0 8px rgba(210,153,34,0.4)',
                              }}
                            >
                              <Zap size={8} fill="currentColor" />
                              {p.boosts.active}
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#484f58',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{p.dexId}</span>
                          <span style={{ opacity: 0.25 }}>·</span>
                          <ChainBadge chain={p.chainId} />
                          <span style={{ opacity: 0.25 }}>·</span>
                          <span style={{ color: '#6e7681', fontWeight: 500 }}>{fmtAge(p.pairCreatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: pos ? '#00d97e' : '#f04d4d',
                        letterSpacing: '-0.01em',
                        textShadow: pos
                          ? '0 0 12px rgba(0,217,126,0.25)'
                          : '0 0 12px rgba(240,77,77,0.25)',
                      }}
                    >
                      {fmtUsd(p.priceUsd)}
                    </div>

                    {/* Sparkline */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Sparkline data={history} color={sparkColor} />
                    </div>

                    {/* Txns */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#6e7681',
                        fontWeight: 600,
                      }}
                    >
                      {fmtNum((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0))}
                    </div>

                    {/* Volume */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#6e7681',
                        fontWeight: 600,
                      }}
                    >
                      {fmtUsd(p.volume?.h24)}
                    </div>

                    {/* 5M / 1H / 6H / 24H */}
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.m5} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h1} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h6} /></div>
                    <div style={{ textAlign: 'right' }}><PctBadge v={p.priceChange?.h24} /></div>

                    {/* Liquidity */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#6e7681',
                        fontWeight: 600,
                      }}
                    >
                      {fmtUsd(p.liquidity?.usd)}
                    </div>

                    {/* MCap / FDV */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                        color: '#6e7681',
                        fontWeight: 600,
                      }}
                    >
                      {fmtUsd(p.marketCap)}
                    </div>
                  </div>
                );
              })
            )}
          </div></div>)}
          </div>
        </div>
      </div>

      {/* ===== FILTER MODAL ===== */}
      {showFilters && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowFilters(false)}
        >
          <div
            className="modal-enter"
            style={{
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              position: 'relative',
              margin: '20px',
              background: 'rgba(13,17,23,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
              backdropFilter: 'blur(30px)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #4f8ef7, #a371f7)',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  letterSpacing: '-0.3px',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '11px',
                    background: 'rgba(79,142,247,0.12)',
                    border: '1px solid rgba(79,142,247,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(79,142,247,0.15)',
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b949e'; }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxHeight: '55vh',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
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
                        onChange={(e) =>
                          setDeepFilters((prev) => ({ ...prev, [f.keys[idx]]: e.target.value }))
                        }
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.45)',
                          border: `1px solid ${f.color}22`,
                          borderRadius: '10px',
                          color: '#e6edf3',
                          padding: '10px 14px',
                          fontSize: '13px',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = `${f.color}55`;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${f.color}10`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = `${f.color}22`;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
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
                  fontWeight: 700,
                  fontSize: '13px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#8b949e',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8b949e'; }}
              >
                Reset All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  flex: 2,
                  height: '46px',
                  fontSize: '14px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 8px 24px rgba(79,142,247,0.35)',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,142,247,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,142,247,0.35)'; }}
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
