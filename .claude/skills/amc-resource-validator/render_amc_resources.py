#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import html
import json
import re
import tempfile
from pathlib import Path
from typing import Any

from validate_amc_resources import find_repo_root, is_nonempty_list, validate_file

try:
    from playwright.async_api import async_playwright
except Exception as exc:  # pragma: no cover
    async_playwright = None
    PLAYWRIGHT_IMPORT_ERROR = exc
else:
    PLAYWRIGHT_IMPORT_ERROR = None


VIEWPORTS = {
    "ipad-mini-portrait": {"width": 768, "height": 1024, "device_scale_factor": 2},
    "ipad-mini-landscape": {"width": 1024, "height": 768, "device_scale_factor": 2},
    "laptop": {"width": 1440, "height": 900, "device_scale_factor": 1},
    "desktop": {"width": 1920, "height": 1080, "device_scale_factor": 1},
}

LABEL_PATTERNS = ("textbf", "mathrm", "text", "textrm")
INSERTION_RE = re.compile(r"<(INSERTION_INDEX_\d+)>")


def escape_html(text: str) -> str:
    return html.escape(text, quote=False)


def normalize_url(url: str, repo_root: Path) -> str:
    if url.startswith("//"):
        return "https:" + url
    if re.match(r"^https?://", url):
        return url
    if url.startswith("/"):
        return (repo_root / url.lstrip("/")).as_uri()
    return (repo_root / url).as_uri()


def preprocess_latex_text(text: str) -> str:
    if not text:
        return text
    text = text.replace(r"\textsc{", r"\text{")
    text = text.replace(r"\emph{", r"\textit{")
    text = text.replace(r"\overarc{", r"\overparen{")
    text = text.replace(r"\textdollar", r"\text{\$}")
    text = text.replace(r"\begin{tabular}", r"\begin{array}")
    text = text.replace(r"\end{tabular}", r"\end{array}")
    return text


def process_question_text(question_text: str, insertions: dict[str, Any], repo_root: Path) -> str:
    processed = str(question_text or "")
    for key, insertion in (insertions or {}).items():
        marker = f"<{key}>"
        alt_type = insertion.get("alt_type")
        picture = insertion.get("picture")
        alt_value = insertion.get("alt_value")
        width = insertion.get("width") or ""
        height = insertion.get("height") or ""
        style = f' style="width: {width}px; height: {height}px;"' if width and height else ""

        if alt_type == "local_image" and picture:
            image_url = normalize_url(f"/website/public/resources/images/{picture}", repo_root)
            replacement = f'<img src="{image_url}" alt="Question image" class="question-image"{style} />'
        elif alt_type == "image" and picture:
            replacement = f'<img src="{normalize_url(str(picture), repo_root)}" alt="Question image" class="question-image"{style} />'
        elif alt_type == "latex" and alt_value:
            replacement = preprocess_latex_text(str(alt_value))
        elif alt_type == "text" and alt_value:
            replacement = escape_html(str(alt_value))
        elif picture:
            replacement = f'<img src="{normalize_url(str(picture), repo_root)}" alt="Question image" class="question-image"{style} />'
        elif alt_value:
            replacement = escape_html(str(alt_value))
        else:
            replacement = marker
        processed = processed.replace(marker, replacement)
    return preprocess_latex_text(processed)


def split_by_qquad(choice_string: str, label_type: str = "textbf") -> list[str]:
    working = choice_string.strip()
    if working.startswith("$"):
        working = working[1:]
    if working.endswith("$"):
        working = working[:-1]

    if "\\qquad" in working:
        parts = working.split("\\qquad")
    elif "\\quad" in working:
        parts = working.split("\\quad")
    elif "\\\\" in working:
        parts = working.split("\\\\")
    else:
        parts = [working]

    choices: list[str] = []
    for part in parts:
        part = part.strip()
        if part and label_type in part:
            choices.append(f"${part}$")
    return choices or [f"${working}$"]


def parse_latex_choices(latex_choices: list[str]) -> dict[str, Any]:
    preprocessed = [preprocess_latex_text(choice) for choice in latex_choices]
    if len(preprocessed) == 1:
        choice_string = preprocessed[0]
        for pattern in LABEL_PATTERNS:
            regex = re.compile(rf"\\{pattern}\s?\{{[^}}]*\([A-E]\)[^}}]*\}}", re.DOTALL)
            matches = regex.findall(choice_string)
            if len(matches) > 1:
                return {"choices": split_by_qquad(choice_string, pattern), "hasLabels": True}
        if "\\qquad" in choice_string or "\\quad" in choice_string or "\\\\" in choice_string:
            return {"choices": split_by_qquad(choice_string), "hasLabels": True}
        return {"choices": [choice_string], "hasLabels": True}
    return {
        "choices": preprocessed,
        "hasLabels": any(re.search(r"\([A-E]\)", choice) for choice in preprocessed),
    }


def extract_choices(question: dict[str, Any], repo_root: Path) -> dict[str, Any]:
    text_choices = question.get("text_choices") or []
    latex_choices = question.get("latex_choices") or []
    picture_choices = question.get("picture_choices") or []

    if is_nonempty_list(text_choices):
        return {
            "choices": [escape_html(str(choice)).replace("$", "\\$") for choice in text_choices],
            "kind": "text",
        }
    if is_nonempty_list(latex_choices):
        parsed = parse_latex_choices(latex_choices)
        return {"choices": parsed["choices"], "kind": "latex"}
    if is_nonempty_list(picture_choices):
        rendered = []
        for choice in picture_choices:
            if isinstance(choice, str):
                rendered.append({"uri": normalize_url(choice, repo_root), "width": "", "height": ""})
            elif isinstance(choice, dict):
                rendered.append(
                    {
                        "uri": normalize_url(str(choice.get("uri") or ""), repo_root),
                        "width": choice.get("width") or "",
                        "height": choice.get("height") or "",
                    }
                )
        return {"choices": rendered, "kind": "image"}
    return {"choices": ["A", "B", "C", "D", "E"], "kind": "dummy"}


def render_solution_text(solution: Any, parent_insertions: dict[str, Any], repo_root: Path) -> str:
    if isinstance(solution, str):
        text = solution
        insertions = parent_insertions
    elif isinstance(solution, dict):
        text = str(solution.get("text") or solution.get("content") or solution.get("value") or "")
        insertions = solution.get("insertions") if isinstance(solution.get("insertions"), dict) else parent_insertions
    else:
        text = str(solution)
        insertions = parent_insertions
    return process_question_text(text, insertions, repo_root)


def build_payload(problem: dict[str, Any], repo_root: Path) -> dict[str, Any]:
    question = problem.get("question") if isinstance(problem.get("question"), dict) else {}
    insertions = question.get("insertions") if isinstance(question.get("insertions"), dict) else {}
    question_text = process_question_text(str(question.get("text") or ""), insertions, repo_root)
    choices = extract_choices(question, repo_root)
    rendered_solutions = [render_solution_text(solution, insertions, repo_root) for solution in (problem.get("solutions") or [])[:1]]
    return {
        "id": problem.get("id"),
        "questionText": question_text,
        "choices": choices["choices"],
        "choiceKind": choices["kind"],
        "choiceVertical": bool(question.get("choice_vertical")),
        "choiceSpace": question.get("choice_space"),
        "answer": problem.get("answer"),
        "solutions": rendered_solutions,
    }


def build_html(problem_set: dict[str, Any], repo_root: Path, output_dir: Path) -> Path:
    payloads = [build_payload(problem, repo_root) for problem in problem_set.get("problems", []) if isinstance(problem, dict)]
    css1 = (repo_root / "website" / "public" / "css" / "styles.css").as_uri()
    css2 = (repo_root / "website" / "public" / "css" / "math-java.css").as_uri()
    out = output_dir / "amc-render-harness.html"

    embedded_payloads = json.dumps(payloads, ensure_ascii=False).replace("</", "<\\/")
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AMC Render Harness</title>
  <link rel="stylesheet" href="{css1}" />
  <link rel="stylesheet" href="{css2}" />
  <style>
    body {{ margin: 0; background: #f8f9fa; }}
    .validator-shell {{ height: 100vh; display: flex; flex-direction: column; }}
    .validator-toolbar {{
      flex: 0 0 auto; padding: 8px 12px; background: #111827; color: white;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      font: 14px/1.4 system-ui, sans-serif;
    }}
    .validator-toolbar button {{
      background: #2563eb; color: white; border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer;
    }}
    .validator-toolbar button.secondary {{ background: #374151; }}
    .validator-stage {{ flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 16px; box-sizing: border-box; }}
    .question-card {{
      height: 100%; min-height: 0; display: flex; flex-direction: column; background: white;
      border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;
    }}
    .question-card-header {{ flex: 0 0 auto; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }}
    .question-card-header h3 {{ margin: 0; font-size: 18px; }}
    .question-card-body {{ flex: 1 1 auto; min-height: 0; display: flex; gap: 16px; padding: 16px; box-sizing: border-box; }}
    .question-card-body.stacked {{ flex-direction: column; }}
    .question-pane, .choices-pane, .solution-pane {{ min-height: 0; overflow-y: auto; overflow-x: hidden; }}
    .question-pane {{ flex: 2 1 0; }}
    .choices-pane {{ flex: 1 1 0; }}
    .question-card-body.stacked .question-pane {{ max-height: 48%; flex: 0 0 auto; }}
    .question-card-body.stacked .choices-pane {{ flex: 1 1 auto; }}
    .solution-pane {{ flex: 1 1 auto; padding: 16px; }}
    .debug-panel {{
      font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: #0f172a; color: #e2e8f0;
      padding: 10px 12px; border-radius: 12px; white-space: pre-wrap; max-height: 22vh; overflow: auto;
    }}
  </style>
  <script>
    window.MathJax = {{
      tex: {{
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
        processEscapes: true,
        processEnvironments: true,
        packages: {{'[+]': ['textmacros', 'ams', 'array', 'base', 'amsmath', 'cancel']}}
      }},
      options: {{ skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] }}
    }};
  </script>
  <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <div class="validator-shell">
    <div class="validator-toolbar">
      <strong>AMC render harness</strong>
      <span id="status">Loading...</span>
      <button id="prevBtn" class="secondary">Prev</button>
      <button id="nextBtn" class="secondary">Next</button>
      <button id="questionBtn">Question</button>
      <button id="solutionBtn" class="secondary">Solution</button>
    </div>
    <div class="validator-stage">
      <div id="app"></div>
    </div>
  </div>
  <script>
    window.__AMC_PROBLEMS = {embedded_payloads};
    const app = document.getElementById('app');
    const status = document.getElementById('status');
    const state = {{ index: 0, mode: 'question' }};

    function renderChoice(choice, idx, kind) {{
      const letter = String.fromCharCode(65 + idx);
      if (kind === 'image') {{
        const style = choice.width && choice.height ? ` style="width: ${{choice.width}}px; height: ${{choice.height}}px;"` : '';
        return `<label class="choice-item block p-3 border rounded text-left"><div class="flex items-start"><div class="flex-1"><div><span class="font-medium">${{letter}}</span></div><div class="question-image-container"><img src="${{choice.uri}}" alt="Choice" class="choice-image"${{style}} /></div></div></div></label>`;
      }}
      if (kind === 'dummy') {{
        return `<label class="choice-item block p-3 border rounded text-left"><div class="flex items-start"><div class="flex-1"><div><span class="font-medium">${{letter}}:</span> ${{choice}}</div></div></div></label>`;
      }}
      if (kind === 'text') {{
        return `<label class="choice-item block p-3 border rounded text-left"><div class="flex items-start"><div class="flex-1"><div><span class="font-medium">${{letter}}</span></div><div class="choice-content"><span class="choice-text">${{choice}}</span></div></div></div></label>`;
      }}
      return `<label class="choice-item block p-3 border rounded text-left"><div class="flex items-start"><div class="flex-1"><div><span class="font-medium">${{letter}}</span></div><div class="choice-content"><span class="choice-text">${{choice}}</span></div></div></div></label>`;
    }}

    function renderQuestion(problem) {{
      const stacked = problem.choiceVertical ? 'stacked' : '';
      const questionPane = `<div class="question-pane"><div class="question-content-section p-3 lg:p-6"><div class="question-text mb-4">${{problem.questionText}}</div></div></div>`;
      const choicesPane = `<div class="choices-pane"><div class="choices-container space-y-2 lg:space-y-3 p-3 lg:p-6">${{problem.choices.map((choice, i) => renderChoice(choice, i, problem.choiceKind)).join('')}}</div></div>`;
      return `
        <div class="question-card">
          <div class="question-card-header"><h3>Problem ${{state.index + 1}} of ${{window.__AMC_PROBLEMS.length}}</h3></div>
          <div class="question-card-body ${{stacked}}">${{questionPane + choicesPane}}</div>
          <div class="answer-selection p-3" data-answer="${{problem.answer || ''}}">Correct answer: <strong>${{problem.answer || 'Missing'}}</strong></div>
        </div>
      `;
    }}

    function renderSolution(problem) {{
      const content = (problem.solutions || []).length
        ? problem.solutions.map((s, i) => `<div class="solution-item mb-4"><div class="solution-text prose prose-sm">${{s}}</div></div>`).join('')
        : '<div class="solution-item">No solution available.</div>';
      return `
        <div class="question-card">
          <div class="question-card-header"><h3>Solution • Problem ${{state.index + 1}} of ${{window.__AMC_PROBLEMS.length}}</h3></div>
          <div class="solution-pane">${{content}}</div>
        </div>
      `;
    }}

    function render() {{
      const problem = window.__AMC_PROBLEMS[state.index];
      app.innerHTML = state.mode === 'question' ? renderQuestion(problem) : renderSolution(problem);
      status.textContent = `problem ${{state.index + 1}}/${{window.__AMC_PROBLEMS.length}} · ${{state.mode}}`;
      document.getElementById('questionBtn').className = state.mode === 'question' ? '' : 'secondary';
      document.getElementById('solutionBtn').className = state.mode === 'solution' ? '' : 'secondary';
      if (window.MathJax && window.MathJax.typesetPromise) {{
        window.MathJax.typesetPromise([app]).catch(() => window.MathJax.typesetPromise());
      }}
    }}

    window.__amc = {{
      setIndex(index) {{
        state.index = Math.max(0, Math.min(window.__AMC_PROBLEMS.length - 1, index));
        render();
      }},
      setMode(mode) {{
        state.mode = mode;
        render();
      }},
      getState() {{ return {{ ...state }}; }}
    }};

    document.getElementById('prevBtn').addEventListener('click', () => __amc.setIndex(state.index - 1));
    document.getElementById('nextBtn').addEventListener('click', () => __amc.setIndex(state.index + 1));
    document.getElementById('questionBtn').addEventListener('click', () => __amc.setMode('question'));
    document.getElementById('solutionBtn').addEventListener('click', () => __amc.setMode('solution'));

    render();
  </script>
</body>
</html>
"""
    out.write_text(html_doc, encoding="utf-8")
    return out


async def inspect_page(page, output_dir: Path, viewport_name: str, problem_index: int, mode: str) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    metrics = await page.evaluate(
        """() => {
          const text = document.body.textContent || '';
          return {
            bodyScrollWidth: document.body.scrollWidth,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            insertionMarkers: text.includes('<INSERTION_INDEX_') ? 1 : 0,
            mathjaxNodes: document.querySelectorAll('.MathJax, .mjx-chtml, mjx-container').length,
            images: [...document.images].map(img => ({
              src: img.currentSrc || img.src,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            })),
            questionText: document.querySelector('.question-text')?.textContent?.trim() || '',
            choiceLabels: [...document.querySelectorAll('.choice-item .font-medium')].map(el => el.textContent.trim().replace(/:$/, '')),
            choiceContents: [...document.querySelectorAll('.choice-item .choice-content, .choice-item .question-image-container')].map(el => el.textContent.trim() || (el.querySelector('img') ? 'image' : '')),
            declaredAnswer: document.querySelector('.answer-selection')?.dataset.answer || '',
            solutionTexts: [...document.querySelectorAll('.solution-text')].map(el => el.textContent.trim()),
            containers: [...document.querySelectorAll('.question-content-section, .choices-container, .solution-pane')].map(el => ({
              className: el.className,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            }))
          };
        }"""
    )

    baseline = output_dir / f"{viewport_name}-q{problem_index + 1}-{mode}-baseline.png"
    await page.screenshot(path=str(baseline), full_page=False)
    snapshot = output_dir / f"{viewport_name}-q{problem_index + 1}-{mode}.html"
    snapshot.write_text(await page.content(), encoding="utf-8")

    if metrics["bodyScrollWidth"] > metrics["innerWidth"] + 2:
        issues.append({"severity": "ERROR", "code": "horizontal-overflow", "message": "body exceeds viewport width", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
    if metrics["insertionMarkers"]:
        issues.append({"severity": "ERROR", "code": "unresolved-marker", "message": "render still contains insertion markers", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
    if mode == "question":
        if not metrics["questionText"]:
            issues.append({"severity": "ERROR", "code": "empty-rendered-question", "message": "question text is empty after rendering", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
        if len(metrics["choiceLabels"]) != 5:
            issues.append({"severity": "ERROR", "code": "wrong-rendered-choice-count", "message": f"expected 5 choices, found {len(metrics['choiceLabels'])}", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
        elif metrics["choiceLabels"] != list("ABCDE"):
            issues.append({"severity": "ERROR", "code": "wrong-rendered-choice-labels", "message": f"expected labels A-E, found {metrics['choiceLabels']}", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
        if len(metrics["choiceContents"]) != 5 or any(not content for content in metrics["choiceContents"]):
            issues.append({"severity": "ERROR", "code": "empty-rendered-choice", "message": "one or more rendered choices have no visible content", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
        if metrics["declaredAnswer"] not in set("ABCDE"):
            issues.append({"severity": "ERROR", "code": "missing-rendered-answer", "message": "declared answer is not one of A-E", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})
    elif not metrics["solutionTexts"] or any(not text for text in metrics["solutionTexts"]):
        issues.append({"severity": "ERROR", "code": "empty-rendered-solution", "message": "solution text is empty after rendering", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})

    for image in metrics["images"]:
        if not image["complete"] or image["naturalWidth"] == 0 or image["naturalHeight"] == 0:
            issues.append({"severity": "ERROR", "code": "broken-image", "message": f"broken image: {image['src']}", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})

    if metrics["mathjaxNodes"] == 0 and await page.evaluate("() => /\\\\|\\$/.test(document.body.textContent || '')"):
        issues.append({"severity": "WARN", "code": "mathjax-missing", "message": "MathJax did not produce visible output", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})

    # Scroll any overflowing region and capture top/mid/bottom states.
    for selector in [".question-content-section", ".choices-container", ".solution-pane"]:
        count = await page.locator(selector).count()
        for idx in range(count):
            loc = page.locator(selector).nth(idx)
            dims = await loc.evaluate("""(el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight })""")
            if dims["scrollHeight"] <= dims["clientHeight"] + 2:
                continue
            positions = {
                "top": 0,
                "middle": max(0, (dims["scrollHeight"] - dims["clientHeight"]) // 2),
                "bottom": max(0, dims["scrollHeight"] - dims["clientHeight"]),
            }
            for position_name, value in positions.items():
                await loc.evaluate("(el, y) => { el.scrollTop = y; }", value)
                await page.wait_for_timeout(100)
                shot = output_dir / f"{viewport_name}-q{problem_index + 1}-{mode}-{selector.strip('.')}-{position_name}.png"
                await page.screenshot(path=str(shot), full_page=False)
                end_ok = await loc.evaluate("""(el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2""")
                if position_name == "bottom" and not end_ok:
                    issues.append({"severity": "ERROR", "code": "scroll-bottom-unreachable", "message": f"{selector} could not reach bottom", "viewport": viewport_name, "problemIndex": problem_index, "mode": mode})

    return issues


async def run_render(path: Path, viewports: list[str], output_dir: Path, mode: str) -> list[dict[str, Any]]:
    if async_playwright is None:
        raise SystemExit(f"playwright is not installed: {PLAYWRIGHT_IMPORT_ERROR}")

    repo_root = find_repo_root(Path(__file__).parent)
    _, problem_set = path, json.loads(path.read_text(encoding="utf-8"))
    html_path = build_html(problem_set, repo_root, output_dir)
    issues: list[dict[str, Any]] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for viewport_name in viewports:
            if viewport_name not in VIEWPORTS:
                raise SystemExit(f"Unknown viewport profile: {viewport_name}")
            vp = VIEWPORTS[viewport_name]
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]}, device_scale_factor=vp["device_scale_factor"])
            page = await context.new_page()
            await page.goto(html_path.as_uri(), wait_until="load")
            await page.wait_for_timeout(1500)
            for index in range(len(problem_set.get("problems", []))):
                await page.evaluate("(args) => { window.__amc.setIndex(args.idx); window.__amc.setMode(args.mode); }", {"idx": index, "mode": "question"})
                await page.wait_for_timeout(500)
                if mode in {"question", "both"}:
                    issues.extend(await inspect_page(page, output_dir, viewport_name, index, "question"))
                if mode in {"solution", "both"}:
                    await page.evaluate("() => window.__amc.setMode('solution')")
                    await page.wait_for_timeout(500)
                    issues.extend(await inspect_page(page, output_dir, viewport_name, index, "solution"))
            await context.close()
        await browser.close()
    return issues


def parse_viewports(value: str) -> list[str]:
    if not value:
        return list(VIEWPORTS.keys())
    return [item.strip() for item in value.split(",") if item.strip()]


async def main_async() -> int:
    parser = argparse.ArgumentParser(description="Render AMC math resources in a headless browser and validate layout.")
    parser.add_argument("path", help="AMC JSON file to render")
    parser.add_argument("--output-dir", default="", help="Directory for screenshots and reports (defaults to a temp directory)")
    parser.add_argument("--viewports", default="ipad-mini-portrait,ipad-mini-landscape,laptop,desktop", help="Comma-separated viewport profiles")
    parser.add_argument("--mode", default="both", choices=["question", "solution", "both"], help="Render mode")
    parser.add_argument("--static-check", action="store_true", default=True, help="Run static validation first")
    parser.add_argument("--no-static-check", dest="static_check", action="store_false", help="Skip static validation")
    args = parser.parse_args()

    repo_root = find_repo_root(Path(__file__).parent)
    path = Path(args.path)
    if not path.is_absolute():
        path = (repo_root / path).resolve()
    output_dir = Path(args.output_dir) if args.output_dir else Path(tempfile.mkdtemp(prefix="amc-render-"))
    output_dir.mkdir(parents=True, exist_ok=True)

    static_report = validate_file(path, repo_root, check_urls=False, timeout=3.0) if args.static_check else None
    render_issues = await run_render(path, parse_viewports(args.viewports), output_dir, args.mode)

    report_path = output_dir / "render-report.json"
    report_payload = {
        "path": str(path),
        "output_dir": str(output_dir),
        "static_errors": static_report.error_count if static_report else 0,
        "static_warnings": static_report.warning_count if static_report else 0,
        "render_issues": render_issues,
    }
    report_path.write_text(json.dumps(report_payload, indent=2), encoding="utf-8")

    if static_report:
        print(f"Static validation: {static_report.error_count} error(s), {static_report.warning_count} warning(s)")
    print(f"Render artifacts written to: {output_dir}")
    for issue in render_issues[:200]:
        print(f"{issue['severity']}: {issue['code']} [{issue['viewport']} q{issue['problemIndex'] + 1} {issue['mode']}] {issue['message']}")
    error_count = sum(1 for issue in render_issues if issue["severity"] == "ERROR")
    warn_count = sum(1 for issue in render_issues if issue["severity"] == "WARN")
    print(f"Render validation complete: {error_count} error(s), {warn_count} warning(s)")
    return 1 if error_count or (static_report and static_report.error_count) else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main_async()))
