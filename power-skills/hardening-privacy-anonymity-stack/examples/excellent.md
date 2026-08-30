# EXCELLENT EXAMPLE — full expert behavior

WHY EXCELLENT (read after): threat-model line, pinned constants, both families, verify
embedded at each step including a NEGATIVE test, rollback named before change, residual
risk stated, no fabricated versions.

---

USER: "I travel for work and use hotel/café Wi-Fi. I have a Mullvad-style WireGuard config
file. Debian 12 laptop. Set it up so nothing leaks, please."

ASSISTANT (excellent):

**Threat model (stated):** hiding traffic content and destinations from the local network
operator and ISP. NOT anonymity from targeted adversaries — a VPN shifts trust to the
provider, it does not anonymize.

**Step 0 — snapshot & backup**
```bash
cp wg0.conf wg0.conf.bak.$(date +%s)      # keep rollback ready
ip a; ip route; resolvectl status | tee /tmp/net-before.txt
```

**Step 1 — install**
```bash
sudo apt install wireguard-tools
```

**Step 2 — place config (as root)**
```bash
sudo install -m 600 wg0.conf /etc/wireguard/wg0.conf
```
Check it contains ALL of:
- `AllowedIPs = 0.0.0.0/0, ::/0` ← both families or IPv6 bypasses the tunnel
- `DNS = 10.64.0.1` (or your provider's resolver) ← DNS rides the tunnel
- `MTU = 1420` ← start point; we'll test
- `Endpoint = 203.0.113.10:51820` ← we PIN this IP in the firewall (hostnames would need
  DNS before the tunnel exists = leak by construction)

**Step 3 — kill switch BEFORE first connect** (rules exist before tunnel does):
```bash
PHYS=$(ip route show default | awk '{print $5; exit}')
sudo nft add table inet filter
sudo nft add chain inet filter output '{ type filter hook output priority 0; policy drop; }'
sudo nft add rule inet filter output oifname "lo" accept
sudo nft add rule inet filter output oifname "wg0" accept
sudo nft add rule inet filter output ip daddr 203.0.113.10 udp dport 51820 accept
sudo nft add rule inet filter output counter drop
```
(pre-save rollback: `sudo nft list ruleset | sudo tee /root/nft.pre`)

**Step 4 — up & verify**
```bash
sudo wg-quick up wg0
sudo wg show                 # EXPECT: "latest handshake: N seconds ago" within ~30s
curl -s ifconfig.me          # EXPECT: provider exit IP (compare: iproute pre-up in /tmp/net-before.txt)
curl -s -6 ifconfig.me       # EXPECT: tunnel v6 address — or clean failure if provider has none
ping -c3 -M do -s 1372 10.64.0.1   # EXPECT: 0% loss (proves MTU not blackholed)
```

**Step 5 — prove enforcement (the important part)**
```bash
sudo wg-quick down wg0
ping -c3 1.1.1.1             # EXPECT: 100% PACKET LOSS. Any reply = kill switch broken
sudo tcpdump -ni $PHYS port 53 &   # then browse 60s
# EXPECT: zero plaintext DNS packets on the physical interface
sudo wg-quick up wg0
```

**Step 6 — DNS truth check**
```bash
resolvectl status            # EXPECT: DNS=127.0.0.1? no — for this setup: DNS=10.64.0.1 on wg0, no fallback serving
dig example.com +short       # EXPECT: addresses (via tunnel resolver)
```

**Rollback:** `sudo nft -f /root/nft.pre; sudo wg-quick down wg0; sudo cp wg0.conf.bak.* /etc/wireguard/wg0.conf`

**Residual risk (what this does NOT do):**
- The VPN PROVIDER sees every destination and your home IP — trust shifted, not removed.
- Browser WebRTC can still expose your real IP to pages — check browserleaks.com/webrtc; use Tor Browser if that matters.
- Hotel captive portals must be signed in BEFORE connecting; do it with tunnel down but firewall rules already limiting you to the portal, ideally authenticate from a phone hotspot instead.
- This is leak-prevention, not anonymity: don't log into personal accounts and expect un-linkability.

Paste `wg show`, the ping result, and the tcpdump summary if anything deviates — we'll
localize from the output, not from guesses.

---

**Scoring anchors met:** threat-model line ✓ · verify-embedded ✓ · negative test ✓ · pinned
constants ✓ · both families ✓ · rollback-first ✓ · residual risk ✓ · version discipline
(no versions recited) ✓ · interaction economy (one checkpoint request at end) ✓.
