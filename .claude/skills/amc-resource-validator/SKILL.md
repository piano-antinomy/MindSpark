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
13. The first solution still renders after insertions and does not leave raw markers behind.
14. The file does not rely on parser fallbacks like dummy choices.
15. Browser render matches the real viewport: no clipping, broken layout, or hidden content.
16. Scrollable regions are reachable top/middle/bottom when content is too long.
17. Each question has exactly five renderable choices labeled A-E, and a declared A-E answer.
18. A Copilot model review judges whether the question makes sense, whether the answer is mathematically correct, and whether the first solution supports it.
19. Copilot model review flags contributor credits, signatures, usernames, and author links embedded in the first solution as `contributor-info`, making the solution at least `needs_review`.
20. For `contributor-info`, present the exact non-mathematical text to the user and obtain explicit confirmation before removing it from the resource.
21. For an incorrect answer, present the proposed replacement letter, its matching choice, and mathematical justification. Obtain explicit confirmation before editing the resource's `answer` field.
22. When asked to review and improve solutions, read the question and independently derive the answer before writing a replacement first solution.
23. Insert the generated solution as the first solution (`solutions[0]`) after user confirmation, preserving existing solutions after it. Existing solutions may inform the approach, but never copy them verbatim; fully reword and independently verify any reasoning used.
24. Keep the replacement solution concise and clear, but never skip a necessary logical or computational step. Explicitly state the justification for each derived value, define notation only when needed, and state the selected choice.
25. Avoid gap-filler, buzzwords, generic transitions, and repeated concepts or terms. Remove contributor information, signatures, and unrelated commentary from the replacement.

## How to validate

Run static validation first:

```bash
python3 .claude/skills/amc-resource-validator/validate_amc_resources.py
```

Run browser rendering validation next:

```bash
python3 .claude/skills/amc-resource-validator/render_amc_resources.py \
  backend-java/resources/math/questions/AMC_12/2024_AMC_12A.json
```

Generate model-review prompts after every render run (three questions at a time by default). AI review is required to complete validation; static and browser checks alone do not approve a problem:

```bash
python3 .claude/skills/amc-resource-validator/generate_amc_review_prompts.py \
  --render-dir /tmp/amc-render \
  --output /tmp/amc-render/review-prompts.json \
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
- Static and browser checks are deterministic. Use the generated prompt, its rendered content, and screenshots for Copilot model review of semantic completeness and mathematical correctness; models can still return `needs_review` when the evidence is insufficient.
- Never automatically edit source content from an AI review. Contributor cleanup and answer corrections are confirmation-gated changes.
- Solution rewrites must be confirmed by the user before modifying the resource. Present the proposed first solution and the mathematical justification before editing, then insert it at the beginning of the `solutions` array without removing existing entries.
- After approved resource edits in an isolated worktree, start DynamoDB Local, the backend, and the website from that worktree so the user can review the actual application before the changes are finalized. Follow `.claude/skills/run-app-locally/SKILL.md`.
