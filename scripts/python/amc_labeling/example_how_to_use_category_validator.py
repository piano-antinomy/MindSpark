import json
import os
from category_validator import CategoryValidator

def update_2011_amc10_categorizations():
    """
    Update the categorizations for 2011 AMC 10 problems.
    """
    
    # Initialize validator
    validator = CategoryValidator()
    
    # Define corrections
    corrections = {
        "amc_2011_10a_2": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10a_3": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10a_7": {"category": "algebra", "sub_category": "inequalities"},
        "amc_2011_10a_8": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10a_9": {"category": "geometry", "sub_category": "coordinate_geometry"},
        "amc_2011_10a_10": {"category": "number_theory", "sub_category": "primes"},
        "amc_2011_10a_11": {"category": "geometry", "sub_category": "coordinate_geometry"},
        "amc_2011_10a_12": {"category": "algebra", "sub_category": "linear_equations"},
        "amc_2011_10a_13": {"category": "combinatorics", "sub_category": "counting"},
        "amc_2011_10a_14": {"category": "geometry", "sub_category": "triangles"},
        "amc_2011_10a_15": {"category": "algebra", "sub_category": "quadratic_equations"},
        "amc_2011_10a_16": {"category": "geometry", "sub_category": "circles"},
        "amc_2011_10a_17": {"category": "algebra", "sub_category": "functions"},
        "amc_2011_10a_18": {"category": "geometry", "sub_category": "polygons"},
        "amc_2011_10a_19": {"category": "number_theory", "sub_category": "divisibility"},
        "amc_2011_10a_20": {"category": "geometry", "sub_category": "solid_geometry"},
        "amc_2011_10a_21": {"category": "combinatorics", "sub_category": "counting"},
        "amc_2011_10a_22": {"category": "geometry", "sub_category": "triangles"},
        "amc_2011_10a_23": {"category": "algebra", "sub_category": "functions"},
        "amc_2011_10a_24": {"category": "geometry", "sub_category": "circles"},
        "amc_2011_10a_25": {"category": "combinatorics", "sub_category": "counting"},
        
        # B problems
        "amc_2011_10b_1": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10b_2": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10b_3": {"category": "geometry", "sub_category": "triangles"},
        "amc_2011_10b_4": {"category": "algebra", "sub_category": "basic_operations"},
        "amc_2011_10b_5": {"category": "geometry", "sub_category": "coordinate_geometry"},
        "amc_2011_10b_6": {"category": "algebra", "sub_category": "linear_equations"},
        "amc_2011_10b_7": {"category": "geometry", "sub_category": "circles"},
        "amc_2011_10b_8": {"category": "algebra", "sub_category": "functions"},
        "amc_2011_10b_9": {"category": "combinatorics", "sub_category": "counting"},
        "amc_2011_10b_10": {"category": "geometry", "sub_category": "polygons"},
        "amc_2011_10b_11": {"category": "algebra", "sub_category": "quadratic_equations"},
        "amc_2011_10b_12": {"category": "number_theory", "sub_category": "primes"},
        "amc_2011_10b_13": {"category": "geometry", "sub_category": "solid_geometry"},
        "amc_2011_10b_14": {"category": "algebra", "sub_category": "functions"},
        "amc_2011_10b_15": {"category": "geometry", "sub_category": "triangles"},
        "amc_2011_10b_16": {"category": "combinatorics", "sub_category": "counting"},
        "amc_2011_10b_17": {"category": "algebra", "sub_category": "inequalities"},
        "amc_2011_10b_18": {"category": "geometry", "sub_category": "circles"},
        "amc_2011_10b_19": {"category": "number_theory", "sub_category": "divisibility"},
        "amc_2011_10b_20": {"category": "geometry", "sub_category": "coordinate_geometry"},
        "amc_2011_10b_21": {"category": "algebra", "sub_category": "functions"},
        "amc_2011_10b_22": {"category": "combinatorics", "sub_category": "counting"},
        "amc_2011_10b_23": {"category": "geometry", "sub_category": "polygons"},
        "amc_2011_10b_24": {"category": "algebra", "sub_category": "quadratic_equations"},
        "amc_2011_10b_25": {"category": "combinatorics", "sub_category": "counting"}
    }
    
    # Validate all corrections before applying
    print("Validating corrections...")
    invalid_corrections = []
    for problem_id, correction in corrections.items():
        if not validator.is_valid_category(correction["category"], correction["sub_category"]):
            invalid_corrections.append({
                "problem_id": problem_id,
                "category": correction["category"],
                "sub_category": correction["sub_category"]
            })
    
    if invalid_corrections:
        print("❌ Found invalid corrections:")
        for invalid in invalid_corrections:
            print(f"  - {invalid['problem_id']}: {invalid['category']} → {invalid['sub_category']}")
        return False
    
    print("✅ All corrections are valid!")
    
    # Load the file
    file_path = "../../backend-java/questions/AMC_processed/AMC_10_combined/2011_AMC_10.json"
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Apply corrections
    updated_count = 0
    for problem in data["problems"]:
        problem_id = problem["id"]
        if problem_id in corrections:
            old_cat = problem["categorization"][0]["category"]
            old_sub = problem["categorization"][0]["sub_category"]
            new_cat = corrections[problem_id]["category"]
            new_sub = corrections[problem_id]["sub_category"]
            
            problem["categorization"][0]["category"] = new_cat
            problem["categorization"][0]["sub_category"] = new_sub
            
            print(f"Updated {problem_id}: {old_cat} → {new_cat}, {old_sub} → {new_sub}")
            updated_count += 1
    
    # Save the updated file
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✅ Updated {updated_count} problems successfully!")
    return True

if __name__ == "__main__":
    update_2011_amc10_categorizations()