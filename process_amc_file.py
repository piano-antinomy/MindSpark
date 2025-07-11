import json
import re
import os
import glob

def replace_insertions(text, insertions):
    """Replace INSERTION_INDEX_X placeholders with their alt_value from insertions"""
    if not insertions:
        return text
    
    for key, value in insertions.items():
        if 'alt_value' in value:
            text = text.replace(f'<{key}>', value['alt_value'])
    
    return text

def process_amc_file(input_file, output_file):
    """Process AMC JSON file and create simplified version with resolved insertions"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    processed_problems = []
    
    for problem in data['problems']:
        # Process question
        question_text = problem['question']['text']
        question_insertions = problem['question'].get('insertions', {})
        processed_question = replace_insertions(question_text, question_insertions)
        
        # Process solutions
        processed_solutions = []
        for solution in problem['solutions']:
            solution_text = solution['text']
            solution_insertions = solution.get('insertions', {})
            processed_solution = replace_insertions(solution_text, solution_insertions)
            processed_solutions.append(processed_solution)
        
        # Create simplified problem structure
        processed_problem = {
            "id": problem['id'],
            "question": processed_question,
            "solutions": processed_solutions
        }
        
        processed_problems.append(processed_problem)
    
    # Create output structure
    output_data = {
        "competition_info": data['competition_info'],
        "problems": processed_problems
    }
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Processed {len(processed_problems)} problems -> {output_file}")

def process_all_amc_files():
    """Process all AMC JSON files in the backend-java/questions/AMC directory"""
    
    # Find all JSON files in the AMC directory
    amc_dir = "backend-java/questions/AMC"
    output_dir = "backend-java/questions/AMC_processed"
    
    # Get all JSON files recursively
    json_files = glob.glob(f"{amc_dir}/**/*.json", recursive=True)
    
    print(f"Found {len(json_files)} AMC JSON files to process")
    
    for input_file in json_files:
        # Create corresponding output file path
        relative_path = os.path.relpath(input_file, amc_dir)
        output_file = os.path.join(output_dir, relative_path)
        
        try:
            process_amc_file(input_file, output_file)
        except Exception as e:
            print(f"Error processing {input_file}: {e}")
    
    print(f"\nProcessing complete! Processed files saved to {output_dir}")

if __name__ == "__main__":
    process_all_amc_files() 