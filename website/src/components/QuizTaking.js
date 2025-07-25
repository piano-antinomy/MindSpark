import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionRenderer, { questionRenderer } from './QuestionRenderer';

function QuizTaking() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Get quiz ID from URL parameters (like the original)
    const urlParams = new URLSearchParams(location.search);
    const quizId = urlParams.get('quizId');
    
    if (quizId) {
      loadQuiz(quizId);
    } else {
      // Check if quiz data is available from location state (for new quizzes)
      const quiz = location.state?.quiz;
      if (quiz) {
        setCurrentQuiz(quiz);
        loadQuestionsFromQuiz(quiz);
      } else {
        setLoading(false);
      }
    }
  }, [navigate, location]);

  useEffect(() => {
    // Re-render MathJax when questions change
    if (window.MathJax && questions.length > 0) {
      window.MathJax.typesetPromise();
    }
  }, [questions, currentQuestionIndex]);

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, quizCompleted]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const loadQuiz = async (quizId) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = checkAuthStatus();
      
      // Get specific quiz data
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const quiz = await response.json();
        console.log('Loaded quiz from backend:', quiz);
        setCurrentQuiz(quiz);
        
        // Load quiz questions
        await loadQuizQuestions(quizId);
      } else if (response.status === 404) {
        setError('Quiz not found. Please check the quiz ID or create a new quiz.');
        setLoading(false);
      } else {
        setError(`Failed to load quiz: ${response.status} ${response.statusText}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to connect to the server. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const loadQuizQuestions = async (quizId) => {
    try {
      const currentUser = checkAuthStatus();
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}/questions`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const questions = await response.json();
        console.log('Loaded questions from backend:', questions);
        setQuestions(questions);
        
        // Initialize answers from quiz progress
        const answers = {};
        if (currentQuiz?.questionIdToAnswer) {
          Object.keys(currentQuiz.questionIdToAnswer).forEach(questionId => {
            const answer = currentQuiz.questionIdToAnswer[questionId];
            if (answer) {
              answers[questionId] = answer;
            }
          });
        }
        setSelectedAnswers(answers);
        setLoading(false);
      } else if (response.status === 404) {
        setError('Quiz questions not found. The quiz may be corrupted or incomplete.');
        setLoading(false);
      } else {
        setError(`Failed to load quiz questions: ${response.status} ${response.statusText}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      setError('Failed to load quiz questions. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const loadQuestionsFromQuiz = async (quiz) => {
    setLoading(true);
    setError(null);
    try {
      // Convert AMC type to level number
      const levelMap = { 'AMC_8': 1, 'AMC_10': 2, 'AMC_12': 3 };
      const level = levelMap[quiz.level] || 1;
      
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/year/${quiz.year}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQuestions(data.questions);
          setLoading(false);
        } else {
          throw new Error('Failed to load questions');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(`Failed to load questions for ${quiz.level} ${quiz.year}. Please check your connection.`);
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeRemaining(1800); // 30 minutes in seconds
  };

  const selectAnswer = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = () => {
    setQuizCompleted(true);
    // Calculate score
    const score = calculateScore();
    console.log('Quiz completed with score:', score);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.answer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderNoQuizData = () => (
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu">
        <div className="menu-header">
          <h1>🎯 Quiz Taking</h1>
          <nav className="breadcrumb">
            <button onClick={() => navigate('/dashboard')} className="breadcrumb-link">
              Dashboard
            </button>
            {' > '}
            <button onClick={() => navigate('/subjects')} className="breadcrumb-link">
              Subjects
            </button>
            {' > '}
            <button onClick={() => navigate('/math')} className="breadcrumb-link">
              Mathematics
            </button>
            {' > '}
            Quiz Taking
          </nav>
        </div>
        
        <div className="menu-tabs">
          <button className="menu-tab" onClick={() => navigate('/quiz')}>
            <span className="tab-icon">📋</span>
            <span className="tab-text">Quiz Management</span>
          </button>
          <button className="menu-tab active" onClick={() => navigate('/quiz-taking')}>
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Quiz Taking</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="aside-info">
          <div>
            <h3>No Quiz Selected</h3>
            <p>Please select a quiz from the Quiz Management page to start taking it.</p>
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
            Go to Quiz Management
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/math')}>
            ← Back to Math
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="math-main-content">
        <div className="quiz-taking-container">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No Quiz Selected</h3>
            <p>You need to select a quiz to start taking it. Please go to the Quiz Management page to create or select a quiz.</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
                Go to Quiz Management
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/math')}>
                Back to Math
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderError = () => (
    <div className="error-message">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="btn btn-primary">Try Again</button>
      <button onClick={() => navigate('/quiz')} className="btn btn-secondary">Back to Quiz Management</button>
    </div>
  );

  const renderStartScreen = () => (
    <div className="quiz-start-screen">
      <div className="quiz-info">
        <h1>{currentQuiz?.quizName || 'Quiz'}</h1>
        <p><strong>Level:</strong> {currentQuiz?.level || 'AMC'}</p>
        <p><strong>Year:</strong> {currentQuiz?.year || '2024'}</p>
        <p><strong>Questions:</strong> {questions.length}</p>
        <p><strong>Time Limit:</strong> 30 minutes</p>
      </div>
      <div className="quiz-instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>You have 30 minutes to complete this quiz</li>
          <li>Each question has 5 multiple choice answers</li>
          <li>You can navigate between questions using the buttons</li>
          <li>Your answers are saved automatically</li>
          <li>You can review and change answers before submitting</li>
        </ul>
      </div>
      <button className="btn btn-primary btn-large" onClick={startQuiz}>
        Start Quiz
      </button>
    </div>
  );

  const renderQuestion = (question) => {
    return (
      <div className="question-container">
        <div className="question-header">
          <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <div className="timer">Time Remaining: {formatTime(timeRemaining)}</div>
        </div>
        
        <QuestionRenderer
          question={question}
          questionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswers[question.id]}
          onAnswerSelect={selectAnswer}
          mode="quiz"
        />
        
        <div className="question-navigation">
          <button 
            className="btn btn-secondary" 
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </button>
          
          <div className="question-progress">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`progress-dot ${index === currentQuestionIndex ? 'current' : ''} ${selectedAnswers[questions[index].id] ? 'answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <button className="btn btn-primary" onClick={completeQuiz}>
              Complete Quiz
            </button>
          ) : (
            <button className="btn btn-primary" onClick={nextQuestion}>
              Next →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const score = calculateScore();
    const correctAnswers = questions.filter(q => 
      selectedAnswers[q.id] === q.answer
    ).length;

    return (
      <div className="quiz-results">
        <h1>Quiz Complete!</h1>
        <div className="score-summary">
          <h2>Your Score: {score}%</h2>
          <p>Correct Answers: {correctAnswers} out of {questions.length}</p>
        </div>
        
        <div className="question-review">
          <h3>Question Review</h3>
          {questions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              questionIndex={index}
              selectedAnswer={selectedAnswers[question.id]}
              showAnswer={true}
              mode="quiz"
            />
          ))}
        </div>
        
        <div className="results-actions">
          <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
            Back to Quizzes
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  };

  // If no quiz data is provided, show the no quiz data screen
  if (!currentQuiz && !loading) {
    return renderNoQuizData();
  }

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (error) {
    return renderError();
  }

  if (questions.length === 0) {
    return <div>No questions available for this quiz.</div>;
  }

  return (
    <div className="quiz-taking-container">
      <header className="quiz-header">
        <div className="quiz-title">
          <h1>{currentQuiz?.quizName || 'Quiz'}</h1>
          <nav className="breadcrumb">
            <button onClick={() => navigate('/quiz')} className="breadcrumb-link">
              ← Back to Quiz Management
            </button>
          </nav>
        </div>
      </header>

      <main className="quiz-main">
        {!quizStarted && renderStartScreen()}
        {quizStarted && !quizCompleted && renderQuestion(questions[currentQuestionIndex])}
        {quizCompleted && renderResults()}
      </main>
    </div>
  );
}

export default QuizTaking; 