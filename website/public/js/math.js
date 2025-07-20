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

// Global state for the three-step flow
let currentStep = 1; // 1=levels, 2=years, 3=questions
let selectedLevel = null;
let selectedYear = null;
let selectedAMCType = null;
let availableLevels = [];
let availableYears = [];
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
    debugLog('Initializing Math Page with Three-Step Flow');
    
    // Start with step 1: level selection
    currentStep = 1;
    loadAvailableLevels();
}

// =============================================================================
// STEP 1: LEVEL SELECTION
// =============================================================================

/**
 * Load available math levels from backend
 */
async function loadAvailableLevels() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/levels`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableLevels = data.levels;
                displayLevelSelection(data);
                return data.levels;
            }
        }
        throw new Error('Failed to load available levels');
    } catch (error) {
        console.error('Error loading available levels:', error);
        showError('Failed to connect to the backend. Please make sure the backend server is running.');
        return [];
    }
}

/**
 * Display level selection interface
 */
function displayLevelSelection(data) {
    const levelSelectionHTML = `
        <div class="step-navigation">
            <div class="step active">1. Select Level</div>
            <div class="step">2. Select Year</div>
            <div class="step">3. Practice Questions</div>
        </div>
        
        <div class="level-selection-container">
            <h2>Select Math Competition Level</h2>
            <p>Choose your preferred AMC (American Mathematics Competitions) level:</p>
            
            <div class="levels-grid">
                ${data.levels.map(level => `
                    <button class="level-button" onclick="selectLevel(${level})">
                        <h3>${data.levelAMCTypes[level]}</h3>
                        <p class="level-description">${getLevelDescription(level)}</p>
                        <div class="level-stats">
                            <span class="question-count">${data.levelCounts[level]} questions</span>
                            <span class="year-count">${data.levelYearCounts[level]} years</span>
                        </div>
                    </button>
                `).join('')}
            </div>
            
            <div class="info-section">
                <h4>About AMC Levels:</h4>
                <ul>
                    <li><strong>AMC 8:</strong> Middle school level (grades 6-8)</li>
                    <li><strong>AMC 10:</strong> High school level (grades 9-10)</li>
                    <li><strong>AMC 12:</strong> Advanced high school level (grades 11-12)</li>
                </ul>
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

function getLevelDescription(level) {
    const descriptions = {
        1: "Middle school mathematics competition",
        2: "High school mathematics competition", 
        3: "Advanced high school mathematics competition"
    };
    return descriptions[level] || "Mathematics competition";
}

/**
 * Handle level selection
 */
async function selectLevel(level) {
    selectedLevel = level;
    currentStep = 2;
    
    debugLog('Selected level:', level);
    await loadAvailableYears(level);
}

// =============================================================================
// STEP 2: YEAR SELECTION
// =============================================================================

/**
 * Load available years for a specific level
 */
async function loadAvailableYears(level) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/years`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableYears = data.years;
                selectedAMCType = data.amcType;
                displayYearSelection(data);
                return data.years;
            }
        }
        throw new Error(`Failed to load years for level ${level}`);
    } catch (error) {
        console.error('Error loading years:', error);
        showError(`Failed to load years for level ${level}. Please check your connection.`);
        return [];
    }
}

/**
 * Display year selection interface
 */
function displayYearSelection(data) {
    const yearSelectionHTML = `
        <div class="step-navigation">
            <div class="step completed" onclick="backToLevelSelection()">1. Select Level</div>
            <div class="step active">2. Select Year</div>
            <div class="step">3. Practice Questions</div>
        </div>
        
        <div class="year-selection-container">
            <h2>${data.amcType} - Select Competition Year</h2>
            <p>Choose a year to practice questions from the ${data.amcType} competition:</p>
            
            <div class="selected-level-info">
                <span class="level-badge">Level ${data.level}</span>
                <span class="amc-type">${data.amcType}</span>
            </div>
            
            <div class="years-grid">
                ${data.years.map(year => `
                    <button class="year-button" onclick="selectYear('${year}')">
                        <h3>${year}</h3>
                        <p class="year-description">${data.amcType} ${year}</p>
                    </button>
                `).join('')}
            </div>
            
            <div class="navigation-buttons">
                <button class="btn btn-secondary" onclick="backToLevelSelection()">← Back to Levels</button>
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
                ${yearSelectionHTML}
            </main>
        </div>
    `;
}

/**
 * Handle year selection
 */
async function selectYear(year) {
    selectedYear = year;
    currentStep = 3;
    
    debugLog('Selected year:', year);
    await loadQuestionsForLevelAndYear(selectedLevel, year);
}

// =============================================================================
// STEP 3: QUESTIONS PRACTICE
// =============================================================================

/**
 * Load questions for specific level and year
 */
async function loadQuestionsForLevelAndYear(level, year) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/year/${year}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentQuestions = data.questions;
                currentAnswers = new Array(data.questions.length).fill(null);
                currentQuestionIndex = 0;
                displayQuestionsInterface(data);
                return data.questions;
            }
        }
        throw new Error(`Failed to load questions for level ${level} year ${year}`);
    } catch (error) {
        console.error('Error loading questions:', error);
        showError(`Failed to load questions for ${selectedAMCType} ${year}. Please check your connection.`);
        return [];
    }
}

/**
 * Display questions practice interface
 */
function displayQuestionsInterface(data) {
    const questionsHTML = `
        <div class="step-navigation">
            <div class="step completed" onclick="backToLevelSelection()">1. Select Level</div>
            <div class="step completed" onclick="backToYearSelection()">2. Select Year</div>
            <div class="step active">3. Practice Questions</div>
        </div>
        
        <div class="questions-container">
            <div class="questions-header">
                <h2>${data.amcType} ${data.year} Practice</h2>
                <div class="practice-info">
                    <span class="level-badge">Level ${data.level}</span>
                    <span class="question-counter">Question <span id="currentQuestionNum">1</span> of ${data.count}</span>
                </div>
            </div>
            
            <div class="question-navigation">
                <button class="btn btn-secondary" onclick="backToYearSelection()">← Back to Years</button>
                <div class="question-controls">
                    <button id="prevQuestion" onclick="previousQuestion()" disabled>← Previous</button>
                    <button id="nextQuestion" onclick="nextQuestion()">Next →</button>
                </div>
            </div>
            
            <div id="questionDisplay" class="question-display">
                <!-- Question content will be inserted here -->
            </div>
            
            <div class="answer-section">
                <div class="answer-choices" id="answerChoices">
                    <!-- Answer choices will be inserted here -->
                </div>
            </div>
            
            <div class="practice-controls">
                <button class="btn btn-primary" onclick="submitAnswer()">Submit Answer</button>
                <button class="btn btn-secondary" onclick="showSolution()">Show Solution</button>
                <button class="btn btn-info" onclick="resetPractice()">Reset Practice</button>
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
                ${questionsHTML}
            </main>
        </div>
    `;
    
    // Display the first question
    displayCurrentQuestion();
}

/**
 * Display the current question
 */
function displayCurrentQuestion() {
    if (currentQuestionIndex < 0 || currentQuestionIndex >= currentQuestions.length) {
        showError('Invalid question index');
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionDisplay = document.getElementById('questionDisplay');
    const answerChoices = document.getElementById('answerChoices');
    const currentQuestionNum = document.getElementById('currentQuestionNum');
    
    // Update question counter
    if (currentQuestionNum) {
        currentQuestionNum.textContent = currentQuestionIndex + 1;
    }
    
    // Hide content initially to prevent LaTeX flash
    if (questionDisplay) questionDisplay.style.visibility = 'hidden';
    if (answerChoices) answerChoices.style.visibility = 'hidden';
    
    // Get processed question text and choices
    let questionText, choices, hasLabels = false;
    
    if (typeof question.question === 'string') {
        // Old format - just text and choices array
        questionText = question.question;
        choices = question.choices || [];
        hasLabels = false;
    } else {
        // New format - complex object with insertions
        const questionDetails = question.question;
        questionText = processQuestionText(questionDetails.text, questionDetails.insertions);
        const choiceResult = extractQuestionChoices(questionDetails);
        choices = choiceResult.choices;
        hasLabels = choiceResult.hasLabels;
        
        // If no choices extracted from new format, fall back to simple choices array
        if (choices.length === 0 && question.choices) {
            choices = question.choices;
            hasLabels = false;
        }
    }
    
    // Display question content
    if (questionDisplay) {
        questionDisplay.innerHTML = `
            <div class="question-content">
                <h3>Problem ${currentQuestionIndex + 1}</h3>
                <div class="question-text">${questionText || 'Question text not available'}</div>
            </div>
        `;
        
        // Render LaTeX content and show when complete
        setTimeout(() => {
            renderLatexContent(questionDisplay).then(() => {
                if (questionDisplay) questionDisplay.style.visibility = 'visible';
            });
        }, 100);
    }
    
    // Display answer choices
    if (answerChoices) {
        debugLog('Displaying choices:', choices);
        debugLog('Has labels:', hasLabels);
        debugLog('Number of choices:', choices.length);
        
        const choicesHTML = choices.map((choice, index) => {
            const choiceValue = String.fromCharCode(65 + index);
            const isChecked = currentAnswers[currentQuestionIndex] === choiceValue;
            
            // Don't add letter prefix if choice already has labels
            const choiceDisplay = hasLabels ? choice : `${choiceValue}. ${choice}`;
            
            debugLog(`Choice ${index}:`, choiceDisplay);
            
            return `
                <label class="choice-label ${isChecked ? 'selected' : ''}">
                    <input type="radio" name="answer" value="${choiceValue}" 
                           ${isChecked ? 'checked' : ''}>
                    <span class="choice-content">${choiceDisplay}</span>
                </label>
            `;
        }).join('');
        
        debugLog('Generated HTML:', choicesHTML);
        answerChoices.innerHTML = choicesHTML;
        
        // Add click handlers to update selection styling
        answerChoices.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                // Remove selected class from all labels
                answerChoices.querySelectorAll('.choice-label').forEach(label => {
                    label.classList.remove('selected');
                });
                // Add selected class to the parent label of checked radio
                if (this.checked) {
                    this.closest('.choice-label').classList.add('selected');
                }
            });
        });
        
        // Render LaTeX content in choices and show when complete
        setTimeout(() => {
            renderLatexContent(answerChoices).then(() => {
                if (answerChoices) answerChoices.style.visibility = 'visible';
            });
        }, 100);
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

/**
 * Update navigation button states
 */
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevQuestion');
    const nextButton = document.getElementById('nextQuestion');
    
    if (prevButton) {
        prevButton.disabled = currentQuestionIndex === 0;
    }
    
    if (nextButton) {
        nextButton.disabled = currentQuestionIndex === currentQuestions.length - 1;
    }
}

// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

function backToLevelSelection() {
    currentStep = 1;
    selectedLevel = null;
    selectedYear = null;
    selectedAMCType = null;
    loadAvailableLevels();
}

function backToYearSelection() {
    if (selectedLevel) {
        currentStep = 2;
        selectedYear = null;
        loadAvailableYears(selectedLevel);
    } else {
        backToLevelSelection();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        saveCurrentAnswer();
        currentQuestionIndex--;
        displayCurrentQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        saveCurrentAnswer();
        currentQuestionIndex++;
        displayCurrentQuestion();
    }
}

function saveCurrentAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        currentAnswers[currentQuestionIndex] = selectedAnswer.value;
    }
}

function submitAnswer() {
    saveCurrentAnswer();
    const selectedAnswer = currentAnswers[currentQuestionIndex];
    const question = currentQuestions[currentQuestionIndex];
    
    if (!selectedAnswer) {
        alert('Please select an answer before submitting.');
        return;
    }
    
    // Show feedback
    const correct = selectedAnswer === question.answer;
    const message = correct ? 
        '✅ Correct! Well done.' : 
        `❌ Incorrect. The correct answer is ${question.answer}.`;
    
    alert(message);
}

function showSolution() {
    const question = currentQuestions[currentQuestionIndex];
    if (question.solution) {
        alert(`Solution: ${question.solution}`);
    } else {
        alert(`Correct Answer: ${question.answer}`);
    }
}

function resetPractice() {
    if (confirm('Are you sure you want to reset your practice? All answers will be lost.')) {
        currentAnswers = new Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0;
        displayCurrentQuestion();
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Process question text by replacing insertion markers with actual content
 */
function processQuestionText(questionText, insertions) {
    if (!insertions) return questionText;
    
    let processedText = questionText;
    
    // Replace insertion markers like <INSERTION_INDEX_1> with actual content
    Object.keys(insertions).forEach(key => {
        const insertion = insertions[key];
        const marker = `<${key}>`; // e.g., "<INSERTION_INDEX_1>"
        
        // Replace the marker with the appropriate content
        if (insertion.alt_type === 'latex' && insertion.alt_value) {
            // Use LaTeX content
            processedText = processedText.replace(marker, insertion.alt_value);
        } else if (insertion.picture) {
            // Use picture URL with proper protocol
            const imageUrl = insertion.picture.startsWith('//') ? 'https:' + insertion.picture : insertion.picture;
            processedText = processedText.replace(marker, `<img src="${imageUrl}" alt="${insertion.alt_value || 'Question image'}" class="question-image" />`);
        } else if (insertion.alt_value) {
            // Use alternative text value
            processedText = processedText.replace(marker, insertion.alt_value);
        }
    });
    
    return processedText;
}

/**
 * Render LaTeX content using MathJax (if available) or fallback
 */
function renderLatexContent(element) {
    // Check if MathJax is available
    if (typeof MathJax !== 'undefined') {
        return MathJax.typesetPromise([element]).catch((err) => {
            console.warn('MathJax rendering error:', err);
        });
    }
    // Return resolved promise if MathJax not available
    return Promise.resolve();
}

/**
 * Extract choices from question object (text_choices, latex_choices, or picture_choices)
 */
function extractQuestionChoices(questionDetails) {
    // Priority: text_choices > latex_choices > picture_choices
    if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
        return { choices: questionDetails.text_choices, hasLabels: false };
    } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
        return parseLatexChoices(questionDetails.latex_choices);
    } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
        const imageChoices = questionDetails.picture_choices.map(url => {
            const imageUrl = url.startsWith('//') ? 'https:' + url : url;
            return `<img src="${imageUrl}" alt="Choice" class="choice-image" />`;
        });
        return { choices: imageChoices, hasLabels: false };
    }
    
    return { choices: [], hasLabels: false };
}

/**
 * Parse LaTeX choices that might be in a single string or multiple strings
 */
function parseLatexChoices(latexChoices) {
    if (latexChoices.length === 1) {
        // Single string containing all choices - need to split
        const choiceString = latexChoices[0];
        debugLog('Original choice string:', choiceString);
        
        // Check if it contains multiple choice labels like (A), (B), etc.
        const textbfMatches = choiceString.match(/\\textbf\{[^}]*\([A-E]\)[^}]*\}/g);
        debugLog('Found textbf matches:', textbfMatches);
        
        if (textbfMatches && textbfMatches.length > 1) {
            // Split by qquad or similar separators, keeping textbf labels
            const choices = [];
            
            // More robust splitting approach
            let workingString = choiceString;
            
            // Remove outer $ delimiters if present
            workingString = workingString.replace(/^\$/, '').replace(/\$$/, '');
            
            // Split by \\qquad but keep the textbf parts
            const parts = workingString.split(/\\qquad/);
            debugLog('Split parts:', parts);
            
            for (let part of parts) {
                part = part.trim();
                if (part && part.includes('textbf')) {
                    // Wrap each part in $ delimiters for proper LaTeX rendering
                    choices.push(`$${part}$`);
                }
            }
            
            debugLog('Extracted choices:', choices);
            
            if (choices.length > 1) {
                return { choices, hasLabels: true };
            }
        }
        
        // Alternative approach: try splitting by the pattern (A), (B), etc.
        const labelPattern = /\\textbf\{.*?\([A-E]\).*?\}/g;
        const labelMatches = choiceString.match(labelPattern);
        
        if (labelMatches && labelMatches.length > 1) {
            debugLog('Using label pattern approach:', labelMatches);
            const choices = labelMatches.map(match => `$${match.replace(/\\qquad.*$/, '')}$`);
            return { choices, hasLabels: true };
        }
        
        // Third approach: manually split common AMC format
        if (choiceString.includes('\\qquad') && choiceString.includes('textbf')) {
            debugLog('Using manual AMC format splitting');
            
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
            
            debugLog('Manual splitting result:', choices);
            
            if (choices.length > 1) {
                return { choices, hasLabels: true };
            }
        }
        
        // If splitting failed, return as single choice
        debugLog('Splitting failed, returning single choice');
        return { choices: [choiceString], hasLabels: true };
    } else {
        // Multiple strings - assume each is a separate choice
        const hasLabels = latexChoices.some(choice => 
            choice.includes('textbf') && choice.match(/\([A-E]\)/));
        return { choices: latexChoices, hasLabels };
    }
}

/**
 * Render a single question with proper formatting
 */
function renderQuestion(question, questionIndex) {
    // Handle both old format (question.question as string) and new format (question.question as object)
    let questionDetails, questionText, choices;
    
    if (typeof question.question === 'string') {
        // Old format - just text and choices array
        questionText = question.question;
        choices = question.choices || [];
    } else {
        // New format - complex object with insertions
        questionDetails = question.question;
        questionText = processQuestionText(questionDetails.text, questionDetails.insertions);
        choices = extractQuestionChoices(questionDetails);
    }
    
    // If no choices extracted from new format, fall back to simple choices array
    if (choices.length === 0 && question.choices) {
        choices = question.choices;
    }
    
    // Create question HTML
    const questionHTML = `
        <div class="question-card" data-question-id="${question.id || 'unknown'}">
            <div class="question-title">
                <h3>Problem ${questionIndex + 1}</h3>
                <div class="question-text">${questionText || 'Question text not available'}</div>
            </div>
            <div class="choices-container">
                ${choices.map((choice, choiceIndex) => `
                    <label class="choice-label">
                        <input type="radio" name="answer" value="${String.fromCharCode(65 + choiceIndex)}" 
                               ${currentAnswers[currentQuestionIndex] === String.fromCharCode(65 + choiceIndex) ? 'checked' : ''}>
                        <span class="choice-text">${String.fromCharCode(65 + choiceIndex)}. ${choice}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    return questionHTML;
}

function showError(message) {
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
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="initializeMathPage()" class="btn btn-primary">Try Again</button>
                    <button onclick="location.href='dashboard.html'" class="btn btn-secondary">Back to Dashboard</button>
                </div>
            </main>
        </div>
    `;
} 