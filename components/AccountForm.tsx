import React, { useState } from 'react';
import { useAtom } from 'jotai';
import {
  accountCreatedAtom,
  claimedPrizeAtom,
} from '../src/atoms/game-flow-atom';

export const AccountForm = () => {
  const [, setAccountCreated] = useAtom(accountCreatedAtom);
  const [claimedPrize] = useAtom(claimedPrizeAtom);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/saveAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, prize: claimedPrize }),
      });

      if (!res.ok) {
        throw new Error('Failed to create account');
      }

      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          background: 'rgba(16,20,26,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          width: '100%',
          maxWidth: '460px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a371f7)',
          }}
        />

        {/* Prize badge */}
        {claimedPrize && (
          <div
            className="bounce-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(163,113,247,0.12)',
              border: '1px solid rgba(163,113,247,0.3)',
              marginBottom: '28px',
              boxShadow: '0 0 20px rgba(163,113,247,0.15)',
            }}
          >
            <span style={{ fontSize: '20px' }}>🎉</span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#a371f7', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Prize Won
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                {claimedPrize}
              </div>
            </div>
          </div>
        )}

        <h2
          style={{
            textAlign: 'center',
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.4px',
          }}
        >
          Claim Your Prize
        </h2>
        <p style={{ textAlign: 'center', color: '#8b949e', marginBottom: '32px', fontSize: '14px' }}>
          Create an account to claim your reward
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#484f58', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="input-premium"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#484f58', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="input-premium"
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(240,77,77,0.1)',
                border: '1px solid rgba(240,77,77,0.25)',
                color: '#f04d4d',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              background: loading
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a371f7 100%)',
              color: loading ? '#484f58' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'all 0.25s',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
              letterSpacing: '0.02em',
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
