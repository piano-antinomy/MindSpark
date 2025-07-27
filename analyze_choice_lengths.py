#!/usr/bin/env python3
"""
Script to analyze choice lengths in AMC question JSON files.
Finds questions with choices longer than 25 characters (excluding LaTeX markers).
"""

import json
import os
import re
from pathlib import Path

def clean_latex_text(text):
    """
    Remove LaTeX markers and commands to get pure text length.
    Removes: \text{}, \mathrm{}, \textbf{}, \textdollar, \\text, etc.
    """
    if not text:
        return ""
    
    # Remove LaTeX commands that wrap text
    text = re.sub(r'\\text\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textsc\{([^}]*)\}', r'\1', text)
    
    # Remove other LaTeX commands
    text = re.sub(r'\\textdollar', '', text)
    text = re.sub(r'\\\\text', '', text)
    text = re.sub(r'\\qquad', '', text)
    text = re.sub(r'\\quad', '', text)
    text = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', text)
    
    # Remove math delimiters
    text = re.sub(r'\$([^$]*)\$', r'\1', text)
    text = re.sub(r'\\\(([^)]*)\\\)', r'\1', text)
    text = re.sub(r'\\\[([^\]]*)\\\]', r'\1', text)
    
    # Remove other common LaTeX commands
    text = re.sub(r'\\[a-zA-Z]+\{[^}]*\}', '', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def extract_choices_from_question(question):
    """
    Extract choices from a question using the same logic as QuestionParser.
    Returns a list of choice texts.
    """
    choices = []
    
    if not question.get('question'):
        return choices
    
    question_details = question['question']
    
    # Priority: text_choices > latex_choices > picture_choices
    if question_details.get('text_choices') and question_details['text_choices']:
        choices.extend(question_details['text_choices'])
    elif question_details.get('latex_choices') and question_details['latex_choices']:
        # Process LaTeX choices similar to QuestionParser
        latex_choices = question_details['latex_choices']
        
        if len(latex_choices) == 1:
            # Single string containing all choices - need to split
            choice_string = latex_choices[0]
            
            # Remove outer $ delimiters if present
            choice_string = choice_string.replace('$', '')
            
            # Split by \qquad or \quad
            if '\\qquad' in choice_string:
                parts = choice_string.split('\\qquad')
            elif '\\quad' in choice_string:
                parts = choice_string.split('\\quad')
            else:
                parts = [choice_string]
            
            for part in parts:
                part = part.strip()
                if part:
                    # Extract the actual choice text (remove label patterns)
                    # Look for patterns like \mathrm{(A) ...} or \textbf{(A) ...}
                    for pattern in ['textbf', 'mathrm', 'text']:
                        match = re.search(f'\\\\{pattern}\\{{([^}}]*)\\([A-E]\\)([^}}]*)\\}}', part)
                        if match:
                            choice_text = match.group(1) + match.group(2)
                            choices.append(choice_text)
                            break
                    else:
                        # If no pattern found, use the whole part
                        choices.append(part)
        else:
            # Multiple strings - assume each is a separate choice
            choices.extend(latex_choices)
    
    return choices

def analyze_file(file_path):
    """
    Analyze a single JSON file and return questions with long choices.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        problems = data.get('problems', [])
        long_choice_questions = []
        
        for problem in problems:
            question_id = problem.get('id', 'unknown')
            choices = extract_choices_from_question(problem)
            
            long_choices = []
            for i, choice in enumerate(choices):
                clean_text = clean_latex_text(choice)
                if len(clean_text) > 25:
                    long_choices.append({
                        'index': i,
                        'original': choice,
                        'clean_text': clean_text,
                        'length': len(clean_text)
                    })
            
            if long_choices:
                long_choice_questions.append({
                    'question_id': question_id,
                    'long_choices': long_choices
                })
        
        return long_choice_questions
    
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    """
    Main function to analyze all JSON files in the questions directory.
    """
    questions_dir = Path("backend-java/resources/math/questions")
    
    if not questions_dir.exists():
        print(f"Directory not found: {questions_dir}")
        return
    
    all_long_choice_questions = []
    
    # Walk through all subdirectories
    for json_file in questions_dir.rglob("*.json"):
        print(f"Processing: {json_file}")
        
        long_choices = analyze_file(json_file)
        if long_choices:
            all_long_choice_questions.extend(long_choices)
    
    # Sort by question ID for better readability
    all_long_choice_questions.sort(key=lambda x: x['question_id'])
    
    # Print results
    print(f"\n{'='*80}")
    print(f"FOUND {len(all_long_choice_questions)} QUESTIONS WITH CHOICES LONGER THAN 25 CHARACTERS")
    print(f"{'='*80}\n")
    
    for question in all_long_choice_questions:
        print(f"Question ID: {question['question_id']}")
        for choice_info in question['long_choices']:
            print(f"  Choice {chr(65 + choice_info['index'])}: {choice_info['length']} chars")
            print(f"    Clean text: {choice_info['clean_text']}")
            print(f"    Original: {choice_info['original']}")
        print("-" * 60)
    
    # Summary
    print(f"\nSUMMARY:")
    print(f"Total questions with long choices: {len(all_long_choice_questions)}")
    
    # Count by competition type
    competition_counts = {}
    for question in all_long_choice_questions:
        comp_type = question['question_id'].split('_')[2]  # Extract AMC_8, AMC_10, etc.
        competition_counts[comp_type] = competition_counts.get(comp_type, 0) + 1
    
    print(f"By competition type:")
    for comp_type, count in sorted(competition_counts.items()):
        print(f"  {comp_type}: {count} questions")

if __name__ == "__main__":
    main() 