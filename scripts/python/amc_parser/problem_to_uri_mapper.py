#!/usr/bin/env python3
"""
Script to map AMC problem IDs to their corresponding AoPS wiki URIs.
Based on the competition dictionary structure.
"""

import json
import os
from typing import Dict, List, Tuple

def load_competition_dict(file_path: str) -> List[Dict]:
    """Load the competition dictionary from JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)

def generate_problem_mappings(competition_dict: List[Dict]) -> Dict[str, str]:
    """
    Generate mappings from problem IDs to AoPS wiki URIs.
    
    Returns:
        Dict mapping problem_id -> uri
    """
    mappings = {}
    
    for competition in competition_dict:
        start_year = competition["start"]
        end_year = competition["end"]
        levels = competition["levels"]
        
        for year in range(start_year, end_year + 1):
            for level_config in levels:
                level = level_config["level"]
                suffix = level_config["suffix"]
                
                # Generate problem IDs for this competition (typically 25 problems)
                for problem_num in range(1, 26):  # AMC problems are numbered 1-25
                    
                    # Construct problem ID
                    if suffix:
                        problem_id = f"amc_{year}_{level}{suffix.lower()}_{problem_num}"
                    else:
                        problem_id = f"amc_{year}_{level}_{problem_num}"
                    
                    # Construct AoPS wiki URI
                    if suffix:
                        uri = f"https://artofproblemsolving.com/wiki/index.php/{year}_AMC_{level}{suffix}_Problems/Problem_{problem_num}"
                    else:
                        uri = f"https://artofproblemsolving.com/wiki/index.php/{year}_AMC_{level}_Problems/Problem_{problem_num}"
                    
                    mappings[problem_id] = uri
    
    return mappings

def save_mappings(mappings: Dict[str, str], output_file: str):
    """Save the mappings to a JSON file."""
    with open(output_file, 'w') as f:
        json.dump(mappings, f, indent=2)

def print_sample_mappings(mappings: Dict[str, str], num_samples: int = 10):
    """Print a sample of the mappings for verification."""
    print(f"Generated {len(mappings)} problem mappings")
    print("\nSample mappings:")
    print("-" * 80)
    
    for i, (problem_id, uri) in enumerate(mappings.items()):
        if i >= num_samples:
            break
        print(f"{problem_id} -> {uri}")

def main():
    # Path to the competition dictionary
    competition_dict_path = "competition_dict_for_image_size.json"
    
    # Load the competition dictionary
    competition_dict = load_competition_dict(competition_dict_path)
    
    # Generate mappings
    mappings = generate_problem_mappings(competition_dict)
    
    # Save mappings to file
    output_file = "problem_to_uri_mappings.json"
    save_mappings(mappings, output_file)
    
    # Print sample mappings for verification
    print_sample_mappings(mappings)
    
    print(f"\nMappings saved to: {output_file}")
    print(f"Total mappings generated: {len(mappings)}")

if __name__ == "__main__":
    main() 