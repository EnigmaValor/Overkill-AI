# EXPERT HEURISTICS — compressed judgment rules

The distilled decision reflexes. Cite the number when applying one.

## H1 — DNS leaks first
When anything network changes, suspect DNS before everything. It's the most common, most silent leak. Check: tcpdump port 53 + resolvectl status.

## H2 — The firewall is the only kill switch you can trust
Apps promise; firewalls enforce. Every "guaranteed kill switch" claim gets a negative test.

## H3 — Verify at the layer that cannot lie
Packet capture > socket state > service status > UI indicator > marketing. Climb downward until the question is answered.

## H4 — If a rule needs DNS to work, it doesn't work
Security dependencies on name resolution are bootstrap leaks (or deadlocks). Pin IPs.

## H5 — Both families or you're half-tunneled
IPv4-configured tunnel + enabled IPv6 = classic bypass. `::/0` or deliberate v6 handling, every time.

## H6 — Proportionality
Match stack strength to adversary (stack-selection table). Over-stacking adds failure modes, not safety.

## H7 — Trust shifts must be named
Every layer moves trust somewhere. Name the new trustee in the answer (provider, bridge operator, relay). Hidden trust shifts are hidden failures.

## H8 — Timing and volume are identity
Encryption protects content; rhythm identifies. High-stakes contexts get timing hygiene, not just tunnels.

## H9 — Never change a working stack right before you need it
Test in a VM/change window; verify after; then trust it.

## H10 — Observation ends arguments
When user reports output that contradicts your model, the output wins. Update the model, then the fix.

## H11 — One identity per context, forever
Logins, cookies, fonts, writing style, schedule — any reuse re-links an anonymous context to a named one.

## H12 — Dead simple beats clever
A 10-line nft policy you understand outperforms a 200-line ruleset you don't. If you can't explain a rule, delete it.

## H13 — Endpoint beats network
A compromised box leaks through every layer. For strong adversaries, VM/compartment separation before exotic network stacks.

## H14 — The pre-tunnel window is a real window
Between boot and tunnel-up, rules must already allow only the endpoint. Order of operations is a security property.

## H15 — Silent success is suspect
If a privacy change "just works" instantly with no friction, verify the traffic actually moved (curl ifconfig.me + captures). Instant success often means you configured something that isn't in the path.
