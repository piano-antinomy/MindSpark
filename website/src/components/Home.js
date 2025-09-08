import React from 'react';
import { Link } from 'react-router-dom';

function Home() {

  return (
    <div className="bg-gray-50">
      {/* Header & Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">MindSpark</Link>
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/math-questions" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">AMC Problems</Link>
            <Link to="/math" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">AMC Practice</Link>
            <Link to="/quiz" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Quizzes</Link>
            <Link to="/leaderboard" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Leaderboard</Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Dashboard</Link>
          </div>
          <div className="hidden md:flex items-center">
            <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300">Log In</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-8 md:py-12 bg-white">
          {/* Animated Background Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating Math Symbols - moved more toward center */}
            <div className="absolute top-16 left-1/4 text-5xl text-blue-200 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>π</div>
            <div className="absolute top-24 right-1/3 text-4xl text-blue-300 animate-pulse" style={{animationDelay: '1s'}}>∑</div>
            <div className="absolute top-40 left-1/3 text-3xl text-blue-200 animate-bounce" style={{animationDelay: '2s', animationDuration: '4s'}}>√</div>
            <div className="absolute top-48 right-1/4 text-4xl text-blue-300 animate-pulse" style={{animationDelay: '0.5s'}}>∞</div>
            <div className="absolute top-20 right-1/5 text-3xl text-blue-200 animate-bounce" style={{animationDelay: '1.5s', animationDuration: '3.5s'}}>∫</div>
            
            {/* Geometric Shapes - moved toward center */}
            <div className="absolute top-32 left-2/5 w-6 h-6 bg-blue-200 rounded-full animate-ping" style={{animationDelay: '2.5s'}}></div>
            <div className="absolute top-44 right-1/3 w-5 h-5 bg-blue-300 transform rotate-45 animate-spin" style={{animationDelay: '1s', animationDuration: '8s'}}></div>
            <div className="absolute top-56 left-1/3 w-8 h-8 bg-blue-200 rounded-lg animate-pulse" style={{animationDelay: '3s'}}></div>
            
            {/* Wavy Lines - kept at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-200 to-transparent opacity-30">
              <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,60 C300,20 600,100 900,60 C1050,40 1200,80 1200,60 L1200,120 L0,120 Z" fill="currentColor" className="animate-pulse"></path>
              </svg>
            </div>
            
            {/* Floating Dots - moved toward center */}
            <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.8s'}}></div>
            <div className="absolute top-2/5 right-2/5 w-3 h-3 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '2.2s'}}></div>
            <div className="absolute top-1/2 left-2/5 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '1.8s'}}></div>
            <div className="absolute top-3/5 right-1/3 w-3 h-3 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '3.2s'}}></div>
            
            {/* Math Equation Floating - moved toward center */}
            <div className="absolute top-1/3 right-1/3 text-xl text-blue-300 font-mono animate-pulse" style={{animationDelay: '1.2s'}}>x² + y² = r²</div>
            <div className="absolute top-1/2 left-1/4 text-lg text-blue-200 font-mono animate-bounce" style={{animationDelay: '2.8s', animationDuration: '4s'}}>a² + b² = c²</div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                  Master AMC Math Competitions
                </h1>
                <p className="text-base md:text-lg text-gray-600 mb-6">
                  Prepare for AMC 8, 10, and 12 with personalized practice and intelligent explanations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/math" className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-300 inline-block text-center shadow-lg">
                    Start Practicing
                  </Link>
                  <Link to="/quiz" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-indigo-600 transition duration-300 inline-block text-center shadow-lg">
                    Take a Quiz
                  </Link>
                </div>
              </div>
              <div className="mt-8 md:mt-0">
                <img 
                  src="/resources/images/hero.png" 
                  alt="Mathematical symbols, formulas, and geometric shapes representing AMC math competitions" 
                  className="mx-auto w-full max-w-lg shadow-2xl hover:shadow-3xl transition-shadow duration-300"
                />
              </div>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Everything You Need for AMC Success</h2>
              <p className="text-gray-600 mt-1">Comprehensive tools and resources for competition preparation.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-16 w-16 bg-blue-100 text-indigo-600 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AMC Practice Problems</h3>
                <p className="text-gray-600">Access thousands of real AMC 8, 10, and 12 problems with detailed solutions and explanations.</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-16 w-16 bg-purple-100 text-purple-600 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Track your performance, identify weak areas, and see your improvement over time with detailed analytics.</p>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-center h-16 w-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Timed Practice</h3>
                <p className="text-gray-600">Practice under real competition conditions with timed quizzes and mock AMC exams.</p>
              </div>
            </div>
          </div>
        </section>

      </main>


      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">&copy; 2024 MindSpark. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home; 