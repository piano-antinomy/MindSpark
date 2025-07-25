import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Question Renderer functionality (adapted from question-renderer.js)
class QuestionRenderer {
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
const questionRenderer = new QuestionRenderer();

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
      <div key={question.id} className="question-card" data-question-index={index}>
        <div className="question-header">
          <h3>Problem {index + 1}</h3>
          <div id={`status_${index}`} className="question-status">
            {currentAnswers[question.id] ? 
              <span className="status-answered">Answered</span> : 
              <span className="status-unanswered">Not answered</span>
            }
          </div>
        </div>

        <div className="question-content">
          <div 
            className="question-text" 
            dangerouslySetInnerHTML={{ __html: question.questionText }} 
          />
          
          <div className="choices-container">
            {question.isImageChoice ? (
              // Handle image choices
              <div className="image-choice-container">
                <div className="question-image-container">
                  <div dangerouslySetInnerHTML={{ __html: question.choices[0] }} />
                </div>
                <div className="image-choice-letters">
                  {['A', 'B', 'C', 'D', 'E'].map((letter, letterIndex) => (
                    <label 
                      key={letterIndex} 
                      className={`choice-label ${currentAnswers[question.id] === letter ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={letter}
                        checked={currentAnswers[question.id] === letter}
                        onChange={() => selectAnswer(question.id, letter)}
                      />
                      <span className="choice-text">{letter}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              // Handle regular choices
              question.choices.map((choice, choiceIndex) => {
                const choiceValue = String.fromCharCode(65 + choiceIndex);
                return (
                  <label 
                    key={choiceIndex} 
                    className={`choice-label ${currentAnswers[question.id] === choiceValue ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={choiceValue}
                      checked={currentAnswers[question.id] === choiceValue}
                      onChange={() => selectAnswer(question.id, choiceValue)}
                    />
                    <span 
                      className="choice-text" 
                      dangerouslySetInnerHTML={{ __html: choice }} 
                    />
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
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