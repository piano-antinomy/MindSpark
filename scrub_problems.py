#!/usr/bin/env python3
"""
Script to scrub problems by keeping only the first solution and removing the rest.
"""

import json
import sys
from pathlib import Path


def find_matching_files(filename):
    """Find matching files between questions and AI folders by filename"""
    questions_dir = Path("backend-java/resources/math/questions")
    
    # Search for the file in questions directory
    questions_file = None
    for file_path in questions_dir.rglob(filename):
        questions_file = file_path
        break
    
    if not questions_file:
        print(f"❌ File '{filename}' not found in questions directory")
        return None
    
    return questions_file


def scrub_problem_file(questions_file):
    """Scrub the problem file by keeping only the first solution for each problem"""
    print(f"Processing: {questions_file.name}")
    
    # Read questions file
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions_data = json.load(f)
    
    problems_updated = 0
    
    # Process each problem in the questions file
    for problem in questions_data.get('problems', []):
        solutions = problem.get('solutions', [])
        
        if len(solutions) > 1:
            # Keep only the first solution
            problem['solutions'] = [solutions[0]]
            problems_updated += 1
            print(f"  ✓ Kept first solution for problem {problem.get('id', 'unknown')}")
        elif len(solutions) == 1:
            print(f"  - Problem {problem.get('id', 'unknown')} already has only one solution")
        else:
            print(f"  - Problem {problem.get('id', 'unknown')} has no solutions")
    
    print(f"  📝 Updated {problems_updated} problems (kept first solution only)")
    
    # Write updated questions file
    with open(questions_file, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, indent=2, ensure_ascii=False)
    
    return problems_updated


def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python scrub_problems.py <filename>")
        print("Example: python scrub_problems.py 2025_AMC_8.json")
        return
    
    filename = sys.argv[1]
    
    print(f"🔍 Looking for file: {filename}")
    questions_file = find_matching_files(filename)
    
    if not questions_file:
        return
    
    print(f"📁 Found file: {questions_file}")
    
    print(f"\n{'='*60}")
    problems_updated = scrub_problem_file(questions_file)
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY:")
    print(f"  Problems updated: {problems_updated}")
    print(f"  File processed: {questions_file.name}")
    
    if problems_updated > 0:
        print(f"\n✅ Successfully scrubbed {problems_updated} problems!")
    else:
        print(f"\nℹ️  No changes needed - all problems already have only one solution")


if __name__ == "__main__":
    main() 