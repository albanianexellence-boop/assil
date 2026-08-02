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
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          padding: '2rem',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1px solid #333',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ color: 'white', margin: 0 }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#000',
                color: 'white',
                outline: 'none',
              }}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#000',
              color: 'white',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: loading
                ? '#555'
                : 'linear-gradient(45deg, #b829ff, #ff299f)',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
                ? 'Login'
                : 'Register'}
          </button>
        </form>

        <p
          style={{
            color: '#888',
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff299f',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 'bold',
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
