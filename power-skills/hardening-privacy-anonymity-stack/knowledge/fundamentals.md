# FUNDAMENTALS — L0/L1 Knowledge

Load for: concept explanations, tool choice, stack selection.
Provenance class: SKILL KNOWLEDGE (curated, version-pinned facts marked VOLATILE).

## 1. The only question that matters first: threat model

"Privacy" is not one property. Every configuration is an answer to:

| Question | Determines |
|---|---|
| WHAT must stay hidden? (traffic content? domains visited? your identity? your location? the FACT you use a tool?) | Which layers are needed |
| FROM WHOM? (local Wi-Fi peer? ISP? website? employer? legal adversary? targeted attacker? global observer?) | Strength + type of stack |
| WHAT HAPPENS if it fails? (embarrassment? fines? job loss? prison? physical danger?) | How much friction is justified |

Adversary classes and what each layer stops (Y = protected, P = partial, N = no):

| Adversary ↓ / Layer → | HTTPS alone | + Encrypted DNS | + VPN | + Tor (correct use) | + VM compartmentalization |
|---|---|---|---|---|---|
| Local network (Wi-Fi peer) | Y (content) P (domains via SNI*) | Y | Y | Y | Y |
| ISP (mass collection) | Y content / P metadata | P (hides domains from ISP) | Y | Y | Y |
| Website (identity link) | N | N | P (IP only) | Y | Y |
| VPN provider | — | — | (IS the observer) | Y | Y |
| Legal adversary demanding logs | N | N | P (depends on provider) | Y (no logs by design) | P |
| Targeted attacker on your box | N | N | N | N | P only with separation |
| Global passive observer (correlation) | N | N | N | P (timing correlation remains) | P |

\* SNI leakage shrinks as ECH (Encrypted Client Hello) deploys; treat as P, not Y, in 2026.

**Iron law: a VPN is a trust SHIFT (ISP → provider), not anonymity. Tor is an anonymity SYSTEM (no single trusted party). I2P is an anonymity network optimized for hidden services INSIDE itself.**

## 2. What each tool actually is

| Tool | What it does | What it does NOT do | Trust party |
|---|---|---|---|
| WireGuard | Kernel VPN, UDP-only, ~4k lines, fast, silent (no keepalive = invisible) | Obfuscation (traffic fingerprintable), no kill switch, no TCP fallback | Provider + endpoint |
| OpenVPN | Userspace VPN, UDP or TCP (TCP works where UDP is blocked), mature | Speed, trivial fingerprinting without obfuscation | Provider + endpoint |
| Tor daemon + Tor Browser | Onion routing through 3 relays;Browser sanitizes fingerprint | Protect non-browser apps unless routed; hide that you use Tor (ISP sees it) without bridges | No single party (design goal) |
| Bridges (obfs4, snowflake, meek) | Disguise Tor as other traffic / route entry via CDN | Change exit properties | Bridge operators |
| I2P (i2pd / Java I2P) | Garlic-routed INTERNAL network: eepsites, I2P torrenting, mail; both ends anonymous | General clearnet browsing (outproxies are optional, rare, slow) | Distributed net (no single party) |
| dnscrypt-proxy | Local DNS encryptor: DNSCrypt v2 (now with PQ variant), DoH (TLS/QUIC), Anonymized DNSCrypt, ODoH (RFC 9230) | Encrypt anything but DNS; hide domains from the DoH provider itself (ODoH mitigates) | Chosen resolver (+relay) |
| unbound | Full recursive resolver: you query authoritative servers directly, caching, DNSSEC validation | Hide your IP from authoritative servers (they see YOU, not a public resolver) | Nobody (you are the resolver) |
| systemd-resolved | System stub resolver (127.0.0.53); can do per-link DoT | Be a filter, be trusted by default; its FALLBACK to plaintext DNS is a leak source | Distro defaults |
| Firewall (nftables/ufw/pf) | The ONLY enforcement layer that actually stops leaks | Encrypt anything | Your own rules |

## 3. DNS decision table

| Goal | Correct layer | Wrong answer |
|---|---|---|
| ISP must not see my domains | Local dnscrypt-proxy → DoH/ODoH upstream; OR full VPN tunnel with DNS inside | Plain 53; "I use HTTPS so DNS is fine" |
| DNS must not leave this box unencrypted, ever | Firewall: block outbound 53/853 on physical iface + dnscrypt/unbound local | Hoping apps behave |
| Under Tor | Tor's own DNSPort / Browser socks5-hostname resolution | System DNS while "using Tor" |
| Under VPN | Tunnel DNS (AllowedIPs=0.0.0.0/0 + provider DNS or local resolver routed through tunnel) | ISP DNS "because it still works" |
| Hide domains even from the resolver | ODoH (relay + target) or Anonymized DNSCrypt; accept latency | Believing ordinary DoH hides you from the DoH provider |

Recursion vs forwarding: unbound-recursive hides queries from a public resolver but exposes your IP directly to authoritative servers and ISP still sees you query them (over 53 unless you tunnel). Forwarding via dnscrypt-proxy/DoH hides from ISP but exposes domains to the resolver. There is no free lunch — pick per threat model.

## 4. Ports and addresses worth memorizing (stable facts)

| Thing | Value |
|---|---|
| WireGuard | UDP only; endpoint port per provider (51820 common default) |
| OpenVPN | UDP 1194 / TCP 443 typical |
| Tor SOCKS | 127.0.0.1:9050 (Browser bundle uses its own) |
| Tor DNSPort | local DNS through Tor (e.g. 127.0.0.1:5353 or 53) |
| Tor ControlPort | 9051 (CookieAuthentication preferred over passwords) |
| I2P HTTP proxy | 127.0.0.1:4444 |
| I2P SOCKS proxy | 127.0.0.1:4445 |
| i2pd web console | 127.0.0.1:7070 (Java I2P console: 127.0.0.1:7657) |
| DNS plaintext | 53 (UDP+TCP) — must NEVER leave unencrypted on a physical iface |
| DoT | 853 |
| DoH | 443 (HTTPS) |
| dnscrypt-proxy default listen | 127.0.0.1:53 |

## 5. Identity, correlation, and honest limits

- Encryption hides content; metadata (who, when, how much) survives encryption.
- Timing correlation defeats Tor against a global observer: volume + timing at both ends link sessions even when content is unreadable.
- Any login (email, shopping, social) through an anonymity link re-creates the identity link. One identity per context; never mix.
- "100% anonymous/safe/untraceable" does not exist. State what IS achieved instead: e.g., "ISP sees Tor, exit sees site traffic but not your IP, sites see exit IP."
- Endpoint compromise beats every network layer. A keylogger inside Tor Browser is game over regardless of relays.

## 6. Vocabulary (so answers use exact terms)

TUN device · kill switch (firewall-enforced, not app-enforced) · leak (traffic leaving outside the intended tunnel) · DNS leak · IPv6 leak · WebRTC/STUN leak · bridge · pluggable transport (PT) · obfs4 (traffic-obfuscation transport) · snowflake (browser-proxy bridge) · meek (CDN-fronted) · eepsite (I2P hidden site) · outproxy (I2P's optional exit) · reseed (I2P bootstrap) · bootstrap (Tor reaching 100% via consensus) · AllowedIPs (WG routing table + access control) · PersistentKeepalive (NAT traversal, 25s) · DNSSEC (signing/validation) · ECH (Encrypted Client Hello) · ODoH (RFC 9230: relay-decoupled DoH) · split tunnel (only some routes through VPN) · negative test (proving safety by making traffic FAIL on purpose)
