#!/usr/bin/env python3
"""
Problem Analyzer for AMC problems.
Takes parsed problem data and adds categorization, validation, and other business logic.
This separates the web scraping concerns from the analysis concerns.
"""

import json
import os
from collections import defaultdict
from latex_based_categorizer import LatexBasedCategorizer

class ProblemAnalyzer:
    def __init__(self):
        """Initialize the problem analyzer with categorization capabilities"""
        self.categorizer = LatexBasedCategorizer()
        
    def analyze_problem(self, problem_data):
        """
        Analyze a single problem and add metadata.
        
        Args:
            problem_data: Raw problem data from the parser
            
        Returns:
            dict: Enhanced problem data with analysis results
        """
        # Create a copy to avoid modifying the original
        analyzed_problem = problem_data.copy()
        
        # Add categorization
        categorization_result = self.categorizer.categorize_problem(problem_data)
        analyzed_problem['category'] = {
            'primary': categorization_result['primary_category'],
            'primary_subcategory': categorization_result['primary_subcategory'],
            'confidence': categorization_result['confidence_ratio'],
            'all_scores': categorization_result['all_scores']
        }
        
        # Add validation metadata
        analyzed_problem['validation'] = self._validate_problem(problem_data)
        
        # Add content analysis
        analyzed_problem['content_analysis'] = self._analyze_content(problem_data)
        
        return analyzed_problem
    
    def analyze_competition(self, competition_data):
        """
        Analyze all problems in a competition.
        
        Args:
            competition_data: Competition data with problems list
            
        Returns:
            dict: Enhanced competition data with analysis results
        """
        analyzed_competition = competition_data.copy()
        problems = analyzed_competition.get('problems', [])
        
        # Analyze each problem
        analyzed_problems = []
        analysis_stats = {
            'total_problems': len(problems),
            'categorized': 0,
            'uncategorized': 0,
            'category_distribution': defaultdict(int),
            'validation_issues': [],
            'content_analysis': defaultdict(int)
        }
        
        for i, problem in enumerate(problems):
            analyzed_problem = self.analyze_problem(problem)
            analyzed_problems.append(analyzed_problem)
            
            # Update statistics
            category = analyzed_problem['category']['primary']
            if category == 'uncategorized':
                analysis_stats['uncategorized'] += 1
            else:
                analysis_stats['categorized'] += 1
                analysis_stats['category_distribution'][category] += 1
            
            # Check for validation issues
            validation = analyzed_problem['validation']
            if not validation['is_valid']:
                analysis_stats['validation_issues'].append({
                    'problem_id': analyzed_problem.get('id', f'problem_{i+1}'),
                    'issues': validation['issues']
                })
            
            # Update content analysis stats
            content_analysis = analyzed_problem['content_analysis']
            for key, value in content_analysis.items():
                if isinstance(value, bool) and value:
                    analysis_stats['content_analysis'][key] += 1
        
        analyzed_competition['problems'] = analyzed_problems
        analyzed_competition['analysis_summary'] = analysis_stats
        
        return analyzed_competition
    
    def _validate_problem(self, problem_data):
        """Validate problem data and return validation results"""
        issues = []
        is_valid = True
        
        # Check required fields
        required_fields = ['id', 'question', 'answer', 'solutions']
        for field in required_fields:
            if field not in problem_data:
                issues.append(f"Missing required field: {field}")
                is_valid = False
        
        # Check question structure
        if 'question' in problem_data:
            question = problem_data['question']
            if not question.get('text'):
                issues.append("Question text is empty")
                is_valid = False
            
            # Check for choices if it's a multiple choice problem
            if question.get('type') == 'multiple-choice':
                has_choices = (question.get('text_choices') or 
                             question.get('latex_choices') or 
                             question.get('picture_choices') or 
                             question.get('asy_choices'))
                if not has_choices:
                    issues.append("Multiple choice problem has no choices")
                    is_valid = False
        
        # Check answer format
        if 'answer' in problem_data:
            answer = problem_data['answer']
            if not answer or answer.strip() == '':
                issues.append("Answer is empty")
                is_valid = False
        
        # Check solutions
        if 'solutions' in problem_data:
            solutions = problem_data['solutions']
            if not solutions:
                issues.append("No solutions provided")
                is_valid = False
        
        return {
            'is_valid': is_valid,
            'issues': issues
        }
    
    def _analyze_content(self, problem_data):
        """Analyze content characteristics of the problem"""
        analysis = {
            'has_latex_in_question': False,
            'has_latex_in_choices': False,
            'has_latex_in_solutions': False,
            'has_images': False,
            'has_asymptote': False,
            'choice_count': 0,
            'solution_count': 0
        }
        
        # Analyze question content
        if 'question' in problem_data:
            question = problem_data['question']
            
            # Check for LaTeX in question text
            question_text = question.get('text', '')
            if '$' in question_text or '\\' in question_text:
                analysis['has_latex_in_question'] = True
            
            # Check for LaTeX in choices
            latex_choices = question.get('latex_choices', [])
            if latex_choices:
                analysis['has_latex_in_choices'] = True
                analysis['choice_count'] = len(latex_choices)
            
            # Check for other choice types
            text_choices = question.get('text_choices', [])
            picture_choices = question.get('picture_choices', [])
            asy_choices = question.get('asy_choices', [])
            
            if text_choices:
                analysis['choice_count'] = max(analysis['choice_count'], len(text_choices))
            if picture_choices:
                analysis['choice_count'] = max(analysis['choice_count'], len(picture_choices))
                analysis['has_images'] = True
            if asy_choices:
                analysis['choice_count'] = max(analysis['choice_count'], len(asy_choices))
                analysis['has_asymptote'] = True
        
        # Analyze solutions
        if 'solutions' in problem_data:
            solutions = problem_data['solutions']
            analysis['solution_count'] = len(solutions)
            
            for solution in solutions:
                solution_text = solution.get('text', '')
                if '$' in solution_text or '\\' in solution_text:
                    analysis['has_latex_in_solutions'] = True
                    break
        
        return analysis

def main():
    """Test the problem analyzer"""
    analyzer = ProblemAnalyzer()
    
    # Test with sample problem data
    test_problem = {
        'id': 'test_problem_1',
        'question': {
            'text': 'What is the value of $\\frac{3}{4} + \\frac{1}{2}$?',
            'type': 'multiple-choice',
            'latex_choices': [
                '$\\textbf{(A) }\\frac{5}{4}\\qquad\\textbf{(B) }\\frac{3}{2}\\qquad\\textbf{(C) }\\frac{7}{4}\\qquad\\textbf{(D) }2\\qquad\\textbf{(E) }\\frac{9}{4}$'
            ]
        },
        'answer': 'C',
        'solutions': [
            {'text': 'To add fractions, we need a common denominator...'}
        ]
    }
    
    analyzed_problem = analyzer.analyze_problem(test_problem)
    print("Analyzed problem:")
    print(json.dumps(analyzed_problem, indent=2))

if __name__ == "__main__":
    main() 