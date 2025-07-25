import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function QuizTaking() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const quiz = location.state?.quiz;
  const mode = location.state?.mode;

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if quiz data is available
    if (!quiz) {
      navigate('/quiz');
      return;
    }

    // Initialize MathJax
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }

    // Load questions from backend
    loadQuestions();
  }, [navigate, quiz]);

  useEffect(() => {
    // Re-render MathJax when questions change
    if (window.MathJax && questions.length > 0) {
      window.MathJax.typesetPromise();
    }
  }, [questions]);

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

  const loadQuestions = async () => {
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

  const renderError = () => (
    <div className="error-message">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={loadQuestions} className="btn btn-primary">Try Again</button>
      <button onClick={() => navigate('/quiz')} className="btn btn-secondary">Back to Quiz Management</button>
    </div>
  );

  const renderStartScreen = () => (
    <div className="quiz-start-screen">
      <div className="quiz-info">
        <h1>{quiz.name}</h1>
        <p><strong>Level:</strong> {quiz.level}</p>
        <p><strong>Year:</strong> {quiz.year}</p>
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

  const renderQuestion = (question) => (
    <div className="question-container">
      <div className="question-header">
        <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
        <div className="timer">Time Remaining: {formatTime(timeRemaining)}</div>
      </div>
      
      <div className="question-content">
        <div 
          className="question-text" 
          dangerouslySetInnerHTML={{ __html: question.question.text || question.question }} 
        />
        
        <div className="choices">
          {question.question.text_choices && question.question.text_choices.length > 0 ? (
            question.question.text_choices.map((choice, index) => (
              <label 
                key={index} 
                className={`choice ${selectedAnswers[question.id] === String.fromCharCode(65 + index) ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={String.fromCharCode(65 + index)}
                  checked={selectedAnswers[question.id] === String.fromCharCode(65 + index)}
                  onChange={() => selectAnswer(question.id, String.fromCharCode(65 + index))}
                />
                <span className="choice-text">{choice}</span>
              </label>
            ))
          ) : (
            <p>No choices available for this question.</p>
          )}
        </div>
      </div>
      
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
            <div key={question.id} className="review-item">
              <h4>Question {index + 1}</h4>
              <div 
                className="question-text" 
                dangerouslySetInnerHTML={{ __html: question.question.text || question.question }} 
              />
              <p><strong>Your Answer:</strong> {selectedAnswers[question.id] || 'Not answered'}</p>
              <p><strong>Correct Answer:</strong> {question.answer}</p>
              <div className={`result-indicator ${selectedAnswers[question.id] === question.answer ? 'correct' : 'incorrect'}`}>
                {selectedAnswers[question.id] === question.answer ? '✓ Correct' : '✗ Incorrect'}
              </div>
            </div>
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

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (error) {
    return renderError();
  }

  if (!quiz) {
    return <div>No quiz data available</div>;
  }

  if (questions.length === 0) {
    return <div>No questions available for this quiz.</div>;
  }

  return (
    <div className="quiz-taking-container">
      <header className="quiz-header">
        <div className="quiz-title">
          <h1>{quiz.name}</h1>
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