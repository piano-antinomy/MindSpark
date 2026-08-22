# AMC resource validator

Use this skill to validate `backend-java/resources/math/questions` AMC JSON files before and after browser rendering.

## What to validate

1. JSON parses cleanly and contains `competition_info` + `problems`.
2. File name, folder, and `competition_info.group/year/total_problems` agree.
3. Each problem has a stable `id`, `question`, `answer`, and `solutions`.
4. Insertion markers in question/solution text match the `insertions` map.
5. Insertion payloads have a usable `alt_type`, `alt_value`, and image source.
6. Remote image URIs resolve and local images exist under `website/public/resources/images`.
7. LaTeX is balanced, supported, and still splits into readable choices.
8. Choice content matches the expected render mode (`text_choices`, `latex_choices`, `picture_choices`).
9. Plain-text choices are not hiding math notation that needs MathJax.
10. `choice_space` and `choice_vertical` are sane.
11. HTML fragments are balanced and inline `style=""` syntax is valid.
12. Common math symbols use canonical MathJax-friendly notation, not raw unicode shortcuts.
13. The first two solutions, when present, still render after insertions and do not leave raw markers behind.
14. The file does not rely on parser fallbacks like dummy choices.
15. Browser render matches the real viewport: no clipping, broken layout, or hidden content.
16. Scrollable regions are reachable top/middle/bottom when content is too long.
17. Each question has exactly five renderable choices labeled A-E, and a declared A-E answer.
18. AI review operates in three explicit modes: `quality-review`, `generate-solution`, and `solution-review`. No mode assesses contributor information.
19. The primary agent owns `generate-solution`: it reads up to two existing solutions, extracts each supported A-E answer, and verifies each matches the answer explicitly declared in the resource JSON before generating anything.
20. Only after the existing solutions pass that answer-alignment check, the primary agent independently generates a concise, complete first solution and inserts it at `solutions[0]`, preserving existing solutions after it.
21. `solution-review` is assigned to an independent AI reviewer after insertion. It reviews the re-rendered solution page, validates the declared-answer alignment and mathematics, and checks that the solution renders fully and does not omit necessary reasoning steps.
22. All review modes report missing choices, malformed or unrendered text/math, broken or poorly formatted choices, incorrect answers, solution-answer mismatches, missing reasoning steps, and other problem-quality issues.
23. For an incorrect answer, present the proposed replacement letter, its matching choice, and mathematical justification. Obtain explicit confirmation before editing the resource's `answer` field.

## How to validate

Run static validation first:

```bash
python3 .claude/skills/amc-resource-validator/validate_amc_resources.py
```

Run question-only browser rendering validation next:

```bash
python3 .claude/skills/amc-resource-validator/render_amc_resources.py \
  --mode question \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json
```

After that render, generate the primary-agent prompts (three questions at a time by default). The primary agent performs the existing-solution answer-alignment review, generates a first solution only when that passes, and inserts it at `solutions[0]`:

```bash
python3 .claude/skills/amc-resource-validator/generate_amc_review_prompts.py \
  --render-dir /tmp/amc-render \
  --output /tmp/amc-render/review-prompts.json \
  --mode generate-solution \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json
```

After insertion, re-render only the solution page and give the independent reviewer the solution-review prompts:

```bash
python3 .claude/skills/amc-resource-validator/render_amc_resources.py \
  --output-dir /tmp/amc-solution-render \
  --mode solution \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json

python3 .claude/skills/amc-resource-validator/generate_amc_review_prompts.py \
  --render-dir /tmp/amc-solution-render \
  --output /tmp/amc-solution-render/review-prompts.json \
  --mode solution-review \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json
```

Useful render options:

```bash
# Save outputs somewhere outside the repo
python3 .claude/skills/amc-resource-validator/render_amc_resources.py \
  --output-dir /tmp/amc-render \
  --viewports ipad-mini-portrait,ipad-mini-landscape,laptop,desktop \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json

# Include remote image URL checks in the static stage
python3 .claude/skills/amc-resource-validator/validate_amc_resources.py --check-urls
```

## Browser viewports

- iPad mini portrait: `768x1024`
- iPad mini landscape: `1024x768`
- modern laptop: `1440x900`
- desktop: `1920x1080`

## Output

- `ERROR` items block renderability.
- `WARN` items are likely to render, but may be unreadable or misleading.
- Render runs write screenshots, DOM snapshots, and JSON reports to the chosen output directory.

## Notes

- Static validation is the fast gate.
- Browser render validation catches clipping, scrollability, MathJax output, and responsive layout issues.
- The script lives in the same skill folder and uses a self-contained HTML harness plus headless Chromium.
- Static and browser checks are deterministic. The primary agent owns generation and insertion; the independent reviewer owns the post-insertion solution review. Both can return `needs_review` when the evidence is insufficient.
- Never automatically edit an answer field from AI review. Answer corrections remain confirmation-gated changes.
- After approved resource edits in an isolated worktree, start DynamoDB Local, the backend, and the website from that worktree so the user can review the actual application before the changes are finalized. Follow `.claude/skills/run-app-locally/SKILL.md`.
