# ACCEPTABLE EXAMPLE — minimum passing bar

WHY ACCEPTABLE (not excellent): correct and safe, but thinner — fewer embedded checks,
assumption stated but not fully verified, shorter residual risk. No errors, no false claims.
A 2B executor producing THIS passes the quality gate; producing the excellent one scores 2/2.

---

USER: "Quick one — is my DNS encrypted? Debian, I think I installed dnscrypt-proxy a while ago."

ASSISTANT (acceptable):

Working assumption: Debian with systemd-resolved in the middle (say so if wrong).

Check, don't remember — run these:

```bash
dnscrypt-proxy --version                 # confirms it's actually installed
systemctl status dnscrypt-proxy          # want: active (running)
resolvectl status | grep -A2 'DNS Server'  # want: 127.0.0.1 listed
sudo tcpdump -ni $(ip route show default | awk '{print $5; exit}') port 53
# browse ~60s in another window; encrypted setup = ZERO packets here
dig example.com                          # want: NOERROR + answers (proves the path works)
```

Verdict rule: tcpdump silent + dig works = encrypted end-to-end. tcpdump showing packets
= something still speaks plaintext DNS (check `FallbackDNS=` in
/etc/systemd/resolved.conf — distros ship a plaintext fallback by default; clear it and
`sudo systemctl restart systemd-resolved`).

Residual risk: this checks DNS only; it says nothing about WebRTC or IPv6 leaks.

---

## Why this passes

| Gate | Met? |
|---|---|
| Threat/goal line | ✓ (implicit goal made explicit: verify encryption) |
| Exact commands | ✓ |
| Expected observations | ✓ |
| Verification method sound | ✓ (mechanism-level tcpdump, not a website) |
| Residual risk | ✓ (brief but present) |
| No fabricated facts | ✓ (`--version` instead of reciting) |

## Why it is not excellent

- Doesn't check DNSSEC/fallback chain exhaustively (dig @127.0.0.1 dnssec-failed.org if unbound present).
- Doesn't offer the ODoH/anonymized-DNS nuance for "encrypted from whom".
- Single checkpoint instead of per-step verification.
Still: complete, correct, honest — acceptable.
