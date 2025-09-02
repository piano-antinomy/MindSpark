import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

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
    setLoading(false);
  }, [navigate]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const logout = async () => {
    try {
      await fetch(`${JAVA_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${JAVA_API_BASE_URL}/auth/profile`, {
        credentials: 'include'
      });

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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MindSpark Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.username}!</span>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Top grid with only the scoreboard */}
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Scoreboard Section */}
          <div className="dashboard-card scoreboard-card">
            <h2>📊 Your Scoreboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#6b7280' }}>Total Score:</span>
                <span style={{ fontSize: '3.5rem', fontWeight: '800', color: '#4f46e5', marginLeft: '1rem' }}>{user.score || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#6b7280' }}>Math Level Title:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#4f46e5', marginLeft: '1rem', whiteSpace: 'nowrap' }}>{levelLabel}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginLeft: 0, textAlign: 'center' }}>
                <span style={{ color: '#6b7280' }}>
                  do more quizs to unlock your next title: <strong>{nextTitle}</strong>
                </span>
                <Link to="/quiz" className="btn btn-primary">take quizs</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom grid with remaining cards in a 4-column layout */}
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }}>
          {/* Quick Stats */}
          <div className="dashboard-card stats-card">
            <h2>📈 Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{user.completed_lessons ? user.completed_lessons.length : 0}</span>
                <span className="stat-label">Lessons Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.quiz_scores ? user.quiz_scores.length : 0}</span>
                <span className="stat-label">Quizzes Taken</span>
              </div>
            </div>
          </div>

          {/* Learning Path */}
          <div className="dashboard-card learning-path-card">
            <h2>🎯 Your Learning Path</h2>
            <p>Choose what you want to learn next:</p>
            <Link to="/subjects" className="btn btn-primary">Explore Subjects</Link>
            <div className="current-progress">
              <h4>Continue Learning</h4>
              <div className="current-subject">
                {updateCurrentSubject(user)}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card activity-card">
            <h2>⚡ Recent Activity</h2>
            <div className="activity-list">
              {updateRecentActivity(user)}
            </div>
          </div>

          {/* Leaderboard Link */}
          <div className="dashboard-card leaderboard-card">
            <h2>🏅 Leaderboard</h2>
            <p>See how you stack up against others.</p>
            <Link to="/leaderboard" className="btn btn-primary">see leaderboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 