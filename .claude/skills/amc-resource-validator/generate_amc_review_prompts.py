#!/usr/bin/env python3
"""Create one model-review prompt per AMC problem after browser rendering."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from render_amc_resources import build_payload
from validate_amc_resources import find_repo_root, strip_html


REVIEW_RUBRIC = """Review this one AMC problem using the rendered content and its browser screenshots.
Return JSON with `verdict` (`pass`, `needs_review`, or `fail`) and a `findings` array. Every finding must
name the exact issue and cite the affected question, choice letter, or solution number. Judge:
1. Whether the question is complete, understandable, and has no visibly malformed or unrendered content.
2. Whether there are exactly five usable choices, labeled A-E, rendered and formatted correctly.
3. Whether the declared answer is the single mathematically correct choice.
4. Whether the first solution is mathematically sound, supports the declared answer, and renders its prose and math correctly.
5. Whether the first solution includes contributor attribution or signature text unrelated to the mathematical explanation,
   such as "Solution by Name", "~Name", a username, or an author link. Report each as a `contributor-info` finding
   and set the verdict to at least `needs_review`, because the solution is not clean instructional content.
For every `contributor-info` finding, include the exact contributor text as `contributor_text` and propose removal,
but do not edit the resource. For an incorrect declared answer, include `proposed_answer`, the matching choice value,
and concise mathematical evidence. Do not edit the resource until the user explicitly confirms the specific removal
or answer change. Do not infer correctness from the declared answer alone. If the evidence is insufficient, use
`needs_review`."""

SOLUTION_REWRITE_RUBRIC = """When asked to improve a solution, independently solve the question and produce
`proposed_first_solution`. It must be concise, clear, mathematically sufficient, and conclude with the selected
choice. Do not skip necessary logical or computational steps: state the justification for every derived value.
You may use an existing solution only as a source of ideas: independently verify it and fully reword it.
Do not copy prose, retain contributor credits or signatures, use gap-filler or buzzwords, or repeat concepts and
terms unnecessarily. Return the derivation supporting the proposed answer. Do not edit the resource unless the
user explicitly confirms this exact proposed solution; after confirmation, insert it as `solutions[0]` and retain
the existing solutions after it."""


def plain_text(value: Any) -> str:
    return strip_html(str(value)).replace("\\$", "$").strip()


def build_review_item(problem: dict[str, Any], index: int, repo_root: Path, render_dir: Path) -> dict[str, Any]:
    payload = build_payload(problem, repo_root)
    choices = [
        {"letter": chr(ord("A") + choice_index), "content": plain_text(choice)}
        for choice_index, choice in enumerate(payload["choices"])
    ]
    prefix = f"q{index + 1}"
    screenshots = sorted(str(path) for path in render_dir.glob(f"*-{prefix}-*.png"))
    return {
        "problem_number": index + 1,
        "problem_id": payload["id"],
        "review_rubric": REVIEW_RUBRIC,
        "solution_rewrite_rubric": SOLUTION_REWRITE_RUBRIC,
        "question": plain_text(payload["questionText"]),
        "choices": choices,
        "declared_answer": payload["answer"],
        "solutions": [{"number": solution_index + 1, "content": plain_text(solution)} for solution_index, solution in enumerate(payload["solutions"])],
        "browser_screenshots": screenshots,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate structured Copilot review prompts for AMC problems.")
    parser.add_argument("path", help="AMC JSON file to review")
    parser.add_argument("--render-dir", required=True, help="Render artifact directory created by render_amc_resources.py")
    parser.add_argument("--output", required=True, help="Path for the JSON review-prompt file")
    parser.add_argument("--start", type=int, default=1, help="First one-based problem number to include")
    parser.add_argument("--count", type=int, default=3, help="Number of consecutive problems to include")
    args = parser.parse_args()

    repo_root = find_repo_root(Path(__file__).parent)
    path = Path(args.path)
    if not path.is_absolute():
        path = (repo_root / path).resolve()
    problem_set = json.loads(path.read_text(encoding="utf-8"))
    problems = problem_set.get("problems", [])
    start_index = max(args.start - 1, 0)
    selected = problems[start_index : start_index + args.count]
    if len(selected) != args.count:
        raise SystemExit(f"Requested {args.count} problems starting at {args.start}, but file has {len(problems)} problems.")

    render_dir = Path(args.render_dir).resolve()
    review_items = [
        build_review_item(problem, start_index + offset, repo_root, render_dir)
        for offset, problem in enumerate(selected)
        if isinstance(problem, dict)
    ]
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(review_items, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(review_items)} review prompt(s) to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
