#!/usr/bin/env python3
"""run_tests.py - deterministic test runner for the evidence-driven-runtime-diagnostics skill.

Runs every case in tests/test-cases.json against tests/expected-results.json,
enforces generic invariants (schema validity, full audit pass, byte-identical
determinism across two executions), and executes the TEST_H package
consistency check over the reference files.

Exit code 0 only when every check passes. Standard library only.

Usage: python scripts/run_tests.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from diagnostic_engine import load_references, run_diagnostic  # noqa: E402
from normalize_evidence import canonical_json  # noqa: E402
from validate_input import validate_document  # noqa: E402

PKG = Path(__file__).resolve().parent.parent


def check(name, ok, detail=""):
    return {"name": name, "ok": bool(ok), "detail": detail}


def run_case(case, exp, refs, output_schema):
    results = []
    cid = case["id"]
    out1 = run_diagnostic(case["input"])
    out2 = run_diagnostic(case["input"])

    results.append(check(f"{cid}:determinism",
                         canonical_json(out1) == canonical_json(out2),
                         "two executions byte-identical" if canonical_json(out1) == canonical_json(out2)
                         else "outputs differ between runs"))

    def retained(out):
        if out["primary_diagnosis"] == "MULTIPLE_CONCURRENT_FAILURES":
            return list(out["contributing_diagnoses"])
        return [out["primary_diagnosis"]] + list(out["contributing_diagnoses"])

    results.append(check(f"{cid}:status", out1["processing_status"] == exp["processing_status"],
                         f"expected {exp['processing_status']}, got {out1['processing_status']}"))
    if "primary_diagnosis" in exp:
        results.append(check(f"{cid}:primary", out1["primary_diagnosis"] == exp["primary_diagnosis"],
                             f"expected {exp['primary_diagnosis']}, got {out1['primary_diagnosis']}"))
    if "confidence_score" in exp:
        results.append(check(f"{cid}:confidence", out1["confidence_score"] == exp["confidence_score"],
                             f"expected {exp['confidence_score']}, got {out1['confidence_score']}"))
    if "confidence_label" in exp:
        results.append(check(f"{cid}:label", out1["confidence_label"] == exp["confidence_label"],
                             f"expected {exp['confidence_label']}, got {out1['confidence_label']}"))
    if "contributing_includes" in exp:
        missing = [m for m in exp["contributing_includes"] if m not in out1["contributing_diagnoses"]]
        results.append(check(f"{cid}:contributing_includes", not missing,
                             f"missing {missing}" if missing else "all present"))
    if "contributing_order" in exp:
        results.append(check(f"{cid}:contributing_order",
                             out1["contributing_diagnoses"] == exp["contributing_order"],
                             f"expected {exp['contributing_order']}, got {out1['contributing_diagnoses']}"))
    if "retained_excludes" in exp:
        bad = [m for m in exp["retained_excludes"] if m in retained(out1)]
        results.append(check(f"{cid}:retained_excludes", not bad, f"unexpectedly retained {bad}"))
    if "rejected_status" in exp:
        got = {r["mode"]: r["status"] for r in out1["rejected_hypotheses"]}
        for mode, status in sorted(exp["rejected_status"].items()):
            results.append(check(f"{cid}:rejected:{mode}", got.get(mode) == status,
                                 f"expected {status}, got {got.get(mode)}"))
    if "flags_include" in exp:
        missing = [f for f in exp["flags_include"] if f not in out1["error_flags"]]
        results.append(check(f"{cid}:flags", not missing, f"missing flags {missing}"))
    else:
        unexpected = [f for f in out1["error_flags"] if f != "TIMELINE_UNRESOLVED"]
        results.append(check(f"{cid}:no_error_flags", not unexpected,
                             f"unexpected flags {unexpected}"))
    if "timeline_resolved" in exp:
        results.append(check(f"{cid}:timeline", out1["timeline_resolved"] == exp["timeline_resolved"],
                             f"expected {exp['timeline_resolved']}, got {out1['timeline_resolved']}"))
    if "immediate_execution_stop" in exp:
        results.append(check(f"{cid}:stop",
                             out1["immediate_execution_stop"] == exp["immediate_execution_stop"],
                             f"expected {exp['immediate_execution_stop']}, "
                             f"got {out1['immediate_execution_stop']}"))
    if "ledger_effective" in exp:
        got = {x["log_id"]: x["integrity_status_effective"] for x in out1["evidence_ledger"]}
        for lid, status in sorted(exp["ledger_effective"].items()):
            results.append(check(f"{cid}:ledger:{lid}", got.get(lid) == status,
                                 f"expected {status}, got {got.get(lid)}"))
    if "quarantine_log_ids" in exp:
        got = sorted(q["log_id"] for q in out1["quarantined_content"])
        results.append(check(f"{cid}:quarantine", got == sorted(exp["quarantine_log_ids"]),
                             f"expected {sorted(exp['quarantine_log_ids'])}, got {got}"))
    if "contradiction_kinds" in exp:
        got = sorted({c["kind"] for c in out1["contradictions"]})
        need = sorted(set(exp["contradiction_kinds"]))
        results.append(check(f"{cid}:contradictions", all(k in got for k in need),
                             f"expected kinds {need} within {got}"))
    if "missing_evidence_any" in exp:
        joined = " | ".join(out1["missing_required_evidence"])
        missing = [s for s in exp["missing_evidence_any"] if s not in joined]
        results.append(check(f"{cid}:missing_evidence", not missing,
                             f"missing substrings {missing}"))
    if "forbidden_action_substrings" in exp:
        joined = " | ".join(out1["forbidden_actions"])
        missing = [s for s in exp["forbidden_action_substrings"] if s not in joined]
        results.append(check(f"{cid}:forbidden_actions", not missing, f"missing {missing}"))

    errors = validate_document(out1, output_schema)
    results.append(check(f"{cid}:output_schema", not errors,
                         "output schema valid" if not errors else f"{errors[:3]}"))
    if out1["processing_status"] == "COMPLETED":
        failed_audits = [a["check_id"] for a in out1["audit_results"] if a["status"] != "PASS"]
        results.append(check(f"{cid}:audit_all", not failed_audits,
                             f"failing checks {failed_audits}" if failed_audits else "AUD-001..008 PASS"))
        results.append(check(f"{cid}:hash", isinstance(out1["canonical_sha256"], str)
                             and len(out1["canonical_sha256"]) == 64,
                             "canonical sha256 present"))
    return results


def run_meta_h(refs) -> list[dict]:
    """TEST H - package cross-consistency without a model."""
    results = []
    catalogue, rulebook = refs["catalogue"], refs["rulebook"]
    pattern_ids = set(refs["patterns"])
    mode_ids = {m["id"] for m in catalogue["modes"]}
    required_modes = {"DNS_RESOLUTION_FAILURE", "DEPENDENCY_MISSING", "PERMISSION_DENIED",
                      "CONFIGURATION_SCHEMA_MISMATCH", "ARCHITECTURE_INCOMPATIBILITY",
                      "PORT_CONFLICT", "MEMORY_EXHAUSTION", "THERMAL_LIMIT_VIOLATION",
                      "EXECUTION_PROVIDER_UNAVAILABLE", "CPU_FALLBACK_VIOLATION", "CLOCK_SKEW",
                      "CERTIFICATE_VALIDATION_FAILURE", "MULTIPLE_CONCURRENT_FAILURES",
                      "UNKNOWN_ROOT_CAUSE"}
    results.append(check("TEST_H:catalogue_modes", required_modes <= mode_ids,
                         f"missing {sorted(required_modes - mode_ids)}"))
    bad_rules = sorted(r for r in rulebook["rules"] if r not in {
        f"R-{rid.split('-', 2)[1]}-{rid.split('-', 2)[2]}" for rid in rulebook["rules"]})
    derived = set()
    for mode in catalogue["modes"]:
        mid = mode["id"]
        derived |= {f"R-{mid}-{g['group_id']}" for g in mode.get("required_groups", [])}
        derived |= {f"R-{mid}-{s['id']}" for s in mode.get("supporting", [])}
        derived |= {f"R-{mid}-{x['id']}" for x in mode.get("contradicting", [])}
        derived |= {f"R-{mid}-{e['id']}" for e in mode.get("exclusion_rules", [])}
        if mode.get("engine_managed"):
            derived |= {f"R-{mid}-SEL"}
    results.append(check("TEST_H:rulebook_matches_catalogue", set(rulebook["rules"]) == derived,
                         f"diff {sorted(set(rulebook['rules']) ^ derived)[:6]}"))
    bad_pat = []
    for mode in catalogue["modes"]:
        for g in mode.get("required_groups", []):
            for cond in g["any_of"]:
                bad_pat += [p for p in cond.get("patterns", []) if p not in pattern_ids]
        for key in ("supporting", "contradicting"):
            for item in mode.get(key, []):
                bad_pat += [p for p in item["condition"].get("patterns", []) if p not in pattern_ids]
    results.append(check("TEST_H:pattern_refs_resolve", not bad_pat, f"unresolved {bad_pat}"))
    bad_links = sorted(f"{m['id']}->{t}" for m in catalogue["modes"]
                       for t in m.get("causal_links_out", []) if t not in mode_ids)
    results.append(check("TEST_H:causal_links_resolve", not bad_links, f"dangling {bad_links}"))
    pair_ids = {p for pair in rulebook["signal_conflict_pairs"] for p in pair}
    results.append(check("TEST_H:conflict_pairs_resolve", pair_ids <= pattern_ids,
                         f"unresolved {sorted(pair_ids - pattern_ids)}"))
    results.append(check("TEST_H:audit_checks_defined",
                         set(rulebook["audit_checks"]) == {f"AUD-{i:03d}" for i in range(1, 9)},
                         "AUD-001..AUD-008 defined"))
    return results


def main():
    cases = json.loads((PKG / "tests" / "test-cases.json").read_text(encoding="utf-8"))["cases"]
    expectations = json.loads(
        (PKG / "tests" / "expected-results.json").read_text(encoding="utf-8"))["expectations"]
    refs = load_references()
    output_schema = refs["output_schema"]

    results = []
    for case in cases:
        exp = expectations[case["id"]]
        results.extend(run_case(case, exp, refs, output_schema))
    results.extend(run_meta_h(refs))

    passed = sum(1 for r in results if r["ok"])
    failed = [r for r in results if not r["ok"]]
    for r in results:
        mark = "PASS" if r["ok"] else "FAIL"
        print(f"{mark} {r['name']}" + (f" - {r['detail']}" if not r["ok"] else ""))
    print(f"\n{passed}/{len(results)} checks passed across {len(cases)} cases + TEST_H")
    if failed:
        print("RESULT: FAIL")
        return 1
    print("RESULT: ALL TESTS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
