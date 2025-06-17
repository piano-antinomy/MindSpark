import requests
from bs4 import BeautifulSoup
import json
import re
import os

class AMCParser:
    def __init__(self, competition_dict_file="competition_dict.json"):
        self.base_url = "https://artofproblemsolving.com/wiki/index.php"
        
        # Convert to absolute path
        if not os.path.isabs(competition_dict_file):
            # If relative path, resolve it relative to the script's directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.competition_dict_file = os.path.join(script_dir, competition_dict_file)
        else:
            self.competition_dict_file = competition_dict_file
            
        # Configure all competitions we want to download from the dictionary file
        self.competitions = self._generate_competitions_from_dict()
        
    def _generate_competitions_from_dict(self):
        """Generate competitions from competition_dict.json file"""
        with open(self.competition_dict_file, 'r', encoding='utf-8') as f:
            competition_dict = json.load(f)
        
        competitions = []
        
        for range_data in competition_dict:
            start_year = range_data['start']
            end_year = range_data['end']  # inclusive
            problem_number_override = range_data.get('problem_number')  # Optional override
            
            # Check if this is AJHSME
            if range_data.get('is_AJHSME', False):
                # Generate AJHSME competitions (no levels, just years)
                num_problems = range_data.get('num_problems', 25)
                group = "AMC_8"  # AJHSME is grouped with AMC 8
                for year in range(start_year, end_year + 1):
                    competitions.append({
                        'year': year,
                        'is_AJHSME': True,
                        'fall_version': False,
                        'num_problems': num_problems,
                        'group': group,
                        'problem_number_override': problem_number_override
                    })
            else:
                # Generate regular AMC competitions
                for level_data in range_data['levels']:
                    level = level_data['level']
                    suffix = level_data.get('suffix', '')
                    has_fall_version = level_data.get('has_fall_version', [])  # List of years with fall versions
                    num_problems = level_data.get('num_problems', 25)
                    
                    group = f"AMC_{level}"
                    
                    # Generate competitions for each year in the range
                    for year in range(start_year, end_year + 1):  # +1 because end is inclusive
                        # Generate regular competition
                        competitions.append({
                            'year': year,
                            'level': level,
                            'suffix': suffix,
                            'fall_version': False,
                            'num_problems': num_problems,
                            'group': group,
                            'problem_number_override': problem_number_override
                        })
                        
                        # Generate fall version if this year is in the fall version list
                        if year in has_fall_version:
                            competitions.append({
                                'year': year,
                                'level': level,
                                'suffix': suffix,
                                'fall_version': True,
                                'num_problems': num_problems,
                                'group': group,
                                'problem_number_override': problem_number_override
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
                # Look for the patterns actually found in AMC problems
                answer_patterns = [
                    r'\\boxed\{\\textbf\{\(([A-E])\)\}\\?',       # \boxed{\textbf{(D)}\ } - simplified
                    r'\\boxed\{\\textbf\{\(([A-E])\)\}\}',        # \boxed{\textbf{(D)}}
                    r'\\boxed\{\\textbf\{\(([A-E])\) \}',         # \boxed{\textbf{(D) }} - space after letter
                    r'\\boxed\{\\textbf\{([A-E])\}\}',            # \boxed{\textbf{A}} (no parentheses)
                    r'\\boxed\{\\text\{\(([A-E])\)\\?',           # \boxed{\text{(C)\ } - simplified
                    r'\\boxed\{\\text\{\(([A-E])\)\}\}',          # \boxed{\text{(C)}}
                    r'\\boxed\{\\text\{([A-E])\}\}',              # \boxed{\text{A}} (no parentheses)
                    r'\\mathbf\{\(([A-E])\)\\,?\}',               # \mathbf{(A)\,} - without \boxed{}
                    r'\\mathbf\{\(([A-E])\)\}',                   # \mathbf{(A)} - without \boxed{}
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
        if len(question_p_elements) > 1:
            question_ps = question_p_elements[:-1]
            choices_p = question_p_elements[-1]
        else:
            # Handle case where question and choices are in the same <p> element
            single_p = question_p_elements[0]
            img_tags = single_p.find_all('img')
            
            if len(img_tags) > 1:
                # Assume the last img tag contains the choices
                last_img = img_tags[-1]
                
                # Create a copy of the single_p for the question (without the last img)
                question_p_copy = single_p.__copy__()
                last_img_in_copy = question_p_copy.find_all('img')[-1]
                last_img_in_copy.decompose()  # Remove the last img from question
                
                # Create a new element for choices containing only the last img
                from bs4 import Tag
                choices_p = Tag(name='p')
                choices_p.append(last_img.__copy__())
                
                question_ps = [question_p_copy]
            else:
                # If there's only one or no img tags, treat the whole thing as question
                question_ps = question_p_elements
                choices_p = None
        
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
        all_extracted_answers = []  # Collect answers from all solutions
        
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
            solution_answers = []  # Answers found in this specific solution
            
            # Collect all content until next h2
            solution_html_parts = []
            current = header.next_sibling
            
            while current and (not (getattr(current, 'name', None) == 'h2')):
                if getattr(current, 'name', None) == 'p':
                    # Create a copy of the p element to modify
                    p_copy = current.__copy__()
                    
                    # Always try to extract answer from each solution
                    insertion_index, answer = self.process_images(p_copy, insertion_index, insertions, extract_answer=True)
                    if answer:
                        solution_answers.append(answer)
                        all_extracted_answers.append(answer)
                    
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
                
                # Validate answers within this solution (if any found)
                if solution_answers:
                    # Check if all answers in this solution are the same
                    unique_solution_answers = list(set(solution_answers))
                    if len(unique_solution_answers) > 1:
                        # Multiple different answers in the same solution - error
                        solution_name = f"Solution {idx + 1}" if idx > 0 else "Solution"
                        raise ValueError(f"Inconsistent answers within {solution_name}: found {solution_answers}")
                    
                    solutions.append({
                        'text': combined_html,
                        'insertions': insertions,
                        'answers_found': solution_answers,  # Include answers found in this solution
                        'solution_answer': unique_solution_answers[0]  # The consistent answer for this solution
                    })
                else:
                    # No answer found in this solution - this is now OK
                    solutions.append({
                        'text': combined_html,
                        'insertions': insertions,
                        'answers_found': solution_answers,  # Empty list
                        'solution_answer': None  # No answer in this solution
                    })
        
        return solutions, all_extracted_answers
    
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
        
        solutions, all_extracted_answers = self.extract_solutions(soup) # Extract solutions and all answers
        
        # Raise exception if no solutions found
        if not solutions:
            raise ValueError(f"No solutions found for {comp_id} Problem {problem_number}")
        
        # Validate answer consistency
        if not all_extracted_answers:
            raise ValueError(f"No answer found for {comp_id} Problem {problem_number}")
        
        # Check if all answers are the same
        unique_answers = list(set(all_extracted_answers))
        if len(unique_answers) > 1:
            # Multiple different answers found - this is an error
            answer_counts = {ans: all_extracted_answers.count(ans) for ans in unique_answers}
            raise ValueError(f"Inconsistent answers found for {comp_id} Problem {problem_number}: {answer_counts}. All answers found: {all_extracted_answers}")
        
        # All answers are consistent, use the first one
        final_answer = unique_answers[0]
        
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
            'answer': final_answer,
            'answer_validation': {
                'all_answers_found': all_extracted_answers,
                'unique_answers': unique_answers,
                'is_consistent': len(unique_answers) == 1
            },
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
    
    def _get_competition_name(self, competition):
        """Generate competition name for file/folder naming"""
        year = competition['year']
        fall_version = competition['fall_version']
        problem_override = competition.get('problem_number_override')
        
        # Check if this is AJHSME
        if competition.get('is_AJHSME', False):
            base_name = f"{year}_AJHSME"
        else:
            # Regular AMC competition
            level = competition['level']
            suffix = competition.get('suffix', competition.get('version', ''))  # Support both old and new format
            
            if fall_version:
                base_name = f"{year}_Fall_AMC_{level}{suffix}"
            else:
                base_name = f"{year}_AMC_{level}{suffix}"
        
        # Add problem number suffix if there's an override
        if problem_override is not None:
            return f"{base_name}_Problem_{problem_override}"
        else:
            return base_name

    def parse_competition(self, competition):
        """Parse all problems for a single competition"""
        comp_id = self._get_competition_id(competition)
        comp_name = self._get_competition_name(competition)
        num_problems = competition['num_problems']
        problem_override = competition.get('problem_number_override')
        
        # Determine which problems to parse
        if problem_override is not None:
            problem_numbers = [problem_override]
            print(f"Processing competition: {comp_id} (Problem {problem_override} only)")
        else:
            problem_numbers = list(range(1, num_problems + 1))
            print(f"Processing competition: {comp_id}")
        
        competition_problems = []
        parsing_results = {
            "competition_info": {
                "name": comp_name,
                "id": comp_id,
                "group": competition['group'],
                "year": competition['year'],
                "is_AJHSME": competition.get('is_AJHSME', False),
                "level": competition.get('level', 'AJHSME'),
                "suffix": competition.get('suffix', ''),
                "fall_version": competition['fall_version'],
                "total_problems_expected": len(problem_numbers),
                "problem_number_override": problem_override
            },
            "successful_problems": [],
            "failed_problems": [],
            "skipped_problems": [],
            "summary": {
                "successful": 0,
                "failed": 0,
                "skipped": 0
            }
        }
        
        for problem_number in problem_numbers:
            print(f"  Parsing {comp_id} Problem {problem_number}...")
            
            url = self.get_problem_url(competition, problem_number)
            
            try:
                problem_data = self.parse_problem(competition, problem_number)
                if problem_data:
                    competition_problems.append(problem_data)
                    
                    # Add to successful problems list
                    success_entry = {
                        "problem_number": problem_number,
                        "url": url,
                        "problem_id": problem_data.get("problem_id", f"Problem {problem_number}"),
                        "question_length": len(problem_data.get("question_text", "")),
                        "has_choices": bool(problem_data.get("choices", {}).get("text_choices")),
                        "has_solution": bool(problem_data.get("solution_text")),
                        "has_answer": bool(problem_data.get("answer"))
                    }
                    parsing_results["successful_problems"].append(success_entry)
                    parsing_results["summary"]["successful"] += 1
                    print(f"  ✓ Successfully parsed {comp_id} Problem {problem_number}")
                else:
                    # Add to skipped problems list
                    skip_entry = {
                        "problem_number": problem_number,
                        "url": url,
                        "reason": "No data returned from parser"
                    }
                    parsing_results["skipped_problems"].append(skip_entry)
                    parsing_results["summary"]["skipped"] += 1
                    print(f"  ⚠ Skipped {comp_id} Problem {problem_number} (no data returned)")
            except Exception as e:
                # Add to failed problems list with detailed error
                fail_entry = {
                    "problem_number": problem_number,
                    "url": url,
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "error_details": self._get_error_details(e)
                }
                parsing_results["failed_problems"].append(fail_entry)
                parsing_results["summary"]["failed"] += 1
                print(f"  ✗ Failed to parse {comp_id} Problem {problem_number}: {e}")
                # Continue with next problem instead of crashing
                continue
        
        # Save parsing log
        self._save_parsing_log(competition, parsing_results)
        
        print(f"Completed {comp_id}: {len(competition_problems)} problems parsed")
        return competition_problems

    def _get_error_details(self, exception):
        """Get detailed error information for logging"""
        import traceback
        
        error_details = {
            "traceback": traceback.format_exc(),
        }
        
        # Add specific error details based on exception type
        if isinstance(exception, requests.RequestException):
            error_details["category"] = "Network Error"
            error_details["description"] = "Failed to fetch problem page from server"
        elif isinstance(exception, AttributeError):
            error_details["category"] = "Parsing Error" 
            error_details["description"] = "HTML structure differs from expected format"
        elif isinstance(exception, KeyError):
            error_details["category"] = "Data Error"
            error_details["description"] = "Missing expected data fields"
        elif isinstance(exception, ValueError):
            error_details["category"] = "Format Error"
            error_details["description"] = "Data format is not as expected"
        else:
            error_details["category"] = "Unknown Error"
            error_details["description"] = "Unexpected error occurred during parsing"
            
        return error_details

    def save_competition_to_file(self, competition, problems):
        """Save a single competition's problems to its own file"""
        group = competition['group']
        comp_name = self._get_competition_name(competition)
        
        # Create directory structure: backend-java/questions/AMC/<group>/
        # Get the project root directory (3 levels up from script location)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
        base_dir = os.path.join(project_root, "backend-java", "questions", "AMC")
        group_dir = os.path.join(base_dir, group)
        
        # Create directories if they don't exist
        os.makedirs(group_dir, exist_ok=True)
        
        # Save problems to JSON file directly in the group directory
        output_file = os.path.join(group_dir, f"{comp_name}.json")
        
        # Create competition metadata
        competition_data = {
            "competition_info": {
                "name": comp_name,
                "group": group,
                "year": competition['year'],
                "is_AJHSME": competition.get('is_AJHSME', False),
                "level": competition.get('level', 'AJHSME'),
                "suffix": competition.get('suffix', ''),
                "fall_version": competition['fall_version'],
                "total_problems": len(problems),
                "problem_number_override": competition.get('problem_number_override')
            },
            "problems": problems
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(competition_data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(problems)} problems to {output_file}")
        return output_file

    def _save_parsing_log(self, competition, parsing_results):
        """Save parsing results log for a competition"""
        comp_name = self._get_competition_name(competition)
        
        # Create parsing_log directory structure
        script_dir = os.path.dirname(os.path.abspath(__file__))
        log_dir = os.path.join(script_dir, "parsing_log")
        os.makedirs(log_dir, exist_ok=True)
        
        # Save parsing log to JSON file with same name as competition
        log_file = os.path.join(log_dir, f"{comp_name}.json")
        
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(parsing_results, f, indent=2, ensure_ascii=False)
        
        # Print detailed summary
        summary = parsing_results["summary"]
        successful_problems = parsing_results["successful_problems"]
        failed_problems = parsing_results["failed_problems"]
        skipped_problems = parsing_results["skipped_problems"]
        
        print(f"  📝 Parsing log saved: {log_file}")
        print(f"  📊 Results: {summary['successful']} successful, {summary['failed']} failed, {summary['skipped']} skipped")
        
        if successful_problems:
            problem_nums = [str(p["problem_number"]) for p in successful_problems]
            print(f"  ✅ Successful problems: {', '.join(problem_nums)}")
        
        if failed_problems:
            print(f"  ❌ Failed problems:")
            for fail in failed_problems:
                print(f"    Problem {fail['problem_number']}: {fail['error_details']['category']} - {fail['error_message'][:100]}{'...' if len(fail['error_message']) > 100 else ''}")
        
        if skipped_problems:
            problem_nums = [str(p["problem_number"]) for p in skipped_problems]
            print(f"  ⏭️  Skipped problems: {', '.join(problem_nums)}")

    def parse_all_competitions(self):
        """Parse all competitions and save each to separate files"""
        total_competitions = len(self.competitions)
        saved_files = []
        total_problems = 0
        
        for i, competition in enumerate(self.competitions, 1):
            print(f"\n{'='*60}")
            print(f"Competition {i}/{total_competitions}")
            print(f"{'='*60}")
            
            # Parse all problems for this competition
            problems = self.parse_competition(competition)
            
            if problems:
                # Save competition to its own file
                output_file = self.save_competition_to_file(competition, problems)
                saved_files.append(output_file)
                total_problems += len(problems)
            else:
                comp_id = self._get_competition_id(competition)
                print(f"⚠ No problems found for {comp_id}, skipping file creation")
            
            print("-" * 60)
        
        return saved_files, total_problems

def main(competition_dict_file="competition_dict.json"):
    """
    Main function to download AMC problems
    
    Args:
        competition_dict_file: Path to the JSON file containing competition configuration.
                              Defaults to "competition_dict.json"
    
    Examples:
        main()  # Use default competition_dict.json
        main("custom_competitions.json")  # Use custom competition file
    """
    parser = AMCParser(competition_dict_file)
    
    # Print configuration
    print("=== AMC Problem Downloader Configuration ===")
    print(f"Using competition configuration from: {competition_dict_file}")
    print(f"Total competitions to process: {len(parser.competitions)}")
    print("=" * 45)
    
    # Parse all competitions and save to separate files
    saved_files, total_problems = parser.parse_all_competitions()
    
    # Print final summary
    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"Total competitions processed: {len(saved_files)}")
    print(f"Total problems collected: {total_problems}")
    
    # Show absolute path for output directory
    if saved_files:
        # Extract the base directory from the first saved file
        first_file = saved_files[0]
        amc_dir = first_file.split('/AMC/')[0] + '/AMC/'
        print(f"Files saved to: {amc_dir}")
    else:
        print("No files were saved.")
    
    # Group summary by competition group
    group_summary = {}
    for file_path in saved_files:
        # Extract group from file path
        path_parts = file_path.split('/')
        if 'AMC' in path_parts:
            amc_index = path_parts.index('AMC')
            if amc_index + 1 < len(path_parts):
                group = path_parts[amc_index + 1]
                group_summary[group] = group_summary.get(group, 0) + 1
    
    print("\nSummary by group:")
    for group, count in sorted(group_summary.items()):
        print(f"  {group}: {count} competitions")
    
    print(f"\nAll competition files saved successfully!")
    print("Directory structure:")
    
    # Show output directory
    if saved_files:
        first_file = saved_files[0]
        amc_dir = first_file.split('/AMC/')[0] + '/AMC/'
        print(f"  Competition data: {amc_dir}")
        for group in sorted(group_summary.keys()):
            print(f"    ├── {group}/")
            print(f"    │   ├── 2023_AMC_{group.split('_')[1]}.json")
            print(f"    │   ├── 2024_AMC_{group.split('_')[1]}.json")
            print(f"    │   └── [other competition files]")
    
    # Show parsing log directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(script_dir, "parsing_log")
    print(f"  Parsing logs: {log_dir}")
    print(f"    └── [parsing result files]")

if __name__ == "__main__":
    main("small_competition_dict.json") 