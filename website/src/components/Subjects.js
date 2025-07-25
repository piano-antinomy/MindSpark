import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadSubjects();
  }, [navigate]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const loadSubjects = () => {
    // Hardcoded subjects - no backend API call needed
    const subjectsData = [
      {
        id: 'math',
        name: 'Math Competition Training',
        available: true
      },
      {
        id: 'music',
        name: 'Music',
        available: false
      },
      {
        id: 'chess',
        name: 'Chess',
        available: false
      }
    ];
    
    setSubjects(subjectsData);
    setLoading(false);
  };

  const selectSubject = (subjectId) => {
    switch(subjectId) {
      case 'math':
        navigate('/math');
        break;
      case 'music':
        showComingSoon('Music');
        break;
      case 'chess':
        showComingSoon('Chess');
        break;
      case 'python':
        showComingSoon('Python Coding');
        break;
      case 'java':
        showComingSoon('Java Coding');
        break;
      default:
        showComingSoon('This subject');
    }
  };

  const showComingSoon = (subjectName) => {
    alert(`${subjectName} is coming soon! Currently, only Mathematics is available for learning.`);
  };

  const subjectIcons = {
    'math': '📊',
    'music': '🎵',
    'chess': '♟️',
    'python': '🐍',
    'java': '☕'
  };

  if (loading) {
    return <div className="loading">Loading subjects...</div>;
  }

  return (
    <div className="subjects-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Choose Your Learning Subject</h1>
          <p>Select what you'd like to learn today</p>
          <nav className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link> {'>'} Subjects
          </nav>
        </div>
      </header>

      <main className="subjects-main">
        <div className="subjects-grid">
          {subjects.map(subject => (
            <div 
              key={subject.id}
              className={`subject-card ${subject.available ? '' : 'disabled'}`}
              onClick={() => subject.available && selectSubject(subject.id)}
            >
              <div className="subject-icon">{subjectIcons[subject.id] || '📚'}</div>
              <div className="subject-name">{subject.name}</div>
              <div className={`subject-status ${subject.available ? 'status-available' : 'status-coming-soon'}`}>
                {subject.available ? 'Available' : 'Coming Soon'}
              </div>
              {subject.available ? (
                <p>Click to start learning!</p>
              ) : (
                <p>This subject will be available soon.</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Subjects; 