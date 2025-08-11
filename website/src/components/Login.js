import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Pass-through authentication - accept any credentials
    if (username.trim() && password.trim()) {
      // Create dummy user data
      const dummyUser = {
        userId: 'LocalUser-' + username + '-' + Date.now(),
        username: username,
        email: `${username}@example.com`,
        displayName: username
      };
      
      // Store user in backend via POST /api/auth/profile
      try {
        const resp = await fetch(`${JAVA_API_BASE_URL}/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: username.toLowerCase(),
            password: password,
            userId: dummyUser.userId,
            score: 0,
            mathLevel: 1,
            email: dummyUser.email,
            fullName: username
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const storedUser = data && data.user ? data.user : dummyUser;
          localStorage.setItem('currentUser', JSON.stringify(storedUser));
        } else {
          localStorage.setItem('currentUser', JSON.stringify(dummyUser));
        }
      } catch (err) {
        localStorage.setItem('currentUser', JSON.stringify(dummyUser));
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      setErrorMessage('Please enter both username and password');
      
      // Hide error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back!</h2>
          <p>Sign in to continue your learning journey</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full">Sign In</button>
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
        </form>
        
        <div className="test-credentials">
          <h4>Test Credentials:</h4>
          <div className="credential-item">
            <strong>Username:</strong> student1 <br />
            <strong>Password:</strong> password123
          </div>
          <div className="credential-item">
            <strong>Username:</strong> demo <br />
            <strong>Password:</strong> demo123
          </div>
        </div>
        
        <div className="login-footer">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Login; 