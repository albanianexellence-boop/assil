import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { LiveChart } from '../components/LiveChart';

interface ChartItem {
  id: string;
  chainId: string;
  pairAddress: string;
  symbol: string;
}

export default function MultiChartsPage() {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [cols, setCols] = useState(2);
  const [chartHeight, setChartHeight] = useState(400);
  const [spacing, setSpacing] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedCharts = localStorage.getItem('multicharts_list');
    const savedLayout = localStorage.getItem('multicharts_layout');

    if (savedCharts) setCharts(JSON.parse(savedCharts));
    if (savedLayout) {
      const layout = JSON.parse(savedLayout);
      setCols(layout.cols || 2);
      setChartHeight(layout.chartHeight || 400);
      setSpacing(layout.spacing || 12);
    } else {
      // Default charts if empty
      setCharts([
        {
          id: '1',
          chainId: 'solana',
          pairAddress: 'qNAGLPKnYzNtf5iJHdki9Prgodgra5BnadACgecdsjw',
          symbol: 'DRAIN',
        },
        {
          id: '2',
          chainId: 'ethereum',
          pairAddress: '0x11b81a075957af3e3c1141558c9274400c628e93',
          symbol: 'USDC/WETH',
        },
      ]);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('multicharts_list', JSON.stringify(charts));
    localStorage.setItem(
      'multicharts_layout',
      JSON.stringify({ cols, chartHeight, spacing }),
    );
  }, [charts, cols, chartHeight, spacing]);

  useEffect(() => {
    if (showAddModal && searchQuery === '') {
      const fetchTrending = async () => {
        setIsSearching(true);
        const cacheKey = 'dex_trending_charts';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSearchResults(parsed);
              setIsSearching(false);
            }
          } catch (e) {}
        }

        try {
          const res = await fetch('/api/dex/tokens-list?limit=12');
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            if (json.data.length > 0) {
              setSearchResults(json.data);
              localStorage.setItem(cacheKey, JSON.stringify(json.data));
            }
          }
        } catch (err) {
          console.error('Fetch trending error:', err);
        } finally {
          setIsSearching(false);
        }
      };
      fetchTrending();
    }
  }, [showAddModal, searchQuery]);

  const handleSearch = useCallback(async (val: string) => {
    setSearchQuery(val);
    if (!val || val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/dex/search?q=${val}`);
      const json = await res.json();
      if (json.success) setSearchResults(json.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addChart = (pair: any) => {
    const newChart: ChartItem = {
      id: Math.random().toString(36).substr(2, 9),
      chainId: pair.chainId,
      pairAddress: pair.pairAddress,
      symbol: pair.baseToken.symbol,
    };
    setCharts([...charts, newChart]);
    setShowAddModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeChart = (id: string) => {
    setCharts(charts.filter((c) => c.id !== id));
  };

  const MAX_SLOTS = 16;

  // Suggested charts — well-known pairs for BTC, ETH, BNB, MATIC, AVAX, FTM
  const SUGGESTED = [
    {
      chainId: 'ethereum',
      pairAddress: '0x4585fe77225b41b697c938b018e2ac67ac5a20c0',
      symbol: 'WBTC/ETH',
    },
    {
      chainId: 'ethereum',
      pairAddress: '0x11b81a075957af3e3c1141558c9274400c628e93',
      symbol: 'USDC/ETH',
    },
    {
      chainId: 'bsc',
      pairAddress: '0x58f876857a02d6762e0101bb5c46a8c1ed44dc16',
      symbol: 'BNB/BUSD',
    },
    {
      chainId: 'polygon',
      pairAddress: '0x019ba8a2f9aae47ec81b487e67edbc048b4ec6f9',
      symbol: 'MATIC/USDC',
    },
    {
      chainId: 'avalanche',
      pairAddress: '0xf4003f4efbe8691b60249e6afbd307abe7758adb',
      symbol: 'AVAX/USDC',
    },
    {
      chainId: 'fantom',
      pairAddress: '0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c',
      symbol: 'FTM/USDC',
    },
  ];

  const addSuggestedCharts = () => {
    const remaining = MAX_SLOTS - charts.length;
    if (remaining <= 0) return;
    const toAdd = SUGGESTED.slice(0, remaining).map((s) => ({
      id: Math.random().toString(36).substr(2, 9),
      chainId: s.chainId,
      pairAddress: s.pairAddress,
      symbol: s.symbol,
    }));
    setCharts([...charts, ...toAdd]);
  };

  return (
    <div
      style={{ background: '#0b0e11', minHeight: '100vh', color: '#e6edf3' }}
    >
      <Head>
        <title>MultiCharts | NexSwap Pro</title>
      </Head>

      <DexNav />

      <div style={{ display: 'flex', paddingTop: '60px', height: '100vh' }}>
        <DexSidebar />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Dashboard Header / Controls */}
          <div
            style={{
              padding: '12px 20px',
              background: '#12151a',
              borderBottom: '1px solid #21262d',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 800,
                margin: 0,
                color: '#fff',
              }}
            >
              MultiCharts
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600 }}
              >
                COLUMNS
              </span>
              <div
                style={{
                  display: 'flex',
                  background: '#0b0e11',
                  borderRadius: '6px',
                  padding: '2px',
                  border: '1px solid #21262d',
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCols(n)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: 'none',
                      background: cols === n ? '#21262d' : 'transparent',
                      color: cols === n ? '#00d97e' : '#8b949e',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600 }}
              >
                HEIGHT
              </span>
              <input
                type="range"
                min="200"
                max="800"
                step="50"
                value={chartHeight}
                onChange={(e) => setChartHeight(parseInt(e.target.value))}
                style={{ cursor: 'pointer', accentColor: '#00d97e' }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                  color: '#00d97e',
                }}
              >
                {chartHeight}px
              </span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                marginLeft: 'auto',
                background: '#00d97e',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>+</span> Add Chart
            </button>
          </div>

          {/* Grid Area */}
          <div
            className="custom-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: `${spacing}px`,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: `${spacing}px`,
              alignContent: 'start',
            }}
          >
            {charts.map((chart) => (
              <div key={chart.id} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {chart.symbol}
                  </div>
                  <button
                    onClick={() => removeChart(chart.id)}
                    style={{
                      background: 'rgba(240,77,77,0.2)',
                      color: '#f04d4d',
                      border: '1px solid rgba(240,77,77,0.3)',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    ×
                  </button>
                </div>
                <LiveChart
                  chainId={chart.chainId}
                  pairAddress={chart.pairAddress}
                  height={`${chartHeight}px`}
                />
              </div>
            ))}

            {/* DEX Screener-style: Add Chart slot */}
            {charts.length < MAX_SLOTS && (
              <div
                onClick={() => setShowAddModal(true)}
                style={{
                  height: `${chartHeight}px`,
                  background: '#12151a',
                  border: '1px solid #21262d',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '12px',
                  transition: 'border-color 0.15s, background 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    '#30363d';
                  (e.currentTarget as HTMLElement).style.background = '#161b22';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    '#21262d';
                  (e.currentTarget as HTMLElement).style.background = '#12151a';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid #e6edf3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    fontWeight: 300,
                    color: '#e6edf3',
                    lineHeight: 1,
                  }}
                >
                  +
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: '#e6edf3',
                      marginBottom: '4px',
                    }}
                  >
                    Add Chart
                  </div>
                  <div style={{ fontSize: '12px', color: '#484f58' }}>
                    {MAX_SLOTS - charts.length} of {MAX_SLOTS} slots remaining
                  </div>
                </div>
              </div>
            )}

            {/* DEX Screener-style: Add Suggested Charts slot */}
            {charts.length < MAX_SLOTS - 1 && (
              <div
                onClick={addSuggestedCharts}
                style={{
                  height: `${chartHeight}px`,
                  background: '#12151a',
                  border: '1px solid #21262d',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '12px',
                  transition: 'border-color 0.15s, background 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    '#30363d';
                  (e.currentTarget as HTMLElement).style.background = '#161b22';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    '#21262d';
                  (e.currentTarget as HTMLElement).style.background = '#12151a';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid #e6edf3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    fontWeight: 300,
                    color: '#e6edf3',
                    lineHeight: 1,
                  }}
                >
                  +
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: '#e6edf3',
                      marginBottom: '4px',
                    }}
                  >
                    Add Suggested Charts
                  </div>
                  <div style={{ fontSize: '12px', color: '#484f58' }}>
                    BTC, ETH, BNB, MATIC, AVAX, FTM
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Chart Modal Overlay */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              height: '80vh',
              background: '#12151a',
              border: '1px solid #30363d',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Modal Header & Search */}
            <div
              style={{ padding: '24px 24px 16px 24px', position: 'relative' }}
            >
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <svg
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8b949e',
                  }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by token, name, address, or pair"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1c2128',
                    border: '1px solid #30363d',
                    borderRadius: '12px',
                    padding: '14px 16px 14px 48px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 500,
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    position: 'absolute',
                    right: '-40px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b949e',
                    fontSize: '28px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Tags / History */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#484f58',
                    fontWeight: 800,
                    padding: '4px 0',
                    marginRight: '4px',
                  }}
                >
                  HISTORY
                </span>
                {['Zynq', 'Badger', 'BAKA', 'Drappin', 'ADHD'].map((tag) => (
                  <div
                    key={tag}
                    style={{
                      padding: '4px 10px',
                      background: '#1c2128',
                      border: '1px solid #30363d',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#8b949e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {tag} <span style={{ color: '#f0b94d' }}>⚡+30</span>
                  </div>
                ))}
              </div>

              {/* Mode Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  borderBottom: '1px solid #21262d',
                  paddingBottom: '2px',
                }}
              >
                {['Boosted', 'Latest', 'Top'].map((tab) => (
                  <button
                    key={tab}
                    style={{
                      padding: '8px 4px',
                      background: 'none',
                      border: 'none',
                      borderBottom:
                        tab === 'Latest'
                          ? '2px solid #00d97e'
                          : '2px solid transparent',
                      color: tab === 'Latest' ? '#e6edf3' : '#8b949e',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 24px 24px 24px',
              }}
            >
              <div
                style={{
                  marginBottom: '16px',
                  color: '#8b949e',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                RECENTLY UPDATED TOKEN INFO
              </div>

              {isSearching ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: '100px',
                        background: '#1c2128',
                        borderRadius: '12px',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                  }}
                >
                  {searchResults.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => addChart(p)}
                      style={{
                        background: '#1c2128',
                        border: '1px solid #30363d',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          '#252d38';
                        (e.currentTarget as HTMLElement).style.borderColor =
                          '#484f58';
                        (e.currentTarget as HTMLElement).style.transform =
                          'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          '#1c2128';
                        (e.currentTarget as HTMLElement).style.borderColor =
                          '#30363d';
                        (e.currentTarget as HTMLElement).style.transform =
                          'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Token Image */}
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#2d333b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          {p.info?.imageUrl ? (
                            <img
                              src={p.info.imageUrl}
                              alt={p.baseToken.symbol}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: 800 }}>
                              {p.baseToken.symbol[0]}
                            </span>
                          )}
                        </div>

                        {/* Basic Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: '#fff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.baseToken.name || p.baseToken.symbol}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: '#8b949e',
                            }}
                          >
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#9945ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: '#fff',
                              }}
                            >
                              ◎
                            </div>
                            {p.chainId}
                          </div>
                        </div>
                      </div>

                      {/* Socials / Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '4px',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8b949e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          style={{ color: '#8b949e' }}
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <div
                          style={{
                            marginLeft: 'auto',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#00d97e',
                          }}
                        >
                          $
                          {parseFloat(p.priceUsd).toFixed(
                            p.priceUsd && parseFloat(p.priceUsd) < 0.01 ? 8 : 4,
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `}</style>
    </div>
  );
}
