#!/usr/bin/env python3
"""
Generic AMC Problem Merger

This script merges individual problem files into a main competition file.
It handles JSON parsing, validation, and proper insertion at the correct positions.

Usage:
    python merge_problems.py <main_file> <problem_files...>

Example:
    python merge_problems.py 2015_AMC_10B.json 2015_AMC_10B_Problem_10.json 2015_AMC_10B_Problem_16.json
"""

import json
import sys
import os
from typing import List, Dict, Any


def load_json_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}")
        sys.exit(1)


def save_json_file(filepath: str, data: Dict[str, Any]) -> None:
    """Save data to a JSON file with proper formatting."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved merged file: {filepath}")
    except Exception as e:
        print(f"Error saving file {filepath}: {e}")
        sys.exit(1)


def extract_problem_from_file(filepath: str) -> Dict[str, Any]:
    """Extract the problem data from a problem file."""
    data = load_json_file(filepath)
    
    if 'problems' not in data or not data['problems']:
        print(f"Error: No problems found in {filepath}")
        sys.exit(1)
    
    # Return the first (and should be only) problem
    return data['problems'][0]


def get_problem_number(problem: Dict[str, Any]) -> int:
    """Extract problem number from problem ID."""
    problem_id = problem.get('id', '')
    
    # Parse problem ID like "amc_2015_10b_10" -> 10
    parts = problem_id.split('_')
    if len(parts) >= 4:
        try:
            return int(parts[-1])
        except ValueError:
            pass
    
    # Fallback: try to get from competition info
    if 'competition_info' in problem:
        override = problem['competition_info'].get('problem_number_override')
        if override is not None:
            return override
    
    print(f"Error: Could not determine problem number from {problem_id}")
    sys.exit(1)


def verify_merge(main_file: str, problems_added: List[int]) -> None:
    """Verify that the merge was successful by checking problem order and count."""
    print("\n=== Verification ===")
    
    # Load the merged file
    main_data = load_json_file(main_file)
    problems = main_data['problems']
    
    # Extract all problem numbers
    all_problem_numbers = []
    for problem in problems:
        problem_number = get_problem_number(problem)
        all_problem_numbers.append(problem_number)
    
    # Check if all problems are in order
    is_ordered = all_problem_numbers == sorted(all_problem_numbers)
    print(f"✓ Problems in correct order: {is_ordered}")
    
    # Check total count
    expected_total = len(all_problem_numbers)
    actual_total = main_data['competition_info']['total_problems']
    count_correct = expected_total == actual_total
    print(f"✓ Total problem count correct: {count_correct} ({actual_total}/{expected_total})")
    
    # Check that added problems are present
    all_added_present = all(p in all_problem_numbers for p in problems_added)
    print(f"✓ All added problems present: {all_added_present}")
    
    # Show problem range
    if all_problem_numbers:
        print(f"✓ Problem range: {min(all_problem_numbers)} - {max(all_problem_numbers)}")
    
    # Show summary
    print(f"\nFinal verification:")
    print(f"  - Total problems: {len(problems)}")
    print(f"  - Problems added: {problems_added}")
    print(f"  - All problems in order: {is_ordered}")
    print(f"  - Count matches metadata: {count_correct}")
    
    if is_ordered and count_correct and all_added_present:
        print("✓ Verification passed - merge successful!")
    else:
        print("⚠ Verification failed - please check the merged file")
        sys.exit(1)


def merge_problems(main_file: str, problem_files: List[str]) -> None:
    """Merge individual problem files into the main competition file."""
    
    # Load main file
    print(f"Loading main file: {main_file}")
    main_data = load_json_file(main_file)
    
    if 'problems' not in main_data:
        print("Error: Main file does not contain 'problems' array")
        sys.exit(1)
    
    # Extract problems from individual files
    problems_to_add = []
    for problem_file in problem_files:
        print(f"Loading problem file: {problem_file}")
        problem = extract_problem_from_file(problem_file)
        problem_number = get_problem_number(problem)
        problems_to_add.append((problem_number, problem))
    
    # Sort by problem number
    problems_to_add.sort(key=lambda x: x[0])
    
    # Get existing problem numbers
    existing_problems = main_data['problems']
    existing_numbers = []
    for problem in existing_problems:
        problem_number = get_problem_number(problem)
        existing_numbers.append(problem_number)
    
    print(f"Existing problems: {sorted(existing_numbers)}")
    print(f"Problems to add: {[p[0] for p in problems_to_add]}")
    
    # Check for duplicates
    for problem_number, _ in problems_to_add:
        if problem_number in existing_numbers:
            print(f"Warning: Problem {problem_number} already exists in main file")
            continue
    
    # Insert problems at correct positions
    all_problems = []
    existing_index = 0
    add_index = 0
    
    while existing_index < len(existing_problems) and add_index < len(problems_to_add):
        existing_problem = existing_problems[existing_index]
        existing_number = get_problem_number(existing_problem)
        add_number, add_problem = problems_to_add[add_index]
        
        if existing_number < add_number:
            all_problems.append(existing_problem)
            existing_index += 1
        else:
            all_problems.append(add_problem)
            add_index += 1
    
    # Add remaining existing problems
    while existing_index < len(existing_problems):
        all_problems.append(existing_problems[existing_index])
        existing_index += 1
    
    # Add remaining problems to add
    while add_index < len(problems_to_add):
        all_problems.append(problems_to_add[add_index][1])
        add_index += 1
    
    # Update main data
    main_data['problems'] = all_problems
    main_data['competition_info']['total_problems'] = len(all_problems)
    
    # Create backup
    backup_file = main_file.replace('.json', '_backup.json')
    print(f"Creating backup: {backup_file}")
    save_json_file(backup_file, load_json_file(main_file))
    
    # Save merged file
    print(f"Saving merged file: {main_file}")
    save_json_file(main_file, main_data)
    
    # Print summary
    print(f"\n✓ Successfully merged {len(problems_to_add)} problems")
    print(f"✓ Total problems in file: {len(all_problems)}")
    print(f"✓ Problems added: {[p[0] for p in problems_to_add]}")
    
    # Verify the merge
    problems_added = [p[0] for p in problems_to_add]
    verify_merge(main_file, problems_added)


def main():
    """Main function."""
    if len(sys.argv) < 3:
        print("Usage: python merge_problems.py <main_file> <problem_files...>")
        print("Example: python merge_problems.py 2015_AMC_10B.json 2015_AMC_10B_Problem_10.json 2015_AMC_10B_Problem_16.json")
        sys.exit(1)
    
    main_file = sys.argv[1]
    problem_files = sys.argv[2:]
    
    # Validate files exist
    all_files = [main_file] + problem_files
    for filepath in all_files:
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
    
    print("=== AMC Problem Merger ===")
    print(f"Main file: {main_file}")
    print(f"Problem files: {problem_files}")
    print("=" * 30)
    
    merge_problems(main_file, problem_files)
    
    print("\n✓ Merge completed successfully!")


if __name__ == "__main__":
    main() 