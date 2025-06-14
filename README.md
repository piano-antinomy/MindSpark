# MindSpark Learning Platform

Welcome to the MindSpark learning space! A comprehensive educational platform that provides personalized learning experiences across multiple subjects.

## 🚀 Features

- **User Authentication**: Secure login system with test credentials
- **Personalized Dashboard**: Track your progress and scores
- **Subject Selection**: Choose from Math, Music, Chess, Python, and Java (Math currently implemented)
- **Level Assessment**: Automatic skill level evaluation
- **Interactive Learning**: Lessons with examples and explanations
- **Quiz System**: Test your knowledge with generated quizzes
- **Score Tracking**: Monitor your learning progress
- **Modern UI**: Beautiful, responsive design

## 📁 Project Structure

```
MindSpark/
├── backend/           # Python Flask API
│   ├── app.py        # Main Flask application
│   └── requirements.txt
├── website/          # Node.js Frontend
│   ├── server.js     # Express server
│   ├── package.json  # Node dependencies
│   └── public/       # Static files
│       ├── index.html    # Landing page
│       ├── login.html    # Login page
│       ├── dashboard.html # User dashboard
│       ├── subjects.html  # Subject selection
│       ├── math.html     # Math learning module
│       ├── css/
│       │   └── styles.css # Stylesheet
│       └── js/
│           ├── auth.js      # Authentication
│           ├── dashboard.js # Dashboard functionality
│           ├── subjects.js  # Subject selection
│           └── math.js      # Math learning logic
└── README.md         # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.7+
- Node.js 14+
- npm or yarn

### Backend Setup (Python Flask)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask backend:
   ```bash
   python app.py
   ```

The backend will start on `http://localhost:5000`

### Frontend Setup (Node.js)

1. Navigate to the website directory:
   ```bash
   cd website
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the frontend server:
   ```bash
   npm start
   ```

The website will be available at `http://localhost:3000`

## 🎓 How to Use

### Test Credentials

Use these credentials to log in:

**Account 1:**
- Username: `student1`
- Password: `password123`

**Account 2:**
- Username: `demo`
- Password: `demo123`

### Learning Flow

1. **Login**: Use the test credentials to access the platform
2. **Dashboard**: View your progress and scores
3. **Choose Subject**: Select Mathematics (other subjects coming soon)
4. **Take Assessment**: Evaluate your current level
5. **Learn Topics**: Study lessons based on your level
6. **Take Quizzes**: Test your understanding
7. **Track Progress**: Monitor your scores and achievements

### Mathematics Learning

The math module includes:

- **Beginner Level**: Basic Addition, Basic Subtraction, Numbers 1-100
- **Intermediate Level**: Multiplication, Division, Fractions
- **Advanced Level**: Algebra, Geometry, Calculus Basics

Each topic includes:
- Comprehensive lessons with explanations
- Real-world examples
- Interactive quizzes with random questions
- Progress tracking and scoring

## 🎯 Current Implementation Status

✅ **Completed:**
- User authentication system
- Dashboard with score tracking
- Mathematics learning module
- Level assessment
- Interactive quizzes
- Responsive design
- Backend API integration

🚧 **Coming Soon:**
- Music learning module
- Chess training
- Python coding tutorials
- Java programming lessons
- Enhanced progress analytics

## 🔧 Technical Details

### Backend (Python Flask)
- RESTful API design
- Session-based authentication
- In-memory data storage (demo)
- Dynamic quiz generation
- CORS enabled for frontend integration

### Frontend (Node.js + Vanilla JS)
- Express.js server for static file serving
- Modern ES6+ JavaScript
- Fetch API for backend communication
- Responsive CSS Grid and Flexbox
- Local storage for client-side state management

## 🐛 Troubleshooting

### Common Issues

1. **Backend not accessible**: Ensure Flask server is running on port 5000
2. **Frontend not loading**: Check if Node.js server is running on port 3000
3. **Login fails**: Verify backend server is running and accessible
4. **CORS errors**: Make sure both servers are running on specified ports

### Error Messages

- **"Connection error"**: Backend server is not running
- **"Authentication required"**: Session expired, please log in again
- **"Failed to load"**: Network connectivity issue

## 📝 Development Notes

This is a demonstration project showing:
- Organized full-stack architecture
- Separation of concerns between frontend and backend
- RESTful API design
- Modern web development practices
- Educational technology implementation

For production use, consider:
- Database integration (PostgreSQL, MongoDB)
- Enhanced security measures
- User registration system
- Advanced progress analytics
- Mobile app development

## 🤝 Contributing

This project is set up for educational purposes. To extend functionality:

1. Add new subjects in the backend `math_content` pattern
2. Create corresponding frontend pages and JavaScript modules
3. Implement additional assessment types
4. Enhance the scoring system

## 📜 License

This project is created for educational demonstration purposes.

---

**Welcome to the MindSpark learning space!** 🎓✨
