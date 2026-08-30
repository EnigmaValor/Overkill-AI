#!/usr/bin/env python3
"""validate_package.py — deterministic regression suite for the POWER SKILL package.

Runnable anywhere (stdlib only). Non-zero exit = package broken. This is the skill's own
quality gate made executable:
  1. required files present, non-empty
  2. SKILL.md frontmatter contract (name; description starts with 'Use when')
  3. all JSON files parse; tasks.json >= 18 tasks, ids unique, categories cover A..J,
     every task has >= 1 deterministic check with a known kind
  4. every module path referenced by tasks/SKILL.md exists on disk
  5. relative markdown links resolve
  6. no placeholders (TODO/FIXME/TBD/lorem/'[INSERT'/implement-later)
  7. eval scripts byte-compile
"""
from __future__ import annotations

import json
import py_compile
import re
import sys
from pathlib import Path

PKG = Path(__file__).resolve().parent.parent

REQUIRED = [
    "SKILL.md", "CHANGELOG.md",
    "knowledge/fundamentals.md", "knowledge/tool-reference.md",
    "knowledge/layered-architectures.md", "knowledge/expert-patterns.md",
    "knowledge/edge-cases.md",
    "procedures/primary-workflow.md", "procedures/setup-workflow.md",
    "procedures/verification-workflow.md", "procedures/diagnostic-workflow.md",
    "procedures/recovery-workflow.md",
    "decision-trees/routing.md", "decision-trees/stack-selection.md",
    "decision-trees/escalation.md",
    "patterns/positive-patterns.md", "patterns/anti-patterns.md",
    "patterns/expert-heuristics.md",
    "failure-modes/common-failures.md", "failure-modes/deceptive-failures.md",
    "failure-modes/recovery-matrix.md",
    "examples/excellent.md", "examples/acceptable.md", "examples/bad.md",
    "examples/adversarial.md",
    "verification/quality-gates.md", "verification/self-check.md",
    "verification/invariants.md",
    "benchmarks/tasks.json", "benchmarks/scoring.md",
    "benchmarks/baseline.json", "benchmarks/skill_eval.json",
    "eval/run_eval.py", "eval/validate_package.py", "eval/README.md",
    "pressure-tests/pressure-tests.md",
    "routing/related-skills.md",
    "references/verification-commands.md",
]

PLACEHOLDER_RE = re.compile(r"TODO|FIXME|XXX\b|TBD|lorem|\[INSERT|implement later|and so on\.",
                            re.IGNORECASE)
# files where placeholder-shaped tokens legitimately appear: the JSON stubs describe the
# honesty contract in prose, and this file contains the detection pattern itself.
PLACEHOLDER_ALLOW = {"benchmarks/baseline.json", "benchmarks/skill_eval.json",
                     "eval/validate_package.py"}
KINDS = {"contains_any_ci", "contains_all_ci", "not_contains_ci"}

failures: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


# 1 — required files, non-empty
for rel in REQUIRED:
    p = PKG / rel
    if not p.exists():
        fail(f"missing file: {rel}")
    elif p.stat().st_size == 0:
        fail(f"empty file: {rel}")

# 2 — SKILL.md frontmatter contract
skill_txt = (PKG / "SKILL.md").read_text(encoding="utf-8")
m = re.match(r"^---\n(.*?)\n---\n", skill_txt, re.S)
if not m:
    fail("SKILL.md: no frontmatter block")
else:
    fm = m.group(1)
    if not re.search(r"^name:\s*\S", fm, re.M):
        fail("SKILL.md frontmatter: missing name")
    if not re.search(r"^description:\s*Use when", fm, re.M | re.I):
        fail("SKILL.md frontmatter: description must start with 'Use when'")

# 3 — JSON validity + task suite integrity
tasks_doc = json.loads((PKG / "benchmarks" / "tasks.json").read_text(encoding="utf-8"))
tasks = tasks_doc["tasks"]
if len(tasks) < 18:
    fail(f"tasks.json: only {len(tasks)} tasks (<18)")
ids = [t["id"] for t in tasks]
if len(ids) != len(set(ids)):
    fail("tasks.json: duplicate task ids")
cats = {t["category"] for t in tasks}
letters = {c.split("_", 1)[0] for c in cats}
if not {c[0] for c in "ABCDEFGHIJ"}.issubset(letters):
    fail(f"tasks.json: categories missing letters (have {sorted(letters)})")
for t in tasks:
    if not t.get("deterministic_checks"):
        fail(f"task {t['id']}: no deterministic checks")
    for chk in t["deterministic_checks"]:
        if chk["kind"] not in KINDS:
            fail(f"task {t['id']}/{chk['id']}: unknown kind {chk['kind']}")
        if not chk.get("patterns"):
            fail(f"task {t['id']}/{chk['id']}: no patterns")
    for mod in t.get("modules", []):
        if not (PKG / mod).exists():
            fail(f"task {t['id']}: module not on disk: {mod}")
for jf in ("benchmarks/baseline.json", "benchmarks/skill_eval.json"):
    doc = json.loads((PKG / jf).read_text(encoding="utf-8"))
    if doc.get("status") != "NOT_RUN" or doc.get("results") is not None:
        fail(f"{jf}: must remain NOT_RUN/null until a real run (honesty contract)")

# 4 — every .md path mentioned in SKILL.md exists
for rel in set(re.findall(r"((?:knowledge|procedures|decision-trees|patterns|failure-modes|"
                          r"examples|verification|benchmarks|pressure-tests|routing|references)/[\w-]+\.md)",
                          skill_txt)):
    if not (PKG / rel).exists():
        fail(f"SKILL.md references missing module: {rel}")

# 5 — relative markdown links resolve
for md in PKG.rglob("*.md"):
    for target in re.findall(r"\]\((?!https?://|#|mailto:)([^)\s]+)\)", md.read_text(encoding="utf-8")):
        resolved = (md.parent / target.split("#")[0]).resolve()
        if not resolved.exists():
            fail(f"{md.relative_to(PKG)}: broken link -> {target}")

# 6 — placeholder scan
for f in PKG.rglob("*"):
    if not f.is_file() or f.suffix.lower() not in {".md", ".py", ".json", ".toml", ".txt"}:
        continue
    rel = f.relative_to(PKG).as_posix()
    if rel in PLACEHOLDER_ALLOW or rel.startswith("benchmarks/results/"):
        continue
    text = f.read_text(encoding="utf-8", errors="replace")
    m2 = PLACEHOLDER_RE.search(text)
    if m2:
        fail(f"placeholder token '{m2.group(0)}' in {rel}")

# 7 — eval scripts compile
for script in ("eval/run_eval.py", "eval/validate_package.py"):
    try:
        py_compile.compile(str(PKG / script), doraise=True)
    except py_compile.PyCompileError as exc:
        fail(f"compile error {script}: {exc}")

# ---- summary
md_count = len(list(PKG.rglob("*.md")))
total = len(list(p for p in PKG.rglob("*") if p.is_file()))
print(f"package: {PKG.name} — {total} files ({md_count} markdown)")
print(f"checks: 7 groups | tasks: {len(tasks)} in {len(cats)} categories")
if failures:
    print(f"\nFAIL ({len(failures)}):")
    for f_ in failures:
        print("  -", f_)
    sys.exit(1)
print("\nPASS — package structurally valid, placeholders absent, suite integrity OK.")
sys.exit(0)
