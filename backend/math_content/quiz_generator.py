"""
MindSpark Fun Quiz Generator
Creates engaging, themed math quizzes with varied question types
"""

import random
import math
from .content import quiz_themes

class QuizGenerator:
    def __init__(self):
        self.themes = quiz_themes
    
    def generate_quiz(self, topic, difficulty="intermediate", num_questions=5):
        """Generate a fun, themed quiz for the given topic"""
        theme_name = random.choice(list(self.themes.keys()))
        theme = self.themes[theme_name]
        
        questions = []
        
        # Generate questions based on topic
        if topic == "Basic Addition":
            questions = self._generate_addition_quiz(theme, num_questions, difficulty)
        elif topic == "Basic Subtraction":
            questions = self._generate_subtraction_quiz(theme, num_questions, difficulty)
        elif topic == "Basic Multiplication Tables":
            questions = self._generate_multiplication_quiz(theme, num_questions, difficulty)
        elif topic == "Basic Division":
            questions = self._generate_division_quiz(theme, num_questions, difficulty)
        elif topic == "Fractions Introduction":
            questions = self._generate_fractions_quiz(theme, num_questions, difficulty)
        elif topic == "Advanced Multiplication":
            questions = self._generate_advanced_multiplication_quiz(theme, num_questions, difficulty)
        elif topic == "Long Division":
            questions = self._generate_long_division_quiz(theme, num_questions, difficulty)
        elif topic == "Fractions Operations":
            questions = self._generate_fraction_operations_quiz(theme, num_questions, difficulty)
        elif topic == "Decimals":
            questions = self._generate_decimals_quiz(theme, num_questions, difficulty)
        elif topic == "Percentages":
            questions = self._generate_percentages_quiz(theme, num_questions, difficulty)
        elif topic == "Basic Geometry":
            questions = self._generate_geometry_quiz(theme, num_questions, difficulty)
        elif topic == "Pre-Algebra":
            questions = self._generate_pre_algebra_quiz(theme, num_questions, difficulty)
        elif topic == "Basic Algebra":
            questions = self._generate_algebra_quiz(theme, num_questions, difficulty)
        elif topic == "Calculus Introduction":
            questions = self._generate_calculus_quiz(theme, num_questions, difficulty)
        else:
            # Default generic quiz
            questions = self._generate_generic_quiz(topic, theme, num_questions, difficulty)
        
        return {
            "theme": theme_name,
            "intro": theme["intro"],
            "questions": questions
        }
    
    def _generate_addition_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            if difficulty == "beginner":
                a, b = random.randint(1, 20), random.randint(1, 20)
            else:
                a, b = random.randint(10, 99), random.randint(10, 99)
            
            correct = a + b
            context = random.choice(contexts)
            
            # Create themed question
            question_text = f"{context} You need to add {a} + {b}. What's the total?"
            
            # Generate wrong answers
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-10, 10)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_subtraction_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            if difficulty == "beginner":
                a = random.randint(10, 50)
                b = random.randint(1, a)
            else:
                a = random.randint(50, 200)
                b = random.randint(10, a)
            
            correct = a - b
            context = random.choice(contexts)
            
            question_text = f"{context} You start with {a} and need to subtract {b}. What's left?"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-5, 5)
                if wrong != correct and wrong >= 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_multiplication_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            if difficulty == "beginner":
                a, b = random.randint(2, 9), random.randint(2, 9)
            else:
                a, b = random.randint(5, 15), random.randint(5, 15)
            
            correct = a * b
            context = random.choice(contexts)
            
            question_text = f"{context} You need {a} groups of {b} items each. How many total?"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-15, 15)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_division_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            if difficulty == "beginner":
                b = random.randint(2, 10)
                correct = random.randint(2, 12)
                a = b * correct
            else:
                b = random.randint(5, 20)
                correct = random.randint(5, 25)
                a = b * correct
            
            context = random.choice(contexts)
            
            question_text = f"{context} You have {a} items to divide equally into {b} groups. How many in each group?"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-3, 3)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_fractions_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        fraction_types = [
            (1, 2, "1/2", "one half"),
            (1, 3, "1/3", "one third"),
            (1, 4, "1/4", "one quarter"),
            (2, 3, "2/3", "two thirds"),
            (3, 4, "3/4", "three quarters"),
            (2, 5, "2/5", "two fifths"),
            (3, 5, "3/5", "three fifths"),
            (4, 5, "4/5", "four fifths")
        ]
        
        for i in range(num_questions):
            num, den, frac_str, frac_words = random.choice(fraction_types)
            context = random.choice(contexts)
            
            question_text = f"{context} If something is divided into {den} equal parts and you take {num} parts, what fraction do you have?"
            
            correct_option = frac_str
            options = [correct_option]
            
            # Add wrong fraction options
            while len(options) < 4:
                wrong_num = random.randint(1, 5)
                wrong_den = random.randint(2, 8)
                wrong_frac = f"{wrong_num}/{wrong_den}"
                if wrong_frac != correct_option and wrong_frac not in options:
                    options.append(wrong_frac)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': options,
                'correct': options.index(correct_option)
            })
        
        return questions
    
    def _generate_calculus_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Generate different types of basic calculus problems
            problem_type = random.choice(['derivative_power', 'derivative_constant', 'simple_integral'])
            
            if problem_type == 'derivative_power':
                power = random.randint(2, 5)
                coeff = random.randint(1, 5)
                
                # d/dx of ax^n = nax^(n-1)
                new_coeff = coeff * power
                new_power = power - 1
                
                if new_power == 1:
                    answer = f"{new_coeff}x"
                elif new_power == 0:
                    answer = str(new_coeff)
                else:
                    answer = f"{new_coeff}x^{new_power}"
                
                question_text = f"{context} Find the derivative of f(x) = {coeff}x^{power}"
                
                # Generate wrong options
                options = [answer]
                wrong_options = [
                    f"{coeff}x^{power-1}",  # forgot to multiply by power
                    f"{coeff*power}x^{power}",  # didn't reduce power
                    f"{coeff}x^{power+1}"  # increased power instead
                ]
                
                for opt in wrong_options:
                    if opt != answer and opt not in options:
                        options.append(opt)
                
                while len(options) < 4:
                    wrong_coeff = random.randint(1, 10)
                    wrong_power = random.randint(0, 4)
                    if wrong_power == 1:
                        wrong_opt = f"{wrong_coeff}x"
                    elif wrong_power == 0:
                        wrong_opt = str(wrong_coeff)
                    else:
                        wrong_opt = f"{wrong_coeff}x^{wrong_power}"
                    
                    if wrong_opt != answer and wrong_opt not in options:
                        options.append(wrong_opt)
            
            elif problem_type == 'derivative_constant':
                constant = random.randint(1, 20)
                question_text = f"{context} Find the derivative of f(x) = {constant}"
                answer = "0"
                options = ["0", str(constant), "1", f"{constant}x"]
            
            else:  # simple_integral
                coeff = random.randint(1, 5)
                power = random.randint(1, 4)
                
                # ∫ ax^n dx = (a/(n+1))x^(n+1) + C
                new_power = power + 1
                if coeff == 1:
                    if new_power == 1:
                        answer = "x + C"
                    else:
                        answer = f"x^{new_power}/{new_power} + C"
                else:
                    if new_power == 1:
                        answer = f"{coeff}x + C"
                    else:
                        answer = f"{coeff}x^{new_power}/{new_power} + C"
                
                question_text = f"{context} Find the integral of f(x) = {coeff}x^{power}"
                
                options = [answer]
                wrong_options = [
                    f"{coeff}x^{power} + C",  # didn't integrate
                    f"{coeff*power}x^{power-1} + C",  # took derivative instead
                    f"{coeff}x^{power+1} + C"  # forgot to divide by new power
                ]
                
                for opt in wrong_options:
                    if opt != answer and opt not in options:
                        options.append(opt)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': options,
                'correct': options.index(answer)
            })
        
        return questions
    
    def _generate_algebra_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Generate simple linear equations: ax + b = c
            a = random.randint(2, 10)
            b = random.randint(1, 20)
            x = random.randint(1, 10)
            c = a * x + b
            
            question_text = f"{context} Solve for x: {a}x + {b} = {c}"
            correct = x
            
            options = [correct]
            while len(options) < 4:
                wrong = random.randint(1, 15)
                if wrong != correct and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_percentages_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Generate percentage problems
            base_number = random.randint(20, 200)
            percentage = random.choice([10, 20, 25, 50, 75])
            
            correct = int(base_number * percentage / 100)
            
            question_text = f"{context} What is {percentage}% of {base_number}?"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-20, 20)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_geometry_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            problem_type = random.choice(['rectangle_area', 'triangle_area', 'circle_area', 'perimeter'])
            
            if problem_type == 'rectangle_area':
                length = random.randint(3, 12)
                width = random.randint(3, 12)
                correct = length * width
                question_text = f"{context} A rectangle has length {length} and width {width}. What's its area?"
                
            elif problem_type == 'triangle_area':
                base = random.randint(4, 16)
                height = random.randint(3, 12)
                correct = int(base * height / 2)
                question_text = f"{context} A triangle has base {base} and height {height}. What's its area?"
                
            elif problem_type == 'circle_area':
                radius = random.randint(2, 8)
                correct = int(math.pi * radius * radius)
                question_text = f"{context} A circle has radius {radius}. What's its approximate area? (Use π ≈ 3.14)"
                
            else:  # perimeter
                side1 = random.randint(3, 10)
                side2 = random.randint(3, 10)
                correct = 2 * (side1 + side2)
                question_text = f"{context} A rectangle has length {side1} and width {side2}. What's its perimeter?"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-10, 10)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_pre_algebra_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Simple equations like x + a = b
            a = random.randint(1, 20)
            x = random.randint(1, 15)
            b = x + a
            
            question_text = f"{context} Solve for x: x + {a} = {b}"
            correct = x
            
            options = [correct]
            while len(options) < 4:
                wrong = random.randint(1, 25)
                if wrong != correct and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_advanced_multiplication_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            a = random.randint(15, 50)
            b = random.randint(12, 30)
            correct = a * b
            
            question_text = f"{context} Calculate {a} × {b}"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-100, 100)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_long_division_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            divisor = random.randint(8, 25)
            quotient = random.randint(8, 30)
            dividend = divisor * quotient
            
            question_text = f"{context} What is {dividend} ÷ {divisor}?"
            correct = quotient
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-5, 5)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_fraction_operations_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Simple fraction addition with same denominator
            denominator = random.choice([4, 6, 8, 10])
            num1 = random.randint(1, denominator - 2)
            num2 = random.randint(1, denominator - num1)
            
            result_num = num1 + num2
            
            # Simplify if possible
            def gcd(a, b):
                while b:
                    a, b = b, a % b
                return a
            
            common_divisor = gcd(result_num, denominator)
            simplified_num = result_num // common_divisor
            simplified_den = denominator // common_divisor
            
            if simplified_den == 1:
                correct = str(simplified_num)
            else:
                correct = f"{simplified_num}/{simplified_den}"
            
            question_text = f"{context} What is {num1}/{denominator} + {num2}/{denominator}?"
            
            options = [correct]
            # Add some wrong fraction options
            wrong_options = [
                f"{result_num}/{denominator}",  # unsimplified
                f"{num1 + num2}/{denominator * 2}",  # wrong denominator
                f"{num1 * num2}/{denominator}"  # multiplication instead
            ]
            
            for opt in wrong_options:
                if opt != correct and opt not in options:
                    options.append(opt)
            
            while len(options) < 4:
                wrong_num = random.randint(1, 10)
                wrong_den = random.randint(2, 12)
                wrong_opt = f"{wrong_num}/{wrong_den}"
                if wrong_opt != correct and wrong_opt not in options:
                    options.append(wrong_opt)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': options,
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_decimals_quiz(self, theme, num_questions, difficulty):
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Decimal addition
            a = round(random.uniform(1, 50), 2)
            b = round(random.uniform(1, 30), 2)
            correct = round(a + b, 2)
            
            question_text = f"{context} Calculate {a} + {b}"
            
            options = [correct]
            while len(options) < 4:
                wrong = round(correct + random.uniform(-5, 5), 2)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions
    
    def _generate_generic_quiz(self, topic, theme, num_questions, difficulty):
        """Generate a generic quiz for topics not specifically implemented"""
        questions = []
        contexts = theme["contexts"]
        
        for i in range(num_questions):
            context = random.choice(contexts)
            
            # Simple arithmetic as fallback
            a = random.randint(5, 50)
            b = random.randint(2, 25)
            operation = random.choice(['+', '-', '×'])
            
            if operation == '+':
                correct = a + b
                question_text = f"{context} Calculate {a} + {b}"
            elif operation == '-':
                if a < b:
                    a, b = b, a
                correct = a - b
                question_text = f"{context} Calculate {a} - {b}"
            else:  # multiplication
                correct = a * b
                question_text = f"{context} Calculate {a} × {b}"
            
            options = [correct]
            while len(options) < 4:
                wrong = correct + random.randint(-20, 20)
                if wrong != correct and wrong > 0 and wrong not in options:
                    options.append(wrong)
            
            random.shuffle(options)
            
            questions.append({
                'id': i + 1,
                'question': question_text,
                'options': [str(opt) for opt in options],
                'correct': options.index(correct)
            })
        
        return questions 