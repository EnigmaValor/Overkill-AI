# STACK SELECTION — threat model → architecture

Load: EDUCATION/PLAN for stack choice. Rows ordered by adversary strength. Pick the FIRST
row that covers the stated adversary; adding more layers than needed adds attack surface
and failure modes, not safety.

| # | Stated adversary / goal | Recommended stack | Why | Explicit residual risk to state |
|---|---|---|---|---|
| 1 | Coffee-shop Wi-Fi / hostile LAN | Any reputable VPN (WG preferred) + kill switch; DNS inside tunnel | LAN sees only encrypted flow | Provider sees everything |
| 2 | ISP mass collection / data retention | VPN (WG) + kill switch + local encrypted DNS (dnscrypt DoH/ODoH) | ISP sees endpoint+volume only | Provider+resolver see destinations; timing survives |
| 3 | ISP must not even see WHICH privacy tool | Tor-over-VPN (or VPN then Tor Browser w/ bridges) | ISP sees only VPN | Provider sees "uses Tor"; not content |
| 4 | Websites/targets must not link identity | Tor Browser (bridges if Tor flagged) | 3-hop circuit, browser sanitized | Exit reads plaintext HTTP; logins re-link; correlation possible |
| 5 | Hidden-service usage / I2P ecosystem | i2pd + I2P-aware apps | Both-ends anonymity inside I2P | No general clearnet anonymity |
| 6 | Legal adversary with subpoena power (provider logs) | Tor (no-logs-by-design) over clean network; consider VM gateway | Provider subpoena yields nothing for Tor path | Endpoint + traffic analysis remain |
| 7 | Targeted attacker on your machine | Stack 4/6 INSIDE compartmentalized VMs (gateway/workstation split) | Leaks structurally impossible from workstation | Physical/kernel compromise still wins |
| 8 | Global passive observer | Stack 7 + strict identity discipline + timing hygiene | Raises cost dramatically | No personal guarantee exists; say so |

## Selection rules

- If the user's goal is anonymity FROM SITES but they propose "just a VPN" → correct the model (fundamentals §1 table), recommend Tor Browser; VPN is optional add-on to hide Tor usage from ISP.
- If the user's goal is privacy from ISP but they propose Tor → the cheap answer (VPN+DNS) is proportionate; Tor adds latency and exit exposure for nothing extra.
- If stakes are physical safety → jump to row ≥7, recommend expert human review; flag ESCALATE.
- Never recommend VPN-over-Tor unless user states the specific need (stable non-Tor exit IP) — see layered-architectures.md warning.
- Censorship context: select by what is blocked (bridges ladder in layered-architectures.md §circumvention).

## Provider/product claims policy

Vendor claims ("no logs", "military grade", "anonymous") are marketing until independently
audited. State criteria (open clients, WG support, ram-only servers, audits, jurisdiction)
— not brand endorsements as fact. Marketplace facts are VOLATILE.
