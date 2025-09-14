import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Quiz() {
  const [activeTab, setActiveTab] = useState('yourQuizzes');
  const [quizCreationStep, setQuizCreationStep] = useState(1);
  const [quizName, setQuizName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [levelsData, setLevelsData] = useState(null);
  const [error, setError] = useState(null);
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

    loadQuizzes();
  }, [navigate]);

  // Refresh quiz list when component becomes visible (user returns from quiz-taking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTab === 'yourQuizzes') {
        loadQuizzes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    console.log('currentUser', currentUser);
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const switchToQuizTab = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'createQuiz') {
      setQuizCreationStep(1);
      setQuizName('');
      setSelectedLevel(null);
      setSelectedYear(null);
      setError(null);
      loadAvailableLevels();
    } else if (tabName === 'yourQuizzes') {
      // Refresh quiz list when switching to "Your Quizzes" tab
      loadQuizzes();
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
    setQuizCreationStep(2);
    setError(null);
    await loadAvailableYears(level);
  };

  const loadAvailableYears = async (level) => {
    setYearsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/years`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableYears(data.years || []);
          setYearsLoading(false);
          return data.years;
        }
      }
      throw new Error(`Failed to load years for level ${level}`);
    } catch (error) {
      console.error('Error loading years:', error);
      setError(`Failed to load years for ${levelsData?.levelAMCTypes[level] || 'AMC_8'}. Please check your connection.`);
      setYearsLoading(false);
      return [];
    }
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

  const selectYear = async (year) => {
    try {
      const currentUser = checkAuthStatus();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Generate quiz name based on level and year
      const amcType = levelsData?.levelAMCTypes[selectedLevel];
      const quizName = `${formatAMCType(amcType)} ${year} Quiz`;
      
      // Generate quiz ID
      const quizId = `quiz_${selectedLevel}_${year}_${Date.now()}`;
      
      // Create question set ID
      const quizQuestionSetId = `${year}_${amcType}`;
      
      const requestBody = {
        userId: currentUser.userId,
        quizType: "standardAMC",
        quizId: quizId,
        quizName: quizName,
        quizQuestionSetId: quizQuestionSetId
      };
      
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const quizProgress = await response.json();
        console.log('Quiz created successfully:', quizProgress);
        
        // Navigate to quiz taking page with quizId in URL
        navigate(`/quiz-taking?quizId=${encodeURIComponent(quizProgress.quizId)}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create quiz:', errorData);
        alert(`Failed to create quiz: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    }
  };

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const currentUser = checkAuthStatus();
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const quizzesData = await response.json();
        console.log('Loaded quizzes from backend:', quizzesData);
        
        // Convert the backend format to the expected format
        const quizzesList = Object.entries(quizzesData).map(([quizId, quiz]) => {
          console.log(`Quiz ${quizId} data:`, quiz);
          console.log(`Quiz ${quizId} completed field:`, quiz.completed);
          return {
            id: quizId,
            name: quiz.quizName || 'Untitled Quiz',
            level: quiz.questionSetId ? quiz.questionSetId.split('_')[2] : 'AMC',
            year: quiz.questionSetId ? quiz.questionSetId.split('_')[0] : '2024',
            questionCount: quiz.questionIdToAnswer ? Object.keys(quiz.questionIdToAnswer).length : 0,
            status: quiz.completed ? 'completed' : 'in_progress',
            score: quiz.scorePercentage || 0
          };
        });
        
        setQuizzes(quizzesList);
      } else if (response.status === 404) {
        // No quizzes found, set empty array
        setQuizzes([]);
      } else {
        console.error('Error loading quizzes:', response.status, response.statusText);
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };





  const startQuiz = (quiz) => {
    // Use URL parameters like the original implementation
    navigate(`/quiz-taking?quizId=${encodeURIComponent(quiz.id)}`);
  };

  const renderYourQuizzesContent = () => (
    <div className="quiz-list-container">
      <h2>Your Quizzes</h2>
      {loading ? (
        <div className="loading">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="empty-state">
          <p>No quizzes yet. Create your first quiz to get started!</p>
          <button 
            className="btn btn-primary" 
            onClick={() => switchToQuizTab('createQuiz')}
          >
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-item">
              <div className="quiz-info">
                <h3>{quiz.name}</h3>
                <div className="quiz-details">
                  <span className="quiz-level">{quiz.level}</span>
                  <span className="quiz-year">{quiz.year}</span>
                  <span className="quiz-questions">{quiz.questionCount} questions</span>
                </div>
                <div className={`quiz-status ${quiz.status}`}>
                  {quiz.status === 'completed' ? `Completed - ${quiz.score}%` : 'In Progress'}
                </div>
              </div>
              <div className="quiz-actions">
                {quiz.status === 'completed' ? (
                  <>
                    <button className="btn btn-secondary">Review</button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate(`/solutions?quizId=${encodeURIComponent(quiz.id)}`)}
                    >
                      Show Solutions
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => startQuiz(quiz)}
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateQuizContent = () => {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Error</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button onClick={loadAvailableLevels} className="btn btn-primary w-full">
                  Try Again
                </button>
                <button onClick={() => switchToQuizTab('yourQuizzes')} className="btn btn-secondary w-full">
                  Back to Your Quizzes
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz options...</p>
          </div>
        </div>
      );
    }

    if (quizCreationStep === 1) {
      return renderLevelSelection();
    } else if (quizCreationStep === 2) {
      return renderYearSelection();
    }

    return <div>Something went wrong</div>;
  };

  const renderLevelSelection = () => {
    if (!levelsData) return <div className="loading">Loading levels...</div>;

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
        </div>

        <div className="container mx-auto px-6 pt-1 relative z-10">
          <div className="level-selection-container">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14"></div>
              <div className="text-center">
                <h2>Choose your quiz difficulty level</h2>
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
                  <div
                    key={level}
                    className={`level-button ${colors[index % colors.length]} text-gray-800 hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
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
                      
                      {/* Select a Year button */}
                      <div className="mt-4">
                        <button 
                          className="w-full bg-white bg-opacity-80 hover:bg-opacity-100 text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm border-2 border-indigo-600 transition duration-300"
                          onClick={() => selectLevel(level)}
                        >
                          📅 Select a Year
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderYearSelection = () => {
    if (!availableYears || availableYears.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-gray-600">
            <p>No years available for this level</p>
            <button 
              onClick={() => setQuizCreationStep(1)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Back to Level Selection
            </button>
          </div>
        </div>
      );
    }

    const sortedYears = availableYears.sort((a, b) => parseInt(b) - parseInt(a)); // Most recent first

    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setQuizCreationStep(1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Levels</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{formatAMCType(levelsData?.levelAMCTypes[selectedLevel])}</h2>
              <p className="text-sm text-gray-600 mt-1">Choose a competition year</p>
            </div>
            
            <div className="w-32"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedYears.map((year, index) => (
                <button
                  key={year}
                  onClick={() => selectYear(year)}
                  className="bg-white text-indigo-600 px-6 py-4 rounded-lg font-semibold text-lg border-2 border-indigo-600 transition duration-300 inline-flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  <span>{year}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with home button and create quiz button */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">🎯 Quiz</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {activeTab === 'yourQuizzes' && (
                <button 
                  className="px-4 py-2 rounded-lg font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
                  onClick={() => switchToQuizTab('createQuiz')}
                >
                  ➕ Create Quiz
                </button>
              )}
              {activeTab === 'createQuiz' && (
                <button 
                  className="px-4 py-2 rounded-lg font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
                  onClick={() => switchToQuizTab('yourQuizzes')}
                >
                  📋 Your Quizzes
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'yourQuizzes' && renderYourQuizzesContent()}
        {activeTab === 'createQuiz' && renderCreateQuizContent()}
      </main>
    </div>
  );
}

export default Quiz; 