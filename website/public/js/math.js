// Dynamically determine API base URL based on current host
const API_BASE_URL = `http://${window.location.hostname}:4092/api`;

// State management
let currentAssessmentQuestions = [];
let currentAssessmentAnswers = [];
let currentTopics = [];
let currentLesson = null;
let currentQuizQuestions = [];
let currentQuizAnswers = [];
let currentQuestionIndex = 0;

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
    const currentUser = checkAuthStatus();
    
    // If user already has a math level, show topics, otherwise show assessment
    if (currentUser && currentUser.math_level) {
        showTopicsSection();
        loadTopics();
    } else {
        showAssessmentSection();
    }
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
        const response = await fetch(`${API_BASE_URL}/math/assessment`, {
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
        const response = await fetch(`${API_BASE_URL}/math/assessment`, {
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
        const response = await fetch(`${API_BASE_URL}/math/topics`, {
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
        const response = await fetch(`${API_BASE_URL}/math/lesson/${encodeURIComponent(topicName)}`, {
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
        const response = await fetch(`${API_BASE_URL}/math/quiz/${encodeURIComponent(currentLesson.topic)}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentQuizQuestions = data.questions;
                currentQuizAnswers = new Array(data.questions.length).fill(null);
                currentQuestionIndex = 0;
                
                document.getElementById('quizTitle').textContent = `Quiz: ${data.topic}`;
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
        displayCurrentQuestion();
    }
}

async function submitQuiz() {
    if (!currentLesson) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/math/quiz/${encodeURIComponent(currentLesson.topic)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                answers: currentQuizAnswers
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

function displayResults(results) {
    const resultsHTML = `
        <div class="score-display">${results.score.toFixed(1)}%</div>
        <div class="results-message">
            You got ${results.correct} out of ${results.total} questions correct!<br>
            You earned ${results.points_earned} points!
        </div>
        <p>${results.message}</p>
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