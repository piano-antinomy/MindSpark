import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionRenderer, { questionRenderer } from './QuestionRenderer';
import { apiFetch } from '../utils/api';

function MathQuestions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [processedQuestions, setProcessedQuestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const { level, year, amcType, levelDescription } = location.state || {};
  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

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
      const response = await apiFetch(url);
      
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
        selectedAnswer={null}
        onAnswerSelect={() => {}}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with AMC info and back button */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/math')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Math Selection</span>
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">{amcType.replace('_', ' ')} {year}</h1>
            </div>
            
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {processedQuestions.map((question, index) => renderQuestion(question, index))}
        </div>
      </main>
    </div>
  );
}

export default MathQuestions; 