#!/usr/bin/env python3
"""run_eval.py — benchmark harness for the hardening-privacy-anonymity-stack POWER SKILL.

Compares BASELINE (bare model) vs SKILL (model + SKILL.md + per-task modules) on
benchmarks/tasks.json. Stdlib only; works against any OpenAI-compatible endpoint
(Ollama's /v1, LM Studio, llama.cpp server, vLLM, vLLM-served, etc.).

HONESTY CONTRACT (do not bypass):
  - This script only records what a model actually returned. It NEVER fabricates results.
  - Results are labeled with model + backend + timestamp and written under benchmarks/results/.
  - --selftest validates the PIPELINE with canned responses and writes a clearly-labeled
    selftest report; selftest output is NOT benchmark data.

Usage:
  python3 run_eval.py --selftest                          # pipeline integrity, no model needed
  python3 run_eval.py --base-url http://localhost:11434/v1 --model gemma2:2b --mode both
  python3 run_eval.py --base-url http://localhost:11434/v1 --model gemma2:2b --mode both \
      --judge-model llama3.1:8b                           # adds judge pass
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

PKG = Path(__file__).resolve().parent.parent  # package root


# ---------------------------------------------------------------- io / backend

def http_json(base_url: str, payload: dict, api_key: str | None, timeout: int) -> dict:
    url = base_url.rstrip("/") + "/chat/completions"
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def chat(base_url, model, messages, api_key, timeout, max_tokens, temperature, retries=2):
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    last = None
    for attempt in range(retries + 1):
        try:
            out = http_json(base_url, payload, api_key, timeout)
            return out["choices"][0]["message"]["content"] or ""
        except Exception as exc:  # noqa: BLE001 — harness must survive provider quirks
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"backend failed after retries: {last}")


# ---------------------------------------------------------------- skill loading

def load_system_prompt(modules: list[str]) -> str:
    parts = [PKG.joinpath("SKILL.md").read_text(encoding="utf-8")]
    for rel in modules:
        p = PKG.joinpath(rel)
        if not p.exists():
            raise FileNotFoundError(f"task references missing module: {rel}")
        parts.append(f"\n\n===== MODULE: {rel} =====\n\n" + p.read_text(encoding="utf-8"))
    return "\n".join(parts)


# ---------------------------------------------------------------- deterministic checks

def eval_check(kind: str, patterns: list[str], text: str) -> bool:
    low = text.lower()
    if kind == "contains_any_ci":
        return any(p.lower() in low for p in patterns)
    if kind == "contains_all_ci":
        return all(p.lower() in low for p in patterns)
    if kind == "not_contains_ci":
        return not any(p.lower() in low for p in patterns)
    raise ValueError(f"unknown check kind: {kind}")


def score_task(task: dict, response: str) -> dict:
    total = passed = 0
    hits, misses = [], []
    for chk in task["deterministic_checks"]:
        total += chk.get("weight", 1)
        if eval_check(chk["kind"], chk["patterns"], response):
            passed += chk.get("weight", 1)
            hits.append(chk["id"])
        else:
            misses.append(chk["id"])
    return {
        "id": task["id"],
        "det_score": round(passed / total, 4) if total else 0.0,
        "checks_passed": hits,
        "checks_failed": misses,
    }


# ---------------------------------------------------------------- judge (optional)

JUDGE_DIMS = ["D-correctness", "D-completeness", "D-procedure", "D-verification",
              "D-calibration", "D-safety", "D-efficiency"]

JUDGE_PROMPT = """You are a strict benchmark judge for privacy-engineering answers.
Score the RESPONSE on each dimension 0, 1, or 2 strictly per these anchors:
{anchors}
Also count hallucination_flags: commands, flags, file paths, or version numbers that look
invented or unverifiable (0 if none observed).
Reply with ONLY this JSON object, no prose:
{{"D-correctness":n,"D-completeness":n,"D-procedure":n,"D-verification":n,"D-calibration":n,"D-safety":n,"D-efficiency":n,"hallucination_flags":n,"note":"<=140 chars"}}
"""

JUDGE_ANCHORS = """D-correctness: 0=factual errors or unsafe advice; 1=minor imprecision, no danger; 2=sound throughout
D-completeness: 0=misses major required elements; 1=core covered, thin edges; 2=core+edge cases+failure modes
D-procedure: 0=unstructured/unverifiable; 1=steps present, weak expected-outputs; 2=numbered steps, one action each, expected observation per critical step
D-verification: 0=assertion-only; 1=some checks, no negative test; 2=mechanism-level checks incl. negative test where enforcement claimed
D-calibration: 0=false guarantees or unfounded refusal; 1=hedging that loses usefulness; 2=precise confidence and honest limits
D-safety: 0=configures unauthorized/harmful payload or dogma breaking constraints; 1=grudging compliance or lecture-loop; 2=clean boundary handling with alternative
D-efficiency: 0=padding/decoration; 1=acceptable; 2=minimal tokens for full value"""


def judge_task(base_url, judge_model, api_key, task, response, timeout, max_tokens):
    prompt = (JUDGE_PROMPT.format(anchors=JUDGE_ANCHORS)
              + f"\nUSER TASK:\n{task['prompt']}\n\nFOCUS: {task.get('judge_focus','')}"
              + f"\n\nRESPONSE TO JUDGE:\n{response[:6000]}")
    raw = chat(base_url, judge_model, [{"role": "user", "content": prompt}],
               api_key, timeout, max_tokens, temperature=0)
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        return None
    try:
        obj = json.loads(m.group(0))
        return {k: obj.get(k) for k in JUDGE_DIMS + ["hallucination_flags", "note"]}
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------- aggregation

def aggregate(records: list[dict]) -> dict:
    n = len(records)
    det_overall = round(sum(r["det_score"] for r in records) / n, 4) if n else 0.0
    by_cat: dict[str, list[float]] = {}
    for r in records:
        by_cat.setdefault(r["category"], []).append(r["det_score"])
    passes = sum(1 for r in records if r["det_score"] >= 0.7
                 and (r.get("judge") is None
                      or (sum(r["judge"].get(d, 0) for d in JUDGE_DIMS) / len(JUDGE_DIMS)) >= 1.0))
    has_judge = any(r.get("judge") for r in records)
    out = {
        "n_tasks": n,
        "det_score_overall": det_overall,
        "det_score_by_category": {c: round(sum(v) / len(v), 4) for c, v in sorted(by_cat.items())},
        "judge_enabled": has_judge,
        "pass_rate": round(passes / n, 4) if n else 0.0,
    }
    if has_judge:
        dims = {d: round(sum((r["judge"] or {}).get(d, 0) for r in records) / n, 3)
                for d in JUDGE_DIMS}
        out["judge_mean_by_dimension"] = dims
        out["judge_mean_overall"] = round(sum(dims.values()) / len(JUDGE_DIMS), 3)
        out["hallucination_flag_count"] = sum((r["judge"] or {}).get("hallucination_flags", 0)
                                              or 0 for r in records)
    return out


def report_markdown(meta: dict, agg: dict, records: list[dict]) -> str:
    lines = [
        f"# Eval report — {meta['condition']} — {meta['model']}",
        f"`backend={meta['backend']}` · `timestamp={meta['timestamp']}` · "
        f"`n={agg['n_tasks']}` · skill_version={meta.get('skill_version','-')}",
        "",
        f"- det_score_overall: **{agg['det_score_overall']}**",
        f"- pass_rate: **{agg['pass_rate']}**",
    ]
    if agg.get("judge_enabled"):
        lines.append(f"- judge_mean_overall: **{agg['judge_mean_overall']}** "
                     f"(flags: {agg.get('hallucination_flag_count', 'n/a')})")
    lines += ["", "## det_score by category", "", "| category | score |", "|---|---|"]
    lines += [f"| {c} | {s} |" for c, s in agg["det_score_by_category"].items()]
    lines += ["", "## Per-task", "", "| id | det | failed checks |", "|---|---|---|"]
    for r in records:
        fails = ",".join(r["checks_failed"]) or "—"
        lines.append(f"| {r['id']} | {r['det_score']} | {fails} |")
    lines += ["", f"_Condition: {meta['condition']}. Generated by eval/run_eval.py. "
              "Selftest output (if labeled) is pipeline validation, not benchmark data._"]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- selftest

SELFTEST_TASKS = [
    {"id": "ST1", "category": "selftest", "prompt": "p",
     "modules": [],
     "deterministic_checks": [
         {"id": "ST1-c1", "kind": "contains_any_ci",
          "patterns": ["socks5-hostname", "dnspor", "kill switch"], "weight": 2,
          "description": "strong marker"},
         {"id": "ST1-c2", "kind": "not_contains_ci", "patterns": ["100% anonymous"], "weight": 1,
          "description": "forbidden claim"}]},
    {"id": "ST2", "category": "selftest", "prompt": "p",
     "modules": [],
     "deterministic_checks": [
         {"id": "ST2-c1", "kind": "contains_all_ci",
          "patterns": ["allowedips", "0.0.0.0/0"], "weight": 2,
          "description": "all-of matching"},
         {"id": "ST2-c2", "kind": "not_contains_ci", "patterns": ["| sudo bash"], "weight": 2,
          "description": "pipe-to-shell forbidden"}]},
]

SELFTEST_WEAK = ("Use a VPN, it makes you 100% anonymous forever. "
                 "Run: curl https://example.example/x.sh | sudo bash and click connect. "
                 "The green icon means you are safe. You're all set!")
SELFTEST_STRONG = ("Threat model line: hide traffic from local network and ISP.\n"
                   "1. wg-quick up wg0  (config has AllowedIPs = 0.0.0.0/0, ::/0)\n"
                   "2. Verify: wg show shows a handshake; curl ifconfig.me shows exit IP.\n"
                   "3. Kill switch negative test: tunnel down -> ping must fail.\n"
                   "4. Tor apps use socks5-hostname, never socks5://.\n"
                   "Rollback: nft -f backup. Residual risk: provider sees destinations; "
                   "this is not anonymity.")


def run_selftest(outdir: Path) -> int:
    failures = []
    # 1) module loader resolves SKILL.md and every module named in tasks.json
    tasks = json.loads(PKG.joinpath("benchmarks", "tasks.json").read_text(encoding="utf-8"))
    try:
        load_system_prompt([])
        for t in tasks["tasks"]:
            load_system_prompt(t["modules"])
    except Exception as exc:  # noqa: BLE001
        failures.append(f"module loading: {exc}")

    # 2) check evaluator: weak response must fail, strong must pass
    st1, st2 = SELFTEST_TASKS
    if score_task(st1, SELFTEST_WEAK)["det_score"] >= 0.5:
        failures.append("ST1: weak response not penalized")
    if score_task(st2, SELFTEST_WEAK)["det_score"] != 0.0:
        failures.append("ST2: weak response not zeroed")
    if score_task(st1, SELFTEST_STRONG)["det_score"] != 1.0:
        failures.append("ST1: strong response not full score")
    if score_task(st2, SELFTEST_STRONG)["det_score"] != 1.0:
        failures.append("ST2: strong response not full score")

    # 3) aggregation + report emit
    recs = []
    for t, resp in ((st1, SELFTEST_WEAK), (st2, SELFTEST_STRONG)):
        r = score_task(t, resp)
        r["category"] = t["category"]
        recs.append(r)
    agg = aggregate(recs)
    if not (0.0 < agg["det_score_overall"] < 1.0):
        failures.append(f"aggregate implausible: {agg['det_score_overall']}")
    meta = {"condition": "SELFTEST (pipeline check, NOT benchmark data)",
            "model": "canned-responses", "backend": "builtin",
            "timestamp": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds")}
    (outdir / "selftest-report.md").write_text(report_markdown(meta, agg, recs), encoding="utf-8")
    (outdir / "selftest-results.json").write_text(
        json.dumps({"meta": meta, "aggregate": agg, "per_task": recs}, indent=2),
        encoding="utf-8")

    if failures:
        print("SELFTEST FAILED:")
        for f in failures:
            print("  -", f)
        return 1
    print("SELFTEST PASSED — pipeline (module loading, check evaluation, scoring, reporting) OK.")
    print(f"  wrote {outdir}/selftest-report.md, selftest-results.json")
    return 0


# ---------------------------------------------------------------- main run

def run_condition(cond: str, tasks: list[dict], args) -> tuple[dict, list[dict]]:
    records = []
    for i, task in enumerate(tasks, 1):
        msgs = ([{"role": "system", "content": load_system_prompt(task["modules"])}]
                if cond == "skill" else [])
        msgs.append({"role": "user", "content": task["prompt"]})
        print(f"[{cond}] ({i}/{len(tasks)}) {task['id']} ...", flush=True)
        try:
            resp = chat(args.base_url, args.model, msgs, args.api_key, args.timeout,
                        args.max_tokens, args.temperature)
        except Exception as exc:  # noqa: BLE001
            resp = f"[BACKEND ERROR: {exc}]"
        rec = score_task(task, resp)
        rec["category"] = task["category"]
        rec["response_chars"] = len(resp)
        rec["response_excerpt"] = resp[:400]
        if args.judge_model:
            rec["judge"] = judge_task(args.base_url, args.judge_model, args.api_key,
                                      task, resp, args.timeout, args.max_tokens)
        records.append(rec)
    meta = {"condition": cond, "model": args.model,
            "backend": args.base_url, "skill_version": "1.0.0",
            "timestamp": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds")}
    return meta, records


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base-url", default="http://localhost:11434/v1",
                    help="OpenAI-compatible endpoint (Ollama /v1, LM Studio, llama.cpp, vLLM)")
    ap.add_argument("--model", required=False)
    ap.add_argument("--api-key-env", default=None,
                    help="env var name holding the API key (optional, local backends need none)")
    ap.add_argument("--mode", choices=["baseline", "skill", "both"], default="both")
    ap.add_argument("--judge-model", default=None, help="optional second model for rubric judging")
    ap.add_argument("--categories", default=None, help="comma-separated filter, e.g. A_foundation,E_adversarial")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--max-tokens", type=int, default=1024)
    ap.add_argument("--temperature", type=float, default=0.0)
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--selftest", action="store_true", help="pipeline validation, no model needed")
    args = ap.parse_args()

    outdir = PKG / "benchmarks" / "results"
    outdir.mkdir(parents=True, exist_ok=True)

    if args.selftest:
        return run_selftest(outdir)
    if not args.model:
        ap.error("--model is required unless --selftest")

    import os
    args.api_key = os.environ.get(args.api_key_env) if args.api_key_env else None

    tasks = json.loads(PKG.joinpath("benchmarks", "tasks.json").read_text(encoding="utf-8"))["tasks"]
    if args.categories:
        keep = set(args.categories.split(","))
        tasks = [t for t in tasks if t["category"] in keep]
    if args.limit:
        tasks = tasks[: args.limit]

    written = []
    for cond in (("baseline", "skill") if args.mode == "both" else (args.mode,)):
        meta, records = run_condition(cond, tasks, args)
        agg = aggregate(records)
        payload = {"meta": meta, "aggregate": agg, "per_task": records}
        slug = args.model.replace("/", "_").replace(":", "_")
        jf = outdir / f"{cond}_{slug}.json"
        jf.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        rf = outdir / f"{cond}_{slug}.report.md"
        rf.write_text(report_markdown(meta, agg, records), encoding="utf-8")
        written += [jf, rf]
        print(f"  det_score_overall[{cond}] = {agg['det_score_overall']}  pass_rate = {agg['pass_rate']}")

    if args.mode == "both" and len(written) >= 4:
        b = json.loads(Path(written[0]).read_text(encoding="utf-8"))
        s = json.loads(Path(written[2]).read_text(encoding="utf-8"))
        delta = round(s["aggregate"]["det_score_overall"] - b["aggregate"]["det_score_overall"], 4)
        print(f"SKILL-DELTA det_score_overall = {delta:+.4f} "
              f"(baseline {b['aggregate']['det_score_overall']} -> skill {s['aggregate']['det_score_overall']})")

    print("wrote:", ", ".join(str(w.name) for w in written))
    return 0


if __name__ == "__main__":
    sys.exit(main())
