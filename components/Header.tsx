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
          padding: '1rem 2rem',
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #222',
        }}
      >
        {/* Left Side: Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1
            style={{
              margin: 0,
              color: 'white',
              fontSize: '1.8rem',
              background: 'linear-gradient(90deg, #fff, #aaa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Block Relic
          </h1>
          {loggedInUser?.role === 'admin' && (
            <Link
              href="/admin"
              style={{
                color: '#ff299f',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right Side: Auth & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!loggedInUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#111',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#222')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#111')}
            >
              Login / Register
            </button>
          ) : (
            <>
              <div
                style={{
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {loggedInUser.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>
                    {loggedInUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: 'transparent',
                    color: '#ff4444',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </div>

              {/* Show wallet connection only if logged in */}
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
