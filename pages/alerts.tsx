import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { DexNav } from '../components/DexNav';
import { DexSidebar } from '../components/DexSidebar';
import { useIsMobile } from '../hooks';

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
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    const saved = localStorage.getItem('dex_alerts');
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('dex_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    if (alerts.length === 0) return;

    const checkAlerts = async () => {
      const activeAlerts = alerts.filter((a) => a.isActive && !a.isTriggered);
      if (activeAlerts.length === 0) return;

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
      className="premium-bg"
      style={{ minHeight: '100vh', color: '#e6edf3', position: 'relative', overflow: 'hidden' }}
    >
      <Head>
        <title>Alerts | NexSwap</title>
      </Head>

      {/* Background orbs */}
      <div
        style={{
          position: 'fixed', top: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(163,113,247,0.06) 0%, transparent 70%)',
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
          <div style={{ maxWidth: '800px', margin: '0 auto' }} className="page-enter">
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
                  Price Alerts
                </h1>
                <p style={{ color: '#484f58', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                  Get notified when prices hit your targets
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #00d97e 0%, #00a86b 100%)',
                  color: '#000',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(0,217,126,0.3)',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,217,126,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,217,126,0.3)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Alert
              </button>
            </div>

            {alerts.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '80px 20px',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="float-icon" style={{ fontSize: '48px', marginBottom: '20px', display: 'block' }}>🔔</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#e6edf3' }}>
                  No Active Alerts
                </h2>
                <p style={{ color: '#484f58', fontSize: '14px', margin: 0 }}>
                  Monitor price breakouts or entries automatically.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.map((alert, idx) => (
                  <div
                    key={alert.id}
                    className="stagger-item"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      opacity: alert.isActive ? 1 : 0.5,
                      backdropFilter: 'blur(12px)',
                      transition: 'all 0.2s',
                      borderLeft: `3px solid ${alert.isTriggered ? '#d29922' : alert.isActive ? '#00d97e' : '#21262d'}`,
                      animationDelay: `${idx * 0.07}s`,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: alert.isTriggered
                          ? 'rgba(210,153,34,0.12)'
                          : alert.isActive
                          ? 'rgba(0,217,126,0.1)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${alert.isTriggered ? 'rgba(210,153,34,0.3)' : alert.isActive ? 'rgba(0,217,126,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '18px',
                      }}
                    >
                      {alert.isTriggered ? '⚡' : alert.condition === 'above' ? '📈' : '📉'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#e6edf3', marginBottom: '4px' }}>
                        {alert.symbol} Price Alert
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b949e' }}>
                        Notify when price is{' '}
                        <span
                          style={{
                            color: alert.condition === 'above' ? '#00d97e' : '#f04d4d',
                            fontWeight: 700,
                          }}
                        >
                          {alert.condition}
                        </span>{' '}
                        <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                          ${alert.targetPrice}
                        </span>
                      </div>
                    </div>

                    {alert.isTriggered && (
                      <div
                        style={{
                          background: 'rgba(210,153,34,0.12)',
                          color: '#d29922',
                          border: '1px solid rgba(210,153,34,0.3)',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.07em',
                          animation: 'badge-pop 0.4s ease-out',
                          flexShrink: 0,
                        }}
                      >
                        TRIGGERED
                      </div>
                    )}

                    <button
                      onClick={() => toggleAlert(alert.id)}
                      style={{
                        padding: '7px 14px',
                        background: alert.isActive
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,217,126,0.12)',
                        color: alert.isActive ? '#8b949e' : '#00d97e',
                        border: `1px solid ${alert.isActive ? 'rgba(255,255,255,0.1)' : 'rgba(0,217,126,0.25)'}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                      onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {alert.isActive ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => deleteAlert(alert.id)}
                      style={{
                        background: 'rgba(240,77,77,0.08)',
                        border: '1px solid rgba(240,77,77,0.2)',
                        color: '#f04d4d',
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(240,77,77,0.18)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(240,77,77,0.08)'; }}
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
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="modal-enter"
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'rgba(16,20,26,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #00d97e, #4f8ef7)',
              }}
            />

            {/* Modal header */}
            <div
              style={{
                padding: '24px 24px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  Create Price Alert
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#484f58' }}>
                  Set a target price and get notified
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8b949e',
                  width: 32, height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#8b949e'; }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {!selectedPair ? (
                <>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <svg
                      width="14" height="14"
                      viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    >
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      placeholder="Search token…"
                      onChange={(e) => handleSearch(e.target.value)}
                      className="input-premium"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    className="custom-scrollbar"
                  >
                    {isSearching ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#484f58', fontSize: '13px' }}>
                        Searching…
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#484f58', fontSize: '13px' }}>
                        Type to search tokens
                      </div>
                    ) : searchResults.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPair(p)}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'background 0.15s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(79,142,247,0.1)',
                            border: '1px solid rgba(79,142,247,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '11px', color: '#4f8ef7',
                            flexShrink: 0,
                          }}
                        >
                          {(p.baseToken?.symbol || '?').charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#e6edf3' }}>
                            {p.baseToken.symbol}
                          </div>
                          <div style={{ color: '#484f58', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                            {p.chainId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Selected pair */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: 'rgba(79,142,247,0.08)',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(79,142,247,0.15)',
                        border: '1px solid rgba(79,142,247,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '13px', color: '#4f8ef7',
                        flexShrink: 0,
                      }}
                    >
                      {(selectedPair.baseToken.symbol || '?').charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#e6edf3', fontSize: '14px' }}>
                        {selectedPair.baseToken.symbol}
                      </div>
                      <div style={{ color: '#484f58', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                        {selectedPair.chainId}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPair(null)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#4f8ef7', fontSize: '12px',
                        cursor: 'pointer', fontWeight: 700,
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Condition */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#484f58', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Condition
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '10px',
                        padding: '4px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        gap: '4px',
                      }}
                    >
                      {(['above', 'below'] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => setCondition(c)}
                          style={{
                            flex: 1, padding: '9px',
                            border: 'none', borderRadius: '7px',
                            background: condition === c
                              ? c === 'above' ? 'rgba(0,217,126,0.15)' : 'rgba(240,77,77,0.15)'
                              : 'transparent',
                            color: condition === c
                              ? c === 'above' ? '#00d97e' : '#f04d4d'
                              : '#484f58',
                            fontSize: '13px', fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.2s',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {c === 'above' ? '▲ Above' : '▼ Below'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target price */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#484f58', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Target Price (USD)
                    </div>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="input-premium"
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700 }}
                    />
                  </div>

                  <button
                    onClick={createAlert}
                    style={{
                      background: 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 100%)',
                      color: '#000',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      letterSpacing: '0.02em',
                      boxShadow: '0 8px 24px rgba(0,217,126,0.35)',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
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
