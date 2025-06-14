import requests
from bs4 import BeautifulSoup
import json
import re
import os

class AMCParser:
    def __init__(self):
        self.base_url = "https://artofproblemsolving.com/wiki/index.php"
        self.year = 2023
        self.levels = ["8"]#, "10A", "10B", "12A", "12B"]
        
    def get_problem_url(self, level, problem_number):
        return f"{self.base_url}/{self.year}_AMC_{level}_Problems/Problem_{problem_number}"
    
    def fetch_problem_page(self, url):
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def process_images(self, element, insertion_index, insertions):
        for img in element.find_all('img'):
            alt_text = img.get('alt', '')
            img_src = img.get('src', '')
            insertion_key = f"INSERTION_INDEX_{insertion_index}"
            insertions[insertion_key] = {
                "picture": img_src,
                "alt_type": "asy" if "[asy]" in alt_text else "latex",
                "alt_value": alt_text
            }
            img.replace_with(f"<{insertion_key}>")
            insertion_index += 1
        return insertion_index
    
    def extract_question_and_choices(self, soup):
        # Find the first h2 header that contains the problem
        problem_header = None
        for h2 in soup.find_all('h2'):
            if 'Problem' in h2.text:
                problem_header = h2
                break
        
        if not problem_header:
            return None, None, None
            
        # Get the first p block for question
        question_p = problem_header.find_next('p')
        if not question_p:
            return None, None, None
            
        # Process images and text from the question part
        insertions = {}
        insertion_index = 1
        insertion_index = self.process_images(question_p, insertion_index, insertions)
        question_text = question_p.text.strip()
        
        # Get the second p block for multiple choice
        choices_p = question_p.find_next('p')
        if not choices_p:
            return None, None, None
            
        # Extract choices from the second p block
        choices = {
            'text_choices': [],
            'picture_choices': [],
            'latex_choices': [],
            'asy_choices': []
        }
        
        # Process all images in the choices block
        for img in choices_p.find_all('img'):
            img_src = img.get('src', '')
            alt_text = img.get('alt', '')
            img_class = img.get('class', [])
            
            if img_src:
                # Always add the image source to picture_choices
                choices['picture_choices'].append(img_src)
                
                # Categorize based on alt text
                if alt_text.startswith('$'):
                    # This is a LaTeX choice
                    choices['latex_choices'].append(alt_text)
                elif alt_text.startswith('[asy]'):
                    # This is an Asymptote choice
                    choices['asy_choices'].append(alt_text)
                    
        # Process asymptote diagrams
        for asy in choices_p.find_all('pre', class_='asy'):
            asy_text = asy.text.strip()
            if asy_text and asy_text not in choices['asy_choices']:
                choices['asy_choices'].append(asy_text)
                
        return question_text, insertions, choices
    
    def extract_solutions(self, soup):
        solutions = []
        
        # Find all h2 tags that contain solution content
        solution_headers = []
        for h2 in soup.find_all('h2'):
            span = h2.find('span', class_='mw-headline')
            if span:
                span_id = span.get('id', '')
                # Look for Solution, Solution_1, Solution_2, etc. but exclude Video solutions
                if ((span_id == 'Solution' or 
                    (span_id.startswith('Solution_') and span_id.replace('Solution_', '').isdigit())) and
                    'Video_Solution' not in span_id):
                    solution_headers.append(h2)
        
        # Process each solution section
        for idx, header in enumerate(solution_headers):
            insertions = {}
            insertion_index = 1
            
            # Collect all content until next h2
            solution_html_parts = []
            current = header.next_sibling
            
            while current and (not (getattr(current, 'name', None) == 'h2')):
                if getattr(current, 'name', None) == 'p':
                    # Create a copy of the p element to modify
                    p_copy = current.__copy__()
                    
                    # Process images in this p element
                    insertion_index = self.process_images(p_copy, insertion_index, insertions)
                    
                    # Convert to string but clean up the HTML
                    p_html = str(p_copy).strip()
                    if p_html:
                        solution_html_parts.append(p_html)
                        
                current = current.next_sibling
            
            # Join with no extra spacing and clean up
            if solution_html_parts:
                combined_html = ''.join(solution_html_parts)
                # Clean up any extra whitespace while preserving structure
                combined_html = combined_html.replace('\n', '').replace('  ', ' ')
                # Unescape the insertion placeholders
                combined_html = combined_html.replace('&lt;INSERTION_INDEX_', '<INSERTION_INDEX_')
                combined_html = combined_html.replace('&gt;', '>')
                
                solutions.append({
                    'text': combined_html,
                    'insertions': insertions
                })
        
        return solutions
    
    def extract_answer(self, soup):
        question_text, _, _ = self.extract_question_and_choices(soup)
        if question_text:
            patterns = [
                r'\\boxed\{([A-E])\}',
                r'\\boxed{([A-E])}',
                r'\\boxed{([A-E])}',
                r'\\boxed\{([A-E])\}',
                r'\\boxed{([A-E])}',
                r'\\boxed\{([A-E])\}'
            ]
            for pattern in patterns:
                answer_match = re.search(pattern, question_text)
                if answer_match:
                    return answer_match.group(1)
        solutions = self.extract_solutions(soup)
        for solution in solutions:
            # Search in the solution text content
            text_content = solution.get('text', '')
            for pattern in patterns:
                answer_match = re.search(pattern, text_content)
                if answer_match:
                    return answer_match.group(1)
        return None
    
    def parse_problem(self, level, problem_number):
        url = self.get_problem_url(level, problem_number)
        html = self.fetch_problem_page(url)
        if not html:
            return None
        soup = BeautifulSoup(html, 'html.parser')
        question_text, insertions, choices = self.extract_question_and_choices(soup)
        if not question_text:
            return None
        solutions = self.extract_solutions(soup)
        answer = self.extract_answer(soup)
        problem_data = {
            'id': f'amc_{self.year}_{level}_{problem_number}',
            'question': {
                'text': question_text,
                'insertions': insertions,
                'type': 'multiple-choice',
                **choices
            },
            'tags': [],
            'sources': [],
            'answer': answer,
            'solutions': solutions
        }
        return problem_data
    
    def parse_all_problems(self):
        all_problems = []
        for level in self.levels:
            num_problems = 4
            for problem_number in range(1, num_problems + 1):
                print(f"Parsing {self.year} AMC {level} Problem {problem_number}...")
                problem_data = self.parse_problem(level, problem_number)
                if problem_data:
                    all_problems.append(problem_data)
        return all_problems
    
    def save_to_json(self, problems, output_file):
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(problems, f, indent=2, ensure_ascii=False)

def main():
    parser = AMCParser()
    problems = parser.parse_all_problems()
    os.makedirs('../../backend-java/questions/level-1', exist_ok=True)
    output_file = '../../backend-java/questions/level-1/amc_2023_problems.json'
    parser.save_to_json(problems, output_file)
    print(f"Saved {len(problems)} problems to {output_file}")

if __name__ == "__main__":
    main() 