const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    loadUserProfile();

    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', logout);
});

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function initializeDashboard() {
    const currentUser = checkAuthStatus();
    if (currentUser) {
        document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.username}!`;
        document.getElementById('totalScore').textContent = currentUser.score || 0;
        
        const mathLevel = currentUser.math_level || 'Not Assessed';
        document.getElementById('mathLevel').textContent = mathLevel;
        document.getElementById('mathLevel').className = `level-badge ${mathLevel.toLowerCase()}`;
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                updateDashboard(data.user);
                
                // Update localStorage with fresh data
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function updateDashboard(user) {
    // Update welcome message
    document.getElementById('userWelcome').textContent = `Welcome, ${user.username}!`;
    
    // Update score
    document.getElementById('totalScore').textContent = user.score;
    
    // Update math level
    const mathLevel = user.math_level || 'Not Assessed';
    document.getElementById('mathLevel').textContent = mathLevel;
    
    // Update completed lessons count
    document.getElementById('completedLessons').textContent = user.completed_lessons ? user.completed_lessons.length : 0;
    
    // Update quizzes taken count
    document.getElementById('quizzesTaken').textContent = user.quiz_scores ? user.quiz_scores.length : 0;
    
    // Update recent quizzes
    updateRecentQuizzes(user.quiz_scores);
    
    // Update current subject
    updateCurrentSubject(user);
    
    // Update recent activity
    updateRecentActivity(user);
}

function updateRecentQuizzes(quizScores) {
    const recentQuizzesContainer = document.getElementById('recentQuizzes');
    
    if (!quizScores || quizScores.length === 0) {
        recentQuizzesContainer.innerHTML = '<p>No quiz results yet. Start learning to see your progress!</p>';
        return;
    }
    
    // Show last 3 quiz results
    const recentQuizzes = quizScores.slice(-3).reverse();
    const quizzesHTML = recentQuizzes.map(quiz => `
        <div class="quiz-result">
            <strong>${quiz.topic}</strong><br>
            <span class="score">Score: ${quiz.score.toFixed(1)}%</span><br>
            <small>${new Date(quiz.date).toLocaleDateString()}</small>
        </div>
    `).join('');
    
    recentQuizzesContainer.innerHTML = quizzesHTML;
}

function updateCurrentSubject(user) {
    const currentSubjectContainer = document.getElementById('currentSubject');
    
    if (user.math_level) {
        currentSubjectContainer.innerHTML = `
            <div class="current-subject-info">
                <h5>Mathematics - ${user.math_level} Level</h5>
                <p>Continue your math journey!</p>
                <a href="math.html" class="btn btn-primary">Continue Learning</a>
            </div>
        `;
    } else {
        currentSubjectContainer.innerHTML = `
            <p>Take an assessment to get started!</p>
            <a href="subjects.html" class="btn btn-primary">Choose Subject</a>
        `;
    }
}

function updateRecentActivity(user) {
    const recentActivityContainer = document.getElementById('recentActivity');
    const activities = [];
    
    // Add quiz activities
    if (user.quiz_scores && user.quiz_scores.length > 0) {
        const recentQuiz = user.quiz_scores[user.quiz_scores.length - 1];
        activities.push({
            type: 'quiz',
            message: `Completed ${recentQuiz.topic} quiz with ${recentQuiz.score.toFixed(1)}% score`,
            date: new Date(recentQuiz.date)
        });
    }
    
    // Add level assessment activity
    if (user.math_level) {
        activities.push({
            type: 'assessment',
            message: `Math level assessed as ${user.math_level}`,
            date: new Date() // This would be stored separately in a real app
        });
    }
    
    if (activities.length === 0) {
        recentActivityContainer.innerHTML = '<p>Start learning to see your activity here!</p>';
        return;
    }
    
    // Sort by date (most recent first)
    activities.sort((a, b) => b.date - a.date);
    
    const activitiesHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <span class="activity-icon">${activity.type === 'quiz' ? '📝' : '🎯'}</span>
            <div class="activity-content">
                <span class="activity-message">${activity.message}</span>
                <small class="activity-date">${activity.date.toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
    
    recentActivityContainer.innerHTML = activitiesHTML;
} 