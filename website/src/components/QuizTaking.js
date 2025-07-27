import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questionParser } from '../utils/QuestionParser';

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
  const [parsedQuestions, setParsedQuestions] = useState([]);
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
    // Parse questions when they change
    if (questions.length > 0) {
      const parsed = questions.map((question, index) => 
        questionParser.parseQuestion(question, index)
      );
      setParsedQuestions(parsed);
    }
  }, [questions]);

  useEffect(() => {
    // Re-render MathJax when questions change
    if (parsedQuestions.length > 0) {
      // Use setTimeout to ensure DOM is rendered before typesetting
      setTimeout(() => {
        safeMathJaxTypeset();
      }, 0);
    }
  }, [parsedQuestions, currentQuestionIndex]);

  // Additional effect to handle MathJax typesetting when quiz starts
  useEffect(() => {
    if (quizStarted && parsedQuestions.length > 0) {
      // Use a longer delay to ensure the quiz interface is fully rendered
      setTimeout(() => {
        safeMathJaxTypeset();
      }, 100);
    }
  }, [quizStarted, parsedQuestions]);

  // Use useLayoutEffect for more reliable MathJax typesetting
  useLayoutEffect(() => {
    if (quizStarted && parsedQuestions.length > 0) {
      // Try to typeset immediately after DOM updates
      safeMathJaxTypeset().catch(() => {
        // If it fails, retry after a short delay
        setTimeout(() => {
          safeMathJaxTypeset();
        }, 50);
      });
    }
  }, [quizStarted, currentQuestionIndex, parsedQuestions]);

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
    if (currentQuestionIndex < parsedQuestions.length - 1) {
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
  };

  const calculateScore = () => {
    let correct = 0;
    parsedQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.answer) {
        correct++;
      }
    });
    return Math.round((correct / parsedQuestions.length) * 100);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to safely typeset MathJax
  const safeMathJaxTypeset = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      return window.MathJax.typesetPromise().catch(error => {
        console.warn('MathJax typesetting error:', error);
      });
    }
    return Promise.resolve();
  };

  const renderChoices = (question) => {
    
    if ((!question.choices || question.choices.length === 0) && !question.isDummyChoices) {
      return <p className="text-gray-500 italic">No choices available for this question.</p>;
    }

    // Handle dummy choices - show message but still display A, B, C, D, E as choices
    if (question.isDummyChoices) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {question.choices.map((choice, choiceIndex) => {
              const choiceValue = String.fromCharCode(65 + choiceIndex);
              const isCorrect = quizCompleted && choiceValue === question.answer;
              const isSelected = selectedAnswers[question.id] === choiceValue;
              
              return (
                <label 
                  key={choiceIndex} 
                  className={`w-full p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50 text-primary-900' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    quizCompleted && isCorrect 
                      ? 'border-success-500 bg-success-50 text-success-900' 
                      : ''
                  } ${
                    quizCompleted && isSelected && !isCorrect 
                      ? 'border-danger-500 bg-danger-50 text-danger-900' 
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={choiceValue}
                    checked={isSelected}
                    onChange={() => selectAnswer(question.id, choiceValue)}
                    disabled={quizCompleted}
                    className="mt-1 flex-shrink-0"
                  />
                  
                  {/* Choice text - just the letter */}
                  <span className="choice-text flex-1 text-left font-semibold">
                    {choice}
                  </span>
                  
                  {/* Correct/Incorrect indicators */}
                  {quizCompleted && isCorrect && (
                    <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-500 text-white text-xs">
                      ✓
                    </span>
                  )}
                  {quizCompleted && isSelected && !isCorrect && (
                    <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger-500 text-white text-xs">
                      ✗
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    if (question.isImageChoice) {
      // For image choices, just show A, B, C, D, E as fake choices on the right
      return (
        <div className="space-y-2">
          {['A', 'B', 'C', 'D', 'E'].map((letter, letterIndex) => {
            const isCorrect = quizCompleted && letter === question.answer;
            const isSelected = selectedAnswers[question.id] === letter;
            
            return (
              <label 
                key={letterIndex} 
                className={`w-full p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50 text-primary-900' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                } ${
                  quizCompleted && isCorrect 
                    ? 'border-success-500 bg-success-50 text-success-900' 
                    : ''
                } ${
                  quizCompleted && isSelected && !isCorrect 
                    ? 'border-danger-500 bg-danger-50 text-danger-900' 
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={letter}
                  checked={isSelected}
                  onChange={() => selectAnswer(question.id, letter)}
                  disabled={quizCompleted}
                  className="mt-1 flex-shrink-0"
                />
                
                {/* Choice text - just the letter */}
                <span className="choice-text flex-1 text-left font-semibold">
                  {letter}
                </span>
                
                {/* Correct/Incorrect indicators */}
                {quizCompleted && isCorrect && (
                  <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-500 text-white text-xs">
                    ✓
                  </span>
                )}
                {quizCompleted && isSelected && !isCorrect && (
                  <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger-500 text-white text-xs">
                    ✗
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    } else {
      // Handle regular choices with button-style layout
      return question.choices.map((choice, choiceIndex) => {
        const choiceValue = String.fromCharCode(65 + choiceIndex);
        const isCorrect = quizCompleted && choiceValue === question.answer;
        const isSelected = selectedAnswers[question.id] === choiceValue;
        
        return (
          <label 
            key={choiceIndex} 
            className={`w-full p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-start gap-3 ${
              isSelected 
                ? 'border-primary-500 bg-primary-50 text-primary-900' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            } ${
              quizCompleted && isCorrect 
                ? 'border-success-500 bg-success-50 text-success-900' 
                : ''
            } ${
              quizCompleted && isSelected && !isCorrect 
                ? 'border-danger-500 bg-danger-50 text-danger-900' 
                : ''
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={choiceValue}
              checked={isSelected}
              onChange={() => selectAnswer(question.id, choiceValue)}
              disabled={quizCompleted}
              className="mt-1 flex-shrink-0"
            />
            
            {/* Choice text - left aligned */}
            {question.isTextChoice ? (
              // For text choices, render as plain text (no LaTeX processing)
              <span className="choice-text flex-1 text-left">
                {choice}
              </span>
            ) : (
              // For LaTeX choices, use dangerouslySetInnerHTML for MathJax processing
              <span 
                className="choice-text flex-1 text-left" 
                dangerouslySetInnerHTML={{ __html: choice }} 
              />
            )}
            
            {/* Correct/Incorrect indicators */}
            {quizCompleted && isCorrect && (
              <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-500 text-white text-xs">
                ✓
              </span>
            )}
            {quizCompleted && isSelected && !isCorrect && (
              <span className="flex-shrink-0 ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger-500 text-white text-xs">
                ✗
              </span>
            )}
          </label>
        );
      });
    }
  };

  const renderQuestionContent = (question) => (
    <div className="question-content" style={{ backgroundColor: 'transparent' }}>
      <div 
        className="question-text max-w-none" 
        style={{ borderLeft: 'none', backgroundColor: 'transparent' }}
        dangerouslySetInnerHTML={{ __html: question.questionText }} 
      />
      
      {/* Show image in question content for image choices */}
      {question.isImageChoice && question.choices && question.choices.length > 0 && (
        <div className="mt-6 question-image-container">
          <div dangerouslySetInnerHTML={{ __html: question.choices[0] }} />
        </div>
      )}
      
      {quizCompleted && (
        <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
          <p className="text-success-800 font-medium">
            <span className="font-semibold">Correct Answer:</span> {question.answer}
          </p>
        </div>
      )}

      {quizCompleted && question.solution && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-blue-900 font-semibold mb-2">Solution:</h4>
          <div 
            className="solution-text text-blue-800" 
            dangerouslySetInnerHTML={{ __html: question.solution }} 
          />
        </div>
      )}
    </div>
  );

  const renderNoQuizData = () => (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Menu Navigation */}
      <nav className="w-80 bg-white border-r border-gray-200 shadow-soft fixed h-full overflow-y-auto z-20">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 Quiz Taking</h1>
          <nav className="text-sm text-gray-600">
            <button onClick={() => navigate('/dashboard')} className="text-primary-600 hover:text-primary-700 hover:underline">
              Dashboard
            </button>
            {' > '}
            <button onClick={() => navigate('/subjects')} className="text-primary-600 hover:text-primary-700 hover:underline">
              Subjects
            </button>
            {' > '}
            <button onClick={() => navigate('/math')} className="text-primary-600 hover:text-primary-700 hover:underline">
              Mathematics
            </button>
            {' > '}
            Quiz Taking
          </nav>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => navigate('/quiz')}
          >
            <span className="text-xl">📋</span>
            <span className="font-medium">Quiz Management</span>
          </button>
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary-50 text-primary-700 border-l-4 border-primary-500 rounded-lg"
            onClick={() => navigate('/quiz-taking')}
          >
            <span className="text-xl">🎯</span>
            <span className="font-medium">Quiz Taking</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quiz Selected</h3>
            <p className="text-gray-600 text-sm">
              Please select a quiz from the Quiz Management page to start taking it.
            </p>
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="p-6 space-y-3">
          <button className="btn btn-primary w-full" onClick={() => navigate('/quiz')}>
            Go to Quiz Management
          </button>
          <button className="btn btn-secondary w-full" onClick={() => navigate('/math')}>
            ← Back to Math
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1 ml-80 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-soft p-12 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Quiz Selected</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You need to select a quiz to start taking it. Please go to the Quiz Management page to create or select a quiz.
            </p>
            <div className="space-y-3">
              <button className="btn btn-primary btn-large" onClick={() => navigate('/quiz')}>
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="btn btn-primary w-full">
              Try Again
            </button>
            <button onClick={() => navigate('/quiz')} className="btn btn-secondary w-full">
              Back to Quiz Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStartScreen = () => (
    <div className="bg-white rounded-xl shadow-soft p-6 lg:p-8 text-center">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{currentQuiz?.quizName || 'Quiz'}</h1>
        <div className="space-y-2 text-gray-600 text-sm lg:text-base">
          <p><strong>Level:</strong> {currentQuiz?.level || 'AMC'}</p>
          <p><strong>Year:</strong> {currentQuiz?.year || '2024'}</p>
          <p><strong>Questions:</strong> {parsedQuestions.length}</p>
          <p><strong>Time Limit:</strong> 30 minutes</p>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8 text-left">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Instructions:</h3>
        <ul className="space-y-2 text-gray-600 text-sm lg:text-base">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            You have 30 minutes to complete this quiz
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            Each question has 5 multiple choice answers
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            You can navigate between questions using the buttons
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            Your answers are saved automatically
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            You can review and change answers before submitting
          </li>
        </ul>
      </div>
      
      <button className="btn btn-primary btn-large" onClick={startQuiz}>
        Start Quiz
      </button>
    </div>
  );

  const renderQuestion = (question) => {
    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>
        {/* Header section - fixed */}
        <div className="mb-3 lg:mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="btn btn-secondary text-sm lg:text-base" onClick={() => navigate('/dashboard')}>
                🏠 Home
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {parsedQuestions.length}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn btn-secondary text-sm lg:text-base" onClick={() => navigate('/quiz')}>
                ← Back to Quizzes
              </button>
              <div className="text-base lg:text-lg font-semibold text-warning-600">
                Time: {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area - question and choices side by side */}
        <div className="flex gap-3 lg:gap-4 flex-1 min-h-0">
          {/* Left side - Question content only */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Question content section - scrollable with fixed height */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="question-content-section text-left">
                {renderQuestionContent(question)}
              </div>
            </div>
          </div>
          
          {/* Right side - Choices section */}
          <div className="w-1/3 lg:w-1/3 p-3 lg:p-6 flex-shrink-0 flex flex-col min-h-0">
            <div className="choices-container space-y-2 lg:space-y-3 flex-1 overflow-y-auto">
              {renderChoices(question)}
            </div>
          </div>
        </div>
        
        {/* Navigation buttons - fixed at bottom, outside the scrollable area */}
        <div className="flex justify-between items-center mt-3 lg:mt-4 pt-3 lg:pt-4 flex-shrink-0 border-t border-gray-100">
          {/* Left side - Save and Submit */}
          <div className="flex gap-2 lg:gap-4">
            <button className={`btn text-sm lg:text-base ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-secondary' : 'btn-primary'}`} onClick={() => console.log('Save functionality to be implemented')}>
              Save
            </button>
            <button className={`btn text-sm lg:text-base ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={completeQuiz}>
              Submit Quiz
            </button>
          </div>
          
          {/* Right side - Previous and Next */}
          <div className="flex gap-2 lg:gap-4">
            <button 
              className="btn btn-secondary text-sm lg:text-base" 
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            
            {currentQuestionIndex < parsedQuestions.length - 1 && (
              <button className="btn btn-primary text-sm lg:text-base" onClick={nextQuestion}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const score = calculateScore();
    const correctAnswers = parsedQuestions.filter(q => 
      selectedAnswers[q.id] === q.answer
    ).length;

    return (
      <>
        <div className="bg-white rounded-xl shadow-soft p-6 lg:p-8 text-center mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-2">Your Score: {score}%</h2>
            <p className="text-gray-600 text-base lg:text-lg">
              Correct Answers: {correctAnswers} out of {parsedQuestions.length}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4">
            <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
              Back to Quizzes
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-4 lg:p-6">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Question Review</h3>
          <div className="space-y-4 lg:space-y-6">
            {parsedQuestions.map((question, index) => (
              <div key={question.id} className="question-container">
                <div className="question-header">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Problem {index + 1}</h3>
                </div>
                <div className="question-layout-stacked">
                  {renderQuestionContent(question)}
                  <div className="choices-container">
                    {renderChoices(question)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  // If no quiz data is provided, show the no quiz data screen
  if (!currentQuiz && !loading) {
    return renderNoQuizData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return renderError();
  }

  if (parsedQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>No questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {!quizStarted && (
        <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
          <div className="max-w-2xl mx-auto w-full">
            {renderStartScreen()}
          </div>
        </div>
      )}
      {quizStarted && !quizCompleted && (
        <div className="flex-1 flex flex-col">
          {/* Laptop layout - reduced padding and better height management */}
          <div className={`${(window.innerWidth >= 1024 && !navigator.userAgent.includes('iPad')) ? 'block' : 'hidden'} lg:p-4 h-full`}>
            <div className="max-w-6xl mx-auto h-full">
              {renderQuestion(parsedQuestions[currentQuestionIndex])}
            </div>
          </div>
          
          {/* iPad/Mobile layout - full screen with minimal margins */}
          <div className={`${(window.innerWidth < 1024 || navigator.userAgent.includes('iPad')) ? 'block' : 'hidden'} p-3`} style={{ height: 'calc(100vh - 60px)' }}>
            <div className="bg-white rounded-xl flex flex-col h-full">
              {/* Header section - fixed */}
              <div className="p-3 pb-3 flex-shrink-0 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="btn btn-secondary text-sm" onClick={() => navigate('/dashboard')}>
                      🏠 Home
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                      Question {currentQuestionIndex + 1} of {parsedQuestions.length}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="btn btn-secondary text-sm" onClick={() => navigate('/quiz')}>
                      ← Back to Quizzes
                    </button>
                    <div className="text-base font-semibold text-warning-600">
                      Time: {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main content area - question and choices side by side */}
              <div className="flex gap-3 flex-1 px-3 min-h-0">
                {/* Left side - Question content only */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Question content section - scrollable with fixed height */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="question-content-section text-left">
                      {renderQuestionContent(parsedQuestions[currentQuestionIndex])}
                    </div>
                  </div>
                </div>
                
                {/* Right side - Choices section */}
                <div className="w-1/3 p-2 flex-shrink-0 flex flex-col min-h-0 choices-section">
                  <div className="choices-container space-y-2 overflow-y-auto">
                    {renderChoices(parsedQuestions[currentQuestionIndex])}
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons - fixed at bottom, outside the scrollable area */}
              <div className="flex justify-between items-center p-3 pt-2 flex-shrink-0 border-t border-gray-100">
                {/* Left side - Save and Submit */}
                <div className="flex gap-2">
                  <button className={`btn text-sm ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-secondary' : 'btn-primary'}`} onClick={() => console.log('Save functionality to be implemented')}>
                    Save
                  </button>
                  <button className={`btn text-sm ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={completeQuiz}>
                    Submit Quiz
                  </button>
                </div>
                
                {/* Right side - Previous and Next */}
                <div className="flex gap-2">
                  <button 
                    className="btn btn-secondary text-sm" 
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← Previous
                  </button>
                  
                  {currentQuestionIndex < parsedQuestions.length - 1 && (
                    <button className="btn btn-primary text-sm" onClick={nextQuestion}>
                      Next →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {quizCompleted && (
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {renderResults()}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizTaking; 