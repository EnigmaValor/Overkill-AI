# CHANGELOG

## 1.0.0 — 2026-08-30

Initial Ω-grade POWER SKILL package: `hardening-privacy-anonymity-stack`.

### Added
- SKILL.md router/contract (activation, non-activation, inputs, outputs, progressive loading table, workflow controller).
- Knowledge layer (L0–L4): fundamentals, tool-reference (WireGuard, OpenVPN, Tor, i2pd, dnscrypt-proxy, unbound, systemd-resolved, nftables/ufw), layered-architectures (Tor-over-VPN vs VPN-over-Tor, DNS layering, circumvention ladder, compartmentalization), expert-patterns, edge-cases.
- Procedures: primary state machine (INTAKE→…→LEARN with binding invariants), setup (S1–S6 with embedded verification), verification (CORE-5 + per-stack), diagnostic (D0–D7 loop + fast-path tables), recovery (E0 emergency order, rollback matrix).
- Decision trees: routing, stack-selection (adversary→stack table), escalation (refuse/human/scope).
- Patterns: 12 positive, 14 anti-patterns, 15 expert heuristics (H1–H15).
- Failure modes: 12 common (F1–F12), 12 deceptive (DF1–DF12), recovery matrix with regression guards.
- Examples: excellent / acceptable / bad (annotated) / 8 adversarial inputs.
- Verification engine: quality gates G1–G5, 10-point self-check, 12 invariants.
- Benchmarks: 20-task suite (categories A–J), scoring rubric (7 judge dimensions + deterministic layer), honest-null baseline/skill_eval files.
- Eval harness: run_eval.py (stdlib-only, OpenAI-compatible backends, deterministic checks, optional judge, selftest mode), validate_package.py (structural regression suite).
- Pressure tests (PT1–PT8), routing/composition map, packet-level verification cookbook.

### Verification status of THIS release (evidence, not claims)
- validate_package.py: PASS (structural integrity, zero placeholders) — run it yourself.
- run_eval.py --selftest: PASS (pipeline integrity) — run it yourself.
- Model-attached benchmark: **NOT RUN** — baseline.json/skill_eval.json honestly null.
  First party to run the harness against a real 2B-class model populates them.
- Domain facts verified against primary sources 2026-08: dnscrypt-proxy feature set
  (DoH/QUIC, Anonymized DNS, ODoH RFC 9230), i2pd/Java-I2P maintenance status.
  Everything version-like inside the skill is marked VOLATILE with a check command.

### Known limitations (documented, not hidden)
- Procedures default to desktop Linux; macOS/Windows are noted only where cheap. Mobile OS internals are explicitly out of scope.
- Threat-model rows 7–8 (targeted/nation-state) deliberately stop at "get expert human help" — no checklist honestly covers them.
- The baseline failure model is distilled, not yet measured on a specific 2B model (see eval/README.md).
- No autoupdate mechanism; continual learning is a manual loop via lesson candidates + re-benchmark.
