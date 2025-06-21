#!/usr/bin/env python3
"""
Script to merge problems 18, 24, and 25 into the main 2014_AMC_8.json file.
"""

import json
import os

def merge_2014_amc8_problems():
    # File paths
    main_file = "../../../backend-java/questions/AMC/AMC_8/2014_AMC_8.json"
    problem_18_file = "../../../backend-java/questions/AMC/AMC_8/2014_AMC_8_Problem_18.json"
    problem_24_file = "../../../backend-java/questions/AMC/AMC_8/2014_AMC_8_Problem_24.json"
    problem_25_file = "../../../backend-java/questions/AMC/AMC_8/2014_AMC_8_Problem_25.json"
    
    # Load main file
    print("Loading main 2014_AMC_8.json file...")
    with open(main_file, 'r', encoding='utf-8') as f:
        main_data = json.load(f)
    
    # Load individual problem files
    print("Loading individual problem files...")
    with open(problem_18_file, 'r', encoding='utf-8') as f:
        problem_18_data = json.load(f)
    
    with open(problem_24_file, 'r', encoding='utf-8') as f:
        problem_24_data = json.load(f)
    
    with open(problem_25_file, 'r', encoding='utf-8') as f:
        problem_25_data = json.load(f)
    
    # Extract problems from individual files
    problem_18 = problem_18_data['problems'][0]
    problem_24 = problem_24_data['problems'][0]
    problem_25 = problem_25_data['problems'][0]
    
    # Get current problems list
    problems = main_data['problems']
    
    # Find where to insert problem 18 (between 17 and 19)
    insert_index_18 = None
    for i, problem in enumerate(problems):
        problem_num = int(problem['id'].split('_')[-1])
        if problem_num > 18:
            insert_index_18 = i
            break
    
    if insert_index_18 is None:
        insert_index_18 = len(problems)
    
    # Insert problem 18
    print(f"Inserting problem 18 at position {insert_index_18}...")
    problems.insert(insert_index_18, problem_18)
    
    # Add problems 24 and 25 at the end
    print("Adding problems 24 and 25 at the end...")
    problems.append(problem_24)
    problems.append(problem_25)
    
    # Update total problems count
    main_data['competition_info']['total_problems'] = len(problems)
    
    # Save the updated file
    print(f"Saving updated file with {len(problems)} problems...")
    with open(main_file, 'w', encoding='utf-8') as f:
        json.dump(main_data, f, indent=2, ensure_ascii=False)
    
    print("Successfully merged problems 18, 24, and 25 into 2014_AMC_8.json")
    
    # Verify the merge
    print("\nVerification:")
    problem_numbers = [int(p['id'].split('_')[-1]) for p in problems]
    print(f"Problem numbers in file: {sorted(problem_numbers)}")
    print(f"Total problems: {len(problems)}")
    
    # Check for duplicates
    duplicates = [x for x in problem_numbers if problem_numbers.count(x) > 1]
    if duplicates:
        print(f"WARNING: Duplicate problem numbers found: {duplicates}")
    else:
        print("No duplicate problem numbers found.")

if __name__ == "__main__":
    merge_2014_amc8_problems() 