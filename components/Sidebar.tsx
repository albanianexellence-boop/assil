import { useAtom } from 'jotai';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { accountCreatedAtom } from '../src/atoms/game-flow-atom';

export const Sidebar = () => {
  const [accountCreated] = useAtom(accountCreatedAtom);

  return (
    <aside
      style={{
        width: '300px',
        backgroundColor: '#111',
        borderRight: '1px solid #333',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>
          Block Relic
        </h2>
        <p style={{ color: '#888', fontSize: '0.875rem' }}>
          Secure Web3 Portal
        </p>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          opacity: accountCreated ? 1 : 0.5,
          pointerEvents: accountCreated ? 'auto' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          {accountCreated ? (
            <span
              style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Step 3: Connect Wallet
            </span>
          ) : (
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Complete previous steps
            </span>
          )}
        </div>

        <DynamicWidget />
      </div>

      {!accountCreated && (
        <div
          style={{
            marginTop: 'auto',
            padding: '1rem',
            backgroundColor: '#222',
            borderRadius: '8px',
            color: '#ccc',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}
        >
          Play the game and create an account to unlock the wallet connection.
        </div>
      )}
    </aside>
  );
};
