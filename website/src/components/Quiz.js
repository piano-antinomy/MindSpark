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
        const quizzesList = Object.entries(quizzesData).map(([quizId, quiz]) => ({
          id: quizId,
          name: quiz.quizName || 'Untitled Quiz',
          level: quiz.questionSetId ? quiz.questionSetId.split('_')[2] : 'AMC',
          year: quiz.questionSetId ? quiz.questionSetId.split('_')[0] : '2024',
          questionCount: quiz.questionIdToAnswer ? Object.keys(quiz.questionIdToAnswer).length : 0,
          status: quiz.isCompleted ? 'completed' : 'in_progress',
          score: quiz.getScorePercentage ? quiz.getScorePercentage() : null
        }));
        
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

  const proceedToStep2 = () => {
    if (quizName.trim()) {
      setQuizCreationStep(2);
    } else {
      alert('Please enter a quiz name');
    }
  };

  const backToStep1 = () => {
    setQuizCreationStep(1);
  };

  const backToStep2 = () => {
    setQuizCreationStep(2);
  };

  const selectLevel = async (level) => {
    setSelectedLevel(level);
    setQuizCreationStep(3);
    await loadAvailableYears(level);
  };

  const loadAvailableYears = async (level) => {
    setYearsLoading(true);
    try {
      // Convert AMC level to backend level number
      const levelMap = { 'AMC_8': 1, 'AMC_10': 2, 'AMC_12': 3 };
      const levelNumber = levelMap[level] || 1;
      
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${levelNumber}/years`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.years) {
          // Sort years in descending order (newest first)
          const sortedYears = data.years.sort((a, b) => b - a);
          setAvailableYears(sortedYears);
        } else {
          setAvailableYears([]);
        }
      } else {
        console.error('Failed to load available years:', response.status);
        setAvailableYears([]);
      }
    } catch (error) {
      console.error('Error loading available years:', error);
      setAvailableYears([]);
    } finally {
      setYearsLoading(false);
    }
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    // Create the quiz and navigate to quiz-taking
    createQuiz(year, selectedLevel);
  };

  const createQuiz = async (year = selectedYear, level = selectedLevel) => {
    try {
      const currentUser = checkAuthStatus();
      
      // Generate quiz ID
      const quizId = `quiz_${Date.now()}`;
      
      // Create quizQuestionSetId (format: year_AMC_level, e.g., "2023_AMC_8" or "2024_AMC_10A")
      if (!level) {
        console.error('Level is null or undefined. Cannot create quiz.');
        alert('Error: Level not selected. Please try again.');
        return;
      }
      
      // Extract the numeric year and any letter suffix (A/B)
      const yearMatch = year.toString().match(/^(\d{4})([AB]?)$/);
      if (!yearMatch) {
        console.error('Invalid year format:', year);
        alert('Error: Invalid year format. Please try again.');
        return;
      }
      
      const numericYear = yearMatch[1];
      const yearSuffix = yearMatch[2] || ''; // A, B, or empty
      
      // Extract AMC level number (8, 10, or 12)
      const levelMatch = level.match(/^AMC_(\d+)$/);
      if (!levelMatch) {
        console.error('Invalid level format:', level);
        alert('Error: Invalid level format. Please try again.');
        return;
      }
      
      const amcLevel = levelMatch[1];
      
      // Construct quizQuestionSetId: year_AMC_level + optional suffix
      const quizQuestionSetId = `${numericYear}_AMC_${amcLevel}${yearSuffix}`;
      
      console.log('Creating quiz with:', {
        year,
        level,
        numericYear,
        yearSuffix,
        amcLevel,
        quizQuestionSetId
      });
      
      const requestBody = {
        userId: currentUser.userId,
        quizType: "standard",
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
        
        // Navigate to quiz-taking with the new quiz ID
        navigate(`/quiz-taking?quizId=${encodeURIComponent(quizId)}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create quiz:', errorData);
        alert(`Failed to create quiz: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please check your connection and try again.');
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
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => startQuiz(quiz)}
                    >
                      Continue
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => navigate(`/solutions?quizId=${encodeURIComponent(quiz.id)}`)}
                    >
                      Show Solutions
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateQuizContent = () => (
    <div className="create-quiz-container">
      <h2>Create New Quiz</h2>
      
      {/* Step 1: Quiz Name */}
      {quizCreationStep === 1 && (
        <div className="quiz-creation-step">
          <h3>Step 1: Name Your Quiz</h3>
          <div className="form-group">
            <label htmlFor="quizName">Quiz Name:</label>
            <input 
              type="text" 
              id="quizName" 
              placeholder="Enter a name for your quiz" 
              className="form-control"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={proceedToStep2}>
            Next: Select Question Set
          </button>
        </div>
      )}
      
      {/* Step 2: Select Level */}
      {quizCreationStep === 2 && (
        <div className="quiz-creation-step">
          <h3>Step 2: Select AMC Level</h3>
          <div className="level-selection">
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
          <button className="btn btn-secondary" onClick={backToStep1}>
            ← Back
          </button>
        </div>
      )}
      
      {/* Step 3: Select Year */}
      {quizCreationStep === 3 && (
        <div className="quiz-creation-step">
          <h3>Step 3: Select Year</h3>
          {yearsLoading ? (
            <div className="loading">Loading available years...</div>
          ) : availableYears.length === 0 ? (
            <div className="error-message">No years available for this level.</div>
          ) : (
            <div className="year-selection">
              {availableYears.map(year => (
                <div key={year} className="year-card" onClick={() => selectYear(year)}>
                  <h3>{year}</h3>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" onClick={backToStep2}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu">
        <div className="menu-header">
          <h1>🎯 Quiz Management</h1>
          <nav className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link> {'>'} 
            <Link to="/subjects">Subjects</Link> {'>'} 
            <Link to="/math">Mathematics</Link> {'>'} 
            Quiz
          </nav>
        </div>
        
        <div className="menu-tabs">
          <button 
            className={`menu-tab ${activeTab === 'yourQuizzes' ? 'active' : ''}`}
            onClick={() => switchToQuizTab('yourQuizzes')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">Your Quizzes</span>
          </button>
          <button 
            className={`menu-tab ${activeTab === 'createQuiz' ? 'active' : ''}`}
            onClick={() => switchToQuizTab('createQuiz')}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-text">Create Quiz</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="aside-info">
          {activeTab === 'yourQuizzes' && (
            <div>
              <h3>Your Quizzes</h3>
              <p>View and manage your created quizzes.</p>
            </div>
          )}
          {activeTab === 'createQuiz' && (
            <div>
              <h3>Create Quiz</h3>
              <p>Create a new quiz from AMC competition problems.</p>
            </div>
          )}
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          <button className="btn btn-secondary" onClick={() => navigate('/math')}>
            ← Back to Math
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="math-main-content">
        {activeTab === 'yourQuizzes' && renderYourQuizzesContent()}
        {activeTab === 'createQuiz' && renderCreateQuizContent()}
      </main>
    </div>
  );
}

export default Quiz; 