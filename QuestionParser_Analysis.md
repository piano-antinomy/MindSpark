# QuestionParser.js Analysis

## Core Purpose
Transforms complex question objects from JSON into simple text and choices for frontend rendering.

## Class Structure
```javascript
class QuestionParser {
  constructor() {
    this.mathJaxReady = false;
    this.labelPatterns = ['textbf', 'mathrm', 'text']; // AMC label patterns
  }
}
```

## Main Processing Flow
```javascript
parseQuestion(question, questionIndex) {
  const questionDetails = question.question;
  const questionText = processQuestionText(questionDetails.text, questionDetails.insertions);
  const choiceResult = extractQuestionChoices(questionDetails);
  
  return {
    id: question.id || `question_${questionIndex}`,
    questionText,
    choices: choiceResult.choices,
    hasLabels: choiceResult.hasLabels,
    isImageChoice: choiceResult.isImageChoice,
    isDummyChoices: choiceResult.isDummyChoices,
    isTextChoice: choiceResult.isTextChoice,
    answer: question.answer,
    solution: question.solution,
    originalQuestion: question
  };
}
```

## Question Text Processing

### Insertion Replacement
```javascript
processQuestionText(questionText, insertions) {
  // Replace <INSERTION_INDEX_N> markers with content
  Object.keys(insertions).forEach(key => {
    const insertion = insertions[key];
    const marker = `<${key}>`;
    
    if (insertion.alt_type === 'image' && insertion.picture) {
      // Image insertion
      processedText = processedText.replace(marker, `<img src="${imageUrl}" />`);
    } else if (insertion.alt_type === 'latex' && insertion.alt_value) {
      // LaTeX insertion
      processedText = processedText.replace(marker, preprocessLatexText(insertion.alt_value));
    } else if (insertion.picture) {
      // Fallback image
      processedText = processedText.replace(marker, `<img src="${imageUrl}" />`);
    } else if (insertion.alt_value) {
      // Text insertion
      processedText = processedText.replace(marker, insertion.alt_value);
    }
  });
}
```

### LaTeX Preprocessing
```javascript
preprocessLatexText(text) {
  // Replace unsupported commands with MathJax-compatible ones
  text = text.replace(/\\textsc\{([^}]*)\}/g, '\\text{$1}');
  text = text.replace(/\\emph\{([^}]*)\}/g, '\\textit{$1}');
  text = text.replace(/\\overarc\{([^}]*)\}/g, '\\overparen{$1}');
  text = text.replace(/\\textdollar/g, '\\text{\\$}');
  text = text.replace(/\\begin\{tabular\}/g, '\\begin{array}');
  text = text.replace(/\\end\{tabular\}/g, '\\end{array}');
  return text;
}
```

## Choice Extraction Logic

### Priority Order
1. **text_choices** (plain text, escape $ signs)
2. **latex_choices** (LaTeX with parsing)
3. **picture_choices** (images)
4. **dummy_choices** (A, B, C, D, E fallback)

### LaTeX Choice Parsing
```javascript
parseLatexChoices(latexChoices) {
  if (latexChoices.length === 1) {
    // Single string - need to split by choice labels
    const choiceString = preprocessLatexText(latexChoices[0]);
    
    // Check for label patterns: \textbf{(A)}, \mathrm{(B)}, etc.
    for (const pattern of this.labelPatterns) {
      const regex = new RegExp(`\\\\${pattern}\\s?\\{[^}]*\\([A-E]\\)[^}]*\\}`, 'g');
      const matches = choiceString.match(regex);
      if (matches && matches.length > 1) {
        return splitByQquad(choiceString, pattern);
      }
    }
    
    // Manual AMC format splitting
    if (choiceString.includes('\\qquad')) {
      return manualAmcSplit(choiceString);
    }
  }
  
  // Multiple strings - each is a separate choice
  return { choices: preprocessedChoices, hasLabels };
}
```

### Choice Splitting Strategies
```javascript
splitByQquad(choiceString, labelType) {
  // Remove outer $ delimiters
  let workingString = choiceString.replace(/^\$/, '').replace(/\$$/, '');
  
  // Split by separators in order: \qquad > \quad > \\
  let parts;
  if (workingString.includes('\\qquad')) {
    parts = workingString.split(/\\qquad/);
  } else if (workingString.includes('\\quad')) {
    const quadCount = (workingString.match(/\\quad/g) || []).length;
    if (quadCount === 4) {
      parts = workingString.split(/\\quad/);
    } else {
      parts = workingString.split(/\\qquad/);
    }
  } else if (workingString.includes('\\\\')) {
    parts = workingString.split(/\\\\/);
  }
  
  // Wrap each part in $ delimiters
  const choices = parts.map(part => `$${part.trim()}$`);
  return { choices, hasLabels: true };
}
```

## Image Processing
```javascript
processImageUrl(url) {
  // Convert protocol-relative URLs to absolute
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}

// Picture choice handling
if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
  const imageChoices = questionDetails.picture_choices.map(choice => {
    if (typeof choice === 'string') {
      // Old format - convert to object
      return { uri: processImageUrl(choice), width: '', height: '' };
    } else {
      // New format - return object with processed URL
      return { uri: processImageUrl(choice.uri), width: choice.width, height: choice.height };
    }
  });
  return { choices: imageChoices, isImageChoice: true };
}
```

## Output Format
```javascript
{
  id: "amc_2003_10a_1",
  questionText: "<p>Processed question with insertions...</p>",
  choices: ["$\\mathrm{(A) \\ } 0$", "$\\mathrm{(B) \\ } 1$", ...],
  hasLabels: true,
  isImageChoice: false,
  isDummyChoices: false,
  isTextChoice: false,
  choiceSpace: 0.4, // Dynamic layout allocation (null if not specified)
  answer: "D",
  solution: "Solution text...",
  originalQuestion: question // Full original object
}
```

## Critical Edge Cases

### 1. Missing Choices
```javascript
// Fallback to dummy choices A, B, C, D, E
return { 
  choices: ['A', 'B', 'C', 'D', 'E'], 
  isDummyChoices: true 
};
```

### 2. LaTeX Command Compatibility
- Converts unsupported commands to MathJax-compatible ones
- Handles protocol-relative image URLs
- Processes insertion markers in both question and solution text

### 3. Choice Format Variations
- Single string with multiple choices (need splitting)
- Multiple strings (each is a choice)
- Image choices (old string vs new object format)
- Text choices (escape $ signs to prevent MathJax processing)

### 4. Label Pattern Matching
- Supports multiple AMC label patterns: `\textbf`, `\mathrm`, `\text`
- Handles optional spaces between pattern and opening brace
- Extracts choice labels like `(A)`, `(B)`, etc.

## Integration Points
- **Input**: Complex JSON question objects from backend
- **Output**: Simplified objects for frontend rendering
- **MathJax**: Preprocesses LaTeX for compatibility
- **Images**: Handles both old and new image choice formats 