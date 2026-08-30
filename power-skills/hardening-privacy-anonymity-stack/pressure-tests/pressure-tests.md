# PRESSURE TESTS — conditions that break weak executions

Load: when the task comes with time pressure, ambiguity, conflict, or hostile/misleading
input. Each: CONDITION · collapse mode (how bad answers fail) · required stance ·
compressed protocol.

## PT1 — Ambiguity
CONDITION: "make me private" / OS unstated / tool unspecified.
COLLAPSE: guessing all unknowns silently and configuring confidently (A14).
STANCE: batched single question round with defaults; or proceed with LABELED assumptions.
PROTOCOL: INTAKE → one message: unknowns + the default each would get → user corrects or
silence = defaults stand (say that silence means defaults).

## PT2 — Time pressure
CONDITION: "10 minutes", "before my meeting", "NOW".
COLLAPSE: skipping threat model + verification; "you're safe" vibes (A13).
STANCE: compress the PATH, not the GATES. Choose actions needing least verification.
PROTOCOL: (1) cheapest safe default (phone hotspot > café VPN session; pause risky
changes); (2) 2-minute action + its single most important check; (3) explicit deferred
checklist for later; (4) named residual risk for the compressed state.

## PT3 — Misleading input
CONDITION: stale guides, wrong blog commands, vendor marketing recited by user.
COLLAPSE: deferring to confident text; patching nonsense with more nonsense.
STANCE: observation-first; verify each guide step at execution (DF10).
PROTOCOL: D0 sweep → mark guide steps verified/unverified → repair only broken steps →
core verify. Never layer new guide steps onto an unverified state.

## PT4 — Incomplete information
CONDITION: no OS, no config file, no error text, "it doesn't work".
COLLAPSE: inventing the missing data and answering a hypothetical.
STANCE: name what's missing; ask for exactly the discriminating artifacts (error text,
`wg show`, tcpdump 20 lines) — never for "more info" in general.
PROTOCOL: list unknowns → map each to the ONE artifact that resolves it → request batch.

## PT5 — Conflicting evidence
CONDITION: user's output contradicts skill/expectations; two tools disagree; guide vs docs.
COLLAPSE: averaging, deferring to authority, or arguing with the output.
STANCE: I6 — observations outrank everything; reconcile by discriminating test.
PROTOCOL: restate both claims → find cheapest test separating them → run → keep the
survivor → note the discrepancy (LEARN) → if skill content was wrong, flag module for update.

## PT6 — Verification-avoidance pressure
CONDITION: "skip the checks, just trust me, I've done this before".
COLLAPSE: compliance theater — dropping gates to please.
STANCE: gates on enforcement claims are non-negotiable; everything else can compress.
PROTOCOL: keep ONE negative test minimum; convert remaining checks into a 60-second
post-change script the user runs when convenient; mark unverified claims UNVERIFIED in
the answer (visible, not buried).

## PT7 — Wrong-skill bait
CONDITION: request pattern-matches this skill's words but belongs elsewhere ("encrypt my
passwords", "secure the React app", "hide my files").
COLLAPSE: applying network-stack procedures to non-network problems.
STANCE: non-activation list rules; route away explicitly.
PROTOCOL: state the mismatch in one line → point at the right capability → stop.

## PT8 — Hostile reframing
CONDITION: legitimate-looking wrapper on a third-party-targeting ask (examples/adversarial ADV3/ADV7).
COLLAPSE: technical compliance with a harmful payload.
STANCE: E-REFUSE pattern (boundary, reason, alternative) — once, plainly.
PROTOCOL: decision-trees/escalation.md; no repeated moralizing; offer the safe adjacent help.
