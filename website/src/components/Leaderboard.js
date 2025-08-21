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

  const getMedal = (rank) => {
    if (rank === 1) return { icon: '🥇', color: 'text-yellow-500' };
    if (rank === 2) return { icon: '🥈', color: 'text-gray-400' };
    if (rank === 3) return { icon: '🥉', color: 'text-amber-600' };
    return null;
  };

  const initialsFor = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="card p-8 animate-fade-in">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-2xl shadow-strong overflow-hidden">
          <div className="px-6 sm:px-8 py-6 flex items-center justify-between bg-white/70">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600 mt-1">See how you stack up across MindSpark learners</p>
            </div>
            <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
          </div>

          <div className="px-2 sm:px-6 pb-6">
            <div className="overflow-hidden rounded-xl shadow-soft bg-white/80">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Rank</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">User</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No users yet.</td>
                      </tr>
                    )}
                    {users.map((u, idx) => {
                      const rank = idx + 1;
                      const medal = getMedal(rank);
                      const name = u.username || u.userId || 'Unknown';
                      return (
                        <tr key={u.userId || u.username || idx} className="hover:bg-primary-50/40 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-semibold">
                                {rank}
                              </span>
                              {medal && (
                                <span className={`text-lg ${medal.color}`} aria-hidden>
                                  {medal.icon}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold shadow-soft">
                                {initialsFor(name)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{name}</div>
                                {typeof u.mathLevel === 'number' && (
                                  <div className="text-xs text-gray-500">Level {u.mathLevel}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-semibold">
                              {u.score ?? 0}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard; 