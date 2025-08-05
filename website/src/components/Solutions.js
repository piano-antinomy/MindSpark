import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { questionParser } from '../utils/QuestionParser';
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

  useLayoutEffect(() => {
    // Re-render MathJax when questions change or view mode changes
    if (parsedQuestions.length > 0) {
      safeMathJaxTypeset().catch(() => {
        setTimeout(() => safeMathJaxTypeset(), 50);
      });
    }
  }, [parsedQuestions, currentQuestionIndex, viewMode]);

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

  const loadQuizAndSolutions = async (quizId) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = checkAuthStatus();
      
      // Get quiz data
      const quizResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}`, {
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
        const questionsResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}/questions`, {
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
      setViewMode('quiz'); // Reset to quiz view when changing questions
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < parsedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setViewMode('quiz'); // Reset to quiz view when changing questions
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'quiz' ? 'solution' : 'quiz');
  };

  const handleQuestionSelect = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
    setViewMode('quiz'); // Reset to quiz view when changing questions
  };

  const renderSolution = (question) => {
    const solutions = question.originalQuestion?.solutions;
    
    if (!solutions || solutions.length === 0) {
      return <div className="solution-content">No solution available for this question.</div>;
    }

    // Get insertions from the original question for processing solution text
    const questionInsertions = question.originalQuestion?.question?.insertions;

    return (
      <div className="solution-content">
        {solutions.map((solution, index) => {
          // Use the shared processSolutionText method from QuestionParser
          const processedText = questionParser.processSolutionText(solution, questionInsertions);
          
          return (
            <div key={index} className="solution-item">
              {solutions.length > 1 && (
                <h4>Solution {index + 1}:</h4>
              )}
              <div 
                className="solution-text"
                dangerouslySetInnerHTML={{
                  __html: processedText
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderSolutionContent = (question) => {
    return (
      <div className="question-content-section text-left">
        {/* Question text */}
        <div className="question-text mb-4">
          <h4 className="font-semibold mb-2">Question:</h4>
          <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
        </div>

        {/* Answer choices */}
        {question.choices && question.choices.length > 0 && !question.isDummyChoices && (
          <div className="choices-section mb-4">
            <h4 className="font-semibold mb-2">Choices:</h4>
            <div className="choices-container">
              {question.isImageChoice ? (
                <div className="image-choices">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="image-choice mb-2">
                      <strong>{String.fromCharCode(65 + choiceIndex)}:</strong>
                      <img 
                        src={choice.uri} 
                        alt={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                        className="choice-image ml-2"
                        style={{
                          width: choice.width ? `${choice.width}px` : 'auto',
                          height: choice.height ? `${choice.height}px` : 'auto'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-choices">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="text-choice mb-1">
                      {question.hasLabels ? (
                        <div dangerouslySetInnerHTML={{ __html: choice }} />
                      ) : (
                        <div>
                          <strong>{String.fromCharCode(65 + choiceIndex)}:</strong> 
                          <span dangerouslySetInnerHTML={{ __html: choice }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div className="answer-section mb-4">
          <h4 className="font-semibold">Correct Answer: <span className="text-green-600">{question.answer}</span></h4>
        </div>

        {/* Solution */}
        <div className="solution-section">
          <h4 className="font-semibold mb-2">Solution:</h4>
          {renderSolution(question)}
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
          quizCompleted={true}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
        />
      );
    } else {
      return (
        <div className="solution-view h-full">
          {currentQuestion.choiceVertical ? (
            // Vertical layout: solution content only
            <div className="flex flex-col gap-3 lg:gap-4 flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                {renderSolutionContent(currentQuestion)}
              </div>
            </div>
          ) : (
            // Side-by-side layout: solution content takes full width
            <div className="flex gap-3 lg:gap-4 flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                {renderSolutionContent(currentQuestion)}
              </div>
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
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu">
        <div className="menu-header">
          <h1>📚 Solutions</h1>
          <nav className="breadcrumb">
            <Link to="/dashboard">Dashboard</Link> {'>'} 
            <Link to="/subjects">Subjects</Link> {'>'} 
            <Link to="/math">Mathematics</Link> {'>'} 
            <Link to="/quiz">Quiz</Link> {'>'} 
            Solutions
          </nav>
        </div>
        
        {/* Quiz Info */}
        <div className="aside-info">
          {currentQuiz && (
            <div>
              <h3>{currentQuiz.quizName}</h3>
              <p>{currentQuiz.questionSetId}</p>
              <p>{parsedQuestions.length} questions</p>
            </div>
          )}
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          <button className="btn btn-secondary" onClick={() => navigate('/quiz')}>
            ← Back to Quizzes
          </button>
        </div>
      </nav>

      {/* Main content area - matching QuizTaking layout */}
      <main className="math-main-content">
        <div className="bg-white rounded-xl p-4 lg:p-6 flex flex-col" style={{ height: 'calc(100vh - 32px)' }}>
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
      </main>
    </div>
  );
}

export default Solutions; 