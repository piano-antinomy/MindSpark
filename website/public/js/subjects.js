const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = checkAuthStatus();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    loadSubjects();
});

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

async function loadSubjects() {
    const subjectsGrid = document.getElementById('subjectsGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displaySubjects(data.subjects);
            } else {
                showError('Failed to load subjects');
            }
        } else {
            showError('Authentication required');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        showError('Connection error. Please make sure the backend server is running.');
    }
}

function displaySubjects(subjects) {
    const subjectsGrid = document.getElementById('subjectsGrid');
    
    const subjectIcons = {
        'math': '📊',
        'music': '🎵',
        'chess': '♟️',
        'python': '🐍',
        'java': '☕'
    };
    
    const subjectsHTML = subjects.map(subject => `
        <div class="subject-card ${subject.available ? '' : 'disabled'}" 
             onclick="${subject.available ? `selectSubject('${subject.id}')` : ''}">
            <div class="subject-icon">${subjectIcons[subject.id] || '📚'}</div>
            <div class="subject-name">${subject.name}</div>
            <div class="subject-status ${subject.available ? 'status-available' : 'status-coming-soon'}">
                ${subject.available ? 'Available' : 'Coming Soon'}
            </div>
            ${subject.available ? '<p>Click to start learning!</p>' : '<p>This subject will be available soon.</p>'}
        </div>
    `).join('');
    
    subjectsGrid.innerHTML = subjectsHTML;
}

function selectSubject(subjectId) {
    switch(subjectId) {
        case 'math':
            window.location.href = 'math.html';
            break;
        case 'music':
            showComingSoon('Music');
            break;
        case 'chess':
            showComingSoon('Chess');
            break;
        case 'python':
            showComingSoon('Python Coding');
            break;
        case 'java':
            showComingSoon('Java Coding');
            break;
        default:
            showComingSoon('This subject');
    }
}

function showComingSoon(subjectName) {
    alert(`${subjectName} is coming soon! Currently, only Mathematics is available for learning.`);
}

function showError(message) {
    const subjectsGrid = document.getElementById('subjectsGrid');
    subjectsGrid.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="loadSubjects()" class="btn btn-primary">Try Again</button>
        </div>
    `;
} 