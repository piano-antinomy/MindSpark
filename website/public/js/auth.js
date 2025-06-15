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
        
        try {
            const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store user info in localStorage for client-side use
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please make sure the backend server is running.');
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

// Logout function
async function logout() {
    try {
        await fetch(`${AUTH_CONFIG.baseUrl}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Enhanced authentication functions for Java backend
async function checkServerAuthStatus() {
    try {
        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/status`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.authenticated) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return data.user;
            }
        }
    } catch (error) {
        console.error('Auth status check failed:', error);
    }
    
    localStorage.removeItem('currentUser');
    return null;
}

// Get user profile from server
async function getUserProfile() {
    try {
        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/profile`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return data.user;
            }
        }
    } catch (error) {
        console.error('Profile fetch failed:', error);
    }
    
    return null;
} 