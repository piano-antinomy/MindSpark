#!/usr/bin/env python3
"""
Script to apply categorization information to AMC problems with validation.

Usage: python apply_categorization_with_validation.py <categorization_file> <amc_file>

Args:
    categorization_file: Absolute path to JSON file containing categorization data
    amc_file: Absolute path to JSON file containing AMC problems
"""

import json
import sys
import os

# Add the scripts/python/amc_labeling directory to the path to import the validator
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts', 'python', 'amc_labeling'))

from category_validator import CategoryValidator

def load_json_file(file_path):
    """Load and return JSON data from file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {e}")
        sys.exit(1)

def save_json_file(file_path, data):
    """Save JSON data to file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved updated file: {file_path}")
    except Exception as e:
        print(f"Error saving file {file_path}: {e}")
        sys.exit(1)

def validate_categorization_data(categorization_data, validator):
    """
    Validate all categorization data and return invalid entries.
    
    Args:
        categorization_data: Dict with problem_id as keys and categorization dicts as values
        validator: CategoryValidator instance
    
    Returns:
        list: List of invalid entries
    """
    invalid_entries = []
    
    for problem_id, categorization in categorization_data.items():
        # Debug: Check the type of categorization
        if not isinstance(categorization, dict):
            print(f"ERROR: categorization for {problem_id} is not a dict, it's a {type(categorization)}: {categorization}")
            continue
            
        category = categorization.get('category', '')
        sub_category = categorization.get('sub_category', '')
        
        if not validator.is_valid_category(category, sub_category):
            invalid_entries.append({
                'problem_id': problem_id,
                'category': category,
                'sub_category': sub_category
            })
    
    return invalid_entries

def apply_categorization_with_validation(categorization_data, amc_data, validator):
    """
    Apply categorization information to AMC problems with validation.
    
    Args:
        categorization_data: Dict with problem_id as keys and categorization dicts as values
        amc_data: Dict containing AMC competition data with 'problems' list
        validator: CategoryValidator instance
    
    Returns:
        Updated amc_data with categorization applied
    """
    if 'problems' not in amc_data:
        print("Error: AMC file does not contain 'problems' key")
        sys.exit(1)
    
    problems = amc_data['problems']
    updated_count = 0
    not_found_count = 0
    validation_errors = []
    
    for problem in problems:
        problem_id = problem.get('id')
        if not problem_id:
            print(f"Warning: Problem missing 'id' field: {problem}")
            continue
            
        if problem_id in categorization_data:
            # Get the categorization data
            cat_data = categorization_data[problem_id]
            category = cat_data.get('category', '')
            sub_category = cat_data.get('sub_category', '')
            
            # Validate the categorization
            if not validator.is_valid_category(category, sub_category):
                validation_errors.append({
                    'problem_id': problem_id,
                    'category': category,
                    'sub_category': sub_category
                })
                print(f"❌ Invalid categorization for {problem_id}: {category} → {sub_category}")
                continue
            
            # Create the categorization list with a single entry
            categorization_entry = {
                "category": category,
                "sub_category": sub_category
            }
            
            # Apply the categorization
            problem['categorization'] = [categorization_entry]
            updated_count += 1
            print(f"✅ Updated categorization for: {problem_id} ({category} → {sub_category})")
        else:
            not_found_count += 1
            print(f"⚠️  No categorization found for: {problem_id}")
    
    print(f"\nSummary:")
    print(f"Problems updated: {updated_count}")
    print(f"Problems not found in categorization data: {not_found_count}")
    print(f"Validation errors: {len(validation_errors)}")
    print(f"Total problems in AMC file: {len(problems)}")
    
    if validation_errors:
        print(f"\n❌ Validation errors found (these were skipped):")
        for error in validation_errors:
            print(f"  - {error['problem_id']}: {error['category']} → {error['sub_category']}")
    
    return amc_data

def main():
    """Main function to handle command line arguments and execute the script."""
    if len(sys.argv) != 3:
        print("Usage: python apply_categorization_with_validation.py <categorization_file> <amc_file>")
        print("Example: python apply_categorization_with_validation.py /path/to/categorization.json /path/to/amc_file.json")
        sys.exit(1)
    
    categorization_file = sys.argv[1]
    amc_file = sys.argv[2]
    
    # Validate file paths
    if not os.path.isabs(categorization_file):
        print(f"Error: Categorization file path must be absolute: {categorization_file}")
        sys.exit(1)
    
    if not os.path.isabs(amc_file):
        print(f"Error: AMC file path must be absolute: {amc_file}")
        sys.exit(1)
    
    # Initialize the category validator
    try:
        validator = CategoryValidator()
        print("✅ Category validator initialized successfully")
    except Exception as e:
        print(f"Error initializing category validator: {e}")
        sys.exit(1)
    
    print(f"Loading categorization data from: {categorization_file}")
    categorization_data = load_json_file(categorization_file)
    
    print(f"Loading AMC data from: {amc_file}")
    amc_data = load_json_file(amc_file)
    
    # Validate all categorization data and show invalid ones
    print("Validating categorization data...")
    invalid_entries = validate_categorization_data(categorization_data, validator)
    
    if invalid_entries:
        print("❌ Found invalid categorizations (these will be skipped):")
        for invalid in invalid_entries:
            print(f"  - {invalid['problem_id']}: {invalid['category']} → {invalid['sub_category']}")
        print("Continuing with valid categorizations...")
    else:
        print("✅ All categorizations are valid!")
    
    print("Applying categorization...")
    updated_amc_data = apply_categorization_with_validation(categorization_data, amc_data, validator)
    
    print(f"Saving updated AMC file...")
    save_json_file(amc_file, updated_amc_data)
    
    print("Categorization application completed successfully!")

if __name__ == "__main__":
    main() 