# LAYERED ARCHITECTURES — L2 (compositions + honest risk statements)

Load for: multi-network stacks, "should I use Tor and a VPN", censorship contexts.
Rule: name the composition EXACTLY as defined here; do not blur them. Direction of layering is the whole point.

## Composition definitions

| Name | Meaning (outside→in) | ISP sees | Provider sees | Exit/site sees | Use when |
|---|---|---|---|---|---|
| VPN only | traffic→WG/OpenVPN | VPN endpoint, volumes | EVERYTHING (your IP + destinations) | VPN exit IP | Hide from local net/ISP; geoshift; trust provider |
| Tor only | traffic→3-relay circuit | "You use Tor" (IP+timing, unless bridges) | (no provider) | Tor exit IP; exit reads plaintext HTTP | Anonymity from sites; ISP blocking irrelevant |
| Tor-over-VPN | traffic→Tor→VPN? NO — VPN first, then Tor through it | VPN endpoint only | You use Tor (not content) | Tor exit IP | Tor usage itself must be invisible to ISP; ISP blocks/throttles Tor |
| VPN-over-Tor | traffic→VPN→inside Tor circuit | "You use Tor" | Tor exit as your IP (accountable!) | VPN exit IP (fixed, non-Tor-looking) | Rare: need non-Tor exit IP + account isolation; NOT for anonymity beginners |
| I2P side-by-side | I2P proxy ports used by I2P-aware apps while Tor/VPN handle other traffic | per-layer | per-layer | only inside I2P | I2P services; never mix proxies between networks |

## Tor-over-VPN setup order (the safe direction)

1. Bring VPN up FIRST with kill switch allowing only endpoint (tool-reference.md).
2. Verify tunnel: handshake + external IP = VPN exit + negative test.
3. Start tor / Tor Browser — its traffic rides the tunnel; ISP sees only the VPN.
4. Verify: check.torproject.org → IsTor true; tcpdump on physical iface → only encrypted VPN flow.
FAILURE MODE: doing it in reverse (VPN started after Tor) briefly exposes Tor usage; also if VPN drops, Tor must NOT fall back to plaintext — kill switch covers it only if rules are right.

## VPN-over-Tor — warn before doing

Provider sees you as a Tor exit — fine. BUT the account identity becomes the stable correlation point across sessions. Use a provider account paid without personal linkage, or don't do this. For a 2B executor: do not recommend this composition unless the user's stated threat model explicitly needs a stable non-Tor exit IP; default recommendation is Tor-over-VPN or Tor with bridges.

## DNS layering per stack (crisp matrix)

| Stack | DNS must go | Forbidden pattern |
|---|---|---|
| VPN | Into tunnel: provider DNS via wg0, or local dnscrypt listening only on loopback | resolv.conf still pointing at ISP |
| Tor | Through Tor: socks5-hostname everywhere; DNSPort for local stub | socks5:// (local DNS!) — the classic Tor DNS leak |
| Tor-over-VPN | DNSPort of tor (which itself rides VPN); NOT system DNS | "system DNS is fine because VPN" — it is, only if kill switch proven; still cleaner via DNSPort |
| I2P | Applications resolve via I2P proxies (`.i2p` handled inside); clearnet DNS irrelevant for I2P apps | Pointing browser at 4444 for clearnet sites and expecting anonymity |

## Censorship circumvention decision order

1. Plain Tor blocked/flagged → try built-in bridges (snowflake easiest, meek for hard nets, obfs4 classic).
2. obfs4 bridges blocked too → get private bridges (MoAT inside Tor Browser, trusted contact, or bridges.torproject.org over a clean channel).
3. All bridge traffic fingerprinted → VPN-over-QUIC/TCP-443 front (Tor-over-VPN with TCP-443 OpenVPN) or meek-like CDN fronting.
4. Whole VPN protocol family blocked → obfuscated transports (AmneziaWG-style WG obfuscation, udp2raw, shadowsocks-class) — flag as L3, verify current tooling before recommending specifics (VOLATILE).

## Compartmentalization pattern (when stakes are high)

- Separate VM or machine per identity/context (personal / anonymous / work). Whonix-style: gateway VM owns networking; workstation VM has NO direct network — leaks become structurally impossible, not policy-prevented.
- Clipboard/shared folders between compartments are identity bridges. Treat them as hostile.
- One identity per context forever: logins, fonts, habits, timing all correlate.

## Risk statements to attach automatically

- To ANY VPN setup: "Provider sees all cleartext destinations; anonymity is NOT provided."
- To ANY Tor setup: "Exit reads plaintext HTTP; ISP (without bridges) sees Tor usage; correlation still possible for global observers; logins re-link identity."
- To ANY I2P setup: "Anonymity applies INSIDE I2P; clearnet via outproxy ≠ Tor-grade path; first-run bootstrap is slow."
- To ANY single-machine stack with high stakes: "Endpoint compromise defeats all layers; consider VM separation."
