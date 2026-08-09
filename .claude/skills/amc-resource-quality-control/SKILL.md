# AMC resource quality control

Use this skill to run quality checks against AMC resource JSON files under `backend-java/resources/math/questions`.

## What this checks

- choice text length after LaTeX cleanup (flags overly long choices)
- per-question details for flagged choices
- summary counts by competition group (`AMC_8`, `AMC_10`, `AMC_12`)

## Script

`analyze_choice_lengths.py`

## Usage

From repo root:

```bash
python3 .claude/skills/amc-resource-quality-control/analyze_choice_lengths.py
```

Useful options:

```bash
# Custom threshold
python3 .claude/skills/amc-resource-quality-control/analyze_choice_lengths.py --max-length 30

# Keep terminal output short
python3 .claude/skills/amc-resource-quality-control/analyze_choice_lengths.py --limit-results 20

# Save machine-readable report
python3 .claude/skills/amc-resource-quality-control/analyze_choice_lengths.py --output-json /tmp/amc_choice_length_report.json
```

## Notes

- The script auto-detects repo root from its own location.
- You can override dataset location with `--questions-dir`.
