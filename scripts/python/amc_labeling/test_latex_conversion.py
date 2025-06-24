#!/usr/bin/env python3
"""
Test script to demonstrate LaTeX to plain text conversion
and test the categorizer on sample AMC problems.
"""

import json
import sys
import os

# Add the current directory to the path so we can import the categorizer
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from latex_based_categorizer import LatexBasedCategorizer

def test_latex_conversion():
    """Test the LaTeX to plain text conversion with various examples"""
    categorizer = LatexBasedCategorizer()
    
    # Test cases with LaTeX expressions
    test_cases = [
        # Fractions
        r"$\frac{3}{4} + \frac{1}{2}$",
        r"$\dfrac{5}{6} = \frac{10}{12}$",
        
        # Basic operations
        r"$x \cdot y = 15$",
        r"$3 \times 4 = 12$",
        r"$10 \div 2 = 5$",
        
        # Exponents
        r"$x^2 + y^3 = z^4$",
        r"$a^{n+1} = a^n \cdot a$",
        
        # Square roots
        r"$\sqrt{16} = 4$",
        r"$\sqrt[3]{8} = 2$",
        
        # Functions
        r"$\sin(x) + \cos(y) = 1$",
        r"$\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}$",
        
        # Greek letters
        r"$\pi r^2$",
        r"$\theta = 45^\circ$",
        
        # Special symbols
        r"$\triangle ABC$",
        r"$\angle ABC = 90^\circ$",
        r"$\parallel$ lines",
        
        # Number theory
        r"$\gcd(a, b)$",
        r"$\lcm(x, y)$",
        r"$a \bmod b$",
        
        # Combinatorics
        r"$\binom{n}{k}$",
        
        # Vectors
        r"$\vec{v} = \vec{a} + \vec{b}$",
        
        # Complex expressions
        r"$\frac{1}{2}x^2 + 3x + 5 = 0$",
        r"$\sqrt{a^2 + b^2} = c$",
        r"$\sin^2(x) + \cos^2(x) = 1$",
        
        # Text and formatting
        r"$\text{solve the equation}$",
        r"$\textbf{Answer: } x = 5$",
        r"$\boxed{\textbf{(A) } 12}$",
        
        # Real AMC examples
        r"$x = 3x-18$",
        r"$5x = 3x+54$",
        r"$y = 2x-1$",
        r"$R = 2r$",
        r"$N = 2M$",
        r"$3t = 4s$",
    ]
    
    print("=== LaTeX to Plain Text Conversion Test ===\n")
    
    for i, latex_expr in enumerate(test_cases, 1):
        plain_text = categorizer._convert_latex_to_plain_text(latex_expr)
        print(f"Test {i:2d}:")
        print(f"  LaTeX: {latex_expr}")
        print(f"  Plain:  {plain_text}")
        print()

def test_categorization():
    """Test the categorizer on sample problems"""
    categorizer = LatexBasedCategorizer()
    
    # Sample problems with different mathematical content
    test_problems = [
        {
            'name': 'Linear Equation Problem',
            'question': {
                'text': 'Solve the equation $x + 3 = 2x - 1$',
                'latex_choices': [
                    '$\\textbf{(A) } 4 \\qquad \\textbf{(B) } 5 \\qquad \\textbf{(C) } 6 \\qquad \\textbf{(D) } 7 \\qquad \\textbf{(E) } 8$'
                ]
            },
            'solutions': [
                {'text': 'We have $x + 3 = 2x - 1$. Subtracting $x$ from both sides gives $3 = x - 1$. Adding 1 to both sides gives $x = 4$.'}
            ]
        },
        {
            'name': 'Geometry Problem',
            'question': {
                'text': 'In triangle $\\triangle ABC$, if $\\angle A = 60^\\circ$ and $\\angle B = 45^\\circ$, what is $\\angle C$?',
                'latex_choices': [
                    '$\\textbf{(A) } 60^\\circ \\qquad \\textbf{(B) } 75^\\circ \\qquad \\textbf{(C) } 90^\\circ \\qquad \\textbf{(D) } 105^\\circ \\qquad \\textbf{(E) } 120^\\circ$'
                ]
            },
            'solutions': [
                {'text': 'Since the sum of angles in a triangle is $180^\\circ$, we have $60^\\circ + 45^\\circ + \\angle C = 180^\\circ$. Therefore, $\\angle C = 75^\\circ$.'}
            ]
        },
        {
            'name': 'Quadratic Problem',
            'question': {
                'text': 'Solve the quadratic equation $x^2 - 5x + 6 = 0$',
                'latex_choices': [
                    '$\\textbf{(A) } x = 2, 3 \\qquad \\textbf{(B) } x = -2, -3 \\qquad \\textbf{(C) } x = 1, 6 \\qquad \\textbf{(D) } x = -1, -6 \\qquad \\textbf{(E) } x = 0, 5$'
                ]
            },
            'solutions': [
                {'text': 'We can factor the quadratic: $x^2 - 5x + 6 = (x - 2)(x - 3) = 0$. Therefore, $x = 2$ or $x = 3$.'}
            ]
        },
        {
            'name': 'Fraction Problem',
            'question': {
                'text': 'What is $\\frac{3}{4} + \\frac{1}{2}$?',
                'latex_choices': [
                    '$\\textbf{(A) } \\frac{5}{4} \\qquad \\textbf{(B) } \\frac{3}{2} \\qquad \\textbf{(C) } \\frac{7}{4} \\qquad \\textbf{(D) } 2 \\qquad \\textbf{(E) } \\frac{9}{4}$'
                ]
            },
            'solutions': [
                {'text': 'To add fractions, we need a common denominator: $\\frac{3}{4} + \\frac{1}{2} = \\frac{3}{4} + \\frac{2}{4} = \\frac{5}{4}$.'}
            ]
        }
    ]
    
    print("=== Categorization Test ===\n")
    
    for problem in test_problems:
        print(f"Problem: {problem['name']}")
        result = categorizer.categorize_problem(problem)
        print(f"  Primary Category: {result['primary_category']}")
        print(f"  Subcategory: {result['primary_subcategory']}")
        print(f"  Confidence: {result['confidence_ratio']:.3f}")
        print(f"  Total Score: {result['total_score']}")
        print("  All Scores:")
        for category, subcats in result['all_scores'].items():
            for subcat, score in subcats.items():
                if score > 0:
                    print(f"    {category}.{subcat}: {score}")
        print()

if __name__ == "__main__":
    test_latex_conversion()
    test_categorization() 