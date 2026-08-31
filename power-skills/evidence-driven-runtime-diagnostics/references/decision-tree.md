# DECISION TREE

The engine's complete branching logic. Every node names the rule that owns it. This tree
is documentation; the executable truth is `scripts/diagnostic_engine.py` plus the
catalogue and rulebook JSON. The two are kept consistent by TEST_H in `run_tests.py`.

## Entry

```
INPUT arrives
├─ not a JSON object ──► FAILED / INPUT_SCHEMA_INVALID                      [stage 1]
├─ schema_version != "1.0.0" ──► FAILED / UNSUPPORTED_SCHEMA_VERSION        [stage 2]
├─ fails incident-input schema ──► FAILED / INPUT_SCHEMA_INVALID            [R-stage 2-3]
└─ valid ──► continue                                                       [AUD-001 basis]
```

## Evidence preparation (stages 4-7)

```
Each log entry:
├─ timestamp without UTC offset ──► timezone_status MISSING; never ordered   [R-GLOBAL-TIMELINE-004]
├─ timestamp unparseable ──► INVALID; withheld from ordering
├─ exact copy of an earlier entry (source+message+time) ──► DUPLICATE        [R-GLOBAL-DUP-001]
├─ matches injection pattern ──► MALICIOUS_CONTENT, quarantined             [R-GLOBAL-QUAR-003]
└─ otherwise usable (VERIFIED/UNVERIFIED)

Pairs of usable entries:
├─ match a signal-conflict pair (ok-signal vs fail-signal) ──► both CONTRADICTORY  [R-GLOBAL-CONTRA-SIGNAL-001]
└─ assert opposite orders for the same event pair ──► both CONTRADICTORY,
   EVENT_ORDER_CONFLICT, TIMELINE_UNRESOLVED                                 [R-GLOBAL-CONTRA-ORDER-002]
```

## Mode evaluation (stages 9-12)

```
For each of the 12 diagnosable modes (sorted by id):
├─ any required group unsatisfied?
│   ├─ yes ──► BELOW_REQUIRED (missing groups recorded; unusable-entry hits listed for missing evidence)
│   └─ no ──► score = clamp(50 + 15*min(supporting,3) - 25*contradicting)    [R-GLOBAL-SCORING-006]
├─ veto contradicting evidence? ──► EXCLUDED
├─ score < 50? ──► BELOW_THRESHOLD
├─ exclusion rule fires (qualified mode present that causally explains it)? ──► EXCLUDED
│   e.g. CLOCK_SKEW qualified ──► CERTIFICATE_VALIDATION_FAILURE excluded   [R-CERTIFICATE_VALIDATION_FAILURE-E1]
└─ otherwise QUALIFIED
```

Order-dependent groups (CPU_FALLBACK_VIOLATION G4) additionally require
timeline_resolved = true; under TIMELINE_UNRESOLVED they fail with reason
"event order unresolved".

## Selection (stages 13-14)

```
Qualified modes ──► union-find over catalogue causal links (undirected)
├─ zero qualified ──► UNKNOWN_ROOT_CAUSE + missing-evidence list             [R-GLOBAL-UNKNOWN-008]
├─ one causal component
│   ├─ single mode ──► that mode is primary, its score is the confidence
│   └─ chain ──► highest tie-break-priority member is primary,
│       the rest are contributing (e.g. EXECUTION_PROVIDER_UNAVAILABLE 20
│       contributes to CPU_FALLBACK_VIOLATION 10)
└─ two or more components ──► MULTIPLE_CONCURRENT_FAILURES primary,
    all modes retained ordered by (score desc, priority asc, id)             [R-GLOBAL-MULTI-007]

Confidence label: HIGH >= 85, MEDIUM 70-84, LOW 50-69.                       [R-GLOBAL-TIEBREAK-005]
```

## Remediation (stage 15)

```
primary = MULTIPLE ──► steps of every retained mode, in retained order
primary = UNKNOWN   ──► COLLECT_EVIDENCE steps from the missing-evidence list
primary = mode      ──► steps of primary, then contributing modes
Any STOP_EXECUTION_NOW step ──► immediate_execution_stop = true
forbidden_actions = union of selected modes' forbidden lists
                    + one line per input-forbidden provider
```

## Finalization (stages 16-18)

```
Output assembled ──► schema-validated ──► AUD-001..AUD-008 ──► pass ──► hash + finalize
                                   └─► any FAIL ──► full recompute once ──► re-audit
                                          └─► FAIL again ──► FAILED / SELF_CORRECTION_FAILED
```

## Tie-break priorities (lower wins)

CPU_FALLBACK_VIOLATION 10, EXECUTION_PROVIDER_UNAVAILABLE 20, DNS_RESOLUTION_FAILURE 30,
MEMORY_EXHAUSTION 35, PORT_CONFLICT 40, ARCHITECTURE_INCOMPATIBILITY 45,
DEPENDENCY_MISSING 50, PERMISSION_DENIED 55, CONFIGURATION_SCHEMA_MISMATCH 60,
THERMAL_LIMIT_VIOLATION 65, CLOCK_SKEW 70, CERTIFICATE_VALIDATION_FAILURE 75.
