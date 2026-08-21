#!/usr/bin/env python3
"""
Parse a locally-saved AoPS "<YEAR> AMC <LEVEL><SUFFIX> Problems" combined page
into the competition JSON format used under backend-java/resources/math/questions/.

AoPS returns 403 to scripted requests, so amc_parser.py's network path is
unusable. This driver reuses AMCParser's extraction logic on local HTML:
the combined page is split at each "Problem N" h2 into a synthetic
single-problem document, which is exactly the shape
extract_question_and_choices() expects.

Image dimensions are read from the inline width/height attributes on the
saved page, so no scraping pass (extract_image_dimensions.py) is needed.

The combined Problems page carries no solutions and no answer key, so
`answer` and `solutions` are left empty for a later pass to fill in.
"""

import argparse
import json
import os
import re

from bs4 import BeautifulSoup, Tag

from amc_parser import AMCParser


def build_dimension_map(soup):
    """Map every image src on the page to its inline width/height attributes."""
    dimensions = {}
    for img in soup.find_all('img'):
        src = img.get('src', '')
        width = img.get('width', '')
        height = img.get('height', '')
        if src and width and height:
            dimensions[src] = {"width": str(width), "height": str(height)}
    return dimensions


def split_into_problems(soup):
    """
    Split the combined Problems page into one synthetic document per problem.

    Returns a list of (problem_number, soup) pairs. Each synthetic document is
    a mw-parser-output div holding the problem's h2 plus every element up to
    the next h2, which lets AMCParser's Strategy 1 collection work unchanged.
    """
    problems = []

    for h2 in soup.find_all('h2'):
        headline = h2.find('span', class_='mw-headline')
        if not headline:
            continue

        match = re.fullmatch(r'Problem_(\d+)', headline.get('id', ''))
        if not match:
            continue  # skips See_Also and any non-problem section

        problem_number = int(match.group(1))

        wrapper = Tag(name='div')
        wrapper['class'] = 'mw-parser-output'
        wrapper.append(h2.__copy__())

        current = h2.next_sibling
        while current is not None and getattr(current, 'name', None) != 'h2':
            if isinstance(current, Tag):
                wrapper.append(current.__copy__())
            current = current.next_sibling

        strip_solution_links(wrapper)

        problem_soup = BeautifulSoup('', 'html.parser')
        problem_soup.append(wrapper)
        problems.append((problem_number, problem_soup))

    return problems


SOLUTION_LINK_RE = re.compile(r'^Solutions?(\s*\d+)?$', re.IGNORECASE)


def strip_solution_links(wrapper):
    """
    Drop paragraphs that are nothing but a "Solution" link to the per-problem page.

    The combined Problems page ends every problem with such a paragraph. The
    individual problem pages amc_parser.py was written against do not, so
    _separate_question_and_choices() has no rule for it and would otherwise
    fold the link into the question text.

    Returns the number of paragraphs removed.
    """
    removed = 0
    for p in list(wrapper.find_all('p')):
        anchors = p.find_all('a')
        if not anchors:
            continue
        # Only strip when the paragraph's entire visible text is the link text
        # and that text reads as a solution pointer.
        if p.get_text(strip=True) != ''.join(a.get_text(strip=True) for a in anchors):
            continue
        if not all(SOLUTION_LINK_RE.match(a.get_text(strip=True)) for a in anchors):
            continue
        if p.find_all('img'):
            continue  # never discard a paragraph carrying content
        p.decompose()
        removed += 1
    return removed


def apply_dimensions(insertions, dimensions, problem_id, missing):
    """Attach width/height to each insertion, matching extract_image_dimensions.py."""
    for key, insertion in insertions.items():
        picture = insertion.get('picture', '')
        if not picture.endswith('.png'):
            continue
        if picture in dimensions:
            insertion.update(dimensions[picture])
        else:
            missing.append(f"{problem_id} insertion {key}: {picture}")


def convert_picture_choices(picture_choices, dimensions, problem_id, missing):
    """Turn bare src strings into {uri, width, height} objects."""
    converted = []
    for choice in picture_choices:
        if isinstance(choice, str) and choice.endswith('.png'):
            dims = dimensions.get(choice)
            if dims:
                converted.append({
                    "uri": choice,
                    "width": dims["width"],
                    "height": dims["height"],
                })
            else:
                missing.append(f"{problem_id} picture_choice: {choice}")
                converted.append({"uri": choice, "width": "", "height": ""})
        else:
            converted.append(choice)
    return converted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', default='to_be_parsed.html')
    ap.add_argument('--year', type=int, required=True)
    ap.add_argument('--level', required=True, help='e.g. 10')
    ap.add_argument('--suffix', default='', help='e.g. A')
    ap.add_argument('--expected-problems', type=int, default=25)
    ap.add_argument('--out', required=True, help='Output JSON path')
    args = ap.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = args.html if os.path.isabs(args.html) else os.path.join(script_dir, args.html)

    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    if not html.strip():
        raise SystemExit(f"{html_path} is empty - nothing to parse")

    soup = BeautifulSoup(html, 'html.parser')

    # Restrict to the wiki content area so the site chrome (nav, footer, logos)
    # cannot contribute stray images or paragraphs.
    content = soup.find('div', class_='mw-parser-output') or soup
    dimensions = build_dimension_map(soup)

    # use_answer_sheets=False: no network, and this page has no answer key anyway.
    parser = AMCParser(competition_dict_file="small_competition_dict.json",
                       use_answer_sheets=False)

    competition = {
        'year': args.year,
        'level': args.level,
        'suffix': args.suffix,
        'fall_version': False,
        'num_problems': args.expected_problems,
        'group': f"AMC_{args.level}",
        'problem_number_override': None,
    }

    problems = []
    failures = []
    missing_dimensions = []

    for problem_number, problem_soup in split_into_problems(content):
        problem_id = parser._generate_problem_id(competition, problem_number)

        question_text, insertions, choices = parser.extract_question_and_choices(problem_soup)

        if not question_text:
            failures.append(f"Problem {problem_number}: no question text extracted")
            continue

        has_choices = any([
            choices['text_choices'], choices['picture_choices'],
            choices['latex_choices'], choices['asy_choices'],
        ])
        if not has_choices:
            failures.append(f"Problem {problem_number}: no multiple-choice options extracted")

        apply_dimensions(insertions, dimensions, problem_id, missing_dimensions)
        choices['picture_choices'] = convert_picture_choices(
            choices['picture_choices'], dimensions, problem_id, missing_dimensions)

        problems.append({
            'id': problem_id,
            'question': {
                'text': question_text,
                'insertions': insertions,
                'type': 'multiple-choice',
                **choices,
            },
            'tags': [],
            'sources': [],
            'answer': "",
            'solutions': [],
        })

    comp_name = f"{args.year}_AMC_{args.level}{args.suffix}"
    competition_data = {
        "competition_info": {
            "name": comp_name,
            "group": competition['group'],
            "year": args.year,
            "is_AJHSME": False,
            "level": args.level,
            "suffix": args.suffix,
            "fall_version": False,
            "total_problems": len(problems),
            "problem_number_override": None,
        },
        "problems": problems,
    }

    out_path = args.out if os.path.isabs(args.out) else os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(competition_data, f, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(problems)} problems to {out_path}")

    if len(problems) != args.expected_problems:
        print(f"WARNING: expected {args.expected_problems} problems, got {len(problems)}")
    if failures:
        print(f"\n{len(failures)} extraction problem(s):")
        for failure in failures:
            print(f"  - {failure}")
    if missing_dimensions:
        print(f"\n{len(missing_dimensions)} image(s) without dimensions:")
        for entry in missing_dimensions:
            print(f"  - {entry}")


if __name__ == '__main__':
    main()
