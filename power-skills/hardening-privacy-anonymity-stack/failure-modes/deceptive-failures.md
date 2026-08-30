# DECEPTIVE FAILURES — everything looks fine; it isn't

These are the failures that create FALSE confidence. Each: ILLUSION · REALITY · UNMASKING TEST.

## DF1 The Green Lock illusion
ILLUSION: VPN client shows Connected; user says "so I'm anonymous".
REALITY: green light proves a socket, not enforcement, not v6, not DNS, not browser behavior.
UNMASK: CORE-5 + tcpdump. The indicator is step zero of verification, never the end.

## DF2 The "It Works" plaintext fallback
ILLUSION: dnscrypt-proxy configured, browsing normal.
REALITY: resolved FallbackDNS (distro default) answered all along, over plaintext 53.
UNMASK: tcpdump port 53 while forcing primary down: if resolution survives, a fallback exists — find it (`resolvectl status`).

## DF3 The invisible IPv6 bypass
ILLUSION: ip4 shows tunnel; sites load.
REALITY: OS prefers v6; native v6 flows outside tunnel all along (prefer v6 default).
UNMASK: `curl -6 ifconfig.me` + `ip -6 route` + test-ipv6.com.

## DF4 The torified-browser-only mirage
ILLUSION: Tor Browser green; user believes "my traffic uses Tor".
REALITY: ONLY the browser does; background apps, updates, DNS go plaintext.
UNMASK: tcpdump during non-browser activity; `ss -tunp` owner mapping.

## DF5 The proxy-chained exit confusion
ILLUSION: browser set to proxy X "so sites see the proxy".
REALITY: WebRTC/STUN or DNS still reports real IP alongside.
UNMASK: ipleak.net full tool set; browserleaks webrtc.

## DF6 The split-tunnel side door
ILLUSION: only "work apps" use tunnel; everything else "normal".
REALITY: default route physical → the "everything else" IS the leak surface when policy said full hide.
UNMASK: `ip route show default` + tcpdump not-host-endpoint.

## DF7 The instant-success trap
ILLUSION: new DNS setup "already faster!".
REALITY: old resolver still serving (cache); new one never in path (H15).
UNMASK: stop new service — resolution MUST break.

## DF8 The updater that phones home
ILLUSION: stack hardened; box quiet.
REALITY: package updaters, NTP, telemetry re-identify the box on schedule over plaintext.
UNMASK: idle-box tcpdump for 10 min; inventory listeners/cron/systemd timers.

## DF9 The benevolent captive portal
ILLUSION: hotel portal signed in, now VPN on, all good.
REALITY: pre-auth period already leaked MAC/hostname/OS probes; portal cookie persists identity.
UNMASK: none needed post-hoc — PREVENT: portal auth in throwaway VM/hotspot (edge-cases).

## DF10 The trust-the-Guide staleness
ILLUSION: 3-year-old blog walkthrough "still works".
REALITY: ports/defaults/version behaviors changed; some steps now silently no-op.
UNMASK: every guide step re-verified by observation at execution time (verify-embedded steps).

## DF11 The two-VPN double-count
ILLUSION: running two tunnels "for double protection".
REALITY: nested tunnels usually degrade MTU/PMtu to failure, create routing surprises, add trustee without adding secrecy (one uncompromised layer already hides from ISP).
UNMASK: `ip route` rule-by-rule; ask what adversary the second layer answers.

## DF12 The forensic half-life of configs
ILLUSION: uninstalled = gone.
REALITY: leftover resolv.conf pin at 127.0.0.1, dead nft pinhole, stale systemd unit = future outage or silent bypass.
UNMASK: post-teardown sweep (recovery-workflow §Teardown verify).
