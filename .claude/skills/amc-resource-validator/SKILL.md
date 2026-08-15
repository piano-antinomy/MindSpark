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
13. Solutions still render after insertions and do not leave raw markers behind.
14. The file does not rely on parser fallbacks like dummy choices.
15. Browser render matches the real viewport: no clipping, broken layout, or hidden content.
16. Scrollable regions are reachable top/middle/bottom when content is too long.

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
