# DIAGNOSTIC WORKFLOW — systematic debugging for privacy stacks

Load: VERIFY failed, or any "it's broken/weird" task. This loop is mandatory; shotgunning
fixes (reboot/reinstall/switch-provider) without localization is a violation.

```
OBSERVE → REPRODUCE → LOCALIZE → HYPOTHESIZE → SMALLEST DISCRIMINATING TEST → RUN →
ACCEPT/REJECT → FIX ROOT CAUSE → REGRESSION TEST → RE-VERIFY
```

## D0 — OBSERVE (state sweep, before ANY hypothesis)

```
ip a; ip route; resolvectl status; wg show 2>/dev/null; ss -tunlp | grep -E ':(53|9050|9051|4444|4445|7070)'
systemctl --failed; timedatectl; sudo nft list ruleset | head -40
```
Record verbatim. Most answers live here.

## D1 — REPRODUCE

Make the failure happen on demand (specific domain? specific app? after boot? after N minutes?).
Not reproducible → timing/NAT/clock class of causes (edge-cases.md).

## D2 — LOCALIZE the layer (test boundaries outward)

| Boundary test | Result interpretation |
|---|---|
| `ping -c3 <tunnel-gateway-IP>` | fails → tunnel layer (S: keys/endpoint/MTU) |
| `ping -c3 1.1.1.1` (through tunnel) | gateway OK + this fails → routing/firewall inside tunnel |
| `dig @127.0.0.1 example.com` | fails → local resolver layer |
| `dig @<tunnel-or-upstream-DNS> example.com` | local OK + this fails → resolver egress layer |
| `curl --resolve example.com:443:<known-ip> https://example.com` | DNS layer OK + this fails → transport/TLS/MTU |
| `curl ifconfig.me` vs browser | one works → application/browser layer (DoH, proxy settings, socks5 vs socks5-hostname) |

## D3 — HYPOTHESIZE (one at a time, written down)

Format: "Because <evidence>, I believe <single cause>. Test <X> will show <Y> if true, <Z> if false."

## D4 — SMALLEST DISCRIMINATING TEST

Pick the cheapest test whose outcomes differ between hypotheses. Examples:
- MTU vs endpoint-dead: `ping -M do -s 1372 <gateway>` — small-packet pass = MTU; nothing passes = endpoint/keys.
- Clock vs blocking (Tor stuck): `timedatectl` first (free); then snowflake bridge swap.
- FallbackDNS vs dnscrypt misconfig: `resolvectl status` shows fallback active? then tcpdump confirms plaintext.
- App socks5:// vs system DNS: tcpdump port 53 DURING the app's request.

## D5 — RUN, ACCEPT/REJECT

Reject → next hypothesis (return D3, max 3 cycles total, then ESCALATE with the full evidence log).
Accept → D6.

## D6 — FIX ROOT CAUSE (not the symptom)

Confirm the fix changes the discriminating test's outcome. Example: MTU fix → `ping -M do` now passes at larger sizes.

## D7 — REGRESSION + RE-VERIFY

Re-run the failed check AND the CORE-5 subset touching that layer. A fix that breaks another guarantee (e.g., raising MTU fixed speed but killed handshake after reboot) is not a fix.

## Fast-path tables (symptom → first 3 hypotheses in order)

### Tor
| Symptom | H1 | H2 | H3 |
|---|---|---|---|
| Stuck Bootstrapped 50% | clock skew (timedatectl) | OR connections blocked (try snowflake) | dead bridge (swap) |
| 100% but sites unreachable | exit down (new circuit) | DNS via socks5:// in app | firewall blocking exit traffic |
| IsTor:false via curl | wrong port / service down | curl used socks5 not socks5-hostname | different tor instance |

### WireGuard
| Symptom | H1 | H2 | H3 |
|---|---|---|---|
| `Key is not valid` | pasted key corrupted/whitespace | wrong file edited | pubkey/private mismatch |
| No handshake | endpoint IP:port typo | keys swapped sides | UDP blocked (try TCP variant — needs OpenVPN/other) |
| Handshake + dead traffic | MTU (ping -M do test) | AllowedIPs too narrow | endpoint NAT timeout (keepalive) |
| IPv6 leaks | AllowedIPs missing ::/0 | DNS v6 outside | system v6 autoconf |

### DNS stack
| Symptom | H1 | H2 | H3 |
|---|---|---|---|
| Works but tcpdump shows 53 | FallbackDNS live | resolv.conf overwritten (dhclient) | app bypassing system |
| SERVFAIL everywhere | dnscrypt dead (status) | upstream unreachable via tunnel | DNSSEC false negatives (clock) |
| Slow first, fine after | cold cache (benign) | tunnel MTU on DoH | upstream rate-limit |
| dig ok, browser fails | browser DoH pinned elsewhere | proxy settings in browser | hosts entry |

### I2P
| Symptom | H1 | H2 | H3 |
|---|---|---|---|
| 0 tunnels | clock | reseed blocked (console log) | firewall NAT traversal |
| Eepsite not found | addressbook miss | site down (try another known site) | tunnels still building |
| Proxy 4444 refused | i2pd not running | port changed in config | bound to wrong address |

## Anti-patterns (explicitly banned as FIRST moves)

reinstall-the-OS-class panic · reboot as a fix · switching providers before localizing ·
"disable IPv6" as universal answer · piping curl|bash to "update" tooling mid-incident ·
two fixes at once (then you know nothing).
