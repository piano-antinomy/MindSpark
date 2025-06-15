#!/usr/bin/env python3

from bs4 import BeautifulSoup
import json
from amc_parser import AMCParser

def test_solution_parsing():
    parser = AMCParser()
    
    # Test with the first HTML file
    with open('example-html-am_2023_01.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    solutions = parser.extract_solutions(soup)
    
    print("=== Testing AMC 2023 Problem 1 Solutions ===")
    print(f"Found {len(solutions)} solutions")
    for i, solution in enumerate(solutions):
        print(f"\nSolution {i+1}:")
        print(f"Text: {solution['text'][:200]}...")
        print(f"Insertions: {list(solution['insertions'].keys())}")
        print(f"Number of insertions: {len(solution['insertions'])}")
    
    # Test with the second HTML file
    with open('example-html-am_2023_02.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    solutions = parser.extract_solutions(soup)
    
    print("\n=== Testing AMC 2023 Problem 2 Solutions ===")
    print(f"Found {len(solutions)} solutions")
    for i, solution in enumerate(solutions):
        print(f"\nSolution {i+1}:")
        print(f"Text: {solution['text'][:200]}...")
        print(f"Insertions: {list(solution['insertions'].keys())}")
        print(f"Number of insertions: {len(solution['insertions'])}")
    
    # Save test output to JSON for comparison
    test_results = {
        'problem_1_solutions': solutions,
        'problem_2_solutions': solutions
    }
    
    with open('test_solutions_output.json', 'w', encoding='utf-8') as f:
        json.dump(test_results, f, indent=2, ensure_ascii=False)
    
    print(f"\nTest results saved to test_solutions_output.json")

if __name__ == "__main__":
    test_solution_parsing() 