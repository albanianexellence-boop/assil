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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'white',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          width: '100%',
          maxWidth: '450px',
          border: '1px solid #333',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '2rem',
          }}
        >
          Claim Your Prize
        </h2>
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '2rem' }}>
          You won <strong>{claimedPrize}</strong>! Create an account to claim
          it.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#ccc',
              }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#000',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#ccc',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#000',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1rem',
              background: loading
                ? '#555'
                : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.opacity = '1';
            }}
          >
            {loading ? 'Submitting...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
