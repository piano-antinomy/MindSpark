import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to the MindSpark Learning Space!</h1>
          <p className="hero-subtitle">Unlock your potential with personalized learning experiences</p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </header>

      <section id="features" className="features-section">
        <div className="section-content">
          <h2>What You'll Learn</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Mathematics</h3>
              <p>From basic arithmetic to advanced calculus, master math at your own pace</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎵</div>
              <h3>Music</h3>
              <p>Learn music theory, instruments, and composition</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">♟️</div>
              <h3>Chess</h3>
              <p>Strategic thinking and chess mastery from beginner to advanced</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🐍</div>
              <h3>Python Coding</h3>
              <p>Learn programming with Python from basics to advanced concepts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">☕</div>
              <h3>Java Coding</h3>
              <p>Master object-oriented programming with Java</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 MindSpark Learning Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home; 