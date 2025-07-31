// Question Parser utility - handles parsing complex question objects into simple text and choices
class QuestionParser {
  constructor() {
    this.mathJaxReady = false;
    this.initializeMathJax();
    
    // Centralized list of label patterns for AMC questions
    this.labelPatterns = ['textbf', 'mathrm', 'text'];
  }

  initializeMathJax() {
    if (typeof window.MathJax !== 'undefined') {
      this.mathJaxReady = true;
      console.log('[QuestionParser] MathJax initialized successfully');
    } else {
      console.log('[QuestionParser] MathJax not available');
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
        const width = insertion.width || '';
        const height = insertion.height || '';
        const style = width && height ? `style="width: ${width}px; height: ${height}px;"` : '';
        processedText = processedText.replace(marker, 
          `<img src="${imageUrl}" alt="${altText}" class="question-image" ${style} />`);
      } else if (insertion.alt_type === 'latex' && insertion.alt_value) {
        // Use LaTeX content (preprocess it first)
        const preprocessedLatex = this.preprocessLatexText(insertion.alt_value);
        processedText = processedText.replace(marker, preprocessedLatex);
      } else if (insertion.picture) {
        // Fallback: Use picture URL with proper protocol (legacy support)
        const imageUrl = this.processImageUrl(insertion.picture);
        const altText = insertion.alt_value || 'Question image';
        const width = insertion.width || '';
        const height = insertion.height || '';
        const style = width && height ? `style="width: ${width}px; height: ${height}px;"` : '';
        processedText = processedText.replace(marker, 
          `<img src="${imageUrl}" alt="${altText}" class="question-image" ${style} />`);
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
    
    return processedText;
  }

  extractQuestionChoices(questionDetails) {
    // Priority: text_choices > latex_choices > picture_choices
    if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
      // Escape dollar signs in text choices to prevent MathJax processing
      const escapedTextChoices = questionDetails.text_choices.map(choice => 
        choice.replace(/\$/g, '\\$')
      );
      return { choices: escapedTextChoices, hasLabels: false, isImageChoice: false, isTextChoice: true };
    } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
      const result = this.parseLatexChoices(questionDetails.latex_choices);
      return { ...result, isImageChoice: false, isTextChoice: false };
    } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
      const imageChoices = questionDetails.picture_choices.map(choice => {
        // Handle both old format (string) and new format (object with uri, width, height)
        if (typeof choice === 'string') {
          // Convert old format to new format
          return {
            uri: this.processImageUrl(choice),
            width: '',
            height: ''
          };
        } else {
          // New format - return the object with processed URL
          return {
            uri: this.processImageUrl(choice.uri),
            width: choice.width || '',
            height: choice.height || ''
          };
        }
      });
      return { choices: imageChoices, hasLabels: false, isImageChoice: true, isTextChoice: false };
    }
    
    // If no choices found in any format, provide dummy choices
    return { 
      choices: ['A', 'B', 'C', 'D', 'E'], 
      hasLabels: false, 
      isImageChoice: false, 
      isDummyChoices: true,
      isTextChoice: false
    };
  }

  parseLatexChoices(latexChoices) {
    // Preprocess all LaTeX choices first
    const preprocessedChoices = latexChoices.map(choice => this.preprocessLatexText(choice));
    
    if (preprocessedChoices.length === 1) {
      // Single string containing all choices - need to split
      const choiceString = preprocessedChoices[0];
      
      // Check if it contains multiple choice labels like (A), (B), etc.
      // Support multiple label patterns from centralized list
      let foundMatches = false;
      let matchedPattern = null;
      
      for (const pattern of this.labelPatterns) {
        const regex = new RegExp(`\\\\${pattern}\\s?\\{[^}]*\\([A-E]\\)[^}]*\\}`, 'g');
        const matches = choiceString.match(regex);
        
        if (matches && matches.length > 1) {
          foundMatches = true;
          matchedPattern = pattern;
          break;
        }
      }
      
      if (foundMatches && matchedPattern) {
        return this.splitByQquad(choiceString, matchedPattern);
      }
      
      // Alternative approach: try splitting by the pattern (A), (B), etc.
      for (const pattern of this.labelPatterns) {
        const labelPattern = new RegExp(`\\\\${pattern}\\s?\\{.*?\\([A-E]\\).*?\\}`, 'g');
        const labelMatches = choiceString.match(labelPattern);
        
        if (labelMatches && labelMatches.length > 1) {
          const choices = labelMatches.map(match => `$${match.replace(/\\qquad.*$/, '')}$`);
          return { choices, hasLabels: true };
        }
      }
      
      // Manual AMC format splitting
      const hasAnyLabelPattern = this.labelPatterns.some(pattern => choiceString.includes(pattern));
      if (choiceString.includes('\\qquad') && hasAnyLabelPattern) {
        return this.manualAmcSplit(choiceString);
      }
      
      return { choices: [choiceString], hasLabels: true };
    } else {
      // Multiple strings - assume each is a separate choice
      const hasLabels = preprocessedChoices.some(choice => 
        this.labelPatterns.some(pattern => choice.includes(pattern)) && choice.match(/\([A-E]\)/));
      return { choices: preprocessedChoices, hasLabels };
    }
  }

  splitByQquad(choiceString, labelType = 'textbf') {
    
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
    } else if (hasQuad) {
      // Count the number of \quad occurrences
      const quadCount = (workingString.match(/\\quad/g) || []).length;
      
      // If we have exactly 4 \quad separators (which would create 5 choices), use \quad
      if (quadCount === 4) {
        parts = workingString.split(/\\quad/);
      } else {
        // Fall back to \qquad if we don't have exactly 4 \quad
        parts = workingString.split(/\\qquad/);
      }
    } else {
      // No \qquad or \quad found, try \\ as separator
      const hasDoubleBackslash = workingString.includes('\\\\');
      if (hasDoubleBackslash) {
        parts = workingString.split(/\\\\/);
      } else {
        // No separators found, try \qquad as fallback
        parts = workingString.split(/\\qquad/);
      }
    }
    
    const choices = [];
    for (let part of parts) {
      part = part.trim();
      if (part && part.includes(labelType)) {
        // Wrap each part in $ delimiters for proper LaTeX rendering
        choices.push(`$${part}$`);
      }
    }
  
    
    if (choices.length > 1) {
      return { choices, hasLabels: true };
    }
    
    return { choices: [], hasLabels: false };
  }

  manualAmcSplit(choiceString) {
    
    // Remove outer $ delimiters
    let content = choiceString.replace(/^\$/, '').replace(/\$$/, '');
    
    // Split by any label pattern but keep the label part with the following content
    const choices = [];
    let foundMatches = false;
    
    // Try each pattern in order
    for (const pattern of this.labelPatterns) {
      if (foundMatches) break;
      
      // Allow optional single space between pattern and opening brace
      const regex = new RegExp(`(\\\\${pattern}\\s?\\{[^}]*\\([A-E]\\)[^}]*\\}[^\\\\]*)`, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        let choice = match[1].trim();
        // Remove any trailing \\qquad or \\quad
        choice = choice.replace(/\\qquad\s*$/, '').replace(/\\quad\s*$/, '');
        choices.push(`$${choice}$`);
        foundMatches = true;
      }
    }
    
    
    if (choices.length > 1) {
      return { choices, hasLabels: true };
    }
    
    return { choices: [], hasLabels: false };
  }

  parseQuestion(question, questionIndex = 0) {
    // New format - complex object with insertions
    const questionDetails = question.question;
    const questionText = this.processQuestionText(questionDetails.text, questionDetails.insertions);
    const choiceResult = this.extractQuestionChoices(questionDetails);
    
    const result = {
      id: question.id || `question_${questionIndex}`,
      questionText,
      choices: choiceResult.choices,
      hasLabels: choiceResult.hasLabels,
      isImageChoice: choiceResult.isImageChoice || false,
      isDummyChoices: choiceResult.isDummyChoices || false,
      isTextChoice: choiceResult.isTextChoice || false,
      choiceSpace: questionDetails.choice_space || null, // Extract choice_space field
      answer: question.answer,
      solution: question.solution,
      originalQuestion: question
    };
    
    return result;
  }
}

// Create and export global instance
const questionParser = new QuestionParser();

export default QuestionParser;
export { questionParser }; 