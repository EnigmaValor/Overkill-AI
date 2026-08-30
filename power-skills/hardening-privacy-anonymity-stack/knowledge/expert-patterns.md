# EXPERT PATTERNS — L3 (what seniors actually do)

Load for: hardening, high-stakes setups, review of an existing stack.

## 1. Firewall-first design (default deny, then punch)

Never "default allow + block bad stuff". Order of operations for ANY tunnel:
1. Write firewall rules BEFORE the tunnel comes up (or accept the pre-up window).
2. Punch exactly: loopback, tunnel iface, PINNED endpoint IP:port (IP, never hostname — resolving a hostname pre-tunnel = plaintext DNS leak by construction).
3. Counters on every drop rule: `nft list chain inet filter output` — a rising drop counter is your leak alarm.

## 2. Negative-test verification habit

Proof of enforcement is FAILURE on demand:
- Kill switch: drop tunnel → `ping -c3 1.1.0.1` MUST fail. If it answers, the switch is decorative.
- DNS lockdown: block/stop local resolver → resolution MUST break. If it still resolves, something else is answering (fallback path found).
- Tor DNS: misconfigure to `socks5://` deliberately in a test app → see the leak live, then fix to `socks5-hostname`.

## 3. Packet-level truth over web-test truth

Third-party leak sites are convenient but trust-limited (they test what they test). Mechanism checks that never lie:
```
tcpdump -ni <physical-iface> 'port 53 or port 853'        # must stay EMPTY (no plaintext DNS)
tcpdump -ni <physical-iface> 'not host <vpn-endpoint-ip>' # full-tunnel mode: must stay EMPTY
```
WebRTC/DNS-leak sites then CONFIRM, not replace, this.

## 4. Pin, don't resolve

Any security rule that needs DNS before it works is broken by design. Pin: endpoint IPs in nft/ufw rules; DoH resolver IPs (not just names) in browser if browser-DoH is intentionally used; `tailscale`-style magic-DNS off in this context.

## 5. The browser is its own network stack

Firefox/Chrome built-in DoH bypasses your system DNS stack silently. Decide explicitly:
- WANT browser DoH → pin provider + ECH on; system stack becomes backup.
- DON'T want it → disable via policy (`network.trr.mode=5` in Firefox; Chrome enterprise policy) or your dnscrypt filtering is bypassed.
WebRTC STUN exposes LAN/public IP unless disabled — Tor Browser disables it; vanilla browsers need checking (browserleaks.com/webrtc).

## 6. Provider apps vs. configs

Vendor kill-switch apps guard what they guard (often just their own traffic). Prefer raw configs (.conf/.ovpn) + YOUR firewall: inspectable, enforceable, no black box. If a provider app is mandatory, demand packet-level proof it blocks leaks (§3), not marketing.

## 7. Change windows

Never reconfigure a working privacy stack right before you NEED it. Test changes in a VM or during a window where failure is harmless. Every change → immediate re-run of verification-workflow.md subset.

## 8. Timing and volume hygiene (when adversary is strong)

Pausable behavior: don't fetch on a schedule; don't be the only user of a bridge; bulk-transfer at fixed hours = signature. Encryption hides content; rhythm leaks identity.

## 9. Local resolver stack pattern (advanced DNS)

Loop: apps → unbound@127.0.0.1:53 (cache+DNSSEC) → forward → dnscrypt-proxy@127.0.0.1:5353 (encryption/ODoH) → upstream.
Why: caching (fewer external queries), validation (DNSSEC lies become SERVFAIL), single enforced egress point for DNS on the box.
Then firewall allows ONLY dnscrypt-proxy's uid to reach the internet on 443/853 to its pinned upstreams.

## 10. Read the actual state, not the mental model

Before diagnosing anything: `ip a; ip route; resolvectl status; wg show; ss -tunlp | grep -E '9050|4444|53'` in one sweep. Senior move: capture state BEFORE forming any hypothesis. The state dump usually contains the answer.

## 11. Rollback discipline

Every change gets its inverse written down BEFORE applied (config backup: `cp wg0.conf wg0.conf.bak.$(date +%s)`; nft ruleset dump: `nft list ruleset > /root/nft.pre`). "We'll fix it if it breaks" is not a plan; broken privacy setups fail SILENTLY.

## 12. Say the quiet part

End every serious answer with what remains possible: "ISP still sees you use this VPN at these times with this volume; sites you log into know who you are; this box's compromise defeats everything here." Users act on stated limits, not assumed ones.
