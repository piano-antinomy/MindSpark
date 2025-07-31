# AMC Question JSON Structure

## Top Level Structure
```json
{
  "competition_info": { ... },
  "problems": [ ... ]
}
```

## Competition Info
```json
{
  "name": "2003_AMC_10A",
  "group": "AMC_10",
  "year": 2003,
  "is_AJHSME": false,
  "level": "10",
  "suffix": "A",
  "fall_version": false,
  "total_problems": 25,
  "problem_number_override": null
}
```

## Problem Structure
```json
{
  "id": "amc_2003_10a_1",
  "question": {
    "text": "<p>Question text with <INSERTION_INDEX_1> markers</p>",
    "insertions": {
      "INSERTION_INDEX_1": {
        "picture": "//latex.artofproblemsolving.com/...",
        "alt_type": "latex",
        "alt_value": "$2003$",
        "width": "35",
        "height": "12"
      }
    },
    "type": "multiple-choice",
    "text_choices": [],
    "picture_choices": [
      {
        "uri": "//latex.artofproblemsolving.com/...",
        "width": "396",
        "height": "18"
      }
    ],
    "latex_choices": [
      "$\\mathrm{(A) \\ } 0\\qquad \\mathrm{(B) \\ } 1\\qquad ...$"
    ],
    "choice_space": 0.5,
    "asy_choices": []
  },
  "tags": [],
  "sources": [],
  "answer": "D",
  "solutions": [
    {
      "text": "<p>Solution text with <INSERTION_INDEX_1> markers</p>",
      "insertions": { ... }
    }
  ],
  "categorization": {
    "category": "algebra",
    "sub_category": "basic_operations",
    "confidence": 0.95
  }
}
```

## Backend Java API Structure

### Question.java Model
```java
public class Question {
    private String id;
    private QuestionDetails question;
    private List<String> tags;
    private List<String> sources;
    private String answer;
    private List<Solution> solutions;
    
    public static class QuestionDetails {
        private String text;
        private Map<String, Insertion> insertions;
        private String type;
        private List<String> textChoices;
        private List<PictureChoice> pictureChoices;
        private List<String> latexChoices;
        private Double choiceSpace;  // Added field
        private List<String> asyChoices;
    }
    
    public static class Insertion {
        private String picture;
        private String altType;
        private String altValue;
        private String width;
        private String height;
    }
    
    public static class PictureChoice {
        private String uri;
        private String width;
        private String height;
    }
    
    public static class Solution {
        private int solutionId;
        private String type;
        private List<String> value;
    }
}
```

## Key Components

### Insertions
- Replace `<INSERTION_INDEX_N>` markers in text
- Contain LaTeX images with alt text
- Used in both question text and solutions

### Choice Types
- **text_choices**: Plain text options (usually empty)
- **picture_choices**: Image-based choices
- **latex_choices**: LaTeX formatted choices
- **choice_space**: Layout spacing control (Double, typically 0.5)
- **asy_choices**: Asymptote graphics (usually empty)

### Solutions
- Array of solution objects
- Each has text with insertion markers
- Multiple solutions per problem possible

### Categorization
- **category**: Main topic (algebra, geometry, etc.)
- **sub_category**: Specific subtopic
- **confidence**: Classification confidence (0.95 typical)

## Backend API Response Format
All backend APIs return similar structure:
```json
{
  "success": true,
  "questions": [
    // Array of problem objects from JSON files
  ]
}
```

## Edge Cases
- **Empty choices**: Some problems have no text_choices
- **Missing insertions**: Some text may not use insertion markers
- **Multiple solutions**: Problems can have 1+ solution objects
- **Choice spacing**: `choice_space` field for layout control (Double, nullable)
- **Missing fields**: Some problems may not have all choice types 