import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionRenderer, { questionRenderer } from './QuestionRenderer';

function MathQuestions() {
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [processedQuestions, setProcessedQuestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const { level, year, amcType, levelDescription } = location.state || {};
  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  useEffect(() => {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if we have the required data
    if (!level || !year) {
      navigate('/math');
      return;
    }

    // Load questions
    loadQuestions();
  }, [navigate, level, year]);

  useEffect(() => {
    // Re-render MathJax when questions change
    if (window.MathJax && processedQuestions.length > 0) {
      window.MathJax.typesetPromise();
    }
  }, [processedQuestions]);

  const checkAuthStatus = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${JAVA_API_BASE_URL}/questions/math/level/${level}/year/${year}`;
      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        if (data.success) {
          setQuestionsData(data);
          
          // Process questions using the question renderer
          const processed = data.questions.map((question, index) => 
            questionRenderer.processQuestion(question, index)
          );
          setProcessedQuestions(processed);
          
          setCurrentAnswers({});
          setLoading(false);
        } else {
          throw new Error('Failed to load questions');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError(`Failed to load questions for ${amcType} ${year}. Please check your connection.`);
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, answer) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAllAnswers = () => {
    let correct = 0;
    let answered = 0;
    
    processedQuestions.forEach((question, index) => {
      const selectedAnswer = currentAnswers[question.id];
      if (selectedAnswer) {
        answered++;
        if (selectedAnswer === question.answer) {
          correct++;
        }
      }
    });
    
    const summary = `
Results Summary:
Answered: ${answered}/${processedQuestions.length}
Correct: ${correct}/${answered > 0 ? answered : processedQuestions.length}
Score: ${answered > 0 ? Math.round((correct/answered) * 100) : 0}%
    `;
    
    alert(summary);
  };

  const resetAllPractice = () => {
    setCurrentAnswers({});
  };

  const showAllSolutions = () => {
    alert('Show all solutions feature coming soon!');
  };

  const renderError = () => (
    <div className="error-message">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={loadQuestions} className="btn btn-primary">Try Again</button>
      <button onClick={() => navigate('/math')} className="btn btn-secondary">Back to Math Selection</button>
    </div>
  );

  const renderQuestion = (question, index) => {
    return (
      <QuestionRenderer
        key={question.id}
        question={question.originalQuestion}
        questionIndex={index}
        selectedAnswer={currentAnswers[question.id]}
        onAnswerSelect={selectAnswer}
        mode="practice"
      />
    );
  };

  if (loading) {
    return <div className="loading">Loading questions...</div>;
  }

  if (error) {
    return renderError();
  }

  if (!level || !year) {
    return <div>No question data available</div>;
  }

  return (
    <div className="math-layout">
      {/* Left Menu Navigation */}
      <nav className="math-left-menu">
        <div className="menu-header">
          <h1>📊 Mathematics</h1>
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
            {amcType} {year}
          </nav>
        </div>
        
        <div className="menu-tabs">
          <button className="menu-tab" onClick={() => navigate('/quiz')}>
            <span className="tab-icon">🎯</span>
            <span className="tab-text">Quiz</span>
          </button>
          <button className="menu-tab active" onClick={() => navigate('/math')}>
            <span className="tab-icon">📚</span>
            <span className="tab-text">Problems</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="aside-info">
          <div>
            <h3>{amcType} {year}</h3>
            <p>Work through the problems at your own pace. Use the controls below to check answers and show solutions.</p>
            <div className="level-badge">{amcType}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              Year: {year} • Questions: {processedQuestions.length}
            </div>
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="aside-navigation">
          <button className="btn btn-secondary" onClick={() => navigate('/math')}>
            ← Back to Math Selection
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="math-main-content">
        <div className="tab-content">
          <div className="questions-container all-questions">
            <div className="practice-controls">
              <div className="button-row primary-actions">
                <button className="btn btn-success" onClick={checkAllAnswers}>
                  ✅ Check All Answers
                </button>
              </div>
              <div className="button-row secondary-actions">
                <button className="btn btn-info" onClick={resetAllPractice}>
                  🔄 Reset All
                </button>
                <button className="btn btn-warning" onClick={showAllSolutions}>
                  💡 Show All Solutions
                </button>
              </div>
            </div>
            
            <div className="all-questions-display">
              {processedQuestions.map((question, index) => renderQuestion(question, index))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MathQuestions; 