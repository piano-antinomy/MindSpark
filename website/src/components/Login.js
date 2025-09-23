import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
  const [errorMessage, setErrorMessage] = useState('');
  const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;

  // Cognito config (prefer env vars, with safe defaults)
  const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN || 'https://us-east-1kfqvyjnce.auth.us-east-1.amazoncognito.com';
  const COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID || '2f1oo2lsuhc1lfivgpivkdk914';
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'http://localhost:3000';
  console.log('REACT_APP_LOCAL_MODE === true ?', process.env.REACT_APP_LOCAL_MODE === 'true', 'value:', process.env.REACT_APP_LOCAL_MODE);

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

  const startPkceFlow = async (path, extraParams = {}) => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    const state = generateRandomString(32);

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const search = new URLSearchParams({
      client_id: COGNITO_CLIENT_ID,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: REDIRECT_URI,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state
    });
    for (const [k, v] of Object.entries(extraParams)) {
      search.set(k, v);
    }

    const authorizeUrl = `${COGNITO_DOMAIN}${path}?${search.toString()}`;
    window.location.assign(authorizeUrl);
  };

  const handleGoogle = async () => {
    try {
      await startPkceFlow('/oauth2/authorize', { identity_provider: 'Google' });
    } catch (err) {
      setErrorMessage('Unable to start Google sign-in.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back!</h2>
          <p>Sign in to continue your learning journey</p>
        </div>
        
        <form className="login-form">
          <button
            type="button"
            onClick={handleGoogle}
            className="btn btn-secondary btn-full"
            style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: '#121212',
              color: '#fff'
            }}
            aria-label="Continue with Google"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.64 4.657-6.086 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.692 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.702 16.316 18.994 13.8 24 13.8c3.059 0 5.842 1.156 7.961 3.039l5.657-5.657C34.869 6.053 29.692 4 24 4 16.318 4 9.499 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.565 0 10.63-2.138 14.39-5.61l-6.636-5.602C29.6 34.865 26.94 36 24 36c-5.196 0-9.63-3.317-11.265-7.957l-6.56 5.056C9.34 39.648 16.116 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.759 2.147-2.148 3.995-3.942 5.317l.003-.002 6.636 5.602C39.56 40.056 44 32 44 24c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          
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