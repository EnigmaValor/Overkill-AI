# VERIFICATION WORKFLOW — proving, not believing

Load: VERIFY phase of every task; any "is this safe/leaking?" request.
Protocol: run CORE first, then section(s) matching the stack. Evidence = command + actual
observation. A check you didn't run is a check that doesn't exist.

## CORE-5 (any stack, ~5 minutes)

| # | Check | Command | PASS looks like |
|---|---|---|---|
| 1 | Exit identity | `curl -s ifconfig.me` (or ipleak.net) | expected tunnel/exit IP, NOT home IP |
| 2 | DNS egress | `sudo tcpdump -ni <phys-iface> port 53 or port 853` while browsing 2-3 min | ZERO packets |
| 3 | Non-tunnel egress (full-tunnel mode) | `sudo tcpdump -ni <phys-iface> 'not host <endpoint-ip>'` | only endpoint flow (VPN); Tor: only relay/bridge flows |
| 4 | Resolver truth | `resolvectl status` (+ `cat /etc/resolv.conf`) | 127.0.0.1 / tunnel DNS only; NO FallbackDNS live path |
| 5 | Negative enforcement | drop tunnel (`wg-quick down` / stop openvpn) → `ping -c3 1.1.1.1` | 100% LOSS. Any reply = kill switch broken |

## Stack-specific

### VPN (WireGuard/OpenVPN)
- `wg show` → recent handshake (WG) / `Initialization Sequence Completed` (OVPN).
- `ip route show default` → via tunnel device.
- IPv6: `curl -6 ifconfig.me` → tunnel v6 or clean failure (not native v6!). test-ipv6.com.
- MTU sanity: `ping -M do -s 1372 <tunnel-gateway>` succeeds (else blackhole risk).
- DNS leak site (ipleak.net / dnsleaktest.com extended): ONLY provider/your-resolver entries — CONFIRMS tcpdump, doesn't replace it.

### Tor
- `curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip` → `"IsTor":true`.
- Browser: check.torproject.org green.
- ISP-invisibility (bridges/VPN): tcpdump physical iface during use → NO direct Tor relay IPs, only bridge/VPN flow.
- App DNS: with Tor-only stack, `tcpdump port 53` must be silent; any 53 traffic = socks5:// misuse somewhere.

### I2P
- Console 127.0.0.1:7070: tunnels ESTABLISHED, bandwidth moving.
- Eepsite loads via proxy 4444 (console jump page OK as control).
- Clearnet leak check: with system untouched, tcpdump shows no unexpected correlation to I2P browsing.

### DNS stack
- `dnscrypt-proxy -resolve example.com` → encrypted resolver named.
- `dig @127.0.0.1 example.com` NOERROR; latency low 2nd time (cache).
- DNSSEC (unbound): `dig @127.0.0.1 dnssec-failed.org` → SERVFAIL (this is the PASS).
- Browser-DoH decision verified: about:networking#dns or chrome://net-internals — matches policy.

### Browser fingerprint layer
- browserleaks.com/webrtc → no public IP via STUN (or WebRTC off).
- ipleak.net → all tools' IP entries = expected.

## Evidence recording format (use verbatim in FINALIZE)

```
CHECK: <name>
CMD:   <command>
OBS:   <actual output pasted/observed>
VERDICT: PASS/FAIL — <one-line reason>
```

## Rules

1. Observations are ground truth. If output contradicts theory, theory loses (→ diagnostic-workflow).
2. Each enforcement claim needs a NEGATIVE test. Each privacy claim needs a POSITIVE capture.
3. Re-verify after ANY change, even "trivial" ones. Verification is cheap; silent leaks are not.
4. If user cannot run a check (permissions, headless), degrade honestly: mark claim UNVERIFIED, never "probably fine".
