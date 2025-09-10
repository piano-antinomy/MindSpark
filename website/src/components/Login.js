import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;

  // Cognito config (prefer env vars, with safe defaults)
  const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN || 'https://us-east-1kfqvyjnce.auth.us-east-1.amazoncognito.com';
  const COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID || '2f1oo2lsuhc1lfivgpivkdk914';
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000';

  function base64UrlEncode(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function generateRandomString(length = 64) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => ('0' + b.toString(16)).slice(-2)).join('');
  }

  async function pkceChallengeFromVerifier(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  const startPkceFlow = async (path) => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    const state = generateRandomString(32);

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const authorizeUrl = `${COGNITO_DOMAIN}${path}?client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;

    window.location.assign(authorizeUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await startPkceFlow('/oauth2/authorize');
    } catch (err) {
      // Fallback to Implicit flow to ensure we still reach Cognito Hosted UI for troubleshooting
      const fallbackState = String(Date.now());
      const implicitUrl = `${COGNITO_DOMAIN}/login?client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}&response_type=token&scope=${encodeURIComponent('openid email profile')}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(fallbackState)}`;
      try {
        window.location.assign(implicitUrl);
      } catch (_) {
        setErrorMessage('Unable to start login. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  };

  const handleSignup = async () => {
    try {
      await startPkceFlow('/signup');
    } catch (err) {
      const fallbackState = String(Date.now());
      const implicitUrl = `${COGNITO_DOMAIN}/signup?client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}&response_type=token&scope=${encodeURIComponent('openid email profile')}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(fallbackState)}`;
      try {
        window.location.assign(implicitUrl);
      } catch (_) {
        setErrorMessage('Unable to open signup. Please try again.');
        setTimeout(() => setErrorMessage(''), 5000);
      }
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
          
          <button type="button" onClick={handleSubmit} className="btn btn-primary btn-full">Sign In</button>
          <button type="button" onClick={handleSignup} className="btn btn-secondary btn-full" style={{ marginTop: '10px' }}>Create Account</button>
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
        </form>
        
        <div className="login-footer">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Login; 