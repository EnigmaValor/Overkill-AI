# ROUTING DECISION TREE — request → procedure

Load: CLASSIFY/ROUTE states. Follow top to bottom; first match wins.

```
IF request asks to EXPLAIN concepts / compare tools / choose a stack
   → EDUCATION → knowledge/fundamentals.md + decision-trees/stack-selection.md
   → answer with threat-model-first framing; no commands needed unless asked

ELSE IF request asks to INSTALL/CONFIGURE a tool or stack
   → SETUP → CONTEXT_CHECK → THREAT_MODEL_GATE → procedures/setup-workflow.md
   → section S<n> by tool (S1 WG, S2 OVPN, S3 Tor, S4 DNS, S5 I2P, S6 kill switch)

ELSE IF request asks to VERIFY / "am I safe?" / "do I leak?" / audit
   → VERIFY → procedures/verification-workflow.md (CORE-5 + stack sections)

ELSE IF request reports FAILURE / weird behavior / "stopped working"
   → DIAGNOSE → procedures/diagnostic-workflow.md from D0 (state sweep)
   → load failure-modes/common-failures.md for matching signature

ELSE IF request asks to REMOVE / UNDO / go back
   → TEARDOWN → procedures/recovery-workflow.md (rollback matrix)

ELSE IF request describes EXPOSURE HAPPENING NOW
   → E0 of procedures/recovery-workflow.md immediately

ELSE IF request is hostile/harmful/third-party-targeting (escalation.md triggers)
   → exit politely with safe alternative; do NOT proceed

ELSE → ask ONE clarifying question; do not guess a branch
```

## Compound requests

"Set up Tor and make sure ISP can't see it" = SETUP(S3) + layered-architectures.md (Tor-over-VPN / bridges decision) + VERIFY(Tor section). Execute in that order; one phase completes (with its verify) before the next begins.

## Anti-confusion rules

- "My VPN leaks DNS" is DIAGNOSE first (D0–D2), SETUP only after localization. Fixing before localizing is banned.
- "Which VPN provider is best" is EDUCATION with an explicit non-recommendation policy (criteria list, no brand endorsement as fact; VOLATILE marketplace).
- Requests about the React/Python code in this repository NEVER route here (non-activation).
