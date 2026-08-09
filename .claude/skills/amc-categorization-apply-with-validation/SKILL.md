# AMC categorization apply with validation

Use this skill to apply category overrides to AMC problem JSON files with taxonomy validation.

## What it does

- reads a categorization mapping file keyed by `problem_id`
- validates each `category/sub_category` against `scripts/python/amc_labeling/category_validator.py`
- writes valid categorization updates into the target AMC JSON file
- skips invalid category pairs and reports them

## Script

`apply_categorization_with_validation.py`

## Usage

```bash
python3 .claude/skills/amc-categorization-apply-with-validation/apply_categorization_with_validation.py \
  /absolute/path/to/categorization.json \
  /absolute/path/to/backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json
```

## Input format (categorization file)

```json
{
  "amc_2024_12a_1": { "category": "algebra", "sub_category": "equations" },
  "amc_2024_12a_2": { "category": "geometry", "sub_category": "triangles" }
}
```

## Output behavior

- Updates each matched problem with:
  - `categorization: [{"category": "...", "sub_category": "..."}]`
- Rewrites the target AMC file in place.
