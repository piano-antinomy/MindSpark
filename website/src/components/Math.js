import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Math() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levelsData, setLevelsData] = useState(null);
  const [yearsData, setYearsData] = useState(null);
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load available levels on component mount
    loadAvailableLevels();
  }, [navigate]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const switchToTab = (tabName) => {
    if (tabName === 'quiz') {
      navigate('/quiz');
      return;
    } else if (tabName === 'problems') {
      resetToLevelSelection();
    }
  };

  const resetToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
    setError(null);
    loadAvailableLevels();
  };

  const backToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
    setError(null);
    loadAvailableLevels();
  };

  const loadAvailableLevels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLevelsData(data);
          setLoading(false);
          return data.levels;
        }
      }
      throw new Error('Failed to load available levels');
    } catch (error) {
      console.error('Error loading available levels:', error);
      setError('Failed to connect to the backend. Please make sure the backend server is running.');
      setLoading(false);
      return [];
    }
  };

  const selectLevel = async (level) => {
    setSelectedLevel(level);
    setCurrentStep(2);
    setError(null);
    await loadAvailableYears(level);
  };

  const loadAvailableYears = async (level) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/years`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setYearsData(data);
          setLoading(false);
          return data.years;
        }
      }
      throw new Error(`Failed to load years for level ${level}`);
    } catch (error) {
      console.error('Error loading years:', error);
      setError(`Failed to load years for ${levelsData?.levelAMCTypes[level] || 'AMC_8'}. Please check your connection.`);
      setLoading(false);
      return [];
    }
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    // Navigate to the questions page with the selected level and year
    navigate('/math-questions', { 
      state: { 
        level: selectedLevel, 
        year: year,
        amcType: yearsData?.amcType,
        levelDescription: getLevelDescription(selectedLevel)
      } 
    });
  };

  const getLevelDescription = (level) => {
    const descriptions = {
      1: "Middle school mathematics competition",
      2: "High school mathematics competition", 
      3: "Advanced high school mathematics competition"
    };
    return descriptions[level] || "Mathematics competition";
  };

  const startPersonalizedTraining = () => {
    alert(`🎯 Smart Practice Mode - Coming Soon!
    
This feature will include:
• AI-powered question selection based on your skill level
• Adaptive difficulty that learns from your performance  
• Focus on your weak areas to accelerate improvement
• Mixed questions from multiple years for comprehensive practice
• Progress tracking with detailed analytics

For now, please select a specific competition year to practice with traditional AMC questions.`);
  };

  const startLevelQuiz = () => {
    alert(`🤔 Level Assessment Quiz - Coming Soon!

This adaptive quiz will help determine your optimal AMC level by:
• Presenting a mix of problems from different levels
• Analyzing your problem-solving approach and accuracy
• Recommending the best starting level for your skill
• Providing personalized learning path suggestions

For now, here's a quick guide:
• New to competitive math? Start with AMC 8
• Comfortable with algebra and geometry? Try AMC 10  
• Advanced topics like trigonometry and calculus? Go with AMC 12

Please select a level above to begin practicing!`);
  };

  const renderError = () => (
    <div className="error-message">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={resetToLevelSelection} className="btn btn-primary">Try Again</button>
      <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
    </div>
  );

  const renderLevelSelection = () => {
    if (!levelsData) return <div className="loading">Loading levels...</div>;

    return (
      <div className="level-selection-container">
        <h2>Choose Your AMC Level</h2>
        <p>Select the difficulty level that matches your current skills</p>
        
        <div className="levels-grid">
          {levelsData.levels.map(level => (
            <button
              key={level}
              className="level-button"
              onClick={() => selectLevel(level)}
            >
              <h3>{levelsData.levelAMCTypes[level]}</h3>
              <p>{getLevelDescription(level)}</p>
              <div className="question-count">
                {levelsData.levelCounts[level]} Questions • {levelsData.levelYearCounts[level]} Years
              </div>
            </button>
          ))}
        </div>

        <div className="training-option-divider">
          <span>or</span>
        </div>

        <div className="personalized-training-section">
          <button className="personalized-training-button" onClick={startPersonalizedTraining}>
            <span className="button-icon">🎯</span>
            <span className="button-title">Smart Practice Mode</span>
            <span className="button-subtitle">AI-curated questions tailored to your skill level</span>
          </button>
        </div>

        <div className="quiz-section" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className="quiz-button"
            onClick={startLevelQuiz}
            style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(255, 154, 158, 0.3)'
            }}
          >
            🤔 Level Assessment Quiz
          </button>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            Not sure which level? Take our adaptive assessment!
          </p>
        </div>
      </div>
    );
  };

  const renderYearSelection = () => {
    if (!yearsData) return <div className="loading">Loading years...</div>;

    return (
      <div className="year-selection-container">
        <h2>{yearsData.amcType} Level</h2>
        <p>Choose a competition year to practice with</p>
        
        <div className="years-grid">
          {yearsData.years.map(year => (
            <button
              key={year}
              className="year-button"
              onClick={() => selectYear(year)}
            >
              <h3>{year}</h3>
              <p className="year-description">{yearsData.amcType} {year}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderProblemsContent = () => {
    if (error) return renderError();
    if (loading) return <div className="loading">Loading...</div>;
    
    if (currentStep === 1) {
      return renderLevelSelection();
    } else if (currentStep === 2) {
      return renderYearSelection();
    }
    
    return <div>Something went wrong</div>;
  };

  return (
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu" style={{ overflowY: 'auto', height: '100vh' }}>
        <div className="menu-header">
          <h1>📊 Mathematics</h1>
          <nav className="breadcrumb">
            <button onClick={() => navigate('/dashboard')} className="breadcrumb-link">
              Dashboard
            </button>
            {' > '}
            <button onClick={() => navigate('/subjects')} className="breadcrumb-link">
              Subjects
            </button>
            {' > '}
            Mathematics
          </nav>
        </div>
        
        <div className="menu-tabs">
          <button className="menu-tab" onClick={() => switchToTab('quiz')}>
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Quiz</span>
          </button>
          <button className="menu-tab active" onClick={() => switchToTab('problems')}>
            <span className="tab-icon">📚</span>
            <span className="tab-text">Problems</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="aside-info">
          {error && (
            <div>
              <h3>Error</h3>
              <p>Something went wrong</p>
            </div>
          )}
          {currentStep === 1 && !error && (
            <div>
              <h3>Level Selection</h3>
              <p>Choose the difficulty level that matches your current skills.</p>
            </div>
          )}
          {currentStep === 2 && selectedLevel && !error && (
            <div>
              <h3>{levelsData?.levelAMCTypes[selectedLevel]} Level</h3>
              <p>Select a competition year to practice with real AMC problems.</p>
            </div>
          )}
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          {currentStep > 1 && !error && (
            <button className="btn btn-secondary" onClick={backToLevelSelection}>
              ← Back to Levels
            </button>
          )}
        </div>
      </nav>

      {/* Main content area */}
      <main className="math-main-content" style={{ overflowY: 'auto', height: '100vh' }}>
        <div className="tab-content">
          <div className="problems-content">
            {renderProblemsContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Math; 