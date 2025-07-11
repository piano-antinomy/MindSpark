import json

# Load the 2008 AMC 8 file
with open('backend-java/questions/AMC_processed/AMC_8/2008_AMC_8.json', 'r') as f:
    data = json.load(f)

# Recategorize each problem with careful individual analysis
problems = data['problems']

# Problem 1: Simple arithmetic word problem
problems[0]['categorization'] = [{
    "category": "algebra",
    "sub_category": "basic_operations",
    "confidence": 0.95,
    "reasoning": "Simple arithmetic word problem involving money calculations. The problem requires calculating how much money Susan spent and finding the remaining amount."
}]

# Problem 2: Code substitution and pattern recognition
problems[1]['categorization'] = [{
    "category": "algebra",
    "sub_category": "patterns",
    "confidence": 0.95,
    "reasoning": "Pattern recognition problem involving code substitution. The problem requires understanding that letters represent digits and finding the 4-digit number represented by 'CLUE'."
}]

# Problem 3: Calendar and modular arithmetic
problems[2]['categorization'] = [{
    "category": "number_theory",
    "sub_category": "remainders",
    "confidence": 0.95,
    "reasoning": "Number theory problem involving calendar calculations and modular arithmetic. The problem requires working backwards from February 13 to find what day February 1 falls on."
}]

# Problem 4: Area of geometric figures
problems[3]['categorization'] = [{
    "category": "geometry",
    "sub_category": "area",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving area of triangles and trapezoids. The problem requires finding the area of one trapezoid by dividing the remaining area equally among three congruent trapezoids."
}]

# Problem 5: Rate and distance word problem
problems[4]['categorization'] = [{
    "category": "algebra",
    "sub_category": "rates",
    "confidence": 0.95,
    "reasoning": "Rate and distance word problem involving average speed. The problem requires calculating the total distance traveled and total time to find the average speed."
}]

# Problem 6: Area ratio of geometric figures
problems[5]['categorization'] = [{
    "category": "geometry",
    "sub_category": "area",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving area ratio of gray squares to white squares. The problem requires counting the number of gray and white tiles to find their ratio."
}]

# Problem 7: Fraction equations
problems[6]['categorization'] = [{
    "category": "algebra",
    "sub_category": "fractions",
    "confidence": 0.95,
    "reasoning": "Fraction equation problem involving solving for variables. The problem requires setting up and solving two separate equations to find M and N."
}]

# Problem 8: Data analysis and averages
problems[7]['categorization'] = [{
    "category": "algebra",
    "sub_category": "basic_operations",
    "confidence": 0.95,
    "reasoning": "Data analysis problem involving reading a bar graph and calculating averages. The problem requires interpreting the bar graph to find total sales and calculating the average per month."
}]

# Problem 9: Percentage word problem
problems[8]['categorization'] = [{
    "category": "algebra",
    "sub_category": "percentages",
    "confidence": 0.95,
    "reasoning": "Percentage word problem involving investment gains and losses. The problem requires calculating the final value after a loss followed by a gain and finding the overall percentage change."
}]

# Problem 10: Average calculation
problems[9]['categorization'] = [{
    "category": "algebra",
    "sub_category": "basic_operations",
    "confidence": 0.95,
    "reasoning": "Average calculation problem involving combining two groups. The problem requires finding the weighted average of two groups with different average ages."
}]

# Problem 11: Set theory with Venn diagrams
problems[10]['categorization'] = [{
    "category": "algebra",
    "sub_category": "basic_operations",
    "confidence": 0.95,
    "reasoning": "Set theory problem involving Venn diagrams and intersection. The problem requires using the formula for union of two sets to find the number of students with both a dog and a cat."
}]

# Problem 12: Geometric sequence
problems[11]['categorization'] = [{
    "category": "algebra",
    "sub_category": "sequences_patterns",
    "confidence": 0.95,
    "reasoning": "Geometric sequence problem involving bouncing ball heights. The problem requires calculating successive terms of a geometric sequence to find when the height drops below a certain threshold."
}]

# Problem 13: System of equations
problems[12]['categorization'] = [{
    "category": "algebra",
    "sub_category": "systems_of_equations",
    "confidence": 0.95,
    "reasoning": "System of equations problem involving weights of boxes. The problem requires setting up equations for the pairwise weights and solving for the individual box weights."
}]

# Problem 14: Combinatorics with constraints
problems[13]['categorization'] = [{
    "category": "combinatorics",
    "sub_category": "counting",
    "confidence": 0.95,
    "reasoning": "Combinatorics problem involving counting arrangements with constraints. The problem requires counting the number of ways to place letters in a grid so each row and column contains one of each letter."
}]

# Problem 15: Number theory with divisibility
problems[14]['categorization'] = [{
    "category": "number_theory",
    "sub_category": "divisibility",
    "confidence": 0.95,
    "reasoning": "Number theory problem involving divisibility and averages. The problem requires finding scores that make the average an integer for both 9 and 10 games."
}]

# Problem 16: Volume and surface area
problems[15]['categorization'] = [{
    "category": "geometry",
    "sub_category": "volume",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving volume and surface area of 3D shapes. The problem requires calculating the volume and surface area of a shape made from unit cubes and finding their ratio."
}]

# Problem 17: Area optimization
problems[16]['categorization'] = [{
    "category": "geometry",
    "sub_category": "area",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving area optimization of rectangles. The problem requires finding the maximum and minimum possible areas of rectangles with a given perimeter."
}]

# Problem 19: Probability with geometry
problems[18]['categorization'] = [{
    "category": "probability",
    "sub_category": "independent_events",
    "confidence": 0.95,
    "reasoning": "Probability problem involving geometric points and distance. The problem requires calculating the probability that two randomly chosen points are one unit apart."
}]

# Problem 20: Fraction word problem
problems[19]['categorization'] = [{
    "category": "algebra",
    "sub_category": "fractions",
    "confidence": 0.95,
    "reasoning": "Fraction word problem involving ratios and proportions. The problem requires setting up equations to find the minimum number of students given passing rates for boys and girls."
}]

# Problem 21: Volume of geometric solid
problems[20]['categorization'] = [{
    "category": "geometry",
    "sub_category": "volume",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving volume of a cylinder wedge. The problem requires calculating the volume of a wedge cut from a cylinder."
}]

# Problem 22: Number theory with inequalities
problems[21]['categorization'] = [{
    "category": "number_theory",
    "sub_category": "divisibility",
    "confidence": 0.95,
    "reasoning": "Number theory problem involving divisibility and inequalities. The problem requires finding positive integers n where both n/3 and 3n are three-digit numbers."
}]

# Problem 23: Area ratio of triangle to square
problems[22]['categorization'] = [{
    "category": "geometry",
    "sub_category": "area",
    "confidence": 0.95,
    "reasoning": "Geometry problem involving area ratio of a triangle to a square. The problem requires calculating the area of triangle BFD and finding its ratio to the area of the square."
}]

# Problem 24: Probability with products
problems[23]['categorization'] = [{
    "category": "probability",
    "sub_category": "independent_events",
    "confidence": 0.95,
    "reasoning": "Probability problem involving products and perfect squares. The problem requires finding the probability that the product of a tile number and die roll is a perfect square."
}]

# Save the updated file
with open('backend-java/questions/AMC_processed/AMC_8/2008_AMC_8.json', 'w') as f:
    json.dump(data, f, indent=2)

print("2008 AMC 8 categorization completed successfully!") 