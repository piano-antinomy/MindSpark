import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [leaderboardRank, setLeaderboardRank] = useState(null);
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
      const response = await apiFetch(`${JAVA_API_BASE_URL}/leaderboard/rank`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboardRank(data.rank || 'N/A');
      }
    } catch (error) {
      console.error('Error loading leaderboard rank:', error);
      setLeaderboardRank('N/A');
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
      <div key={index} className="activity-item">
        <span className="activity-icon">{activity.type === 'quiz' ? '📝' : '🎯'}</span>
        <div className="activity-content">
          <span className="activity-message">{activity.message}</span>
          <small className="activity-date">{activity.date.toLocaleDateString()}</small>
        </div>
      </div>
    ));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const levelLabel = levelLabelFromInt(user.mathLevel);
  const nextTitle = getNextLevelLabel(user && typeof user.mathLevel === 'number' ? user.mathLevel : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <span className="text-lg">🏠</span>
            Home
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

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{user.username}</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-sm font-medium opacity-90 mb-1">Total Score</div>
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
                  <div className="text-sm font-medium opacity-90 mb-1">Math Level</div>
                  <div className="text-lg font-bold leading-tight">{levelLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200/50">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">👤</span>
                  Basic Profile
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'activities'
                    ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">⚡</span>
                  Recent Activities
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">📚</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Lessons Completed</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {user.completed_lessons ? user.completed_lessons.length : 0}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">📝</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Quizzes Taken</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {user.quiz_scores ? user.quiz_scores.length : 0}
                    </div>
                  </div>
                </div>

                {/* Learning Path */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Your Learning Path
                  </h3>
                  <p className="text-gray-600 mb-6">Continue your journey to mathematical mastery!</p>
                  <div className="flex flex-wrap gap-4">
                    <Link 
                      to="/subjects" 
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Explore Subjects
                    </Link>
                    <Link 
                      to="/quiz" 
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Take Quiz
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {updateRecentActivity(user)}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
