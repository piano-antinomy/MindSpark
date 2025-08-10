#!/usr/bin/env python3
"""
Script to update specific solution text with paraphrased version.
"""

import json


def update_solution_text():
    """Update the specific solution text with paraphrased version."""
    
    # Read the JSON file
    with open('backend-java/resources/math/questions/AMC_8/2025_AMC_8.json', 
              'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Find and update the specific solution text
    for problem in data.get('problems', []):
        if problem.get('id') == 'amc_2025_8_12':  # This is problem 12
            for solution in problem.get('solutions', []):
                if 'largest circle that can fit inside the figure' in solution.get('text', ''):
                    # Update with paraphrased version
                    paraphrased_text = (
                        "<p>To find the largest possible circle that fits within the given "
                        "figure, we place its center at the middle of the figure. This circle "
                        "will touch the figure's boundary at exactly 8 points. Using the "
                        "Pythagorean Theorem, we can calculate the radius as the distance "
                        "from the center to any of these tangent points: "
                        "$\\sqrt{2^2 + 1^2} = \\sqrt5$. Therefore, the area of this circle "
                        "is $\\pi \\sqrt{5}^2 = \\boxed{\\textbf{(C)} 5\\pi}$.</p><p>~Soupboy0</p>"
                    )
                    solution['text'] = paraphrased_text
                    print("Updated solution text for problem 12")
                    break
    
    # Write the updated JSON file
    with open('backend-java/resources/math/questions/AMC_8/2025_AMC_8.json', 
              'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("JSON file updated successfully!")


if __name__ == "__main__":
    update_solution_text() 