/**
 * Math Practice Module
 * Uses the QuestionRenderer module for consistent LaTeX rendering and question processing
 * Requires: question-renderer.js to be loaded before this file
 */

// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Debug mode - set to true to enable detailed console logging
const DEBUG_MODE = true;

// Debug logging helper
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log('[MathPractice]', ...args);
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
        <div class="header-spacer" style="margin: 2rem 0;"></div>
        
        <div class="level-selection-container" style="max-width: 800px; margin: 0 auto; text-align: center;">
            <h2 >Select the Math Competition Level</h2>
            
            <div class="levels-vertical" style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 5rem;">
                ${data.levels.map(level => `
                    <button class="level-button" onclick="selectLevel(${level})" 
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                   border: none; 
                                   border-radius: 16px; 
                                   padding: 2rem; 
                                   color: white; 
                                   cursor: pointer; 
                                   transition: all 0.3s ease; 
                                   box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
                                   font-family: 'Segoe UI', 'SF Pro Display', system-ui, sans-serif;"
                            onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 35px rgba(102, 126, 234, 0.35)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.25)'">
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 600; letter-spacing: -0.5px;">${data.levelAMCTypes[level]}</h3>
                        <p style="margin: 0 0 1rem 0; font-size: 1.1rem; opacity: 0.9; font-weight: 300;">${getLevelDescription(level)}</p>
                        <div style="display: flex; justify-content: center; gap: 2rem; font-size: 0.95rem; opacity: 0.8;">
                            <span style="background: rgba(255,255,255,0.2); padding: 0.4rem 1rem; border-radius: 20px;">${data.levelCounts[level]} questions</span>
                        </div>
                    </button>
                `).join('')}
                
                <button class="quiz-button" onclick="startLevelQuiz()" 
                        style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); 
                               border: 2px dashed rgba(255, 255, 255, 0.6);
                               border-radius: 16px; 
                               padding: 1.8rem; 
                               color: #8b5a6b; 
                               cursor: pointer; 
                               transition: all 0.3s ease; 
                               box-shadow: 0 6px 20px rgba(255, 154, 158, 0.2);
                               font-family: 'Segoe UI', 'SF Pro Display', system-ui, sans-serif;
                               margin-top: 1rem;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(255, 154, 158, 0.3)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 20px rgba(255, 154, 158, 0.2)'">
                    <span style="font-size: 1.8rem; margin-right: 0.5rem;">🤔</span>
                    <span style="font-size: 1.1rem; font-weight: 500;">Not sure about your level? Do a quiz to find it out!</span>
                </button>
            </div>
            
            <div class="info-section" style="background: #f8f9fa; border-radius: 12px; padding: 2rem; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <h4 style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin: 0 0 1.5rem 0;">About AMC Levels:</h4>
                <ul style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 1rem; line-height: 1.8; color: #4a5568; margin: 0; padding-left: 1.5rem;">
                    <li style="margin-bottom: 0.8rem;"><strong style="color: #2d3748;">AMC 8:</strong> Middle school level (grades 6-8)</li>
                    <li style="margin-bottom: 0.8rem;"><strong style="color: #2d3748;">AMC 10:</strong> High school level (grades 9-10)</li>
                    <li style="margin-bottom: 0;"><strong style="color: #2d3748;">AMC 12:</strong> Advanced high school level (grades 11-12)</li>
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
            <h2>${data.amcType} Level </h2>
            
            <!-- Personalized Training Option -->
            <div class="personalized-training-section">
                <button class="personalized-training-button" onclick="startPersonalizedTraining()">
                    <span class="button-icon">🎯</span>
                    <span class="button-title">Smart Practice Mode</span>
                    <span class="button-subtitle">AI-curated questions tailored to your skill level</span>
                </button>
            </div>
            
            <div class="training-option-divider">
                <span>OR</span>
            </div>
            
            <p><strong>Practice by Competition Year:</strong></p>
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
 * Display questions practice interface - All questions on one page
 */
function displayQuestionsInterface(data) {
    const questionsHTML = `
        
        <div class="questions-container all-questions">
            <div class="header-spacer" style="margin: 2rem 0;"></div>

            <div class="questions-header">
                <h2>${data.amcType} ${data.year} Practice</h2>
                <div class="practice-info">
                    <span class="level-badge">Level ${data.level}</span>
                    <span class="question-counter">All ${data.count} Questions</span>
                </div>
            </div>

            <div class="header-spacer" style="margin: 2rem 0;"></div>

            <div class="question-navigation">
                <button class="btn btn-secondary" onclick="backToYearSelection()">← Back to Year selections</button>
                <div class="header-spacer" style="margin: 2rem 0;"></div>

                <div class="practice-controls">
                    <button class="btn btn-success" onclick="checkAllAnswers()">Check All Answers</button>
                    <button class="btn btn-info" onclick="resetAllPractice()">Reset All</button>
                    <button class="btn btn-warning" onclick="showAllSolutions()">Show All Solutions</button>
                </div>
            </div>
            
            <div id="allQuestionsDisplay" class="all-questions-display">
                <!-- All questions will be inserted here -->
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
    
    // Display all questions
    displayAllQuestions();
}

/**
 * Display all questions on one page using the question renderer
 */
async function displayAllQuestions() {
    const allQuestionsDisplay = document.getElementById('allQuestionsDisplay');
    if (!allQuestionsDisplay) {
        showError('Questions display container not found');
        return;
    }
    
    debugLog('Displaying all questions using question renderer:', currentQuestions.length);
    
    // Use the question renderer to process and display all questions
    try {
        const processedQuestions = await questionRenderer.renderMultipleQuestions(
            currentQuestions, 
            allQuestionsDisplay, 
            {
                inputNamePrefix: 'question',
                cssClasses: {
                    questionCard: 'math-question-card'
                }
            }
        );
        
        // Add event listeners for answer changes
        questionRenderer.addChoiceEventListeners(allQuestionsDisplay, (questionIndex, answerValue, element) => {
            // Update answer in global array
            currentAnswers[questionIndex] = answerValue;
            
            // Update question status
            updateQuestionStatus(questionIndex);
        });
        
        debugLog('Successfully rendered all questions using question renderer');
        
    } catch (error) {
        console.error('Error rendering questions:', error);
        showError('Failed to render questions properly');
    }
}

/**
 * Update status for a specific question
 */
function updateQuestionStatus(questionIndex) {
    const statusElement = document.getElementById(`status_${questionIndex}`);
    if (!statusElement) return;
    
    const selectedAnswer = currentAnswers[questionIndex];
    if (selectedAnswer) {
        statusElement.innerHTML = '<span class="status-answered">Answered</span>';
    } else {
        statusElement.innerHTML = '';
    }
}

// =============================================================================
// ALL QUESTIONS FUNCTIONS
// =============================================================================

/**
 * Check all answers and show results
 */
function checkAllAnswers() {
    let correct = 0;
    let answered = 0;
    
    currentQuestions.forEach((question, index) => {
        const selectedAnswer = currentAnswers[index];
        const statusElement = document.getElementById(`status_${index}`);
        const questionCard = document.querySelector(`[data-question-index="${index}"]`);
        
        if (selectedAnswer) {
            answered++;
            const isCorrect = selectedAnswer === question.answer;
            
            if (isCorrect) {
                correct++;
                statusElement.innerHTML = '<span class="status-correct">✅ Correct</span>';
                questionCard.classList.add('correct');
                questionCard.classList.remove('incorrect');
            } else {
                statusElement.innerHTML = `<span class="status-incorrect">❌ Incorrect (Answer: ${question.answer})</span>`;
                questionCard.classList.add('incorrect');
                questionCard.classList.remove('correct');
            }
        } else {
            statusElement.innerHTML = '<span class="status-unanswered">Not answered</span>';
            questionCard.classList.remove('correct', 'incorrect');
        }
    });
    
    // Show summary
    const summary = `
        Results Summary:
        Answered: ${answered}/${currentQuestions.length}
        Correct: ${correct}/${answered > 0 ? answered : currentQuestions.length}
        Score: ${answered > 0 ? Math.round((correct/answered) * 100) : 0}%
    `;
    
    alert(summary);
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reset all practice answers
 */
function resetAllPractice() {
    if (confirm('Are you sure you want to reset all answers? All progress will be lost.')) {
        currentAnswers = new Array(currentQuestions.length).fill(null);
        
        // Clear all radio button selections
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Clear all visual states
        document.querySelectorAll('.choice-label').forEach(label => {
            label.classList.remove('selected');
        });
        
        document.querySelectorAll('.question-card').forEach(card => {
            card.classList.remove('correct', 'incorrect');
        });
        
        // Clear all status indicators
        currentQuestions.forEach((_, index) => {
            const statusElement = document.getElementById(`status_${index}`);
            if (statusElement) statusElement.innerHTML = '';
        });
        
        alert('All answers have been reset.');
    }
}

/**
 * Show solutions for all questions
 */
function showAllSolutions() {
    if (confirm('This will show the correct answers for all questions. Continue?')) {
        currentQuestions.forEach((question, index) => {
            const statusElement = document.getElementById(`status_${index}`);
            if (statusElement) {
                const solutionText = question.solution ? 
                    `Answer: ${question.answer} | Solution: ${question.solution}` :
                    `Correct Answer: ${question.answer}`;
                statusElement.innerHTML = `<span class="status-solution">${solutionText}</span>`;
            }
        });
        
        alert('All solutions are now displayed.');
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Render a single question using the question renderer module
 * For compatibility with any code that needs individual question rendering
 */
async function renderSingleQuestionWithRenderer(question, questionIndex, containerElement, selectedAnswer = null) {
    const questionData = questionRenderer.processQuestion(question, questionIndex);
    
    const questionHTML = questionRenderer.renderQuestionHTML(questionData, questionIndex, {
        selectedAnswer,
        inputNamePrefix: 'question',
        cssClasses: {
            questionCard: 'math-question-card'
        }
    });
    
    containerElement.innerHTML = questionHTML;
    
    // Render LaTeX content
    await questionRenderer.renderLatexContent(containerElement);
    
    return questionData;
}

/**
 * Handle personalized training mode selection
 */
function startPersonalizedTraining() {
    // For now, show a coming soon message with more details
    alert(`🎯 Smart Practice Mode - Coming Soon!
    
This feature will include:
• AI-powered question selection based on your skill level
• Adaptive difficulty that learns from your performance  
• Focus on your weak areas to accelerate improvement
• Mixed questions from multiple years for comprehensive practice
• Progress tracking with detailed analytics

For now, please select a specific competition year to practice with traditional AMC questions.`);
}

/**
 * Handle level quiz button click
 */
function startLevelQuiz() {
    alert(`🤔 Level Assessment Quiz - Coming Soon!

This adaptive quiz will help determine your optimal AMC level by:
• Presenting a mix of problems from different levels
• Analyzing your problem-solving approach and accuracy
• Recommending the best starting level for your skill
• Providing personalized learning path suggestions

For now, here's a quick guide:
• New to competitive math? Start with AMC 8
• Comfortable with algebra and geometry? Try AMC 10  
• Advanced topics like trigonometry and calculus? Go with AMC 12

Please select a level above to begin practicing!`);
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