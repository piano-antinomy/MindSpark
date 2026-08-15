#!/usr/bin/env python3
from __future__ import annotations

import argparse
import dataclasses
import html
from html.parser import HTMLParser
import json
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable


LABEL_PATTERNS = ("textbf", "mathrm", "text", "textrm")
CHOICE_LETTERS = set("ABCDE")
REMOTE_URL_RE = re.compile(r"^//")
INSERTION_RE = re.compile(r"<(INSERTION_INDEX_\d+)>")
LATEX_LABEL_RE = re.compile(r"\\(?:textbf|mathrm|text|textrm)\s?\{[^}]*\([A-E]\)[^}]*\}")
LATEX_COMMAND_RE = re.compile(r"\\[a-zA-Z]+")
HTML_TAG_RE = re.compile(r"<[^>]+>")
STYLE_ATTR_RE = re.compile(r'\bstyle\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))', re.IGNORECASE)
UNICODE_MATH_SYMBOLS = {
    "×": r"\times",
    "÷": r"\div",
    "≤": r"\le",
    "≥": r"\ge",
    "≠": r"\neq",
    "±": r"\pm",
    "∞": r"\infty",
    "∠": r"\angle",
    "∑": r"\sum",
    "∏": r"\prod",
    "∫": r"\int",
    "√": r"\sqrt{}",
    "→": r"\to",
    "←": r"\leftarrow",
    "↔": r"\leftrightarrow",
    "≈": r"\approx",
    "≡": r"\equiv",
    "∈": r"\in",
    "∉": r"\notin",
    "∪": r"\cup",
    "∩": r"\cap",
    "⊂": r"\subset",
    "⊆": r"\subseteq",
    "⊃": r"\supset",
    "⊇": r"\supseteq",
    "∴": r"\therefore",
    "∵": r"\because",
}
LATEX_COMMAND_ALLOWLIST = {
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "zeta", "eta", "theta", "vartheta", "iota",
    "kappa", "lambda", "mu", "nu", "xi", "pi", "rho", "sigma", "tau", "upsilon", "phi", "varphi", "chi",
    "psi", "omega", "Gamma", "Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Upsilon", "Phi", "Psi", "Omega",
    "frac", "sqrt", "boxed", "text", "textbf", "textit", "textrm", "mathrm", "mathbb", "mathcal", "mathbf",
    "mathit", "operatorname", "overline", "underline", "overparen", "vec", "begin", "end", "left", "right",
    "big", "Big", "bigg", "Bigg", "cdot", "times", "div", "pm", "mp", "le", "ge", "neq", "ne", "approx",
    "equiv", "sim", "infty", "angle", "deg", "circ", "to", "mapsto", "leftarrow", "rightarrow",
    "leftrightarrow", "sum", "prod", "int", "lim", "log", "ln", "sin", "cos", "tan", "cot", "sec", "csc",
    "mod", "pmod", "qquad", "quad", "cdots", "ldots", "vdots", "ddots", "because", "therefore", "forall",
    "exists", "in", "notin", "subset", "subseteq", "supset", "supseteq", "cup", "cap", "emptyset", "cdot",
    "langle", "rangle", "lceil", "rceil", "lfloor", "rfloor", "binom", "choose", "overrightarrow", "overleftarrow",
    "bar", "hat", "tilde", "dot", "ddot", "underline", "overbrace", "underbrace", "textsc", "emph", "cases",
    "array", "tabular", "hline", "cline",
}
LATEX_ESCAPE_ALLOWLIST = {"$", "%", "&", "#", "_", "{", "}", "~", "^", "\\", ",", "!", " ", ":", ";"}
VOID_HTML_TAGS = {"br", "hr", "img", "meta", "link", "input", "source", "area", "base", "col", "embed", "param", "track", "wbr"}


@dataclass
class Issue:
    severity: str
    code: str
    message: str
    file_path: str
    problem_id: str | None = None
    solution_index: int | None = None


@dataclass
class FileReport:
    path: Path
    issues: list[Issue] = field(default_factory=list)

    @property
    def error_count(self) -> int:
        return sum(1 for issue in self.issues if issue.severity == "ERROR")

    @property
    def warning_count(self) -> int:
        return sum(1 for issue in self.issues if issue.severity == "WARN")


def find_repo_root(start: Path) -> Path:
    current = start.resolve()
    while current != current.parent:
        if (current / "backend-java" / "resources" / "math" / "questions").exists() and (
            current / "website" / "public" / "resources" / "images"
        ).exists():
            return current
        current = current.parent
    raise SystemExit("Could not find repo root containing backend-java/resources/math/questions and website/public/resources/images")


def rel(path: Path, repo_root: Path) -> str:
    try:
        return str(path.relative_to(repo_root))
    except ValueError:
        return str(path)


def is_nonempty_list(value: Any) -> bool:
    return isinstance(value, list) and any(item not in (None, "", []) for item in value)


def flatten_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(flatten_text(item) for item in value)
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def strip_html(text: str) -> str:
    return HTML_TAG_RE.sub(" ", html.unescape(text)).strip()


def extract_markers(*texts: str) -> set[str]:
    markers: set[str] = set()
    for text in texts:
        markers.update(INSERTION_RE.findall(text or ""))
    return markers


def normalize_url(url: str) -> str:
    if url.startswith("//"):
        return "https:" + url
    return url


def check_url_accessible(url: str, timeout: float) -> tuple[bool, str]:
    normalized = normalize_url(url)
    request = urllib.request.Request(normalized, method="HEAD")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if 200 <= response.status < 400:
                return True, f"HTTP {response.status}"
            return False, f"HTTP {response.status}"
    except Exception:
        request = urllib.request.Request(normalized, method="GET")
        request.add_header("Range", "bytes=0-0")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if 200 <= response.status < 400:
                    return True, f"HTTP {response.status}"
                return False, f"HTTP {response.status}"
        except Exception as exc:  # noqa: BLE001
            return False, str(exc)


def looks_like_math(text: str) -> bool:
    return bool(
        re.search(r"(\\frac|\\sqrt|\\begin\{|\\boxed|\\textbf\{|\\text\{|\\mathrm\{|\\mathbb\{|\\cdot|\\times)", text)
        or "$" in text
        or re.search(r"[\^_]", text)
    )


class FragmentValidator(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stack: list[str] = []
        self.errors: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in VOID_HTML_TAGS:
            self.stack.append(tag)
        for name, value in attrs:
            if name.lower() == "style" and value is not None:
                problems = validate_style_value(value)
                self.errors.extend(problems)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name.lower() == "style" and value is not None:
                problems = validate_style_value(value)
                self.errors.extend(problems)

    def handle_endtag(self, tag: str) -> None:
        if not self.stack:
            self.errors.append(f"unexpected closing tag </{tag}>")
            return
        if self.stack[-1] != tag:
            self.errors.append(f"mismatched closing tag </{tag}>; expected </{self.stack[-1]}>")
            return
        self.stack.pop()


def validate_style_value(style_value: str) -> list[str]:
    problems: list[str] = []
    for part in style_value.split(";"):
        chunk = part.strip()
        if not chunk:
            continue
        if ":" not in chunk:
            problems.append(f"invalid style declaration {chunk!r}")
            continue
        prop, value = chunk.split(":", 1)
        if not prop.strip() or not value.strip():
            problems.append(f"invalid style declaration {chunk!r}")
    return problems


def validate_html_fragment(text: str) -> list[str]:
    if "<" not in text:
        return []
    sanitized = INSERTION_RE.sub("__INSERTION_MARKER__", text)
    parser = FragmentValidator()
    try:
        parser.feed(sanitized)
        parser.close()
    except Exception as exc:  # noqa: BLE001
        return [f"HTML parse failed: {exc}"]
    errors = list(parser.errors)
    if parser.stack:
        errors.append(f"unclosed tag(s): {', '.join(parser.stack)}")
    return errors


def extract_latex_commands(text: str) -> set[str]:
    commands: set[str] = set()
    for match in LATEX_COMMAND_RE.finditer(text):
        commands.add(match.group(0)[1:])
    return commands


def validate_unicode_math_symbols(text: str) -> list[str]:
    issues: list[str] = []
    for symbol, replacement in UNICODE_MATH_SYMBOLS.items():
        if symbol in text:
            issues.append(f"unicode math symbol {symbol!r} should usually be written as {replacement}")
    return issues


def validate_latex_commands(text: str) -> list[str]:
    issues: list[str] = []
    for command in extract_latex_commands(text):
        if command in LATEX_COMMAND_ALLOWLIST:
            continue
        if len(command) == 1 and command in LATEX_ESCAPE_ALLOWLIST:
            continue
        issues.append(f"unsupported or unrecognized LaTeX command \\{command}")
    return issues


def latex_token_balance(text: str) -> list[str]:
    issues: list[str] = []
    if text.count("$") % 2 != 0 and "\\$" not in text:
        issues.append("Unbalanced $ delimiters")
    if text.count("\\[") != text.count("\\]"):
        issues.append("Unbalanced \\[ / \\] delimiters")
    if text.count("\\(") != text.count("\\)"):
        issues.append("Unbalanced \\( / \\) delimiters")
    if text.count("{") != text.count("}"):
        issues.append("Unbalanced braces")
    return issues


def simulate_latex_choice_count(choice_string: str) -> int:
    working = choice_string.strip()
    if working.startswith("$"):
        working = working[1:]
    if working.endswith("$"):
        working = working[:-1]

    if "\\qquad" in working:
        parts = working.split("\\qquad")
    elif "\\quad" in working:
        quad_count = working.count("\\quad")
        parts = working.split("\\quad") if quad_count == 4 else working.split("\\qquad")
    elif "\\\\" in working:
        parts = working.split("\\\\")
    else:
        parts = working.split("\\qquad")

    count = 0
    for part in parts:
        part = part.strip()
        if part and any(pattern in part for pattern in LABEL_PATTERNS):
            count += 1
    return count


def validate_insertion_payload(
    insertion: dict[str, Any],
    context: str,
    repo_root: Path,
    check_urls: bool,
    timeout: float,
    report: FileReport,
    problem_id: str,
) -> None:
    alt_type = insertion.get("alt_type")
    alt_value = insertion.get("alt_value")
    picture = insertion.get("picture")
    width = insertion.get("width")
    height = insertion.get("height")
    should_check_picture = False
    has_renderable_alt = isinstance(alt_value, str) and bool(alt_value.strip())

    if alt_type not in {"image", "local_image", "latex", "text", None, ""}:
        report.issues.append(
            Issue("ERROR", "unsupported-alt-type", f"{context}: unsupported alt_type {alt_type!r}", rel(report.path, repo_root), problem_id)
        )

    if picture not in (None, ""):
        if alt_type == "local_image":
            should_check_picture = True
            image_path = repo_root / "website" / "public" / "resources" / "images" / str(picture)
            if not image_path.exists():
                report.issues.append(
                    Issue("ERROR", "missing-local-image", f"{context}: local image not found at {rel(image_path, repo_root)}", rel(report.path, repo_root), problem_id)
                )
        elif alt_type == "image":
            should_check_picture = True
        elif alt_type in {"latex", "text", None, ""} and not has_renderable_alt:
            should_check_picture = True
        elif alt_type not in {"latex", "text"}:
            should_check_picture = True

        if should_check_picture and check_urls and isinstance(picture, str):
            ok, detail = check_url_accessible(str(picture), timeout)
            if not ok:
                report.issues.append(
                    Issue("ERROR", "unreachable-image", f"{context}: image URI is not reachable ({detail})", rel(report.path, repo_root), problem_id)
                )

    if alt_type == "latex":
        if not isinstance(alt_value, str) or not alt_value.strip():
            report.issues.append(
                Issue("ERROR", "missing-latex", f"{context}: alt_type=latex requires alt_value", rel(report.path, repo_root), problem_id)
            )
        else:
            for problem in latex_token_balance(alt_value):
                report.issues.append(
                    Issue("ERROR", "bad-latex", f"{context}: {problem} in LaTeX payload", rel(report.path, repo_root), problem_id)
                )
            for problem in validate_latex_commands(alt_value):
                report.issues.append(
                    Issue("WARN", "latex-command", f"{context}: {problem}", rel(report.path, repo_root), problem_id)
                )
            for problem in validate_unicode_math_symbols(alt_value):
                report.issues.append(
                    Issue("WARN", "unicode-math-symbol", f"{context}: {problem}", rel(report.path, repo_root), problem_id)
                )
            if re.search(r"\\(textsc|overarc|textdollar|begin\{tabular\}|end\{tabular\})", alt_value):
                report.issues.append(
                    Issue("WARN", "latex-preprocess-rewrite", f"{context}: LaTeX relies on frontend preprocessing rewrites", rel(report.path, repo_root), problem_id)
                )

    if alt_type == "text" and isinstance(alt_value, str) and looks_like_math(alt_value):
        report.issues.append(
            Issue("WARN", "math-in-text", f"{context}: text insertion contains math notation but will render as plain text", rel(report.path, repo_root), problem_id)
        )

    if alt_type in {"image", "local_image", "latex", "text", None, ""} and not has_renderable_alt and picture in (None, ""):
        report.issues.append(
            Issue("ERROR", "missing-render-content", f"{context}: insertion has no usable alt_value or image source", rel(report.path, repo_root), problem_id)
        )

    for source_text in [picture, alt_value]:
        if isinstance(source_text, str):
            for problem in validate_html_fragment(source_text):
                report.issues.append(
                    Issue("WARN", "html-fragment", f"{context}: {problem}", rel(report.path, repo_root), problem_id)
                )

    for key_name, value in (("width", width), ("height", height)):
        if value not in (None, ""):
            try:
                float(value)
            except Exception:
                report.issues.append(
                    Issue("WARN", "bad-dimension", f"{context}: {key_name}={value!r} is not numeric", rel(report.path, repo_root), problem_id)
                )


def validate_question_choices(
    question: dict[str, Any],
    problem_id: str,
    report: FileReport,
    repo_root: Path,
) -> None:
    q = question.get("question") if isinstance(question.get("question"), dict) else question
    text_choices = q.get("text_choices") or []
    latex_choices = q.get("latex_choices") or []
    picture_choices = q.get("picture_choices") or []
    asy_choices = q.get("asy_choices") or []

    present = [name for name, value in (("text_choices", text_choices), ("latex_choices", latex_choices), ("picture_choices", picture_choices)) if is_nonempty_list(value)]
    if len(present) > 1:
        report.issues.append(
            Issue("WARN", "multiple-choice-payloads", f"{problem_id}: multiple choice payloads present ({', '.join(present)}); renderer will prefer text > latex > picture", rel(report.path, repo_root), problem_id)
        )

    if is_nonempty_list(asy_choices):
        report.issues.append(
            Issue("WARN", "ignored-asy-choices", f"{problem_id}: asy_choices are currently ignored by the renderer", rel(report.path, repo_root), problem_id)
        )

    if is_nonempty_list(text_choices):
        for idx, choice in enumerate(text_choices):
            if not isinstance(choice, str):
                report.issues.append(
                    Issue("ERROR", "bad-text-choice", f"{problem_id}: text_choices[{idx}] is not a string", rel(report.path, repo_root), problem_id)
                )
                continue
            if looks_like_math(choice) or HTML_TAG_RE.search(choice):
                report.issues.append(
                    Issue("WARN", "math-in-text-choice", f"{problem_id}: text choice {idx + 1} contains math/HTML but will render as plain text", rel(report.path, repo_root), problem_id)
                )

    if is_nonempty_list(latex_choices):
        for idx, choice in enumerate(latex_choices):
            if not isinstance(choice, str):
                report.issues.append(
                    Issue("ERROR", "bad-latex-choice", f"{problem_id}: latex_choices[{idx}] is not a string", rel(report.path, repo_root), problem_id)
                )
                continue
            for problem in latex_token_balance(choice):
                report.issues.append(
                    Issue("ERROR", "bad-latex-choice", f"{problem_id}: latex choice {idx + 1} has {problem}", rel(report.path, repo_root), problem_id)
                )
            if idx == 0 and len(latex_choices) == 1:
                label_hits = len(LATEX_LABEL_RE.findall(choice))
                split_hits = simulate_latex_choice_count(choice)
                if label_hits > 1 and split_hits <= 1:
                    report.issues.append(
                        Issue("ERROR", "unsplittable-latex-choice", f"{problem_id}: single latex string contains multiple labels but the frontend split heuristics will not separate them", rel(report.path, repo_root), problem_id)
                    )

    if is_nonempty_list(picture_choices):
        for idx, choice in enumerate(picture_choices):
            if isinstance(choice, str):
                uri = choice
                width = height = None
            elif isinstance(choice, dict):
                uri = choice.get("uri")
                width = choice.get("width")
                height = choice.get("height")
            else:
                report.issues.append(
                    Issue("ERROR", "bad-picture-choice", f"{problem_id}: picture_choices[{idx}] must be a string or object", rel(report.path, repo_root), problem_id)
                )
                continue

            if not isinstance(uri, str) or not uri.strip():
                report.issues.append(
                    Issue("ERROR", "missing-picture-uri", f"{problem_id}: picture choice {idx + 1} is missing uri", rel(report.path, repo_root), problem_id)
                )
                continue

            if width not in (None, ""):
                try:
                    float(width)
                except Exception:
                    report.issues.append(
                        Issue("WARN", "bad-picture-width", f"{problem_id}: picture choice {idx + 1} width is not numeric", rel(report.path, repo_root), problem_id)
                    )
            if height not in (None, ""):
                try:
                    float(height)
                except Exception:
                    report.issues.append(
                        Issue("WARN", "bad-picture-height", f"{problem_id}: picture choice {idx + 1} height is not numeric", rel(report.path, repo_root), problem_id)
                    )

    if not present:
        report.issues.append(
            Issue("ERROR", "missing-choices", f"{problem_id}: no renderable choice payload was found", rel(report.path, repo_root), problem_id)
        )


def validate_solution(
    solution: Any,
    question_insertions: dict[str, Any],
    problem_id: str,
    report: FileReport,
    repo_root: Path,
    check_urls: bool,
    timeout: float,
    problem_index: int,
) -> None:
    solution_obj = solution if isinstance(solution, dict) else {"text": solution}
    text = flatten_text(solution_obj.get("text") or solution_obj.get("content") or solution_obj.get("value"))
    insertions = solution_obj.get("insertions") if isinstance(solution_obj.get("insertions"), dict) else {}

    context = f"{problem_id} solution {problem_index + 1}"
    if not text.strip():
        report.issues.append(
            Issue("ERROR", "empty-solution", f"{context}: solution text is empty", rel(report.path, repo_root), problem_id, problem_index)
        )
        return

    for problem in validate_html_fragment(text):
        report.issues.append(
            Issue("WARN", "html-fragment", f"{context}: {problem}", rel(report.path, repo_root), problem_id, problem_index)
        )

    markers = extract_markers(text)
    known_insertions = set(question_insertions.keys()) | set(insertions.keys())
    missing = markers - known_insertions
    if missing:
        report.issues.append(
            Issue("ERROR", "missing-solution-insertion", f"{context}: unresolved insertion marker(s) {sorted(missing)}", rel(report.path, repo_root), problem_id, problem_index)
        )

    for key, value in insertions.items():
        if not isinstance(value, dict):
            report.issues.append(
                Issue("ERROR", "bad-solution-insertion", f"{context}: insertion {key} is not an object", rel(report.path, repo_root), problem_id, problem_index)
            )
            continue
        validate_insertion_payload(value, context, repo_root, check_urls, timeout, report, problem_id)

    rendered_plain = strip_html(INSERTION_RE.sub(" ", text))
    if len(rendered_plain) < 10:
        report.issues.append(
            Issue("WARN", "thin-solution", f"{context}: solution text is almost empty after markup removal", rel(report.path, repo_root), problem_id, problem_index)
        )


def validate_question(
    problem: dict[str, Any],
    report: FileReport,
    repo_root: Path,
    check_urls: bool,
    timeout: float,
    file_path: Path,
    seen_ids: set[str],
    file_stem: str,
    competition_group: str | None,
    expected_group: str | None,
) -> None:
    problem_id = str(problem.get("id") or "").strip()
    if not problem_id:
        report.issues.append(
            Issue("ERROR", "missing-problem-id", "A problem is missing its id", rel(file_path, repo_root))
        )
        problem_id = "<missing-id>"
    elif problem_id in seen_ids:
        report.issues.append(
            Issue("ERROR", "duplicate-problem-id", f"{problem_id}: duplicate id within the same file", rel(file_path, repo_root), problem_id)
        )
    else:
        seen_ids.add(problem_id)

    question = problem.get("question")
    if not isinstance(question, dict):
        report.issues.append(
            Issue("ERROR", "missing-question-object", f"{problem_id}: question is missing or not an object", rel(file_path, repo_root), problem_id)
        )
        return

    qtext = flatten_text(question.get("text"))
    if not qtext.strip():
        report.issues.append(
            Issue("ERROR", "empty-question-text", f"{problem_id}: question.text is empty", rel(file_path, repo_root), problem_id)
        )
    else:
        for html_issue in validate_html_fragment(qtext):
            report.issues.append(
                Issue("WARN", "html-fragment", f"{problem_id}: {html_issue}", rel(file_path, repo_root), problem_id)
            )
        for problem_name in latex_token_balance(qtext):
            if "\\boxed" not in qtext:
                report.issues.append(
                    Issue("WARN", "question-latex-suspicious", f"{problem_id}: {problem_name} in question text", rel(file_path, repo_root), problem_id)
                )

    question_markers = extract_markers(qtext)
    all_insertion_text = [qtext]
    solutions = problem.get("solutions") or []
    if not isinstance(solutions, list):
        report.issues.append(
            Issue("ERROR", "bad-solutions-array", f"{problem_id}: solutions must be an array", rel(file_path, repo_root), problem_id)
        )
        solutions = []
    else:
        for solution in solutions:
            if isinstance(solution, dict):
                all_insertion_text.append(flatten_text(solution.get("text") or solution.get("content") or solution.get("value")))
            else:
                all_insertion_text.append(flatten_text(solution))

    insertions = question.get("insertions") if isinstance(question.get("insertions"), dict) else {}
    marker_refs = extract_markers(*all_insertion_text)
    missing = question_markers - set(insertions.keys())
    if missing:
        report.issues.append(
            Issue("ERROR", "missing-question-insertion", f"{problem_id}: unresolved insertion marker(s) {sorted(missing)}", rel(file_path, repo_root), problem_id)
        )

    unused = set(insertions.keys()) - marker_refs
    if unused:
        report.issues.append(
            Issue("WARN", "unused-insertion", f"{problem_id}: insertion key(s) never referenced {sorted(unused)}", rel(file_path, repo_root), problem_id)
        )

    for key, value in insertions.items():
        if not isinstance(value, dict):
            report.issues.append(
                Issue("ERROR", "bad-insertion", f"{problem_id}: insertion {key} is not an object", rel(file_path, repo_root), problem_id)
            )
            continue
        validate_insertion_payload(value, f"{problem_id} insertion {key}", repo_root, check_urls, timeout, report, problem_id)

    answer = str(problem.get("answer") or "").strip()
    if not answer:
        report.issues.append(
            Issue("ERROR", "missing-answer", f"{problem_id}: answer is empty", rel(file_path, repo_root), problem_id)
        )
    elif answer not in CHOICE_LETTERS:
        report.issues.append(
            Issue("ERROR", "bad-answer", f"{problem_id}: answer {answer!r} is not one of A-E", rel(file_path, repo_root), problem_id)
        )

    choice_space = question.get("choice_space")
    if choice_space not in (None, ""):
        try:
            numeric_choice_space = float(choice_space)
            if not 0 < numeric_choice_space < 1:
                report.issues.append(
                    Issue("WARN", "choice-space-out-of-range", f"{problem_id}: choice_space should be between 0 and 1", rel(file_path, repo_root), problem_id)
                )
        except Exception:
            report.issues.append(
                Issue("WARN", "bad-choice-space", f"{problem_id}: choice_space is not numeric", rel(file_path, repo_root), problem_id)
            )

    choice_vertical = question.get("choice_vertical")
    if choice_vertical not in (None, True, False):
        report.issues.append(
            Issue("WARN", "bad-choice-vertical", f"{problem_id}: choice_vertical should be boolean", rel(file_path, repo_root), problem_id)
        )

    validate_question_choices(problem, problem_id, report, repo_root)

    if not solutions:
        report.issues.append(
            Issue("ERROR", "missing-solutions", f"{problem_id}: solutions array is empty", rel(file_path, repo_root), problem_id)
        )
    else:
        for idx, solution in enumerate(solutions):
            validate_solution(solution, insertions, problem_id, report, repo_root, check_urls, timeout, idx)

    if competition_group and expected_group and competition_group != expected_group:
        report.issues.append(
            Issue("WARN", "group-mismatch", f"{problem_id}: competition_info.group={competition_group!r} does not match folder group {expected_group!r}", rel(file_path, repo_root), problem_id)
        )

    if re.match(r"^amc_\d{4}_(?:8|10|12)_\d+", problem_id) is None:
        report.issues.append(
            Issue("WARN", "unexpected-problem-id", f"{problem_id}: id does not follow the usual amc_YYYY_LEVEL_N pattern", rel(file_path, repo_root), problem_id)
        )


def validate_file(path: Path, repo_root: Path, check_urls: bool, timeout: float) -> FileReport:
    report = FileReport(path=path)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        report.issues.append(Issue("ERROR", "invalid-json", f"JSON parse failed: {exc}", rel(path, repo_root)))
        return report

    competition_info = data.get("competition_info")
    problems = data.get("problems")

    if not isinstance(competition_info, dict):
        report.issues.append(Issue("ERROR", "missing-competition-info", "competition_info is missing or not an object", rel(path, repo_root)))
        competition_info = {}
    if not isinstance(problems, list):
        report.issues.append(Issue("ERROR", "missing-problems", "problems is missing or not an array", rel(path, repo_root)))
        problems = []

    group = competition_info.get("group")
    year = competition_info.get("year")
    total_problems = competition_info.get("total_problems")
    file_stem = path.stem
    folder_group = path.parent.name if path.parent.name.startswith("AMC_") else None

    if isinstance(group, str) and folder_group and group != folder_group:
        report.issues.append(Issue("WARN", "group-folder-mismatch", f"{path.name}: competition_info.group={group!r} does not match folder {folder_group!r}", rel(path, repo_root)))

    if isinstance(year, int):
        if str(year) not in file_stem:
            report.issues.append(Issue("WARN", "year-filename-mismatch", f"{path.name}: competition year does not appear in the filename", rel(path, repo_root)))
    else:
        report.issues.append(Issue("ERROR", "bad-year", f"{path.name}: competition_info.year must be an int", rel(path, repo_root)))

    if isinstance(total_problems, int) and total_problems != len(problems):
        report.issues.append(Issue("ERROR", "problem-count-mismatch", f"{path.name}: total_problems={total_problems} but problems array has {len(problems)} entries", rel(path, repo_root)))
    elif not isinstance(total_problems, int):
        report.issues.append(Issue("ERROR", "bad-total-problems", f"{path.name}: competition_info.total_problems must be an int", rel(path, repo_root)))

    if file_stem and isinstance(group, str) and group not in file_stem:
        report.issues.append(Issue("WARN", "file-group-mismatch", f"{path.name}: filename does not include competition group {group!r}", rel(path, repo_root)))

    if problems and len(problems) > 0:
        seen_ids: set[str] = set()
        for idx, problem in enumerate(problems):
            if not isinstance(problem, dict):
                report.issues.append(Issue("ERROR", "bad-problem", f"problems[{idx}] is not an object", rel(path, repo_root)))
                continue
            validate_question(
                problem,
                report,
                repo_root,
                check_urls,
                timeout,
                path,
                seen_ids,
                file_stem,
                str(group) if isinstance(group, str) else None,
                folder_group,
            )

    return report


def collect_targets(paths: list[str], repo_root: Path) -> list[Path]:
    if not paths:
        base = repo_root / "backend-java" / "resources" / "math" / "questions"
        return sorted(base.rglob("*.json"))

    targets: list[Path] = []
    for raw in paths:
        p = Path(raw)
        if not p.is_absolute():
            p = (repo_root / p).resolve()
        if p.is_dir():
            targets.extend(sorted(p.rglob("*.json")))
        elif p.is_file():
            targets.append(p)
        else:
            raise SystemExit(f"Path does not exist: {raw}")
    return targets


def print_report(reports: list[FileReport], repo_root: Path) -> int:
    total_errors = 0
    total_warnings = 0
    for report in reports:
        if not report.issues:
            continue
        print(f"\n{rel(report.path, repo_root)}")
        for issue in report.issues:
            total_errors += issue.severity == "ERROR"
            total_warnings += issue.severity == "WARN"
            location = issue.problem_id or ""
            if issue.solution_index is not None:
                location = f"{location} [solution {issue.solution_index + 1}]".strip()
            prefix = f"  {issue.severity}: {issue.code}"
            if location:
                prefix += f" ({location})"
            print(f"{prefix} - {issue.message}")
    print(f"\nSummary: {total_errors} error(s), {total_warnings} warning(s) across {len(reports)} file(s)")
    return 1 if total_errors else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate AMC math resource JSON files for renderability.")
    parser.add_argument("paths", nargs="*", help="Files or directories to validate. Defaults to backend-java/resources/math/questions.")
    parser.add_argument("--check-urls", action="store_true", help="Check remote image URLs for accessibility.")
    parser.add_argument("--timeout", type=float, default=3.0, help="Timeout in seconds for URL checks.")
    args = parser.parse_args()

    repo_root = find_repo_root(Path(__file__).parent)
    targets = collect_targets(args.paths, repo_root)
    if not targets:
        print("No AMC JSON files found.")
        return 0

    reports = [validate_file(path, repo_root, args.check_urls, args.timeout) for path in targets]
    return print_report(reports, repo_root)


if __name__ == "__main__":
    raise SystemExit(main())
