import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMathLevelInfo } from '../utils/levelMapping';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

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



  const updateCurrentSubject = (user) => {
    if (user.mathLevel || user.mathLevel === 0) {
      const { title } = getMathLevelInfo(user.mathLevel);
      return (
        <div className="current-subject-info">
          <h5>Mathematics — {title}</h5>
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
    if (user.mathLevel || user.mathLevel === 0) {
      const { title } = getMathLevelInfo(user.mathLevel);
      activities.push({
        type: 'assessment',
        message: `Math level assessed as ${title}`,
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

  const { title: levelTitle, description: levelDescription } = getMathLevelInfo(user.mathLevel);

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
        <div className="dashboard-grid">
          {/* Scoreboard Section */}
          <div className="dashboard-card scoreboard-card">
            <h2>📊 Your Scoreboard</h2>
            <div className="score-display">
              <div className="total-score">
                <h3>Total Score</h3>
                <span className="score-number">{user.score || 0}</span>
              </div>
              <div className="level-info">
                <div className="level-caption">Math level</div>
                <span className={`level-badge ${levelTitle.toLowerCase()}`}>
                  {levelTitle}
                </span>
                <div className="level-description">
                  <small>{levelDescription}</small>
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 