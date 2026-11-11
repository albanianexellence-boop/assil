import { useAtom } from 'jotai';
import { DynamicBridgeWidget } from '@dynamic-labs/sdk-react-core';
import { accountCreatedAtom } from '../src/atoms/game-flow-atom';

export const Sidebar = () => {
  const [accountCreated] = useAtom(accountCreatedAtom);

  return (
    <aside
      style={{
        width: '300px',
        background: 'rgba(11,14,17,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
        minHeight: '100vh',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Brand */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '6px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,217,126,0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="8.5" x2="22" y2="8.5" />
            </svg>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #ffffff 0%, #8b949e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Block Relic
          </h2>
        </div>
        <p style={{ color: '#484f58', fontSize: '12px', margin: 0, fontWeight: 500 }}>
          Secure Web3 Portal
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
        }}
      />

      {/* Step indicator */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { step: 1, label: 'Spin the Wheel', done: true },
          { step: 2, label: 'Create Account', done: true },
          { step: 3, label: 'Connect Wallet', done: false, current: true },
        ].map((s) => (
          <div
            key={s.step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: s.current && accountCreated
                ? 'rgba(0,217,126,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.current && accountCreated ? 'rgba(0,217,126,0.25)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: s.done
                  ? 'linear-gradient(135deg, #00d97e, #4f8ef7)'
                  : accountCreated && s.current
                  ? 'linear-gradient(135deg, #00d97e, #4f8ef7)'
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${s.done || (accountCreated && s.current) ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: (s.done || (accountCreated && s.current)) ? '0 0 12px rgba(0,217,126,0.35)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {s.done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#484f58' }}>{s.step}</span>
              )}
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: s.done ? '#8b949e' : accountCreated && s.current ? '#00d97e' : '#484f58',
                transition: 'color 0.3s',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Wallet connection area */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          opacity: accountCreated ? 1 : 0.4,
          pointerEvents: accountCreated ? 'auto' : 'none',
          transition: 'opacity 0.4s ease',
        }}
      >
        {accountCreated && (
          <div
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(0,217,126,0.08)',
              border: '1px solid rgba(0,217,126,0.2)',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#00d97e',
              letterSpacing: '0.04em',
            }}
          >
            ✓ Account created — connect your wallet
          </div>
        )}
        <DynamicBridgeWidget />
      </div>

      {!accountCreated && (
        <div
          style={{
            marginTop: 'auto',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#484f58',
            fontSize: '12px',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Complete the previous steps to unlock wallet connection.
        </div>
      )}
    </aside>
  );
};
