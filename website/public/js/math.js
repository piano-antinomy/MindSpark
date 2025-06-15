// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Debug mode - set to true to enable detailed console logging
const DEBUG_MODE = true;

// Debug logging helper
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// Global variables
let availableLevels = [];
let currentLevel = null;
let currentQuestions = [];
let currentAnswers = [];
let currentQuestionIndex = 0;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    initializeMathPage();
});

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

function initializeMathPage() {
    debugLog('Initializing Math Page with Java Backend');
    hideAllSections();
    initializeLevelSelection();
}

// =============================================================================
// LEVEL SELECTION AND QUESTION LOADING
// =============================================================================

/**
 * Load available math levels from Java backend
 */
async function loadAvailableLevels() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableLevels = data.levels;
                return data.levels;
            }
        }
        throw new Error('Failed to load available levels');
            } catch (error) {
        console.error('Error loading available levels:', error);
        showError('Failed to connect to the backend. Please make sure the Java backend server is running on port 4072.');
        return [];
    }
}

/**
 * Load questions for a specific level from Java backend
 */
async function loadQuestionsByLevel(level) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                debugLog('Raw questions data from backend:', data.questions);
                debugLog('First question insertions:', data.questions[0]?.question?.insertions);
                return data.questions;
            }
        }
        throw new Error(`Failed to load questions for level ${level}`);
    } catch (error) {
        console.error('Error loading questions:', error);
        showError(`Failed to load questions for level ${level}. Please check your connection.`);
        return [];
    }
}

/**
 * Initialize level selection interface
 */
async function initializeLevelSelection() {
    const levels = await loadAvailableLevels();
    
    if (levels.length === 0) {
        showError('No math levels available. Please ensure the Java backend is running.');
        return;
    }

    // Show level selection interface
    const levelSelectionHTML = `
        <div class="level-selection-container">
            <h2>Select Your Math Level</h2>
            <p>Choose a difficulty level to start practicing math questions.</p>
            <div class="levels-grid">
                ${levels.map(level => `
                    <button class="level-button" onclick="selectLevel(${level})">
                        <h3>Level ${level}</h3>
                        <p>Click to start</p>
                    </button>
                `).join('')}
            </div>
            <div class="info-section">
                <p><strong>Note:</strong> This simplified version shows questions by level. Assessment, topics, and lessons are not yet implemented in the Java backend.</p>
            </div>
        </div>
    `;
    
    document.body.innerHTML = `
        <div class="container">
            <header class="math-header">
                <h1>Mathematics Practice</h1>
                <nav class="math-nav">
                    <a href="dashboard.html">← Back to Dashboard</a>
                    <a href="subjects.html">All Subjects</a>
                </nav>
            </header>
            <main class="math-main">
                ${levelSelectionHTML}
            </main>
        </div>
    `;
}

/**
 * Select a level and load questions
 */
async function selectLevel(level) {
    currentLevel = level;
    const questions = await loadQuestionsByLevel(level);
    
    if (questions.length === 0) {
        showError(`No questions available for level ${level}`);
        return;
    }
    
    // Store questions for practice mode
    currentQuestions = questions;
    currentAnswers = new Array(questions.length).fill(null);
    currentQuestionIndex = 0;
    
    // Show questions interface
    displayQuestionsInterface();
}

/**
 * Display questions interface
 */
function displayQuestionsInterface() {
    if (currentQuestions.length === 0) return;
    
    const questionsHTML = `
        <div class="questions-container">
            <header class="questions-header">
                <h2>Mathematics Level ${currentLevel}</h2>
                <div class="progress-info">
                    Question <span id="currentQuestionNum">${currentQuestionIndex + 1}</span> of ${currentQuestions.length}
                </div>
                <button onclick="initializeLevelSelection()" class="btn btn-secondary">← Back to Levels</button>
            </header>
            
            <div class="question-display" id="questionDisplay">
                <!-- Current question will be displayed here -->
            </div>
            
            <div class="navigation-controls">
                <button id="prevBtn" onclick="previousQuestion()" class="btn btn-secondary" style="display: none;">Previous</button>
                <button id="nextBtn" onclick="nextQuestion()" class="btn btn-primary" style="display: none;">Next</button>
                <button id="submitBtn" onclick="submitAnswers()" class="btn btn-success" style="display: none;">Submit All Answers</button>
            </div>
            
            <div class="question-grid">
                <h3>All Questions (${currentQuestions.length} total)</h3>
                <div class="question-grid-items">
                    ${currentQuestions.map((_, index) => `
                        <button class="question-nav-btn" onclick="jumpToQuestion(${index})" id="nav-btn-${index}">
                            ${index + 1}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.math-main').innerHTML = questionsHTML;
    
    // Display the first question
    displayCurrentQuestion();
    updateNavigationButtons();
}

/**
 * Display current question with proper formatting
 */
function displayCurrentQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) return;
    
    const question = currentQuestions[currentQuestionIndex];
    const questionDetails = question.question;
    
    // Process question text with insertions
    const processedText = processQuestionText(questionDetails.text, questionDetails.insertions);
    
    // Extract choices
    const choices = extractQuestionChoices(question);
    
    const questionHTML = `
        <div class="question-card">
            <div class="question-text">
                <h3>Question ${currentQuestionIndex + 1}</h3>
                <div class="question-body">${processedText}</div>
            </div>
            
            <div class="choices-container">
                <h4>Choose your answer:</h4>
                ${choices.map((choice, choiceIndex) => `
                    <button class="choice-button ${currentAnswers[currentQuestionIndex] === choiceIndex ? 'selected' : ''}" 
                            onclick="selectAnswer(${choiceIndex})"
                            data-choice-index="${choiceIndex}">
                        <span class="choice-label">${String.fromCharCode(65 + choiceIndex)}.</span>
                        <span class="choice-content">${choice}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('questionDisplay').innerHTML = questionHTML;
    
    // Render LaTeX if available
    renderLatexContent(document.getElementById('questionDisplay'));
    
    // Update question counter
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    
    // Update navigation buttons
    updateNavigationButtons();
}

/**
 * Process question text by replacing insertion markers with actual content
 */
function processQuestionText(questionText, insertions) {
    debugLog('processQuestionText called with:', {
        questionText: questionText,
        insertions: insertions,
        insertionsType: typeof insertions,
        insertionsKeys: insertions ? Object.keys(insertions) : 'null/undefined'
    });
    
    if (!insertions) return questionText;
    
    let processedText = questionText;
    
    // Replace insertion markers like [INSERTION_INDEX_1] with actual content
    Object.keys(insertions).forEach(key => {
        const insertion = insertions[key];
        const marker = key; // e.g., "INSERTION_INDEX_1"
        
        debugLog(`Processing insertion ${marker}:`, {
            alt_type: insertion.alt_type,
            alt_value: insertion.alt_value,
            picture: insertion.picture
        });
        
        if (insertion.alt_type === 'latex' && insertion.alt_value) {
            // Check if alt_value already has LaTeX delimiters
            let latexContent = insertion.alt_value;
            
            // Fix backslash escaping issues - replace tab characters back to \t
            latexContent = latexContent.replace(/\t/g, '\\t');
            // Also fix other common LaTeX commands that might be affected
            latexContent = latexContent.replace(/	imes/g, '\\times');
            latexContent = latexContent.replace(/	ext/g, '\\text');
            latexContent = latexContent.replace(/	frac/g, '\\frac');
            
            debugLog(`Original latex: ${insertion.alt_value}`);
            debugLog(`Fixed latex: ${latexContent}`);
            
            if (latexContent.startsWith('$') && latexContent.endsWith('$')) {
                // Already has $ delimiters, use as-is
                debugLog(`Using existing $ delimiters: ${latexContent}`);
                processedText = processedText.replace(`<${marker}>`, latexContent);
            } else if (latexContent.startsWith('\\(') && latexContent.endsWith('\\)')) {
                // Already has \\( \\) delimiters, use as-is
                debugLog(`Using existing \\\\( \\\\) delimiters: ${latexContent}`);
                processedText = processedText.replace(`<${marker}>`, latexContent);
            } else {
                // No delimiters, add \\( \\) for inline math
                debugLog(`Adding \\\\( \\\\) delimiters to: ${latexContent}`);
                processedText = processedText.replace(`<${marker}>`, `\\(${latexContent}\\)`);
            }
        } else if (insertion.picture) {
            // Use picture URL
            processedText = processedText.replace(`<${marker}>`, `<img src="${insertion.picture}" alt="${insertion.alt_value || 'Question image'}" class="question-image" />`);
        } else if (insertion.alt_value) {
            // Use alternative text value
            processedText = processedText.replace(`<${marker}>`, insertion.alt_value);
        }
        
        debugLog(`After processing ${marker}, text is now:`, processedText);
    });
    
    return processedText;
}

/**
 * Extract choices from question object
 */
function extractQuestionChoices(question) {
    const questionDetails = question.question;
    
    // Priority: text_choices > latex_choices > picture_choices
    if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
        return questionDetails.text_choices;
    } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
        // Parse LaTeX choices - they're often in format like:
        // "$\\textbf{(A)}\\ 0 \\qquad \\textbf{(B)}\\ 6 \\qquad ..."
        return parseLatexChoices(questionDetails.latex_choices[0]);
    } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
        return questionDetails.picture_choices.map(url => `<img src="${url}" alt="Choice" class="choice-image" />`);
    }
    
    return [];
}

/**
 * Parse LaTeX choice string into individual choices
 */
function parseLatexChoices(latexString) {
    debugLog('Parsing LaTeX choices:', latexString);
    
    // Remove outer $ delimiters if present
    let cleanString = latexString;
    if (cleanString.startsWith('$') && cleanString.endsWith('$')) {
        cleanString = cleanString.slice(1, -1);
    }
    
    debugLog('After removing $ delimiters:', cleanString);
    
    // Fix backslash escaping issues like we did for insertions
    cleanString = cleanString.replace(/	extbf/g, '\\textbf');
    cleanString = cleanString.replace(/	quad/g, '\\quad');
    
    // Split by \\qquad (which separates choices)
    const parts = cleanString.split('\\qquad');
    debugLog('Split by \\qquad:', parts);
    
    const choices = parts.map(part => {
        // Clean up each part
        let choice = part.trim();
        
        // Extract choice letter and content from patterns like "\\textbf{(A)}\\ 0"
        const match = choice.match(/\\textbf\{([^}]+)\}\\?\s*(.+)/);
        if (match) {
            const letter = match[1]; // e.g., "(A)" - we don't need this since rendering adds A., B., etc.
            const content = match[2].trim(); // e.g., "0" - this is what we want
            return content; // Return only the content, not the letter
        }
        
        // If no match, return the original (might be simpler format)
        return choice;
    });
    
    debugLog('Parsed choices:', choices);
    return choices.filter(choice => choice.length > 0);
}

/**
 * Select an answer for the current question
 */
function selectAnswer(choiceIndex) {
    currentAnswers[currentQuestionIndex] = choiceIndex;
    
    // Update UI to show selected answer
    const choices = document.querySelectorAll('.choice-button');
    choices.forEach((choice, index) => {
        choice.classList.remove('selected');
        if (index === choiceIndex) {
            choice.classList.add('selected');
        }
    });
    
    // Update navigation button for this question
    const navBtn = document.getElementById(`nav-btn-${currentQuestionIndex}`);
    if (navBtn) {
        navBtn.classList.add('answered');
    }
    
    updateNavigationButtons();
}

/**
 * Navigate to next question
 */
function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    }
}

/**
 * Navigate to previous question
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
    }
}

/**
 * Jump to a specific question
 */
function jumpToQuestion(index) {
    if (index >= 0 && index < currentQuestions.length) {
        currentQuestionIndex = index;
        displayCurrentQuestion();
    }
}

/**
 * Update navigation buttons state
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) {
        prevBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    }
    
    if (nextBtn) {
        nextBtn.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none';
    }
    
    if (submitBtn) {
        const answeredCount = currentAnswers.filter(answer => answer !== null).length;
        submitBtn.style.display = answeredCount > 0 ? 'inline-block' : 'none';
    }
}

/**
 * Submit all answers (simplified - just show results)
 */
function submitAnswers() {
    const answeredCount = currentAnswers.filter(answer => answer !== null).length;
    const totalQuestions = currentQuestions.length;
    
    if (answeredCount === 0) {
        showError('Please answer at least one question before submitting.');
        return;
    }
    
    // Simple results display (without backend scoring)
    const resultsHTML = `
        <div class="results-container">
            <h2>Practice Complete!</h2>
            <div class="results-summary">
                <p><strong>Level:</strong> ${currentLevel}</p>
                <p><strong>Questions Answered:</strong> ${answeredCount} out of ${totalQuestions}</p>
                <p><strong>Completion:</strong> ${Math.round((answeredCount / totalQuestions) * 100)}%</p>
            </div>
            
            <div class="results-actions">
                <button onclick="selectLevel(${currentLevel})" class="btn btn-primary">Try Again</button>
                <button onclick="initializeLevelSelection()" class="btn btn-secondary">Choose Different Level</button>
                <button onclick="window.location.href='subjects.html'" class="btn btn-secondary">Back to Subjects</button>
            </div>
            
            <div class="note">
                <p><strong>Note:</strong> Detailed scoring and progress tracking will be available when the full backend features are implemented.</p>
            </div>
        </div>
    `;
    
    document.querySelector('.math-main').innerHTML = resultsHTML;
}

/**
 * Render LaTeX content using MathJax (if available)
 */
function renderLatexContent(element) {
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([element]).catch((err) => {
            console.warn('MathJax rendering error:', err);
        });
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorHTML = `
        <div class="error-container">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="initializeLevelSelection()" class="btn btn-primary">Try Again</button>
            <button onclick="window.location.href='dashboard.html'" class="btn btn-secondary">Back to Dashboard</button>
        </div>
    `;
    
    document.querySelector('.math-main').innerHTML = errorHTML;
}

/**
 * Hide all sections (utility function)
 */
function hideAllSections() {
    // This function is kept for compatibility but simplified version doesn't need it
    console.log('Simplified math interface - no sections to hide');
} 