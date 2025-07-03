import requests
from bs4 import BeautifulSoup
import json
import re
import os

class AMCParser:
    def __init__(self, competition_dict_file="competition_dict.json", answer_overrides_file="answer_overrides.json", question_overrides_file="question_overrides.json", solution_overrides_file="solution_overrides.json", no_choices_overrides_file="no_choices_overrides.json", use_answer_sheets=True):
        self.base_url = "https://artofproblemsolving.com/wiki/index.php"
        self.use_answer_sheets = use_answer_sheets
        self.answer_sheet_cache = {}  # Cache for answer sheets to avoid refetching
        
        # Convert to absolute path for competition dict
        if not os.path.isabs(competition_dict_file):
            # If relative path, resolve it relative to the script's directory
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.competition_dict_file = os.path.join(script_dir, competition_dict_file)
        else:
            self.competition_dict_file = competition_dict_file
        
        # Convert to absolute path for answer overrides
        if not os.path.isabs(answer_overrides_file):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.answer_overrides_file = os.path.join(script_dir, answer_overrides_file)
        else:
            self.answer_overrides_file = answer_overrides_file
            
        # Convert to absolute path for question overrides
        if not os.path.isabs(question_overrides_file):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.question_overrides_file = os.path.join(script_dir, question_overrides_file)
        else:
            self.question_overrides_file = question_overrides_file
            
        # Convert to absolute path for solution overrides
        if not os.path.isabs(solution_overrides_file):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.solution_overrides_file = os.path.join(script_dir, solution_overrides_file)
        else:
            self.solution_overrides_file = solution_overrides_file
            
        # Convert to absolute path for no choices overrides
        if not os.path.isabs(no_choices_overrides_file):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.no_choices_overrides_file = os.path.join(script_dir, no_choices_overrides_file)
        else:
            self.no_choices_overrides_file = no_choices_overrides_file
            
        # Load answer overrides
        self.answer_overrides = self._load_answer_overrides()
        
        # Load question overrides
        self.question_overrides = self._load_question_overrides()
        
        # Load solution overrides
        self.solution_overrides = self._load_solution_overrides()
        
        # Load no choices overrides
        self.no_choices_overrides = self._load_no_choices_overrides()
            
        # Configure all competitions we want to download from the dictionary file
        self.competitions = self._generate_competitions_from_dict()
    
    def _load_answer_overrides(self):
        """Load answer overrides from JSON file"""
        try:
            with open(self.answer_overrides_file, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                # Filter out comment keys
                filtered_overrides = {k: v for k, v in overrides.items() if not k.startswith('_')}
                print(f"Loaded {len(filtered_overrides)} answer overrides from {self.answer_overrides_file}")
                return filtered_overrides
        except FileNotFoundError:
            print(f"Answer overrides file not found: {self.answer_overrides_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing answer overrides file: {e}")
            return {}
        except Exception as e:
            print(f"Error loading answer overrides: {e}")
            return {}
    
    def _load_question_overrides(self):
        """Load question overrides from JSON file"""
        try:
            with open(self.question_overrides_file, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                # Filter out comment keys
                filtered_overrides = {k: v for k, v in overrides.items() if not k.startswith('_')}
                print(f"Loaded {len(filtered_overrides)} question overrides from {self.question_overrides_file}")
                return filtered_overrides
        except FileNotFoundError:
            print(f"Question overrides file not found: {self.question_overrides_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing question overrides file: {e}")
            return {}
        except Exception as e:
            print(f"Error loading question overrides: {e}")
            return {}
    
    def _load_solution_overrides(self):
        """Load solution overrides from JSON file"""
        try:
            with open(self.solution_overrides_file, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                # Filter out comment keys
                filtered_overrides = {k: v for k, v in overrides.items() if not k.startswith('_')}
                print(f"Loaded {len(filtered_overrides)} solution overrides from {self.solution_overrides_file}")
                return filtered_overrides
        except FileNotFoundError:
            print(f"Solution overrides file not found: {self.solution_overrides_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing solution overrides file: {e}")
            return {}
        except Exception as e:
            print(f"Error loading solution overrides: {e}")
            return {}
    
    def _load_no_choices_overrides(self):
        """Load no choices overrides from JSON file"""
        try:
            with open(self.no_choices_overrides_file, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                # Filter out comment keys
                filtered_overrides = {k: v for k, v in overrides.items() if not k.startswith('_')}
                print(f"Loaded {len(filtered_overrides)} no choices overrides from {self.no_choices_overrides_file}")
                return filtered_overrides
        except FileNotFoundError:
            print(f"No choices overrides file not found: {self.no_choices_overrides_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing no choices overrides file: {e}")
            return {}
        except Exception as e:
            print(f"Error loading no choices overrides: {e}")
            return {}
    
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
                    
                    # Extract the base level (e.g., "12" from "12A", "10" from "10B")
                    base_level = level.rstrip('AB')
                    group = f"AMC_{base_level}"
                    
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
    
    def get_answer_sheet_url(self, competition):
        """Generate the answer sheet URL for a competition"""
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
            
        return f"{self.base_url}/{comp_id}_Answer_Key"
    
    def fetch_answer_sheet(self, competition):
        """Fetch and parse the answer sheet for a competition"""
        comp_id = self._get_competition_id(competition)
        
        # Check cache first
        if comp_id in self.answer_sheet_cache:
            print(f"Using cached answer sheet for {comp_id}")
            return self.answer_sheet_cache[comp_id]
        
        url = self.get_answer_sheet_url(competition)
        print(f"Fetching answer sheet from: {url}")
        
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            html = response.text
            
            # Parse the HTML
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for the ordered list with answers
            # The answer key format is typically: <ol><li>E</li><li>C</li>...</li></ol>
            ol_element = soup.find('ol')
            if not ol_element:
                print(f"No ordered list found in answer sheet for {comp_id}")
                return None
            
            # Extract all list items
            li_elements = ol_element.find_all('li')
            if not li_elements:
                print(f"No list items found in answer sheet for {comp_id}")
                return None
            
            # Convert to list of answers (A, B, C, D, E)
            answers = []
            for li in li_elements:
                answer_text = li.get_text(strip=True)
                if answer_text in ['A', 'B', 'C', 'D', 'E']:
                    answers.append(answer_text)
                else:
                    print(f"Warning: Invalid answer format '{answer_text}' in answer sheet for {comp_id}")
                    return None
            
            # Validate that we have the expected number of answers
            expected_problems = competition['num_problems']
            if len(answers) != expected_problems:
                print(f"Answer sheet validation failed for {comp_id}: expected {expected_problems} answers, got {len(answers)}")
                return None
            
            print(f"Successfully parsed answer sheet for {comp_id}: {len(answers)} answers")
            
            # Cache the result
            self.answer_sheet_cache[comp_id] = answers
            return answers
            
        except requests.RequestException as e:
            print(f"Error fetching answer sheet for {comp_id}: {e}")
            return None
        except Exception as e:
            print(f"Error parsing answer sheet for {comp_id}: {e}")
            return None
        
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
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def process_images(self, element, insertion_index, insertions, extract_answer=False):
        found_answers = []  # List of (answer, tier_num, alt_text) tuples
        
        def extract_answers_from_text(text_content, source_name="LaTeX"):
            """Helper method to extract answers from text using tier-based pattern matching"""
            local_found_answers = []
            
            # Multi-tier answer pattern matching (higher tiers have priority)
            answer_pattern_tiers = [
                # Tier 1: Boxed answers (highest priority - final answers)
                [
                    r'\\boxed{\\mathrm{\\(([A-E])\\)[^}]*}',  # \\boxed{\\mathrm{(C)} 79}
                    r'\\boxed{\\mathrm{([A-E])}}',  # \\boxed{\\mathrm{C}}
                    r'\\boxed\{\\textbf\{\\(([A-E])\\)',
                    r'\\boxed\{\\textbf\{([A-E])\)',
                    r'\\boxed\{\\text\{\(([A-E])\)',
                    r'\\boxed\{\\text\{([A-E])',
                    r'\\boxed\s*\{\\text\s*\{\(([A-E])\)[^}]*\}',  # \boxed {\text {(D)} 5}
                    r'\\boxed\{\(\\textbf\{([A-E])\}\)}',
                    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # \boxed{\text{(\textbf C) ...}} - new pattern for 2015 AMC 10B Problem 10
                    r'\\boxed\{\\text\{\(\\textbf\s*([A-E])\s*\)[^}]*\}',  # \boxed{\text{(\textbf C) ...}} - fixed pattern for 2015 AMC 10B Problem 10
                    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # $...$ delimited version of the above pattern
                    r'\\boxed\{\\textbf\s*([A-E])\s*\}',  # \boxed{\textbf B} - new pattern for 2016 AMC 10A Problem 10
                    r'\\boxed\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # \boxed{(\textbf{B})\ 14} - new pattern for 2017 AMC 10A Problem 4
                    r'\\framebox\{([A-E])\}',
                    r'\\boxed\{([A-E])\([^}]*\)\}',  # \boxed{E(92)} - new pattern for 2024 AMC 10B Problem 25
                    r'\\boxed\s*\{([A-E])\}',  # \boxed {B} - new pattern for 2012 AMC 10B Problem 12
                    r'\\boxed\s*\{\s*([A-E])\s*\}',  # \boxed{ B } - new pattern for 2006 AMC 10B Problem 25
                    r'\\boxed\s*\{\s*\\mathrm\{\(([A-E])\s*\)[^}]*\}',  # \boxed {\mathrm{(E )} \frac 58\ } - simpler pattern for 2007 AMC 10A Problem 16
                    r'\\boxed.*?\(([A-E])\).*?',  # $\boxed {(D)60}$ - new pattern for 2007 AMC 10A Problem 17
                ],
                # Tier 2: Non-boxed answers (lower priority - could be intermediate mentions)
                [
                    r'\\mathbf\{\(([A-E])\)',                    # \mathbf{(A) - stops at closing parenthesis
                    r'\\textbf\s*\{\s*\(([A-E])\)',              # \textbf {(B) } - with optional spaces
                    r'\\mathrm\{\(([A-E])\)',                    # \mathrm{(A)} - new pattern for 2007 AMC 10A Problem 6
                ],
                # Tier 3: Alternative boxed formats (lowest priority - fallback patterns)
                [
                    r'\\boxed\{\(\\text\{([A-E])\}\)',           # \boxed{(\text{A}) - parentheses around \text{A}
                    r'\\boxed\{\(([A-E])\)',                     # \boxed{(B) - simple parentheses around letter
                    r'\\fbox\{([A-E])\}',                        # \fbox{D} - simple framed box
                    r'\\boxed\{([A-E])\}',                       # \boxed{C} - simple boxed letter
                ]
            ]
            
            # Check all tiers for this text content
            for tier_num, patterns in enumerate(answer_pattern_tiers, 1):
                for pattern in patterns:
                    match = re.search(pattern, text_content)
                    if match:
                        answer = match.group(1)
                        local_found_answers.append((answer, tier_num, text_content))
                        break  # Only take first match per tier per text block
                # Don't break here - continue checking other tiers for this text content
            
            return local_found_answers
        
        for img in element.find_all('img'):
            alt_text = img.get('alt', '')
            img_src = img.get('src', '')
            insertion_key = f"INSERTION_INDEX_{insertion_index}"
            insertions[insertion_key] = {
                "picture": img_src,
                "alt_type": "asy" if "[asy]" in alt_text else "latex",
                "alt_value": alt_text
            }
            
            # Extract answer from LaTeX alt text if requested
            if extract_answer and alt_text:
                found_answers.extend(extract_answers_from_text(alt_text, "LaTeX"))
            
            img.replace_with(f"<{insertion_key}>")
            insertion_index += 1
        
        # Also check for answers in [mathjax] text content
        if extract_answer:
            element_text = element.get_text()
            if '[mathjax]' in element_text and '[/mathjax]' in element_text:
                # Extract content between [mathjax] tags
                mathjax_pattern = r'\[mathjax\](.*?)\[/mathjax\]'
                mathjax_matches = re.findall(mathjax_pattern, element_text, re.DOTALL)
                
                for mathjax_content in mathjax_matches:
                    # Apply the same tier-based pattern matching to mathjax content
                    mathjax_answers = extract_answers_from_text(mathjax_content, "[mathjax]")
                    # Update the source name for mathjax answers
                    for answer, tier, content in mathjax_answers:
                        found_answers.append((answer, tier, f"[mathjax]{content}[/mathjax]"))
        
        if extract_answer:
            return insertion_index, found_answers  # Return all found answers for global ranking
        else:
            return insertion_index, None
    
    def _is_empty_p_element(self, p_element):
        """Check if a <p> element is empty (contains only whitespace or <br> tags)"""
        # Get all text content and strip whitespace
        text_content = p_element.get_text(strip=True)
        if text_content:
            return False  # If there's any text content, it's not empty
        
        # Check if element contains only <br> tags or whitespace
        for child in p_element.children:
            child_name = getattr(child, 'name', None)
            if child_name is not None:
                # If it's a tag and not a <br> tag, it's not empty
                if child_name != 'br':
                    return False
            else:
                # If it's text content and not just whitespace, it's not empty
                if str(child).strip():
                    return False
        
        return True

    def _collect_question_paragraphs(self, soup):
        """
        Collect paragraph elements that contain the question content.
        
        Uses a two-strategy approach to handle different page structures:
        
        STRATEGY 1 (Standard): Look for "Problem" header
        - Most AMC pages have an h2 header containing "Problem"
        - Collect all <p> elements between this header and the next h2
        - This works for the majority of well-structured pages
        
        STRATEGY 2 (Fallback): Content-based collection
        - Some pages (like 2015 AMC 8 Problems 10, 25) lack proper headers
        - Collect all <p> elements before the first h2 in the main content div
        - Assumes the first h2 marks the start of solutions
        
        Args:
            soup: BeautifulSoup object of the problem page
            
        Returns:
            list: List of paragraph elements containing question content,
                  empty list if no content found
        """
        # Strategy 1: Look for Problem header and collect p elements after it
        for h2 in soup.find_all('h2'):
            if 'Problem' in h2.text:
                question_p_elements = []
                current = h2.next_sibling
                
                while current and (getattr(current, 'name', None) != 'h2'):
                    if getattr(current, 'name', None) == 'p':
                        question_p_elements.append(current)
                    current = current.next_sibling
                
                if question_p_elements:
                    return question_p_elements
        
        # Strategy 2: Fallback - collect all p elements before first h2 in main content
        content_div = soup.find('div', class_='mw-parser-output')
        if content_div:
            question_p_elements = []
            for element in content_div.children:
                if getattr(element, 'name', None) == 'h2':
                    break  # Stop at first h2 (solutions start)
                elif getattr(element, 'name', None) == 'p':
                    question_p_elements.append(element)
            
            if question_p_elements:
                return question_p_elements
        
        return []
    
    def _clean_question_paragraphs(self, question_p_elements):
        """Remove empty paragraphs from the end and return cleaned list."""
        # Remove empty <p> elements from the end
        while question_p_elements and self._is_empty_p_element(question_p_elements[-1]):
            question_p_elements.pop()
        
        return question_p_elements
    
    def _paragraph_contains_choices(self, p_element):
        """
        Check if a paragraph contains multiple choice options.
        
        This method detects choice patterns in various formats:
        1. LaTeX images with alt text like "$\\textbf{(A) }9\\qquad\\textbf{(B) }12..."
        2. Mathjax blocks with choice patterns
        3. Plain text with choice formatting
        
        Args:
            p_element: BeautifulSoup paragraph element to check
            
        Returns:
            bool: True if paragraph contains multiple choice options, False otherwise
        """
        # Check for images with choice-like alt text (most common format)
        for img in p_element.find_all('img'):
            alt_text = img.get('alt', '')
            if alt_text and ('\\textbf{(A)' in alt_text or '\\textbf{(B)' in alt_text):
                return True
        
        # Check for mathjax blocks with choice patterns
        text_content = p_element.get_text()
        if '[mathjax]' in text_content and ('\\textbf{(A)' in text_content or '\\textbf{(B)' in text_content):
            return True
        
        # Check for plain text choice patterns (rare but possible)
        if '\\textbf{(A)' in text_content and '\\textbf{(B)' in text_content:
            return True
        
        return False
    
    def _separate_question_and_choices(self, question_p_elements):
        """
        Separate question paragraphs from choice paragraphs.
        
        OLD LOGIC PROBLEM:
        The original logic assumed that in multi-paragraph problems, the last paragraph
        always contains the choices. This worked for most problems but failed for cases like:
        - Paragraph 1: Question text
        - Paragraph 2: Multiple choice options (actual choices)
        - Paragraph 3: Empty "Solution" link or other non-choice content
        
        NEW LOGIC SOLUTION:
        Now we intelligently search through all paragraphs to find the one that actually
        contains choice patterns (\\textbf{(A)}, \\textbf{(B)}, etc.) rather than blindly
        assuming the last paragraph has choices.
        
        Args:
            question_p_elements: List of paragraph elements from the problem section
            
        Returns:
            tuple: (question_paragraphs, choices_paragraph) where:
                - question_paragraphs: List of paragraphs containing question text
                - choices_paragraph: Single paragraph containing multiple choice options
        """
        if len(question_p_elements) > 1:
            # Multiple paragraphs: intelligently find the one that contains choices
            choices_p = None
            question_ps = []
            
            for p in question_p_elements:
                if self._paragraph_contains_choices(p):
                    choices_p = p
                else:
                    question_ps.append(p)
            
            # Fallback: if no paragraph with clear choices found, use old logic
            # (take last paragraph as choices, which works for most standard problems)
            if not choices_p:
                return question_p_elements[:-1], question_p_elements[-1]
            
            return question_ps, choices_p
        
        elif len(question_p_elements) == 1:
            # Single paragraph: check if it contains multiple images (question + choices)
            # This handles cases where both question and choices are in one paragraph
            single_p = question_p_elements[0]
            img_tags = single_p.find_all('img')
            
            if len(img_tags) > 1:
                # Assumption: last image contains choices, earlier images are part of question
                # Split: question gets all but last image, choices gets last image
                from bs4 import Tag
                
                question_p_copy = single_p.__copy__()
                last_img_in_copy = question_p_copy.find_all('img')[-1]
                last_img_in_copy.decompose()  # Remove last image from question
                
                # Create new paragraph containing only the choices image
                choices_p = Tag(name='p')
                choices_p.append(img_tags[-1].__copy__())
                
                return [question_p_copy], choices_p
            elif len(img_tags) == 1 and self._paragraph_contains_choices(single_p):
                # Special case: single paragraph with only choices (no question text)
                # This happens in malformed pages like 2016 AMC 8 Problem 19
                # The entire paragraph is just the multiple choice options
                from bs4 import Tag
                
                # Create an empty question paragraph
                empty_question_p = Tag(name='p')
                empty_question_p.string = "Problem text not found on page."
                
                return [empty_question_p], single_p
            else:
                # Single image or no images: treat entire paragraph as question only
                # This means no separate choices were found
                return question_p_elements, None
        
        # Edge case: no paragraphs found
        return [], None
    
    def _process_question_html(self, question_ps):
        """Convert question paragraphs to HTML with image insertions."""
        insertions = {}
        insertion_index = 1
        question_html_parts = []
        
        for p_element in question_ps:
            p_copy = p_element.__copy__()
            
            # Process images (no answer extraction for questions)
            insertion_index, _ = self.process_images(p_copy, insertion_index, insertions, extract_answer=False)
            
            # Convert to HTML string
            p_html = str(p_copy).strip()
            if p_html:
                question_html_parts.append(p_html)
        
        if not question_html_parts:
            return None, None
        
        # Join and clean up HTML
        question_text = ''.join(question_html_parts)
        question_text = question_text.replace('\n', '').replace('  ', ' ')
        # Unescape insertion placeholders
        question_text = question_text.replace('&lt;INSERTION_INDEX_', '<INSERTION_INDEX_')
        question_text = question_text.replace('&gt;', '>')
        
        return question_text, insertions
    
    def _process_choices(self, choices_p):
        """Extract and categorize choice options from the choices paragraph."""
        choices = {
            'text_choices': [],
            'picture_choices': [],
            'latex_choices': [],
            'asy_choices': []
        }
        
        if not choices_p:
            return choices
        
        # Process images in choices
        for img in choices_p.find_all('img'):
            img_src = img.get('src', '')
            alt_text = img.get('alt', '')
            
            if img_src:
                choices['picture_choices'].append(img_src)
                
                # Categorize based on alt text
                if alt_text.startswith('$'):
                    choices['latex_choices'].append(alt_text)
                elif alt_text.startswith('[asy]'):
                    choices['asy_choices'].append(alt_text)
        
        # Process asymptote diagrams
        for asy in choices_p.find_all('pre', class_='asy'):
            asy_text = asy.text.strip()
            if asy_text and asy_text not in choices['asy_choices']:
                choices['asy_choices'].append(asy_text)
        
        # Process text choices
        choices_text = choices_p.get_text()
        if '[mathjax]' in choices_text and '[/mathjax]' in choices_text:
            # Extract mathjax content
            mathjax_pattern = r'\[mathjax\](.*?)\[/mathjax\]'
            mathjax_matches = re.findall(mathjax_pattern, choices_text, re.DOTALL)
            for mathjax_content in mathjax_matches:
                choices['text_choices'].append(f'[mathjax]{mathjax_content.strip()}[/mathjax]')
        
        # If no image/mathjax choices found, look for plain text choice patterns
        elif not any([choices['picture_choices'], choices['latex_choices'], choices['asy_choices']]):
            choice_pattern = r'\\textbf\{([A-E])\s*\}\s*([^\\]+?)(?=\\textbf\{[A-E]\s*\}|$)'
            choice_matches = re.findall(choice_pattern, choices_text)
            if choice_matches:
                for letter, content in choice_matches:
                    choice_text = f'\\textbf{{{letter}}} {content.strip()}'
                    choices['text_choices'].append(choice_text)
        
        return choices

    def extract_question_and_choices(self, soup):
        """
        Extract question text, insertions, and multiple choice options from soup.
        
        This method handles the complex task of parsing AMC problem pages which can have
        various HTML structures. The main challenges addressed:
        
        1. FINDING CONTENT: Some pages have "Problem" headers, others don't
        2. SEPARATING PARTS: Question text vs. multiple choice options can be mixed
        3. CHOICE DETECTION: Choices can be in images, mathjax, or plain text
        4. HTML PROCESSING: Converting to clean HTML while preserving math/images
        
        ALGORITHM:
        1. Collect all paragraph elements that contain the problem content
        2. Clean up empty/irrelevant paragraphs from the end
        3. Intelligently separate question paragraphs from choice paragraphs
        4. Process question paragraphs into clean HTML with image insertions
        5. Extract and categorize multiple choice options
        
        Args:
            soup: BeautifulSoup object of the problem page
            
        Returns:
            tuple: (question_text, insertions, choices) where:
                - question_text: Clean HTML string of the question
                - insertions: Dict mapping insertion keys to image/math content
                - choices: Dict with categorized choice options (text, picture, latex, asy)
                Returns (None, None, None) if parsing fails at any step
        """
        # Step 1: Collect question paragraph elements
        question_p_elements = self._collect_question_paragraphs(soup)
        if not question_p_elements:
            return None, None, None
        
        # Step 2: Clean up empty paragraphs
        question_p_elements = self._clean_question_paragraphs(question_p_elements)
        if not question_p_elements:
            return None, None, None
        
        # Step 3: Separate question from choices
        question_ps, choices_p = self._separate_question_and_choices(question_p_elements)
        if not question_ps:
            return None, None, None
        
        # Step 4: Process question into HTML
        question_text, insertions = self._process_question_html(question_ps)
        if not question_text:
            return None, None, None
        
        # Step 5: Process choices
        choices = self._process_choices(choices_p)
        
        return question_text, insertions, choices
    
    def extract_solutions(self, soup, extract_answers=True):
        solutions = []
        all_extracted_answers = []  # Collect answers from all solutions
        
        # Find solution headers - look for any h2 or h3 with span id that starts with "Solution" (with or without underscore)
        solution_headers = []
        
        # Search through all h2 and h3 headers
        for header in soup.find_all(['h2', 'h3']):
            span = header.find('span', class_='mw-headline')
            if span:
                span_id = span.get('id', '')
                # Look for Solution, Solution_1, Solution1, Solution_2, Solution2, etc. but exclude Video solutions
                if (span_id == 'Solution' or span_id.startswith('Solution_') or 
                    (span_id.startswith('Solution') and span_id != 'Solution' and 'Video_Solution' not in span_id)):
                    solution_headers.append(header)
        
        # Process each solution section
        for idx, header in enumerate(solution_headers):
            insertions = {}
            insertion_index = 1
            solution_answer_candidates = []  # All answer candidates from this solution
            
            # Collect all content until next header (h2 or h3)
            solution_html_parts = []
            current = header.next_sibling
            header_tag = getattr(header, 'name', None)  # Get the tag name (h2 or h3)
            
            while current:
                element_name = getattr(current, 'name', None)
                # Stop at next h2, or if we're processing h3, also stop at next h3
                if element_name == 'h2' or (header_tag == 'h3' and element_name == 'h3'):
                    break
                    
                if element_name in ['p', 'ul']:
                    # Create a copy of the element to modify
                    element_copy = current.__copy__()
                    
                    # Extract answers from each insertion
                    insertion_index, found_answers = self.process_images(element_copy, insertion_index, insertions, extract_answer=extract_answers)
                    if found_answers:
                        solution_answer_candidates.extend(found_answers)  # Add all answers from this insertion
                    
                    # Convert to string but clean up the HTML
                    element_html = str(element_copy).strip()
                    if element_html:
                        solution_html_parts.append(element_html)
                        
                current = current.next_sibling
            
            # Select the best answer for this solution from all candidates
            best_solution_answer = None
            if extract_answers and solution_answer_candidates:
                # Sort by tier (ascending), so tier 1 comes first
                solution_answer_candidates.sort(key=lambda x: x[1])
                best_solution_answer = solution_answer_candidates[0][0]  # Take the answer from the highest priority tier
                print(f"Solution {idx + 1}: Selected answer '{best_solution_answer}' from {len(solution_answer_candidates)} candidates")
                all_extracted_answers.append(best_solution_answer)
            
            # Join with no extra spacing and clean up
            if solution_html_parts:
                combined_html = ''.join(solution_html_parts)
                # Clean up any extra whitespace while preserving structure
                combined_html = combined_html.replace('\n', '').replace('  ', ' ')
                # Unescape the insertion placeholders
                combined_html = combined_html.replace('&lt;INSERTION_INDEX_', '<INSERTION_INDEX_')
                combined_html = combined_html.replace('&gt;', '>')
                
                # Always add the solution (we've already handled answer extraction above)
                solutions.append({
                    'text': combined_html,
                    'insertions': insertions
                })
        '''
        # Additional pass: check all insertions across all solutions for answers
        if extract_answers and not all_extracted_answers:
            print("No answers found in main text, checking insertions...")
            for idx, solution in enumerate(solutions):
                for key, insertion in solution['insertions'].items():
                    if insertion.get('alt_type') == 'latex' and insertion.get('alt_value'):
                        alt_text = insertion['alt_value']
                        # Use the same answer extraction logic as in process_images
                        def extract_answers_from_text(text_content):
                            """Helper method to extract answers from text using tier-based pattern matching"""
                            local_found_answers = []
                            
                            # Multi-tier answer pattern matching (higher tiers have priority)
                            answer_pattern_tiers = [
                                # Tier 1: Boxed answers (highest priority - final answers)
                                [
                                    r'\\boxed{\\mathrm{\\(([A-E])\\)[^}]*}',  # \\boxed{\\mathrm{(C)} 79}
                                    r'\\boxed{\\mathrm{([A-E])}}',  # \\boxed{\\mathrm{C}}
                                    r'\\boxed\{\\textbf\{\\(([A-E])\\)',
                                    r'\\boxed\{\\textbf\{([A-E])\)',
                                    r'\\boxed\{\\text\{\(([A-E])\)',
                                    r'\\boxed\{\\text\{([A-E])',
                                    r'\\boxed\s*\{\\text\s*\{\(([A-E])\)[^}]*\}',  # \boxed {\text {(D)} 5}
                                    r'\\boxed\{\(\\textbf\{([A-E])\}\)}',
                                    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # \boxed{\text{(\textbf C) ...}} - new pattern for 2015 AMC 10B Problem 10
                                    r'\\boxed\{\\text\{\(\\textbf\s*([A-E])\s*\)[^}]*\}',  # \boxed{\text{(\textbf C) ...}} - fixed pattern for 2015 AMC 10B Problem 10
                                    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # $...$ delimited version of the above pattern
                                    r'\\boxed\{\\textbf\s*([A-E])\s*\}',  # \boxed{\textbf B} - new pattern for 2016 AMC 10A Problem 10
                                    r'\\boxed\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # \boxed{(\textbf{B})\ 14} - new pattern for 2017 AMC 10A Problem 4
                                    r'\\framebox\{([A-E])\}',
                                    r'\\boxed\{([A-E])\([^}]*\)\}',  # \boxed{E(92)} - new pattern for 2024 AMC 10B Problem 25
                                ],
                                # Tier 2: Non-boxed answers (lower priority - could be intermediate mentions)
                                [
                                    r'\\mathbf\{\(([A-E])\)',                    # \mathbf{(A) - stops at closing parenthesis
                                    r'\\textbf\s*\{\s*\(([A-E])\)',              # \textbf {(B) } - with optional spaces
                                ],
                                # Tier 3: Alternative boxed formats (lowest priority - fallback patterns)
                                [
                                    r'\\boxed\{\(\\text\{([A-E])\}\)',           # \boxed{(\text{A}) - parentheses around \text{A}
                                    r'\\boxed\{\(([A-E])\)',                     # \boxed{(B) - simple parentheses around letter
                                    r'\\fbox\{([A-E])\}',                        # \fbox{D} - simple framed box
                                    r'\\boxed\{([A-E])\}',                       # \boxed{C} - simple boxed letter
                                ]
                            ]
                            
                            # Check all tiers for this text content
                            for tier_num, patterns in enumerate(answer_pattern_tiers, 1):
                                for pattern in patterns:
                                    match = re.search(pattern, text_content)
                                    if match:
                                        answer = match.group(1)
                                        local_found_answers.append((answer, tier_num, text_content))
                                        break  # Only take first match per tier per text block
                                # Don't break here - continue checking other tiers for this text content
                            
                            return local_found_answers
                        
                        found_answers = extract_answers_from_text(alt_text)
                        if found_answers:
                            # Sort by tier and take the best answer
                            found_answers.sort(key=lambda x: x[1])
                            best_answer = found_answers[0][0]
                            print(f"Found answer '{best_answer}' in insertion {key} of solution {idx + 1}")
                            all_extracted_answers.append(best_answer)
        '''
        return solutions, all_extracted_answers
    
    def parse_problem(self, competition, problem_number):
        url = self.get_problem_url(competition, problem_number)
        html = self.fetch_problem_page(url)
        
        # Generate competition identifier for error messages
        comp_id = self._get_competition_id(competition)
        
        if not html:
            raise ValueError(f"Failed to fetch problem page for {comp_id} Problem {problem_number}")
        
        # Generate problem ID for override checking
        problem_id = self._generate_problem_id(competition, problem_number)
        
        # Check if this problem should skip multiple choice options
        skip_choices = self.no_choices_overrides.get(problem_id, False)
        if skip_choices:
            print(f"Skipping multiple choice extraction for {comp_id} Problem {problem_number} (no_choices override)")
        
        # Check for question override first
        if problem_id in self.question_overrides:
            print(f"Using question override for {comp_id} Problem {problem_number}")
            question_override = self.question_overrides[problem_id]
            question_text = question_override['question']['text']
            insertions = question_override['question']['insertions']
            choices = {
                'text_choices': question_override['question'].get('text_choices', []),
                'picture_choices': question_override['question'].get('picture_choices', []),
                'latex_choices': question_override['question'].get('latex_choices', []),
                'asy_choices': question_override['question'].get('asy_choices', [])
            }
        else:
            # No question override, parse from HTML
            soup = BeautifulSoup(html, 'html.parser')
            question_text, insertions, choices = self.extract_question_and_choices(soup)
            
            # Raise exception if no question found
            if not question_text:
                raise ValueError(f"No question text found for {comp_id} Problem {problem_number}")
            
            # Only check for multiple choice options if not skipping choices
            if not skip_choices:
                has_choices = (choices['text_choices'] or 
                              choices['picture_choices'] or 
                              choices['latex_choices'] or 
                              choices['asy_choices'])
                if not has_choices:
                    raise ValueError(f"No multiple choice options found for {comp_id} Problem {problem_number}")
            else:
                # For problems with no choices override, set empty choices
                choices = {
                    'text_choices': [],
                    'picture_choices': [],
                    'latex_choices': [],
                    'asy_choices': []
                }
        
        # Check for answer override first
        if problem_id in self.answer_overrides:
            final_answer = self.answer_overrides[problem_id]
            print(f"Using answer override for {comp_id} Problem {problem_number}: {final_answer}")
            # Still extract solutions but don't extract answers
            soup = BeautifulSoup(html, 'html.parser')
            solutions, all_extracted_answers = self.extract_solutions(soup, extract_answers=False)
        elif self.use_answer_sheets:
            # Use answer sheet instead of extracting from problem page
            print(f"Using answer sheet for {comp_id} Problem {problem_number}")
            answer_sheet = self.fetch_answer_sheet(competition)
            if answer_sheet and problem_number <= len(answer_sheet):
                final_answer = answer_sheet[problem_number - 1]  # Convert to 0-based index
                print(f"Found answer '{final_answer}' from answer sheet for {comp_id} Problem {problem_number}")
                # Still extract solutions but don't extract answers
                soup = BeautifulSoup(html, 'html.parser')
                solutions, all_extracted_answers = self.extract_solutions(soup, extract_answers=False)
            else:
                print(f"Answer sheet not available for {comp_id}, falling back to problem page extraction")
                # Fall back to normal answer extraction
                soup = BeautifulSoup(html, 'html.parser')
                solutions, all_extracted_answers = self.extract_solutions(soup, extract_answers=True)
                
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
        else:
            # No override and not using answer sheets, proceed with normal answer extraction
            soup = BeautifulSoup(html, 'html.parser')
            solutions, all_extracted_answers = self.extract_solutions(soup, extract_answers=True) # Extract solutions and all answers
            
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
        
        # Check for solution override
        if problem_id in self.solution_overrides:
            print(f"Using solution override for {comp_id} Problem {problem_number}")
            solutions = self.solution_overrides[problem_id]['solutions']
        elif not solutions:
            # No solution override and no solutions extracted
            raise ValueError(f"No solutions found for {comp_id} Problem {problem_number}")
        
        problem_data = {
            'id': problem_id,
            'question': {
                'text': question_text,
                'insertions': insertions,
                'type': 'free-response' if skip_choices else 'multiple-choice',
                **choices
            },
            'tags': [],
            'sources': [],
            'answer': final_answer,
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
        failed_problems = parsing_results["failed_problems"]
        skipped_problems = parsing_results["skipped_problems"]
        
        print(f"  📝 Parsing log saved: {log_file}")
        print(f"  📊 Results: {summary['successful']} successful, {summary['failed']} failed, {summary['skipped']} skipped")
        
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

def main(competition_dict_file="competition_dict.json", use_answer_sheets=True):
    """
    Main function to download AMC problems
    
    Args:
        competition_dict_file: Path to the JSON file containing competition configuration.
                              Defaults to "competition_dict.json"
        use_answer_sheets: If True, use answer key pages instead of extracting answers from problem pages.
                          Defaults to False.
    
    Examples:
        main()  # Use default competition_dict.json and answer sheets
        main("custom_competitions.json")  # Use custom competition file with answer sheets
        main(use_answer_sheets=False)  # Use problem page extraction instead of answer sheets
        main("custom_competitions.json", use_answer_sheets=False)  # Custom file with problem page extraction
    """
    parser = AMCParser(competition_dict_file, "answer_overrides.json", "question_overrides.json", "solution_overrides.json", "no_choices_overrides.json", use_answer_sheets)
    
    # Print configuration
    print("=== AMC Problem Downloader Configuration ===")
    print(f"Using competition configuration from: {competition_dict_file}")
    print(f"Answer extraction method: {'Answer sheets' if use_answer_sheets else 'Problem page extraction'}")
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
    # Use answer sheets by default for more reliable answer extraction
    main("small_competition_dict.json") 