import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import Link from 'next/link';
import { loggedInUserAtom } from '../src/atoms/game-flow-atom';
import { AuthModal } from './AuthModal';

export const Header = () => {
  const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  return (
    <>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          height: '64px',
          background: 'rgba(11,14,17,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,217,126,0.35)',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="8.5" x2="22" y2="8.5" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #ffffff 0%, #8b949e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
              }}
            >
              Block Relic
            </span>
          </div>

          {loggedInUser?.role === 'admin' && (
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                background: 'rgba(255,41,159,0.12)',
                border: '1px solid rgba(255,41,159,0.3)',
                color: '#ff299f',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,41,159,0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255,41,159,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,41,159,0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right: Auth & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!loggedInUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#e6edf3',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
                letterSpacing: '0.01em',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Login / Register
            </button>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#000',
                    flexShrink: 0,
                  }}
                >
                  {(loggedInUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3', lineHeight: 1.2 }}>
                    {loggedInUser.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#484f58', lineHeight: 1.2 }}>
                    {loggedInUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(240,77,77,0.25)',
                    background: 'rgba(240,77,77,0.08)',
                    color: '#f04d4d',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: '4px',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(240,77,77,0.18)';
                    e.currentTarget.style.borderColor = 'rgba(240,77,77,0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(240,77,77,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(240,77,77,0.25)';
                  }}
                >
                  Logout
                </button>
              </div>

              <DynamicWidget />
            </>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
