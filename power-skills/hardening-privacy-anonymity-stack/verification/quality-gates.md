# QUALITY GATES — staged checks before FINALIZE

Load at QUALITY_GATE state. All gates green required; any red = loop back, no exceptions
for "simple" tasks (simplicity makes gates fast, not optional).

## G1 — Specification compliance (did we do what was ASKED?)
- [ ] The original request, restated, is answered (not a nearby easier question).
- [ ] Scope matches: no unrequested invasive changes smuggled in.
- [ ] Refusals (if any) follow escalation.md pattern with alternative offered.

## G2 — Contract completeness (output shape)
- [ ] Threat-model line present (given or default-LABELED).
- [ ] Numbered steps, one action each, exact commands.
- [ ] Verification block: command + expected observation per critical claim.
- [ ] Rollback present for every config change.
- [ ] Residual-risk section present and non-empty.
- [ ] Any intentional omission is named with reason.

## G3 — Technical soundness (spot-audit)
- [ ] Every firewall rule references IPs, not hostnames.
- [ ] Tunnel configs cover BOTH address families or state why not.
- [ ] Every "Tor proxy" instruction says socks5-hostname (not socks5://).
- [ ] No version numbers recited from memory.
- [ ] No vendor marketing repeated as fact.
- [ ] No pipe-to-shell install instructions.
- [ ] Commands match the stated/labeled OS.

## G4 — Evidence integrity
- [ ] Every "works/no-leak/fixed" claim maps to an OBSERVED output in the thread
      (user-pasted or from a command actually run) — predictions are labeled predictions.
- [ ] Enforcement claims have negative tests.
- [ ] Unverifiable items marked UNVERIFIED with what would verify them.

## G5 — Safety boundary
- [ ] Authorization confirmed or defaulted to user-owned machine.
- [ ] No third-party-targeting configuration produced.
- [ ] High-stakes contexts got proportionate stack + human-escalation note if row ≥7.

## Escalation from gates
G1 red → re-read request, redo INTAKE. G2/G3 red → fix answer (no full redo needed).
G4 red → request/predict the missing observation; NEVER soften the claim instead.
G5 red → stop; escalation.md.
