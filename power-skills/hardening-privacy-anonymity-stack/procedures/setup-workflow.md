# SETUP WORKFLOW — deterministic install/config per tool (Linux default)

Load: EXECUTE phase of SETUP tasks. OS must be known/labeled. Every section ends in VERIFY —
setup without its verify block is incomplete by definition.

## Universal pre-setup (do once per task)

1. State threat model line.
2. Backup whatever you will touch: `cp <file> <file>.bak.$(date +%s)`.
3. Snapshot state for later comparison: `ip a; ip route; resolvectl status | head -30`.
4. Plan the kill-switch rules BEFORE the first tunnel bring-up.

## S1 — WireGuard client

1. `sudo apt install wireguard-tools` (dnf: wireguard-tools; pacman: wireguard-tools).
2. Place provider config at `/etc/wireguard/wg0.conf` (chmod 600). Check: `AllowedIPs = 0.0.0.0/0, ::/0` (full tunnel; missing `::/0` = IPv6 leak), `DNS =` set to tunnel resolver, `MTU = 1420`.
3. Pre-write kill switch (tool-reference.md §Firewall) with endpoint IP pinned.
4. `sudo wg-quick up wg0`.
5. VERIFY: `sudo wg show` → handshake within ~30s; `curl ifconfig.me` → provider IP; negative test: `sudo wg-quick down wg0 && ping -c3 1.1.1.1` → 100% loss; tcpdump physical iface → only endpoint flow.
6. Enable at boot if wanted: `sudo systemctl enable wg-quick@wg0`.

## S2 — OpenVPN client

1. Install: `sudo apt install openvpn`.
2. Provider files into `/etc/openvpn/client/`; creds file chmod 600 if needed.
3. TCP-443 variant if UDP blocked (check `.ovpn` `proto`).
4. DNS handling decided EXPLICITLY (OpenVPN won't reliably do it): systemd-resolved → `DNS=127.0.0.1` local stack, or provider DNS pushed via script. Default: local dnscrypt (S4).
5. `sudo openvpn --config client.ovpn` (or NetworkManager import for permanence).
6. VERIFY: log ends `Initialization Sequence Completed`; `ip a` shows tun0; `curl ifconfig.me` = exit IP; tcpdump: no port-53 on physical iface; negative test with tunnel down.

## S3 — Tor + bridges when needed

1. `sudo apt install tor` (+ `obfs4proxy` for obfs4; Tor Browser separately from torproject.org).
2. Baseline `/etc/tor/torrc`: SocksPort 9050, DNSPort 127.0.0.1:5353, ControlPort 9051, CookieAuthentication 1.
3. If plain Tor blocked/flagged → append UseBridges/bridge lines (obfs4 or snowflake) — get lines from Tor Browser MoAT or bridges.torproject.org over a clean channel.
4. `sudo systemctl restart tor`.
5. VERIFY: log `Bootstrapped 100%`; `curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip` → `"IsTor":true`; browser check page; if Tor-over-VPN: confirm VPN was up FIRST.
6. Educate: no logins that matter through Tor; one identity per context.

## S4 — dnscrypt-proxy (+ optional unbound front)

1. `sudo apt install dnscrypt-proxy`.
2. Edit `/etc/dnscrypt-proxy/dnscrypt-proxy.toml`: listen `127.0.0.1:53` (or 5353 if unbound fronts), `require_nolog=true`, `require_nofilter=true`, pick server(s); ODoH per threat model.
3. If unbound fronts: unbound listens :53, dnscrypt on :5353, forward-zone in unbound → `127.0.0.1@5353`.
4. System: resolved → `DNS=127.0.0.1`, `FallbackDNS=` EMPTY, `DNSOverTLS=no` (local proxy encrypts); restart `systemd-resolved`.
5. VERIFY: `dnscrypt-proxy -resolve example.com` shows encrypted resolver; `resolvectl status` → only 127.0.0.1; `tcpdump -ni <phys> port 53` EMPTY while browsing; `dig @127.0.0.1 example.com` NOERROR; with unbound: `dig @127.0.0.1 dnssec-failed.org` → SERVFAIL.

## S5 — i2pd

1. `sudo apt install i2pd` (or distro repo/vendor per VOLATILE docs).
2. Defaults are sane: HTTP 4444, SOCKS 4445, console 7070. Configure app proxies per-application.
3. `sudo systemctl enable --now i2pd`.
4. VERIFY: console 127.0.0.1:7070 reachable; tunnels reach ESTABLISHED (minutes; first run may reseed slowly); load an eepsite via proxy 4444. If 0 tunnels → diagnostic-workflow §I2P.

## S6 — Kill switch (standalone hardening)

1. Enumerate what may leave: loopback, tunnel iface, pinned endpoint, per-service uids (tor, i2pd, dnscrypt).
2. nft/ufw rules per tool-reference.md; add `counter` to drops.
3. VERIFY (mandatory negative tests): tunnel down → ping fails; stop dnscrypt → dig fails; counters increase on drop attempts.
4. Record rollback: `nft list ruleset > nft.pre-change` BEFORE applying.

## Post-setup completion (every S*)

Run verification/verification-workflow.md §CORE (5 checks) and emit FINALIZE contract:
threat-model line, steps, verification evidence, rollback, residual risk.
