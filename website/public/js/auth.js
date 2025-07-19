// Java Backend API Configuration - updated to use Java backend
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

// Configuration using Java backend
const AUTH_CONFIG = {
    backend: 'java',
    baseUrl: JAVA_API_BASE_URL
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Pass-through authentication - accept any credentials
        if (username.trim() && password.trim()) {
            // Create dummy user data
            const dummyUser = {
                id: 1,
                username: username,
                email: `${username}@example.com`,
                displayName: username
            };
            
            // Store user info in localStorage for client-side use
            localStorage.setItem('currentUser', JSON.stringify(dummyUser));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Please enter both username and password');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});

// Check if user is already logged in
function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function - simplified for pass-through mode
async function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Simplified authentication functions for pass-through mode
async function checkServerAuthStatus() {
    // In pass-through mode, just check localStorage
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

// Get user profile - simplified for pass-through mode
async function getUserProfile() {
    // In pass-through mode, just return localStorage data
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
} 