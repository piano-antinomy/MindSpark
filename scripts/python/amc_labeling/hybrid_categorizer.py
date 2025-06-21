#!/usr/bin/env python3
"""
Hybrid AMC Problem Categorizer: Combines rule-based and ML approaches for 90%+ accuracy.
"""

import json
import os
import re
import numpy as np
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle

class HybridCategorizer:
    def __init__(self):
        # Enhanced rule-based categories with negative keywords and confidence scoring
        self.categories = {
            'Algebra': {
                'positive_keywords': [
                    'equation', 'solve for', 'variable', 'expression', 'factor', 'expand',
                    'quadratic', 'linear', 'system of equations', 'function', 'sequence', 'series',
                    'polynomial', 'inequality', 'absolute value', 'rational expression',
                    'substitute', 'simplify', 'evaluate'
                ],
                'negative_keywords': ['triangle', 'circle', 'area', 'perimeter', 'volume', 'angle'],
                'patterns': [
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions
                    r'x\s*[+\-*/]\s*y',  # Variables with operations
                    r'\\sqrt\{[^}]+\}',  # Square roots
                    r'\\boxed\{[^}]+\}',  # Boxed answers
                    r'solve.*equation',  # Solve equations
                    r'find.*value.*x',  # Find variable values
                ],
                'confidence_threshold': 0.7
            },
            'Geometry': {
                'positive_keywords': [
                    'triangle', 'circle', 'square', 'rectangle', 'area', 'perimeter',
                    'volume', 'surface area', 'angle', 'side', 'radius', 'diameter',
                    'similar', 'congruent', 'parallel', 'perpendicular', 'coordinate',
                    'distance', 'midpoint', 'slope', 'polygon', 'hexagon', 'octagon',
                    'height', 'base', 'altitude', 'median', 'centroid'
                ],
                'negative_keywords': ['remainder', 'divisible', 'prime', 'digit', 'probability'],
                'patterns': [
                    r'\\angle',  # Angle symbol
                    r'\\triangle',  # Triangle symbol
                    r'\\circ',  # Circle symbol
                    r'\\sqrt\{[^}]+\}',  # Square roots (often geometric)
                    r'area.*triangle',  # Area of triangle
                    r'perimeter.*',  # Perimeter
                ],
                'confidence_threshold': 0.6
            },
            'Number Theory': {
                'positive_keywords': [
                    'prime', 'factor', 'divisible', 'remainder', 'modulo', 'gcd',
                    'lcm', 'integer', 'consecutive', 'even', 'odd', 'perfect square',
                    'perfect cube', 'base', 'digit', 'sum of digits', 'palindrome',
                    'divisor', 'multiple', 'coprime', 'congruent'
                ],
                'negative_keywords': ['triangle', 'circle', 'area', 'probability', 'arrangement'],
                'patterns': [
                    r'\\b\\d+\\b',  # Numbers
                    r'\\equiv',  # Congruence
                    r'\\pmod\{[^}]+\}',  # Modulo
                    r'remainder.*divided',  # Remainder problems
                    r'divisible.*',  # Divisibility
                ],
                'confidence_threshold': 0.7
            },
            'Counting & Probability': {
                'positive_keywords': [
                    'ways', 'arrangement', 'permutation', 'combination', 'probability',
                    'chance', 'likely', 'unlikely', 'pigeonhole', 'inclusion',
                    'exclusion', 'choose', 'select', 'order', 'sequence',
                    'how many', 'different', 'possible'
                ],
                'negative_keywords': ['area', 'perimeter', 'triangle', 'remainder', 'divisible'],
                'patterns': [
                    r'\\binom\{[^}]+\}\{[^}]+\}',  # Binomial coefficient
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions (often probability)
                    r'probability.*',  # Probability
                    r'how many ways',  # Counting
                ],
                'confidence_threshold': 0.6
            },
            'Arithmetic': {
                'positive_keywords': [
                    'percent', 'ratio', 'proportion', 'fraction', 'decimal',
                    'average', 'mean', 'median', 'mode', 'range', 'speed',
                    'distance', 'time', 'rate', 'work', 'money', 'cost', 'price',
                    'discount', 'tax', 'interest', 'percentage'
                ],
                'negative_keywords': ['triangle', 'angle', 'remainder', 'divisible', 'probability'],
                'patterns': [
                    r'\\%',  # Percent symbol
                    r'\\frac\{[^}]+\}\{[^}]+\}',  # Fractions
                    r'\\d+\\.\\d+',  # Decimals
                    r'percent.*',  # Percent problems
                    r'average.*',  # Average problems
                ],
                'confidence_threshold': 0.6
            },
            'Logic & Puzzles': {
                'positive_keywords': [
                    'pattern', 'sequence', 'next', 'find', 'determine', 'if',
                    'then', 'therefore', 'because', 'since', 'game', 'strategy',
                    'win', 'lose', 'turn', 'move', 'rule', 'condition',
                    'logical', 'deduce', 'conclude', 'imply'
                ],
                'negative_keywords': ['area', 'perimeter', 'remainder', 'divisible', 'probability'],
                'patterns': [
                    r'if.*then',  # If-then statements
                    r'\\Rightarrow',  # Implication
                    r'pattern.*',  # Pattern problems
                    r'sequence.*',  # Sequence problems
                ],
                'confidence_threshold': 0.5
            }
        }
        
        # Load golden truth from external file
        self.golden_truth = self.load_golden_truth()
        
        # ML components
        self.vectorizer = None
        self.ml_model = None
        self.ml_threshold = 0.8  # Use ML when rule-based confidence is below this
        
    def load_golden_truth(self):
        """Load golden truth labels from external JSON file."""
        try:
            with open('golden_truth_labels.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract just the labels dictionary
            golden_truth = {}
            for problem_id, label_data in data['labels'].items():
                golden_truth[problem_id] = label_data['category']
            
            print(f"Loaded {len(golden_truth)} golden truth labels from golden_truth_labels.json")
            return golden_truth
            
        except FileNotFoundError:
            print("Warning: golden_truth_labels.json not found. Using empty golden truth set.")
            return {}
        except Exception as e:
            print(f"Error loading golden truth labels: {e}")
            return {}
    
    def rule_based_categorize(self, problem_text, problem_id):
        """Enhanced rule-based categorization with confidence scoring."""
        text_lower = problem_text.lower()
        
        # Score each category
        category_scores = defaultdict(float)
        
        for category, rules in self.categories.items():
            score = 0.0
            
            # Check positive keywords
            for keyword in rules['positive_keywords']:
                if keyword.lower() in text_lower:
                    score += 1.0
            
            # Check negative keywords (penalty)
            for keyword in rules['negative_keywords']:
                if keyword.lower() in text_lower:
                    score -= 0.5
            
            # Check patterns
            for pattern in rules['patterns']:
                matches = re.findall(pattern, problem_text, re.IGNORECASE)
                score += len(matches) * 0.3
            
            # Normalize score
            max_possible = len(rules['positive_keywords']) + len(rules['patterns']) * 0.3
            if max_possible > 0:
                confidence = max(0, score / max_possible)
            else:
                confidence = 0
            
            category_scores[category] = confidence
        
        # Return best category and confidence
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            return best_category[0], best_category[1]
        
        return 'Uncategorized', 0.0
    
    def prepare_ml_data(self, amc_dir="../../../backend-java/questions/AMC"):
        """Prepare training data for ML model."""
        texts = []
        labels = []
        
        # Walk through AMC directory
        for root, dirs, files in os.walk(amc_dir):
            for file in files:
                if file.endswith('.json') and 'Problem_' not in file:
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
                            
                            # Create readable ID
                            if is_ajhsme:
                                readable_id = f"{year}_AJHSME_{problem_id.split('_')[-1]}"
                            else:
                                readable_id = f"{year}_AMC_{level}_{problem_id.split('_')[-1]}"
                            
                            # Only use problems with known labels
                            if readable_id in self.golden_truth:
                                texts.append(question_text)
                                labels.append(self.golden_truth[readable_id])
                    
                    except Exception as e:
                        print(f"Error processing {file}: {e}")
        
        return texts, labels
    
    def train_ml_model(self):
        """Train the ML model on golden truth data."""
        print("Preparing ML training data...")
        texts, labels = self.prepare_ml_data()
        
        if len(texts) < 10:
            print("Not enough training data for ML model")
            return False
        
        print(f"Training ML model on {len(texts)} samples...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42
        )
        
        # Vectorize text
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english'
        )
        
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Train model
        self.ml_model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            class_weight='balanced'
        )
        
        self.ml_model.fit(X_train_vec, y_train)
        
        # Evaluate
        y_pred = self.ml_model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"ML Model Accuracy: {accuracy:.2%}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return True
    
    def ml_categorize(self, problem_text):
        """Categorize using ML model."""
        if self.ml_model is None or self.vectorizer is None:
            return 'Uncategorized', 0.0
        
        # Vectorize text
        text_vec = self.vectorizer.transform([problem_text])
        
        # Predict
        prediction = self.ml_model.predict(text_vec)[0]
        confidence = max(self.ml_model.predict_proba(text_vec)[0])
        
        return prediction, confidence
    
    def hybrid_categorize(self, problem_text, problem_id):
        """Hybrid categorization: rule-based first, ML for low confidence."""
        # Try rule-based first
        rule_category, rule_confidence = self.rule_based_categorize(problem_text, problem_id)
        
        # If rule-based confidence is low, try ML
        if rule_confidence < self.ml_threshold and self.ml_model is not None:
            ml_category, ml_confidence = self.ml_categorize(problem_text)
            
            # Use ML if it has higher confidence
            if ml_confidence > rule_confidence:
                return ml_category, ml_confidence, 'ML'
        
        return rule_category, rule_confidence, 'Rule-based'
    
    def process_amc_files(self, amc_dir="../../../backend-java/questions/AMC"):
        """Process all AMC files with hybrid categorization."""
        categorized_problems = defaultdict(list)
        
        # Walk through AMC directory
        for root, dirs, files in os.walk(amc_dir):
            for file in files:
                if file.endswith('.json') and 'Problem_' not in file:
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
                            
                            # Create readable ID
                            if is_ajhsme:
                                readable_id = f"{year}_AJHSME_{problem_id.split('_')[-1]}"
                            else:
                                readable_id = f"{year}_AMC_{level}_{problem_id.split('_')[-1]}"
                            
                            # Hybrid categorization
                            category, confidence, method = self.hybrid_categorize(question_text, problem_id)
                            
                            categorized_problems[category].append({
                                'id': readable_id,
                                'problem_id': problem_id,
                                'file': file,
                                'confidence': confidence,
                                'method': method,
                                'question_preview': question_text[:100] + '...' if len(question_text) > 100 else question_text
                            })
                    
                    except Exception as e:
                        print(f"Error processing {file}: {e}")
        
        return categorized_problems
    
    def validate_against_golden_truth(self, categorized_problems):
        """Validate hybrid categorization against golden truth."""
        print("=== HYBRID VALIDATION AGAINST GOLDEN TRUTH ===\n")
        
        correct = 0
        total = 0
        method_stats = defaultdict(lambda: {'correct': 0, 'total': 0})
        
        for category, problems in categorized_problems.items():
            for problem in problems:
                problem_key = problem['id'].replace('_', '_').replace('AMC_', 'AMC_')
                
                if problem_key in self.golden_truth:
                    expected_category = self.golden_truth[problem_key]
                    actual_category = category
                    method = problem['method']
                    
                    total += 1
                    method_stats[method]['total'] += 1
                    
                    if expected_category == actual_category:
                        correct += 1
                        method_stats[method]['correct'] += 1
                        print(f"✅ {problem_key}: Expected {expected_category}, Got {actual_category} ({method}, {problem['confidence']:.2f})")
                    else:
                        print(f"❌ {problem_key}: Expected {expected_category}, Got {actual_category} ({method}, {problem['confidence']:.2f})")
        
        if total > 0:
            accuracy = (correct / total) * 100
            print(f"\nOverall Accuracy: {correct}/{total} = {accuracy:.1f}%")
            
            print("\nMethod Breakdown:")
            for method, stats in method_stats.items():
                if stats['total'] > 0:
                    method_accuracy = (stats['correct'] / stats['total']) * 100
                    print(f"  {method}: {stats['correct']}/{stats['total']} = {method_accuracy:.1f}%")
        else:
            print("No golden truth problems found in the data.")
    
    def save_model(self, filename="hybrid_categorizer_model.pkl"):
        """Save the trained ML model."""
        if self.ml_model is not None and self.vectorizer is not None:
            model_data = {
                'vectorizer': self.vectorizer,
                'model': self.ml_model
            }
            with open(filename, 'wb') as f:
                pickle.dump(model_data, f)
            print(f"Model saved to {filename}")
    
    def load_model(self, filename="hybrid_categorizer_model.pkl"):
        """Load a trained ML model."""
        try:
            with open(filename, 'rb') as f:
                model_data = pickle.load(f)
            self.vectorizer = model_data['vectorizer']
            self.ml_model = model_data['model']
            print(f"Model loaded from {filename}")
            return True
        except FileNotFoundError:
            print(f"Model file {filename} not found")
            return False

def main():
    categorizer = HybridCategorizer()
    
    # Try to load existing model, otherwise train new one
    if not categorizer.load_model():
        print("Training new ML model...")
        if not categorizer.train_ml_model():
            print("Failed to train ML model, using rule-based only")
    
    print("\nProcessing AMC files with hybrid categorization...")
    categorized_problems = categorizer.process_amc_files()
    
    # Print results
    print("\n=== HYBRID CATEGORIZATION RESULTS ===")
    for category, problems in categorized_problems.items():
        print(f"\n## {category} ({len(problems)} problems)")
        print("-" * 50)
        
        # Show method breakdown
        method_counts = defaultdict(int)
        for problem in problems:
            method_counts[problem['method']] += 1
        
        for method, count in method_counts.items():
            print(f"  {method}: {count} problems")
        
        # Show sample problems
        for problem in problems[:5]:
            print(f"- {problem['id']}: {problem['question_preview']} ({problem['method']}, {problem['confidence']:.2f})")
        
        if len(problems) > 5:
            print(f"  ... and {len(problems) - 5} more")
    
    # Validate against golden truth
    categorizer.validate_against_golden_truth(categorized_problems)
    
    # Save results
    output_file = "hybrid_categorized_problems.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(categorized_problems, f, indent=2, ensure_ascii=False)
    
    print(f"\nResults saved to {output_file}")
    
    # Save model for future use
    categorizer.save_model()

if __name__ == "__main__":
    main() 