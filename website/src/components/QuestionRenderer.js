import React, { useEffect, useRef } from 'react';
import { questionParser } from '../utils/QuestionParser';

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
    // Don't render anything for dummy_choices questions
    if (processedQuestion.isDummyChoices) {
      return null;
    }

    if (!processedQuestion.choices || processedQuestion.choices.length === 0) {
      return <></>;
    }

    if (processedQuestion.isImageChoice) {
      // Handle image choices - just show the image, no fake choices
      return (
        <div className="question-image-container">
          <div dangerouslySetInnerHTML={{ __html: processedQuestion.choices[0] }} />
        </div>
      );
    } else {
      // Handle regular choices - simplified for viewing only
      return (
        <div className="space-y-2">
          {processedQuestion.choices.map((choice, choiceIndex) => {
            const choiceValue = String.fromCharCode(65 + choiceIndex);
            
            return (
              <div 
                key={choiceIndex} 
                className="text-left"
              >
                <span className="choice-text" dangerouslySetInnerHTML={{ __html: choice }} />
              </div>
            );
          })}
        </div>
      );
    }
  };



  return (
    <div ref={questionRef} className="bg-white rounded-xl p-6 mb-6 border border-gray-200" style={{ boxShadow: 'none' }}>
      <div className="question-header mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Problem {questionIndex + 1}</h3>
      </div>

      <div className="question-content text-left mb-6">
        <div 
          className="question-text prose prose-lg max-w-none text-left" 
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

      <div className="choices-container text-left">
        {renderChoices()}
      </div>
    </div>
  );
}

export default QuestionRenderer;
export { questionRenderer }; 