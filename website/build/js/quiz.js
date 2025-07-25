/**
 * Quiz Module
 * Handles quiz creation, management, and taking functionality
 * Requires: question-renderer.js to be loaded before this file
 */

// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Debug logging for API URL
console.log('[Quiz] JAVA_API_BASE_URL:', JAVA_API_BASE_URL);

// Debug mode - set to true to enable detailed console logging
const DEBUG_MODE = true;

// Debug logging helper
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log('[Quiz]', ...args);
    }
}

// Global state
let currentUser = null;
let userQuizzes = [];
let availableLevels = [];
let availableYears = [];

// Quiz creation state
let quizCreationStep = 1;
let selectedQuizName = '';
let selectedLevel = null;
let selectedYear = null;
let selectedAMCType = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    currentUser = checkAuthStatus();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize question renderer
    if (typeof questionRenderer === 'undefined') {
        console.error('Question renderer not loaded');
        return;
    }

    // Setup navigation
    setupNavigation();
    
    // Initialize with your quizzes tab by default
    switchToQuizTab('yourQuizzes');
    loadUserQuizzes();
});

// Setup navigation
function setupNavigation() {
    const backToMathBtn = document.getElementById('backToMathBtn');
    if (backToMathBtn) {
        backToMathBtn.addEventListener('click', () => {
            window.location.href = 'math.html';
        });
    }
}

// Tab switching functionality
function switchToQuizTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected tab content
    if (tabName === 'yourQuizzes') {
        document.getElementById('yourQuizzesTab').classList.add('active');
        document.getElementById('yourQuizzesContent').style.display = 'block';
        loadUserQuizzes();
    } else if (tabName === 'createQuiz') {
        document.getElementById('createQuizTab').classList.add('active');
        document.getElementById('createQuizContent').style.display = 'block';
        resetQuizCreation();
    }
}

// =============================================================================
// PAST QUIZZES FUNCTIONALITY
// =============================================================================

/**
 * Load user's past quizzes
 */
async function loadUserQuizzes() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            console.log('Loaded quizzes from backend:', quizzes);
            userQuizzes = quizzes;
            displayUserQuizzes(quizzes);
        } else if (response.status === 404) {
            // If no quizzes found, show empty state
            displayUserQuizzes({});
        } else {
            console.error('Error loading quizzes:', response.status);
            displayUserQuizzes({});
        }
    } catch (error) {
        console.error('Error loading user quizzes:', error);
        displayUserQuizzes({});
    }
}

/**
 * Display user's quizzes
 */
function displayUserQuizzes(quizzes) {
    const quizList = document.getElementById('quizList');
    if (!quizList) return;
    
    const quizIds = Object.keys(quizzes);
    
    // For now, show dummy data if no quizzes exist
    if (quizIds.length === 0) {
        // Create dummy quiz data for testing
        const dummyQuizzes = {
            "quiz-1": {
                quizId: "quiz-1",
                quizName: "AMC 10 Practice Quiz",
                quizType: "standard",
                questionSetId: "2023_AMC_10",
                lastActivity: new Date().toISOString(),
                questionIdToAnswer: {
                    "q1": "A",
                    "q2": "B",
                    "q3": null,
                    "q4": null,
                    "q5": null
                },
                getScorePercentage: () => 40,
                isCompleted: () => false,
                getQuestionsAnswered: () => 2
            },
            "quiz-2": {
                quizId: "quiz-2",
                quizName: "AMC 8 Test Quiz",
                quizType: "standard",
                questionSetId: "2022_AMC_8",
                lastActivity: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                questionIdToAnswer: {
                    "q1": "C",
                    "q2": "D",
                    "q3": "A",
                    "q4": "B",
                    "q5": "E"
                },
                getScorePercentage: () => 100,
                isCompleted: () => true,
                getQuestionsAnswered: () => 5
            }
        };
        
        userQuizzes = dummyQuizzes;
        quizzes = dummyQuizzes;
        quizIds = Object.keys(quizzes);
    }
    
    const quizzesHTML = quizIds.map(quizId => {
        const quiz = quizzes[quizId];
        console.log(`Quiz ${quizId} data:`, quiz);
        const completionPercentage = quiz.getScorePercentage ? quiz.getScorePercentage() : 0;
        const isCompleted = quiz.isCompleted ? quiz.isCompleted() : false;
        const answeredCount = quiz.getQuestionsAnswered ? quiz.getQuestionsAnswered() : 0;
        const totalQuestions = quiz.questionIdToAnswer ? Object.keys(quiz.questionIdToAnswer).length : 0;
        
        return `
            <div class="quiz-card" onclick="openQuiz('${quizId}')">
                <div class="quiz-card-header">
                    <h3>${quiz.quizName || 'Untitled Quiz'}</h3>
                    <span class="quiz-type-badge">${quiz.quizType === 'standardAMC' ? 'Standard' : (quiz.quizType || 'Standard')}</span>
                </div>
                <div class="quiz-card-body">
                    <div class="quiz-progress-info">
                        <div class="progress-stats">
                            <span class="progress-text">${answeredCount}/${totalQuestions} questions answered</span>
                            <span class="progress-percentage">${completionPercentage}% complete</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${completionPercentage}%"></div>
                        </div>
                    </div>
                    <div class="quiz-meta">
                        <span class="quiz-date">${formatDate(quiz.lastActivity)}</span>
                        <span class="quiz-status ${isCompleted ? 'completed' : 'in-progress'}">
                            ${isCompleted ? '✅ Completed' : '🔄 In Progress'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    quizList.innerHTML = quizzesHTML;
}

/**
 * Open a specific quiz
 */
function openQuiz(quizId) {
    // Redirect to the quiz-taking page with the quiz ID
    window.location.href = `quiz-taking.html?quizId=${encodeURIComponent(quizId)}`;
}



// =============================================================================
// QUIZ CREATION FUNCTIONALITY
// =============================================================================

/**
 * Reset quiz creation state
 */
function resetQuizCreation() {
    quizCreationStep = 1;
    selectedQuizName = '';
    selectedLevel = null;
    selectedYear = null;
    selectedAMCType = null;
    
    // Show step 1
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    // Clear form
    document.getElementById('quizName').value = '';
}

/**
 * Proceed to step 2 (level selection)
 */
function proceedToStep2() {
    const quizName = document.getElementById('quizName').value.trim();
    if (!quizName) {
        alert('Please enter a quiz name');
        return;
    }
    
    selectedQuizName = quizName;
    quizCreationStep = 2;
    
    // Hide step 1, show step 2
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    
    // Load available levels
    loadAvailableLevels();
}

/**
 * Load available levels for quiz creation
 */
async function loadAvailableLevels() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/levels`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableLevels = data.levelAMCTypes; // Store the AMC types mapping
                displayLevelSelection(data);
            }
        } else {
            // For now, create dummy levels for testing
            console.log('Backend not ready, creating dummy levels for testing');
            const dummyData = {
                success: true,
                levels: [1, 2, 3],
                levelAMCTypes: {
                    1: "AMC 8",
                    2: "AMC 10", 
                    3: "AMC 12"
                },
                levelCounts: {
                    1: 25,
                    2: 25,
                    3: 25
                }
            };
            availableLevels = dummyData.levelAMCTypes;
            displayLevelSelection(dummyData);
        }
    } catch (error) {
        console.error('Error loading levels:', error);
        
        // For now, create dummy levels for testing
        console.log('Backend error, creating dummy levels for testing');
        const dummyData = {
            success: true,
            levels: [1, 2, 3],
            levelAMCTypes: {
                1: "AMC 8",
                2: "AMC 10", 
                3: "AMC 12"
            },
            levelCounts: {
                1: 25,
                2: 25,
                3: 25
            }
        };
        availableLevels = dummyData.levelAMCTypes;
        displayLevelSelection(dummyData);
    }
}

/**
 * Display level selection for quiz creation
 */
function displayLevelSelection(data) {
    const levelSelection = document.getElementById('levelSelection');
    if (!levelSelection) return;
    
    const levelsHTML = data.levels.map(level => `
        <button class="level-button" onclick="selectLevelForQuiz(${level})">
            <h3>${data.levelAMCTypes[level]}</h3>
            <p>${getLevelDescription(level)}</p>
            <span class="question-count">${data.levelCounts[level]} questions available</span>
        </button>
    `).join('');
    
    levelSelection.innerHTML = levelsHTML;
}

/**
 * Select level for quiz creation
 */
async function selectLevelForQuiz(level) {
    selectedLevel = level;
    selectedAMCType = availableLevels[level];
    quizCreationStep = 3;
    
    // Hide step 2, show step 3
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    
    // Load available years for this level
    await loadAvailableYearsForQuiz(level);
}

/**
 * Load available years for quiz creation
 */
async function loadAvailableYearsForQuiz(level) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}/years`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableYears = data.years;
                displayYearSelectionForQuiz(data);
            }
        } else {
            // For now, create dummy years for testing
            console.log('Backend not ready, creating dummy years for testing');
            const dummyData = {
                success: true,
                years: ["2020", "2021", "2022", "2023", "2024"],
                amcType: availableLevels[level] || "AMC"
            };
            availableYears = dummyData.years;
            displayYearSelectionForQuiz(dummyData);
        }
    } catch (error) {
        console.error('Error loading years:', error);
        
        // For now, create dummy years for testing
        console.log('Backend error, creating dummy years for testing');
        const dummyData = {
            success: true,
            years: ["2020", "2021", "2022", "2023", "2024"],
            amcType: availableLevels[level] || "AMC"
        };
        availableYears = dummyData.years;
        displayYearSelectionForQuiz(dummyData);
    }
}

/**
 * Display year selection for quiz creation
 */
function displayYearSelectionForQuiz(data) {
    const yearSelection = document.getElementById('yearSelection');
    if (!yearSelection) return;
    
    const yearsHTML = data.years.map(year => `
        <button class="year-button" onclick="selectYearForQuiz('${year}')">
            <h3>${year}</h3>
            <p>${data.amcType} ${year}</p>
        </button>
    `).join('');
    
    yearSelection.innerHTML = yearsHTML;
}

/**
 * Select year for quiz creation
 */
async function selectYearForQuiz(year) {
    selectedYear = year;
    
    // Create the quiz
    await createQuiz();
}

/**
 * Create the quiz
 */
async function createQuiz() {
    try {
        // Generate quiz ID
        const quizId = generateUUID();
        
        // Create quizQuestionSetId (format: year_AMC_level, e.g., "2023_AMC_8")
        // Map level numbers to AMC levels
        const levelToAMC = {
            1: "8",
            2: "10", 
            3: "12"
        };
        const amcLevel = levelToAMC[selectedLevel];
        const quizQuestionSetId = `${selectedYear}_AMC_${amcLevel}`;
        
        const requestBody = {
            userId: currentUser.username,
            quizType: "standard",
            quizId: quizId,
            quizName: selectedQuizName,
            quizQuestionSetId: quizQuestionSetId
        };
        
        const response = await fetch(`${JAVA_API_BASE_URL}/quiz/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const quizProgress = await response.json();
            alert('Quiz created successfully!');
            
            // Switch to your quizzes tab to show the new quiz
            switchToQuizTab('yourQuizzes');
        } else {
            // For now, create a dummy quiz for testing
            console.log('Backend not ready, creating dummy quiz for testing');
            
            const dummyQuiz = {
                quizId: quizId,
                quizName: selectedQuizName,
                quizType: "standard",
                questionSetId: quizQuestionSetId,
                lastActivity: new Date().toISOString(),
                questionIdToAnswer: {},
                getScorePercentage: () => 0,
                isCompleted: () => false,
                getQuestionsAnswered: () => 0
            };
            
            // Add to user quizzes
            userQuizzes[quizId] = dummyQuiz;
            
            alert('Quiz created successfully! (Dummy mode)');
            
            // Switch to your quizzes tab to show the new quiz
            switchToQuizTab('yourQuizzes');
        }
    } catch (error) {
        console.error('Error creating quiz:', error);
        
        // For now, create a dummy quiz for testing
        console.log('Backend error, creating dummy quiz for testing');
        
        const quizId = generateUUID();
        // Create quizQuestionSetId (format: year_AMC_level, e.g., "2023_AMC_8")
        const levelToAMC = {
            1: "8",
            2: "10", 
            3: "12"
        };
        const amcLevel = levelToAMC[selectedLevel];
        const quizQuestionSetId = `${selectedYear}_AMC_${amcLevel}`;
        
        const dummyQuiz = {
            quizId: quizId,
            quizName: selectedQuizName,
            quizType: "standard",
            questionSetId: quizQuestionSetId,
            lastActivity: new Date().toISOString(),
            questionIdToAnswer: {},
            getScorePercentage: () => 0,
            isCompleted: () => false,
            getQuestionsAnswered: () => 0
        };
        
        // Add to user quizzes
        userQuizzes[quizId] = dummyQuiz;
        
        alert('Quiz created successfully! (Dummy mode)');
        
        // Switch to your quizzes tab to show the new quiz
        switchToQuizTab('yourQuizzes');
    }
}



// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

function backToStep1() {
    quizCreationStep = 1;
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
}

function backToStep2() {
    quizCreationStep = 2;
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function getLevelDescription(level) {
    const descriptions = {
        1: "Middle school mathematics competition",
        2: "High school mathematics competition", 
        3: "Advanced high school mathematics competition"
    };
    return descriptions[level] || "Mathematics competition";
} 