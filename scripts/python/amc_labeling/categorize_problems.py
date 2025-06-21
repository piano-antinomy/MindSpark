#!/usr/bin/env python3
"""
Script to categorize AMC problems by mathematical topic based on keywords and patterns.
"""

import json
import os
import re
from collections import defaultdict

class ProblemCategorizer:
    def __init__(self):
        # Define category keywords and patterns
        self.categories = {
            'Algebra': {
                'keywords': [
                    'equation', 'solve', 'variable', 'expression', 'factor', 'expand',
                    'quadratic', 'linear', 'system', 'function', 'sequence', 'series',
                    'polynomial', 'inequality', 'absolute value', 'rational'
                ],
                'patterns': [
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions
                    r'x\s*[+\-*/]\s*y',  # Variables with operations
                    r'\\sqrt\{[^}]+\}',  # Square roots
                    r'\\boxed\{[^}]+\}',  # Boxed answers (often algebraic)
                ]
            },
            'Geometry': {
                'keywords': [
                    'triangle', 'circle', 'square', 'rectangle', 'area', 'perimeter',
                    'volume', 'surface area', 'angle', 'side', 'radius', 'diameter',
                    'similar', 'congruent', 'parallel', 'perpendicular', 'coordinate',
                    'distance', 'midpoint', 'slope', 'polygon', 'hexagon', 'octagon'
                ],
                'patterns': [
                    r'\\angle',  # Angle symbol
                    r'\\triangle',  # Triangle symbol
                    r'\\circ',  # Circle symbol
                    r'\\sqrt\{[^}]+\}',  # Square roots (often geometric)
                ]
            },
            'Number Theory': {
                'keywords': [
                    'prime', 'factor', 'divisible', 'remainder', 'modulo', 'gcd',
                    'lcm', 'integer', 'consecutive', 'even', 'odd', 'perfect square',
                    'perfect cube', 'base', 'digit', 'sum of digits', 'palindrome'
                ],
                'patterns': [
                    r'\\b\\d+\\b',  # Numbers
                    r'\\equiv',  # Congruence
                    r'\\pmod\{[^}]+\}',  # Modulo
                ]
            },
            'Counting & Probability': {
                'keywords': [
                    'ways', 'arrangement', 'permutation', 'combination', 'probability',
                    'chance', 'likely', 'unlikely', 'pigeonhole', 'inclusion',
                    'exclusion', 'choose', 'select', 'order', 'sequence'
                ],
                'patterns': [
                    r'\\binom\{[^}]+\}\{[^}]+\}',  # Binomial coefficient
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions (often probability)
                ]
            },
            'Arithmetic': {
                'keywords': [
                    'percent', 'ratio', 'proportion', 'fraction', 'decimal',
                    'average', 'mean', 'median', 'mode', 'range', 'speed',
                    'distance', 'time', 'rate', 'work', 'money', 'cost', 'price'
                ],
                'patterns': [
                    r'\\%',  # Percent symbol
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions
                    r'\\d+\\.\\d+',  # Decimals
                ]
            },
            'Logic & Puzzles': {
                'keywords': [
                    'pattern', 'sequence', 'next', 'find', 'determine', 'if',
                    'then', 'therefore', 'because', 'since', 'game', 'strategy',
                    'win', 'lose', 'turn', 'move', 'rule', 'condition'
                ],
                'patterns': [
                    r'if.*then',  # If-then statements
                    r'\\Rightarrow',  # Implication
                ]
            }
        }
        
        # Golden truth for validation
        self.golden_truth = {
            '2019_AMC_8_15': 'Algebra',
            '2018_AMC_8_20': 'Algebra', 
            '2020_AMC_8_18': 'Algebra',
            '2017_AMC_8_22': 'Algebra',
            '2016_AMC_8_25': 'Algebra',
            '2019_AMC_8_21': 'Geometry',
            '2018_AMC_8_24': 'Geometry',
            '2020_AMC_8_23': 'Geometry',
            '2017_AMC_8_25': 'Geometry',
            '2016_AMC_8_22': 'Geometry',
            '2019_AMC_8_19': 'Number Theory',
            '2018_AMC_8_18': 'Number Theory',
            '2020_AMC_8_20': 'Number Theory',
            '2017_AMC_8_21': 'Number Theory',
            '2016_AMC_8_24': 'Number Theory',
            '2019_AMC_8_22': 'Counting & Probability',
            '2018_AMC_8_25': 'Counting & Probability',
            '2020_AMC_8_24': 'Counting & Probability',
            '2017_AMC_8_23': 'Counting & Probability',
            '2016_AMC_8_23': 'Counting & Probability',
            '2019_AMC_8_16': 'Arithmetic',
            '2018_AMC_8_17': 'Arithmetic',
            '2020_AMC_8_17': 'Arithmetic',
            '2017_AMC_8_18': 'Arithmetic',
            '2016_AMC_8_20': 'Arithmetic',
            '2019_AMC_8_24': 'Logic & Puzzles',
            '2018_AMC_8_23': 'Logic & Puzzles',
            '2020_AMC_8_25': 'Logic & Puzzles',
            '2017_AMC_8_24': 'Logic & Puzzles',
            '2016_AMC_8_21': 'Logic & Puzzles'
        }
    
    def categorize_problem(self, problem_text, problem_id):
        """Categorize a single problem based on its text content."""
        # Convert to lowercase for keyword matching
        text_lower = problem_text.lower()
        
        # Score each category
        category_scores = defaultdict(int)
        
        for category, rules in self.categories.items():
            # Check keywords
            for keyword in rules['keywords']:
                if keyword.lower() in text_lower:
                    category_scores[category] += 1
            
            # Check patterns
            for pattern in rules['patterns']:
                matches = re.findall(pattern, problem_text, re.IGNORECASE)
                category_scores[category] += len(matches) * 0.5  # Weight patterns less
        
        # Return the category with highest score, or 'Uncategorized' if no clear winner
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            if best_category[1] > 0:
                return best_category[0]
        
        return 'Uncategorized'
    
    def process_amc_files(self, amc_dir="../../../backend-java/questions/AMC"):
        """Process all AMC files and categorize problems."""
        categorized_problems = defaultdict(list)
        
        # Walk through AMC directory
        for root, dirs, files in os.walk(amc_dir):
            for file in files:
                if file.endswith('.json') and 'Problem_' not in file:
                    # Skip individual problem files, only process main competition files
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        
                        competition_info = data.get('competition_info', {})
                        problems = data.get('problems', [])
                        
                        year = competition_info.get('year')
                        level = competition_info.get('level', '')
                        is_ajhsme = competition_info.get('is_AJHSME', False)
                        
                        for problem in problems:
                            problem_id = problem.get('id', '')
                            question_text = problem.get('question', {}).get('text', '')
                            
                            # Create a readable problem identifier
                            if is_ajhsme:
                                readable_id = f"{year}_AJHSME_{problem_id.split('_')[-1]}"
                            else:
                                readable_id = f"{year}_AMC_{level}_{problem_id.split('_')[-1]}"
                            
                            # Categorize the problem
                            category = self.categorize_problem(question_text, problem_id)
                            
                            categorized_problems[category].append({
                                'id': readable_id,
                                'problem_id': problem_id,
                                'file': file,
                                'question_preview': question_text[:100] + '...' if len(question_text) > 100 else question_text
                            })
                    
                    except Exception as e:
                        print(f"Error processing {file}: {e}")
        
        return categorized_problems
    
    def validate_against_golden_truth(self, categorized_problems):
        """Validate categorization against golden truth."""
        print("=== VALIDATION AGAINST GOLDEN TRUTH ===\n")
        
        correct = 0
        total = 0
        
        for category, problems in categorized_problems.items():
            for problem in problems:
                problem_key = problem['id'].replace('_', '_').replace('AMC_', 'AMC_')
                
                if problem_key in self.golden_truth:
                    expected_category = self.golden_truth[problem_key]
                    actual_category = category
                    
                    total += 1
                    if expected_category == actual_category:
                        correct += 1
                        print(f"✅ {problem_key}: Expected {expected_category}, Got {actual_category}")
                    else:
                        print(f"❌ {problem_key}: Expected {expected_category}, Got {actual_category}")
        
        if total > 0:
            accuracy = (correct / total) * 100
            print(f"\nAccuracy: {correct}/{total} = {accuracy:.1f}%")
        else:
            print("No golden truth problems found in the data.")
    
    def print_categorized_list(self, categorized_problems):
        """Print the categorized problems in a readable format."""
        print("=== CATEGORIZED AMC PROBLEMS ===\n")
        
        for category, problems in categorized_problems.items():
            print(f"## {category} ({len(problems)} problems)")
            print("-" * 50)
            
            for problem in problems[:10]:  # Show first 10 per category
                print(f"- {problem['id']}: {problem['question_preview']}")
            
            if len(problems) > 10:
                print(f"  ... and {len(problems) - 10} more")
            print()

def main():
    categorizer = ProblemCategorizer()
    
    print("Processing AMC files for categorization...")
    categorized_problems = categorizer.process_amc_files()
    
    # Print categorized list
    categorizer.print_categorized_list(categorized_problems)
    
    # Validate against golden truth
    categorizer.validate_against_golden_truth(categorized_problems)
    
    # Save results to file
    output_file = "categorized_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(categorized_problems, f, indent=2, ensure_ascii=False)
    
    print(f"\nResults saved to {output_file}")

if __name__ == "__main__":
    main() 