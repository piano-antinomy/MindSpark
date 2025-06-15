# Java Backend Integration with Frontend

## Overview

The MindSpark learning platform has been updated to use the Java backend instead of the Python backend for mathematics questions. This integration provides better performance, structured question handling, and proper LaTeX rendering.

## 🔄 Changes Made

### Backend Configuration
- **Port**: Java backend runs on port 4072
- **API Base**: `/api/questions/math/`
- **Question Structure**: Uses structured JSON format with insertions and multiple choice types

### Frontend Updates

#### 1. **API Configuration (math.js)**
```javascript
// Java Backend API Configuration
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;
const API_CONFIG = {
    backend: 'java',
    baseUrl: JAVA_API_BASE_URL
};
```

#### 2. **New Functions Added**
- `loadAvailableLevels()` - Gets available math levels from Java backend
- `loadQuestionsByLevel(level)` - Loads questions for specific level
- `processQuestionText()` - Handles insertion replacements (e.g., [INSERTION_INDEX_1])
- `renderLatexContent()` - Renders LaTeX mathematics using MathJax
- `extractQuestionChoices()` - Extracts choices from question structure
- `renderQuestion()` - Renders questions with proper formatting

#### 3. **Question Rendering Features**
- **Insertion Replacement**: Automatically replaces [INSERTION_INDEX_1] markers with actual content
- **LaTeX Support**: Full MathJax integration for mathematical expressions
- **Multiple Choice Types**: Supports text_choices, latex_choices, and picture_choices
- **Image Support**: Displays mathematical diagrams and figures
- **Responsive Design**: Mobile-friendly question layout

#### 4. **Enhanced UI Components**
- Level selection interface
- Improved question cards with better typography
- Enhanced choice buttons with hover effects
- Progress indicators and navigation
- Error handling and loading states

## 📊 API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/questions/math` | GET | Get available levels and question counts |
| `/api/questions/math/level/{level}` | GET | Get questions for specific level (1-3) |
| `/api/questions/math/health` | GET | Health check endpoint |

## 🎨 New CSS Styles

Added `math-java.css` with:
- Level selection grid layout
- Enhanced question card styling
- Choice button animations
- LaTeX content formatting
- Responsive design for mobile devices
- Loading and error state styling

## 🧮 MathJax Integration

Added MathJax 3.0 for LaTeX rendering:
```javascript
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true
    }
};
```

## 🔧 Question Processing

### Insertion Replacement
Questions can contain markers like `[INSERTION_INDEX_1]` which get replaced with:
- LaTeX expressions for mathematical content
- Images for diagrams and figures
- Alternative text for accessibility

### Example Question Structure
```json
{
  "id": "amc_2023_1",
  "question": {
    "text": "What is the value of [INSERTION_INDEX_1] ?",
    "insertions": {
      "INSERTION_INDEX_1": {
        "alt_type": "latex",
        "alt_value": "$(8 \\times 4 + 2) - (8 + 4 \\times 2)$"
      }
    },
    "latex_choices": [
      "$\\textbf{(A)}\\ 0 \\qquad \\textbf{(B)}\\ 6 \\qquad \\textbf{(C)}\\ 10 \\qquad \\textbf{(D)}\\ 18$"
    ]
  },
  "answer": "D"
}
```

## 🚀 User Flow

1. **Level Selection**: User sees available math levels (1, 2, 3)
2. **Question Loading**: Questions load from Java backend for selected level
3. **Question Display**: Questions render with LaTeX and proper formatting
4. **Answer Selection**: User selects from multiple choice options
5. **Navigation**: Next/Submit buttons appear based on progress
6. **Results**: Completion status and scoring displayed

## 🔒 Security & Error Handling

- CORS enabled for cross-origin requests
- Graceful error handling for API failures
- Loading states for better UX
- Fallback content when LaTeX rendering fails

## 📱 Responsive Design

- Mobile-optimized question layout
- Touch-friendly choice buttons
- Scalable mathematical content
- Adaptive grid layouts for different screen sizes

## 🧪 Testing

To test the integration:

1. **Start Java Backend**:
   ```bash
   cd backend-java
   ./run.sh  # or run.bat on Windows
   ```

2. **Start Frontend**:
   ```bash
   cd website
   npm start
   ```

3. **Test Endpoints**:
   ```bash
   # Check health
   curl http://localhost:4072/api/questions/math/health
   
   # Get levels
   curl http://localhost:4072/api/questions/math
   
   # Get level 1 questions
   curl http://localhost:4072/api/questions/math/level/1
   ```

## 📈 Benefits

- **Performance**: Java backend provides better performance for question loading
- **Structure**: Organized question data with proper categorization
- **Mathematics**: Full LaTeX support for complex mathematical expressions
- **Scalability**: Easy to add new question types and levels
- **Maintenance**: Clear separation between frontend and backend logic

## 🔮 Future Enhancements

- Real-time answer validation
- Progress tracking across sessions
- Advanced LaTeX equation editing
- Support for additional subjects (science, history, etc.)
- Question difficulty adaptation based on performance 