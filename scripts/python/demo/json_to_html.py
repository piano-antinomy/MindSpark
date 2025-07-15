#!/usr/bin/env python3
"""
JSON to HTML Converter for Math Questions
Converts JSON question files to HTML with LaTeX rendering and insertion processing.
"""

import json
import os
import re
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

def process_latex_content(content: str) -> str:
    """Process LaTeX content and fix common escaping issues."""
    if not content:
        return content
    
    # Only fix commands that are missing backslashes (not already properly escaped)
    # Be careful not to double-escape already correct LaTeX
    
    # Fix tab characters that should be \t
    content = content.replace('\t', '\\t')
    
    # Only add backslashes if they're missing (avoid double-escaping)
    # Use word boundaries to avoid partial matches
    import re
    
    # Fix \times only if it appears as "times" (missing backslash)
    content = re.sub(r'\btimes\b', r'\\times', content)
    
    # Fix \text only if it appears as "text" (missing backslash) 
    content = re.sub(r'\btext\b', r'\\text', content)
    
    # Fix \frac only if it appears as "frac" (missing backslash)
    content = re.sub(r'\bfrac\b', r'\\frac', content)
    
    return content

def fix_image_url(url: str) -> str:
    """Fix image URLs that start with // by adding https: protocol."""
    if url.startswith('//'):
        return 'https:' + url
    return url

def process_choice_latex(choice_text: str) -> str:
    """Process LaTeX content in choice text for proper MathJax rendering."""
    if not choice_text:
        return choice_text
    
    print(f"PROCESS_CHOICE_LATEX INPUT: '{choice_text}'")
    
    # Fix common LaTeX escaping issues
    processed_text = process_latex_content(choice_text)
    print(f"AFTER PROCESS_LATEX_CONTENT: '{processed_text}'")
    
    # If already has delimiters, return as-is
    if processed_text.startswith('$') or processed_text.startswith('\\('):
        return processed_text
    
    # Check for mathematical content that needs LaTeX rendering
    needs_latex = False
    
    # Check for common LaTeX patterns
    latex_indicators = [
        '\\frac', '\\circ', '\\text', '\\sqrt', '\\pi', '\\alpha', '\\beta', '\\gamma',
        'frac{', 'sqrt{', '\\\\', '^', '_', '\\le', '\\ge', '\\ne', '\\pm'
    ]
    
    import re
    
    # Check for other LaTeX indicators first
    if any(indicator in processed_text for indicator in latex_indicators):
        needs_latex = True
    
    # Check for fraction patterns like frac14, frac23, etc. (without backslash)
    if re.search(r'frac(\d)(\d)', processed_text):
        needs_latex = True
        # Fix patterns like frac14 -> \frac{1}{4}, frac23 -> \frac{2}{3}
        processed_text = re.sub(r'frac(\d)(\d)', r'\\frac{\1}{\2}', processed_text)
    
    # Check for malformed fractions like frac{1}{4} (without backslash)
    if re.search(r'frac\{(\d+)\}\{(\d+)\}', processed_text):
        needs_latex = True
        processed_text = re.sub(r'frac\{(\d+)\}\{(\d+)\}', r'\\frac{\1}{\2}', processed_text)
    
    # Check for pi patterns
    if '\\pi' in processed_text or 'pi' in processed_text:
        needs_latex = True
        processed_text = processed_text.replace('\\pi', '\\pi')
    
    # Check for mathematical expressions with +, -, *, /, =, etc.
    if re.search(r'[\+\-\*/=<>]', processed_text) and any(c.isdigit() for c in processed_text):
        needs_latex = True
    
    if needs_latex:
        result = f'\\({processed_text}\\)'
        print(f"PROCESS_CHOICE_LATEX OUTPUT (WITH LATEX): '{result}'")
        return result
    
    print(f"PROCESS_CHOICE_LATEX OUTPUT (NO LATEX): '{processed_text}'")
    return processed_text

def process_insertions(question_text: str, insertions: Dict[str, Any]) -> str:
    """Process insertion markers in question text, similar to math.js logic."""
    if not insertions:
        return question_text
    
    processed_text = question_text
    
    for marker, insertion in insertions.items():
        marker_pattern = f"<{marker}>"
        
        if insertion.get('alt_type') == 'latex' and insertion.get('alt_value'):
            latex_content = process_latex_content(insertion['alt_value'])
            
            # Check if latex_content already has delimiters
            if latex_content.startswith('$') and latex_content.endswith('$'):
                # Already has $ delimiters, use as-is
                replacement = latex_content
            elif latex_content.startswith('\\(') and latex_content.endswith('\\)'):
                # Already has \( \) delimiters, use as-is
                replacement = latex_content
            elif latex_content.startswith('\\[') and latex_content.endswith('\\]'):
                # Already has \[ \] delimiters (display math), use as-is
                replacement = latex_content
            else:
                # No delimiters, add \( \) for inline math
                replacement = f"\\({latex_content}\\)"
                
        elif insertion.get('alt_type') == 'asy' and insertion.get('picture'):
            # Handle Asymptote diagrams - use picture field for asy type, don't show ASY code
            picture_url = fix_image_url(insertion['picture'])
            alt_text = 'Question diagram'  # Don't show ASY code as alt text
            replacement = f'<img src="{picture_url}" alt="{alt_text}" class="question-image" />'
            
        elif insertion.get('picture'):
            # Use picture URL for other types
            picture_url = fix_image_url(insertion['picture'])
            alt_text = insertion.get('alt_value', 'Question image')
            replacement = f'<img src="{picture_url}" alt="{alt_text}" class="question-image" />'
            
        elif insertion.get('alt_value'):
            # Use alternative text value
            replacement = insertion['alt_value']
        else:
            # No valid content found, keep marker as-is
            continue
            
        processed_text = processed_text.replace(marker_pattern, replacement)
    
    return processed_text

def parse_latex_choices(choices_text: str) -> List[str]:
    """Parse LaTeX choices separated by \\qquad."""
    if not choices_text:
        return []
    
    print(f"PARSE_LATEX_CHOICES INPUT: '{choices_text}'")
    
    # Remove outer $ delimiters if present
    choices_text = choices_text.strip()
    if choices_text.startswith('$') and choices_text.endswith('$'):
        choices_text = choices_text[1:-1]
    
    print(f"AFTER REMOVING $ DELIMITERS: '{choices_text}'")
    
    # Split by \qquad and clean up
    choices = re.split(r'\\qquad\s*', choices_text)
    
    print(f"SPLIT BY QQUAD: {choices}")
    
    # Clean up each choice
    cleaned_choices = []
    for i, choice in enumerate(choices):
        original_choice = choice
        choice = choice.strip()
        if choice:
            # Remove existing choice labels like \textbf{(A)}, \mathrm{(A)}, or \text{(A)} if present
            choice = re.sub(r'\\textbf\{[^}]+\}\\?\s*', '', choice)
            choice = re.sub(r'\\mathrm\{[^}]+\}\\?\s*', '', choice)
            choice = re.sub(r'\\text\{[^}]+\}\\?\s*', '', choice)
            # Clean up any remaining whitespace and standalone backslashes, but preserve LaTeX commands
            choice = choice.strip()
            # Remove standalone backslashes at the start (like "\ " but not "\frac")
            choice = re.sub(r'^\\(?![a-zA-Z])', '', choice).strip()
            print(f"CHOICE {i}: '{original_choice}' -> '{choice}'")
            if choice:
                cleaned_choices.append(choice)
    
    print(f"FINAL CLEANED CHOICES: {cleaned_choices}")
    return cleaned_choices

def process_question_choices(question: Dict[str, Any]) -> tuple[List[str], str]:
    """Extract and process choices from question object. Returns (choices, choice_type)."""
    choices = []
    choice_type = "text"  # "text" or "image"
    
    
    # First, try latex_choices field
    if 'latex_choices' in question and question['latex_choices']:
        choice_data = question['latex_choices']
        if isinstance(choice_data, list):
            # If it's a list, check if it contains a single string with all choices
            if len(choice_data) == 1 and isinstance(choice_data[0], str):
                # Parse the single string containing all choices
                choices = parse_latex_choices(choice_data[0])
            else:
                # Multiple separate choices
                choices = choice_data
        elif isinstance(choice_data, str):
            # Parse LaTeX choices
            choices = parse_latex_choices(choice_data)
        choice_type = "text"
    
    # If no latex_choices, try picture_choices
    elif 'picture_choices' in question and question['picture_choices']:
        picture_choices = question['picture_choices']
        if len(picture_choices) == 1:
            # Single image contains all choices - display image and provide A-E labels
            choices = picture_choices
            choice_type = "single_image_all_choices"
        else:
            # Multiple images, each is a separate choice
            choices = picture_choices
            choice_type = "image"
    
    # Fallback to other possible choice field names
    else:
        choice_fields = ['choices', 'options', 'answers']
        
        for field in choice_fields:
            if field in question:
                choice_data = question[field]
                if isinstance(choice_data, list):
                    choices = choice_data
                    break
                elif isinstance(choice_data, str):
                    # Parse LaTeX choices
                    choices = parse_latex_choices(choice_data)
                    break
        
        # If no choices found, try to extract from question text
        if not choices and 'question' in question:
            question_text = question['question'].get('text', '')
            # Look for choice patterns in the text
            choice_pattern = r'\\textbf\{[^}]+\}[^\\]*(?=\\textbf\{|$)'
            matches = re.findall(choice_pattern, question_text)
            if matches:
                choices = parse_latex_choices('\\qquad'.join(matches))
    
    return choices, choice_type

def generate_html_page(question_file_data: Dict[str, Any], output_path: str) -> None:
    """Generate a complete HTML page for all questions in a JSON file."""
    
    competition_info = question_file_data.get('competition_info', {})
    problems = question_file_data.get('problems', [])
    
    # Extract competition details
    competition_name = competition_info.get('name', 'Math Questions')
    year = competition_info.get('year', '')
    total_problems = competition_info.get('total_problems', len(problems))
    
    # Start building HTML
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{competition_name} - Math Questions</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }}
        .header h1 {{
            color: #2c3e50;
            margin-bottom: 10px;
        }}
        .header .info {{
            color: #7f8c8d;
            font-size: 14px;
        }}
        .question {{
            margin-bottom: 40px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
        }}
        .question-header {{
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .question-text {{
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.8;
        }}
                 .question-image {{
             max-width: 100%;
             height: auto;
             display: block;
             margin: 15px auto;
             border: 1px solid #ddd;
             border-radius: 4px;
         }}
         .choice-image {{
             max-width: 200px;
             height: auto;
             display: inline-block;
             margin-left: 10px;
             border: 1px solid #ddd;
             border-radius: 4px;
         }}
         .choices-image-container {{
             text-align: center;
             margin: 20px 0;
         }}
         .choices-image {{
             max-width: 100%;
             height: auto;
             border: 1px solid #ddd;
             border-radius: 4px;
         }}
         .choice-selection {{
             text-align: center;
             margin: 20px 0;
         }}
         .choice-button {{
             display: inline-block;
             margin: 5px 10px;
             padding: 10px 20px;
             background-color: white;
             border: 2px solid #ddd;
             border-radius: 5px;
             cursor: pointer;
             font-size: 16px;
             font-weight: bold;
             transition: all 0.2s;
         }}
         .choice-button:hover {{
             background-color: #e8f4f8;
             border-color: #2c3e50;
         }}
         .choice-button:active {{
             background-color: #d4edda;
             border-color: #28a745;
         }}
        .choices {{
            margin-top: 20px;
        }}
        .choice {{
            margin: 10px 0;
            padding: 12px;
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
        }}
        .choice:hover {{
            background-color: #e8f4f8;
        }}
        .choice-label {{
            font-weight: bold;
            color: #2c3e50;
            margin-right: 10px;
        }}
        .answer {{
            margin-top: 15px;
            padding: 10px;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            color: #155724;
        }}
        .answer-label {{
            font-weight: bold;
        }}
    </style>
    
    <!-- MathJax Configuration -->
    <script>
        window.MathJax = {{
            tex: {{
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
            }},
            options: {{
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }}
        }};
    </script>
    <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{competition_name}</h1>
            <div class="info">
                {f"Year: {year} | " if year else ""}Total Problems: {total_problems}
            </div>
        </div>
        
        <div class="questions">
"""

    # Process each question
    for i, problem in enumerate(problems, 1):
        question_id = problem.get('id', f'question_{i}')
        question_data = problem.get('question', {})
        question_text = question_data.get('text', '')
        insertions = question_data.get('insertions', {})
        
        # Process insertions in question text
        processed_text = process_insertions(question_text, insertions)
        
        # Get choices (they're nested in the question object)
        choices, choice_type = process_question_choices(question_data)
        
        # Get answer
        answer = problem.get('answer', '')
        
        html_content += f"""
            <div class="question">
                <div class="question-header">Problem {i}</div>
                <div class="question-text">{processed_text}</div>
"""
        
        # Add choices if available
        if choices:
            html_content += '                <div class="choices">\n'
            choice_labels = ['A', 'B', 'C', 'D', 'E', 'F']
            
            if choice_type == "single_image_all_choices":
                # Single image contains all choices - show image then provide selection buttons
                html_content += f'                    <div class="choices-image-container">\n'
                html_content += f'                        <img src="{fix_image_url(choices[0])}" alt="Choice options" class="choices-image" />\n'
                html_content += f'                    </div>\n'
                html_content += f'                    <div class="choice-selection">\n'
                html_content += f'                        <p><strong>Select your answer:</strong></p>\n'
                for j, label in enumerate(choice_labels[:5]):  # Usually A-E for AMC
                    html_content += f'                        <button class="choice-button" data-choice="{label}">({label})</button>\n'
                html_content += f'                    </div>\n'
            else:
                # Regular choice handling
                for j, choice in enumerate(choices[:len(choice_labels)]):
                    label = choice_labels[j]
                    if choice_type == "image":
                        # For image choices, display the image
                        html_content += f'                    <div class="choice"><span class="choice-label">({label})</span><img src="{fix_image_url(choice)}" alt="Choice {label}" class="choice-image" /></div>\n'
                    else:
                        # For text choices, display the text with LaTeX processing
                        processed_choice = process_choice_latex(choice)
                        html_content += f'                    <div class="choice"><span class="choice-label">({label})</span>{processed_choice}</div>\n'
                        
            html_content += '                </div>\n'
        
        # Add answer if available
        if answer:
            html_content += f'                <div class="answer"><span class="answer-label">Answer:</span> {answer}</div>\n'
        
        html_content += '            </div>\n'

    # Close HTML
    html_content += """
        </div>
    </div>
</body>
</html>
"""

    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

def process_single_file(input_path: str, output_path: str) -> None:
    """Process a single JSON file and convert to HTML."""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        generate_html_page(data, output_path)
        print(f"Successfully converted {input_path} to {output_path}")
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def process_folder(input_folder: str, output_folder: str) -> None:
    """Process all JSON files in a folder and convert to HTML."""
    input_path = Path(input_folder)
    output_path = Path(output_folder)
    
    # Create output folder if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Find all JSON files
    json_files = list(input_path.glob('*.json'))
    
    if not json_files:
        print(f"No JSON files found in {input_folder}")
        return
    
    print(f"Found {len(json_files)} JSON files to process")
    
    for json_file in json_files:
        # Generate output filename
        html_filename = json_file.stem + '.html'
        output_file = output_path / html_filename
        
        process_single_file(str(json_file), str(output_file))

def main():
    parser = argparse.ArgumentParser(description='Convert JSON question files to HTML')
    parser.add_argument('input', help='Input JSON file or folder')
    parser.add_argument('output', help='Output HTML file or folder')
    parser.add_argument('--batch', action='store_true', 
                       help='Process all JSON files in input folder')
    
    args = parser.parse_args()
    
    if args.batch:
        process_folder(args.input, args.output)
    else:
        process_single_file(args.input, args.output)

if __name__ == '__main__':
    main() 