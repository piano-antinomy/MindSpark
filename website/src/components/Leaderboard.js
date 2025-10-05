import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const navigate = useNavigate();
  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // First get current user info
        const currentUserRes = await apiFetch(`${JAVA_API_BASE_URL}/auth/profile`);
        if (currentUserRes.status === 401) {
          navigate('/login');
          return;
        }
        if (!currentUserRes.ok) {
          throw new Error('Failed to fetch current user');
        }
        const currentUserData = await currentUserRes.json();
        setCurrentUser(currentUserData);
        
        // Then get focused leaderboard data with current user ID
        const userId = currentUserData.user?.userId;
        if (!userId) {
          throw new Error('No user ID found');
        }
        
        console.log('Fetching leaderboard for userId:', userId);
        console.log('API URL:', `${JAVA_API_BASE_URL}/leaderboard/get-focused-leaderboard?userId=${encodeURIComponent(userId)}`);
        
        const res = await apiFetch(`${JAVA_API_BASE_URL}/leaderboard/get-focused-leaderboard?userId=${encodeURIComponent(userId)}`);
        
        console.log('Leaderboard API response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Leaderboard API error:', errorText);
          throw new Error(`Failed to fetch focused leaderboard: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        const list = Array.isArray(data.users) ? data.users : [];
        setUsers(list);
        setTotalUsers(data.totalUsers || 0);
        setCurrentUserRank(data.currentUserRank || null);
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [JAVA_API_BASE_URL, navigate]);

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const isCurrentUser = (user) => {
    if (!currentUser || !currentUser.user) return false;
    
    // Access the nested user object
    const actualCurrentUser = currentUser.user;
    const userIdMatch = user.userId === actualCurrentUser.userId;
    const usernameMatch = user.username === actualCurrentUser.username;
    
    return userIdMatch || usernameMatch;
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
      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Congratulatory Message with Home Button */}
        {currentUserRank && totalUsers > 0 ? (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <img 
                  src="/resources/sparksio.png" 
                  alt="Home" 
                  className="h-6 w-auto"
                />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                🎉 Congratulations!
              </h2>
              <div className="w-20"></div>
            </div>
            <p className="text-gray-700 text-center">
              You rank <span className="font-bold text-blue-600">#{currentUserRank}</span> among <span className="font-bold text-blue-600">{totalUsers}</span> users. Keep up the great work! 🚀
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <img 
                src="/resources/sparksio.png" 
                alt="Home" 
                className="h-6 w-auto"
              />
            </button>
          </div>
        )}
        
        {/* Leaderboard Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full bg-white">
              <thead className="bg-indigo-600">
                <tr>
                  <th className="text-left text-sm font-semibold text-white uppercase tracking-wider px-6 py-3">RANK</th>
                  <th className="text-left text-sm font-semibold text-white uppercase tracking-wider px-6 py-3">USER</th>
                  <th className="text-left text-sm font-semibold text-white uppercase tracking-wider px-6 py-3">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No users yet.</td>
                  </tr>
                )}
                {users.map((u, idx) => {
                  // The backend should provide the rank, but fallback to index + 1
                  const actualRank = u.rank || (idx + 1);
                  
                  const medalIcon = getMedalIcon(actualRank);
                  const name = u.username || u.userId || 'Unknown';
                  const isCurrent = isCurrentUser(u);
                  
                  return (
                      <tr 
                        key={u.userId || u.username || idx} 
                        className={`${isCurrent ? 'bg-blue-50 shadow-lg my-2 hover:shadow-2xl hover:bg-blue-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-all duration-300 ease-in-out`}
                        style={isCurrent ? { border: '3px solid #3b82f6', borderRadius: '8px' } : {}}
                      >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {medalIcon && (
                            <span className="text-lg">{medalIcon}</span>
                          )}
                          <span className={`text-gray-700 ${isCurrent ? 'font-bold' : 'font-medium'}`}>{actualRank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {actualRank === 1 && (
                            <span className="text-lg">🥈</span>
                          )}
                          <div>
                            <div className={`${isCurrent ? 'font-bold' : 'font-medium'} text-gray-900`}>
                              {isCurrent ? `You (${name})` : name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap text-left">
                        <div className={`text-gray-700 ${isCurrent ? 'font-bold' : 'font-medium'} px-6`}>
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