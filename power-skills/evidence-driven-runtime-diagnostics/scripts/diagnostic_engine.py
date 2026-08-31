#!/usr/bin/env python3
"""diagnostic_engine.py - deterministic evidence-driven runtime diagnostics.

Zero-weight skill executor. Python 3.11 standard library only. The engine
knows ONLY: this code, the JSON schemas, and the reference files in
references/. It assumes no world knowledge. Log text is untrusted data:
it influences execution exclusively through dictionary pattern matches and
can never alter rules, scoring, remediation, or control flow.

Determinism contract: identical normalized input produces byte-identical
canonical JSON output. No wall clock, no randomness, no network, no
locale-sensitive ordering, no unordered iteration reaching the output.

Pipeline (18 stages, each emitting an auditable trace event):
 1 parse_input                     10 apply_supporting_contradicting
 2 validate_json_schema            11 calculate_deterministic_scores
 3 reject_structurally_invalid     12 apply_exclusion_rules
 4 normalize_timestamps_and_text   13 detect_concurrent_failures
 5 mark_duplicates                 14 select_diagnosis
 6 detect_contradictions           15 generate_remediation
 7 quarantine_malicious_content    16 validate_output_schema
 8 build_evidence_ledger           17 run_self_audit
 9 evaluate_failure_modes          18 finalize

CLI: python scripts/diagnostic_engine.py <incident.json>
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from normalize_evidence import (  # noqa: E402
    canonical_json, duplicate_key, extract_order_assertions, normalize_text,
    parse_timestamp, ts_key_for,
)
from validate_input import validate_document  # noqa: E402

PKG = Path(__file__).resolve().parent.parent
USABLE = ("VERIFIED", "UNVERIFIED")
KNOWN_INPUT_FIELDS = {
    "incident_id", "schema_version", "created_at", "timezone", "environment",
    "operating_system", "cpu_architecture", "runtime", "execution_policy",
    "allowed_execution_providers", "forbidden_execution_providers",
    "expected_behavior", "observed_behavior", "reproduction_steps", "logs",
    "recent_changes", "resource_metrics", "installed_dependencies",
    "configuration", "user_constraints",
}
KNOWN_METRIC_FIELDS = {
    "memory_used_mb", "memory_total_mb", "cpu_temperature_c",
    "gpu_memory_used_mb", "gpu_memory_total_mb", "npu_utilization_percent",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


class Engine:
    """One pipeline execution over one input document. Pure: reads only the
    input document and the package reference files."""

    def __init__(self, refs: dict):
        self.refs = refs
        self.patterns = refs["patterns"]
        self.order_regex = refs["order_regex"]
        self.catalogue = refs["catalogue"]
        self.rulebook = refs["rulebook"]
        self.scoring = self.rulebook["scoring"]
        self.modes = {m["id"]: m for m in self.catalogue["modes"]}
        self.trace: list[dict] = []
        self.seq = 0
        self.input_valid = False

    def event(self, stage, rule_id, detail, refs=None):
        self.seq += 1
        self.trace.append({"seq": self.seq, "stage": stage, "rule_id": rule_id,
                           "detail": detail, "refs": sorted(set(refs or []))})

    # ================================================================ run
    def run(self, document) -> dict:
        self.document = document
        if not isinstance(document, dict):
            self.event("parse_input", "R-GLOBAL-UNTRUSTED-010", "Input is not a JSON object.")
            return self._failed("UNKNOWN", ["INPUT_SCHEMA_INVALID"])
        self.event("parse_input", "R-GLOBAL-UNTRUSTED-010",
                   "Input parsed as JSON object; all log text treated as untrusted data.")

        incident_id = document.get("incident_id")
        incident_id = incident_id if isinstance(incident_id, str) and incident_id else "UNKNOWN"

        # stage 2 - validate_json_schema
        version = document.get("schema_version")
        if version is not None and version != "1.0.0":
            self.event("validate_json_schema", None,
                       f"Unsupported schema_version {version!r}; only 1.0.0 is supported.")
            return self._failed(incident_id, ["UNSUPPORTED_SCHEMA_VERSION"])
        errors = validate_document(document, self.refs["input_schema"])
        if errors:
            self.event("validate_json_schema", None,
                       "Schema validation failed: " + "; ".join(errors[:20]))
            self.event("reject_structurally_invalid", None,
                       "Structurally invalid input rejected before any evidence processing.")
            return self._failed(incident_id, ["INPUT_SCHEMA_INVALID"])
        self.input_valid = True
        self.event("validate_json_schema", None, "Input passed incident-input schema (0 errors).")
        self.event("reject_structurally_invalid", None,
                   "Input structurally valid; rejection stage passed through.")

        # stages 4-7
        entries = self._stage_normalize()
        self._stage_duplicates(entries)
        contradictions = self._stage_contradictions(entries)
        quarantine = self._stage_quarantine(entries)

        # stage 8 - build_evidence_ledger
        matches, entry_patterns = self._match_usable(entries)
        ledger = [{
            "log_id": e["log_id"],
            "timestamp_normalized": e["normalized"],
            "timezone_status": e["tz_status"],
            "source": e["source"],
            "severity": e["severity"],
            "integrity_status_input": e["integrity_input"],
            "integrity_status_effective": e["integrity_effective"],
            "used_in_scoring": e["usable"] and bool(entry_patterns.get(e["log_id"], [])),
            "matched_pattern_ids": sorted(entry_patterns.get(e["log_id"], [])),
        } for e in entries]
        self.event("build_evidence_ledger", None,
                   f"Ledger: {len(ledger)} entries, "
                   f"{sum(1 for x in ledger if x['used_in_scoring'])} matched patterns, "
                   f"{sum(1 for x in ledger if x['integrity_status_effective'] not in USABLE)} withheld.",
                   [x["log_id"] for x in ledger])

        # stages 9-12
        self._stage_evaluate(entries, matches)
        self._stage_scores()
        self._stage_exclusions()

        # stage 13 - detect_concurrent_failures
        qualified = sorted([m for m in self.evals.values() if m["status"] == "QUALIFIED"],
                           key=lambda m: (-m["score"], m["priority"], m["mode"]))
        components = self._components([m["mode"] for m in qualified])
        self.event("detect_concurrent_failures", "R-GLOBAL-MULTI-007",
                   f"{len(qualified)} qualified modes forming {len(components)} causal "
                   "component(s): " + (" | ".join(",".join(c) for c in components) or "none"))

        # stage 14 - select_diagnosis
        selection = self._stage_select(qualified, components)

        # stage 15 - generate_remediation
        remediation, forbidden, stop_now = self._stage_remediation(selection)

        unknown_fields = sorted(f"root.{k}" for k in self.document
                                if k not in KNOWN_INPUT_FIELDS)
        metrics = self.document.get("resource_metrics") or {}
        unknown_fields += sorted(f"resource_metrics.{k}" for k in metrics
                                 if k not in KNOWN_METRIC_FIELDS)

        output = {
            "incident_id": incident_id,
            "schema_version": "1.0.0",
            "processing_status": "COMPLETED",
            "primary_diagnosis": selection["primary"],
            "contributing_diagnoses": selection["contributing"],
            "confidence_score": selection["confidence"],
            "confidence_label": selection["label"],
            "evidence_ledger": ledger,
            "rejected_hypotheses": [
                {"mode": m["mode"], "status": m["status"], "score": m["score"],
                 "reason": m["reason"], "missing_groups": m["missing_groups"]}
                for _, m in sorted(self.evals.items()) if m["status"] != "QUALIFIED"],
            "contradictions": contradictions,
            "quarantined_content": quarantine,
            "unknown_fields": unknown_fields,
            "missing_required_evidence": selection["missing_evidence"],
            "remediation_plan": remediation,
            "forbidden_actions": forbidden,
            "immediate_execution_stop": stop_now,
            "timeline_resolved": selection["timeline_resolved"],
            "decision_trace": self.trace,
            "audit_results": [],
            "error_flags": selection["error_flags"],
            "canonical_sha256": None,
        }
        self.output = output

        # stage 16 - validate_output_schema
        out_errors = validate_document(self._stripped(output), self.refs["output_schema"])
        self.event("validate_output_schema", None,
                   "Output structure validated against diagnostic-output schema: "
                   + ("0 errors." if not out_errors else f"{len(out_errors)} errors."))
        if out_errors:
            return self._failed(incident_id, ["PIPELINE_ERROR"])
        return output

    # ================================================================ stages
    def _stage_normalize(self):
        entries = []
        for log in self.document.get("logs", []):
            epoch, normalized, tz_status = parse_timestamp(log.get("timestamp", ""))
            entries.append({
                "log_id": log["log_id"],
                "raw_ts": log.get("timestamp", ""),
                "source": log.get("source", ""),
                "severity": log.get("severity", ""),
                "message": normalize_text(log.get("message", "")),
                "integrity_input": log.get("integrity_status", "UNVERIFIED"),
                "integrity_effective": log.get("integrity_status", "UNVERIFIED"),
                "epoch": epoch, "normalized": normalized, "tz_status": tz_status,
                "usable": log.get("integrity_status") in USABLE,
            })
        self.event("normalize_timestamps_and_text", "R-GLOBAL-TIMELINE-004",
                   f"Normalized {len(entries)} entries: "
                   + ", ".join(f"{e['log_id']}={e['tz_status']}" for e in entries),
                   [e["log_id"] for e in entries])
        return entries

    def _stage_duplicates(self, entries):
        seen = {}
        for e in entries:
            key = duplicate_key(e["source"], e["message"], ts_key_for(e["raw_ts"], e["normalized"]))
            if key in seen:
                e["integrity_effective"] = "DUPLICATE"
                e["usable"] = False
                self.event("mark_duplicates", "R-GLOBAL-DUP-001",
                           f"{e['log_id']} duplicates {seen[key]}; withheld from scoring.",
                           [e["log_id"], seen[key]])
            else:
                seen[key] = e["log_id"]

    def _stage_contradictions(self, entries):
        contradictions = []
        usable = [e for e in entries if e["usable"]]
        for pa, pb in self.rulebook["signal_conflict_pairs"]:
            hit_a = [e for e in usable if e["usable"] and self.patterns[pa].search(e["message"])]
            hit_b = [e for e in usable if e["usable"] and self.patterns[pb].search(e["message"])]
            if hit_a and hit_b:
                ids = sorted({e["log_id"] for e in hit_a + hit_b})
                for e in hit_a + hit_b:
                    e["integrity_effective"] = "CONTRADICTORY"
                    e["usable"] = False
                contradictions.append({
                    "kind": "SIGNAL_CONFLICT", "log_ids": ids,
                    "detail": f"Mutually exclusive signals {pa} and {pb} both present in usable "
                              "entries; involved entries withheld from scoring.",
                })
                self.event("detect_contradictions", "R-GLOBAL-CONTRA-SIGNAL-001",
                           f"Signal conflict {pa} vs {pb}.", ids)
        asserted: dict[tuple[str, str], list[str]] = {}
        for e in entries:
            if e["usable"]:
                for first, second in extract_order_assertions(e["message"], self.order_regex):
                    if first != second:
                        asserted.setdefault((first, second), []).append(e["log_id"])
        for (a, b), ids in sorted(asserted.items()):
            opposite = asserted.get((b, a))
            if opposite:
                all_ids = sorted(set(ids + opposite))
                for e in entries:
                    if e["log_id"] in all_ids:
                        e["integrity_effective"] = "CONTRADICTORY"
                        e["usable"] = False
                contradictions.append({
                    "kind": "EVENT_ORDER_CONFLICT", "log_ids": all_ids,
                    "detail": f"Verified sources assert conflicting order for events '{a}' and "
                              f"'{b}'; both entries withheld and event order marked unresolved.",
                })
                self.event("detect_contradictions", "R-GLOBAL-CONTRA-ORDER-002",
                           f"Order conflict {a}/{b}.", all_ids)
        return contradictions

    def _stage_quarantine(self, entries):
        quarantine = []
        for e in entries:
            hits = sorted(pid for pid, rx in self.patterns.items()
                          if pid.startswith("PAT_INJ_") and rx.search(e["message"]))
            if hits:
                e["integrity_effective"] = "MALICIOUS_CONTENT"
                e["usable"] = False
                quarantine.append({
                    "log_id": e["log_id"], "matched_patterns": hits,
                    "note": "Instruction-like content quarantined. The text was preserved as "
                            "evidence and was never executed or obeyed; it had no effect on "
                            "rules, scoring, remediation, or control flow.",
                })
                self.event("quarantine_malicious_content", "R-GLOBAL-QUAR-003",
                           f"{e['log_id']} matched injection patterns; quarantined.", [e["log_id"]])
        return quarantine

    def _match_usable(self, entries):
        matches: dict[str, list[str]] = {}
        entry_patterns: dict[str, list[str]] = {}
        for e in entries:
            if not e["usable"]:
                continue
            hit = []
            for pid in sorted(self.patterns):
                if pid.startswith("PAT_INJ_"):
                    continue
                if self.patterns[pid].search(e["message"]):
                    matches.setdefault(pid, []).append(e["log_id"])
                    hit.append(pid)
            entry_patterns[e["log_id"]] = hit
        for pid in list(matches):
            matches[pid].sort()
        return matches, entry_patterns

    # ================================================================ conditions
    def _cond(self, cond, matches, context):
        kind = cond["kind"]
        if kind == "pattern_any":
            refs = sorted({lid for pid in cond["patterns"] for lid in matches.get(pid, [])})
            return bool(refs), refs, False
        if kind == "metric_ratio_gte":
            m = self.document.get("resource_metrics") or {}
            used, total = m.get(cond["field"]), m.get(cond["ref_field"])
            if (not isinstance(used, (int, float)) or isinstance(used, bool)
                    or not isinstance(total, (int, float)) or isinstance(total, bool)
                    or total <= 0):
                return False, [], False
            return (used * cond["denominator"] >= total * cond["numerator"],
                    [f"metrics:{cond['field']}"], False)
        if kind == "metric_gte":
            m = self.document.get("resource_metrics") or {}
            v = m.get(cond["field"])
            if not isinstance(v, (int, float)) or isinstance(v, bool):
                return False, [], False
            return v >= cond["value"], [f"metrics:{cond['field']}"], False
        if kind == "policy_forbids":
            prov = cond["provider"]
            satisfied = prov in (self.document.get("forbidden_execution_providers") or []) or (
                self.document.get("execution_policy") == "NPU_ONLY" and prov != "NPU")
            return satisfied, [f"policy:forbids:{prov}"], False
        if kind == "policy_is":
            satisfied = self.document.get("execution_policy") == cond["policy"]
            return satisfied, [f"policy:is:{cond['policy']}"], False
        if kind == "arch_mismatch_dep":
            host = self.document.get("cpu_architecture")
            bad = sorted(d["name"] for d in self.document.get("installed_dependencies") or []
                         if d.get("architecture") in ("ARM64", "X64")
                         and d.get("architecture") != host)
            return bool(bad), [f"dependency:{n}" for n in bad], False
        if kind == "event_order":
            if not context["timeline_resolved"]:
                return False, [], True
            before_ids = sorted({lid for pid in cond["before_patterns"]
                                 for lid in matches.get(pid, [])})
            after_ids = sorted({lid for pid in cond["after_patterns"]
                                for lid in matches.get(pid, [])})
            by_id = {e["log_id"]: e for e in self.entries}
            for bid in before_ids:
                for aid in after_ids:
                    be, ae = by_id.get(bid), by_id.get(aid)
                    if (be and ae and be["epoch"] is not None and ae["epoch"] is not None
                            and be["epoch"] < ae["epoch"]):
                        return True, [bid, aid], False
            return False, [], False
        raise ValueError(f"unknown condition kind {kind}")

    # ================================================================ evaluation
    def _stage_evaluate(self, entries, matches):
        self.entries = entries
        self.matches = matches
        self.timeline_resolved = (
            not any(e["tz_status"] != "KNOWN" for e in entries if e["usable"])
            and not any(e["integrity_effective"] == "CONTRADICTORY" for e in entries))
        context = {"timeline_resolved": self.timeline_resolved}
        self.event("evaluate_failure_modes", None,
                   f"Evaluating {len([m for m in self.modes if not self.modes[m].get('engine_managed')])} "
                   f"diagnosable modes; timeline_resolved={self.timeline_resolved}.")

        evals = {}
        for mode in sorted(self.modes.values(), key=lambda m: m["id"]):
            if mode.get("engine_managed"):
                continue
            mid = mode["id"]
            groups, missing = [], []
            for g in mode.get("required_groups", []):
                satisfied, refs, unresolved = False, [], False
                for cond in g["any_of"]:
                    ok, r, unres = self._cond(cond, matches, context)
                    if ok:
                        satisfied, refs = True, r
                        break
                    if unres:
                        unresolved = True
                self.event("evaluate_failure_modes", f"R-{mid}-{g['group_id']}",
                           f"{mid} {g['group_id']}: "
                           + ("SATISFIED" if satisfied else "UNSATISFIED")
                           + (" (event order unresolved)" if unresolved and not satisfied else ""),
                           refs)
                groups.append({"id": g["group_id"], "description": g["description"],
                               "satisfied": satisfied, "refs": refs, "unresolved": unresolved})
                if not satisfied:
                    missing.append(g["description"])
            support_count, contra_count, veto = 0, 0, False
            for s in mode.get("supporting", []):
                ok, r, _ = self._cond(s["condition"], matches, context)
                if ok:
                    support_count += 1
                    self.event("apply_supporting_contradicting", f"R-{mid}-{s['id']}",
                               f"{mid} supporting {s['id']} matched.", r)
            for x in mode.get("contradicting", []):
                ok, r, _ = self._cond(x["condition"], matches, context)
                if ok:
                    contra_count += 1
                    veto = veto or x["veto"]
                    self.event("apply_supporting_contradicting", f"R-{mid}-{x['id']}",
                               f"{mid} contradicting {x['id']} matched"
                               + (" with VETO" if x["veto"] else "") + ".", r)
            evals[mid] = {
                "mode": mid, "groups": groups, "missing_groups": missing,
                "support_count": support_count, "contra_count": contra_count,
                "veto": veto, "priority": mode["tie_break_priority"],
                "unusable_hits": sorted({
                    e["log_id"] for e in entries if not e["usable"]
                    and any(cond["kind"] == "pattern_any" and any(
                        self.patterns[p].search(e["message"]) for p in cond["patterns"])
                        for g in mode.get("required_groups", []) for cond in g["any_of"])}),
                "excluded_reason": None, "score": None, "status": None, "reason": "",
            }
        self.evals = evals

    def _stage_scores(self):
        s = self.scoring
        for mid in sorted(self.evals):
            m = self.evals[mid]
            if any(not g["satisfied"] for g in m["groups"]):
                m["score"], m["status"] = None, "BELOW_REQUIRED"
                m["reason"] = ("Required evidence groups not satisfied: " + "; ".join(
                    g["description"] for g in m["groups"] if not g["satisfied"]))
                if any(g["unresolved"] for g in m["groups"]):
                    m["reason"] += " Event order could not be resolved (TIMELINE_UNRESOLVED)."
                continue
            score = min(100, max(0, s["base"] + s["support_weight"] * min(
                m["support_count"], s["support_max_count"])
                - s["contradict_weight"] * m["contra_count"]))
            m["score"] = score
            if m["veto"]:
                m["status"], m["reason"] = "EXCLUDED", "Veto contradicting evidence matched."
            elif score < s["threshold"]:
                m["status"], m["reason"] = "BELOW_THRESHOLD", (
                    f"Score {score} below threshold {s['threshold']} after contradicting evidence.")
            else:
                m["status"], m["reason"] = "QUALIFIED", f"All required groups matched; score {score}."
            self.event("calculate_deterministic_scores", "R-GLOBAL-SCORING-006",
                       f"{mid}: score={score} status={m['status']} "
                       f"(support={m['support_count']} contra={m['contra_count']} veto={m['veto']})")

    def _stage_exclusions(self):
        for mid in sorted(self.evals):
            rules = sorted(self.modes[mid].get("exclusion_rules", []), key=lambda x: x["id"])
            for e in rules:
                if (e["kind"] == "mode_qualified"
                        and self.evals.get(e["mode"], {}).get("status") == "QUALIFIED"
                        and self.evals[mid]["status"] == "QUALIFIED"):
                    self.evals[mid]["status"] = "EXCLUDED"
                    self.evals[mid]["reason"] = e["reason"]
                    self.event("apply_exclusion_rules", f"R-{mid}-{e['id']}",
                               f"{mid} excluded: {e['reason']}")

    def _components(self, mode_ids):
        links = sorted((m["id"], t) for m in self.catalogue["modes"]
                       for t in m.get("causal_links_out", []))
        parent = {m: m for m in mode_ids}

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in links:
            if a in parent and b in parent:
                ra, rb = find(a), find(b)
                if ra != rb:
                    parent[max(ra, rb)] = min(ra, rb)
        groups: dict[str, list[str]] = {}
        for m in sorted(parent):
            groups.setdefault(find(m), []).append(m)
        return [sorted(v) for _, v in sorted(groups.items())]

    def _stage_select(self, qualified, components):
        error_flags = [] if self.timeline_resolved else ["TIMELINE_UNRESOLVED"]
        missing_evidence = []
        if not qualified:
            partial = [(mid, m) for mid, m in sorted(self.evals.items())
                       if any(g["satisfied"] for g in m["groups"])]
            for mid, m in partial:
                missing_evidence.append(
                    f"{mid}: partially matched; still missing: " + "; ".join(m["missing_groups"]))
            for mid, m in sorted(self.evals.items()):
                for lid in m["unusable_hits"]:
                    status = next(e["integrity_effective"] for e in self.entries
                                  if e["log_id"] == lid)
                    missing_evidence.append(
                        f"Log entry {lid} matches {mid} signatures but has effective integrity "
                        f"{status}; restore or re-verify that entry to use it as evidence.")
            if not partial:
                missing_evidence.append(
                    "No failure-mode signature matched any usable evidence; provide error-severity "
                    "logs around the failure window or resource metrics for the failing interval.")
            if not self.timeline_resolved:
                missing_evidence.append(
                    "Timezone offsets for log entries with timezone_status MISSING, so event "
                    "order can be resolved without guessing.")
            primary, contributing, confidence, label = "UNKNOWN_ROOT_CAUSE", [], None, "INSUFFICIENT"
            self.event("select_diagnosis", "R-GLOBAL-UNKNOWN-008",
                       "No mode qualified; returning UNKNOWN_ROOT_CAUSE with a missing-evidence list.")
        else:
            if len(components) >= 2:
                primary = "MULTIPLE_CONCURRENT_FAILURES"
                contributing = [m["mode"] for m in qualified]
                confidence = sum(self.evals[m["mode"]]["score"] for m in qualified) // len(qualified)
                self.event("detect_concurrent_failures", "R-GLOBAL-MULTI-007",
                           f"{len(components)} independent causal components; "
                           "MULTIPLE_CONCURRENT_FAILURES selected; all modes retained.")
            else:
                primary = qualified[0]["mode"]
                contributing = [m["mode"] for m in qualified[1:]]
                confidence = qualified[0]["score"]
            labels = self.scoring["labels"]
            label = ("HIGH" if confidence >= labels["high_min"]
                     else "MEDIUM" if confidence >= labels["medium_min"]
                     else "LOW" if confidence >= labels["low_min"] else "INSUFFICIENT")
            self.event("select_diagnosis", "R-GLOBAL-TIEBREAK-005",
                       f"primary={primary} contributing={contributing} confidence={confidence} "
                       "order=(score desc, tie_break_priority asc, mode id byte order).")
        return {"primary": primary, "contributing": contributing,
                "confidence": confidence, "label": label,
                "missing_evidence": missing_evidence,
                "timeline_resolved": self.timeline_resolved,
                "error_flags": error_flags}

    def _stage_remediation(self, selection):
        ordered_modes = (selection["contributing"] if selection["primary"] == "MULTIPLE_CONCURRENT_FAILURES"
                         else ["UNKNOWN_ROOT_CAUSE"] if selection["primary"] == "UNKNOWN_ROOT_CAUSE"
                         else [selection["primary"]] + selection["contributing"])
        steps, ordering = [], 0
        for mid in ordered_modes:
            for r in self.modes[mid].get("permitted_remediation", []):
                ordering += 10
                steps.append({"step_id": f"S{ordering:03d}", "ordering": ordering, "mode": mid,
                              "action": r["action"], "action_kind": r["action_kind"]})
        forbidden = set()
        for mid in ordered_modes:
            forbidden.update(self.modes[mid].get("forbidden_remediation", []))
        for prov in sorted(self.document.get("forbidden_execution_providers") or []):
            forbidden.add(f"Do not select execution provider {prov} for this workload.")
        stop_now = any(s["action_kind"] == "STOP_EXECUTION_NOW" for s in steps)
        self.event("generate_remediation", None,
                   f"{len(steps)} remediation steps across {ordered_modes}; "
                   f"immediate_execution_stop={stop_now}; {len(forbidden)} forbidden actions.")
        return steps, sorted(forbidden), stop_now

    # ================================================================ audit
    @staticmethod
    def _stripped(output: dict) -> dict:
        out = dict(output)
        out["audit_results"] = []
        out["canonical_sha256"] = None
        return out

    def audit(self, output, second_run_stripped=None):
        results = []
        results.append({"check_id": "AUD-001",
                        "status": "PASS" if self.input_valid else "FAIL",
                        "detail": "Input passed incident-input schema validation before diagnosis."})
        used = {ev["rule_id"] for ev in self.trace if ev["rule_id"]}
        known = set(self.rulebook["rules"]) | set(self.rulebook["global_rules"])
        missing_rules = sorted(r for r in used if r not in known)
        results.append({"check_id": "AUD-002",
                        "status": "PASS" if not missing_rules else "FAIL",
                        "detail": "All referenced rule ids exist in rulebook.json."
                        if not missing_rules else f"Unknown rule ids: {missing_rules}"})
        ledger_ids = {x["log_id"] for x in output["evidence_ledger"]}
        pseudo = ("policy:", "metrics:", "dependency:")
        bad_refs = sorted({ref for ev in output["decision_trace"] for ref in ev["refs"]
                           if not ref.startswith(pseudo) and ref not in ledger_ids})
        for c in output["contradictions"]:
            bad_refs += [lid for lid in c["log_ids"] if lid not in ledger_ids]
        for q in output["quarantined_content"]:
            if q["log_id"] not in ledger_ids:
                bad_refs.append(q["log_id"])
        results.append({"check_id": "AUD-003",
                        "status": "PASS" if not bad_refs else "FAIL",
                        "detail": "Every evidence reference resolves to a ledger entry."
                        if not bad_refs else f"Dangling refs: {sorted(set(bad_refs))}"})
        quarantined_ids = {q["log_id"] for q in output["quarantined_content"]}
        scored = {x["log_id"] for x in output["evidence_ledger"] if x["used_in_scoring"]}
        leak = sorted(quarantined_ids & scored)
        results.append({"check_id": "AUD-004", "status": "PASS" if not leak else "FAIL",
                        "detail": "No quarantined entry contributed to scoring."
                        if not leak else f"Quarantined entries used: {leak}"})
        s = self.scoring
        recomputed_ok = True
        for mid in [output["primary_diagnosis"]] + output["contributing_diagnoses"]:
            m = self.evals.get(mid)
            if m is None:
                continue
            expected = min(100, max(0, s["base"] + s["support_weight"] * min(
                m["support_count"], s["support_max_count"])
                - s["contradict_weight"] * m["contra_count"]))
            if m["score"] != expected:
                recomputed_ok = False
        results.append({"check_id": "AUD-005",
                        "status": "PASS" if recomputed_ok else "FAIL",
                        "detail": "Confidence scores match the declared formula recomputed "
                                  "independently from stored counts."})
        forbidden_provs = [p.lower() for p in
                           self.document.get("forbidden_execution_providers") or []]
        bad_steps = [st["step_id"] for st in output["remediation_plan"]
                     if any(f"on {p}" in st["action"].lower() for p in forbidden_provs)
                     and st["action_kind"] != "STOP_EXECUTION_NOW"]
        results.append({"check_id": "AUD-006", "status": "PASS" if not bad_steps else "FAIL",
                        "detail": "No remediation step recommends a forbidden execution provider."
                        if not bad_steps else f"Violating steps: {bad_steps}"})
        out_errors = validate_document(self._stripped(output), self.refs["output_schema"])
        results.append({"check_id": "AUD-007", "status": "PASS" if not out_errors else "FAIL",
                        "detail": "Output passes diagnostic-output schema."
                        if not out_errors else f"Schema errors: {out_errors[:5]}"})
        if second_run_stripped is not None:
            same = canonical_json(second_run_stripped) == canonical_json(self._stripped(output))
            results.append({"check_id": "AUD-008", "status": "PASS" if same else "FAIL",
                            "detail": "A second execution over the identical normalized input "
                                      "produced byte-identical canonical JSON."
                            if same else "Second run differed."})
        else:
            results.append({"check_id": "AUD-008", "status": "FAIL",
                            "detail": "Determinism comparison unavailable."})
        return results

    def _failed(self, incident_id, flags):
        return {
            "incident_id": incident_id, "schema_version": "1.0.0",
            "processing_status": "FAILED", "primary_diagnosis": None,
            "contributing_diagnoses": [], "confidence_score": None,
            "confidence_label": "INSUFFICIENT", "evidence_ledger": [],
            "rejected_hypotheses": [], "contradictions": [], "quarantined_content": [],
            "unknown_fields": [], "missing_required_evidence": [], "remediation_plan": [],
            "forbidden_actions": [], "immediate_execution_stop": False,
            "timeline_resolved": True, "decision_trace": self.trace,
            "audit_results": [], "error_flags": flags, "canonical_sha256": None,
        }


def load_references():
    patterns_doc = load_json(PKG / "references" / "pattern-dictionary.json")
    patterns = {pid: re.compile(spec["regex"], re.IGNORECASE)
                for pid, spec in patterns_doc["patterns"].items()}
    order_regex = re.compile(patterns_doc["patterns"]["PAT_ORDER_ASSERT"]["regex"], re.IGNORECASE)
    return {
        "patterns": patterns,
        "order_regex": order_regex,
        "catalogue": load_json(PKG / "references" / "failure-mode-catalogue.json"),
        "rulebook": load_json(PKG / "references" / "rulebook.json"),
        "input_schema": load_json(PKG / "schemas" / "incident-input.schema.json"),
        "output_schema": load_json(PKG / "schemas" / "diagnostic-output.schema.json"),
    }


def run_diagnostic(document) -> dict:
    """Full pipeline + self-audit + one self-correction attempt. Public entry."""
    refs = load_references()

    def one_pass():
        engine = Engine(refs)
        output = engine.run(document)
        return output, engine

    output, engine = one_pass()
    if output["processing_status"] != "COMPLETED":
        return output

    second, _ = one_pass()
    audit = engine.audit(output, second_run_stripped=second)
    if any(a["status"] == "FAIL" for a in audit):
        output, engine = one_pass()
        second, _ = one_pass()
        audit = engine.audit(output, second_run_stripped=second)
        if any(a["status"] == "FAIL" for a in audit):
            failed = engine._failed(output["incident_id"], ["SELF_CORRECTION_FAILED"])
            failed["decision_trace"] = engine.trace
            failed["audit_results"] = audit
            return failed

    # stage 17 trace event recorded inside output trace
    output["decision_trace"].append({
        "seq": len(output["decision_trace"]) + 1, "stage": "run_self_audit",
        "rule_id": "R-GLOBAL-AUDIT-009",
        "detail": f"8 audit checks executed: {sum(1 for a in audit if a['status'] == 'PASS')} PASS, "
                  f"{sum(1 for a in audit if a['status'] == 'FAIL')} FAIL.",
        "refs": [],
    })
    output["audit_results"] = audit
    # stage 18 - finalize
    output["canonical_sha256"] = hashlib.sha256(
        canonical_json(Engine._stripped(output)).encode("utf-8")).hexdigest()
    output["decision_trace"].append({
        "seq": len(output["decision_trace"]) + 1, "stage": "finalize", "rule_id": None,
        "detail": f"Finalized. primary={output['primary_diagnosis']} "
                  f"confidence={output['confidence_score']} ({output['confidence_label']}).",
        "refs": [],
    })
    return output


def main(argv):
    if len(argv) != 2:
        print("usage: python scripts/diagnostic_engine.py <incident.json>", file=sys.stderr)
        return 2
    document = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    result = run_diagnostic(document)
    print(json.dumps(result, sort_keys=True, indent=2, ensure_ascii=True))
    return 0 if result["processing_status"] == "COMPLETED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
