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
    
    def process_images(self, element, insertion_index, insertions, extract_answer=False):
        extracted_answer = None
        
        for img in element.find_all('img'):
            alt_text = img.get('alt', '')
            img_src = img.get('src', '')
            insertion_key = f"INSERTION_INDEX_{insertion_index}"
            insertions[insertion_key] = {
                "picture": img_src,
                "alt_type": "asy" if "[asy]" in alt_text else "latex",
                "alt_value": alt_text
            }
            
            # Extract answer from LaTeX alt text if requested and not already found
            if extract_answer and not extracted_answer and alt_text:
                # Look for the 2 patterns actually found in AMC problems
                answer_patterns = [
                    r'\\boxed\{\\textbf\{\(([A-E])\)\}\\?.*?\}',  # \boxed{\textbf{(D)}\ 18}
                    r'\\boxed\{\\textbf\{\(([A-E])\)\}\}',        # \boxed{\textbf{(D)}}
                ]
                
                for pattern in answer_patterns:
                    match = re.search(pattern, alt_text)
                    if match:
                        extracted_answer = match.group(1)
                        print(f"Found answer '{extracted_answer}' in LaTeX: {alt_text}")
                        break
            
            img.replace_with(f"<{insertion_key}>")
            insertion_index += 1
        
        if extract_answer:
            return insertion_index, extracted_answer
        else:
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
        
        # Collect all p elements under the Problem header until next h2
        question_p_elements = []
        current = problem_header.next_sibling
        
        while current and (not (getattr(current, 'name', None) == 'h2')):
            if getattr(current, 'name', None) == 'p':
                question_p_elements.append(current)
            current = current.next_sibling
        
        if not question_p_elements:
            return None, None, None
        
        # Separate question (all but last p) from choices (last p)
        question_ps = question_p_elements[:-1] if len(question_p_elements) > 1 else question_p_elements
        choices_p = question_p_elements[-1] if len(question_p_elements) > 1 else None
        
        # Process question part with HTML preservation
        insertions = {}
        insertion_index = 1
        question_html_parts = []
        
        for p_element in question_ps:
            # Create a copy of the p element to modify
            p_copy = p_element.__copy__()
            
            # Process images in this p element
            insertion_index = self.process_images(p_copy, insertion_index, insertions)
            
            # Convert to string but clean up the HTML
            p_html = str(p_copy).strip()
            if p_html:
                question_html_parts.append(p_html)
        
        # Join question parts and clean up
        if question_html_parts:
            question_text = ''.join(question_html_parts)
            # Clean up any extra whitespace while preserving structure
            question_text = question_text.replace('\n', '').replace('  ', ' ')
            # Unescape the insertion placeholders
            question_text = question_text.replace('&lt;INSERTION_INDEX_', '<INSERTION_INDEX_')
            question_text = question_text.replace('&gt;', '>')
        else:
            return None, None, None
        
        # Process choices if they exist
        choices = {
            'text_choices': [],
            'picture_choices': [],
            'latex_choices': [],
            'asy_choices': []
        }
        
        if choices_p:
            # Process all images in the choices block
            for img in choices_p.find_all('img'):
                img_src = img.get('src', '')
                alt_text = img.get('alt', '')
                
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
        extracted_answer = None
        
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
                    
                    # Only extract answer if we haven't found one yet
                    if not extracted_answer:
                        insertion_index, answer = self.process_images(p_copy, insertion_index, insertions, extract_answer=True)
                        if answer:
                            extracted_answer = answer
                    else:
                        # We already have an answer, just process images normally
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
        
        return solutions, extracted_answer
    
    def parse_problem(self, level, problem_number):
        url = self.get_problem_url(level, problem_number)
        html = self.fetch_problem_page(url)
        if not html:
            return None
        soup = BeautifulSoup(html, 'html.parser')
        question_text, insertions, choices = self.extract_question_and_choices(soup)
        
        # Raise exception if no question found
        if not question_text:
            raise ValueError(f"No question text found for {level} Problem {problem_number}")
        
        # Raise exception if no multiple choice options found
        has_choices = (choices['text_choices'] or 
                      choices['picture_choices'] or 
                      choices['latex_choices'] or 
                      choices['asy_choices'])
        if not has_choices:
            raise ValueError(f"No multiple choice options found for {level} Problem {problem_number}")
        
        solutions, extracted_answer = self.extract_solutions(soup) # Extract solutions and answer together
        
        # Raise exception if no solutions found
        if not solutions:
            raise ValueError(f"No solutions found for {level} Problem {problem_number}")
        
        # Raise exception if no answer found
        if not extracted_answer:
            raise ValueError(f"No answer found for {level} Problem {problem_number}")
        
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
            'answer': extracted_answer,
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
    output_file = '../../backend-java/questions/level-1/amc_2023_problems_new.json'
    parser.save_to_json(problems, output_file)
    print(f"Saved {len(problems)} problems to {output_file}")

if __name__ == "__main__":
    main() 