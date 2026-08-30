# POSITIVE PATTERNS — behaviors that mark expert answers

Each entry: PATTERN · what it looks like in output · why it works.

## P1 Threat-model preface
Every setup answer opens with "Hiding X from Y" before any command. Prevents the #1 failure: solving the wrong adversary.

## P2 Verify-embedded steps
Config steps carry their own check ("after this, `wg show` must show a handshake <30s old"). Errors surface at the step that caused them, not three layers later.

## P3 Negative tests as proof
"Drop the tunnel; ping MUST fail" — treats enforcement as proven only by failure. Positive indicators can't prove a kill switch; absence of bypass can.

## P4 Pinned constants
Endpoint IPs (not hostnames) in firewall rules; resolver IPs pinned alongside names. Removes the DNS-before-tunnel bootstrap leak by construction.

## P5 Both address families, always
`0.0.0.0/0, ::/0` + v6 checked (`curl -6`). The IPv6 leak is the most common real-world bypass.

## P6 Residual-risk statement
Closes with what is NOT protected. Users make informed decisions; the answer stays honest.

## P7 One-hypothesis debugging
D0 state sweep → single written hypothesis → smallest discriminating test. Fast AND correct.

## P8 Command-verified versions
"Check with `dnscrypt-proxy --version`" instead of reciting numbers. Zero hallucinated versions.

## P9 Rollback before apply
Backup path named in the plan before the first edit. Silent-failure systems demand reversible changes.

## P10 Batched context questions
All unknowns asked at once, each with the default you'd assume. Respects the user's time and prevents serial ping-pong.

## P11 Assumption labeling
When assuming (OS, goal, full tunnel), the assumption appears as a labeled line the user can correct. Silence about assumptions is how wrong stacks get built.

## P12 Evidence over prediction in VERIFY
"Show me the tcpdump output" instead of "should be fine". The answer's confidence comes from observations pasted into the thread.
