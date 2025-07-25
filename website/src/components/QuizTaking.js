import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function QuizTaking() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const quiz = location.state?.quiz;
  const mode = location.state?.mode;

  // Mock questions for demonstration
  const mockQuestions = [
    {
      id: 1,
      question: "What is $2 + 2$?",
      choices: ["A) 3", "B) 4", "C) 5", "D) 6", "E) 7"],
      correctAnswer: "B",
      explanation: "Basic arithmetic: 2 + 2 = 4"
    },
    {
      id: 2,
      question: "If $x^2 = 16$, what is $x$?",
      choices: ["A) 4", "B) -4", "C) ±4", "D) 8", "E) -8"],
      correctAnswer: "C",
      explanation: "Taking the square root of both sides: x = ±√16 = ±4"
    },
    {
      id: 3,
      question: "What is the area of a circle with radius 3?",
      choices: ["A) 6π", "B) 9π", "C) 12π", "D) 18π", "E) 27π"],
      correctAnswer: "B",
      explanation: "Area = πr² = π(3)² = 9π"
    }
  ];

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

    setLoading(false);
  }, [navigate, quiz]);

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
    if (currentQuestionIndex < mockQuestions.length - 1) {
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
    mockQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / mockQuestions.length) * 100);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderStartScreen = () => (
    <div className="quiz-start-screen">
      <div className="quiz-info">
        <h1>{quiz.name}</h1>
        <p><strong>Level:</strong> {quiz.level}</p>
        <p><strong>Year:</strong> {quiz.year}</p>
        <p><strong>Questions:</strong> {mockQuestions.length}</p>
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
        <h2>Question {currentQuestionIndex + 1} of {mockQuestions.length}</h2>
        <div className="timer">Time Remaining: {formatTime(timeRemaining)}</div>
      </div>
      
      <div className="question-content">
        <div className="question-text" dangerouslySetInnerHTML={{ __html: question.question }} />
        
        <div className="choices">
          {question.choices.map((choice, index) => (
            <label 
              key={index} 
              className={`choice ${selectedAnswers[question.id] === choice.charAt(0) ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice.charAt(0)}
                checked={selectedAnswers[question.id] === choice.charAt(0)}
                onChange={() => selectAnswer(question.id, choice.charAt(0))}
              />
              <span className="choice-text">{choice}</span>
            </label>
          ))}
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
          {mockQuestions.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentQuestionIndex ? 'current' : ''} ${selectedAnswers[mockQuestions[index].id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        {currentQuestionIndex === mockQuestions.length - 1 ? (
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
    const correctAnswers = mockQuestions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;

    return (
      <div className="quiz-results">
        <h1>Quiz Complete!</h1>
        <div className="score-summary">
          <h2>Your Score: {score}%</h2>
          <p>Correct Answers: {correctAnswers} out of {mockQuestions.length}</p>
        </div>
        
        <div className="question-review">
          <h3>Question Review</h3>
          {mockQuestions.map((question, index) => (
            <div key={question.id} className="review-item">
              <h4>Question {index + 1}</h4>
              <div className="question-text" dangerouslySetInnerHTML={{ __html: question.question }} />
              <p><strong>Your Answer:</strong> {selectedAnswers[question.id] || 'Not answered'}</p>
              <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
              <p><strong>Explanation:</strong> {question.explanation}</p>
              <div className={`result-indicator ${selectedAnswers[question.id] === question.correctAnswer ? 'correct' : 'incorrect'}`}>
                {selectedAnswers[question.id] === question.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
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

  if (!quiz) {
    return <div>No quiz data available</div>;
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
        {quizStarted && !quizCompleted && renderQuestion(mockQuestions[currentQuestionIndex])}
        {quizCompleted && renderResults()}
      </main>
    </div>
  );
}

export default QuizTaking; 