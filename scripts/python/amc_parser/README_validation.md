# AMC Answer Validation

This directory contains scripts to validate AMC competition answers against official answer sheets from the Art of Problem Solving (AoPS) website.

## Files

- `validate_answers.py` - Main validation script
- `run_validation.py` - Simple convenience script to run validation
- `amc_parser.py` - AMC parser (used by validation script)

## Quick Start

### Option 1: Simple Run
```bash
cd scripts/python/amc_parser
python run_validation.py
```

### Option 2: Advanced Usage
```bash
cd scripts/python/amc_parser
python validate_answers.py --help
```

## Usage Examples

### Basic validation
```bash
python validate_answers.py
```

### Verbose output
```bash
python validate_answers.py --verbose
```

### Custom directory
```bash
python validate_answers.py --competition-dir /path/to/amc/files
```

### Dry run (see what would be validated)
```bash
python validate_answers.py --dry-run
```

### Custom output file
```bash
python validate_answers.py --output-file my_validation_report.json
```

## What It Does

1. **Scans** the AMC competition directories (AMC_8, AMC_10, AMC_12)
2. **Fetches** official answer sheets from AoPS for each competition
3. **Compares** the official answers with the answers stored in your JSON files
4. **Reports** any mismatches found

## Output

The script generates:
- **Console output**: Summary of validation results
- **JSON report**: Detailed report saved to `answer_validation_report.json`

### Report Structure
```json
{
  "summary": {
    "total_competitions": 75,
    "total_problems": 1875,
    "mismatches_found": 3,
    "validation_errors": 0,
    "network_errors": 0
  },
  "competitions": [
    {
      "filename": "2024_AMC_8.json",
      "status": "mismatches_found",
      "mismatches_count": 1,
      "mismatches": [
        {
          "problem_number": 15,
          "json_answer": "C",
          "official_answer": "D",
          "json_problem_id": "amc_2024_8_15"
        }
      ]
    }
  ]
}
```

## Error Handling

The script handles various error conditions:
- **Network errors**: When answer sheets can't be fetched
- **Parse errors**: When JSON files are malformed
- **Format errors**: When competition info can't be extracted from filenames

## Network Considerations

- The script makes HTTP requests to AoPS to fetch answer sheets
- Includes a 0.5-second delay between requests to be respectful
- Uses caching (from AMCParser) to avoid re-fetching the same answer sheets

## Exit Codes

- **0**: Success, no mismatches found
- **1**: Mismatches found or errors occurred

## Troubleshooting

### "Competition directory not found"
- Ensure the path to your AMC JSON files is correct
- Default path: `backend-java/resources/math/questions`

### "Could not fetch answer sheet"
- Check your internet connection
- AoPS website might be temporarily unavailable
- Some very old competitions might not have answer sheets available

### "Could not parse competition info from filename"
- Ensure JSON files follow the naming convention:
  - `YYYY_AMC_8.json`
  - `YYYY_AMC_10A.json`
  - `YYYY_AMC_10B.json`
  - `YYYY_AMC_12A.json`
  - `YYYY_AMC_12B.json`
  - `YYYY_Fall_AMC_10A.json`
  - `YYYY_AJHSME.json`

## Example Output

```
[INFO] Scanning directory: /path/to/backend-java/resources/math/questions
[INFO] Found 75 competition files to validate

[1/75] Processing 2000_AMC_8.json
[VERBOSE] Fetching answer sheet for 2000_AMC_8.json
[VERBOSE] Successfully fetched 25 answers
[INFO] Validating 2000_AMC_8.json

[2/75] Processing 2001_AMC_8.json
[VERBOSE] Fetching answer sheet for 2001_AMC_8.json
[VERBOSE] Successfully fetched 25 answers
[INFO] Validating 2001_AMC_8.json

...

============================================================
VALIDATION SUMMARY
============================================================
Total competitions processed: 75
Total problems validated: 1875
Mismatches found: 3
Validation errors: 0
Network errors: 0

============================================================
COMPETITIONS WITH ANSWER MISMATCHES
============================================================

2024_AMC_8.json: 1 mismatches
  Problem 15: JSON='C' vs Official='D'

2023_AMC_10A.json: 2 mismatches
  Problem 8: JSON='B' vs Official='A'
  Problem 22: JSON='E' vs Official='D'

[INFO] Detailed report saved to: answer_validation_report.json
⚠️  Found 3 answer mismatches!
```
