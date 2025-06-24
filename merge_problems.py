import json
import os

def load_json_file(filepath):
    """Load a JSON file and return the data"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(filepath, data):
    """Save data to a JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def merge_problems():
    """Merge individual problem files into the main 2024_AMC_10B.json file"""
    
    # Load the main file
    main_file = "backend-java/questions/AMC/AMC_10/2024_AMC_10B.json"
    main_data = load_json_file(main_file)
    
    # Load the individual problem files
    problem_files = [
        "backend-java/questions/AMC/AMC_10/2024_AMC_10B_Problem_5.json",
        "backend-java/questions/AMC/AMC_10/2024_AMC_10B_Problem_6.json", 
        "backend-java/questions/AMC/AMC_10/2024_AMC_10B_Problem_8.json"
    ]
    
    # Extract problems from individual files
    problems_to_add = []
    for filepath in problem_files:
        if os.path.exists(filepath):
            problem_data = load_json_file(filepath)
            problems_to_add.extend(problem_data['problems'])
            print(f"Loaded problem from {filepath}")
        else:
            print(f"Warning: {filepath} not found")
    
    # Sort problems by problem number (extract from id)
    def get_problem_number(problem):
        # Extract number from id like "amc_2024_10b_5"
        return int(problem['id'].split('_')[-1])
    
    problems_to_add.sort(key=get_problem_number)
    
    # Find insertion positions in main file
    main_problems = main_data['problems']
    
    # Create a map of existing problem numbers
    existing_numbers = set()
    for problem in main_problems:
        existing_numbers.add(get_problem_number(problem))
    
    print(f"Existing problem numbers: {sorted(existing_numbers)}")
    print(f"Problems to add: {[get_problem_number(p) for p in problems_to_add]}")
    
    # Insert problems in correct positions
    for problem_to_add in problems_to_add:
        problem_num = get_problem_number(problem_to_add)
        
        # Find the correct insertion position
        insert_index = 0
        for i, existing_problem in enumerate(main_problems):
            existing_num = get_problem_number(existing_problem)
            if existing_num > problem_num:
                insert_index = i
                break
            insert_index = i + 1
        
        # Insert the problem
        main_problems.insert(insert_index, problem_to_add)
        print(f"Inserted problem {problem_num} at position {insert_index}")
    
    # Update the total problems count
    main_data['competition_info']['total_problems'] = len(main_problems)
    
    # Save the updated main file
    save_json_file(main_file, main_data)
    print(f"Updated {main_file} with {len(problems_to_add)} new problems")
    print(f"Total problems now: {len(main_problems)}")

if __name__ == "__main__":
    merge_problems() 