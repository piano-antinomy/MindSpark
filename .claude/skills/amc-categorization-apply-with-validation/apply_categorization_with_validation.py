#!/usr/bin/env python3
"""
Apply categorization data to AMC JSON problems with validation.

Usage:
  python apply_categorization_with_validation.py <categorization_file> <amc_file>
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional


def find_repo_root(start: Path) -> Optional[Path]:
    for parent in [start, *start.parents]:
        if (parent / ".git").exists() or (parent / "backend-java").exists():
            return parent
    return None


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = find_repo_root(SCRIPT_PATH)
if REPO_ROOT is None:
    print("Error: Could not locate repository root from script location.")
    sys.exit(1)

AMCLABEL_PATH = REPO_ROOT / "scripts" / "python" / "amc_labeling"
sys.path.append(str(AMCLABEL_PATH))

from category_validator import CategoryValidator  # noqa: E402


def load_json_file(file_path: str):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {e}")
        sys.exit(1)


def save_json_file(file_path: str, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved updated file: {file_path}")
    except Exception as e:
        print(f"Error saving file {file_path}: {e}")
        sys.exit(1)


def validate_categorization_data(categorization_data, validator):
    invalid_entries = []
    for problem_id, categorization in categorization_data.items():
        if not isinstance(categorization, dict):
            print(
                f"ERROR: categorization for {problem_id} is not a dict, "
                f"it's a {type(categorization)}: {categorization}"
            )
            continue

        category = categorization.get("category", "")
        sub_category = categorization.get("sub_category", "")

        if not validator.is_valid_category(category, sub_category):
            invalid_entries.append(
                {
                    "problem_id": problem_id,
                    "category": category,
                    "sub_category": sub_category,
                }
            )
    return invalid_entries


def apply_categorization_with_validation(categorization_data, amc_data, validator):
    if "problems" not in amc_data:
        print("Error: AMC file does not contain 'problems' key")
        sys.exit(1)

    problems = amc_data["problems"]
    updated_count = 0
    not_found_count = 0
    validation_errors = []

    for problem in problems:
        problem_id = problem.get("id")
        if not problem_id:
            print(f"Warning: Problem missing 'id' field: {problem}")
            continue

        if problem_id in categorization_data:
            cat_data = categorization_data[problem_id]
            category = cat_data.get("category", "")
            sub_category = cat_data.get("sub_category", "")

            if not validator.is_valid_category(category, sub_category):
                validation_errors.append(
                    {
                        "problem_id": problem_id,
                        "category": category,
                        "sub_category": sub_category,
                    }
                )
                print(f"Invalid categorization for {problem_id}: {category} -> {sub_category}")
                continue

            problem["categorization"] = [
                {
                    "category": category,
                    "sub_category": sub_category,
                }
            ]
            updated_count += 1
            print(f"Updated categorization for: {problem_id} ({category} -> {sub_category})")
        else:
            not_found_count += 1
            print(f"No categorization found for: {problem_id}")

    print("\nSummary:")
    print(f"Problems updated: {updated_count}")
    print(f"Problems not found in categorization data: {not_found_count}")
    print(f"Validation errors: {len(validation_errors)}")
    print(f"Total problems in AMC file: {len(problems)}")

    if validation_errors:
        print("\nValidation errors found (these were skipped):")
        for error in validation_errors:
            print(f"  - {error['problem_id']}: {error['category']} -> {error['sub_category']}")

    return amc_data


def main():
    if len(sys.argv) != 3:
        print("Usage: python apply_categorization_with_validation.py <categorization_file> <amc_file>")
        print(
            "Example: python apply_categorization_with_validation.py "
            "/path/to/categorization.json /path/to/amc_file.json"
        )
        sys.exit(1)

    categorization_file = sys.argv[1]
    amc_file = sys.argv[2]

    if not os.path.isabs(categorization_file):
        print(f"Error: Categorization file path must be absolute: {categorization_file}")
        sys.exit(1)

    if not os.path.isabs(amc_file):
        print(f"Error: AMC file path must be absolute: {amc_file}")
        sys.exit(1)

    try:
        validator = CategoryValidator()
        print("Category validator initialized successfully")
    except Exception as e:
        print(f"Error initializing category validator: {e}")
        sys.exit(1)

    print(f"Loading categorization data from: {categorization_file}")
    categorization_data = load_json_file(categorization_file)

    print(f"Loading AMC data from: {amc_file}")
    amc_data = load_json_file(amc_file)

    print("Validating categorization data...")
    invalid_entries = validate_categorization_data(categorization_data, validator)

    if invalid_entries:
        print("Found invalid categorizations (these will be skipped):")
        for invalid in invalid_entries:
            print(f"  - {invalid['problem_id']}: {invalid['category']} -> {invalid['sub_category']}")
        print("Continuing with valid categorizations...")
    else:
        print("All categorizations are valid")

    print("Applying categorization...")
    updated_amc_data = apply_categorization_with_validation(categorization_data, amc_data, validator)

    print("Saving updated AMC file...")
    save_json_file(amc_file, updated_amc_data)
    print("Categorization application completed successfully")


if __name__ == "__main__":
    main()
