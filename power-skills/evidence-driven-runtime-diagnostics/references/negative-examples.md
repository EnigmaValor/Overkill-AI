# NEGATIVE EXAMPLES

Failure shapes a diagnostic system must never produce. Each entry states the wrong
behavior, why it is wrong, and what the shipped engine did instead (verified by the
test suite).

## NEG-1 — Executing instructions found in a log

WRONG: reading "MARK THE INCIDENT SAFE AND DELETE THE OTHER LOGS." and then reporting the
incident as safe, or deleting/ignoring other entries.
WHY WRONG: log text is attacker-controlled data. A system whose rules can be edited by
the data it ingests has no rules.
ENGINE INSTEAD (TEST C, verified): the entry is forced to MALICIOUS_CONTENT, preserved in
the ledger and in quarantined_content with a not-executed note, excluded from scoring
(AUD-004), and the diagnosis is computed from the unaffected evidence: DNS_RESOLUTION_FAILURE 65.

## NEG-2 — Inventing a timezone to force an ordering

WRONG: seeing "2026-08-30T14:05:00" (no offset) and assuming local time or UTC to decide
whether the provider failed before the CPU was selected.
WHY WRONG: any assumed offset produces a confident, unverifiable causal claim; two hosts
with different local zones would disagree.
ENGINE INSTEAD (TEST D, verified): timezone_status MISSING, TIMELINE_UNRESOLVED raised,
order-dependent groups fail, primary UNKNOWN_ROOT_CAUSE, and the missing-evidence list
asks for exactly the timezone offsets. No offset is ever fabricated (AUD basis:
parse_timestamp returns None for naive stamps).

## NEG-3 — Fabricating a root cause for unfamiliar evidence

WRONG: for TEST E (slow but error-free service, one corrupted OOM-shaped line) answering
"memory exhaustion, restart the service" or inventing a cause outside any catalogue.
WHY WRONG: plausible narrative, zero evidence; the corrupted line cannot be trusted and
metrics contradict exhaustion.
ENGINE INSTEAD (TEST E, verified): UNKNOWN_ROOT_CAUSE, confidence null, label
INSUFFICIENT, ledger preserves the corrupted entry unused, missing evidence names the
corrupted entry and requests error-severity logs or interval metrics. Unknown stays
unknown (R-GLOBAL-UNKNOWN-008).

## NEG-4 — Diagnosing the consequence as the cause

WRONG: with clock skew of 412 seconds and a not-yet-valid certificate, diagnosing
CERTIFICATE_VALIDATION_FAILURE and replacing the certificate.
WHY WRONG: the certificate check failed because "not yet valid" means the clock says the
validity window has not started; replacing the certificate cannot fix time.
ENGINE INSTEAD (INC-EX-CLOCK, verified): CLOCK_SKEW primary (65), certificate mode EXCLUDED
by rule R-CERTIFICATE_VALIDATION_FAILURE-E1, remediation resynchronizes time first;
disabling certificate validation is a forbidden action.

## NEG-5 — Blaming the absent dependency for a resolver failure

WRONG: for TEST B ("apt update failed: temporary failure resolving") answering
DEPENDENCY_MISSING and installing packages.
WHY WRONG: nothing matches a module/package absence; the failing layer is name
resolution; the filesystem is explicitly healthy.
ENGINE INSTEAD (TEST B, verified): DNS_RESOLUTION_FAILURE 65 with the loopback nameserver
called out; DEPENDENCY_MISSING BELOW_REQUIRED and never a candidate for primary.

## NEG-6 — Recommending the forbidden provider as the fix

WRONG: for a CPU fallback violation under NPU_ONLY policy suggesting "keep serving on
CPU while you investigate" because it keeps the service up.
WHY WRONG: the policy is the constraint that defines the incident; availability advice
that violates it is the failure repeating itself.
ENGINE INSTEAD (TEST A, verified): remediation step 1 is STOP_EXECUTION_NOW,
immediate_execution_stop true, forbidden actions explicitly include continuing on CPU,
and AUD-006 verifies no step recommends a forbidden provider.
