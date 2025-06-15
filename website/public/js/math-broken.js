// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Configuration - using Java backend
const API_CONFIG = {
    backend: 'java',
    baseUrl: JAVA_API_BASE_URL
};

// State management
let currentAssessmentQuestions = [];
let currentAssessmentAnswers = [];
let currentTopics = [];
let currentLesson = null;
let currentQuizQuestions = [];
let currentQuizAnswers = [];
let currentQuestionIndex = 0;
let currentLevel = null;
let availableLevels = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    initializeMathPage();
    setupEventListeners();
});

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

function initializeMathPage() {
    console.log('Initializing Math Page with Java Backend');
    
    // Deprecated Python backend functionality
    // Now using Java backend with level selection
    showAssessmentSection();
    initializeLevelSelection();
}

function setupEventListeners() {
    // Assessment section
    document.getElementById('startAssessmentBtn').addEventListener('click', startAssessment);
    document.getElementById('submitAssessmentBtn').addEventListener('click', submitAssessment);
    
    // Topics section
    document.getElementById('backToTopics').addEventListener('click', showTopicsSection);
    document.getElementById('backToTopicsFromResults').addEventListener('click', showTopicsSection);
    
    // Lesson section
    document.getElementById('takeQuizBtn').addEventListener('click', startQuiz);
    
    // Quiz section
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    document.getElementById('submitQuizBtn').addEventListener('click', submitQuiz);
    document.getElementById('backToLessonBtn').addEventListener('click', showLessonSection);
    document.getElementById('retakeQuizBtn').addEventListener('click', startQuiz);
}

// Assessment functions
async function startAssessment() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/math/assessment`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentAssessmentQuestions = data.questions;
                currentAssessmentAnswers = new Array(data.questions.length).fill(null);
                displayAssessmentQuestions();
                showAssessmentQuestions();
            }
        }
    } catch (error) {
        console.error('Error loading assessment:', error);
        showError('Failed to load assessment questions');
    }
}

function displayAssessmentQuestions() {
    const container = document.getElementById('questionsContainer');
    
    const questionsHTML = currentAssessmentQuestions.map((question, index) => `
        <div class="question-card">
            <div class="question-title">Question ${index + 1}: ${question.question}</div>
            <div class="options-grid">
                ${question.options.map((option, optionIndex) => `
                    <button class="option-button" 
                            onclick="selectAssessmentAnswer(${index}, ${optionIndex})">
                        ${option}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = questionsHTML;
    document.getElementById('submitAssessmentBtn').style.display = 'block';
}

function selectAssessmentAnswer(questionIndex, answerIndex) {
    currentAssessmentAnswers[questionIndex] = answerIndex;
    
    // Update UI to show selected answer
    const questionCard = document.querySelectorAll('.question-card')[questionIndex];
    const options = questionCard.querySelectorAll('.option-button');
    
    options.forEach((option, index) => {
        option.classList.remove('selected');
        if (index === answerIndex) {
            option.classList.add('selected');
        }
    });
}

async function submitAssessment() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/math/assessment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                answers: currentAssessmentAnswers
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update current user info
                const currentUser = checkAuthStatus();
                currentUser.math_level = data.level;
                currentUser.score = (currentUser.score || 0) + (data.score * 10);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                alert(`${data.message} You earned ${data.score * 10} points!`);
                
                // Show topics section
                showTopicsSection();
                loadTopics();
            }
        }
    } catch (error) {
        console.error('Error submitting assessment:', error);
        showError('Failed to submit assessment');
    }
}

// Topics functions
async function loadTopics() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/math/topics`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentTopics = data.topics;
                document.getElementById('currentLevel').textContent = data.level;
                displayTopics();
            }
        }
    } catch (error) {
        console.error('Error loading topics:', error);
        showError('Failed to load topics');
    }
}

function displayTopics() {
    const container = document.getElementById('topicsContainer');
    
    const topicsHTML = currentTopics.map(topic => `
        <div class="topic-card" onclick="loadLesson('${topic}')">
            <h4>${topic}</h4>
            <p>Click to learn</p>
        </div>
    `).join('');
    
    container.innerHTML = topicsHTML;
}

// Lesson functions
async function loadLesson(topicName) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/math/lesson/${encodeURIComponent(topicName)}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentLesson = data;
                displayLesson();
                showLessonSection();
            }
        }
    } catch (error) {
        console.error('Error loading lesson:', error);
        showError('Failed to load lesson');
    }
}

function displayLesson() {
    document.getElementById('lessonTitle').textContent = currentLesson.topic;
    
    const lessonHTML = `
        <h3>Learn About ${currentLesson.topic}</h3>
        <p>${currentLesson.lesson.content}</p>
        <h4>Examples:</h4>
        <ul>
            ${currentLesson.lesson.examples.map(example => `<li>${example}</li>`).join('')}
        </ul>
    `;
    
    document.getElementById('lessonContent').innerHTML = lessonHTML;
}

// Quiz functions
async function startQuiz() {
    if (!currentLesson) return;
    
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/math/quiz/${encodeURIComponent(currentLesson.topic)}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentQuizQuestions = data.questions;
                currentQuizAnswers = new Array(data.questions.length).fill(null);
                currentQuestionIndex = 0;
                
                // Display themed quiz title and intro
                document.getElementById('quizTitle').textContent = `${data.intro}`;
                
                // Add theme info if available
                if (data.theme) {
                    const themeInfo = document.createElement('div');
                    themeInfo.className = 'quiz-theme-info';
                    themeInfo.innerHTML = `<p><em>Theme: ${data.theme.replace('_', ' ').toUpperCase()}</em></p>`;
                    document.getElementById('quizTitle').appendChild(themeInfo);
                }
                
                displayCurrentQuestion();
                showQuizSection();
            }
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
        showError('Failed to load quiz');
    }
}

function displayCurrentQuestion() {
    const question = currentQuizQuestions[currentQuestionIndex];
    const container = document.getElementById('quizContainer');
    
    // Update progress counter
    document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${currentQuizQuestions.length}`;
    
    const questionHTML = `
        <div class="question-card">
            <div class="question-title">${question.question}</div>
            <div class="options-grid">
                ${question.options.map((option, optionIndex) => `
                    <button class="option-button" 
                            onclick="selectQuizAnswer(${optionIndex})">
                        ${option}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = questionHTML;
    
    // Show appropriate buttons
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'none';
}

function selectQuizAnswer(answerIndex) {
    currentQuizAnswers[currentQuestionIndex] = answerIndex;
    
    // Update UI to show selected answer
    const options = document.querySelectorAll('.option-button');
    options.forEach((option, index) => {
        option.classList.remove('selected');
        if (index === answerIndex) {
            option.classList.add('selected');
        }
    });
    
    // Show next or submit button
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        currentQuestionIndex++;
        if (API_CONFIG.backend === 'java') {
            displayCurrentJavaQuestion();
        } else {
            displayCurrentQuestion(); // Deprecated Python backend
        }
    }
}

async function submitQuiz() {
    if (API_CONFIG.backend === 'java') {
        return submitJavaQuiz();
    }
    
    // Deprecated Python backend functionality
    if (!currentLesson) return;
    
    try {
        // Collect correct answers from quiz questions
        const correctAnswers = currentQuizQuestions.map(q => q.correct);
        
        const response = await fetch(`${JAVA_API_BASE_URL}/math/quiz/${encodeURIComponent(currentLesson.topic)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                answers: currentQuizAnswers,
                correct_answers: correctAnswers
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update current user score
                const currentUser = checkAuthStatus();
                currentUser.score = (currentUser.score || 0) + data.points_earned;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                displayResults(data);
                showResultsSection();
            }
        }
    } catch (error) {
        console.error('Error submitting quiz:', error);
        showError('Failed to submit quiz');
    }
}

/**
 * Submit quiz for Java backend (simplified - just show completion)
 */
async function submitJavaQuiz() {
    // Calculate score based on selected answers
    const totalQuestions = currentQuizQuestions.length;
    const answeredQuestions = currentQuizAnswers.filter(answer => answer !== null).length;
    
    // For now, just show completion status
    // In a real implementation, you might want to send answers to backend for grading
    const completionRate = (answeredQuestions / totalQuestions) * 100;
    
    const results = {
        score: completionRate,
        message: completionRate === 100 ? 'Quiz Completed!' : 'Quiz Partially Completed',
        detailed_message: `You answered ${answeredQuestions} out of ${totalQuestions} questions.`,
        points_earned: answeredQuestions * 10 // 10 points per question
    };
    
    // Update current user score
    const currentUser = checkAuthStatus();
    if (currentUser) {
        currentUser.score = (currentUser.score || 0) + results.points_earned;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    displayResults(results);
    showResultsSection();
}

function displayResults(results) {
    const scoreClass = results.score >= 90 ? 'perfect' : 
                      results.score >= 75 ? 'excellent' : 
                      results.score >= 60 ? 'good' : 'needs-practice';
    
    const resultsHTML = `
        <div class="score-display ${scoreClass}">${results.score.toFixed(1)}%</div>
        <div class="motivational-message">
            <h3>${results.message}</h3>
        </div>
        <div class="results-details">
            <p>${results.detailed_message}</p>
            <p class="points-earned">🎉 You earned ${results.points_earned} points!</p>
        </div>
        <div class="progress-indicator">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${results.score}%"></div>
            </div>
        </div>
    `;
    
    document.getElementById('resultsContent').innerHTML = resultsHTML;
}

// Section visibility functions
function showAssessmentSection() {
    hideAllSections();
    document.getElementById('assessmentSection').style.display = 'block';
}

function showAssessmentQuestions() {
    hideAllSections();
    document.getElementById('assessmentQuestions').style.display = 'block';
}

function showTopicsSection() {
    hideAllSections();
    document.getElementById('topicsSection').style.display = 'block';
    loadTopics();
}

function showLessonSection() {
    hideAllSections();
    document.getElementById('lessonSection').style.display = 'block';
}

function showQuizSection() {
    hideAllSections();
    document.getElementById('quizSection').style.display = 'block';
}

function showResultsSection() {
    hideAllSections();
    document.getElementById('resultsSection').style.display = 'block';
}

function hideAllSections() {
    const sections = ['assessmentSection', 'assessmentQuestions', 'topicsSection', 
                     'lessonSection', 'quizSection', 'resultsSection'];
    sections.forEach(sectionId => {
        document.getElementById(sectionId).style.display = 'none';
    });
}

function showError(message) {
    alert(`Error: ${message}`);
}

// =============================================================================
// JAVA BACKEND INTEGRATION FUNCTIONS
// =============================================================================

/**
 * Load available math levels from Java backend
 */
async function loadAvailableLevels() {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/`);
        
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
        return [];
    }
}

/**
 * Load questions for a specific level from Java backend
 */
async function loadQuestionsByLevel(level) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/questions/math/level/${level}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return data.questions;
            }
        }
        throw new Error(`Failed to load questions for level ${level}`);
    } catch (error) {
        console.error('Error loading questions:', error);
        return [];
    }
}

/**
 * Process question text by replacing insertion markers with actual content
 */
function processQuestionText(questionText, insertions) {
    if (!insertions) return questionText;
    
    let processedText = questionText;
    
    // Replace insertion markers like [INSERTION_INDEX_1] with actual content
    Object.keys(insertions).forEach(key => {
        const insertion = insertions[key];
        const marker = key; // e.g., "INSERTION_INDEX_1"
        
        // Replace the marker with the appropriate content
        if (insertion.alt_type === 'latex' && insertion.alt_value) {
            // Use LaTeX content
            processedText = processedText.replace(marker, insertion.alt_value);
        } else if (insertion.picture) {
            // Use picture URL
            processedText = processedText.replace(marker, `<img src="${insertion.picture}" alt="${insertion.alt_value || 'Question image'}" class="question-image" />`);
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
        MathJax.typesetPromise([element]).catch((err) => {
            console.warn('MathJax rendering error:', err);
        });
    }
}

/**
 * Extract choices from question object (text_choices or picture_choices)
 */
function extractQuestionChoices(question) {
    const questionDetails = question.question;
    
    // Priority: text_choices > latex_choices > picture_choices
    if (questionDetails.text_choices && questionDetails.text_choices.length > 0) {
        return questionDetails.text_choices;
    } else if (questionDetails.latex_choices && questionDetails.latex_choices.length > 0) {
        return questionDetails.latex_choices;
    } else if (questionDetails.picture_choices && questionDetails.picture_choices.length > 0) {
        return questionDetails.picture_choices.map(url => `<img src="${url}" alt="Choice" class="choice-image" />`);
    }
    
    return [];
}

/**
 * Render a single question with proper formatting
 */
function renderQuestion(question, questionIndex, onAnswerSelect) {
    const questionDetails = question.question;
    
    // Process question text with insertions
    const processedText = processQuestionText(questionDetails.text, questionDetails.insertions);
    
    // Extract choices
    const choices = extractQuestionChoices(question);
    
    // Create question HTML
    const questionHTML = `
        <div class="question-card" data-question-id="${question.id}">
            <div class="question-title">
                <h3>Question ${questionIndex + 1}</h3>
                <div class="question-text">${processedText}</div>
            </div>
            <div class="choices-container">
                ${choices.map((choice, choiceIndex) => `
                    <button class="choice-button" 
                            onclick="${onAnswerSelect}(${questionIndex}, ${choiceIndex})"
                            data-choice-index="${choiceIndex}">
                        <span class="choice-label">${String.fromCharCode(65 + choiceIndex)}.</span>
                        <span class="choice-content">${choice}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    return questionHTML;
}

/**
 * Initialize level selection interface
 */
async function initializeLevelSelection() {
    const levels = await loadAvailableLevels();
    
    if (levels.length === 0) {
        showError('No math levels available');
        return;
    }
    
    // Create level selection interface
    const levelSelectionHTML = `
        <div class="level-selection-container">
            <h2>Select Your Math Level</h2>
            <div class="levels-grid">
                ${levels.map(level => `
                    <button class="level-button" onclick="selectLevel(${level})">
                        <h3>Level ${level}</h3>
                        <p>Click to start</p>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Replace the assessment section with level selection
    document.getElementById('assessmentSection').innerHTML = levelSelectionHTML;
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
    
    // Store questions for quiz mode
    currentQuizQuestions = questions;
    currentQuizAnswers = new Array(questions.length).fill(null);
    currentQuestionIndex = 0;
    
    // Show questions interface
    displayQuestionsInterface();
    showQuizSection();
}

/**
 * Display questions interface
 */
function displayQuestionsInterface() {
    if (currentQuizQuestions.length === 0) return;
    
    const container = document.getElementById('quizContainer');
    
    // Update quiz title
    document.getElementById('quizTitle').textContent = `Math Level ${currentLevel} Questions`;
    
    // Render current question
    displayCurrentJavaQuestion();
}

/**
 * Display current question from Java backend
 */
function displayCurrentJavaQuestion() {
    const question = currentQuizQuestions[currentQuestionIndex];
    const container = document.getElementById('quizContainer');
    
    // Update progress counter
    document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${currentQuizQuestions.length}`;
    
    // Render question
    const questionHTML = renderQuestion(question, currentQuestionIndex, 'selectJavaQuizAnswer');
    container.innerHTML = questionHTML;
    
    // Render LaTeX content
    setTimeout(() => {
        renderLatexContent(container);
    }, 100);
    
    // Show appropriate buttons
    updateNavigationButtons();
}

/**
 * Handle answer selection for Java backend questions
 */
function selectJavaQuizAnswer(questionIndex, answerIndex) {
    currentQuizAnswers[questionIndex] = answerIndex;
    
    // Update UI to show selected answer
    const choices = document.querySelectorAll('.choice-button');
    choices.forEach((choice, index) => {
        choice.classList.remove('selected');
        if (index === answerIndex) {
            choice.classList.add('selected');
        }
    });
    
    updateNavigationButtons();
}

/**
 * Update navigation buttons based on current state
 */
function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    const hasAnswer = currentQuizAnswers[currentQuestionIndex] !== null;
    
    // Show buttons only if answer is selected
    if (hasAnswer) {
        if (currentQuestionIndex < currentQuizQuestions.length - 1) {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        }
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'none';
    }
} 