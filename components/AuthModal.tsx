import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { useToasts } from '@geist-ui/core';
import { loggedInUserAtom, User } from '../src/atoms/game-flow-atom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();
  const [, setLoggedInUser] = useAtom(loggedInUserAtom);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/saveAccount';
      const body = mode === 'login' ? { email } : { name, email };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setLoggedInUser(data.user);
        setToast({ text: `Welcome back, ${data.user.name}!`, type: 'success' });
        onClose();
      } else {
        setToast({
          text: data.message || 'Authentication failed',
          type: 'error',
        });
      }
    } catch (err: any) {
      setToast({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="modal-enter"
        style={{
          background: 'rgba(16,20,26,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          padding: '40px',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top gradient line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: mode === 'login'
              ? 'linear-gradient(90deg, #00d97e, #4f8ef7)'
              : 'linear-gradient(90deg, #a371f7, #ff299f)',
            transition: 'background 0.4s ease',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 style={{ color: '#ffffff', margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: '#484f58', margin: 0, fontSize: '13px' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Join and claim your rewards'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8b949e',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#8b949e';
            }}
          >
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '9px',
                border: 'none',
                background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: mode === m ? '#ffffff' : '#484f58',
                fontWeight: mode === m ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#484f58', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-premium"
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#484f58', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-premium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading
                ? 'rgba(255,255,255,0.08)'
                : mode === 'login'
                ? 'linear-gradient(135deg, #00d97e 0%, #4f8ef7 100%)'
                : 'linear-gradient(135deg, #a371f7 0%, #ff299f 100%)',
              color: loading ? '#484f58' : '#000',
              fontWeight: 800,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s',
              letterSpacing: '0.02em',
              boxShadow: loading ? 'none' : mode === 'login'
                ? '0 8px 24px rgba(0,217,126,0.35)'
                : '0 8px 24px rgba(163,113,247,0.35)',
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
            {loading
              ? 'Processing…'
              : mode === 'login'
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>

        <p style={{ color: '#484f58', textAlign: 'center', marginTop: '24px', fontSize: '13px', margin: '24px 0 0' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: mode === 'login' ? '#00d97e' : '#a371f7',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 700,
              fontSize: '13px',
              transition: 'filter 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
