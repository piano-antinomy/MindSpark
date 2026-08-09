# AMC AI solution sync

Use this skill to copy AI solution text into AMC question files only when AI and official answers match.

## What it does

- locates a matching file under:
  - `backend-java/resources/math/questions`
  - `backend-java/resources/math/ai`
- compares each problem's `answer` with the AI answer by problem number
- prepends AI `text` into `problem.solutions` for matched answers
- reports mismatches and skips them

## Script

`compare_and_copy_solutions.py`

## Usage

```bash
python3 .claude/skills/amc-ai-solution-sync/compare_and_copy_solutions.py 2025_AMC_8.json
```

## Notes

- The target question JSON file is rewritten in place.
- The script auto-detects repo root from the current directory or script location.
