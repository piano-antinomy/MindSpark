#!/usr/bin/env python3
"""
Analyze choice lengths in AMC resource JSON files.

Flags choices whose cleaned text length exceeds a threshold.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple


def clean_latex_text(text: str) -> str:
    """Remove common LaTeX wrappers/commands to approximate visible text length."""
    if not text:
        return ""

    cleaned = text

    # Unwrap common text commands first.
    cleaned = re.sub(r"\\text\{([^}]*)\}", r"\1", cleaned)
    cleaned = re.sub(r"\\mathrm\{([^}]*)\}", r"\1", cleaned)
    cleaned = re.sub(r"\\textbf\{([^}]*)\}", r"\1", cleaned)
    cleaned = re.sub(r"\\textit\{([^}]*)\}", r"\1", cleaned)
    cleaned = re.sub(r"\\textsc\{([^}]*)\}", r"\1", cleaned)

    # Remove spacing/display commands.
    cleaned = re.sub(r"\\textdollar", "", cleaned)
    cleaned = re.sub(r"\\qquad|\\quad|\\\\", " ", cleaned)

    # Remove math delimiters.
    cleaned = re.sub(r"\$([^$]*)\$", r"\1", cleaned)
    cleaned = re.sub(r"\\\(([^)]*)\\\)", r"\1", cleaned)
    cleaned = re.sub(r"\\\[([^\]]*)\\\]", r"\1", cleaned)

    # Remove remaining LaTeX commands.
    cleaned = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", cleaned)
    cleaned = re.sub(r"\\[a-zA-Z]+", "", cleaned)

    # Collapse whitespace.
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _strip_choice_label_prefix(choice: str) -> str:
    """
    Remove common AMC label prefixes like (A), \\textbf{(B)}, \\mathrm{(C)}.
    """
    result = choice.strip()
    result = re.sub(
        r"^\\(?:textbf|mathrm|text)\s*\{[^}]*\([A-E]\)[^}]*\}\s*",
        "",
        result,
    )
    result = re.sub(r"^\(?[A-E]\)?[.:]?\s*", "", result)
    return result.strip()


def extract_choices_from_question(problem: Dict) -> List[str]:
    """
    Extract choices following frontend-like priority:
    text_choices > latex_choices > picture_choices.
    """
    q = problem.get("question") or {}
    text_choices = q.get("text_choices") or []
    latex_choices = q.get("latex_choices") or []
    picture_choices = q.get("picture_choices") or []

    if text_choices:
        return [str(c) for c in text_choices]

    if latex_choices:
        if len(latex_choices) == 1:
            single = str(latex_choices[0]).strip()
            # Keep splitting strategy simple but robust enough for AMC format.
            parts = re.split(r"\\qquad|\\quad|\\\\", single)
            parsed: List[str] = []
            for part in parts:
                part = part.strip().strip("$").strip()
                if not part:
                    continue
                parsed.append(_strip_choice_label_prefix(part))
            return parsed if parsed else [single]
        return [str(c) for c in latex_choices]

    if picture_choices:
        # Picture-choice mode normally uses A-E letter options.
        return ["A", "B", "C", "D", "E"]

    return []


def analyze_file(file_path: Path, max_length: int) -> Tuple[List[Dict], str]:
    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    problems = data.get("problems", [])
    group = (data.get("competition_info") or {}).get("group", "unknown")

    results: List[Dict] = []
    for problem in problems:
        qid = problem.get("id", "unknown")
        choices = extract_choices_from_question(problem)

        long_choices = []
        for idx, choice in enumerate(choices):
            cleaned = clean_latex_text(str(choice))
            if len(cleaned) > max_length:
                long_choices.append(
                    {
                        "index": idx,
                        "label": chr(65 + idx) if 0 <= idx < 26 else str(idx),
                        "original": str(choice),
                        "clean_text": cleaned,
                        "length": len(cleaned),
                    }
                )

        if long_choices:
            results.append(
                {
                    "file": str(file_path),
                    "question_id": qid,
                    "group": group,
                    "long_choices": long_choices,
                }
            )

    return results, group


def find_default_questions_dir() -> Path:
    """
    Locate repo root by walking up from this script and return
    <repo>/backend-java/resources/math/questions.
    """
    script = Path(__file__).resolve()
    for parent in script.parents:
        candidate = parent / "backend-java" / "resources" / "math" / "questions"
        if candidate.exists():
            return candidate
    # Fallback for running from repo root manually.
    return Path("backend-java/resources/math/questions")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Analyze AMC choices whose cleaned text length exceeds a threshold."
    )
    parser.add_argument(
        "--questions-dir",
        type=Path,
        default=find_default_questions_dir(),
        help="Path to AMC questions root (default: auto-detected backend-java/resources/math/questions)",
    )
    parser.add_argument(
        "--max-length",
        type=int,
        default=25,
        help="Maximum allowed cleaned choice length (default: 25)",
    )
    parser.add_argument(
        "--limit-results",
        type=int,
        default=0,
        help="If > 0, print only first N flagged questions",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=None,
        help="Optional output path for full JSON report",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    questions_dir = args.questions_dir

    if not questions_dir.exists():
        print(f"Directory not found: {questions_dir}")
        return 1

    json_files = sorted(questions_dir.rglob("*.json"))
    all_results: List[Dict] = []
    by_group: Dict[str, int] = {}

    for json_file in json_files:
        try:
            file_results, _ = analyze_file(json_file, args.max_length)
            all_results.extend(file_results)
        except Exception as exc:
            print(f"Error processing {json_file}: {exc}")

    # Count by group.
    for row in all_results:
        group = row.get("group", "unknown")
        by_group[group] = by_group.get(group, 0) + 1

    # Print summary.
    print("=" * 80)
    print(
        f"FOUND {len(all_results)} QUESTIONS WITH CHOICES LONGER THAN {args.max_length} CHARACTERS"
    )
    print("=" * 80)
    print(f"Scanned JSON files: {len(json_files)}")
    print()

    visible_results = all_results
    if args.limit_results > 0:
        visible_results = all_results[: args.limit_results]
        print(f"Showing first {len(visible_results)} result(s) due to --limit-results")
        print()

    for item in visible_results:
        print(f"Question ID: {item['question_id']}  |  Group: {item['group']}")
        for choice in item["long_choices"]:
            print(f"  Choice {choice['label']}: {choice['length']} chars")
            print(f"    Clean text: {choice['clean_text']}")
            print(f"    Original: {choice['original']}")
        print("-" * 60)

    print("\nSUMMARY:")
    print(f"Total questions with long choices: {len(all_results)}")
    print("By competition group:")
    for group, count in sorted(by_group.items()):
        print(f"  {group}: {count}")

    if args.output_json:
        payload = {
            "questions_dir": str(questions_dir),
            "max_length": args.max_length,
            "scanned_files": len(json_files),
            "total_flagged_questions": len(all_results),
            "by_group": by_group,
            "results": all_results,
        }
        args.output_json.parent.mkdir(parents=True, exist_ok=True)
        args.output_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nWrote JSON report: {args.output_json}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
