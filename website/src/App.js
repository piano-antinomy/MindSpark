import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Subjects from './components/Subjects';
import Math from './components/Math';
import MathQuestions from './components/MathQuestions';
import Quiz from './components/Quiz';
import QuizTaking from './components/QuizTaking';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/math" element={<Math />} />
        <Route path="/math-questions" element={<MathQuestions />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-taking" element={<QuizTaking />} />
      </Routes>
    </div>
  );
}

export default App; 