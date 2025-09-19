import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { questionParser } from '../utils/QuestionParser';
import solutionParser from '../utils/SolutionParser';
import Question from './Question';

function Solutions() {
  const [questions, setQuestions] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [viewMode, setViewMode] = useState('quiz'); // 'quiz' or 'solution'
  const solutionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

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
      loadQuizAndSolutions(quizId);
    } else {
      setError('No quiz ID provided');
      setLoading(false);
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
    // Trigger MathJax typesetting when solution content changes
    if (solutionRef.current) {
      safeMathJaxTypeset().catch(() => {
        setTimeout(() => safeMathJaxTypeset(), 50);
      });
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Trigger MathJax typesetting when switching views
    if (solutionRef.current) {
      // Add a small delay to ensure DOM is updated
      setTimeout(() => {
        safeMathJaxTypeset().catch(() => {
          setTimeout(() => safeMathJaxTypeset(), 50);
        });
      }, 100);
    }
  }, [viewMode]);

  useLayoutEffect(() => {
    // Re-render MathJax when questions change, view mode changes, or solution index changes
    if (parsedQuestions.length > 0) {
      safeMathJaxTypeset().catch(() => {
        setTimeout(() => safeMathJaxTypeset(), 50);
      });
    }
  }, [parsedQuestions, currentQuestionIndex, viewMode]);

  useEffect(() => {
    // Trigger MathJax typesetting when in quiz mode (for choices with MathJax)
    if (viewMode === 'quiz' && parsedQuestions.length > 0) {
      setTimeout(() => {
        forceMathJaxRerender().catch(() => {
          setTimeout(() => forceMathJaxRerender(), 50);
        });
      }, 150);
    }
  }, [viewMode, currentQuestionIndex, parsedQuestions]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const safeMathJaxTypeset = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      return window.MathJax.typesetPromise().catch(error => {
        console.warn('MathJax typesetting error:', error);
      });
    }
    return Promise.resolve();
  };

  const forceMathJaxRerender = () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      // Clear any existing MathJax processing
      if (window.MathJax.startup && window.MathJax.startup.document) {
        window.MathJax.startup.document.state(0);
      }
      return window.MathJax.typesetPromise().catch(error => {
        console.warn('MathJax typesetting error:', error);
      });
    }
    return Promise.resolve();
  };

  const loadQuizAndSolutions = async (quizId) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = checkAuthStatus();
      
      // Get quiz data
      const quizResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}/quiz/${quizId}`, {
        credentials: 'include'
      });
      
      if (quizResponse.ok) {
        const quiz = await quizResponse.json();
        setCurrentQuiz(quiz);
        
        // Load existing answers if available
        if (quiz.questionIdToAnswer) {
          const answers = {};
          Object.keys(quiz.questionIdToAnswer).forEach(questionId => {
            const answer = quiz.questionIdToAnswer[questionId];
            if (answer) {
              answers[questionId] = answer;
            }
          });
          setSelectedAnswers(answers);
        }
        
        // Load quiz questions with solutions
        const questionsResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.userId}/quiz/${quizId}/questions`, {
          credentials: 'include'
        });
        
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);
        } else {
          throw new Error('Failed to load quiz questions');
        }
      } else {
        throw new Error('Quiz not found');
      }
    } catch (error) {
      console.error('Error loading quiz and solutions:', error);
      setError('Failed to load quiz solutions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    const currentQuestion = parsedQuestions[currentQuestionIndex];
    if (currentQuestion) {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < parsedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'quiz' ? 'solution' : 'quiz');
  };

  const handleQuestionSelect = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
  };

  const renderSolution = (question) => {
    const solutions = question.originalQuestion?.solutions;
    
    if (!solutions || solutions.length === 0) {
      return <div className="solution-content">No solution available for this question.</div>;
    }

    // Always show the first solution
    const currentSolution = solutions[0];
    
    // Handle different solution formats
    let solutionText = '';
    let solutionInsertions = {};
    
    if (typeof currentSolution === 'string') {
      solutionText = currentSolution;
    } else if (currentSolution && typeof currentSolution === 'object') {
      solutionText = currentSolution.text || currentSolution.content || JSON.stringify(currentSolution);
      solutionInsertions = currentSolution.insertions || {};
    } else {
      solutionText = String(currentSolution || '');
    }
    
    // Process the solution text using the solution's own insertions
    const processedText = solutionParser.processSolutionText(solutionText, solutionInsertions);
    
    return (
      <div className="solution-content" ref={solutionRef}>
        <div className="solution-item">
          <div 
            className="solution-text"
            dangerouslySetInnerHTML={{
              __html: processedText
            }}
          />
        </div>
      </div>
    );
  };

  const renderSolutionContent = (question) => {
    const solutions = question.originalQuestion?.solutions;
    
    return (
      <div className="question-content-section text-left h-full flex flex-col">
        {/* Solution only */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderSolution(question)}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentQuestion = () => {
    if (parsedQuestions.length === 0) {
      return <div className="empty-state">No questions found for this quiz.</div>;
    }

    const currentQuestion = parsedQuestions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestion.id];

    if (viewMode === 'quiz') {
      return (
        <Question
          question={currentQuestion}
          quizCompleted={false}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
          showAnswerStates={true}
        />
      );
    } else {
      return (
        <div className="solution-view h-full flex flex-col">
          {currentQuestion.choiceVertical ? (
            // Vertical layout: solution content only
            <div className="flex-1 min-h-0 flex flex-col">
              {renderSolutionContent(currentQuestion)}
            </div>
          ) : (
            // Side-by-side layout: solution content takes full width
            <div className="flex-1 min-h-0 flex flex-col">
              {renderSolutionContent(currentQuestion)}
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="math-layout">
        <div className="loading-container">
          <div className="loading">Loading solutions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="math-layout">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {/* Laptop layout - centered with max width */}
        <div className={`${(window.innerWidth >= 1024 && !navigator.userAgent.includes('iPad')) ? 'block' : 'hidden'} lg:p-4 h-full`}>
          <div className="max-w-6xl mx-auto h-full">
            <div className="bg-white rounded-xl p-4 lg:p-6 flex flex-col h-full">
            {/* Header section - fixed (different from QuizTaking) */}
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
                  <button 
                    className={`btn text-sm lg:text-base ${viewMode === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={toggleViewMode}
                  >
                    {viewMode === 'quiz' ? 'View Solution' : 'View Quiz'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main content area - question and choices layout (same as QuizTaking) */}
            <div className="flex-1 min-h-0">
              {renderCurrentQuestion()}
            </div>
          
          {/* Navigation buttons - fixed at bottom (different from QuizTaking) */}
          <div className="flex justify-between items-center mt-3 lg:mt-4 pt-3 lg:pt-4 flex-shrink-0 border-t border-gray-100">
            {/* Left side - Question Number Navigation */}
            <div className="flex gap-1 flex-wrap">
              {parsedQuestions.map((_, index) => (
                <button 
                  key={index}
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full text-xs lg:text-sm font-medium flex items-center justify-center transition-colors ${
                    currentQuestionIndex === index 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => handleQuestionSelect(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Right side - Empty for now, can be used for future features */}
            <div></div>
          </div>
            </div>
          </div>
        </div>
        
        {/* iPad/Mobile layout - full screen with minimal margins */}
        <div className={`${(window.innerWidth < 1024 || navigator.userAgent.includes('iPad')) ? 'block' : 'hidden'} p-3`} style={{ height: 'calc(100vh - 60px)' }}>
          <div className="bg-white rounded-xl flex flex-col h-full">
            {/* Mobile layout content - same as laptop but with different container */}
            <div className="p-3 pb-3 flex-shrink-0 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/dashboard')}>
                    🏠 Home
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">
                    Question {currentQuestionIndex + 1} of {parsedQuestions.length}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary text-sm" onClick={() => navigate('/quiz')}>
                    ← Back to Quizzes
                  </button>
                  <button 
                    className="btn btn-primary text-sm"
                    onClick={() => setViewMode(viewMode === 'quiz' ? 'solution' : 'quiz')}
                  >
                    {viewMode === 'quiz' ? 'VIEW SOLUTION' : 'VIEW QUESTION'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile question content */}
            <div className="flex-1 overflow-y-auto p-3">
              {parsedQuestions[currentQuestionIndex] && (
                <Question
                  question={parsedQuestions[currentQuestionIndex]}
                  selectedAnswer={selectedAnswers[parsedQuestions[currentQuestionIndex].id]}
                  onAnswerSelect={(answer) => setSelectedAnswers(prev => ({
                    ...prev,
                    [parsedQuestions[currentQuestionIndex].id]: answer
                  }))}
                  showSolution={viewMode === 'solution'}
                  solution={parsedQuestions[currentQuestionIndex].solution}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Solutions; 