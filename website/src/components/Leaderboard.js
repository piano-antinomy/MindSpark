import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
        
        // Get current user info
        const currentUserRes = await fetch(`${JAVA_API_BASE_URL}/auth/profile`, {
          credentials: 'include'
        });
        if (currentUserRes.ok) {
          const currentUserData = await currentUserRes.json();
          setCurrentUser(currentUserData);
        }
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [JAVA_API_BASE_URL, navigate]);

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const isCurrentUser = (user) => {
    return currentUser && (user.userId === currentUser.userId || user.username === currentUser.username);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with home button */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Leaderboard Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-sm font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">RANK</th>
                  <th className="text-left text-sm font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">USER</th>
                  <th className="text-left text-sm font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No users yet.</td>
                  </tr>
                )}
                {users.map((u, idx) => {
                  const rank = idx + 1;
                  const medalIcon = getMedalIcon(rank);
                  const name = u.username || u.userId || 'Unknown';
                  const isCurrent = isCurrentUser(u);
                  
                  return (
                    <tr 
                      key={u.userId || u.username || idx} 
                      className={`${isCurrent ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {medalIcon && (
                            <span className="text-lg">{medalIcon}</span>
                          )}
                          <span className="text-gray-700 font-medium">{rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {rank === 1 && (
                            <span className="text-lg">🥈</span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {isCurrent ? `You (${name})` : name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-700 font-medium">
                          {u.score || 0} points
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Leaderboard; 