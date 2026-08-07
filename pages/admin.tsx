import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { loggedInUserAtom, User } from '../src/atoms/game-flow-atom';
import { useIsMobile } from '../hooks';

export default function AdminPage() {
  const [loggedInUser] = useAtom(loggedInUserAtom);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [loggedInUser, router]);

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return null;
  }

  return (
    <div
      className="premium-bg"
      style={{ minHeight: '100vh', color: '#e6edf3', padding: isMobile ? '16px 12px' : '32px 24px', position: 'relative' }}
    >
      {/* Background orb */}
      <div
        style={{
          position: 'fixed', top: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(255,41,159,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="page-enter">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: '12px',
                background: 'rgba(255,41,159,0.12)',
                border: '1px solid rgba(255,41,159,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255,41,159,0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff299f" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #ff299f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}
            >
              Admin Dashboard
            </h1>
          </div>
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, rgba(255,41,159,0.3), rgba(255,255,255,0.06), transparent)',
            }}
          />
        </div>

        {/* Stats bar */}
        {!loading && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Total Users', value: users.length, color: '#4f8ef7' },
              { label: 'With Prizes', value: users.filter((u) => u.prize).length, color: '#00d97e' },
              { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: '#ff299f' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.color}25`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ fontSize: '10px', color: '#484f58', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.04em' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid rgba(255,41,159,0.15)',
                borderTopColor: '#ff299f',
                animation: 'spin 0.9s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ color: '#484f58', fontSize: '14px', fontWeight: 500 }}>Loading users…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div className="responsive-table-wrapper" style={{ borderRadius: '16px' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              overflow: 'hidden',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minWidth: '650px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,14,17,0.7)' }}>
                  {['ID', 'Name', 'Email', 'Prize Won', 'Role', 'Registered At'].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '14px 16px',
                        fontSize: '10px',
                        color: '#484f58',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#484f58',
                        fontSize: '14px',
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr
                      key={user.id || user.email}
                      className="stagger-item"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                        animationDelay: `${idx * 0.05}s`,
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px', color: '#484f58', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {user.id ? String(user.id).slice(0, 8) + '…' : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '14px', color: '#e6edf3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: user.role === 'admin'
                                ? 'linear-gradient(135deg, #ff299f, #a371f7)'
                                : 'linear-gradient(135deg, #4f8ef7, #00d97e)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '11px', color: '#000',
                              flexShrink: 0,
                            }}
                          >
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#8b949e', fontSize: '13px' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {user.prize ? (
                          <span
                            style={{
                              color: '#00d97e',
                              background: 'rgba(0,217,126,0.1)',
                              border: '1px solid rgba(0,217,126,0.2)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {user.prize}
                          </span>
                        ) : (
                          <span style={{ color: '#484f58', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: user.role === 'admin'
                              ? 'rgba(255,41,159,0.12)'
                              : 'rgba(255,255,255,0.05)',
                            color: user.role === 'admin' ? '#ff299f' : '#8b949e',
                            border: `1px solid ${user.role === 'admin' ? 'rgba(255,41,159,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#484f58', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {user.timestamp
                          ? new Date(user.timestamp).toLocaleString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
