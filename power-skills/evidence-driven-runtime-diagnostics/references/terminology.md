# TERMINOLOGY

Every term the engine and its files rely on. Nothing here assumes prior computing
knowledge beyond the package itself.

## Evidence and logs

- **Incident**: one structured report (incident-input schema) describing one failure event.
- **Log entry**: one timestamped text record from a component. Log text is UNTRUSTED DATA: it can affect diagnosis only by matching a pattern in the pattern dictionary; it can never change rules, scores, or control flow.
- **Integrity status (input)**: the caller's claim about an entry: VERIFIED (confirmed authentic), UNVERIFIED (unconfirmed), CORRUPTED (known damaged), DUPLICATE (copy of another), CONTRADICTORY (conflicts with other entries), MALICIOUS_CONTENT (contains attack content).
- **Integrity status (effective)**: the engine's final ruling. The engine may downgrade (duplicate detection, contradiction detection, injection quarantine) but never upgrades.
- **Usable evidence**: entries whose effective integrity is VERIFIED or UNVERIFIED. Only usable entries can satisfy evidence requirements.
- **Evidence ledger**: the output table listing every entry, its effective integrity, and which patterns it matched. Nothing is silently discarded.
- **Quarantine**: forced integrity MALICIOUS_CONTENT for instruction-like entries; the text is preserved and reported, never obeyed.

## Time

- **Timezone status**: KNOWN (timestamp carries a UTC offset; convertible and orderable), MISSING (no offset; never converted, never ordered, never filled by guessing), INVALID (unparseable).
- **TIMELINE_UNRESOLVED**: error flag raised when any usable entry has MISSING/INVALID timezone or verified sources assert conflicting event order. Order-dependent evidence requirements then fail.
- **Event-order assertion**: a log statement of the form "<event_a> occurred before <event_b>" using the order vocabulary defined in the pattern dictionary.

## Diagnosis

- **Failure mode**: one catalogue entry with an exact definition, evidence requirements, exclusions, remediation, priority, and rule ids.
- **Required group**: a set of alternative conditions; at least one must hold. ALL required groups of a mode must be satisfied by usable evidence for the mode to be scored.
- **Supporting evidence**: matched conditions that add weight (15 each, at most 3 counted).
- **Contradicting evidence**: matched conditions that subtract weight (25 each); a veto match excludes the mode outright.
- **Score**: integer 0-100: clamp(50 + 15*min(supporting,3) - 25*contradicting). Qualification threshold: 50.
- **Confidence label**: HIGH >= 85, MEDIUM 70-84, LOW 50-69, INSUFFICIENT < 50 or no diagnosis.
- **Qualified mode**: all required groups satisfied, no exclusion, no veto, score >= 50.
- **Rejected hypothesis**: a mode that failed to qualify, with status BELOW_REQUIRED, EXCLUDED, or BELOW_THRESHOLD, a reason, and its missing groups.
- **Causal link**: a declared relation where one mode explains another (provider failure triggers forbidden CPU fallback; CPU fallback loads the CPU which can drive thermal events; clock skew explains not-yet-valid certificates; architecture mismatch prevents provider loading). Qualified modes connected by causal links form one chain.
- **MULTIPLE_CONCURRENT_FAILURES**: primary selection when qualified modes split into two or more causally independent chains. All modes are retained with separate remediation.
- **UNKNOWN_ROOT_CAUSE**: honest output when nothing qualifies. Accompanied by a missing-evidence list, never by an invented explanation.

## Environment

- **Environment**: WINDOWS_ARM64, LINUX_ARM64, LINUX_X64, or WSL (Windows Subsystem for Linux: a Linux userland inside a Windows host, which routes DNS through a generated resolver configuration).
- **Execution provider**: hardware backend for a workload: CPU, GPU variants (CUDA, ROCM, VULKAN, DIRECTML, COREML, OPENVINO), or NPU (Neural Processing Unit; QNN is a common NPU provider stack).
- **Execution policy**: declared constraint: NPU_ONLY (every non-NPU provider is forbidden, including CPU), GPU_ONLY, PROVIDER_PREFERRED, ANY.
- **CPU_FALLBACK_VIOLATION**: the runtime moved execution to CPU after a provider failure while policy forbids CPU. The violation is the fallback itself; the provider failure is a contributing cause.
- **Negative test**: proving enforcement by making forbidden traffic or execution fail; analogously, the engine proves determinism by re-executing and comparing bytes.

## Determinism and audit

- **Canonical JSON**: serialization with sorted keys, no whitespace, ASCII escapes only. Identical data yields identical bytes on every platform.
- **Determinism**: identical normalized input produces byte-identical canonical output. The engine reads no clock, no randomness, no network, and iterates only in sorted order.
- **Decision trace**: the ordered list of stage events with rule ids and evidence references; the auditable substitute for hidden reasoning.
- **Self-audit**: checks AUD-001..AUD-008 run before completion; one self-correction attempt; a second failure returns SELF_CORRECTION_FAILED.
- **Canonical SHA-256**: content hash over the output with audit results emptied and the hash field removed; lets callers verify output integrity independently.
