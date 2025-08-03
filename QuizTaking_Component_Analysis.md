# QuizTaking.js Component Analysis

## Core State & API
```javascript
// State variables
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [selectedAnswers, setSelectedAnswers] = useState({});
const [quizStarted, setQuizStarted] = useState(false);
const [quizCompleted, setQuizCompleted] = useState(false);
const [timeRemaining, setTimeRemaining] = useState(0);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [currentQuiz, setCurrentQuiz] = useState(null);
const [questions, setQuestions] = useState([]);
const [parsedQuestions, setParsedQuestions] = useState([]);

// API endpoints
const JAVA_API_BASE_URL = `http://${window.location.hostname}:4072/api`;
// /quiz/user/{username}/quiz/{quizId} - existing quiz
// /quiz/user/{username}/quiz/{quizId}/questions - quiz questions  
// /questions/math/level/{level}/year/{year} - new quiz questions
```

## Loading Paths & Edge Cases

### Authentication
```javascript
const checkAuthStatus = () => {
  const currentUser = localStorage.getItem('currentUser');
  return currentUser ? JSON.parse(currentUser) : null; // Could throw JSON.parse error
};
// Redirects to /login if no user
```

### Two Loading Paths
```javascript
// Path 1: Existing quiz via URL parameter
const urlParams = new URLSearchParams(location.search);
const quizId = urlParams.get('quizId');
if (quizId) {
  loadQuiz(quizId); // Loads quiz data + questions
}

// Path 2: New quiz via location state
const quiz = location.state?.quiz;
if (quiz) {
  setCurrentQuiz(quiz);
  loadQuestionsFromQuiz(quiz); // Loads questions by level/year
}
```

### Level Mapping
```javascript
const levelMap = { 'AMC_8': 1, 'AMC_10': 2, 'AMC_12': 3 };
const level = levelMap[quiz.level] || 1; // Fallback to level 1
```

## Question Processing
```javascript
// Parse questions when they change
const parsed = questions.map((question, index) => 
  questionParser.parseQuestion(question, index)
);

// MathJax rendering strategies
useLayoutEffect(() => {
  if (quizStarted && parsedQuestions.length > 0) {
    safeMathJaxTypeset().catch(() => {
      setTimeout(() => safeMathJaxTypeset(), 50);
    });
  }
}, [quizStarted, currentQuestionIndex, parsedQuestions]);

const safeMathJaxTypeset = () => {
  if (window.MathJax && window.MathJax.typesetPromise) {
    return window.MathJax.typesetPromise().catch(error => {
      console.warn('MathJax typesetting error:', error);
    });
  }
  return Promise.resolve();
};
```

## Choice Rendering Logic
```javascript
const renderChoices = (question) => {
  // Edge case: No choices
  if ((!question.choices || question.choices.length === 0) && !question.isDummyChoices) {
    return <p>No choices available for this question.</p>;
  }

  // Edge case: Dummy choices (A, B, C, D, E)
  if (question.isDummyChoices) {
    return question.choices.map((choice, choiceIndex) => {
      const choiceValue = String.fromCharCode(65 + choiceIndex);
      // ... rendering with correct/incorrect indicators
    });
  }

  // Edge case: Image choices (show image in question, A-E as buttons)
  if (question.isImageChoice) {
    return ['A', 'B', 'C', 'D', 'E'].map((letter) => {
      // ... rendering letter choices only
    });
  }

  // Regular choices (text or LaTeX)
  return question.choices.map((choice, choiceIndex) => {
    const choiceValue = String.fromCharCode(65 + choiceIndex);
    return (
      <label>
        <input type="radio" disabled={quizCompleted} />
        {question.isTextChoice ? (
          <span>{choice}</span> // Plain text
        ) : (
          <span dangerouslySetInnerHTML={{ __html: choice }} /> // LaTeX
        )}
        {/* Correct/Incorrect indicators when quizCompleted */}
      </label>
    );
  });
};
```

## Question Content Rendering
```javascript
// Insertion processing (<INSERTION_INDEX_1>)
<div dangerouslySetInnerHTML={{ __html: question.questionText }} />

// Image integration for image choices
{question.isImageChoice && question.choices && (
  <div className="question-image-container">
    {question.choices.map((choice) => {
      const style = choice.width && choice.height ? 
        { width: `${choice.width}px`, height: `${choice.height}px` } : {};
      return <img src={choice.uri} style={style} />;
    })}
  </div>
)}

// Solution display when quiz completed
{quizCompleted && question.solution && (
  <div dangerouslySetInnerHTML={{ __html: question.solution }} />
)}
```

## State Management Edge Cases

### Answer Persistence
```javascript
// Load existing quiz progress
const answers = {};
if (currentQuiz?.questionIdToAnswer) {
  Object.keys(currentQuiz.questionIdToAnswer).forEach(questionId => {
    const answer = currentQuiz.questionIdToAnswer[questionId];
    if (answer) {
      answers[questionId] = answer;
    }
  });
}
setSelectedAnswers(answers);
```

### Timer Management
```javascript
// Auto-submit when timer expires
setTimeRemaining(prev => {
  if (prev <= 1) {
    completeQuiz();
    return 0;
  }
  return prev - 1;
});
```

### Save Functionality
```javascript
// NOT IMPLEMENTED - placeholder
onClick={() => console.log('Save functionality to be implemented')}
```

## Layout Proportions & choice_vertical Flag

### Layout Types
- **Side-by-side**: Question body (66.7%) vs Multiple choice (33.3%) - width-based
- **Vertical**: Question body stacked above choices - full width for both sections
- **Dynamic Layout**: Uses `choiceSpace` field for custom allocation (only in side-by-side mode)

### choice_vertical Flag
```javascript
// Layout decision based on choice_vertical flag
{question.choiceVertical ? (
  // Vertical layout: question content stacked above choices
  <div className="flex flex-col gap-3 lg:gap-4 flex-1 min-h-0">
    {/* Question content section - scrollable */}
    <div className="flex-1 overflow-y-auto min-h-0">
      {renderQuestionContent(question)}
    </div>
    
    {/* Choices section - below question content */}
    <div className="flex-shrink-0">
      <div className="choices-container space-y-2 lg:space-y-3 p-3 lg:p-6">
        {renderChoices(question)}
      </div>
    </div>
  </div>
) : (
  // Side-by-side layout: question and choices side by side
  <div className="flex gap-3 lg:gap-4 flex-1 min-h-0">
    {/* Dynamic width allocation using choiceSpace */}
    <div style={{ width: question.choiceSpace ? `${(1 - question.choiceSpace) * 100}%` : '66.667%' }}>
      {renderQuestionContent(question)}
    </div>
    <div style={{ width: question.choiceSpace ? `${question.choiceSpace * 100}%` : '33.333%' }}>
      {renderChoices(question)}
    </div>
  </div>
)}
```

### Device Detection & Separate Layouts
```javascript
// Desktop layout (window.innerWidth >= 1024 && !iPad)
const isDesktop = window.innerWidth >= 1024 && !navigator.userAgent.includes('iPad');

// Mobile/iPad layout (window.innerWidth < 1024 || iPad)
const isMobile = window.innerWidth < 1024 || navigator.userAgent.includes('iPad');

// Separate rendering paths for different devices
{isDesktop ? (
  <div className="lg:p-4 h-full">
    {renderQuestion(parsedQuestions[currentQuestionIndex])}
  </div>
) : (
  <div className="p-3" style={{ height: 'calc(100vh - 60px)' }}>
    {/* Mobile-specific layout with different styling */}
    {renderMobileQuestion(parsedQuestions[currentQuestionIndex])}
  </div>
)}
```

### choiceSpace Field Usage
- **Side-by-side mode**: `choiceSpace` controls width allocation between question and choices
- **Vertical mode**: `choiceSpace` is ignored (both sections use full width)
- **Example**: `choiceSpace = 0.4` → question=60%, choices=40% width (side-by-side only)

## Error Handling
```javascript
// Network errors
} catch (error) {
  setError('Failed to connect to the server. Please check your connection and try again.');
  setLoading(false);
}

// Data validation
if (response.status === 404) {
  setError('Quiz not found. Please check the quiz ID or create a new quiz.');
  setLoading(false);
}
```

## Score Calculation
```javascript
const calculateScore = () => {
  let correct = 0;
  parsedQuestions.forEach(question => {
    if (selectedAnswers[question.id] === question.answer) {
      correct++;
    }
  });
  return Math.round((correct / parsedQuestions.length) * 100);
};

// Results display
const correctAnswers = parsedQuestions.filter(q => 
  selectedAnswers[q.id] === q.answer
).length;
```

## Quiz States
1. **No Quiz Data**: Redirect to quiz management
2. **Loading**: Show spinner
3. **Start Screen**: Quiz info + instructions
4. **Quiz Taking**: Question + choices + timer
5. **Results**: Score + review + correct/incorrect indicators

## Critical Debugging Points

### 1. QuestionParser Dependency
- Component relies heavily on `questionParser.parseQuestion()`
- Parsing failures will break rendering
- Check parsed question structure for debugging

### 2. MathJax Timing
- Multiple useEffect hooks for MathJax rendering
- Timing-sensitive - failures trigger retry mechanisms
- Check browser console for MathJax errors

### 3. State Synchronization
- Complex state between raw data, parsed data, and user selections
- State updates can cause rendering issues
- Check state consistency during debugging

### 4. Responsive Layout
- Device detection logic is complex
- Layout switching can cause rendering issues
- Test on different devices/screen sizes

### 5. Error Recovery
- Multiple error handling layers
- Network failures, data corruption, parsing errors
- Check error state and recovery mechanisms

### 6. Authentication Issues
- JSON.parse errors in checkAuthStatus
- Missing user redirects
- Session expiration handling

### 7. Loading Path Conflicts
- URL parameter vs location state loading
- Different API endpoints for different paths
- Error handling varies by loading method

### 8. Unimplemented Features
- Save functionality is placeholder
- No actual save/load of progress
- Timer continues even without save