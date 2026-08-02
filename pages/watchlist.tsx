import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';

interface WatchedPair {
  chainId: string;
  pairAddress: string;
  symbol: string;
  priceUsd?: string;
  priceChange24h?: number;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchedPair[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('dex_watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Poll for price updates
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
    updatePrices(); // Initial update
    return () => clearInterval(interval);
  }, [watchlist.length]);

  const removeFromWatchlist = (pairAddress: string) => {
    const next = watchlist.filter((w) => w.pairAddress !== pairAddress);
    setWatchlist(next);
    localStorage.setItem('dex_watchlist', JSON.stringify(next));
  };

  return (
    <div
      style={{ background: '#0b0e11', minHeight: '100vh', color: '#e6edf3' }}
    >
      <Head>
        <title>Watchlist | NexSwap</title>
      </Head>

      <DexNav />

      <div style={{ display: 'flex', paddingTop: '60px', height: '100vh' }}>
        <DexSidebar />

        <main
          style={{ flex: 1, padding: '24px', overflowY: 'auto' }}
          className="custom-scrollbar"
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    margin: '0 0 4px 0',
                  }}
                >
                  Watchlist
                </h1>
                <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
                  Track your favorite tokens in real-time
                </p>
              </div>
              <Link
                href="/tokens"
                style={{
                  background: '#21262d',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid #30363d',
                }}
              >
                + Add Tokens
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px' }}>
                Loading your watchlist...
              </div>
            ) : watchlist.length === 0 ? (
              <div
                style={{
                  background: '#12151a',
                  border: '1px dashed #30363d',
                  borderRadius: '16px',
                  padding: '80px 40px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  Your Watchlist is Empty
                </h2>
                <p style={{ color: '#8b949e', marginBottom: '24px' }}>
                  Click the star icon on any token page to add it here.
                </p>
                <Link
                  href="/tokens"
                  style={{
                    background: '#00d97e',
                    color: '#000',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                  }}
                >
                  Explore Tokens
                </Link>
              </div>
            ) : (
              <div
                style={{
                  background: '#12151a',
                  border: '1px solid #21262d',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid #21262d',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <th
                        style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: '#8b949e',
                          fontWeight: 600,
                        }}
                      >
                        ASSET
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: '#8b949e',
                          fontWeight: 600,
                        }}
                      >
                        PRICE
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: '#8b949e',
                          fontWeight: 600,
                        }}
                      >
                        24H CHANGE
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: '#8b949e',
                          fontWeight: 600,
                        }}
                      >
                        NETWORK
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          fontSize: '12px',
                          color: '#8b949e',
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((item) => (
                      <tr
                        key={item.pairAddress}
                        style={{
                          borderBottom: '1px solid #21262d',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            'rgba(255,255,255,0.02)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <td style={{ padding: '16px' }}>
                          <Link
                            href={`/tokens/${item.chainId}/${item.pairAddress}`}
                            style={{
                              fontWeight: 700,
                              color: '#fff',
                              fontSize: '15px',
                            }}
                          >
                            {item.symbol}
                          </Link>
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: 600,
                          }}
                        >
                          {item.priceUsd
                            ? `$${parseFloat(item.priceUsd).toFixed(6)}`
                            : '...'}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontWeight: 700,
                            color:
                              (item.priceChange24h || 0) >= 0
                                ? '#00d97e'
                                : '#f04d4d',
                          }}
                        >
                          {item.priceChange24h
                            ? `${item.priceChange24h > 0 ? '+' : ''}${item.priceChange24h.toFixed(2)}%`
                            : '...'}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '12px',
                            color: '#8b949e',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.chainId}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <Link
                              href={`/tokens/${item.chainId}/${item.pairAddress}`}
                              style={{
                                padding: '6px 12px',
                                background: '#21262d',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              View
                            </Link>
                            <button
                              onClick={() =>
                                removeFromWatchlist(item.pairAddress)
                              }
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(240,77,77,0.1)',
                                color: '#f04d4d',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
