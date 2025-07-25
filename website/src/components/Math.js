import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Math() {
  const [activeTab, setActiveTab] = useState('problems');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levelsData, setLevelsData] = useState(null);
  const [yearsData, setYearsData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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

    // Load levels on component mount
    loadAvailableLevels();
  }, [navigate]);

  useEffect(() => {
    // Re-render MathJax when content changes
    if (window.MathJax && (currentStep === 3 || questionsData)) {
      window.MathJax.typesetPromise();
    }
  }, [currentStep, questionsData]);

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
    setQuestionsData(null);
    setCurrentQuestions([]);
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
    setError(null);
    loadAvailableLevels();
  };

  const backToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
    setQuestionsData(null);
    setCurrentQuestions([]);
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
    setError(null);
    loadAvailableLevels();
  };

  const backToYearSelection = () => {
    setCurrentStep(2);
    setSelectedYear(null);
    setQuestionsData(null);
    setCurrentQuestions([]);
    setCurrentAnswers({});
    setCurrentQuestionIndex(0);
    setError(null);
    if (selectedLevel) {
      loadAvailableYears(selectedLevel);
    }
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

  const selectYear = async (year) => {
    console.log('selectYear called with:', year);
    console.log('selectedLevel:', selectedLevel);
    setSelectedYear(year);
    setCurrentStep(3);
    setError(null);
    console.log('About to call loadQuestionsForLevelAndYear with level:', selectedLevel, 'year:', year);
    await loadQuestionsForLevelAndYear(selectedLevel, year);
  };

  const loadQuestionsForLevelAndYear = async (level, year) => {
    console.log('loadQuestionsForLevelAndYear called with level:', level, 'year:', year);
    setLoading(true);
    setError(null);
    try {
      const url = `${JAVA_API_BASE_URL}/questions/math/level/${level}/year/${year}`;
      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.success) {
          setQuestionsData(data);
          setCurrentQuestions(data.questions);
          setCurrentAnswers({});
          setCurrentQuestionIndex(0);
          setLoading(false);
          return data.questions;
        }
      }
      throw new Error(`Failed to load questions for level ${level} year ${year}`);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(`Failed to load questions for ${levelsData?.levelAMCTypes[level] || 'AMC_8'} ${year}. Please check your connection.`);
      setLoading(false);
      return [];
    }
  };

  const selectAnswer = (questionId, answer) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
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
      <div className="level-selection-container" style={{maxWidth: '800px', margin: '0 auto', textAlign: 'center'}}>
        <h2>Select the Math Competition Level</h2>
        
        <div className="levels-vertical" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '5rem'}}>
          {levelsData.levels.map(level => (
            <button 
              key={level}
              className="level-button" 
              onClick={() => selectLevel(level)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '16px',
                padding: '2rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)',
                fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.35)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.25)';
              }}
            >
              <h3 style={{margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '600', letterSpacing: '-0.5px'}}>
                {levelsData.levelAMCTypes[level]}
              </h3>
              <p style={{margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: '0.9', fontWeight: '300'}}>
                {getLevelDescription(level)}
              </p>
              <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.95rem', opacity: '0.8'}}>
                <span style={{background: 'rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '20px'}}>
                  {levelsData.levelCounts[level]} questions
                </span>
              </div>
            </button>
          ))}
          
          <button 
            className="quiz-button" 
            onClick={startLevelQuiz}
            style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
              border: '2px dashed rgba(255, 255, 255, 0.6)',
              borderRadius: '16px',
              padding: '1.8rem',
              color: '#8b5a6b',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(255, 154, 158, 0.2)',
              fontFamily: "'Segoe UI', 'SF Pro Display', system-ui, sans-serif",
              marginTop: '1rem'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 154, 158, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 154, 158, 0.2)';
            }}
          >
            <span style={{fontSize: '1.8rem', marginRight: '0.5rem'}}>🤔</span>
            <span style={{fontSize: '1.1rem', fontWeight: '500'}}>Not sure about your level? Do a quiz to find it out!</span>
          </button>
        </div>
        
        <div className="info-section" style={{background: '#f8f9fa', borderRadius: '12px', padding: '2rem', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
          <h4 style={{fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50', margin: '0 0 1.5rem 0'}}>About AMC Levels:</h4>
          <ul style={{fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: '1rem', lineHeight: '1.8', color: '#4a5568', margin: '0', paddingLeft: '1.5rem'}}>
            <li style={{marginBottom: '0.8rem'}}><strong style={{color: '#2d3748'}}>AMC 8:</strong> Middle school level (grades 6-8)</li>
            <li style={{marginBottom: '0.8rem'}}><strong style={{color: '#2d3748'}}>AMC 10:</strong> High school level (grades 9-10)</li>
            <li style={{marginBottom: '0'}}><strong style={{color: '#2d3748'}}>AMC 12:</strong> Advanced high school level (grades 11-12)</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderYearSelection = () => {
    if (!yearsData) return <div className="loading">Loading years...</div>;

    return (
      <div className="year-selection-container">
        <h2>{yearsData.amcType} Level</h2>
        
        {/* Personalized Training Option */}
        <div className="personalized-training-section">
          <button className="personalized-training-button" onClick={startPersonalizedTraining}>
            <span className="button-icon">🎯</span>
            <span className="button-title">Smart Practice Mode</span>
            <span className="button-subtitle">AI-curated questions tailored to your skill level</span>
          </button>
        </div>
        
        <div className="training-option-divider">
          <span>OR</span>
        </div>
        
        <p><strong>Practice by Competition Year:</strong></p>
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

  const renderQuestionsInterface = () => {
    console.log('renderQuestionsInterface called');
    console.log('questionsData:', questionsData);
    console.log('currentQuestions:', currentQuestions);
    console.log('currentQuestionIndex:', currentQuestionIndex);
    
    if (!questionsData || !currentQuestions.length) return <div className="loading">Loading questions...</div>;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    console.log('currentQuestion:', currentQuestion);

    return (
      <div className="questions-interface">
        <div className="questions-header">
          <h2>Problem {currentQuestionIndex + 1}</h2>
          <div className="question-navigation">
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            <span className="question-counter">
              {currentQuestionIndex + 1} of {currentQuestions.length}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(currentQuestions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === currentQuestions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="question-container">
          <div className="question-content">
            <div 
              className="question-text" 
              dangerouslySetInnerHTML={{ __html: currentQuestion.question.text || currentQuestion.question }} 
            />
            
            <div className="choices">
              {currentQuestion.question.latex_choices && currentQuestion.question.latex_choices.length > 0 ? (
                currentQuestion.question.latex_choices.map((choice, index) => (
                  <label 
                    key={index} 
                    className={`choice ${currentAnswers[currentQuestion.id] === String.fromCharCode(65 + index) ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={String.fromCharCode(65 + index)}
                      checked={currentAnswers[currentQuestion.id] === String.fromCharCode(65 + index)}
                      onChange={() => selectAnswer(currentQuestion.id, String.fromCharCode(65 + index))}
                    />
                    <span className="choice-text" dangerouslySetInnerHTML={{ __html: choice }} />
                  </label>
                ))
              ) : currentQuestion.question.text_choices && currentQuestion.question.text_choices.length > 0 ? (
                currentQuestion.question.text_choices.map((choice, index) => (
                  <label 
                    key={index} 
                    className={`choice ${currentAnswers[currentQuestion.id] === String.fromCharCode(65 + index) ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={String.fromCharCode(65 + index)}
                      checked={currentAnswers[currentQuestion.id] === String.fromCharCode(65 + index)}
                      onChange={() => selectAnswer(currentQuestion.id, String.fromCharCode(65 + index))}
                    />
                    <span className="choice-text">{choice}</span>
                  </label>
                ))
              ) : (
                <p>No choices available for this question.</p>
              )}
            </div>
          </div>
        </div>

        <div className="questions-actions">
          <button className="btn btn-primary" onClick={() => console.log('Check answers')}>
            Check Answer
          </button>
          <button className="btn btn-secondary" onClick={() => console.log('Show solution')}>
            Show Solution
          </button>
        </div>
      </div>
    );
  };

  const renderProblemsContent = () => {
    console.log('renderProblemsContent called');
    console.log('currentStep:', currentStep);
    console.log('error:', error);
    console.log('loading:', loading);
    console.log('levelsData:', levelsData);
    console.log('yearsData:', yearsData);
    console.log('questionsData:', questionsData);
    console.log('currentQuestions:', currentQuestions);
    
    if (error) return renderError();
    if (loading) return <div className="loading">Loading...</div>;
    
    if (currentStep === 1) {
      return renderLevelSelection();
    } else if (currentStep === 2) {
      return renderYearSelection();
    } else if (currentStep === 3) {
      return renderQuestionsInterface();
    }
    
    return <div>Something went wrong</div>;
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
              <p>Selected: {levelsData?.levelAMCTypes[selectedLevel]}</p>
              <div className="level-badge">{levelsData?.levelAMCTypes[selectedLevel]}</div>
            </div>
          )}
          {currentStep === 3 && questionsData && !error && (
            <div>
              <h3>{questionsData.amcType} {questionsData.year}</h3>
              <p>Level {questionsData.level} • {questionsData.count} Questions</p>
              <div className="level-badge">{questionsData.amcType}</div>
              <div style={{marginTop: '0.5rem', fontSize: '0.9rem', color: '#666'}}>
                Year: {questionsData.year}
              </div>
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
          {currentStep > 2 && !error && (
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