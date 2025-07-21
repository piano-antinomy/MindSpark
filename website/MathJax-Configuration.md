# MathJax Configuration & JSON Structure Guide

## Overview

This project uses **MathJax 3.x** for rendering LaTeX mathematical expressions across the web application. MathJax is configured consistently across multiple files to ensure proper rendering of mathematical content in questions, lessons, and assessments.

## Current Configuration

### Basic Setup

All MathJax configurations follow this pattern:

```javascript
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        packages: {'[+]': ['textmacros']}        
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
    }
};
```

### Script Loading

```html
<script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
```

## JSON Question Structure

### Expected JSON Format

```json
{
  "id": "amc_2014_8_5",
  "question": {
    "text": "<p>Question text with <INSERTION_INDEX_1> placeholders for dynamic content.</p>",
    "insertions": {
      "INSERTION_INDEX_1": {
        "picture": "//latex.artofproblemsolving.com/image.png",
        "alt_type": "latex",
        "alt_value": "$\\textdollar 150$"
      }
    },
    "type": "multiple-choice",
    "text_choices": [],
    "picture_choices": [],
    "latex_choices": [
      "$\\textbf{(A) } \\mbox{choice text} \\qquad \\textbf{(B) } \\mbox{choice text} \\qquad \\textbf{(C) } \\mbox{choice text} \\qquad \\textbf{(D) } \\mbox{choice text} \\qquad \\textbf{(E) } \\mbox{choice text}$"
    ],
    "asy_choices": []
  },
  "answer": "B",
  "solutions": [...]
}
```

### Key JSON Fields

- **`text`**: Question text with `<INSERTION_INDEX_N>` placeholders
- **`insertions`**: Dynamic content (numbers, formulas, images) to insert into question text
- **`latex_choices`**: Single string with all 5 multiple-choice options separated by `\qquad`
- **`alt_type`**: "latex" for LaTeX content, "image" for images
- **`alt_value`**: LaTeX content (e.g., `"$\\textdollar 150$"` for dollar amounts)

## LaTeX Preprocessing

### Where to Update Preprocessing

**File**: `website/public/js/question-renderer.js`

**Function**: `preprocessLatexText(text)`

### Current Preprocessing Rules

```javascript
// Replace \textsc{...} with \text{...}
processedText = processedText.replace(/\\textsc\{([^}]*)\}/g, '\\text{$1}');

// Replace \emph{...} with \textit{...}
processedText = processedText.replace(/\\emph\{([^}]*)\}/g, '\\textit{$1}');

// Replace \overarc{...} with \overparen{...}
processedText = processedText.replace(/\\overarc\{([^}]*)\}/g, '\\overparen{$1}');

// Replace \textdollar with \text{\$} for proper dollar sign rendering
processedText = processedText.replace(/\\textdollar/g, '\\text{\\$}');

// Ensure \mbox{} preserves spaces by adding explicit space commands
processedText = processedText.replace(/\\mbox\{([^}]*)\}/g, function(match, content) {
    return '\\mbox{' + content.replace(/\s+/g, '\\ ') + '}';
});
```

### Adding New Preprocessing Rules

1. Add new regex replacement in `preprocessLatexText()` function
2. Test with sample LaTeX content
3. Update this documentation

## Configuration Details

### TeX Input Processor

- **Inline Math**: `$...$` and `\(...\)`
- **Display Math**: `$$...$$` and `\[...\]`
- **Process Escapes**: `true` - handles escaped characters
- **Process Environments**: `true` - processes LaTeX environments

### Options

- **Skip HTML Tags**: Prevents MathJax from processing content in script, noscript, style, textarea, and pre tags

## JavaScript Integration

### Question Renderer Module

The `question-renderer.js` module handles MathJax integration:

```javascript
class QuestionRenderer {
    constructor() {
        this.mathJaxReady = false;
        this.initializeMathJax();
    }

    async renderLatexContent(element) {
        if (!this.mathJaxReady || typeof MathJax === 'undefined') {
            return Promise.resolve();
        }
        try {
            await MathJax.typesetPromise([element]);
        } catch (error) {
            console.warn('MathJax rendering error:', error);
        }
    }
}
```

## Common LaTeX Patterns

### Dollar Amounts
```latex
$\\textdollar 150$  // Renders as $150
```

### Multiple Choice Options
```latex
$\\textbf{(A) } \\mbox{option text} \\qquad \\textbf{(B) } \\mbox{option text}$
```

### Fractions and Math
```latex
$\\frac{5}{19} < \\frac{7}{21} < \\frac{9}{23}$
```

## Best Practices

1. **JSON Structure**: Use single string for `latex_choices` with `\qquad` separators
2. **Insertions**: Extract numbers/formulas from text into insertions for proper LaTeX handling
3. **Preprocessing**: Add new LaTeX commands to `preprocessLatexText()` function
4. **Spacing**: Use `\mbox{}` with explicit `\ ` spaces for text content
5. **Debug**: Enable `QUESTION_RENDERER_DEBUG = true` for troubleshooting

## Troubleshooting

### Common Issues

1. **No spaces in text**: Use `\mbox{}` with explicit `\ ` spaces
2. **Dollar signs not rendering**: Use `\\textdollar` in JSON, converts to `\\text{\\$}`
3. **Choices not splitting**: Ensure `latex_choices` uses `\qquad` separators
4. **MathJax errors**: Check browser console and LaTeX syntax

### Debug Mode

Enable in `question-renderer.js`:
```javascript
const QUESTION_RENDERER_DEBUG = true;
```

## Files to Modify

- **JSON Structure**: `backend-java/resources/math/questions/AMC_*/`
- **LaTeX Preprocessing**: `website/public/js/question-renderer.js`
- **MathJax Config**: `website/public/math.html`, `website/public/math-simple.html` 