import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${JAVA_API_BASE_URL}/auth/profile/get-all-users`, {
          credentials: 'include'
        });
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await res.json();
        const list = Array.isArray(data.users) ? data.users : [];
        list.sort((a, b) => (b.score || 0) - (a.score || 0));
        setUsers(list);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [JAVA_API_BASE_URL, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="leaderboard-container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Leaderboard</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="leaderboard-table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Rank</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>User</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.userId || u.username || idx}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>{u.username || u.userId}</td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>{u.score ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaderboard; 