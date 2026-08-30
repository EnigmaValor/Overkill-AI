# ANTI-PATTERNS — recognizable failure shapes (do not produce these)

Each: SHAPE · why it fails · what to do instead.

## A1 "VPN = anonymity" answer
Claims/implies a VPN makes the user anonymous or untraceable. False: provider sees everything; correlation survives. Instead: trust-shift framing + fundamentals §1 table.

## A2 Status-indicator verification
"Connected ✓ — you're protected." Indicators lie (IPv6 bypass, fallback DNS, app-specific tunneling). Instead: CORE-5 with captures and a negative test.

## A3 Hostname firewall rules
`ufw allow out to vpn.example.com` — needs DNS pre-tunnel → bootstrap leak or deadlock. Instead: pin the IP.

## A4 Hostname-recited versions
"The current version is 2.1.x so…" — hallucination magnet. Instead: check commands (tool-reference §version-check).

## A5 Shotgun debugging
"Try rebooting, then reinstall, then switch provider." Destroys evidence, learns nothing. Instead: diagnostic-workflow D0→.

## A6 Dual-fix commits
Applying MTU change + rules change + service restart in one move. If it "works", you don't know why. Instead: one change per discriminating test.

## A7 Unconditional IPv6 disabling
Reflexive `sysctl disable_ipv6=1` as "the fix". Breaks v6-only networks; hides rather than fixes tunnel config. Instead: route v6 through tunnel or firewall v6 egress deliberately.

## A8 Missing residual risk
Setup ends at "done." Users over-trust. Instead: mandatory "this does NOT protect against" line.

## A9 Fabricated provider facts
"Provider X keeps no logs, verified." Unverifiable marketing recited as fact. Instead: criteria + audit-status-as-claim, marketplace marked VOLATILE.

## A10 DoH double-stack confusion
Configuring dnscrypt-proxy but leaving browser DoH on (or resolved fallback live) — two DNS systems, one of them uncontrolled. Instead: pick the controlling layer explicitly (expert-patterns §5).

## A11 Socks5 without remote DNS
Teaching `socks5://127.0.0.1:9050` for Tor apps. Local resolution = DNS leak. Instead: `socks5-hostname://` everywhere through Tor.

## A12 Pipe-to-shell installs
`curl https://random.site/install.sh | sudo bash` for "privacy tools". Supply-chain own-goal. Instead: distro packages/signed repos; fetch-read-run.

## A13 Capability theater under pressure
When rushed: skipping threat model/verification "just this once". The pressure tests in pressure-tests/ exist because this is when leaks happen. Instead: compressed-but-complete path (H-patterns in pressure-tests).

## A14 Silent assumption stacking
Guessing OS, guessing goal, guessing full-tunnel — three stacked guesses produce confident wrong answers. Instead: ask once, batched, with defaults (P10/P11).
