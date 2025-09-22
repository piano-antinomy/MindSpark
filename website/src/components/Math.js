import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

function Math() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [levelsData, setLevelsData] = useState(null);
  const [yearsData, setYearsData] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('A');
  const navigate = useNavigate();

  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

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
    setSelectedVersion('A');
    setError(null);
    loadAvailableLevels();
  };

  const backToLevelSelection = () => {
    setCurrentStep(1);
    setSelectedLevel(null);
    setSelectedYear(null);
    setSelectedVersion('A');
    setError(null);
    loadAvailableLevels();
  };

  const loadAvailableLevels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${JAVA_API_BASE_URL}/questions/math/`);
      
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
      const response = await apiFetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/years`);
      
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
    // Navigate to the questions page with the selected level, year, and version
    navigate('/math-questions', { 
      state: { 
        level: selectedLevel, 
        year: year,
        version: selectedVersion,
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

  const getYearRange = (level) => {
    const yearRanges = {
      1: "2000 to 2025",  // AMC 8
      2: "2002 to 2024",  // AMC 10
      3: "2002 to 2024"   // AMC 12
    };
    return yearRanges[level] || "Available years";
  };

  const formatAMCType = (amcType) => {
    if (!amcType) return "AMC";
    return amcType.replace(/_/g, " ");
  };

  const needsVersionTabs = (level) => {
    // AMC 10 and AMC 12 have version A and B, AMC 8 doesn't
    return level === 2 || level === 3; // AMC 10 and AMC 12
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
      <button onClick={() => navigate('/profile')} className="btn btn-secondary">Back to Profile</button>
    </div>
  );

  const renderLevelSelection = () => {
    if (!levelsData) return <div className="loading">Loading levels...</div>;

    return (
      <div className="level-selection-container">
        <div className="flex items-start justify-between mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 mt-2"
            title="Home"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </button>
          <div className="text-center">
            <h2>Click to view AMC problems</h2>
            <p>Select the difficulty level that matches your current skills</p>
          </div>
          <div className="w-14"></div>
        </div>
        
        <div className="levels-grid">
          {levelsData.levels.map((level, index) => {
            const colors = [
              'bg-gradient-to-br from-indigo-200 to-indigo-400',
              'bg-gradient-to-br from-green-200 to-green-300', 
              'bg-gradient-to-br from-yellow-200 to-yellow-300'
            ];
            return (
              <button
                key={level}
                className={`level-button ${colors[index % colors.length]} text-gray-800 hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
                onClick={() => selectLevel(level)}
              >
                {/* Fun wavy pattern inside each box */}
                <div className="absolute inset-0 opacity-50">
                  <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" preserveAspectRatio="none">
                    <path d="M0,80 Q100,20 200,80 Q300,140 400,80 L400,0 L0,0 Z" fill={`url(#waveGradient${level})`}/>
                    <defs>
                      <linearGradient id={`waveGradient${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="#3730a3" stopOpacity="0.4"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3>{formatAMCType(levelsData.levelAMCTypes[level])}</h3>
                  <p>{getLevelDescription(level)}</p>
                  <div className="question-count">
                    {levelsData.levelCounts[level]} Questions • {getYearRange(level)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="training-option-divider">
          <span>or</span>
        </div>

        <div className="personalized-training-section">
          <button 
            className="personalized-training-button bg-gradient-to-br from-indigo-600 to-indigo-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl" 
            onClick={() => navigate('/quiz')}
          >
            <span className="button-title">Take a Quiz</span>
            <span className="button-subtitle">Start practicing with timed quizzes</span>
          </button>
        </div>

      </div>
    );
  };

  const renderYearSelection = () => {
    if (!yearsData) return <div className="loading">Loading years...</div>;

    const years = yearsData.years || [];
    const showVersionTabs = needsVersionTabs(selectedLevel);
    
    // Filter years based on selected version for AMC 10 and AMC 12
    let filteredYears = years;
    if (showVersionTabs) {
      filteredYears = years.filter(year => {
        const yearStr = year.toString();
        return yearStr.endsWith(selectedVersion);
      });
    }
    
    const sortedYears = filteredYears.sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first

    return (
      <div className="year-selection-container">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Home"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </button>
            <button 
              onClick={backToLevelSelection}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span>Back to Levels</span>
            </button>
          </div>
          <div className="text-center">
            <h2>{formatAMCType(yearsData.amcType)}</h2>
          </div>
          <div className="w-32"></div>
        </div>
        
        {/* Version Tabs for AMC 10 and AMC 12 */}
        {showVersionTabs && (
          <div className="mb-8">
            <div className="flex justify-center space-x-8 border-b border-gray-200">
              <button
                onClick={() => setSelectedVersion('A')}
                className={`pb-4 px-4 text-xl font-bold transition-colors duration-200 ${
                  selectedVersion === 'A'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Version A
              </button>
              <button
                onClick={() => setSelectedVersion('B')}
                className={`pb-4 px-4 text-xl font-bold transition-colors duration-200 ${
                  selectedVersion === 'B'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Version B
              </button>
            </div>
          </div>
        )}
        
        {/* Year Selection List */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            Choose a Competition Year{showVersionTabs ? ` - Version ${selectedVersion}` : ''}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedYears.map((year, index) => (
              <button
                key={year}
                onClick={() => selectYear(year)}
                className="bg-white text-indigo-600 px-6 py-4 rounded-lg font-semibold text-lg border-2 border-indigo-600 transition duration-300 inline-flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                {/* Math Icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span>{year}</span>
              </button>
            ))}
          </div>
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Playful Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Math Symbols */}
        <div className="absolute top-20 left-10 text-6xl text-indigo-100 animate-bounce" style={{animationDelay: '0s'}}>π</div>
        <div className="absolute top-40 right-20 text-5xl text-indigo-100 animate-pulse" style={{animationDelay: '1s'}}>∑</div>
        <div className="absolute top-60 left-1/4 text-4xl text-indigo-100 animate-ping" style={{animationDelay: '2s'}}>√</div>
        <div className="absolute top-80 right-1/3 text-5xl text-indigo-100 animate-bounce" style={{animationDelay: '3s'}}>∞</div>
        <div className="absolute top-32 right-10 text-4xl text-indigo-100 animate-pulse" style={{animationDelay: '4s'}}>∫</div>
        <div className="absolute top-96 left-20 text-3xl text-indigo-100 animate-bounce" style={{animationDelay: '5s'}}>x²</div>
        <div className="absolute top-48 left-1/2 text-4xl text-indigo-100 animate-pulse" style={{animationDelay: '6s'}}>α</div>
        <div className="absolute top-72 right-1/4 text-3xl text-indigo-100 animate-ping" style={{animationDelay: '7s'}}>β</div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-24 left-1/3 w-8 h-8 border-4 border-indigo-200 rounded-full animate-spin" style={{animationDelay: '8s'}}></div>
        <div className="absolute top-48 right-1/4 w-6 h-6 bg-indigo-200 transform rotate-45 animate-pulse" style={{animationDelay: '9s'}}></div>
        <div className="absolute top-72 left-1/5 w-0 h-0 border-l-8 border-r-8 border-b-12 border-l-transparent border-r-transparent border-b-indigo-200 animate-bounce" style={{animationDelay: '10s'}}></div>
        <div className="absolute top-40 left-1/2 w-4 h-4 bg-indigo-200 rounded-full animate-ping" style={{animationDelay: '11s'}}></div>
        
        {/* Wavy Lines */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 1200 800" fill="none">
          <path d="M0,200 Q300,100 600,200 T1200,200 L1200,0 L0,0 Z" fill="url(#gradient1)"/>
          <path d="M0,400 Q400,300 800,400 T1200,400 L1200,200 L0,200 Z" fill="url(#gradient2)"/>
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
        
        {/* Floating Dots */}
        <div className="absolute top-16 right-1/2 w-3 h-3 bg-indigo-300 rounded-full animate-ping" style={{animationDelay: '12s'}}></div>
        <div className="absolute top-64 left-1/2 w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: '13s'}}></div>
        <div className="absolute top-96 right-1/5 w-4 h-4 bg-indigo-300 rounded-full animate-pulse" style={{animationDelay: '14s'}}></div>
      </div>

      {/* Main content area */}
      <main className="container mx-auto px-6 pt-1 relative z-10">
        {renderProblemsContent()}
      </main>
    </div>
  );
}

export default Math; 