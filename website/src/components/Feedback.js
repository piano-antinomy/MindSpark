import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildApiHeaders } from '../utils/api';

function Feedback() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (e) {
        console.error('Failed to parse currentUser from localStorage:', e);
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('idToken');
    setUser(null);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    if (feedback.length > 2000) {
      setError('Feedback must be 2000 characters or less.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const JAVA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:4072/api`;
      
      const feedbackData = {
        feedback: feedback,
        userId: user?.userId || 'anonymous'
      };

      const headers = buildApiHeaders({ 'Content-Type': 'application/json' });

      const response = await fetch(`${JAVA_API_BASE_URL}/feedback/submit`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Feedback submitted successfully:', data);
        setIsSubmitted(true);
        setFeedback('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to submit feedback:', errorData);
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback, user not logged in.', error);
      alert('Please log in to submit feedback!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewFeedback = () => {
    setIsSubmitted(false);
    setFeedback('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header & Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/resources/sparksio.png" 
              alt="MindSpark" 
              className="h-8 w-auto"
            />
          </Link>
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/math-questions" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">AMC Problems</Link>
            <Link to="/quiz" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Quizzes</Link>
            <Link to="/leaderboard" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Leaderboard</Link>
            <Link to="/profile" className="text-gray-700 hover:text-indigo-600 font-semibold text-lg transition-colors duration-200">Profile</Link>
          </div>
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 hover:opacity-80 transition duration-200">
                  <img 
                    src={`/resources/images/avaters/${user.avatarLink || '1'}.png`}
                    alt={`${user.username} avatar`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = '/resources/images/avaters/1.png';
                    }}
                  />
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-3">
                    {/* Username Display */}
                    <div className="px-4 py-3 text-base font-semibold text-gray-800 border-b border-gray-100 text-left truncate" title={user.username}>
                      {user.username}
                    </div>
                    
                    {/* Edit Profile Link */}
                    <Link 
                      to="/profile" 
                      className="block w-full text-left px-4 py-3 text-base text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition duration-150 font-medium"
                    >
                      Edit Profile
                    </Link>
                    
                    {/* Logout Button */}
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-3 text-base text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition duration-150 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300">Log In</Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            {!isSubmitted ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">We Value Your Feedback</h1>
                
                <div className="mb-6 text-gray-700 space-y-3 text-left">
                  <p>
                    Thank you for using Sparksio! We're committed to helping students excel in AMC 8, 10, and 12 competitions.
                  </p>
                  <p>
                    Your feedback is invaluable to us. Whether it's a suggestion for new features, a bug report, thoughts on our problem solutions, 
                    or general comments about your experience, we want to hear from you.
                  </p>
                  <p className="font-semibold text-indigo-600">
                    Every piece of feedback helps us create a better learning experience for all students.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Feedback
                    </label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows="8"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none ${
                        feedback.length > 2000 ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Please share your thoughts, suggestions, or concerns..."
                      required
                    ></textarea>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        {error && (
                          <p className="text-sm text-red-600">{error}</p>
                        )}
                      </div>
                      <p className={`text-sm ${feedback.length > 2000 ? 'text-red-600' : 'text-gray-500'}`}>
                        {feedback.length}/2000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !feedback.trim() || feedback.length > 2000}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
                <p className="text-gray-700 mb-8">
                  Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve Sparksio.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleNewFeedback}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
                  >
                    Submit More Feedback
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition duration-300"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">&copy; 2024 Sparksio. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link to="/feedback" className="text-sm text-indigo-600 hover:text-indigo-700 transition duration-200">Feedback</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Feedback;

