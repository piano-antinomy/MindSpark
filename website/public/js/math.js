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
    
    // Display question content
    if (questionDisplay) {
        questionDisplay.innerHTML = `
            <div class="question-content">
                <h3>Problem ${currentQuestionIndex + 1}</h3>
                <div class="question-text">${question.question || 'Question text not available'}</div>
            </div>
        `;
    }
    
    // Display answer choices
    if (answerChoices && question.choices) {
        const choicesHTML = question.choices.map((choice, index) => `
            <label class="choice-label">
                <input type="radio" name="answer" value="${String.fromCharCode(65 + index)}" 
                       ${currentAnswers[currentQuestionIndex] === String.fromCharCode(65 + index) ? 'checked' : ''}>
                <span class="choice-text">${String.fromCharCode(65 + index)}. ${choice}</span>
            </label>
        `).join('');
        
        answerChoices.innerHTML = choicesHTML;
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