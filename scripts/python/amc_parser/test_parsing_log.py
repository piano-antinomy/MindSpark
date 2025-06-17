#!/usr/bin/env python3
"""
Test script for the parsing log functionality
"""

from amc_parser import AMCParser
import json
import os

def test_parsing_log():
    # Create a small test config with just 2 problems
    test_config = [
        {
            "start": 2023,
            "end": 2023,
            "levels": [
                {
                    "level": "8",
                    "suffix": "",
                    "num_problems": 2
                }
            ]
        }
    ]
    
    # Write test config
    test_config_file = "test_parsing_log.json"
    with open(test_config_file, 'w', encoding='utf-8') as f:
        json.dump(test_config, f, indent=2)
    
    print("=== Testing Parsing Log Functionality ===")
    
    try:
        parser = AMCParser(test_config_file)
        competition = parser.competitions[0]
        
        print(f"Testing with competition: {parser._get_competition_id(competition)}")
        
        # Parse the competition (this should create the parsing log)
        results = parser.parse_competition(competition)
        
        print(f"\nParsed {len(results)} problems")
        
        # Check if parsing log was created
        comp_name = parser._get_competition_name(competition)
        log_file = f"parsing_log/{comp_name}.json"
        
        if os.path.exists(log_file):
            print(f"✓ Parsing log created: {log_file}")
            
            # Read and display log content
            with open(log_file, 'r', encoding='utf-8') as f:
                log_data = json.load(f)
            
            print("\n📝 Parsing Log Summary:")
            print(f"  Competition: {log_data['competition_info']['name']}")
            print(f"  Total expected: {log_data['competition_info']['total_problems_expected']}")
            print(f"  Successful: {log_data['summary']['successful']}")
            print(f"  Failed: {log_data['summary']['failed']}")
            print(f"  Skipped: {log_data['summary']['skipped']}")
            
            print("\n📋 Problem Details:")
            for result in log_data['parsing_results']:
                status_icon = "✓" if result['status'] == 'success' else "✗" if result['status'] == 'failed' else "⚠"
                print(f"  {status_icon} Problem {result['problem_number']}: {result['status']}")
                if result['error_message']:
                    print(f"    Error: {result['error_message']}")
        else:
            print(f"✗ Parsing log not found: {log_file}")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up
        if os.path.exists(test_config_file):
            os.remove(test_config_file)
            print(f"\nCleaned up: {test_config_file}")

if __name__ == "__main__":
    test_parsing_log() 