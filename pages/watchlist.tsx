import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { useIsMobile } from '../hooks';

interface WatchedPair {
  chainId: string;
  pairAddress: string;
  symbol: string;
  priceUsd?: string;
  priceChange24h?: number;
}

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

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchedPair[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dex_watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) return;

    const updatePrices = async () => {
      const updated = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const res = await fetch(
              `/api/dex/pair?chainId=${item.chainId}&pairAddress=${item.pairAddress}`,
            );
            const json = await res.json();
            if (json.success && json.data) {
              return {
                ...item,
                priceUsd: json.data.priceUsd,
                priceChange24h: json.data.priceChange?.h24,
              };
            }
          } catch (e) {
            console.error('Update price error:', e);
          }
          return item;
        }),
      );
      setWatchlist(updated);
    };

    const interval = setInterval(updatePrices, 1000);
    updatePrices();
    return () => clearInterval(interval);
  }, [watchlist.length]);

  const removeFromWatchlist = (pairAddress: string) => {
    const next = watchlist.filter((w) => w.pairAddress !== pairAddress);
    setWatchlist(next);
    localStorage.setItem('dex_watchlist', JSON.stringify(next));
  };

  return (
    <div
      className="premium-bg"
      style={{ minHeight: '100vh', color: '#e6edf3', position: 'relative', overflow: 'hidden' }}
    >
      <Head>
        <title>Watchlist | NexSwap</title>
      </Head>

      {/* Background orbs */}
      <div
        style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: '-10%', right: '-5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(0,217,126,0.04) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <DexNav onMobileSidebarToggle={() => setMobileSidebarOpen((p) => !p)} />

      <div style={{ display: 'flex', paddingTop: '60px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <DexSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <main
          style={{ flex: 1, padding: isMobile ? '16px 12px' : '28px', overflowY: 'auto', minWidth: 0 }}
          className="custom-scrollbar"
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="page-enter">
            {/* Page header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    margin: '0 0 6px 0',
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #8b949e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Watchlist
                </h1>
                <p style={{ color: '#484f58', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                  Track your favorite tokens in real-time
                </p>
              </div>
              <Link
                href="/tokens"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0,217,126,0.1)',
                  color: '#00d97e',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1px solid rgba(0,217,126,0.25)',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseOver={(e: any) => {
                  e.currentTarget.style.background = 'rgba(0,217,126,0.18)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,217,126,0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e: any) => {
                  e.currentTarget.style.background = 'rgba(0,217,126,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Tokens
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 40, height: 40,
                    borderRadius: '50%',
                    border: '3px solid rgba(0,217,126,0.15)',
                    borderTopColor: '#00d97e',
                    animation: 'spin 0.9s linear infinite',
                    margin: '0 auto 16px',
                  }}
                />
                <div style={{ color: '#484f58', fontSize: '14px', fontWeight: 500 }}>Loading your watchlist…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : watchlist.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '80px 40px',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="float-icon" style={{ fontSize: '52px', marginBottom: '20px', display: 'block' }}>⭐</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#e6edf3' }}>
                  Your Watchlist is Empty
                </h2>
                <p style={{ color: '#484f58', marginBottom: '28px', fontSize: '14px' }}>
                  Click the star icon on any token page to add it here.
                </p>
                <Link
                  href="/tokens"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #00d97e 0%, #00a86b 100%)',
                    color: '#000',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(0,217,126,0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e: any) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e: any) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Explore Tokens
                </Link>
              </div>
            ) : (
              <div
                className="responsive-table-wrapper"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
              <div style={{ minWidth: '560px' }}>
                {/* Table header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 140px 120px 120px 140px',
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(11,14,17,0.8)',
                    backdropFilter: 'blur(16px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                  }}
                >
                  {['ASSET', 'PRICE', '24H CHANGE', 'NETWORK', 'ACTIONS'].map((col, i) => (
                    <span
                      key={col}
                      style={{
                        fontSize: '10px',
                        color: '#484f58',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textAlign: i >= 4 ? 'right' : i >= 1 ? 'right' : 'left',
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {watchlist.map((item, idx) => {
                  const pos = (item.priceChange24h || 0) >= 0;
                  const chainColor = CHAIN_COLOR[item.chainId] || '#484f58';
                  return (
                    <div
                      key={item.pairAddress}
                      className="stagger-item"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 140px 120px 120px 140px',
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        alignItems: 'center',
                        transition: 'background 0.15s',
                        cursor: 'default',
                        animationDelay: `${idx * 0.06}s`,
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Asset */}
                      <Link
                        href={`/tokens/${item.chainId}/${item.pairAddress}`}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${chainColor}30 0%, #0b0e11 100%)`,
                            border: `1px solid ${chainColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                            color: chainColor,
                            flexShrink: 0,
                          }}
                        >
                          {(item.symbol || '?').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px', lineHeight: 1.2 }}>
                            {item.symbol}
                          </div>
                          <div style={{ fontSize: '10px', color: '#484f58', marginTop: '2px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                            {item.chainId}
                          </div>
                        </div>
                      </Link>

                      {/* Price */}
                      <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '13px', color: '#e6edf3' }}>
                        {item.priceUsd ? `$${parseFloat(item.priceUsd).toFixed(6)}` : (
                          <div className="skeleton" style={{ width: '80px', height: '14px', marginLeft: 'auto' }} />
                        )}
                      </div>

                      {/* 24h change */}
                      <div style={{ textAlign: 'right' }}>
                        {item.priceChange24h !== undefined ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: pos ? 'rgba(0,217,126,0.12)' : 'rgba(240,77,77,0.12)',
                              color: pos ? '#00d97e' : '#f04d4d',
                            }}
                          >
                            {pos ? '▲' : '▼'}
                            {pos ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                          </span>
                        ) : (
                          <div className="skeleton" style={{ width: '60px', height: '22px', marginLeft: 'auto' }} />
                        )}
                      </div>

                      {/* Network */}
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: `${chainColor}18`,
                            color: chainColor,
                            border: `1px solid ${chainColor}40`,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {item.chainId}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/tokens/${item.chainId}/${item.pairAddress}`}
                          style={{
                            padding: '6px 14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '7px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#e6edf3',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                          onMouseOut={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => removeFromWatchlist(item.pairAddress)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(240,77,77,0.08)',
                            border: '1px solid rgba(240,77,77,0.2)',
                            color: '#f04d4d',
                            borderRadius: '7px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(240,77,77,0.16)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(240,77,77,0.08)'; }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
