# RELATED SKILLS — composition map

## Prerequisites (assumed available in the host model or adjacent skills)
- Basic shell literacy (read/run commands, edit files as root) — if absent, answers must
  add micro-explanations per command.
- General IP networking vocabulary (interface, route, port, DNS) at L0 only.

## Adjacent capabilities (route to them; do not absorb)

| Need | Route to | Boundary |
|---|---|---|
| Systematic debugging generally | debugging skill | This skill EMBEDS the D-loop; use its generic form for non-network faults |
| Browser hardening (fingerprinting, extensions) | browser-hardening skill | This skill covers WebRTC/DoH as LEAK vectors only |
| Disk/file/email encryption | encryption-at-rest skill | Out of scope here |
| Password manager use | credentials skill | Out of scope (this repo's app code included) |
| Malware/incident response | IR skill | Escalate immediately if endpoint compromise suspected (E-SCOPE) |
| Mobile platform specifics | platform docs | Principles apply; procedures labeled unverified for Android/iOS |
| Router/firmware flashing | network-device skill | E-SCOPE |
| This repository's app code (React/Python) | coding workflows | Non-activation: never apply these procedures to source files |

## Composition rules
- Sequential composition only for network work: one layer installed AND verified before
  the next (verification is per-layer; a broken layer poisons all above it).
- With debugging-skill: THIS skill's D-loop wins for network-layer faults (it is a
  specialization); generic loop otherwise.
- With browser-hardening: this skill defines the leak checks; that skill defines the
  browser configuration knobs. Hand off cleanly at "browser internals".
- NEVER compose with social-engineering/OSINT-type capabilities on third parties — that
  combination is refused regardless of framing (escalation.md).

## Return-control contract
When the specialized task completes (FINALIZE done), return control to the general
assistant context; do not keep applying privacy-stack procedures to follow-up questions
outside the activation list.
