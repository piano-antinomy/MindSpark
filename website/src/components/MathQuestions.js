import React, { useState, useEffect, useLayoutEffect } from 'react';
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
      // Use setTimeout to ensure DOM is rendered before typesetting
      setTimeout(() => {
        window.MathJax.typesetPromise();
      }, 0);
    }
  }, [processedQuestions]);

  // Use useLayoutEffect for more reliable MathJax typesetting
  useLayoutEffect(() => {
    if (window.MathJax && processedQuestions.length > 0) {
      // Try to typeset immediately after DOM updates
      window.MathJax.typesetPromise().catch(() => {
        // If it fails, retry after a short delay
        setTimeout(() => {
          window.MathJax.typesetPromise();
        }, 50);
      });
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button onClick={loadQuestions} className="btn btn-primary w-full">
              Try Again
            </button>
            <button onClick={() => navigate('/math')} className="btn btn-secondary w-full">
              Back to Math Selection
            </button>
          </div>
        </div>
      </div>
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
        layout="stacked"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return renderError();
  }

  if (!level || !year) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>No question data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Menu Navigation */}
      <nav className="w-80 bg-white border-r border-gray-200 shadow-soft fixed h-full overflow-y-auto z-20">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 Mathematics</h1>
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
            <span className="text-gray-900">{amcType} {year}</span>
          </nav>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => navigate('/quiz')}
          >
            <span className="text-xl">🎯</span>
            <span className="font-medium">Quiz</span>
          </button>
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary-50 text-primary-700 border-l-4 border-primary-500 rounded-lg"
            onClick={() => navigate('/math')}
          >
            <span className="text-xl">📚</span>
            <span className="font-medium">Problems</span>
          </button>
        </div>
        
        {/* Context info */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{amcType} {year}</h3>
            <p className="text-gray-600 text-sm mb-3">
              Work through the problems at your own pace. Use the controls below to check answers and show solutions.
            </p>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {amcType}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Year: {year} • Questions: {processedQuestions.length}
            </div>
          </div>
        </div>
        
        {/* Navigation controls */}
        <div className="p-6">
          <button className="btn btn-secondary w-full" onClick={() => navigate('/math')}>
            ← Back to Math Selection
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1 ml-80 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button className="btn btn-success btn-large" onClick={checkAllAnswers}>
                    ✅ Check All Answers
                  </button>
                </div>
                <div className="flex justify-center gap-4">
                  <button className="btn btn-secondary" onClick={resetAllPractice}>
                    🔄 Reset All
                  </button>
                  <button className="btn btn-warning" onClick={showAllSolutions}>
                    💡 Show All Solutions
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {processedQuestions.map((question, index) => renderQuestion(question, index))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MathQuestions; 