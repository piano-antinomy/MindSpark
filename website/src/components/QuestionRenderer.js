import React, { useEffect, useRef } from 'react';

// Question Renderer functionality (adapted from question-renderer.js)
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

  processQuestionText(questionText, insertions) {
    if (!insertions) return this.preprocessLatexText(questionText);
    
    let processedText = questionText;
    
    // Replace insertion markers like <INSERTION_INDEX_1> with actual content
    Object.keys(insertions).forEach(key => {
      const insertion = insertions[key];
      const marker = `<${key}>`; // e.g., "<INSERTION_INDEX_1>"
      
      // Replace the marker with the appropriate content
      if (insertion.alt_type === 'image' && insertion.picture) {
        // Use picture URL with proper protocol for image type
        const imageUrl = this.processImageUrl(insertion.picture);
        const altText = insertion.alt_value || 'Question image';
        processedText = processedText.replace(marker, 
          `<img src="${imageUrl}" alt="${altText}" class="question-image" />`);
      } else if (insertion.alt_type === 'latex' && insertion.alt_value) {
        // Use LaTeX content (preprocess it first)
        const preprocessedLatex = this.preprocessLatexText(insertion.alt_value);
        processedText = processedText.replace(marker, preprocessedLatex);
      } else if (insertion.picture) {
        // Fallback: Use picture URL with proper protocol (legacy support)
        const imageUrl = this.processImageUrl(insertion.picture);
        const altText = insertion.alt_value || 'Question image';
        processedText = processedText.replace(marker, 
          `<img src="${imageUrl}" alt="${altText}" class="question-image" />`);
      } else if (insertion.alt_value) {
        // Use alternative text value
        processedText = processedText.replace(marker, insertion.alt_value);
      }
    });
    
    // Preprocess the final text to handle any remaining LaTeX commands
    return this.preprocessLatexText(processedText);
  }

  processImageUrl(url) {
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    return url;
  }

  preprocessLatexText(text) {
    if (!text) return text;
    
    let processedText = text;
    
    // Replace \textsc{...} with \text{...}
    processedText = processedText.replace(/\\textsc\{([^}]*)\}/g, '\\text{$1}');
    
    // Replace \emph{...} with \textit{...}
    processedText = processedText.replace(/\\emph\{([^}]*)\}/g, '\\textit{$1}');
    
    // Replace \overarc{...} with \overparen{...}
    processedText = processedText.replace(/\\overarc\{([^}]*)\}/g, '\\overparen{$1}');
    
    // Replace \textdollar with \text{\$} for proper dollar sign rendering
    processedText = processedText.replace(/\\textdollar/g, '\\text{\\$}');
    
    // Replace \begin{tabular} with \begin{array} for better MathJax 3.x support
    processedText = processedText.replace(/\\begin\{tabular\}/g, '\\begin{array}');
    processedText = processedText.replace(/\\end\{tabular\}/g, '\\end{array}');
    
    console.log('[QuestionRenderer] Preprocessed LaTeX text:', processedText);
    
    return processedText;
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

  extractQuestionChoices(questionDetails) {
    // Priority: text_choices > latex_choices > picture_choices
    if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
      return { choices: questionDetails.text_choices, hasLabels: false, isImageChoice: false };
    } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
      const result = this.parseLatexChoices(questionDetails.latex_choices);
      return { ...result, isImageChoice: false };
    } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
      const imageChoices = questionDetails.picture_choices.map(url => {
        const imageUrl = this.processImageUrl(url);
        return `<img src="${imageUrl}" alt="Choice" class="choice-image" />`;
      });
      return { choices: imageChoices, hasLabels: false, isImageChoice: true };
    }
    
    return { choices: [], hasLabels: false, isImageChoice: false };
  }

  parseLatexChoices(latexChoices) {
    console.log('[QuestionRenderer] Parsing LaTeX choices:', latexChoices);
    
    // Preprocess all LaTeX choices first
    const preprocessedChoices = latexChoices.map(choice => this.preprocessLatexText(choice));
    
    if (preprocessedChoices.length === 1) {
      // Single string containing all choices - need to split
      const choiceString = preprocessedChoices[0];
      console.log('[QuestionRenderer] Single choice string to parse:', choiceString);
      
      // Check if it contains multiple choice labels like (A), (B), etc.
      const textbfMatches = choiceString.match(/\\textbf\{[^}]*\([A-E]\)[^}]*\}/g);
      console.log('[QuestionRenderer] Found textbf matches:', textbfMatches);
      
      if (textbfMatches && textbfMatches.length > 1) {
        return this.splitByQquad(choiceString);
      }
      
      // Alternative approach: try splitting by the pattern (A), (B), etc.
      const labelPattern = /\\textbf\{.*?\([A-E]\).*?\}/g;
      const labelMatches = choiceString.match(labelPattern);
      
      if (labelMatches && labelMatches.length > 1) {
        console.log('[QuestionRenderer] Using label pattern approach:', labelMatches);
        const choices = labelMatches.map(match => `$${match.replace(/\\qquad.*$/, '')}$`);
        return { choices, hasLabels: true };
      }
      
      // Manual AMC format splitting
      if (choiceString.includes('\\qquad') && choiceString.includes('textbf')) {
        return this.manualAmcSplit(choiceString);
      }
      
      // If splitting failed, return as single choice
      console.log('[QuestionRenderer] Splitting failed, returning single choice');
      return { choices: [choiceString], hasLabels: true };
    } else {
      // Multiple strings - assume each is a separate choice
      const hasLabels = preprocessedChoices.some(choice => 
        choice.includes('textbf') && choice.match(/\([A-E]\)/));
      return { choices: preprocessedChoices, hasLabels };
    }
  }

  splitByQquad(choiceString) {
    console.log('[QuestionRenderer] Splitting by qquad/qquad approach');
    
    // More robust splitting approach
    let workingString = choiceString;
    
    // Remove outer $ delimiters if present
    workingString = workingString.replace(/^\$/, '').replace(/\$$/, '');
    
    // Check if we have \qquad or \quad separators
    const hasQquad = workingString.includes('\\qquad');
    const hasQuad = workingString.includes('\\quad');
    
    let parts;
    if (hasQquad) {
      // Split by \\qquad
      parts = workingString.split(/\\qquad/);
      console.log('[QuestionRenderer] Split by qquad:', parts);
    } else if (hasQuad) {
      // Count the number of \quad occurrences
      const quadCount = (workingString.match(/\\quad/g) || []).length;
      console.log('[QuestionRenderer] Found quad count:', quadCount);
      
      // If we have exactly 4 \quad separators (which would create 5 choices), use \quad
      if (quadCount === 4) {
        parts = workingString.split(/\\quad/);
        console.log('[QuestionRenderer] Split by quad (4 separators):', parts);
      } else {
        // Fall back to \qquad if we don't have exactly 4 \quad
        parts = workingString.split(/\\qquad/);
        console.log('[QuestionRenderer] Fallback split by qquad:', parts);
      }
    } else {
      // No \qquad or \quad found, try \\ as separator
      const hasDoubleBackslash = workingString.includes('\\\\');
      if (hasDoubleBackslash) {
        parts = workingString.split(/\\\\/);
        console.log('[QuestionRenderer] Split by \\\\:', parts);
      } else {
        // No separators found, try \qquad as fallback
        parts = workingString.split(/\\qquad/);
        console.log('[QuestionRenderer] No separators found, fallback split:', parts);
      }
    }
    
    const choices = [];
    for (let part of parts) {
      part = part.trim();
      if (part && part.includes('textbf')) {
        // Wrap each part in $ delimiters for proper LaTeX rendering
        choices.push(`$${part}$`);
      }
    }
    
    console.log('[QuestionRenderer] Extracted choices:', choices);
    
    if (choices.length > 1) {
      return { choices, hasLabels: true };
    }
    
    return { choices: [], hasLabels: false };
  }

  manualAmcSplit(choiceString) {
    console.log('[QuestionRenderer] Using manual AMC format splitting');
    
    // Remove outer $ delimiters
    let content = choiceString.replace(/^\$/, '').replace(/\$$/, '');
    
    // Split by textbf but keep the textbf part with the following content
    const choices = [];
    const regex = /(\\textbf\{[^}]*\([A-E]\)[^}]*\}[^\\]*)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      let choice = match[1].trim();
      // Remove any trailing \\qquad or \\quad
      choice = choice.replace(/\\qquad\s*$/, '').replace(/\\quad\s*$/, '');
      choices.push(`$${choice}$`);
    }
    
    console.log('[QuestionRenderer] Manual splitting result:', choices);
    
    if (choices.length > 1) {
      return { choices, hasLabels: true };
    }
    
    return { choices: [], hasLabels: false };
  }

  processQuestion(question, questionIndex = 0) {
    let questionText, choices, hasLabels = false, isImageChoice = false;
    
    if (typeof question.question === 'string') {
      // Old format - just text and choices array
      questionText = question.question;
      choices = question.choices || [];
      hasLabels = false;
      isImageChoice = false;
    } else {
      // New format - complex object with insertions
      const questionDetails = question.question;
      questionText = this.processQuestionText(questionDetails.text, questionDetails.insertions);
      const choiceResult = this.extractQuestionChoices(questionDetails);
      choices = choiceResult.choices;
      hasLabels = choiceResult.hasLabels;
      isImageChoice = choiceResult.isImageChoice;
      
      // If no choices extracted from new format, fall back to simple choices array
      if (choices.length === 0 && question.choices) {
        choices = question.choices;
        hasLabels = false;
        isImageChoice = false;
      }
    }
    
    return {
      id: question.id || `question_${questionIndex}`,
      questionText,
      choices,
      hasLabels,
      isImageChoice: isImageChoice || false,
      answer: question.answer,
      solution: question.solution,
      originalQuestion: question
    };
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
  mode = 'practice' // 'practice' or 'quiz'
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
      return <p>No choices available for this question.</p>;
    }

    if (processedQuestion.isImageChoice) {
      // Handle image choices
      return (
        <div className="image-choice-container">
          <div className="question-image-container">
            <div dangerouslySetInnerHTML={{ __html: processedQuestion.choices[0] }} />
          </div>
          <div className="image-choice-letters">
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
                />
                <span className="choice-text">{letter}</span>
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
            className={`choice-label ${isSelected ? 'selected' : ''} ${showAnswer && isCorrect ? 'correct' : ''} ${showAnswer && isSelected && !isCorrect ? 'incorrect' : ''}`}
          >
            <input
              type="radio"
              name={`question-${processedQuestion.id}`}
              value={choiceValue}
              checked={isSelected}
              onChange={() => handleAnswerSelect(choiceValue)}
              disabled={showAnswer}
            />
            <span 
              className="choice-text" 
              dangerouslySetInnerHTML={{ __html: choice }} 
            />
            {showAnswer && isCorrect && <span className="correct-indicator">✓</span>}
            {showAnswer && isSelected && !isCorrect && <span className="incorrect-indicator">✗</span>}
          </label>
        );
      });
    }
  };

  return (
    <div ref={questionRef} className="question-container">
      <div className="question-header">
        <h3>Problem {questionIndex + 1}</h3>
        {mode === 'practice' && (
          <div className="question-status">
            {selectedAnswer ? 
              <span className="status-answered">Answered</span> : 
              <span className="status-unanswered">Not answered</span>
            }
          </div>
        )}
      </div>

      <div className="question-content">
        <div 
          className="question-text" 
          dangerouslySetInnerHTML={{ __html: processedQuestion.questionText }} 
        />
        
        <div className="choices-container">
          {renderChoices()}
        </div>

        {showAnswer && (
          <div className="answer-section">
            <p><strong>Correct Answer:</strong> {processedQuestion.answer}</p>
          </div>
        )}

        {showSolution && processedQuestion.solution && (
          <div className="solution-section">
            <h4>Solution:</h4>
            <div 
              className="solution-text" 
              dangerouslySetInnerHTML={{ __html: processedQuestion.solution }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionRenderer;
export { questionRenderer }; 