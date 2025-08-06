class SolutionParser {
  constructor() {
    // Initialize any parser state if needed
  }

  /**
   * Remove author signatures from solution text
   * @param {string} text - Solution text
   * @returns {string} - Text with author signatures removed
   */
  removeAuthorSignatures(text) {
    if (!text) {
      return '';
    }

    let cleanedText = text;

    // Find the last <p> tag and remove author signatures only from it
    const lastPTagRegex = /<p[^>]*>([^<]*(?:<[^p][^>]*>[^<]*)*[^<]*)<\/p>\s*$/;
    const match = cleanedText.match(lastPTagRegex);
    
    if (match) {
      const lastPTagContent = match[1];
      let cleanedPTagContent = lastPTagContent;
      
      // Remove author signatures that appear at the end (e.g., "~cxsmi")
      cleanedPTagContent = cleanedPTagContent.replace(/~[a-zA-Z0-9_]+\s*$/, '');
      
      // Remove entire content if it starts with ~ (author signature only)
      if (cleanedPTagContent.trim().match(/^\s*~[a-zA-Z0-9_]*\s*$/)) {
        // If the entire <p> tag only contains an author signature, remove the whole tag
        cleanedText = cleanedText.replace(lastPTagRegex, '');
      } else {
        // Replace the content of the last <p> tag with cleaned content
        const originalPTag = match[0];
        const newPTag = originalPTag.replace(lastPTagContent, cleanedPTagContent);
        cleanedText = cleanedText.replace(originalPTag, newPTag);
      }
    }

    // Clean up any trailing whitespace and line breaks
    cleanedText = cleanedText.trim();

    return cleanedText;
  }

  /**
   * Process solution text with insertions and LaTeX preprocessing
   * @param {string} solutionText - Raw solution text
   * @param {Object} insertions - Insertions object from the question
   * @returns {string} - Processed solution text
   */
  processSolutionText(solutionText, insertions = {}) {
    if (!solutionText) {
      return '';
    }

    // Ensure solutionText is a string
    let processedText = String(solutionText);

    // Process insertions first (like QuestionParser does)
    if (insertions && Object.keys(insertions).length > 0) {
      processedText = this.processInsertions(processedText, insertions);
    }

    // Preprocess LaTeX for better rendering
    processedText = this.preprocessLatex(processedText);

    // Remove author signatures last
    processedText = this.removeAuthorSignatures(processedText);

    return processedText;
  }

  /**
   * Process insertions in solution text
   * @param {string} text - Text containing insertion markers
   * @param {Object} insertions - Insertions object
   * @returns {string} - Text with insertions replaced
   */
  processInsertions(text, insertions) {
    // Ensure text is a string
    let processedText = String(text || '');
    
    console.log('SolutionParser - Original text:', processedText);
    console.log('SolutionParser - Insertions object:', insertions);

    // Replace insertion markers with their values
    Object.keys(insertions).forEach(key => {
      const insertion = insertions[key];
      
      // Handle different key formats: "1" or "INSERTION_INDEX_1"
      let marker;
      if (key.startsWith('INSERTION_INDEX_')) {
        // Key already has the prefix, use it directly
        marker = `<${key}>`;
      } else {
        // Key is just a number, add the prefix
        marker = `<INSERTION_INDEX_${key}>`;
      }
      
      console.log(`SolutionParser - Looking for marker: ${marker}`);
      console.log(`SolutionParser - Insertion data:`, insertion);
      
      // Check if marker exists in text (case-insensitive)
      const markerRegex = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = processedText.match(markerRegex);
      
      if (matches && matches.length > 0) {
        console.log(`SolutionParser - Found ${matches.length} matches for marker: ${marker}`);
        let replacement = '';
        
        if (insertion.alt_type === 'latex' && insertion.alt_value) {
          replacement = insertion.alt_value;
          console.log(`SolutionParser - Using LaTeX replacement: ${replacement}`);
        } else if (insertion.alt_type === 'image' && insertion.alt_value) {
          replacement = `<img src="${insertion.alt_value}" alt="Solution image" class="solution-image" />`;
          console.log(`SolutionParser - Using image replacement: ${replacement}`);
        } else if (insertion.alt_type === 'text' && insertion.alt_value) {
          replacement = insertion.alt_value;
          console.log(`SolutionParser - Using text replacement: ${replacement}`);
        } else if (insertion.uri) {
          // Fallback to image if uri is available
          replacement = `<img src="${insertion.uri}" alt="Solution image" class="solution-image" />`;
          console.log(`SolutionParser - Using URI fallback: ${replacement}`);
        } else {
          console.log(`SolutionParser - No valid replacement found for insertion:`, insertion);
        }
        
        if (replacement) {
          // Use case-insensitive regex to replace all variations
          const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedMarker, 'gi');
          processedText = processedText.replace(regex, replacement);
          console.log(`SolutionParser - Replaced ${marker} with: ${replacement}`);
        }
      } else {
        console.log(`SolutionParser - Marker not found: ${marker}`);
        // Also check for lowercase version
        const lowercaseMarker = marker.toLowerCase();
        if (processedText.includes(lowercaseMarker)) {
          console.log(`SolutionParser - Found lowercase marker: ${lowercaseMarker}`);
          // Process the lowercase marker as well
          let replacement = '';
          if (insertion.alt_type === 'latex' && insertion.alt_value) {
            replacement = insertion.alt_value;
          } else if (insertion.alt_type === 'image' && insertion.alt_value) {
            replacement = `<img src="${insertion.alt_value}" alt="Solution image" class="solution-image" />`;
          } else if (insertion.alt_type === 'text' && insertion.alt_value) {
            replacement = insertion.alt_value;
          } else if (insertion.uri) {
            replacement = `<img src="${insertion.uri}" alt="Solution image" class="solution-image" />`;
          }
          
          if (replacement) {
            const escapedLowercaseMarker = lowercaseMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedLowercaseMarker, 'gi');
            processedText = processedText.replace(regex, replacement);
            console.log(`SolutionParser - Replaced lowercase ${lowercaseMarker} with: ${replacement}`);
          }
        }
      }
    });

    console.log('SolutionParser - Final processed text:', processedText);
    return processedText;
  }

  /**
   * Preprocess LaTeX for better MathJax rendering
   * @param {string} text - Text containing LaTeX
   * @returns {string} - Text with preprocessed LaTeX
   */
  preprocessLatex(text) {
    // Ensure text is a string
    let processedText = String(text || '');

    // Handle common LaTeX patterns that might need preprocessing
    // This can be expanded based on specific needs

    // Ensure proper spacing around LaTeX delimiters
    processedText = processedText.replace(/([^\\])\$/g, '$1 $');
    processedText = processedText.replace(/\$([^\\])/g, '$ $1');

    // Handle any specific LaTeX preprocessing needed for solutions
    // For example, ensuring proper line breaks in alignments
    
    return processedText;
  }

  /**
   * Parse a complete solution object
   * @param {Object} solution - Solution object from the API
   * @param {Object} questionInsertions - Insertions from the question
   * @returns {Object} - Parsed solution object
   */
  parseSolution(solution, questionInsertions = {}) {
    if (!solution) {
      return null;
    }

    // Handle different solution formats
    if (typeof solution === 'string') {
      return {
        text: this.processSolutionText(solution, questionInsertions),
        type: 'text'
      };
    }

    if (typeof solution === 'object') {
      return {
        text: this.processSolutionText(solution.text || solution.content || '', questionInsertions),
        type: solution.type || 'text',
        metadata: solution.metadata || {}
      };
    }

    return null;
  }

  /**
   * Parse multiple solutions
   * @param {Array} solutions - Array of solution objects
   * @param {Object} questionInsertions - Insertions from the question
   * @returns {Array} - Array of parsed solution objects
   */
  parseSolutions(solutions, questionInsertions = {}) {
    if (!Array.isArray(solutions)) {
      return [];
    }

    return solutions.map(solution => this.parseSolution(solution, questionInsertions));
  }

  /**
   * Extract solution metadata (author, method, etc.)
   * @param {string} solutionText - Solution text
   * @returns {Object} - Metadata object
   */
  extractSolutionMetadata(solutionText) {
    const metadata = {
      author: null,
      method: null,
      complexity: null
    };

    // Extract author if present (e.g., "~Technodoggo")
    const authorMatch = solutionText.match(/~([A-Za-z0-9_]+)/);
    if (authorMatch) {
      metadata.author = authorMatch[1];
    }

    // Extract method hints from common patterns
    if (solutionText.toLowerCase().includes('algebraic')) {
      metadata.method = 'algebraic';
    } else if (solutionText.toLowerCase().includes('geometric')) {
      metadata.method = 'geometric';
    } else if (solutionText.toLowerCase().includes('combinatorial')) {
      metadata.method = 'combinatorial';
    }

    return metadata;
  }

  /**
   * Clean solution text by removing unnecessary formatting
   * @param {string} text - Raw solution text
   * @returns {string} - Cleaned solution text
   */
  cleanSolutionText(text) {
    if (!text) {
      return '';
    }

    let cleanedText = text;

    // Remove excessive whitespace
    cleanedText = cleanedText.replace(/\s+/g, ' ');

    // Remove trailing/leading whitespace
    cleanedText = cleanedText.trim();

    // Handle any other cleaning needed for solutions
    // This can be expanded based on specific formatting issues

    return cleanedText;
  }
}

// Create and export a singleton instance
const solutionParser = new SolutionParser();
export default solutionParser; 