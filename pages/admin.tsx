import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { loggedInUserAtom, User } from '../src/atoms/game-flow-atom';

export default function AdminPage() {
  const [loggedInUser] = useAtom(loggedInUserAtom);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic Client-Side Protection
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
    return null; // or a loading spinner while redirecting
  }

  return (
    <div
      style={{
        padding: '2rem',
        color: 'white',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h1
        style={{
          borderBottom: '1px solid #333',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        Admin Dashboard
      </h1>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#111',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: '#222', textAlign: 'left' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  ID
                </th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  Name
                </th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  Email
                </th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  Prize Won
                </th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  Role
                </th>
                <th style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
                  Registered At
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#888',
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id || user.email}
                    style={{ borderBottom: '1px solid #222' }}
                  >
                    <td style={{ padding: '1rem', color: '#aaa' }}>
                      {user.id || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {user.name}
                    </td>
                    <td style={{ padding: '1rem', color: '#aaa' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {user.prize ? (
                        <span
                          style={{
                            color: '#4ade80',
                            background: 'rgba(74, 222, 128, 0.1)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {user.prize}
                        </span>
                      ) : (
                        <span style={{ color: '#555' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          color: user.role === 'admin' ? '#ff299f' : '#aaa',
                          fontWeight: user.role === 'admin' ? 'bold' : 'normal',
                        }}
                      >
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '1rem',
                        color: '#aaa',
                        fontSize: '0.9rem',
                      }}
                    >
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
      )}
    </div>
  );
}
