#!/usr/bin/env python3
from amc_parser import AMCParser

# Test the specific problem that was failing
competition = {
    'year': 2017,
    'level': '10A',
    'suffix': '',
    'fall_version': False,
    'num_problems': 25,
    'group': 'AMC_10',
    'problem_number_override': None
}

parser = AMCParser("small_competition_dict.json")

try:
    problem_data = parser.parse_problem(competition, 23)
    print("SUCCESS!")
    print(f"Answer: {problem_data['answer']}")
    print(f"Question type: {problem_data['question']['type']}")
    print(f"Number of solutions: {len(problem_data['solutions'])}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc() 