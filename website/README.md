# MindSpark React Frontend

This is the React.js version of the MindSpark learning platform frontend.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
To run the React app in development mode:
```bash
npm run build && npm run react-start
```
This will start the React development server on port 3000.

### 3. Production Build
To build the React app for production:
```bash
npm run react-build
```
This creates a `build` folder with the optimized production files.

### 4. Production Server
To run the production server (serves the built React app):
```bash
npm run build  # Build the React app first
npm start      # Start the Express server
```

## Project Structure

```
website/
├── public/           # Static assets and HTML template
│   ├── css/         # CSS stylesheets
│   ├── js/          # Original JavaScript files (legacy)
│   └── index.html   # React entry point
├── src/             # React source code
│   ├── components/  # React components
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Subjects.js
│   │   ├── Math.js
│   │   ├── Quiz.js
│   │   └── QuizTaking.js
│   ├── App.js       # Main App component
│   ├── App.css      # App styles
│   └── index.js     # React entry point
├── build/           # Production build (generated)
├── server.js        # Express server
└── package.json     # Dependencies and scripts
```

## Features

- **React Router**: Client-side routing between pages
- **MathJax Integration**: LaTeX math rendering support
- **Responsive Design**: Works on desktop and mobile
- **Authentication**: Pass-through authentication system
- **Quiz System**: Create and take quizzes
- **Progress Tracking**: User progress and statistics

## Available Scripts

- `npm run react-start`: Start React development server
- `npm run react-build`: Build React app for production
- `npm run react-test`: Run React tests
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## Backend Integration

The React app integrates with the Java backend API running on port 4072. Make sure the backend is running before using the full features.

## Migration Notes

This React version replaces the original HTML/CSS/JavaScript implementation with:
- Single Page Application (SPA) architecture
- Component-based UI development
- State management with React hooks
- Client-side routing
- Better code organization and maintainability 


domain nam: 

- sparksio.com 
