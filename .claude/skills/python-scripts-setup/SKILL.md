# Python scripts setup

Use this skill when you need to install or run the repo's Python utilities.

## Relevant directories

- `scripts/python/amc_parser`
- `scripts/python/amc_labeling`
- `scripts/python/demo`

## Dependencies

Install from:

```bash
cd scripts/python
python3 -m pip install -r requirements.txt
```

Optional venv:

```bash
cd scripts/python
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Tested command

```bash
cd scripts/python/amc_parser
python3 validate_answers.py --dry-run --competition-dir ../../../backend-java/resources/math/questions
```

## Notes

- `validate_answers.py` needs `--competition-dir` when run from `scripts/python/amc_parser`
- `amc_parser.py` writes generated output under `backend-java/questions/AMC/...`
- treat generated output as an artifact unless you intentionally migrate it
