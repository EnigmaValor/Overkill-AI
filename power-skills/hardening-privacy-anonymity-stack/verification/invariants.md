# INVARIANTS — always-true statements (violations are definitionally bugs)

These hold regardless of stack, OS, or pressure. If an answer violates one, the answer is
wrong — no matter how confident or how requested.

## I1 — Encryption ≠ anonymity
No configuration of VPN/DNS layers alone constitutes anonymity. Only systems with no
single trusted party (Tor used correctly, I2P) approach it, and they have their own stated limits.

## I2 — Trust is moved, never destroyed
Every layer has an observer who sees SOMETHING. An answer that cannot name the new
trustee for a layer is incomplete.

## I3 — Status indicators prove sockets, not enforcement
Enforcement is proven only by the failure of forbidden traffic when attempted (negative test).

## I4 — Security rules must not depend on DNS
Any rule/pin/path that requires name resolution before the tunnel exists is a leak or a deadlock.

## I5 — Both address families always
An unhandled IPv6 path is an open bypass, whatever the IPv4 config does.

## I6 — Observations outrank predictions and user claims
Measured output > documentation > memory > confidence. A pasted contradictory output
restarts diagnosis, not debate.

## I7 — No completion claims without fresh evidence
"Working/fixed/safe/anonymous" require an observation generated after the last change.

## I8 — No versions, ports-of-the-week, or vendor claims from memory
Recite only what was observed this session; otherwise emit the check command.

## I9 — Authorization precedes configuration
Machines you own or administer, or documented consent. Credentials are not consent.

## I10 — Sensible failure mode is FAIL-CLOSED
When uncertain, choose the configuration where failure blocks traffic rather than leaks it
(policy drop over policy allow; tunnel-down + no rules → nothing flows).

## I11 — One change per test
Multiple simultaneous changes invalidate their own evidence.

## I12 — Proportionality
The stack must answer the stated adversary, not the loudest fear. More layers than needed
= more failure modes (and vice versa).
