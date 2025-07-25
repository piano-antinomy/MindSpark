import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Math() {
  const [activeTab, setActiveTab] = useState('problems');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Initialize MathJax
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  }, [navigate]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const switchToTab = (tabName) => {
    if (tabName === 'quiz') {
      navigate('/quiz');
      return;
    }
    setActiveTab(tabName);
    if (tabName === 'problems') {
      resetToLevelSelection();
    }
  };

  const resetToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
  };

  const backToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
  };

  const backToYearSelection = () => {
    setCurrentStep(2);
    setSelectedYear(null);
  };

  const selectLevel = (level) => {
    setSelectedLevel(level);
    setCurrentStep(2);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    setCurrentStep(3);
  };

  const renderQuizContent = () => (
    <div className="quiz-placeholder">
      <div className="placeholder-card">
        <h2>🎯 Quiz Mode</h2>
        <p>This feature is coming soon! Here you'll be able to:</p>
        <ul>
          <li>Take adaptive quizzes based on your skill level</li>
          <li>Get personalized question recommendations</li>
          <li>Track your progress over time</li>
          <li>Focus on your weak areas</li>
        </ul>
        <button className="btn btn-primary" onClick={() => switchToTab('problems')}>
          Go to Problems
        </button>
      </div>
    </div>
  );

  const renderProblemsContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="level-selection">
            <h2>Choose Your Level</h2>
            <div className="level-grid">
              <div className="level-card" onClick={() => selectLevel('AMC_8')}>
                <h3>AMC 8</h3>
                <p>Middle school level mathematics</p>
              </div>
              <div className="level-card" onClick={() => selectLevel('AMC_10')}>
                <h3>AMC 10</h3>
                <p>High school level mathematics</p>
              </div>
              <div className="level-card" onClick={() => selectLevel('AMC_12')}>
                <h3>AMC 12</h3>
                <p>Advanced high school mathematics</p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="year-selection">
            <h2>Choose Year for {selectedLevel}</h2>
            <div className="year-grid">
              {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(year => (
                <div key={year} className="year-card" onClick={() => selectYear(year)}>
                  <h3>{year}</h3>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="questions-interface">
            <h2>{selectedLevel} - {selectedYear}</h2>
            <p>Questions will be loaded here. This is a placeholder for the full implementation.</p>
            <button className="btn btn-secondary" onClick={backToYearSelection}>
              ← Back to Years
            </button>
          </div>
        );
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu">
        <div className="menu-header">
          <h1>📊 Mathematics</h1>
          <nav className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link> {'>'} 
            <Link to="/subjects">Subjects</Link> {'>'} 
            Mathematics
          </nav>
        </div>
        
        <div className="menu-tabs">
          <button 
            className={`menu-tab ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => switchToTab('quiz')}
          >
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Quiz</span>
          </button>
          <button 
            className={`menu-tab ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => switchToTab('problems')}
          >
            <span className="tab-icon">📚</span>
            <span className="tab-text">Problems</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="aside-info">
          {currentStep === 1 && (
            <div>
              <h3>Level Selection</h3>
              <p>Choose the difficulty level that matches your current skills.</p>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <h3>Year Selection</h3>
              <p>Select a specific year to practice problems from that competition.</p>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <h3>Practice Mode</h3>
              <p>Work through problems and check your answers.</p>
            </div>
          )}
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          {currentStep > 1 && (
            <button className="btn btn-secondary" onClick={backToLevelSelection}>
              ← Back to Levels
            </button>
          )}
          {currentStep > 2 && (
            <button className="btn btn-secondary" onClick={backToYearSelection}>
              ← Back to Years
            </button>
          )}
        </div>
      </nav>

      {/* Main content area */}
      <main className="math-main-content">
        {activeTab === 'quiz' && renderQuizContent()}
        {activeTab === 'problems' && renderProblemsContent()}
      </main>
    </div>
  );
}

export default Math; 