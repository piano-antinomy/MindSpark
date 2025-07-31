import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { questionParser } from '../utils/QuestionParser';

function Solutions() {
  const [questions, setQuestions] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
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

  useEffect(() => {
    // Re-render MathJax when questions change
    if (parsedQuestions.length > 0) {
      setTimeout(() => {
        safeMathJaxTypeset();
      }, 100);
    }
  }, [parsedQuestions]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const safeMathJaxTypeset = async () => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      try {
        await window.MathJax.typesetPromise();
      } catch (error) {
        console.warn('MathJax typeset error:', error);
      }
    }
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
        
        // Load quiz questions with solutions
        const questionsResponse = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}/questions`, {
          credentials: 'include'
        });
        
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          // Temporary debugging to understand the data structure
          console.log('Questions data from API:', questionsData);
          if (questionsData.length > 0) {
            console.log('First question structure:', questionsData[0]);
            console.log('First question solutions:', questionsData[0].solutions);
            console.log('First question insertions:', questionsData[0].question?.insertions);
          }
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

  // Note: Using shared processSolutionText method from QuestionParser
  // This ensures solutions use exactly the same insertion and LaTeX processing as questions

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

  const renderQuestion = (question, index) => {
    return (
      <div key={question.id} className="solution-question-container">
        <div className="question-header">
          <h3>Problem {index + 1}</h3>
        </div>
        
        {/* Question Text */}
        <div className="question-section">
          <h4>Question:</h4>
          <div 
            className="question-text"
            dangerouslySetInnerHTML={{ __html: question.questionText }}
          />
        </div>

        {/* Answer Choices */}
        {question.choices && question.choices.length > 0 && !question.isDummyChoices && (
          <div className="choices-section">
            <h4>Choices:</h4>
            <div className="choices-container">
              {question.isImageChoice ? (
                <div className="image-choices">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="image-choice">
                      <strong>{String.fromCharCode(65 + choiceIndex)}:</strong>
                      <img 
                        src={choice.uri} 
                        alt={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
                        className="choice-image"
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
                    <div key={choiceIndex} className="text-choice">
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
        <div className="answer-section">
          <h4>Correct Answer: <span className="correct-answer">{question.answer}</span></h4>
        </div>

        {/* Solution */}
        <div className="solution-section">
          <h4>Solution:</h4>
          {renderSolution(question)}
        </div>
      </div>
    );
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

      {/* Main content area */}
      <main className="math-main-content">
        <div className="solutions-container">
          <h2>Quiz Solutions</h2>
          {parsedQuestions.length === 0 ? (
            <div className="empty-state">
              <p>No questions found for this quiz.</p>
            </div>
          ) : (
            <div className="solutions-list">
              {parsedQuestions.map((question, index) => renderQuestion(question, index))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Solutions; 