import React from 'react';

function Question({ question, quizCompleted = false, selectedAnswer = null, onAnswerSelect = null }) {
  const renderQuestionContent = (question) => {
    return (
      <div className="question-content-section overflow-y-auto min-h-0 p-3 lg:p-6">
        {/* Question text with processed insertions */}
        <div 
          className="question-text mb-4"
          dangerouslySetInnerHTML={{ __html: question.questionText }}
        />
        
        {/* Image integration for image choices */}
        {question.isImageChoice && question.choices && (
          <div className="question-image-container mb-4">
            {question.choices.map((choice, index) => {
              const style = choice.width && choice.height ? 
                { width: `${choice.width}px`, height: `${choice.height}px` } : {};
              return (
                <img 
                  key={index}
                  src={choice.uri} 
                  style={style} 
                  alt={`Question image ${index + 1}`}
                />
              );
            })}
          </div>
        )}
        
        {/* Solution display when quiz completed */}
        {quizCompleted && question.solution && (
          <div className="solution-section mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Solution:</h4>
            <div 
              className="solution-text"
              dangerouslySetInnerHTML={{ __html: question.solution }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderChoices = (question) => {
    // Edge case: No choices
    if ((!question.choices || question.choices.length === 0) && !question.isDummyChoices) {
      return <p>No choices available for this question.</p>;
    }

    // Edge case: Dummy choices (A, B, C, D, E)
    if (question.isDummyChoices) {
      return question.choices.map((choice, choiceIndex) => {
        const choiceValue = String.fromCharCode(65 + choiceIndex);
        const isSelected = selectedAnswer === choiceValue;
        const isCorrect = question.answer === choiceValue;
        
        return (
          <label 
            key={choiceIndex}
            className={`choice-item block p-3 border rounded cursor-pointer transition-colors ${
              quizCompleted 
                ? isCorrect 
                  ? 'bg-green-100 border-green-500' 
                  : isSelected && !isCorrect 
                    ? 'bg-red-100 border-red-500' 
                    : 'bg-gray-50 border-gray-300'
                : isSelected 
                  ? 'bg-blue-100 border-blue-500' 
                  : 'hover:bg-gray-50 border-gray-300'
            }`}
          >
            <input 
              type="radio" 
              name={`question-${question.id}`}
              value={choiceValue}
              checked={isSelected}
              onChange={() => onAnswerSelect && onAnswerSelect(choiceValue)}
              disabled={quizCompleted}
              className="mr-2"
            />
            <span className="font-medium">{choiceValue}:</span> {choice}
            {quizCompleted && isCorrect && (
              <span className="ml-2 text-green-600">✓ Correct</span>
            )}
            {quizCompleted && isSelected && !isCorrect && (
              <span className="ml-2 text-red-600">✗ Incorrect</span>
            )}
          </label>
        );
      });
    }

    // Edge case: Image choices (show image in question, A-E as buttons)
    if (question.isImageChoice) {
      return ['A', 'B', 'C', 'D', 'E'].map((letter, index) => {
        const isSelected = selectedAnswer === letter;
        const isCorrect = question.answer === letter;
        
        return (
          <label 
            key={index}
            className={`choice-item block p-3 border rounded cursor-pointer transition-colors ${
              quizCompleted 
                ? isCorrect 
                  ? 'bg-green-100 border-green-500' 
                  : isSelected && !isCorrect 
                    ? 'bg-red-100 border-red-500' 
                    : 'bg-gray-50 border-gray-300'
                : isSelected 
                  ? 'bg-blue-100 border-blue-500' 
                  : 'hover:bg-gray-50 border-gray-300'
            }`}
          >
            <input 
              type="radio" 
              name={`question-${question.id}`}
              value={letter}
              checked={isSelected}
              onChange={() => onAnswerSelect && onAnswerSelect(letter)}
              disabled={quizCompleted}
              className="mr-2"
            />
            <span className="font-medium">{letter}</span>
            {quizCompleted && isCorrect && (
              <span className="ml-2 text-green-600">✓ Correct</span>
            )}
            {quizCompleted && isSelected && !isCorrect && (
              <span className="ml-2 text-red-600">✗ Incorrect</span>
            )}
          </label>
        );
      });
    }

    // Regular choices (text or LaTeX)
    return question.choices.map((choice, choiceIndex) => {
      const choiceValue = String.fromCharCode(65 + choiceIndex);
      const isSelected = selectedAnswer === choiceValue;
      const isCorrect = question.answer === choiceValue;
      
      return (
        <label 
          key={choiceIndex}
          className={`choice-item block p-3 border rounded cursor-pointer transition-colors ${
            quizCompleted 
              ? isCorrect 
                ? 'bg-green-100 border-green-500' 
                : isSelected && !isCorrect 
                  ? 'bg-red-100 border-red-500' 
                  : 'bg-gray-50 border-gray-300'
              : isSelected 
                ? 'bg-blue-100 border-blue-500' 
                : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          <input 
            type="radio" 
            name={`question-${question.id}`}
            value={choiceValue}
            checked={isSelected}
            onChange={() => onAnswerSelect && onAnswerSelect(choiceValue)}
            disabled={quizCompleted}
            className="mr-2"
          />
          {question.isTextChoice ? (
            <span>{choice}</span>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: choice }} />
          )}
          {quizCompleted && isCorrect && (
            <span className="ml-2 text-green-600">✓ Correct</span>
          )}
          {quizCompleted && isSelected && !isCorrect && (
            <span className="ml-2 text-red-600">✗ Incorrect</span>
          )}
        </label>
      );
    });
  };

  const renderQuestion = (question) => {
    // Layout decision based on choice_vertical flag
    if (question.choiceVertical) {
      // Vertical layout: question content stacked above choices
      return (
        <div className="flex flex-col gap-3 lg:gap-4 flex-1 min-h-0">
          {/* Question content section - scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderQuestionContent(question)}
          </div>
          
          {/* Choices section - below question content */}
          <div className="flex-shrink-0">
            <div className="choices-container space-y-2 lg:space-y-3 p-3 lg:p-6">
              {renderChoices(question)}
            </div>
          </div>
        </div>
      );
    } else {
      // Side-by-side layout: question and choices side by side
      return (
        <div className="flex gap-3 lg:gap-4 flex-1 min-h-0">
          {/* Dynamic width allocation using choiceSpace */}
          <div style={{ width: question.choiceSpace ? `${(1 - question.choiceSpace) * 100}%` : '66.667%' }}>
            {renderQuestionContent(question)}
          </div>
          <div style={{ width: question.choiceSpace ? `${question.choiceSpace * 100}%` : '33.333%' }}>
            <div className="choices-container space-y-2 lg:space-y-3 p-3 lg:p-6">
              {renderChoices(question)}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full">
      {renderQuestion(question)}
    </div>
  );
}

export default Question; 