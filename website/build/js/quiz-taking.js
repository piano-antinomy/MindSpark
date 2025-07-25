/**
 * Quiz Taking Module
 * Handles individual quiz taking functionality
 * Requires: question-renderer.js to be loaded before this file
 */

console.log('Quiz-taking.js loaded successfully');

// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Debug logging for API URL
console.log('[Quiz Taking] JAVA_API_BASE_URL:', JAVA_API_BASE_URL);

// Global state for quiz taking
let currentUser = null;
let currentQuiz = null;
let currentQuizQuestions = [];
let currentQuizAnswers = {};
let currentQuestionIndex = 0;

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
    
    // Get quiz ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    console.log('Quiz ID from URL:', quizId);
    
    if (quizId) {
        loadQuiz(quizId);
    } else {
        console.error('No quiz ID provided');
        alert('No quiz ID provided');
        window.location.href = 'quiz.html';
    }
});

/**
 * Setup navigation controls
 */
function setupNavigation() {
    // Back to quizzes button
    const backToQuizzesBtn = document.getElementById('backToQuizzesBtn');
    if (backToQuizzesBtn) {
        backToQuizzesBtn.addEventListener('click', function() {
            window.location.href = 'quiz.html';
        });
    }
}

/**
 * Load quiz data and questions
 */
async function loadQuiz(quizId) {
    try {
        // Get user's quizzes to find the specific quiz
        const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/list`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            const quiz = quizzes[quizId];
            
            if (!quiz) {
                alert('Quiz not found');
                window.location.href = 'quiz.html';
                return;
            }
            
            currentQuiz = quiz;
            
            // Update breadcrumb with quiz name
            const quizNameBreadcrumb = document.getElementById('quizNameBreadcrumb');
            if (quizNameBreadcrumb) {
                quizNameBreadcrumb.textContent = quiz.quizName || 'Untitled Quiz';
            }
            
            // Load quiz questions
            await loadQuizQuestions(quizId);
        } else {
            // For now, create dummy quiz data for testing
            console.log('Backend not ready, creating dummy quiz for testing');
            createDummyQuiz(quizId);
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
        // For now, create dummy quiz data for testing
        console.log('Backend error, creating dummy quiz for testing');
        createDummyQuiz(quizId);
    }
}

/**
 * Load quiz questions
 */
async function loadQuizQuestions(quizId) {
    try {
        const response = await fetch(`${JAVA_API_BASE_URL}/quiz/user/${currentUser.username}/quiz/${quizId}/questions`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const questions = await response.json();
            currentQuizQuestions = questions;
            currentQuestionIndex = 0;
            
            // Initialize answers from quiz progress
            currentQuizAnswers = {};
            if (currentQuiz.questionIdToAnswer) {
                Object.keys(currentQuiz.questionIdToAnswer).forEach(questionId => {
                    const answer = currentQuiz.questionIdToAnswer[questionId];
                    if (answer) {
                        currentQuizAnswers[questionId] = answer;
                    }
                });
            }
            
            // Update quiz title
            updateQuizTitle();
            
            // Display first question
            displayCurrentQuestion();
            updateQuizProgress();
        } else {
            // For now, create dummy questions for testing
            console.log('Backend not ready, creating dummy questions for testing');
            createDummyQuestions();
        }
    } catch (error) {
        console.error('Error loading quiz questions:', error);
        // For now, create dummy questions for testing
        console.log('Backend error, creating dummy questions for testing');
        createDummyQuestions();
    }
}

/**
 * Create dummy quiz for testing
 */
function createDummyQuiz(quizId) {
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
            lastActivity: new Date(Date.now() - 86400000).toISOString(),
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
    
    currentQuiz = dummyQuizzes[quizId] || dummyQuizzes["quiz-1"];
    
    // Update breadcrumb with quiz name
    const quizNameBreadcrumb = document.getElementById('quizNameBreadcrumb');
    if (quizNameBreadcrumb) {
        quizNameBreadcrumb.textContent = currentQuiz.quizName || 'Untitled Quiz';
    }
    
    createDummyQuestions();
}

/**
 * Create dummy questions for testing
 */
function createDummyQuestions() {
    console.log('Creating dummy questions');
    const dummyQuestions = [
        {
            id: "q1",
            question: "What is the value of $2 + 3 \\times 4$?",
            choices: {
                "A": "14",
                "B": "20", 
                "C": "24",
                "D": "28",
                "E": "32"
            },
            answer: "A",
            solution: "Following order of operations: $2 + 3 \\times 4 = 2 + 12 = 14$"
        },
        {
            id: "q2", 
            question: "If $x + y = 10$ and $x - y = 4$, what is the value of $x$?",
            choices: {
                "A": "3",
                "B": "5",
                "C": "7", 
                "D": "9",
                "E": "11"
            },
            answer: "C",
            solution: "Adding the equations: $2x = 14$, so $x = 7$"
        },
        {
            id: "q3",
            question: "What is the area of a circle with radius 5?",
            choices: {
                "A": "$5\\pi$",
                "B": "$10\\pi$", 
                "C": "$25\\pi$",
                "D": "$50\\pi$",
                "E": "$100\\pi$"
            },
            answer: "C",
            solution: "Area = $\\pi r^2 = \\pi \\times 5^2 = 25\\pi$"
        }
    ];
    
    currentQuizQuestions = dummyQuestions;
    currentQuestionIndex = 0;
    console.log('Set currentQuizQuestions:', currentQuizQuestions);
    console.log('Set currentQuestionIndex:', currentQuestionIndex);
    
    // Initialize answers from quiz progress
    currentQuizAnswers = {};
    if (currentQuiz.questionIdToAnswer) {
        Object.keys(currentQuiz.questionIdToAnswer).forEach(questionId => {
            const answer = currentQuiz.questionIdToAnswer[questionId];
            if (answer) {
                currentQuizAnswers[questionId] = answer;
            }
        });
    }
    console.log('Initialized currentQuizAnswers:', currentQuizAnswers);
    
    // Update quiz title
    updateQuizTitle();
    
    // Display first question
    console.log('About to call displayCurrentQuestion');
    displayCurrentQuestion();
    updateQuizProgress();
}

/**
 * Update quiz title display
 */
function updateQuizTitle() {
    const quizTitle = document.getElementById('quizTitle');
    if (quizTitle && currentQuiz) {
        const quizName = currentQuiz.quizName || 'Untitled Quiz';
        const quizType = currentQuiz.quizType === 'standardAMC' ? 'Standard' : (currentQuiz.quizType || 'Standard');
        quizTitle.textContent = `${quizName} (${quizType})`;
    }
}

/**
 * Display current question
 */
async function displayCurrentQuestion() {
    console.log('displayCurrentQuestion called');
    console.log('currentQuestionIndex:', currentQuestionIndex);
    console.log('currentQuizQuestions.length:', currentQuizQuestions.length);
    
    if (currentQuestionIndex >= currentQuizQuestions.length) {
        console.log('No more questions to display');
        return;
    }
    
    const question = currentQuizQuestions[currentQuestionIndex];
    console.log('Current question:', question);
    
    const quizQuestionsDisplay = document.getElementById('quizQuestionsDisplay');
    console.log('quizQuestionsDisplay element:', quizQuestionsDisplay);
    
    if (!quizQuestionsDisplay) {
        console.error('quizQuestionsDisplay element not found');
        return;
    }
    
    // Check if questionRenderer is available
    if (typeof questionRenderer === 'undefined') {
        console.error('questionRenderer is not available');
        // Fallback: create simple HTML without question renderer
        const fallbackHTML = `
            <div class="quiz-question-card">
                <div class="question-text">${question.question}</div>
                <div class="question-choices">
                    ${Object.entries(question.choices).map(([key, value]) => `
                        <label class="choice-option">
                            <input type="radio" name="quiz-question-${question.id}" value="${key}" 
                                   ${currentQuizAnswers[question.id] === key ? 'checked' : ''}>
                            <span class="choice-label">${key}. ${value}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        quizQuestionsDisplay.innerHTML = fallbackHTML;
        
        // Add event listeners for radio buttons
        const radioButtons = quizQuestionsDisplay.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    currentQuizAnswers[question.id] = this.value;
                    updateQuizProgress();
                }
            });
        });
        
        return;
    }
    
    try {
        // Process the question using the question renderer
        const questionData = questionRenderer.processQuestion(question, currentQuestionIndex);
        console.log('Processed question data:', questionData);
        
        // Generate HTML for the question
        const questionHTML = questionRenderer.renderQuestionHTML(questionData, currentQuestionIndex, {
            selectedAnswer: currentQuizAnswers[question.id],
            inputNamePrefix: 'quiz-question',
            cssClasses: {
                questionCard: 'quiz-question-card'
            }
        });
        console.log('Generated question HTML:', questionHTML);
        
        // Display the question
        quizQuestionsDisplay.innerHTML = questionHTML;
        
        // Render LaTeX content
        await questionRenderer.renderLatexContent(quizQuestionsDisplay);
        
        // Add event listener for answer changes
        questionRenderer.addChoiceEventListeners(quizQuestionsDisplay, (questionIndex, answerValue, element) => {
            currentQuizAnswers[question.id] = answerValue;
            updateQuizProgress();
        });
    } catch (error) {
        console.error('Error in displayCurrentQuestion:', error);
        // Fallback: create simple HTML
        const fallbackHTML = `
            <div class="quiz-question-card">
                <div class="question-text">${question.question}</div>
                <div class="question-choices">
                    ${Object.entries(question.choices).map(([key, value]) => `
                        <label class="choice-option">
                            <input type="radio" name="quiz-question-${question.id}" value="${key}" 
                                   ${currentQuizAnswers[question.id] === key ? 'checked' : ''}>
                            <span class="choice-label">${key}. ${value}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        quizQuestionsDisplay.innerHTML = fallbackHTML;
        
        // Add event listeners for radio buttons
        const radioButtons = quizQuestionsDisplay.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    currentQuizAnswers[question.id] = this.value;
                    updateQuizProgress();
                }
            });
        });
    }
    
    updateQuizProgress();
}

/**
 * Update quiz progress display
 */
function updateQuizProgress() {
    const progressText = document.getElementById('quizProgressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText && progressFill) {
        const totalQuestions = currentQuizQuestions.length;
        const answeredQuestions = Object.keys(currentQuizAnswers).length;
        const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
        
        progressText.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
        progressFill.style.width = `${percentage}%`;
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitQuizBtn');
    
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.style.display = currentQuestionIndex === currentQuizQuestions.length - 1 ? 'none' : 'inline-block';
    if (submitBtn) submitBtn.style.display = currentQuestionIndex === currentQuizQuestions.length - 1 ? 'inline-block' : 'none';
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
 * Navigate to next question
 */
function nextQuestion() {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    }
}

/**
 * Submit quiz
 */
async function submitQuiz() {
    if (confirm('Are you sure you want to submit this quiz? You cannot change answers after submission.')) {
        try {
            // Update quiz progress with answers
            const updatedQuizProgress = {
                ...currentQuiz,
                questionIdToAnswer: currentQuizAnswers,
                lastActivity: new Date().toISOString()
            };
            
            const response = await fetch(`${JAVA_API_BASE_URL}/quiz/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId: currentUser.username,
                    quizId: currentQuiz.quizId,
                    quizProgress: updatedQuizProgress
                })
            });
            
            if (response.ok) {
                alert('Quiz submitted successfully!');
                // Redirect back to quiz management page
                window.location.href = 'quiz.html';
            } else {
                alert('Failed to submit quiz');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Failed to submit quiz');
        }
    }
}

/**
 * Check authentication status
 */
function checkAuthStatus() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    return null;
} 