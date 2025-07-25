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
      // Mock data for now - in real implementation, fetch from API
      const mockQuizzes = [
        {
          id: 1,
          name: 'AMC 8 Practice Quiz',
          level: 'AMC_8',
          year: 2023,
          questionCount: 25,
          status: 'completed',
          score: 85
        },
        {
          id: 2,
          name: 'AMC 10 Algebra Focus',
          level: 'AMC_10',
          year: 2022,
          questionCount: 25,
          status: 'in_progress',
          score: null
        }
      ];
      setQuizzes(mockQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
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

  const selectLevel = (level) => {
    setSelectedLevel(level);
    setQuizCreationStep(3);
  };

  const selectYear = (year) => {
    setSelectedYear(year);
    // Create the quiz and navigate to quiz-taking
    createQuiz();
  };

  const createQuiz = async () => {
    try {
      // Mock quiz creation - in real implementation, call API
      const newQuiz = {
        id: Date.now(),
        name: quizName,
        level: selectedLevel,
        year: selectedYear,
        questionCount: 25,
        status: 'created'
      };
      
      // Navigate to quiz-taking with quiz data
      navigate('/quiz-taking', { 
        state: { 
          quiz: newQuiz,
          mode: 'new'
        }
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    }
  };

  const startQuiz = (quiz) => {
    navigate('/quiz-taking', { 
      state: { 
        quiz: quiz,
        mode: 'existing'
      }
    });
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
                <p>{quiz.level} - {quiz.year} ({quiz.questionCount} questions)</p>
                <span className={`quiz-status ${quiz.status}`}>
                  {quiz.status === 'completed' ? `Completed - ${quiz.score}%` : 'In Progress'}
                </span>
              </div>
              <div className="quiz-actions">
                {quiz.status === 'completed' ? (
                  <button className="btn btn-secondary">Review</button>
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
          <div className="year-selection">
            {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(year => (
              <div key={year} className="year-card" onClick={() => selectYear(year)}>
                <h3>{year}</h3>
              </div>
            ))}
          </div>
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