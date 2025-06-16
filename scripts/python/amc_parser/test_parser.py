#!/usr/bin/env python3
"""
Test script for the modified AMC parser
Tests the new directory structure and file organization
"""

from amc_parser import AMCParser
import os

def test_parser():
    # Test with a very small subset - just 1 problem each
    test_competitions = [
        {'year': 2023, 'level': '8', 'suffix': '', 'fall_version': False, 'num_problems': 1, 'group': 'AMC_8'},
        {'year': 1990, 'is_AJHSME': True, 'fall_version': False, 'num_problems': 1, 'group': 'AMC_8'}
    ]
    
    print("=== Testing AMC Parser with Small Subset ===")
    parser = AMCParser(test_competitions)
    
    print(f"Test competitions to process: {len(parser.competitions)}")
    for i, comp in enumerate(parser.competitions):
        comp_id = parser._get_competition_id(comp)
        comp_name = parser._get_competition_name(comp)
        print(f"  {i+1}. {comp_id} -> {comp_name} (Group: {comp['group']})")
    
    print("\nStarting test parsing...")
    
    try:
        saved_files, total_problems = parser.parse_all_competitions()
        
        print(f"\n=== Test Results ===")
        print(f"Files saved: {len(saved_files)}")
        print(f"Total problems: {total_problems}")
        
        print("\nSaved files:")
        for file_path in saved_files:
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"  ✓ {file_path} ({file_size} bytes)")
            else:
                print(f"  ✗ {file_path} (not found)")
        
        # Check directory structure
        base_dir = "../../../../backend-java/questions/AMC"
        if os.path.exists(base_dir):
            print(f"\nDirectory structure under {base_dir}:")
            for root, dirs, files in os.walk(base_dir):
                level = root.replace(base_dir, '').count(os.sep)
                indent = ' ' * 2 * level
                print(f"{indent}{os.path.basename(root)}/")
                subindent = ' ' * 2 * (level + 1)
                for file in files:
                    print(f"{subindent}{file}")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_parser() 