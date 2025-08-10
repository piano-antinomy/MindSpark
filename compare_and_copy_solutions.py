#!/usr/bin/env python3
"""
Script to compare AI answers with question answers and copy AI text to 
solutions when they match.
"""

import json
import re
import sys
from pathlib import Path


def extract_problem_number_from_id(problem_id):
    """Extract problem number from problem ID like 'amc_2025_8_1' -> 1"""
    match = re.search(r'amc_\d+_\d+_(\d+)$', problem_id)
    if match:
        return int(match.group(1))
    return None


def find_matching_files(filename):
    """Find matching files between questions and AI folders by filename"""
    questions_dir = Path("backend-java/resources/math/questions")
    ai_dir = Path("backend-java/resoures/math/ai")
    
    # Search for the file in questions directory
    questions_file = None
    for file_path in questions_dir.rglob(filename):
        questions_file = file_path
        break
    
    if not questions_file:
        print(f"❌ File '{filename}' not found in questions directory")
        return None
    
    # Get relative path from questions directory
    rel_path = questions_file.relative_to(questions_dir)
    
    # Construct corresponding AI file path
    ai_file = ai_dir / rel_path
    
    if not ai_file.exists():
        print(f"❌ Corresponding AI file not found: {ai_file}")
        return None
    
    return questions_file, ai_file


def process_file_pair(questions_file, ai_file):
    """Process a pair of matching files"""
    print(f"Processing: {questions_file.name}")
    
    # Read questions file
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    # Read AI file with error handling for malformed JSON
    try:
        with open(ai_file, 'r', encoding='utf-8') as f:
            ai_data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"  ❌ Error reading AI file: {e}")
        print("  The AI file contains malformed JSON. Please fix the "
              "escape sequences.")
        return 0, 0
    
    mismatched_problems = []
    updated_problems = 0
    
    # Process each problem in the questions file
    for problem in questions_data.get('problems', []):
        problem_id = problem.get('id')
        question_answer = problem.get('answer')
        
        if not problem_id or not question_answer:
            continue
        
        # Extract problem number from ID
        problem_number = extract_problem_number_from_id(problem_id)
        if problem_number is None:
            print(f"  Warning: Could not extract problem number from ID: "
                  f"{problem_id}")
            continue
        
        # Get AI data for this problem number
        ai_problem_data = ai_data.get(str(problem_number))
        if not ai_problem_data:
            print(f"  Warning: No AI data found for problem {problem_number}")
            continue
        
        ai_answer = ai_problem_data.get('answer')
        ai_text = ai_problem_data.get('text')
        
        if not ai_answer or not ai_text:
            print(f"  Warning: Missing answer or text in AI data for "
                  f"problem {problem_number}")
            continue
        
        # Compare answers
        if question_answer == ai_answer:
            # Answers match - add AI text as first solution
            if 'solutions' not in problem:
                problem['solutions'] = []
            
            # Create new solution object
            new_solution = {
                "text": ai_text
            }
            
            # Insert at the beginning of solutions list
            problem['solutions'].insert(0, new_solution)
            updated_problems += 1
            print(f"  ✓ Problem {problem_number}: Answers match, "
                  f"added AI solution")
        else:
            # Answers don't match - record the problem
            mismatched_problems.append(problem_id)
            print(f"  ✗ Problem {problem_number}: Answer mismatch - "
                  f"Questions: {question_answer}, AI: {ai_answer}")
    
    # Print summary
    if mismatched_problems:
        print(f"  ❌ Mismatched problems: {', '.join(mismatched_problems)}")
    else:
        print("  ✅ All problems matched!")
    
    print(f"  📝 Updated {updated_problems} problems with AI solutions")
    
    # Write updated questions file
    with open(questions_file, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, indent=2, ensure_ascii=False)
    
    return len(mismatched_problems), updated_problems


def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python compare_and_copy_solutions.py <filename>")
        print("Example: python compare_and_copy_solutions.py 2025_AMC_8.json")
        return
    
    filename = sys.argv[1]
    
    print(f"🔍 Looking for file: {filename}")
    file_pair = find_matching_files(filename)
    
    if not file_pair:
        return
    
    questions_file, ai_file = file_pair
    print("📁 Found matching files:")
    print(f"  Questions: {questions_file}")
    print(f"  AI: {ai_file}")
    
    print(f"\n{'='*60}")
    mismatched, updated = process_file_pair(questions_file, ai_file)
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY:")
    print(f"  Problems updated: {updated}")
    print(f"  Problems with mismatched answers: {mismatched}")
    
    if mismatched > 0:
        print(f"\n⚠️  {mismatched} problems have mismatched answers - "
              f"check the output above for details")
    else:
        print("\n✅ All problems matched successfully!")


if __name__ == "__main__":
    main() 