import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questionParser } from '../utils/QuestionParser';
import Question from './Question';

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
  const [saving, setSaving] = useState(false);
  const [lastSavedAnswers, setLastSavedAnswers] = useState({});
  const [hasTimer, setHasTimer] = useState(true);
  const [isResumingQuiz, setIsResumingQuiz] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const autoSaveTimeout = useRef(null);

  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Get quiz ID from URL parameters
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

  // Auto-start quiz if resuming
  useEffect(() => {
    console.log('Auto-start effect triggered:', {
      isResumingQuiz,
      parsedQuestionsLength: parsedQuestions.length,
      quizStarted,
      quizCompleted
    });
    
    if (isResumingQuiz && parsedQuestions.length > 0 && !quizStarted && !quizCompleted) {
      console.log('Auto-starting resumed quiz');
      startQuiz();
    }
  }, [isResumingQuiz, parsedQuestions.length, quizStarted, quizCompleted]);

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

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (quizStarted && !quizCompleted && hasTimer) {
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
  }, [quizStarted, quizCompleted, hasTimer]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  /**
   * Find the highest numbered question that has been answered
   * @param {Array} questions - Array of question objects
   * @param {Object} answers - Object mapping question IDs to answers
   * @returns {number} - Index of highest answered question, or -1 if none found
   */
  const findHighestAnsweredQuestionIndex = (questions, answers) => {
    let highestIndex = -1;
    
    questions.forEach((question, index) => {
      if (answers[question.id]) {
        highestIndex = Math.max(highestIndex, index);
      }
    });
    
    return highestIndex;
  };

  const loadQuiz = async (quizId) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = checkAuthStatus();
      
      // Get specific quiz data
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}/quiz/${quizId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const quiz = await response.json();
        console.log('Loaded quiz progress:', quiz);
        setCurrentQuiz(quiz);
        
        // Set timer settings from loaded quiz
        setHasTimer(quiz.hasTimer !== false); // Default to true if not set
        
        // Check if this is a resumed quiz (has existing answers or time spent)
        const hasExistingProgress = (quiz.questionIdToAnswer && Object.keys(quiz.questionIdToAnswer).length > 0) || 
                                   (quiz.timeSpent && quiz.timeSpent > 0) || 
                                   quiz.completed;
        console.log('Quiz resume check:', {
          questionIdToAnswer: quiz.questionIdToAnswer,
          questionIdToAnswerKeys: quiz.questionIdToAnswer ? Object.keys(quiz.questionIdToAnswer).length : 0,
          timeSpent: quiz.timeSpent,
          completed: quiz.completed,
          hasExistingProgress
        });
        setIsResumingQuiz(hasExistingProgress);
        
        // Load quiz questions and pass quiz data to load previous answers
        await loadQuizQuestions(quizId, quiz);
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

  const loadQuizQuestions = async (quizId, quizData = null) => {
    try {
      const currentUser = checkAuthStatus();
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}/quiz/${quizId}/questions`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const questions = await response.json();
        setQuestions(questions);
        
        // Initialize answers from quiz progress (use passed quizData or fallback to currentQuiz)
        const quiz = quizData || currentQuiz;
        const answers = {};
        
        if (quiz?.questionIdToAnswer) {
          console.log('Loading previous answers:', quiz.questionIdToAnswer);
          
          // Check for case mismatch and fix it
          Object.keys(quiz.questionIdToAnswer).forEach(savedQuestionId => {
            const answer = quiz.questionIdToAnswer[savedQuestionId];
            if (answer) {
              // Try both the original ID and lowercase version
              const lowerCaseId = savedQuestionId.toLowerCase();
              
              // Find matching question from loaded questions
              const matchingQuestion = questions.find(q => 
                q.id === savedQuestionId || q.id === lowerCaseId
              );
              
              if (matchingQuestion) {
                answers[matchingQuestion.id] = answer;
              }
            }
          });
          
          console.log('Restored answers:', answers);
        }
        
        setSelectedAnswers(answers);
        setLastSavedAnswers(answers); // Track what was already saved
        
        // Jump to the highest answered question when quiz loads
        if (Object.keys(answers).length > 0) {
          const answeredQuestionIndex = findHighestAnsweredQuestionIndex(questions, answers);
          
          if (answeredQuestionIndex !== -1) {
            console.log(`Jumping to question ${answeredQuestionIndex + 1} (highest answered)`);
            setCurrentQuestionIndex(answeredQuestionIndex);
          }
        }
        
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
      // Parse the questionSetId to get level and year
      const { amcLevel, year } = parseQuestionSetId(quiz.questionSetId);
      
      if (!amcLevel || !year) {
        throw new Error('Invalid quiz data: cannot parse level and year from questionSetId');
      }
      
      // Convert AMC level to level number
      const levelMap = { 8: 1, 10: 2, 12: 3 };
      const level = levelMap[amcLevel] || 1;
      
      const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/year/${year}`, {
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
      const { level, year } = parseQuestionSetId(quiz.questionSetId);
      setError(`Failed to load questions for ${level} ${year}. Please check your connection.`);
      setLoading(false);
    }
  };

  const parseQuestionSetId = (questionSetId) => {
    if (!questionSetId) return { level: null, year: null, variant: null };
    
    // Parse questionSetId like "2015_AMC_8" or "2004_AMC_10B"
    const match = questionSetId.match(/^(\d{4})_AMC_(\d+)([AB]?)$/);
    if (match) {
      const year = match[1];
      const amcLevel = match[2];
      const variant = match[3] || '';
      
      return {
        level: `AMC ${amcLevel}${variant}`,
        year: year,
        variant: variant,
        amcLevel: parseInt(amcLevel)
      };
    }
    
    return { level: null, year: null, variant: null, amcLevel: null };
  };

  const getTimeLimit = (quiz) => {
    if (!quiz) return 45 * 60; // Default to 45 minutes in seconds
    
    if (!quiz.questionSetId) return 45 * 60; // Default to 45 minutes
    
    const { amcLevel } = parseQuestionSetId(quiz.questionSetId);
    if (!amcLevel) return 45 * 60; // Default to 45 minutes if parsing fails
    
    // AMC 8: 45 minutes, AMC 10/12: 75 minutes
    if (amcLevel === 8) {
      return 45 * 60; // 45 minutes in seconds
    } else if (amcLevel === 10 || amcLevel === 12) {
      return 75 * 60; // 75 minutes in seconds
    }
    
    return 45 * 60; // Default to 45 minutes if level not recognized
  };

  const getStandardTimeLimit = (amcLevel) => {
    const timeLimits = {
      8: 45,   // AMC 8: 45 minutes
      10: 75,  // AMC 10: 75 minutes
      12: 75   // AMC 12: 75 minutes
    };
    return timeLimits[amcLevel] || 45;
  };

  const getTimeLimitText = (quiz) => {
    if (!quiz) return "45 minutes";
    
    if (!quiz.questionSetId) return "45 minutes";
    
    const { amcLevel } = parseQuestionSetId(quiz.questionSetId);
    if (!amcLevel) return "45 minutes";
    
    if (amcLevel === 8) {
      return "45 minutes";
    } else if (amcLevel === 10 || amcLevel === 12) {
      return "75 minutes";
    }
    
    return "45 minutes";
  };

  const startQuiz = async () => {
    setQuizStarted(true);
    
    // Update quiz with timer settings (for new quizzes only)
    if (currentQuiz && !isResumingQuiz) {
      const standardTimeLimit = getTimeLimit(currentQuiz) / 60; // Convert to minutes
      const updatedQuiz = {
        ...currentQuiz,
        hasTimer: hasTimer,
        timeLimit: hasTimer ? standardTimeLimit : 0
      };
      setCurrentQuiz(updatedQuiz);
      
      // Save timer settings to backend
      try {
        const currentUser = checkAuthStatus();
        const urlParams = new URLSearchParams(location.search);
        const quizId = urlParams.get('quizId') || currentQuiz.quizId;
        
        await fetch(`${JAVA_API_BASE_URL}/quiz/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.userId,
            quizId: quizId,
            quizProgress: updatedQuiz
          })
        });
      } catch (error) {
        console.error('Error updating quiz timer settings:', error);
      }
    }
    
    // Set up timer based on quiz settings (for both new and resumed quizzes)
    if (currentQuiz?.hasTimer) {
      const timeLimitInSeconds = getTimeLimit(currentQuiz);
      const timeSpentInSeconds = (currentQuiz?.timeSpent || 0) * 60; // Convert minutes to seconds
      const remainingTime = Math.max(0, timeLimitInSeconds - timeSpentInSeconds);
      setTimeRemaining(remainingTime);
    } else {
      setTimeRemaining(0); // No timer mode
    }
  };

  const selectAnswer = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-save progress when answer is selected (with debouncing)
    clearTimeout(autoSaveTimeout.current);
    
    // uncomment this to auto save progress every 2 seconds if we want: 
    // for now, only save progress when user clicks on save. 
    // autoSaveTimeout.current = setTimeout(() => {
    //   saveProgress();
    // }, 2000); // Save 2 seconds after last answer selection
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



  /**
   * Save current quiz progress to backend
   */
  const saveProgress = async () => {
    try {
      setSaving(true);
      const currentUser = checkAuthStatus();
      if (!currentUser || !currentQuiz) {
        console.error('No user or quiz available for progress tracking');
        setSaving(false);
        return;
      }

      // Get quiz ID from URL or currentQuiz
      const urlParams = new URLSearchParams(location.search);
      const quizId = urlParams.get('quizId') || currentQuiz.quizId;

      if (!quizId) {
        console.error('No quiz ID available for progress tracking');
        return;
      }

      // Only send answers that have changed since last save
      const questionIdToAnswer = {};
      Object.keys(selectedAnswers).forEach(questionId => {
        const currentAnswer = selectedAnswers[questionId];
        const lastSavedAnswer = lastSavedAnswers[questionId];
        
        // Include if answer is new or different from last saved
        if (currentAnswer && currentAnswer !== lastSavedAnswer) {
          questionIdToAnswer[questionId] = currentAnswer;
        }
      });

      // If no answers have changed, don't make API call
      if (Object.keys(questionIdToAnswer).length === 0) {
        console.log('No answers have changed since last save');
        setSaving(false);
        return;
      }

      console.log('Saving progress:', {
        userId: currentUser.userId,
        quizId: quizId,
        questionIdToAnswer: questionIdToAnswer
      });

      // Calculate time spent if this is a timed quiz
      let timeSpent = 0;
      if (hasTimer && currentQuiz) {
        const timeLimitInSeconds = getTimeLimit(currentQuiz);
        const timeSpentInSeconds = timeLimitInSeconds - timeRemaining;
        timeSpent = Math.floor(timeSpentInSeconds / 60); // Round down to minutes
      }

      const response = await fetch(`${JAVA_API_BASE_URL}/progress/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUser.userId,
          quizId: quizId,
          questionIdToAnswer: questionIdToAnswer,
          timeSpent: timeSpent
        })
      });

      if (response.ok) {
        console.log('Progress saved successfully');
        
        // Update lastSavedAnswers to track what we just saved
        setLastSavedAnswers(prev => ({
          ...prev,
          ...questionIdToAnswer
        }));
      } else {
        const errorData = await response.text();
        console.error('Failed to save progress:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const completeQuiz = async () => {
    await saveProgress();
    try {
      const currentUser = checkAuthStatus();
      if (!currentUser) { setQuizCompleted(true); return; }
      
      // Update the quiz progress to mark it as completed
      if (currentQuiz) {
        const updatedQuiz = {
          ...currentQuiz,
          questionIdToAnswer: selectedAnswers,
          lastActivity: new Date().toISOString(),
          completed: true
        };
        
        // Only set totalQuestions for personalized quizzes
        if (currentQuiz.quizType === 'personalized') {
          updatedQuiz.totalQuestions = parsedQuestions.length;
        }
        
        const updateResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.userId,
            quizId: currentQuiz.quizId,
            quizProgress: updatedQuiz
          })
        });
        
        if (updateResponse.ok) {
          console.log('Quiz marked as completed successfully');
        } else {
          console.error('Failed to update quiz completion status');
        }
      }
      
      // Update user's total score
      const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}`, { credentials: 'include' });
      if (response.ok) {
        const quizzes = await response.json();
        const totalScore = Object.values(quizzes).reduce((sum, qp) => sum + (qp.quizScore || 0), 0);
        console.log('totalScore', totalScore);
        await fetch(`${JAVA_API_BASE_URL}/auth/update-scores`, 
          { method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            credentials: 'include', 
            body: JSON.stringify({ score: totalScore, mathLevel: totalScore }) 
          }
        );
      }
    } catch (e) {
      console.error('Error updating quiz completion:', e);
    }
    setQuizCompleted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    parsedQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.answer) {
        correct++;
      }
    });
    return correct * 4;
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

  const renderStartScreen = () => {
    // If resuming a quiz, show a different screen
    if (isResumingQuiz) {
      return (
        <div className="bg-white rounded-xl shadow-soft p-6 lg:p-8 text-center">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Resuming Quiz</h1>
            <div className="space-y-2 text-gray-600 text-sm lg:text-base">
              <p><strong>Quiz:</strong> {currentQuiz?.quizName || 'Quiz'}</p>
              <p><strong>Level:</strong> {currentQuiz?.questionSetId ? parseQuestionSetId(currentQuiz.questionSetId).level || 'AMC' : 'AMC'}</p>
              <p><strong>Year:</strong> {currentQuiz?.questionSetId ? parseQuestionSetId(currentQuiz.questionSetId).year || '2024' : '2024'}</p>
              <p><strong>Questions:</strong> {parsedQuestions.length}</p>
              <p><strong>Time Limit:</strong> {hasTimer ? getTimeLimitText(currentQuiz) : 'No time limit'}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8 text-left">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Resuming Your Quiz</h3>
            <div className="space-y-2 text-gray-600 text-sm lg:text-base">
              <p>• Your previous progress has been loaded</p>
              <p>• You can continue from where you left off</p>
              {hasTimer && (
                <p>• Your remaining time will be calculated based on time already spent</p>
              )}
              <p>• Click "Continue Quiz" to resume</p>
            </div>
          </div>
          
          <button className="btn btn-primary btn-large" onClick={startQuiz}>
            Continue Quiz
          </button>
        </div>
      );
    }

    // New quiz start screen
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 lg:p-8 text-center">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{currentQuiz?.quizName || 'Quiz'}</h1>
          <div className="space-y-2 text-gray-600 text-sm lg:text-base">
            <p><strong>Level:</strong> {currentQuiz?.questionSetId ? parseQuestionSetId(currentQuiz.questionSetId).level || 'AMC' : 'AMC'}</p>
            <p><strong>Year:</strong> {currentQuiz?.questionSetId ? parseQuestionSetId(currentQuiz.questionSetId).year || '2024' : '2024'}</p>
            <p><strong>Questions:</strong> {parsedQuestions.length}</p>
            <p><strong>Time Limit:</strong> {hasTimer ? getTimeLimitText(currentQuiz) : 'No time limit'}</p>
          </div>
        </div>
        
        {/* Timer Options */}
        <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8 text-left">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Quiz Type:</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="hasTimer"
                checked={hasTimer}
                onChange={(e) => setHasTimer(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="hasTimer" className="text-sm lg:text-base text-gray-700">
                Timed quiz ({getTimeLimitText(currentQuiz)})
              </label>
            </div>
            <div className="ml-7 text-sm text-gray-600">
              {hasTimer ? (
                <p>Quiz will have a {getTimeLimitText(currentQuiz)} time limit</p>
              ) : (
                <p>Quiz will have no time limit - take as much time as you need</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6 lg:mb-8 text-left">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Instructions:</h3>
          <ul className="space-y-2 text-gray-600 text-sm lg:text-base">
            {hasTimer && (
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-1">•</span>
                You have {getTimeLimitText(currentQuiz)} to complete this quiz
              </li>
            )}
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
  };

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
              {hasTimer && (
                <div className="text-base lg:text-lg font-semibold text-warning-600">
                  Time: {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main content area - use shared Question component */}
        <div className="flex-1 min-h-0">
          <Question
            question={question}
            quizCompleted={quizCompleted}
            selectedAnswer={selectedAnswers[question.id]}
            onAnswerSelect={(answer) => selectAnswer(question.id, answer)}
          />
        </div>
        
        {/* Navigation buttons - fixed at bottom, outside the scrollable area */}
        <div className="flex justify-between items-center mt-3 lg:mt-4 pt-3 lg:pt-4 flex-shrink-0 border-t border-gray-100">
          {/* Left side - Save and Submit */}
          <div className="flex gap-2 lg:gap-4 items-center">
            <button 
              className={`btn text-sm lg:text-base ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => {
                console.log('🖱️ Save button clicked!');
                saveProgress();
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saving && <span className="text-blue-600 text-sm">💾 Saving progress...</span>}
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
            {currentQuiz?.startTime && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Started: {new Date(currentQuiz.startTime + 'Z').toLocaleString()}</p>
                <p>Completed: {new Date().toLocaleString()}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button 
              className="btn btn-primary" 
              onClick={() => navigate(`/solutions?quizId=${currentQuiz.quizId}`)}
            >
              Review
            </button>
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
                    {hasTimer && (
                      <div className="text-base font-semibold text-warning-600">
                        Time: {formatTime(timeRemaining)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Main content area - use shared Question component */}
              <div className="flex-1 min-h-0">
                <Question
                  question={parsedQuestions[currentQuestionIndex]}
                  quizCompleted={quizCompleted}
                  selectedAnswer={selectedAnswers[parsedQuestions[currentQuestionIndex].id]}
                  onAnswerSelect={(answer) => selectAnswer(parsedQuestions[currentQuestionIndex].id, answer)}
                />
              </div>
              
              {/* Navigation buttons - fixed at bottom, outside the scrollable area */}
              <div className="flex justify-between items-center p-3 pt-2 flex-shrink-0 border-t border-gray-100">
                {/* Left side - Save and Submit */}
                <div className="flex gap-2 items-center">
                  <button 
                    className={`btn text-sm ${currentQuestionIndex === parsedQuestions.length - 1 ? 'btn-secondary' : 'btn-primary'}`} 
                    onClick={() => {
                      console.log('🖱️ Mobile Save button clicked!');
                      saveProgress();
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {saving && <span className="text-blue-600 text-xs">💾</span>}
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