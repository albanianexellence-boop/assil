import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';

interface Alert {
  id: string;
  chainId: string;
  pairAddress: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Alert State
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('dex_alerts');
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('dex_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Alert Monitoring Logic
  useEffect(() => {
    if (alerts.length === 0) return;

    const checkAlerts = async () => {
      const activeAlerts = alerts.filter((a) => a.isActive && !a.isTriggered);
      if (activeAlerts.length === 0) return;

      // Group by pair to minimize requests
      const uniquePairs = Array.from(
        new Set(activeAlerts.map((a) => `${a.chainId}:${a.pairAddress}`)),
      );

      const priceMap: Record<string, number> = {};
      await Promise.all(
        uniquePairs.map(async (key) => {
          const [chainId, pairAddress] = key.split(':');
          try {
            const res = await fetch(
              `/api/dex/pair?chainId=${chainId}&pairAddress=${pairAddress}`,
            );
            const json = await res.json();
            if (json.success && json.data) {
              priceMap[key] = parseFloat(json.data.priceUsd);
            }
          } catch (e) {
            console.error('Failed to fetch price for alert:', e);
          }
        }),
      );

      const nextAlerts = alerts.map((alert) => {
        const currentPrice = priceMap[`${alert.chainId}:${alert.pairAddress}`];
        if (!currentPrice) return alert;

        const triggered =
          alert.condition === 'above'
            ? currentPrice >= alert.targetPrice
            : currentPrice <= alert.targetPrice;

        if (triggered && alert.isActive && !alert.isTriggered) {
          // Trigger Notification
          if (typeof window !== 'undefined') {
            alertTriggered(alert, currentPrice);
          }
          return { ...alert, isTriggered: true };
        }
        return alert;
      });

      setAlerts(nextAlerts);
    };

    const interval = setInterval(checkAlerts, 1000);
    checkAlerts();
    return () => clearInterval(interval);
  }, [alerts]);

  const alertTriggered = (alertItem: Alert, price: number) => {
    // Simple visual alert for now
    window.alert(
      `🚨 ALERT: ${alertItem.symbol} is now ${alertItem.condition} ${alertItem.targetPrice}! (Current: ${price})`,
    );
  };

  const handleSearch = useCallback(async (val: string) => {
    setSearchQuery(val);
    if (!val || val.length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/dex/search?q=${val}`);
      const json = await res.json();
      if (json.success) setSearchResults(json.data);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const createAlert = () => {
    if (!selectedPair || !targetPrice) return;
    const newAlert: Alert = {
      id: Math.random().toString(36).substr(2, 9),
      chainId: selectedPair.chainId,
      pairAddress: selectedPair.pairAddress,
      symbol: selectedPair.baseToken.symbol,
      targetPrice: parseFloat(targetPrice),
      condition,
      isActive: true,
      isTriggered: false,
    };
    setAlerts([...alerts, newAlert]);
    setShowAddModal(false);
    setSelectedPair(null);
    setTargetPrice('');
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(
      alerts.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive, isTriggered: false } : a,
      ),
    );
  };

  return (
    <div
      style={{ background: '#0b0e11', minHeight: '100vh', color: '#e6edf3' }}
    >
      <Head>
        <title>Alerts | NexSwap</title>
      </Head>

      <DexNav />

      <div style={{ display: 'flex', paddingTop: '60px', height: '100vh' }}>
        <DexSidebar />

        <main
          style={{ flex: 1, padding: '24px', overflowY: 'auto' }}
          className="custom-scrollbar"
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  Price Alerts
                </h1>
                <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
                  Get notified when prices hit your targets
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: '#00d97e',
                  color: '#000',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + New Alert
              </button>
            </div>

            {alerts.length === 0 ? (
              <div
                style={{
                  background: '#12151a',
                  border: '1px solid #21262d',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔔</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                  No Active Alerts
                </h2>
                <p style={{ color: '#8b949e' }}>
                  Monitor price breakouts or entries automatically.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      background: '#12151a',
                      border: '1px solid #21262d',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      opacity: alert.isActive ? 1 : 0.6,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '15px' }}>
                        {alert.symbol} Price Alert
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b949e' }}>
                        Notify when price is{' '}
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {alert.condition} ${alert.targetPrice}
                        </span>
                      </div>
                    </div>

                    {alert.isTriggered && (
                      <div
                        style={{
                          background: 'rgba(0,217,126,0.1)',
                          color: '#00d97e',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        TRIGGERED
                      </div>
                    )}

                    <button
                      onClick={() => toggleAlert(alert.id)}
                      style={{
                        padding: '6px 12px',
                        background: alert.isActive ? '#21262d' : '#00d97e',
                        color: alert.isActive ? '#8b949e' : '#000',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {alert.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f04d4d',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              background: '#12151a',
              border: '1px solid #21262d',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #21262d',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0 }}>Create Price Alert</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {!selectedPair ? (
                <>
                  <input
                    placeholder="Search token..."
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b0e11',
                      border: '1px solid #21262d',
                      padding: '12px',
                      borderRadius: '8px',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      marginTop: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {searchResults.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPair(p)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = '#21262d')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        {p.baseToken.symbol}{' '}
                        <span style={{ color: '#8b949e', fontSize: '11px' }}>
                          ({p.chainId})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#0b0e11',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    >
                      {selectedPair.baseToken.symbol} ({selectedPair.chainId})
                    </div>
                    <button
                      onClick={() => setSelectedPair(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f8ef7',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#8b949e',
                        marginBottom: '8px',
                      }}
                    >
                      CONDITION
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        background: '#0b0e11',
                        borderRadius: '8px',
                        padding: '4px',
                      }}
                    >
                      <button
                        onClick={() => setCondition('above')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: 'none',
                          borderRadius: '6px',
                          background:
                            condition === 'above' ? '#21262d' : 'transparent',
                          color: condition === 'above' ? '#fff' : '#8b949e',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Above
                      </button>
                      <button
                        onClick={() => setCondition('below')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: 'none',
                          borderRadius: '6px',
                          background:
                            condition === 'below' ? '#21262d' : 'transparent',
                          color: condition === 'below' ? '#fff' : '#8b949e',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Below
                      </button>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#8b949e',
                        marginBottom: '8px',
                      }}
                    >
                      TARGET PRICE (USD)
                    </div>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0b0e11',
                        border: '1px solid #21262d',
                        padding: '12px',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                  </div>

                  <button
                    onClick={createAlert}
                    style={{
                      background: '#00d97e',
                      color: '#000',
                      padding: '14px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Create Alert
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
