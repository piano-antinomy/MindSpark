import requests
from bs4 import BeautifulSoup
import json
import re
import os

class AMCParser:
    def __init__(self, target_competitions=None, competition_dict_file="competition_dict.json"):
        self.base_url = "https://artofproblemsolving.com/wiki/index.php"
        self.competition_dict_file = competition_dict_file
        # Configure all competitions we want to download
        self.competitions = target_competitions if target_competitions else self._generate_competitions_from_dict()
        
    def _generate_competitions_from_dict(self):
        """Generate competitions from competition_dict.json file"""
        with open(self.competition_dict_file, 'r', encoding='utf-8') as f:
            competition_dict = json.load(f)
        
        competitions = []
        
        for range_data in competition_dict:
            start_year = range_data['start']
            end_year = range_data['end']  # inclusive
            
            # Check if this is AJHSME
            if range_data.get('is_AJHSME', False):
                # Generate AJHSME competitions (no levels, just years)
                num_problems = range_data.get('num_problems', 25)
                for year in range(start_year, end_year + 1):
                    competitions.append({
                        'year': year,
                        'is_AJHSME': True,
                        'fall_version': False,
                        'num_problems': num_problems
                    })
            else:
                # Generate regular AMC competitions
                for level_data in range_data['levels']:
                    level = level_data['level']
                    suffix = level_data.get('suffix', '')
                    has_fall_version = level_data.get('has_fall_version', [])  # List of years with fall versions
                    num_problems = level_data.get('num_problems', 25)
                    
                    # Generate competitions for each year in the range
                    for year in range(start_year, end_year + 1):  # +1 because end is inclusive
                        # Generate regular competition
                        competitions.append({
                            'year': year,
                            'level': level,
                            'suffix': suffix,
                            'fall_version': False,
                            'num_problems': num_problems
                        })
                        
                        # Generate fall version if this year is in the fall version list
                        if year in has_fall_version:
                            competitions.append({
                                'year': year,
                                'level': level,
                                'suffix': suffix,
                                'fall_version': True,
                                'num_problems': num_problems
                            })
        
        return competitions
        
    def get_problem_url(self, competition, problem_number):
        year = competition['year']
        fall_version = competition['fall_version']
        
        # Check if this is AJHSME
        if competition.get('is_AJHSME', False):
            comp_id = f"{year}_AJHSME"
        else:
            # Regular AMC competition
            level = competition['level']
            suffix = competition.get('suffix', competition.get('version', ''))  # Support both old and new format
            
            # Build the competition identifier
            if fall_version:
                comp_id = f"{year}_Fall_AMC_{level}{suffix}"
            else:
                comp_id = f"{year}_AMC_{level}{suffix}"
            
        return f"{self.base_url}/{comp_id}_Problems/Problem_{problem_number}"
    
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
    
    def parse_problem(self, competition, problem_number):
        url = self.get_problem_url(competition, problem_number)
        html = self.fetch_problem_page(url)
        if not html:
            return None
        soup = BeautifulSoup(html, 'html.parser')
        question_text, insertions, choices = self.extract_question_and_choices(soup)
        
        # Generate competition identifier for error messages
        comp_id = self._get_competition_id(competition)
        
        # Raise exception if no question found
        if not question_text:
            raise ValueError(f"No question text found for {comp_id} Problem {problem_number}")
        
        # Raise exception if no multiple choice options found
        has_choices = (choices['text_choices'] or 
                      choices['picture_choices'] or 
                      choices['latex_choices'] or 
                      choices['asy_choices'])
        if not has_choices:
            raise ValueError(f"No multiple choice options found for {comp_id} Problem {problem_number}")
        
        solutions, extracted_answer = self.extract_solutions(soup) # Extract solutions and answer together
        
        # Raise exception if no solutions found
        if not solutions:
            raise ValueError(f"No solutions found for {comp_id} Problem {problem_number}")
        
        # Raise exception if no answer found
        if not extracted_answer:
            raise ValueError(f"No answer found for {comp_id} Problem {problem_number}")
        
        problem_id = self._generate_problem_id(competition, problem_number)
        problem_data = {
            'id': problem_id,
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
    
    def _get_competition_id(self, competition):
        """Generate human-readable competition identifier for error messages"""
        year = competition['year']
        fall_version = competition['fall_version']
        
        # Check if this is AJHSME
        if competition.get('is_AJHSME', False):
            return f"{year} AJHSME"
        else:
            # Regular AMC competition
            level = competition['level']
            suffix = competition.get('suffix', competition.get('version', ''))  # Support both old and new format
            
            if fall_version:
                return f"{year} Fall AMC {level}{suffix}"
            else:
                return f"{year} AMC {level}{suffix}"
    
    def _generate_problem_id(self, competition, problem_number):
        """Generate unique problem ID"""
        year = competition['year']
        fall_version = competition['fall_version']
        
        # Check if this is AJHSME
        if competition.get('is_AJHSME', False):
            return f'ajhsme_{year}_{problem_number}'
        else:
            # Regular AMC competition
            level = competition['level']
            suffix = competition.get('suffix', competition.get('version', ''))  # Support both old and new format
            
            if fall_version:
                return f'amc_{year}_fall_{level}{suffix.lower()}_{problem_number}'
            else:
                return f'amc_{year}_{level}{suffix.lower()}_{problem_number}'
    
    def parse_all_problems(self):
        all_problems = []
        total_competitions = len(self.competitions)
        
        for i, competition in enumerate(self.competitions, 1):
            comp_id = self._get_competition_id(competition)
            num_problems = competition['num_problems']
            
            print(f"Processing competition {i}/{total_competitions}: {comp_id}")
            
            for problem_number in range(1, num_problems + 1):
                print(f"  Parsing {comp_id} Problem {problem_number}...")
                try:
                    problem_data = self.parse_problem(competition, problem_number)
                    if problem_data:
                        all_problems.append(problem_data)
                        print(f"  ✓ Successfully parsed {comp_id} Problem {problem_number}")
                    else:
                        print(f"  ⚠ Skipped {comp_id} Problem {problem_number} (no data returned)")
                except Exception as e:
                    print(f"  ✗ Failed to parse {comp_id} Problem {problem_number}: {e}")
                    # Continue with next problem instead of crashing
                    continue
            
            print(f"Completed {comp_id}: {len([p for p in all_problems if comp_id.replace(' ', '_').lower() in p['id']])} problems parsed")
            print("-" * 50)
        
        return all_problems
    
    def save_to_json(self, problems, output_file):
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(problems, f, indent=2, ensure_ascii=False)

def main(target_competitions=None):
    """
    Main function to download AMC problems
    
    Args:
        target_competitions: List of competition dictionaries to download. None for all competitions.
                           Each competition dict should have: {'year': int, 'level': str, 'version': str, 'fall_version': bool, 'num_problems': int}
    
    Examples:
        main()  # Download everything
        
        # Download specific competitions
        competitions = [
            {'year': 2023, 'level': '8', 'version': '', 'fall_version': False, 'num_problems': 25},
            {'year': 2023, 'level': '10', 'version': 'A', 'fall_version': False, 'num_problems': 5},
            {'year': 2021, 'level': '12', 'version': 'B', 'fall_version': True, 'num_problems': 10}
        ]
        main(target_competitions=competitions)
    """
    parser = AMCParser(target_competitions)
    
    # Print configuration
    print("=== AMC Problem Downloader Configuration ===")
    if target_competitions:
        print(f"Using custom competition list ({len(target_competitions)} competitions):")
        for comp in target_competitions:
            comp_id = parser._get_competition_id(comp)
            print(f"  - {comp_id} ({comp['num_problems']} problems)")
    else:
        print("Using all competitions (1999-2025)")
    print(f"Total competitions to process: {len(parser.competitions)}")
    print("=" * 45)
    
    problems = parser.parse_all_problems()
    
    # Generate output filename based on configuration
    if target_competitions:
        # Custom filename for specific competitions
        years = set(comp['year'] for comp in target_competitions)
        levels = set(comp['level'] for comp in target_competitions)
        
        if len(years) == 1:
            output_filename = f"amc_{list(years)[0]}"
        else:
            output_filename = f"amc_{min(years)}_to_{max(years)}"
        
        output_filename += f"_levels_{'_'.join(sorted(levels))}_custom.json"
    else:
        # Default filename for all competitions
        output_filename = "amc_1999_to_2025_all_levels_all_problems.json"
    
    os.makedirs('../../backend-java/questions/level-1', exist_ok=True)
    output_file = f'../../backend-java/questions/level-1/{output_filename}'
    parser.save_to_json(problems, output_file)
    print(f"Saved {len(problems)} problems to {output_file}")
    
    # Print summary statistics
    competitions_summary = {}
    for problem in problems:
        comp_key = problem['id'].split('_')[:3]  # Extract year and competition type
        comp_key = '_'.join(comp_key)
        competitions_summary[comp_key] = competitions_summary.get(comp_key, 0) + 1
    
    print("\nSummary by competition:")
    for comp, count in sorted(competitions_summary.items()):
        print(f"  {comp}: {count} problems")
    
    print(f"\nTotal problems collected: {len(problems)}")
    print(f"Total competitions processed: {len(competitions_summary)}")

if __name__ == "__main__":
    main() 