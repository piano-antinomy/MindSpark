import React, { useEffect, useRef } from 'react';
import { questionParser } from './QuestionParser';

// Question Renderer functionality - focuses only on rendering parsed questions
class QuestionRendererClass {
  constructor() {
    this.mathJaxReady = false;
    this.initializeMathJax();
  }

  initializeMathJax() {
    if (typeof window.MathJax !== 'undefined') {
      this.mathJaxReady = true;
      console.log('[QuestionRenderer] MathJax initialized successfully');
    } else {
      console.log('[QuestionRenderer] MathJax not available');
    }
  }

  async renderLatexContent(element) {
    if (!this.mathJaxReady || typeof window.MathJax === 'undefined') {
      console.log('[QuestionRenderer] MathJax not available for rendering');
      return Promise.resolve();
    }

    try {
      console.log('[QuestionRenderer] Rendering LaTeX content in element:', element);
      await window.MathJax.typesetPromise([element]);
      console.log('[QuestionRenderer] LaTeX rendering completed successfully');
    } catch (error) {
      console.warn('[QuestionRenderer] MathJax rendering error:', error);
    }
  }

  processQuestion(question, questionIndex = 0) {
    // Use the question parser to handle all parsing logic
    return questionParser.parseQuestion(question, questionIndex);
  }
}

// Create global instance
const questionRenderer = new QuestionRendererClass();

// React component for rendering a single question
function QuestionRenderer({ 
  question, 
  questionIndex = 0, 
  selectedAnswer = null, 
  onAnswerSelect = null,
  showAnswer = false,
  showSolution = false,
  mode = 'practice', // 'practice' or 'quiz'
  layout = 'stacked' // 'stacked' or 'side-by-side'
}) {
  const questionRef = useRef(null);
  
  // Process the question using QuestionRenderer to handle the nested structure
  const processedQuestion = questionRenderer.processQuestion(question, questionIndex);
  
  useEffect(() => {
    // Re-render MathJax when question changes
    if (window.MathJax && questionRef.current) {
      window.MathJax.typesetPromise([questionRef.current]);
    }
  }, [processedQuestion]);

  const handleAnswerSelect = (answer) => {
    if (onAnswerSelect) {
      onAnswerSelect(processedQuestion.id, answer);
    }
  };

  const renderChoices = () => {
    if (!processedQuestion.choices || processedQuestion.choices.length === 0) {
      return <p className="text-gray-500 italic">No choices available for this question.</p>;
    }

    if (processedQuestion.isImageChoice) {
      // Handle image choices
      return (
        <div className="space-y-4">
          <div className="question-image-container">
            <div dangerouslySetInnerHTML={{ __html: processedQuestion.choices[0] }} />
          </div>
          <div className="grid grid-cols-5 gap-3">
            {['A', 'B', 'C', 'D', 'E'].map((letter, letterIndex) => (
              <label 
                key={letterIndex} 
                className={`choice-label ${selectedAnswer === letter ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${processedQuestion.id}`}
                  value={letter}
                  checked={selectedAnswer === letter}
                  onChange={() => handleAnswerSelect(letter)}
                  disabled={showAnswer}
                  className="sr-only"
                />
                <span className="choice-text text-center font-semibold">{letter}</span>
              </label>
            ))}
          </div>
        </div>
      );
    } else {
      // Handle regular choices
      return processedQuestion.choices.map((choice, choiceIndex) => {
        const choiceValue = String.fromCharCode(65 + choiceIndex);
        const isCorrect = showAnswer && choiceValue === processedQuestion.answer;
        const isSelected = selectedAnswer === choiceValue;
        
        return (
          <label 
            key={choiceIndex} 
            className={`choice-label ${isSelected ? 'selected' : ''} ${showAnswer && isCorrect ? 'bg-success-50 border-success-500 text-success-900' : ''} ${showAnswer && isSelected && !isCorrect ? 'bg-danger-50 border-danger-500 text-danger-900' : ''}`}
          >
            <input
              type="radio"
              name={`question-${processedQuestion.id}`}
              value={choiceValue}
              checked={isSelected}
              onChange={() => handleAnswerSelect(choiceValue)}
              disabled={showAnswer}
              className="mr-3 text-primary-600 focus:ring-primary-500"
            />
            <span 
              className="choice-text" 
              dangerouslySetInnerHTML={{ __html: choice }} 
            />
            {showAnswer && isCorrect && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-500 text-white text-xs">
                ✓
              </span>
            )}
            {showAnswer && isSelected && !isCorrect && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger-500 text-white text-xs">
                ✗
              </span>
            )}
          </label>
        );
      });
    }
  };

  const renderQuestionContent = () => (
    <div className="question-content">
      <div 
        className="question-text prose prose-lg max-w-none" 
        dangerouslySetInnerHTML={{ __html: processedQuestion.questionText }} 
      />
      
      {showAnswer && (
        <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
          <p className="text-success-800 font-medium">
            <span className="font-semibold">Correct Answer:</span> {processedQuestion.answer}
          </p>
        </div>
      )}

      {showSolution && processedQuestion.solution && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-blue-900 font-semibold mb-2">Solution:</h4>
          <div 
            className="solution-text prose prose-sm text-blue-800" 
            dangerouslySetInnerHTML={{ __html: processedQuestion.solution }} 
          />
        </div>
      )}
    </div>
  );

  const renderChoicesSection = () => (
    <div className="choices-container">
      {renderChoices()}
    </div>
  );

  return (
    <div ref={questionRef} className={`question-container ${layout === 'side-by-side' ? 'question-container-side-by-side' : ''}`}>
      <div className="question-header">
        <h3 className="text-xl font-semibold text-gray-900">Problem {questionIndex + 1}</h3>
        {mode === 'practice' && (
          <div className="question-status">
            {selectedAnswer ? 
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                ✓ Answered
              </span> : 
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                ○ Not answered
              </span>
            }
          </div>
        )}
      </div>

      {layout === 'side-by-side' ? (
        <div className="question-layout-side-by-side">
          <div className="question-content-section">
            {renderQuestionContent()}
          </div>
          <div className="choices-section">
            {renderChoicesSection()}
          </div>
        </div>
      ) : (
        <div className="question-layout-stacked">
          {renderQuestionContent()}
          {renderChoicesSection()}
        </div>
      )}
    </div>
  );
}

export default QuestionRenderer;
export { questionRenderer }; 