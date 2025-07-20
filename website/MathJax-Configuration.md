# MathJax Configuration Guide

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

## Configuration Details

### TeX Input Processor

- **Inline Math**: `$...$` and `\(...\)`
- **Display Math**: `$$...$$` and `\[...\]`
- **Process Escapes**: `true` - handles escaped characters
- **Process Environments**: `true` - processes LaTeX environments
- **Packages**: None currently - using basic configuration

### Options

- **Skip HTML Tags**: Prevents MathJax from processing content in script, noscript, style, textarea, and pre tags

## Extensions Used

**None currently** - The project uses the basic MathJax configuration without additional extensions.

### Note on textmacros Extension

The textmacros extension was attempted but caused rendering errors. The basic `tex-mml-chtml.js` bundle doesn't include this extension by default, and loading it separately caused compatibility issues.

**Current approach**: Manual preprocessing in JavaScript handles text formatting commands:
- `\textsc{}` → `\text{}` (small caps to regular text)
- `\emph{}` → `\textit{}` (emphasis to italic text)

## Files with MathJax Configuration

1. **`website/public/math.html`** - Main mathematics learning page
2. **`website/public/math-simple.html`** - Simplified math page
3. **`scripts/python/demo/json_to_html.py`** - Python script for generating HTML from JSON
4. **`scripts/python/demo/output.html`** - Generated demo output

## JavaScript Integration

### Question Renderer Module

The `question-renderer.js` module handles MathJax integration:

```javascript
class QuestionRenderer {
    constructor() {
        this.mathJaxReady = false;
        this.initializeMathJax();
    }

    initializeMathJax() {
        if (typeof MathJax !== 'undefined') {
            this.mathJaxReady = true;
            questionDebugLog('MathJax initialized successfully');
        } else {
            questionDebugLog('MathJax not available');
        }
    }

    async renderLatexContent(element) {
        if (!this.mathJaxReady || typeof MathJax === 'undefined') {
            questionDebugLog('MathJax not available for rendering');
            return Promise.resolve();
        }

        try {
            questionDebugLog('Rendering LaTeX content in element:', element);
            await MathJax.typesetPromise([element]);
            questionDebugLog('LaTeX rendering completed successfully');
        } catch (error) {
            console.warn('MathJax rendering error:', error);
        }
    }
}
```

## Usage Examples

### Inline Math
```html
<p>The formula $E = mc^2$ represents Einstein's mass-energy equivalence.</p>
```

### Display Math
```html
<p>The quadratic formula is:</p>
$$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

### Text Formatting (with preprocessing)
```html
<p>Consider the set $\text{Real Numbers}$ and the subset $\textbf{Positive Integers}$.</p>
<p>The $\textit{double factorial}$ is defined as $n!! = n \cdot (n-2) \cdot (n-4) \cdots$</p>
```

## Best Practices

1. **Consistent Configuration**: Use the same MathJax configuration across all files
2. **Async Loading**: Always use `async` attribute when loading MathJax script
3. **Error Handling**: Implement proper error handling for MathJax rendering
4. **Debug Logging**: Use debug logging to track MathJax initialization and rendering
5. **Preprocessing**: Minimize manual LaTeX preprocessing when extensions can handle it

## Troubleshooting

### Common Issues

1. **MathJax not loading**: Check if the CDN URL is accessible
2. **Rendering errors**: Verify LaTeX syntax and check browser console
3. **Text formatting not working**: Check that preprocessing is converting `\textsc{}` to `\text{}`
4. **Performance issues**: Consider lazy loading for large amounts of mathematical content

### Debug Mode

Enable debug logging in `question-renderer.js`:

```javascript
const QUESTION_RENDERER_DEBUG = true;
```

## Future Enhancements

Potential extensions to consider:
- **physics** - For physics notation
- **color** - For colored mathematical expressions
- **ams** - For additional AMS symbols and environments
- **noerrors** - To suppress error messages

## References

- [MathJax 3.x Documentation](https://docs.mathjax.org/en/latest/)
- [TeX Input Processor](https://docs.mathjax.org/en/latest/input/tex/index.html)
- [Textmacros Extension](https://docs.mathjax.org/en/latest/input/tex/extensions/textmacros.html) 