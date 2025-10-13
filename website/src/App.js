import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Profile from './components/Profile';
import Subjects from './components/Subjects';
import Math from './components/Math';
import MathQuestions from './components/MathQuestions';
import Quiz from './components/Quiz';
import QuizTaking from './components/QuizTaking';
import Solutions from './components/Solutions';
import Leaderboard from './components/Leaderboard';
import OrientationLock from './components/OrientationLock';
import './App.css';

function App() {
  return (
    <div className="App">
      <OrientationLock />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/math" element={<Math />} />
        <Route path="/math-questions" element={<MathQuestions />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-taking" element={<QuizTaking />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  );
}

export default App; 