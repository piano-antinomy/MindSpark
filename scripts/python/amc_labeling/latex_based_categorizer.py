#!/usr/bin/env python3
"""
LaTeX-based problem categorizer for AMC problems.
Uses official AMC categories and subcategories.
Prioritizes mathematical patterns and LaTeX content over text keywords.
"""

import json
import re
from collections import defaultdict

class LatexBasedCategorizer:
    def __init__(self):
        # Official AMC categories and subcategories with mathematical patterns
        self.math_patterns = {
            'algebra': {
                'linear_equations': [
                    # Basic forms: variable = number
                    (r'[a-z]\s*=\s*[0-9]+', 3),  # Example: x = 5, y = 10
                    
                    # Variable + number = number
                    (r'[a-z]\s*\+\s*[0-9]+\s*=\s*[0-9]+', 3),  # Example: x + 3 = 8
                    (r'[0-9]+\s*\+\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: 3 + x = 7
                    
                    # Variable - number = number
                    (r'[a-z]\s*-\s*[0-9]+\s*=\s*[0-9]+', 3),  # Example: x - 2 = 5
                    (r'[0-9]+\s*-\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: 10 - x = 3
                    
                    # Variable + variable = number
                    (r'[a-z]\s*\+\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: x + y = 15
                    
                    # Variable - variable = number
                    (r'[a-z]\s*-\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: x - y = 3
                    
                    # Variable = variable (simple equality)
                    (r'[a-z]\s*=\s*[a-z]', 3),  # Example: x = y, a = b
                    
                    # Variable = variable + number
                    (r'[a-z]\s*=\s*[a-z]\s*\+\s*[0-9]+', 3),  # Example: x = y + 3
                    (r'[a-z]\s*=\s*[0-9]+\s*\+\s*[a-z]', 3),  # Example: x = 3 + y
                    
                    # Variable = variable - number
                    (r'[a-z]\s*=\s*[a-z]\s*-\s*[0-9]+', 3),  # Example: x = y - 2
                    (r'[a-z]\s*=\s*[0-9]+\s*-\s*[a-z]', 3),  # Example: x = 10 - y
                    
                    # Coefficient forms: coefficient × variable = number
                    (r'[0-9]+\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: 3x = 15, 2y = 8
                    (r'[a-z]\s*=\s*[0-9]+\s*[a-z]', 3),  # Example: x = 3y, a = 2b
                    
                    # Coefficient × variable = coefficient × variable
                    (r'[0-9]+\s*[a-z]\s*=\s*[0-9]+\s*[a-z]', 3),  # Example: 3x = 2y, 4a = 5b
                    
                    # Coefficient × variable + number = number
                    (r'[0-9]+\s*[a-z]\s*\+\s*[0-9]+\s*=\s*[0-9]+', 3),  # Example: 2x + 3 = 11
                    (r'[0-9]+\s*[a-z]\s*-\s*[0-9]+\s*=\s*[0-9]+', 3),  # Example: 3x - 1 = 8
                    
                    # Variable + number = coefficient × variable
                    (r'[a-z]\s*\+\s*[0-9]+\s*=\s*[0-9]+\s*[a-z]', 3),  # Example: x + 5 = 3y
                    (r'[a-z]\s*-\s*[0-9]+\s*=\s*[0-9]+\s*[a-z]', 3),  # Example: x - 2 = 3y
                    
                    # Multiple terms on both sides (complex forms)
                    (r'[0-9]*[a-z][0-9+\-*/]*\s*=\s*[0-9]*[a-z][0-9+\-*/]*', 3),  # Example: 2x+3=3x-1, x+y=2x-y
                    
                    # Fraction forms
                    (r'\\frac\{[0-9]+\}\{[0-9]+\}\s*[a-z]\s*=\s*[0-9]+', 3),  # Example: \frac{1}{2}x = 4
                    (r'[a-z]\s*=\s*\\frac\{[0-9]+\}\{[0-9]+\}\s*[a-z]', 3),  # Example: x = \frac{2}{3}y
                    
                    # Text-based equation keywords
                    (r'\\text\{[^}]*equation[^}]*\}', 2),  # Example: \text{solve the equation}
                    (r'\\text\{[^}]*linear[^}]*\}', 2),  # Example: \text{linear equation}
                ],
                'quadratic_equations': [
                    (r'[a-z]\^2\s*\+\s*[a-z]', 3),  # Example: x^2 + x
                    (r'[a-z]\^2\s*-\s*[a-z]', 3),  # Example: x^2 - x
                    (r'[a-z]\s*\+\s*[a-z]\^2', 3),  # Example: x + x^2
                    (r'\\text\{[^}]*quadratic[^}]*\}', 2),  # Example: \text{quadratic function}
                ],
                'polynomials': [
                    (r'[a-z]\^[3-9]', 3),  # Example: x^3, y^5, z^7
                    (r'[a-z]\^[0-9]+\s*\+\s*[a-z]\^[0-9]+', 3),  # Example: x^2 + y^3
                    (r'x\^[0-9]+', 3),  # Example: x^2, x^5, x^10
                    (r'[a-z]\^[0-9]+', 3),  # Example: y^3, z^7, a^4
                    (r'\\text\{[^}]*polynomial[^}]*\}', 2),  # Example: \text{polynomial degree}
                ],
                'functions': [
                    (r'f\([a-z]\)', 3),  # Example: f(x), f(y)
                    (r'g\([a-z]\)', 3),  # Example: g(x), g(y)
                    (r'h\([a-z]\)', 3),  # Example: h(x), h(y)
                    (r'\\text\{[^}]*function[^}]*\}', 2),  # Example: \text{function value}
                ],
                'sequences': [
                    (r'\\text\{[^}]*sequence[^}]*\}', 2),  # Example: \text{arithmetic sequence}
                    (r'\\text\{[^}]*arithmetic[^}]*\}', 2),  # Example: \text{arithmetic progression}
                    (r'\\text\{[^}]*geometric[^}]*\}', 2),  # Example: \text{geometric sequence}
                ],
                'inequalities': [
                    (r'[a-z]\s*[<>]\s*[0-9]+', 3),  # Example: x > 5, y < 10
                    (r'[a-z]\s*[<>]=\s*[0-9]+', 3),  # Example: x >= 5, y <= 10
                    (r'\\text\{[^}]*inequality[^}]*\}', 2),  # Example: \text{solve the inequality}
                    (r'\\text\{[^}]*greater than[^}]*\}', 2),  # Example: \text{greater than 5}
                    (r'\\text\{[^}]*less than[^}]*\}', 2),  # Example: \text{less than 10}
                ],
                'basic_operations': [
                    (r'[a-z]\s*\+\s*[a-z]', 3),  # Example: x + y, a + b
                    (r'[a-z]\s*\*\s*[a-z]', 3),  # Example: x * y, a * b
                    (r'[a-z]\s*/\s*[a-z]', 3),  # Example: x / y, a / b
                    (r'[a-z]\s*÷\s*[a-z]', 3),  # Example: x ÷ y, a ÷ b
                    (r'\\div', 3),  # Example: \div (LaTeX division symbol)
                    (r'\\frac\{[^}]*\}\{[^}]*\}', 3),  # Example: \frac{3}{4}, \frac{x}{y}
                    (r'\\sqrt\{[^}]*\}', 3),  # Example: \sqrt{16}, \sqrt{x}
                    (r'\\sqrt\[[0-9]+\]\{[^}]*\}', 3),  # Example: \sqrt[3]{8}, \sqrt[4]{x}
                ],
                'general': [
                    (r'\\text\{[^}]*\}', 2),  # Example: \text{any text content}
                ]
            },
            'geometry': {
                'triangles': [
                    (r'\\triangle', 3),  # Example: \triangle ABC
                    (r'\\text\{[^}]*triangle[^}]*\}', 2),  # Example: \text{right triangle}
                    (r'\\text\{[^}]*equilateral[^}]*\}', 2),  # Example: \text{equilateral triangle}
                    (r'\\text\{[^}]*isosceles[^}]*\}', 2),  # Example: \text{isosceles triangle}
                    (r'\\text\{[^}]*right[^}]*triangle[^}]*\}', 2),  # Example: \text{right triangle}
                    (r'\\angle', 3),  # Example: \angle ABC
                    (r'\\equiv', 3),  # Example: \equiv (congruent)
                    (r'\\sim', 3),  # Example: \sim (similar)
                    (r'\\text\{[^}]*degrees?[^}]*\}', 2),  # Example: \text{45 degrees}
                    (r'\\text\{[^}]*angle[^}]*\}', 2),  # Example: \text{angle measure}
                ],
                'circles': [
                    (r'\\circ', 3),  # Example: \circ (circle symbol)
                    (r'\\text\{[^}]*circle[^}]*\}', 2),  # Example: \text{circle with radius}
                    (r'\\text\{[^}]*radius[^}]*\}', 2),  # Example: \text{radius of circle}
                    (r'\\text\{[^}]*diameter[^}]*\}', 2),  # Example: \text{diameter of circle}
                    (r'\\text\{[^}]*circumference[^}]*\}', 2),  # Example: \text{circumference}
                ],
                'polygons': [
                    (r'\\text\{[^}]*square[^}]*\}', 2),  # Example: \text{square with side}
                    (r'\\text\{[^}]*rectangle[^}]*\}', 2),  # Example: \text{rectangle area}
                    (r'\\text\{[^}]*pentagon[^}]*\}', 2),  # Example: \text{regular pentagon}
                    (r'\\text\{[^}]*hexagon[^}]*\}', 2),  # Example: \text{hexagon perimeter}
                    (r'\\text\{[^}]*polygon[^}]*\}', 2),  # Example: \text{regular polygon}
                ],
                'coordinate_geometry': [
                    (r'\\text\{[^}]*coordinate[^}]*\}', 2),  # Example: \text{coordinate plane}
                    (r'\\text\{[^}]*graph[^}]*\}', 2),  # Example: \text{graph the function}
                    (r'\\text\{[^}]*slope[^}]*\}', 2),  # Example: \text{slope of line}
                    (r'\\text\{[^}]*distance[^}]*\}', 2),  # Example: \text{distance between points}
                ],
                'solid_geometry': [
                    (r'\\text\{[^}]*cube[^}]*\}', 2),  # Example: \text{cube volume}
                    (r'\\text\{[^}]*sphere[^}]*\}', 2),  # Example: \text{sphere surface area}
                    (r'\\text\{[^}]*cylinder[^}]*\}', 2),  # Example: \text{cylinder volume}
                    (r'\\text\{[^}]*cone[^}]*\}', 2),  # Example: \text{cone height}
                    (r'\\text\{[^}]*volume[^}]*\}', 2),  # Example: \text{volume of solid}
                    (r'\\text\{[^}]*surface area[^}]*\}', 2),  # Example: \text{surface area}
                    (r'\\text\{[^}]*3d[^}]*\}', 2),  # Example: \text{3d figure}
                ],
                'general': [
                    (r'\\parallel', 3),  # Example: \parallel (parallel lines)
                    (r'\\perp', 3),  # Example: \perp (perpendicular)
                    (r'\\pi', 3),  # Example: \pi (pi constant)
                    (r'\\degree', 3),  # Example: \degree (degree symbol)
                    (r'\\text\{[^}]*area[^}]*\}', 2),  # Example: \text{area of region}
                    (r'\\text\{[^}]*perimeter[^}]*\}', 2),  # Example: \text{perimeter}
                ]
            },
            'number_theory': {
                'divisibility': [
                    (r'\\text\{[^}]*divisible[^}]*\}', 2),  # Example: \text{divisible by 3}
                    (r'\\text\{[^}]*factor[^}]*\}', 2),  # Example: \text{factor of 12}
                    (r'\\text\{[^}]*multiple[^}]*\}', 2),  # Example: \text{multiple of 5}
                    (r'\\text\{[^}]*remainder[^}]*\}', 2),  # Example: \text{remainder when divided}
                ],
                'primes': [
                    (r'\\text\{[^}]*prime[^}]*\}', 2),  # Example: \text{prime number}
                    (r'\\text\{[^}]*factorization[^}]*\}', 2),  # Example: \text{prime factorization}
                ],
                'modular_arithmetic': [
                    (r'\\bmod', 3),  # Example: \bmod (modulo operator)
                    (r'\\text\{[^}]*modulo[^}]*\}', 2),  # Example: \text{modulo 7}
                    (r'\\text\{[^}]*congruent[^}]*\}', 2),  # Example: \text{congruent modulo}
                ],
                'diophantine_equations': [
                    (r'\\text\{[^}]*integer[^}]*solution[^}]*\}', 2),  # Example: \text{integer solution}
                    (r'\\text\{[^}]*whole number[^}]*\}', 2),  # Example: \text{whole number}
                    (r'\\text\{[^}]*positive integer[^}]*\}', 2),  # Example: \text{positive integer}
                    (r'\\text\{[^}]*diophantine[^}]*\}', 2),  # Example: \text{diophantine equation}
                ],
                'sequences_patterns': [
                    (r'\\text\{[^}]*pattern[^}]*\}', 2),  # Example: \text{pattern in sequence}
                    (r'\\text\{[^}]*sequence[^}]*\}', 2),  # Example: \text{number sequence}
                    (r'\\text\{[^}]*next[^}]*\}', 2),  # Example: \text{next term in sequence}
                ],
                'general': [
                    (r'\\gcd', 3),  # Example: \gcd(a,b)
                    (r'\\lcm', 3),  # Example: \lcm(a,b)
                ]
            },
            'combinatorics': {
                'counting': [
                    (r'\\text\{[^}]*ways?[^}]*\}', 2),  # Example: \text{how many ways}
                    (r'\\text\{[^}]*count[^}]*\}', 2),  # Example: \text{count the number}
                    (r'\\text\{[^}]*how many[^}]*\}', 2),  # Example: \text{how many different}
                ],
                'permutations_combinations': [
                    (r'\\binom\{[^}]*\}\{[^}]*\}', 3),  # Example: \binom{n}{k} (binomial coefficient)
                    (r'\\text\{[^}]*arrange[^}]*\}', 2),  # Example: \text{arrange in order}
                    (r'\\text\{[^}]*order[^}]*\}', 2),  # Example: \text{order matters}
                    (r'\\text\{[^}]*choose[^}]*\}', 2),  # Example: \text{choose 3 from 10}
                    (r'\\text\{[^}]*select[^}]*\}', 2),  # Example: \text{select committee}
                    (r'\\text\{[^}]*combination[^}]*\}', 2),  # Example: \text{combination formula}
                    (r'\\text\{[^}]*permutation[^}]*\}', 2),  # Example: \text{permutation}
                ],
                'probability': [
                    (r'\\text\{[^}]*probability[^}]*\}', 2),  # Example: \text{probability of event}
                    (r'\\text\{[^}]*chance[^}]*\}', 2),  # Example: \text{chance of winning}
                    (r'\\text\{[^}]*likely[^}]*\}', 2),  # Example: \text{most likely}
                    (r'\\text\{[^}]*random[^}]*\}', 2),  # Example: \text{random selection}
                    (r'\\text\{[^}]*draw[^}]*\}', 2),  # Example: \text{draw a card}
                    (r'\\text\{[^}]*pick[^}]*\}', 2),  # Example: \text{pick a number}
                ],
                'pigeonhole_principle': [
                    (r'\\text\{[^}]*pigeonhole[^}]*\}', 2),  # Example: \text{pigeonhole principle}
                    (r'\\text\{[^}]*drawer[^}]*\}', 2),  # Example: \text{drawer contains}
                    (r'\\text\{[^}]*box[^}]*\}', 2),  # Example: \text{box with objects}
                    (r'\\text\{[^}]*must[^}]*\}', 2),  # Example: \text{must contain}
                    (r'\\text\{[^}]*guarantee[^}]*\}', 2),  # Example: \text{guarantee that}
                ],
                'graph_theory': [
                    (r'\\text\{[^}]*graph[^}]*\}', 2),  # Example: \text{graph with vertices}
                    (r'\\text\{[^}]*vertex[^}]*\}', 2),  # Example: \text{vertex of graph}
                    (r'\\text\{[^}]*edge[^}]*\}', 2),  # Example: \text{edge connects}
                ]
            },
            'precalculus': {
                'trigonometry': [
                    (r'\\sin', 3),  # Example: \sin(x), \sin(30)
                    (r'\\cos', 3),  # Example: \cos(x), \cos(45)
                    (r'\\tan', 3),  # Example: \tan(x), \tan(60)
                    (r'\\text\{[^}]*trigonometry[^}]*\}', 2),  # Example: \text{trigonometry problem}
                    (r'\\text\{[^}]*sine[^}]*\}', 2),  # Example: \text{sine function}
                    (r'\\text\{[^}]*cosine[^}]*\}', 2),  # Example: \text{cosine value}
                    (r'\\text\{[^}]*tangent[^}]*\}', 2),  # Example: \text{tangent line}
                ],
                'complex_numbers': [
                    (r'i\^[0-9]+', 3),  # Example: i^2, i^3, i^4
                    (r'\\text\{[^}]*complex[^}]*\}', 2),  # Example: \text{complex number}
                    (r'\\text\{[^}]*imaginary[^}]*\}', 2),  # Example: \text{imaginary part}
                ],
                'vectors': [
                    (r'\\vec\{[^}]*\}', 3),  # Example: \vec{v}, \vec{AB}
                    (r'\\text\{[^}]*vector[^}]*\}', 2),  # Example: \text{vector addition}
                ],
                'matrices': [
                    (r'\\begin\{matrix\}', 3),  # Example: \begin{matrix} ... \end{matrix}
                    (r'\\text\{[^}]*matrix[^}]*\}', 2),  # Example: \text{matrix multiplication}
                    (r'\\text\{[^}]*determinant[^}]*\}', 2),  # Example: \text{determinant of matrix}
                ],
                'conic_sections': [
                    (r'\\text\{[^}]*parabola[^}]*\}', 2),  # Example: \text{parabola equation}
                    (r'\\text\{[^}]*ellipse[^}]*\}', 2),  # Example: \text{ellipse foci}
                    (r'\\text\{[^}]*hyperbola[^}]*\}', 2),  # Example: \text{hyperbola graph}
                ]
            }
        }
        
        # Compile all patterns for efficiency
        self.compiled_patterns = {}
        for category, subcategories in self.math_patterns.items():
            self.compiled_patterns[category] = {}
            for subcategory, patterns in subcategories.items():
                self.compiled_patterns[category][subcategory] = [
                    (re.compile(pattern, re.IGNORECASE), weight) 
                    for pattern, weight in patterns
                ]
    
    def categorize_problem(self, problem_data):
        """Categorize a problem based on LaTeX and text content"""
        scores = defaultdict(lambda: defaultdict(int))
        
        # Analyze question text
        question_text = problem_data.get('question', {}).get('text', '')
        self._analyze_both_formats(question_text, scores, 'question')
        
        # Analyze question insertions (high priority - contains key mathematical content)
        question_insertions = problem_data.get('question', {}).get('insertions', {})
        for insertion_key, insertion_data in question_insertions.items():
            if isinstance(insertion_data, dict) and 'alt_value' in insertion_data:
                alt_value = insertion_data['alt_value']
                self._analyze_both_formats(alt_value, scores, 'question_insertion')
        
        # Analyze LaTeX choices (highest priority)
        latex_choices = problem_data.get('question', {}).get('latex_choices', [])
        for choice in latex_choices:
            self._analyze_both_formats(choice, scores, 'latex_choice')
        
        # Analyze text choices
        text_choices = problem_data.get('question', {}).get('text_choices', [])
        for choice in text_choices:
            self._analyze_both_formats(choice, scores, 'text_choice')
        
        # Analyze solutions (lower weight)
        solutions = problem_data.get('solutions', [])
        for solution in solutions:
            solution_text = solution.get('text', '')
            self._analyze_both_formats(solution_text, scores, 'solution')
            
            # Analyze solution insertions (medium priority)
            solution_insertions = solution.get('insertions', {})
            for insertion_key, insertion_data in solution_insertions.items():
                if isinstance(insertion_data, dict) and 'alt_value' in insertion_data:
                    alt_value = insertion_data['alt_value']
                    self._analyze_both_formats(alt_value, scores, 'solution_insertion')
        
        # Determine primary category and subcategory
        if scores:
            # Find the category with highest total score
            category_totals = {cat: sum(subcat_scores.values()) for cat, subcat_scores in scores.items()}
            primary_category = max(category_totals.items(), key=lambda x: x[1])[0]
            
            # Find the subcategory with highest score within the primary category
            subcategory_scores = scores[primary_category]
            primary_subcategory = max(subcategory_scores.items(), key=lambda x: x[1])[0]
            
            # Calculate confidence
            total_score = sum(category_totals.values())
            confidence_ratio = category_totals[primary_category] / total_score if total_score > 0 else 0
        else:
            primary_category = 'uncategorized'
            primary_subcategory = 'general'
            confidence_ratio = 0
        
        return {
            'primary_category': primary_category,
            'primary_subcategory': primary_subcategory,
            'confidence_ratio': confidence_ratio,
            'all_scores': {cat: dict(subcat_scores) for cat, subcat_scores in scores.items()},
            'total_score': sum(sum(subcat_scores.values()) for subcat_scores in scores.values())
        }
    
    def _analyze_text(self, text, scores, content_type):
        """Analyze text content and update category scores"""
        if not text:
            return
        
        # Apply mathematical patterns with weights
        for category, subcategories in self.compiled_patterns.items():
            for subcategory, patterns in subcategories.items():
                for pattern, weight in patterns:
                    matches = pattern.findall(text)
                    if matches:
                        # All content types get equal weight
                        scores[category][subcategory] += len(matches) * weight
        
        # Also check for plain text keywords (lower weight)
        text_lower = text.lower()
        text_keywords = {
            'algebra': {
                'linear_equations': ['equation', 'solve', 'variable'],
                'quadratic_equations': ['quadratic', 'parabola'],
                'polynomials': ['polynomial', 'degree'],
                'functions': ['function', 'f(x)', 'g(x)'],
                'sequences': ['sequence', 'arithmetic', 'geometric'],
                'inequalities': ['inequality'],
                'general': ['expression', 'simplify']
            },
            'geometry': {
                'triangles': ['triangle', 'equilateral', 'isosceles', 'right'],
                'circles': ['circle', 'radius', 'diameter', 'circumference'],
                'polygons': ['square', 'rectangle', 'pentagon', 'hexagon', 'polygon'],
                'coordinate_geometry': ['coordinate', 'graph', 'slope', 'distance'],
                'solid_geometry': ['cube', 'sphere', 'cylinder', 'cone', 'volume', 'surface area', '3d'],
                'general': ['angle', 'area', 'perimeter', 'parallel', 'perpendicular']
            },
            'number_theory': {
                'divisibility': ['divisible', 'factor', 'multiple', 'remainder'],
                'primes': ['prime', 'factorization'],
                'modular_arithmetic': ['modulo', 'congruent'],
                'diophantine_equations': ['integer', 'whole number', 'positive integer', 'diophantine', 'solution'],
                'sequences_patterns': ['pattern', 'sequence', 'next'],
                'general': ['gcd', 'lcm']
            },
            'combinatorics': {
                'counting': ['ways', 'count', 'how many'],
                'permutations_combinations': ['arrange', 'order', 'choose', 'select', 'combination', 'permutation'],
                'probability': ['probability', 'chance', 'likely', 'random', 'draw', 'pick'],
                'pigeonhole_principle': ['pigeonhole', 'drawer', 'box', 'must', 'guarantee'],
                'graph_theory': ['graph', 'vertex', 'edge']
            },
            'precalculus': {
                'trigonometry': ['trigonometry', 'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan'],
                'complex_numbers': ['complex', 'imaginary', 'i^2'],
                'vectors': ['vector'],
                'matrices': ['matrix', 'determinant'],
                'conic_sections': ['parabola', 'ellipse', 'hyperbola']
            }
        }
        
        for category, subcategories in text_keywords.items():
            for subcategory, keywords in subcategories.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        # Text keywords get much lower weight than LaTeX patterns
                        scores[category][subcategory] += 1
    
    def _convert_latex_to_plain_text(self, latex_text):
        """Convert LaTeX mathematical expressions to plain text equivalents"""
        if not latex_text:
            return latex_text
        
        # Common LaTeX to plain text conversions
        conversions = {
            # Fractions
            r'\\frac\{([^}]+)\}\{([^}]+)\}': r'\1/\2',
            r'\\dfrac\{([^}]+)\}\{([^}]+)\}': r'\1/\2',
            
            # Basic operations
            r'\\cdot': '*',
            r'\\times': '*',
            r'\\div': '/',
            
            # Exponents - handle complex expressions better
            r'\^\{([^}]+)\}': r'^(\1)',  # Complex exponents like a^{n+1}
            r'\^([0-9]+)': r'^\1',  # Simple exponents like x^2
            
            # Square roots
            r'\\sqrt\{([^}]+)\}': r'sqrt(\1)',
            r'\\sqrt\[([0-9]+)\]\{([^}]+)\}': r'\1th_root(\2)',
            
            # Greek letters
            r'\\pi': 'pi',
            r'\\theta': 'theta',
            r'\\alpha': 'alpha',
            r'\\beta': 'beta',
            
            # Functions
            r'\\sin': 'sin',
            r'\\cos': 'cos',
            r'\\tan': 'tan',
            r'\\log': 'log',
            r'\\ln': 'ln',
            
            # Special symbols
            r'\\angle': 'angle',
            r'\\triangle': 'triangle',
            r'\\circ': 'circle',
            r'\\parallel': 'parallel',
            r'\\perp': 'perpendicular',
            r'\\equiv': 'congruent',
            r'\\sim': 'similar',
            r'\\degree': 'degrees',
            
            # Fix degree symbol specifically
            r'\\circ': 'degrees',
            
            # Number theory
            r'\\gcd': 'gcd',
            r'\\lcm': 'lcm',
            r'\\bmod': 'mod',
            
            # Combinatorics
            r'\\binom\{([^}]+)\}\{([^}]+)\}': r'C(\1,\2)',
            
            # Vectors
            r'\\vec\{([^}]+)\}': r'vector(\1)',
            
            # Remove LaTeX commands that don't have plain text equivalents
            r'\\text\{([^}]+)\}': r'\1',
            r'\\textbf\{([^}]+)\}': r'\1',
            r'\\boxed\{([^}]+)\}': r'\1',
            r'\\implies': 'implies',
            r'\\rightarrow': '->',
            r'\\leftarrow': '<-',
            r'\\leftrightarrow': '<->',
            
            # Remove dollar signs and other LaTeX delimiters
            r'\$': '',
            r'\\\[': '',
            r'\\\]': '',
            r'\\begin\{[^}]*\}': '',
            r'\\end\{[^}]*\}': '',
            r'\\qquad': '  ',
            r'\\quad': ' ',
            r'\\hspace\{[^}]*\}': ' ',
        }
        
        plain_text = latex_text
        
        # Apply conversions
        for latex_pattern, plain_replacement in conversions.items():
            plain_text = re.sub(latex_pattern, plain_replacement, plain_text)
        
        # Clean up extra spaces
        plain_text = re.sub(r'\s+', ' ', plain_text).strip()
        
        return plain_text
    
    def _analyze_both_formats(self, text, scores, content_type):
        """Analyze both LaTeX and plain text versions of the content"""
        if not text:
            return
        
        # Analyze original text (LaTeX format)
        self._analyze_text(text, scores, content_type)
        
        # Convert to plain text and analyze again
        plain_text = self._convert_latex_to_plain_text(text)
        if plain_text != text:  # Only analyze if conversion actually changed something
            self._analyze_text(plain_text, scores, content_type)

def main():
    """Test the LaTeX-based categorizer"""
    categorizer = LatexBasedCategorizer()
    
    # Test with a sample problem
    test_problem = {
        'question': {
            'text': 'What is the value of $\\frac{3}{4} + \\frac{1}{2}$?',
            'latex_choices': [
                '$\\textbf{(A) }\\frac{5}{4}\\qquad\\textbf{(B) }\\frac{3}{2}\\qquad\\textbf{(C) }\\frac{7}{4}\\qquad\\textbf{(D) }2\\qquad\\textbf{(E) }\\frac{9}{4}$'
            ]
        },
        'solutions': [
            {'text': 'To add fractions, we need a common denominator...'}
        ]
    }
    
    result = categorizer.categorize_problem(test_problem)
    print("Test categorization result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 