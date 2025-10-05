import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardRank, setLeaderboardRank] = useState(null);
  const [quizStats, setQuizStats] = useState({ inProgress: 0, completed: 0 });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [currentAvatarPage, setCurrentAvatarPage] = useState(1);
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

  const levelLabelFromInt = (level) => {
    // Map level numbers to labels based on ranges
    if (level < 2) return '🍼 Number Nibbler';
    if (level >= 2 && level <= 9) return '🐣 Counting Kid';
    if (level >= 10 && level <= 19) return '🦄 Math Explorer';
    if (level >= 20 && level <= 39) return '🚀 Addition Adventurer';
    if (level >= 40 && level <= 59) return '🧙 Subtraction Sorcerer';
    if (level >= 60 && level <= 79) return '🦸 Multiplication Hero';
    if (level >= 80 && level <= 99) return '🧩 Division Detective';
    if (level >= 100 && level <= 149) return '🏆 Fraction Master';
    if (level >= 150 && level <= 199) return '🧠 Algebra Ace';
    if (level >= 200) return '🔬 Number Scientist';
    
    return 'Not Assessed';
  };

  // Helper: given a level, return the next title tier (next label value)
  const LEVEL_LABELS_ASC = [
    '🍼 Number Nibbler',
    '🐣 Counting Kid',
    '🦄 Math Explorer',
    '🚀 Addition Adventurer',
    '🧙 Subtraction Sorcerer',
    '🦸 Multiplication Hero',
    '🧩 Division Detective',
    '🏆 Fraction Master',
    '🧠 Algebra Ace',
    '🔬 Number Scientist'
  ];

  const getNextLevelLabel = (level) => {
    const currentLabel = levelLabelFromInt(typeof level === 'number' ? level : 0);
    const idx = LEVEL_LABELS_ASC.indexOf(currentLabel);
    if (idx === -1) return LEVEL_LABELS_ASC[0];
    // If already at top tier, keep showing the top title
    return LEVEL_LABELS_ASC[Math.min(idx + 1, LEVEL_LABELS_ASC.length - 1)];
  };

  // Calculate points needed to reach the next level tier
  const getPointsToNextLevel = (currentLevel) => {
    if (typeof currentLevel !== 'number') return null;
    
    // Define the level tier thresholds
    const levelThresholds = [
      { min: 0, max: 1, tier: '🍼 Number Nibbler' },
      { min: 2, max: 9, tier: '🐣 Counting Kid' },
      { min: 10, max: 19, tier: '🦄 Math Explorer' },
      { min: 20, max: 39, tier: '🚀 Addition Adventurer' },
      { min: 40, max: 59, tier: '🧙 Subtraction Sorcerer' },
      { min: 60, max: 79, tier: '🦸 Multiplication Hero' },
      { min: 80, max: 99, tier: '🧩 Division Detective' },
      { min: 100, max: 149, tier: '🏆 Fraction Master' },
      { min: 150, max: 199, tier: '🧠 Algebra Ace' },
      { min: 200, max: Infinity, tier: '🔬 Number Scientist' }
    ];
    
    // Find current tier
    const currentTier = levelThresholds.find(tier => 
      currentLevel >= tier.min && currentLevel <= tier.max
    );
    
    if (!currentTier) return null;
    
    // If already at the highest tier, return null
    if (currentTier.tier === '🔬 Number Scientist') return null;
    
    // Find next tier
    const currentTierIndex = levelThresholds.findIndex(tier => tier.tier === currentTier.tier);
    const nextTier = levelThresholds[currentTierIndex + 1];
    
    if (!nextTier) return null;
    
    // Calculate points needed to reach the next tier
    const pointsNeeded = nextTier.min - currentLevel;
    return Math.max(0, pointsNeeded);
  };

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadUserProfile();
    loadLeaderboardRank();
    loadQuizStats();
    setLoading(false);
  }, [navigate]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const logout = async () => {
    try {
      await apiFetch(`${JAVA_API_BASE_URL}/auth/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleEditUsername = () => {
    setTempUsername(user.username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    if (!tempUsername.trim()) {
      alert('Username cannot be empty');
      return;
    }

    try {
      const updatedUser = { ...user, username: tempUsername.trim() };
      
      // Update backend
      const response = await apiFetch(`${JAVA_API_BASE_URL}/auth/profile`, {
        method: 'POST',
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Use the updated user data from the backend response
          setUser(data.user);
          // Update localStorage with the backend response
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setIsEditingUsername(false);
          console.log('Username updated successfully');
        } else {
          alert('Failed to update username');
        }
      } else {
        console.log('HTTP error:', response.status, response.statusText);
        alert('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Error updating username');
    }
  };

  const handleCancelEdit = () => {
    setTempUsername('');
    setIsEditingUsername(false);
  };

  const handleEditAvatar = () => {
    setIsEditingAvatar(true);
    setCurrentAvatarPage(1);
  };

  const handleSaveAvatar = async (avatarNumber) => {
    try {
      const updatedUser = { ...user, avatarLink: avatarNumber.toString() };
      
      // Update backend
      const response = await apiFetch(`${JAVA_API_BASE_URL}/auth/profile`, {
        method: 'POST',
        body: JSON.stringify(updatedUser)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Use the updated user data from the backend response
          setUser(data.user);
          // Update localStorage with the backend response
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setIsEditingAvatar(false);
          console.log('Avatar updated successfully');
        } else {
          console.log('Backend response:', data);
          alert('Failed to update avatar');
        }
      } else {
        console.log('HTTP error:', response.status, response.statusText);
        alert('Failed to update avatar');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Error updating avatar');
    }
  };

  const handleCancelAvatarEdit = () => {
    setIsEditingAvatar(false);
    setCurrentAvatarPage(1);
  };

  // Pagination logic for avatars
  const avatarsPerPage = 10; // 2 rows × 5 avatars per row
  const totalPages = Math.ceil(24 / avatarsPerPage);
  
  const getCurrentPageAvatars = () => {
    const startIndex = (currentAvatarPage - 1) * avatarsPerPage;
    const endIndex = startIndex + avatarsPerPage;
    return Array.from({ length: 24 }, (_, i) => i + 1).slice(startIndex, endIndex);
  };

  const goToNextPage = () => {
    if (currentAvatarPage < totalPages) {
      setCurrentAvatarPage(currentAvatarPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentAvatarPage > 1) {
      setCurrentAvatarPage(currentAvatarPage - 1);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await apiFetch(`${JAVA_API_BASE_URL}/auth/profile`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to localStorage if server request fails
      const currentUser = checkAuthStatus();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  };

  const loadLeaderboardRank = async () => {
    try {
      console.log('Loading leaderboard rank from:', `${JAVA_API_BASE_URL}/leaderboard/rank`);
      const response = await apiFetch(`${JAVA_API_BASE_URL}/leaderboard/rank`);
      console.log('Leaderboard rank response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Leaderboard rank response data:', data);
        setLeaderboardRank(data.rank || 'N/A');
      } else {
        console.error('Leaderboard rank response not ok:', response.status, response.statusText);
        setLeaderboardRank('N/A');
      }
    } catch (error) {
      console.error('Error loading leaderboard rank:', error);
      setLeaderboardRank('N/A');
    }
  };

  const loadQuizStats = async () => {
    try {
      const currentUser = checkAuthStatus();
      if (!currentUser) return;

      console.log('Loading quiz stats for user:', currentUser.userId);
      const response = await apiFetch(`${JAVA_API_BASE_URL}/progress/user/${currentUser.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Quiz stats response data:', data);
        
        if (data.success && data.progress && data.progress.quizProgress) {
          const quizProgressMap = data.progress.quizProgress;
          let inProgress = 0;
          let completed = 0;
          
          Object.values(quizProgressMap).forEach(quiz => {
            if (quiz.completed) {
              completed++;
            } else {
              inProgress++;
            }
          });
          
          setQuizStats({ inProgress, completed });
        } else {
          setQuizStats({ inProgress: 0, completed: 0 });
        }
      } else {
        console.error('Quiz stats response not ok:', response.status, response.statusText);
        setQuizStats({ inProgress: 0, completed: 0 });
      }
    } catch (error) {
      console.error('Error loading quiz stats:', error);
      setQuizStats({ inProgress: 0, completed: 0 });
    }
  };

  const updateRecentQuizzes = (quizScores) => {
    if (!quizScores || quizScores.length === 0) {
      return <p>No quiz results yet. Start learning to see your progress!</p>;
    }
    
    const recentQuizzes = quizScores.slice(-3).reverse();
    return recentQuizzes.map((quiz, index) => (
      <div key={index} className="quiz-result">
        <strong>{quiz.topic}</strong><br />
        <span className="score">Score: {quiz.score.toFixed(1)}%</span><br />
        <small>{new Date(quiz.date).toLocaleDateString()}</small>
      </div>
    ));
  };

  const updateCurrentSubject = (user) => {
    if (user.mathLevel) {
      return (
        <div className="current-subject-info">
          <h5>Mathematics - {user.mathLevel} Level</h5>
          <p>Continue your math journey!</p>
          <Link to="/math" className="btn btn-primary">Continue Learning</Link>
        </div>
      );
    } else {
      return (
        <>
          <p>Take an assessment to get started!</p>
          <Link to="/subjects" className="btn btn-primary">Choose Subject</Link>
        </>
      );
    }
  };

  const updateRecentActivity = (user) => {
    // Use the new activities data from user object if available
    if (user.recentActivities && user.recentActivities.length > 0) {
      return user.recentActivities.slice(0, 10).map((activity, index) => {
        const activityDate = new Date(activity.timestamp);
        const activityMessage = getActivityMessage(activity);
        
        return (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-sm text-gray-700">{activityMessage}</span>
            <small className="text-xs text-gray-500 ml-4">{activityDate.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</small>
          </div>
        );
      });
    }
    
    // Fallback to old logic if no activities data
    const activities = [];
    
    // Add quiz activities
    if (user.quiz_scores && user.quiz_scores.length > 0) {
      const recentQuiz = user.quiz_scores[user.quiz_scores.length - 1];
      activities.push({
        type: 'quiz',
        message: `Completed ${recentQuiz.topic} quiz with ${recentQuiz.score.toFixed(1)}% score`,
        date: new Date(recentQuiz.date)
      });
    }
    
    // Add level assessment activity
    if (user.mathLevel) {
      activities.push({
        type: 'assessment',
        message: `Math level assessed as ${user.mathLevel} as of `,
        date: new Date()
      });
    }
    
    if (activities.length === 0) {
      return <p>Start learning to see your activity here!</p>;
    }
    
    // Sort by date (most recent first)
    activities.sort((a, b) => b.date - a.date);
    
    return activities.slice(0, 5).map((activity, index) => (
      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
        <span className="text-sm text-gray-700">{activity.message}</span>
        <small className="text-xs text-gray-500 ml-4">{activity.date.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</small>
      </div>
    ));
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'user_registration':
        return '🎉';
      case 'start_quiz':
        return '📝';
      case 'complete_quiz':
        return '✅';
      case 'update_avatar':
        return '🖼️';
      case 'update_username':
        return '✏️';
      case 'login':
        return '🔑';
      case 'logout':
        return '🚪';
      case 'achievement_unlocked':
        return '🏆';
      default:
        return '⚡';
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'user_registration':
        return 'Joined MindSpark!';
      case 'start_quiz':
        return `Started quiz${activity.referenceId ? ` (${activity.referenceId})` : ''}`;
      case 'complete_quiz':
        return `Completed quiz${activity.referenceId ? ` (${activity.referenceId})` : ''}`;
      case 'update_avatar':
        return 'Updated avatar';
      case 'update_username':
        return 'Updated username';
      case 'login':
        return 'Logged in';
      case 'logout':
        return 'Logged out';
      case 'achievement_unlocked':
        return 'Unlocked new achievement!';
      default:
        return 'Activity recorded';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const levelLabel = levelLabelFromInt(user.mathLevel);
  const nextTitle = getNextLevelLabel(user && typeof user.mathLevel === 'number' ? user.mathLevel : 0);
  const pointsToNextLevel = getPointsToNextLevel(user.mathLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link 
            to="/" 
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <img 
              src="/resources/sparksio.png" 
              alt="Home" 
              className="h-6 w-auto"
            />
          </Link>
          <button 
            onClick={logout} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* User Hero Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 mb-8 overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 to-purple-100/30"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/20 to-indigo-200/20 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <img 
                  src={`/resources/images/avaters/${user.avatarLink || '1'}.png`}
                  alt={`${user.username} avatar`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                  onError={(e) => {
                    e.target.src = '/resources/images/avaters/1.png';
                  }}
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">🏆</span>
                </div>
              </div>
              <button 
                onClick={handleEditAvatar}
                className="mt-3 bg-white text-indigo-600 px-3 py-1 rounded-md font-medium text-xs border border-indigo-600 transition duration-200 hover:bg-indigo-50 shadow-md"
              >
                Edit
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-600 focus:outline-none focus:border-indigo-800"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveUsername();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <button 
                      onClick={handleSaveUsername}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md font-medium text-xs transition duration-200 hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-3 py-1 rounded-md font-medium text-xs transition duration-200 hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-4xl font-bold text-gray-900">{user.username}</h2>
                    <button 
                      onClick={handleEditUsername}
                      className="bg-white text-indigo-600 px-3 py-1 rounded-md font-medium text-xs border border-indigo-600 transition duration-200 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
              {user.createdAt && (
                <p className="text-sm text-gray-600 mb-6">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Score */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-sm font-medium opacity-90 mb-1">Total Points</div>
                  <div className="text-3xl font-bold">{user.score || 0}</div>
                </div>

                {/* Rank */}
                <div 
                  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/leaderboard')}
                >
                  <div className="text-sm font-medium opacity-90 mb-1">Leaderboard Rank</div>
                  <div className="text-3xl font-bold">#{leaderboardRank || 'N/A'}</div>
                  <div className="text-xs opacity-75 mt-1">Click to view</div>
                </div>

                {/* Level */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-sm font-medium opacity-90 mb-1">Achievement</div>
                  <div className="text-lg font-bold leading-tight mb-2">{levelLabel}</div>
                  {pointsToNextLevel !== null ? (
                    <div className="text-xs opacity-75">
                      {pointsToNextLevel} {pointsToNextLevel === 1 ? 'point' : 'points'} to unlock next achievement
                    </div>
                  ) : (
                    <div className="text-xs opacity-75">
                      Max level reached! 🎉
                    </div>
                  )}
                </div>

                {/* Quizzes */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-sm font-medium opacity-90 mb-1">Quizzes</div>
                  {quizStats.inProgress > 0 ? (
                    <div className="space-y-1">
                      <div className="text-lg font-bold">In Progress: {quizStats.inProgress}</div>
                      <div className="text-lg font-bold">Completed: {quizStats.completed}</div>
                    </div>
                  ) : (
                    <div className="text-lg font-bold">{quizStats.completed}</div>
                  )}
                  <div className="text-xs opacity-75 mt-1">
                    {quizStats.inProgress > 0 ? 'Keep going!' : 'Great work!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Recent Activities
          </h3>
          <div className="space-y-4">
            {updateRecentActivity(user)}
          </div>
        </div>
      </main>

      {/* Avatar Selection Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Select Avatar</h3>
              <button 
                onClick={handleCancelAvatarEdit}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>
            
            {/* Avatar Grid */}
            <div className="space-y-4 mb-6">
              {/* First Row */}
              <div className="grid grid-cols-5 gap-4">
                {getCurrentPageAvatars().slice(0, 5).map((avatarNum) => (
                  <button
                    key={avatarNum}
                    onClick={() => handleSaveAvatar(avatarNum)}
                    className={`w-20 h-20 rounded-full border-3 transition duration-200 hover:scale-110 ${
                      user.avatarLink === avatarNum.toString() 
                        ? 'border-indigo-600 ring-4 ring-indigo-300' 
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <img 
                      src={`/resources/images/avaters/${avatarNum}.png`}
                      alt={`Avatar ${avatarNum}`}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/resources/images/avaters/1.png';
                      }}
                    />
                  </button>
                ))}
              </div>
              
              {/* Second Row */}
              <div className="grid grid-cols-5 gap-4">
                {getCurrentPageAvatars().slice(5, 10).map((avatarNum) => (
                  <button
                    key={avatarNum}
                    onClick={() => handleSaveAvatar(avatarNum)}
                    className={`w-20 h-20 rounded-full border-3 transition duration-200 hover:scale-110 ${
                      user.avatarLink === avatarNum.toString() 
                        ? 'border-indigo-600 ring-4 ring-indigo-300' 
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <img 
                      src={`/resources/images/avaters/${avatarNum}.png`}
                      alt={`Avatar ${avatarNum}`}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/resources/images/avaters/1.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center">
              <button 
                onClick={goToPreviousPage}
                disabled={currentAvatarPage === 1}
                className={`px-6 py-3 rounded-lg text-base font-medium transition duration-200 ${
                  currentAvatarPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Previous
              </button>
              
              <span className="text-lg font-medium text-gray-700">
                Page {currentAvatarPage} of {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentAvatarPage === totalPages}
                className={`px-6 py-3 rounded-lg text-base font-medium transition duration-200 ${
                  currentAvatarPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
