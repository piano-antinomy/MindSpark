/**
 * Question Renderer Module
 * Handles LaTeX rendering, question processing, and choice extraction
 * for mathematical content display across the application
 */

// Debug mode - set to true to enable detailed console logging
const QUESTION_RENDERER_DEBUG = true;

// Debug logging helper
function questionDebugLog(...args) {
    if (QUESTION_RENDERER_DEBUG) {
        console.log('[QuestionRenderer]', ...args);
    }
}

/**
 * Question Renderer Class
 * Provides consistent LaTeX rendering and question processing
 */
class QuestionRenderer {
    constructor() {
        this.mathJaxReady = false;
        this.initializeMathJax();
    }

    /**
     * Initialize MathJax if available
     */
    initializeMathJax() {
        if (typeof MathJax !== 'undefined') {
            this.mathJaxReady = true;
            questionDebugLog('MathJax initialized successfully');
        } else {
            questionDebugLog('MathJax not available');
        }
    }

    /**
     * Process question text by replacing insertion markers with actual content
     */
    processQuestionText(questionText, insertions) {
        if (!insertions) return questionText;
        
        let processedText = questionText;
        questionDebugLog('Processing question text with insertions:', insertions);
        
        // Replace insertion markers like <INSERTION_INDEX_1> with actual content
        Object.keys(insertions).forEach(key => {
            const insertion = insertions[key];
            const marker = `<${key}>`; // e.g., "<INSERTION_INDEX_1>"
            
            questionDebugLog(`Processing marker ${marker}:`, insertion);
            
            // Replace the marker with the appropriate content
            if (insertion.alt_type === 'latex' && insertion.alt_value) {
                // Use LaTeX content
                processedText = processedText.replace(marker, insertion.alt_value);
            } else if (insertion.picture) {
                // Use picture URL with proper protocol
                const imageUrl = this.processImageUrl(insertion.picture);
                const altText = insertion.alt_value || 'Question image';
                processedText = processedText.replace(marker, 
                    `<img src="${imageUrl}" alt="${altText}" class="question-image" />`);
            } else if (insertion.alt_value) {
                // Use alternative text value
                processedText = processedText.replace(marker, insertion.alt_value);
            }
        });
        
        questionDebugLog('Processed text result:', processedText);
        return processedText;
    }

    /**
     * Process image URL to ensure proper protocol
     */
    processImageUrl(url) {
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        return url;
    }

    /**
     * Render LaTeX content using MathJax
     */
    async renderLatexContent(element) {
        if (!this.mathJaxReady || typeof MathJax === 'undefined') {
            questionDebugLog('MathJax not available for rendering');
            return Promise.resolve();
        }

        try {
            questionDebugLog('Rendering LaTeX content in element:', element);
            await MathJax.typesetPromise([element]);
            questionDebugLog('LaTeX rendering completed successfully');
        } catch (error) {
            console.warn('MathJax rendering error:', error);
        }
    }

    /**
     * Extract choices from question object (text_choices, latex_choices, or picture_choices)
     */
    extractQuestionChoices(questionDetails) {
        questionDebugLog('Extracting choices from question details:', questionDetails);
        
        // Priority: text_choices > latex_choices > picture_choices
        if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
            return { choices: questionDetails.text_choices, hasLabels: false };
        } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
            return this.parseLatexChoices(questionDetails.latex_choices);
        } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
            const imageChoices = questionDetails.picture_choices.map(url => {
                const imageUrl = this.processImageUrl(url);
                return `<img src="${imageUrl}" alt="Choice" class="choice-image" />`;
            });
            return { choices: imageChoices, hasLabels: false };
        }
        
        return { choices: [], hasLabels: false };
    }

    /**
     * Parse LaTeX choices that might be in a single string or multiple strings
     */
    parseLatexChoices(latexChoices) {
        questionDebugLog('Parsing LaTeX choices:', latexChoices);
        
        if (latexChoices.length === 1) {
            // Single string containing all choices - need to split
            const choiceString = latexChoices[0];
            questionDebugLog('Single choice string to parse:', choiceString);
            
            // Check if it contains multiple choice labels like (A), (B), etc.
            const textbfMatches = choiceString.match(/\\textbf\{[^}]*\([A-E]\)[^}]*\}/g);
            questionDebugLog('Found textbf matches:', textbfMatches);
            
            if (textbfMatches && textbfMatches.length > 1) {
                return this.splitByQquad(choiceString);
            }
            
            // Alternative approach: try splitting by the pattern (A), (B), etc.
            const labelPattern = /\\textbf\{.*?\([A-E]\).*?\}/g;
            const labelMatches = choiceString.match(labelPattern);
            
            if (labelMatches && labelMatches.length > 1) {
                questionDebugLog('Using label pattern approach:', labelMatches);
                const choices = labelMatches.map(match => `$${match.replace(/\\qquad.*$/, '')}$`);
                return { choices, hasLabels: true };
            }
            
            // Third approach: manually split common AMC format
            if (choiceString.includes('\\qquad') && choiceString.includes('textbf')) {
                return this.manualAmcSplit(choiceString);
            }
            
            // If splitting failed, return as single choice
            questionDebugLog('Splitting failed, returning single choice');
            return { choices: [choiceString], hasLabels: true };
        } else {
            // Multiple strings - assume each is a separate choice
            const hasLabels = latexChoices.some(choice => 
                choice.includes('textbf') && choice.match(/\([A-E]\)/));
            return { choices: latexChoices, hasLabels };
        }
    }

    /**
     * Split LaTeX choices by \\qquad separators
     */
    splitByQquad(choiceString) {
        questionDebugLog('Splitting by qquad approach');
        
        // More robust splitting approach
        let workingString = choiceString;
        
        // Remove outer $ delimiters if present
        workingString = workingString.replace(/^\$/, '').replace(/\$$/, '');
        
        // Split by \\qquad but keep the textbf parts
        const parts = workingString.split(/\\qquad/);
        questionDebugLog('Split parts:', parts);
        
        const choices = [];
        for (let part of parts) {
            part = part.trim();
            if (part && part.includes('textbf')) {
                // Wrap each part in $ delimiters for proper LaTeX rendering
                choices.push(`$${part}$`);
            }
        }
        
        questionDebugLog('Extracted choices by qquad:', choices);
        
        if (choices.length > 1) {
            return { choices, hasLabels: true };
        }
        
        return { choices: [], hasLabels: false };
    }

    /**
     * Manual AMC format splitting
     */
    manualAmcSplit(choiceString) {
        questionDebugLog('Using manual AMC format splitting');
        
        // Remove outer $ delimiters
        let content = choiceString.replace(/^\$/, '').replace(/\$$/, '');
        
        // Split by textbf but keep the textbf part with the following content
        const choices = [];
        const regex = /(\\textbf\{[^}]*\([A-E]\)[^}]*\}[^\\]*)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            let choice = match[1].trim();
            // Remove any trailing \\qquad
            choice = choice.replace(/\\qquad\s*$/, '');
            choices.push(`$${choice}$`);
        }
        
        questionDebugLog('Manual splitting result:', choices);
        
        if (choices.length > 1) {
            return { choices, hasLabels: true };
        }
        
        return { choices: [], hasLabels: false };
    }

    /**
     * Process a complete question object and return formatted data
     */
    processQuestion(question, questionIndex = 0) {
        questionDebugLog('Processing complete question:', question);
        
        let questionText, choices, hasLabels = false;
        
        if (typeof question.question === 'string') {
            // Old format - just text and choices array
            questionText = question.question;
            choices = question.choices || [];
            hasLabels = false;
        } else {
            // New format - complex object with insertions
            const questionDetails = question.question;
            questionText = this.processQuestionText(questionDetails.text, questionDetails.insertions);
            const choiceResult = this.extractQuestionChoices(questionDetails);
            choices = choiceResult.choices;
            hasLabels = choiceResult.hasLabels;
            
            // If no choices extracted from new format, fall back to simple choices array
            if (choices.length === 0 && question.choices) {
                choices = question.choices;
                hasLabels = false;
            }
        }
        
        return {
            id: question.id || `question_${questionIndex}`,
            questionText,
            choices,
            hasLabels,
            answer: question.answer,
            solution: question.solution,
            originalQuestion: question
        };
    }

    /**
     * Render question HTML with proper choice formatting
     */
    renderQuestionHTML(questionData, questionIndex, options = {}) {
        const {
            showAnswerInputs = true,
            inputNamePrefix = 'question',
            selectedAnswer = null,
            cssClasses = {}
        } = options;

        const questionText = questionData.questionText || 'Question text not available';
        const choices = questionData.choices || [];
        const hasLabels = questionData.hasLabels || false;

        // Generate choices HTML
        const choicesHTML = choices.map((choice, choiceIndex) => {
            const choiceValue = String.fromCharCode(65 + choiceIndex);
            const isChecked = selectedAnswer === choiceValue;
            
            // Don't add letter prefix if choice already has labels
            const choiceDisplay = hasLabels ? choice : `${choiceValue}. ${choice}`;
            
            if (showAnswerInputs) {
                return `
                    <label class="choice-label ${isChecked ? 'selected' : ''} ${cssClasses.choiceLabel || ''}">
                        <input type="radio" name="${inputNamePrefix}_${questionIndex}" value="${choiceValue}" 
                               data-question-index="${questionIndex}"
                               ${isChecked ? 'checked' : ''}>
                        <span class="choice-content">${choiceDisplay}</span>
                    </label>
                `;
            } else {
                return `
                    <div class="choice-display ${cssClasses.choiceDisplay || ''}">
                        <span class="choice-content">${choiceDisplay}</span>
                    </div>
                `;
            }
        }).join('');

        return `
            <div class="question-card ${cssClasses.questionCard || ''}" data-question-index="${questionIndex}">
                <div class="question-header ${cssClasses.questionHeader || ''}">
                    <h3>Problem ${questionIndex + 1}</h3>
                    <div class="question-status" id="status_${questionIndex}"></div>
                </div>
                <div class="question-content ${cssClasses.questionContent || ''}">
                    <div class="question-text">${questionText}</div>
                </div>
                <div class="answer-section ${cssClasses.answerSection || ''}">
                    <div class="answer-choices">
                        ${choicesHTML}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render multiple questions at once
     */
    async renderMultipleQuestions(questions, containerElement, options = {}) {
        const processedQuestions = questions.map((question, index) => 
            this.processQuestion(question, index)
        );

        const questionsHTML = processedQuestions.map((questionData, index) => 
            this.renderQuestionHTML(questionData, index, options)
        ).join('');

        containerElement.innerHTML = questionsHTML;

        // Render LaTeX content
        await this.renderLatexContent(containerElement);

        return processedQuestions;
    }

    /**
     * Add event listeners for radio button changes
     */
    addChoiceEventListeners(containerElement, onAnswerChange) {
        containerElement.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const questionIndex = parseInt(this.dataset.questionIndex);
                const answerValue = this.value;
                
                // Update selection styling for this question
                const questionCard = this.closest('.question-card');
                questionCard.querySelectorAll('.choice-label').forEach(label => {
                    label.classList.remove('selected');
                });
                this.closest('.choice-label').classList.add('selected');
                
                // Call callback function
                if (onAnswerChange) {
                    onAnswerChange(questionIndex, answerValue, this);
                }
            });
        });
    }
}

// Create global instance
const questionRenderer = new QuestionRenderer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionRenderer;
} 