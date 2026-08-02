import React, { useEffect, useState } from 'react';

interface TickerPrice {
  symbol: string;
  price: number;
  change: number;
}

export const TickerBar = () => {
  const [tickers, setTickers] = useState<TickerPrice[]>([]);

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/market/prices');
      const json = await res.json();
      if (json.success) setTickers(json.data);
    } catch (e) {
      // silently fail — keep last data
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 1000); // refresh every 1s
    return () => clearInterval(interval);
  }, []);

  const displayTickers = tickers.length > 0 ? [...tickers, ...tickers] : [];

  const fmt = (n: number) => {
    if (n >= 10000)
      return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1)
      return n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return n.toFixed(4);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        zIndex: 99,
        background: '#12151a',
        borderBottom: '1px solid #21262d',
        overflow: 'hidden',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {displayTickers.length === 0 ? (
        <span
          style={{ fontSize: '12px', color: '#484f58', paddingLeft: '20px' }}
        >
          Loading live prices…
        </span>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '40px',
            animation: 'ticker 80s linear infinite',
            whiteSpace: 'nowrap',
            width: 'max-content',
            alignItems: 'center',
          }}
        >
          {displayTickers.map((t, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              <span style={{ color: '#8b949e' }}>{t.symbol}</span>
              <span
                style={{
                  color: '#e6edf3',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {fmt(t.price)}
              </span>
              <span style={{ color: t.change >= 0 ? '#00d97e' : '#f04d4d' }}>
                {t.change >= 0 ? '+' : ''}
                {t.change.toFixed(2)}%
              </span>
              <span style={{ color: '#21262d', marginLeft: 8 }}>|</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
