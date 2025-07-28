#!/usr/bin/env python3
"""
Script to scrape AoPS wiki pages and extract image dimensions for PNG images.
Updates the problem JSON files with width and height information.
Uses competition_dict_for_image_size.json as input.
"""

import json
import requests
from bs4 import BeautifulSoup
import time
import os
from typing import Dict, List, Optional, Tuple
import re
from urllib.parse import urljoin

def load_competition_dict(file_path: str) -> List[Dict]:
    """Load the competition dictionary from JSON file."""
    with open(file_path, 'r') as f:
        return json.load(f)



def load_problem_json(json_file: str) -> Dict:
    """Load a problem JSON file."""
    with open(json_file, 'r') as f:
        return json.load(f)

def save_problem_json(data: Dict, json_file: str):
    """Save a problem JSON file."""
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=2)

def extract_image_dimensions_from_page(uri: str) -> Dict[str, Dict[str, str]]:
    """
    Scrape a webpage and extract image dimensions for PNG images.
    
    Returns:
        Dict mapping image URL -> {"width": str, "height": str}
    """
    try:
        # Add protocol if missing
        if uri.startswith('//'):
            uri = 'https:' + uri
        
        print(f"Scraping: {uri}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(uri, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all img tags with PNG sources
        img_dimensions = {}
        
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src.endswith('.png'):
                # Normalize the URL
                if src.startswith('//'):
                    src_full = 'https:' + src
                    src_relative = src  # Keep the relative version too
                elif src.startswith('/'):
                    src_full = urljoin(uri, src)
                    src_relative = src
                else:
                    src_full = src
                    src_relative = src
                
                width = img.get('width', '')
                height = img.get('height', '')
                
                if width and height:
                    # Store both versions to match against
                    img_dimensions[src_full] = {
                        "width": str(width),
                        "height": str(height)
                    }
                    img_dimensions[src_relative] = {
                        "width": str(width),
                        "height": str(height)
                    }
        
        return img_dimensions
        
    except Exception as e:
        print(f"Error scraping {uri}: {e}")
        return {}

def find_png_images_in_problem(problem_data: Dict) -> List[str]:
    """
    Extract all PNG image URLs from a problem's insertions.
    
    Returns:
        List of PNG image URLs
    """
    png_images = []
    
    # Check question insertions
    if 'question' in problem_data and 'insertions' in problem_data['question']:
        for insertion in problem_data['question']['insertions'].values():
            if 'picture' in insertion and insertion['picture'].endswith('.png'):
                png_images.append(insertion['picture'])
    
    # Check solution insertions
    if 'solutions' in problem_data:
        for solution in problem_data['solutions']:
            if 'insertions' in solution:
                for insertion in solution['insertions'].values():
                    if 'picture' in insertion and insertion['picture'].endswith('.png'):
                        png_images.append(insertion['picture'])
    
    return list(set(png_images))  # Remove duplicates

def update_problem_with_dimensions(problem_data: Dict, image_dimensions: Dict[str, Dict[str, str]], problem_id: str):
    """
    Update a problem's insertions and picture_choices with width and height information.
    """
    # Update question insertions
    if 'question' in problem_data and 'insertions' in problem_data['question']:
        for insertion_key, insertion in problem_data['question']['insertions'].items():
            if 'picture' in insertion and insertion['picture'].endswith('.png'):
                img_url = insertion['picture']
                if img_url in image_dimensions:
                    insertion.update(image_dimensions[img_url])
                else:
                    print(f"Warning: Image {img_url} not found on webpage for problem {problem_id}")
    
    # Update picture_choices
    if 'question' in problem_data and 'picture_choices' in problem_data['question']:
        updated_choices = []
        for choice in problem_data['question']['picture_choices']:
            if isinstance(choice, str) and choice.endswith('.png'):
                if choice in image_dimensions:
                    updated_choices.append({
                        "uri": choice,
                        "width": image_dimensions[choice]["width"],
                        "height": image_dimensions[choice]["height"]
                    })
                else:
                    print(f"Warning: Picture choice {choice} not found on webpage for problem {problem_id}")
                    updated_choices.append({
                        "uri": choice,
                        "width": "",
                        "height": ""
                    })
            else:
                # Keep non-string or non-png choices as is
                updated_choices.append(choice)
        problem_data['question']['picture_choices'] = updated_choices
    
    # Update solution insertions
    if 'solutions' in problem_data:
        for solution in problem_data['solutions']:
            if 'insertions' in solution:
                for insertion_key, insertion in solution['insertions'].items():
                    if 'picture' in insertion and insertion['picture'].endswith('.png'):
                        img_url = insertion['picture']
                        if img_url in image_dimensions:
                            insertion.update(image_dimensions[img_url])
                        else:
                            print(f"Warning: Image {img_url} not found on webpage for problem {problem_id}")

def process_problem_file(json_file: str, competition_dict: List[Dict]):
    """
    Process a single problem JSON file to add image dimensions.
    """
    # Extract year and level from filename
    filename = os.path.basename(json_file)
    # Expected format: YYYY_AMC_LEVEL.json or YYYY_AMC_LEVEL_SUFFIX.json
    match = re.match(r'(\d{4})_AMC_(\d+)([AB])?\.json', filename)
    if not match:
        return
    
    year = int(match.group(1))
    level = match.group(2)
    suffix = match.group(3) if match.group(3) else ""
    
    # Load the problem data
    problem_data = load_problem_json(json_file)
    
    # Get the problem ID from the first problem
    if 'problems' in problem_data and len(problem_data['problems']) > 0:
        problem_id = problem_data['problems'][0]['id']
        
        # Extract image dimensions from all problem webpages
        all_image_dimensions = {}
        
        for problem in problem_data['problems']:
            problem_num = problem['id'].split('_')[-1]  # Extract problem number from ID
            
            # Generate the URI for this specific problem
            if suffix:
                uri = f"https://artofproblemsolving.com/wiki/index.php/{year}_AMC_{level}{suffix}_Problems/Problem_{problem_num}"
            else:
                uri = f"https://artofproblemsolving.com/wiki/index.php/{year}_AMC_{level}_Problems/Problem_{problem_num}"
            
            print(f"Processing {problem['id']} -> {uri}")
            
            # Extract image dimensions from the webpage
            image_dimensions = extract_image_dimensions_from_page(uri)
            
            if image_dimensions:
                print(f"Found {len(image_dimensions)} images with dimensions")
                all_image_dimensions.update(image_dimensions)
            else:
                print(f"No image dimensions found for {problem['id']}")
        
        if all_image_dimensions:
            print(f"Total unique images found: {len(all_image_dimensions)}")
            
            # Update each problem in the file
            for problem in problem_data['problems']:
                update_problem_with_dimensions(problem, all_image_dimensions, problem['id'])
            
            # Save the updated file
            save_problem_json(problem_data, json_file)
            print(f"Updated {json_file}")
        else:
            print(f"No image dimensions found for any problem in {json_file}")
    
    # Add delay to be respectful to the server
    time.sleep(1)

def main():
    """Main function to process all problem files."""
    
    # Load competition dictionary
    competition_dict_file = "competition_dict_for_image_size.json"
    if not os.path.exists(competition_dict_file):
        print(f"Error: {competition_dict_file} not found.")
        return
    
    competition_dict = load_competition_dict(competition_dict_file)
    print(f"Loaded competition dictionary with {len(competition_dict)} competition ranges")
    
    # Define the directory containing problem JSON files
    problems_dir = "../../../backend-java/resources/math/questions"
    
    # Process files based on competition dictionary
    for competition in competition_dict:
        start_year = competition["start"]
        end_year = competition["end"]
        levels = competition["levels"]
        
        for year in range(start_year, end_year + 1):
            for level_config in levels:
                level = level_config["level"]
                suffix = level_config["suffix"]
                
                # Determine the directory based on level
                if level == "8":
                    level_dir = "AMC_8"
                elif level == "10":
                    level_dir = "AMC_10"
                elif level == "12":
                    level_dir = "AMC_12"
                else:
                    continue
                
                # Construct the expected filename
                if suffix:
                    filename = f"{year}_AMC_{level}{suffix}.json"
                else:
                    filename = f"{year}_AMC_{level}.json"
                
                # Check if the file exists
                json_file = os.path.join(problems_dir, level_dir, filename)
                if os.path.exists(json_file):
                    print(f"\nProcessing: {json_file}")
                    process_problem_file(json_file, competition_dict)
                else:
                    print(f"File not found: {json_file}")

if __name__ == "__main__":
    main() 