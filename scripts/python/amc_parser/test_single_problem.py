#!/usr/bin/env python3
"""
Test script to run image dimension extraction on a single problem file.
"""

import json
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin

def test_single_problem():
    """Test the image dimension extraction on a single problem."""
    
    # Test with the specific example from the user: 2020 AMC 8 Problem 22
    problem_id = "amc_2020_8_22"
    uri = "https://artofproblemsolving.com/wiki/index.php/2020_AMC_8_Problems/Problem_22"
    
    print(f"Testing with problem: {problem_id}")
    print(f"URI: {uri}")
    print("-" * 80)
    
    try:
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
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = urljoin(uri, src)
                
                width = img.get('width', '')
                height = img.get('height', '')
                
                print(f"Found image: {src}")
                print(f"  Width: {width}, Height: {height}")
                
                if width and height:
                    img_dimensions[src] = {
                        "width": str(width),
                        "height": str(height)
                    }
        
        print(f"\nTotal images with dimensions: {len(img_dimensions)}")
        
        # Show the specific image mentioned in the user's example
        target_image = "//latex.artofproblemsolving.com/e/8/7/e878d1d4459a47247d03d903a46441e85ec0a503.png"
        target_image_full = "https:" + target_image
        
        if target_image_full in img_dimensions:
            print(f"\n✓ Found target image: {target_image}")
            print(f"  Dimensions: {img_dimensions[target_image_full]}")
        else:
            print(f"\n✗ Target image not found: {target_image}")
        
        return img_dimensions
        
    except Exception as e:
        print(f"Error: {e}")
        return {}

if __name__ == "__main__":
    test_single_problem() 