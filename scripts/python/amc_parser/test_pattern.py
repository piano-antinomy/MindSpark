#!/usr/bin/env python3
import re

# Test the answer patterns from 2017 AMC 10A Problems
text1 = r'$\boxed{(\textbf{B})\ 14}$'  # Problem 4
text2 = r'$2300-120-16-4-12=\boxed{(\textbf{B})\ 2148}$'  # Problem 23

print(f"Testing text1: {text1}")
print(f"Testing text2: {text2}")

# Test our current patterns
patterns = [
    r'\\boxed{\\mathrm{\(([A-E])\)[^}]*}',
    r'\\boxed\{\\textbf\{\(([A-E])\)',
    r'\\boxed\{\\textbf\{([A-E])',
    r'\\boxed\{\\text\{\(([A-E])\)',
    r'\\boxed\{\\text\{([A-E])',
    r'\\boxed\s*\{\\text\s*\{\(([A-E])\)[^}]*\}',
    r'\\boxed\{\(\\textbf\{([A-E])\}\)}',
    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',
    r'\\boxed\{\\text\{\(\\textbf\s*([A-E])\s*\)[^}]*\}',
    r'\\boxed\{\\text\{\(\\textbf\{([A-E])\}\)[^}]*\}',
    r'\\boxed\{\\textbf\s*([A-E])\s*\}',
    r'\\boxed\{\(\\textbf\{([A-E])\}\)[^}]*\}',  # \boxed{(\textbf{B})\ 14} - new pattern for 2017 AMC 10A Problem 4
    r'\\framebox\{([A-E])\}',
    r'\\boxed\{([A-E])\([^}]*\)\}',
]

for text in [text1, text2]:
    print(f"\nTesting: {text}")
    for i, pattern in enumerate(patterns, 1):
        match = re.search(pattern, text)
        if match:
            print(f"Pattern {i} MATCHED: {pattern}")
            print(f"  Answer: {match.group(1)}")
            break
    else:
        print("No pattern matched!") 