# TOOL REFERENCE — L1/L2 (commands, config, expected outputs)

Load for: any setup or diagnostic EXECUTE phase.
Default OS assumption: desktop Linux (Debian/Ubuntu unless stated). Fedora/Arch/macOS/Windows notes where they differ materially.
VOLATILE = fact that changes between releases; NEVER recite from memory in answers — give the check command.

## WireGuard

Packages: `wireguard-tools` (Debian/Ubuntu: `apt install wireguard-tools`; Fedora: `dnf install wireguard-tools`; kernel ≥5.6 has WG built in).

Key generation (never fabricate keys; generate or take user's):
```
wg genkey | tee privatekey | wg pubkey > publickey
chmod 600 privatekey
```

Client config `~/.config/wireguard/wg0.conf` or `/etc/wireguard/wg0.conf`:
```ini
[Interface]
PrivateKey = <client private key>
Address = 10.66.0.2/32, fd42:42:42::2/128
DNS = 10.66.0.1            # provider resolver; routes DNS into tunnel
MTU = 1420                  # lower to 1380 if blackhole (see edge-cases.md)

[Peer]
PublicKey = <server public key>
Endpoint = 203.0.113.10:51820   # provider endpoint; use IP in firewall rules
AllowedIPs = 0.0.0.0/0, ::/0    # FULL tunnel. Both families or IPv6 leaks.
PersistentKeepalive = 25        # only needed behind NAT
```

Commands and expected outputs:
| Command | Success looks like |
|---|---|
| `wg-quick up wg0` | `[#] ip link add wg0 type wireguard` … no error lines |
| `wg show` | `interface: wg0 … latest handshake: X seconds ago` ← HANDSHAKE PROVES connectivity |
| `ip route show default` | default via wg0 (full tunnel) |
| `wg-quick down wg0` | interface disappears; traffic must then FAIL if kill switch exists |

Failure signatures: `Key is not valid` (corrupt/key≠pubkey), handshake never appears (endpoint/MTU/firewall), handshake ok + no data (MTU blackhole).

Split tunnel = AllowedIPs narrowed (e.g. `10.0.0.0/8`); then default route stays physical and everything else leaks — only for threat models where that is intended.

## OpenVPN

- Config: provider `.ovpn` + credentials via `auth-user-pass pass.txt` (chmod 600).
- Run: `openvpn --config provider.ovpn` (or NetworkManager import).
- TCP variant (`.ovpn` with `proto tcp`, often port 443) when UDP is blocked.
- Expected: sequence of Initialization Sequence Completed lines; `tun0` appears in `ip a`.
- DNS: OpenVPN does NOT set DNS by itself reliably → push `dhcp-option DNS` handling via update-resolv-conf/script or set systemd-resolved manually. Common leak source.

## Tor (daemon + browser)

Install: `apt install tor torbrowser-launcher` (or download Tor Browser from torproject.org).
Core `/etc/tor/torrc` options (comment-aware edits, restart tor after):
```
SocksPort 9050
DNSPort 127.0.0.1:5353          # local DNS through Tor
ControlPort 9051
CookieAuthentication 1
UseBridges 1                     # only when needed
Bridge obfs4 <bridge-line>       # from bridges.torproject.org or MOAT in Browser
ClientTransportPlugin obfs4 exec /usr/bin/obfs4proxy
```
Bootstrap check: `journalctl -u tor -f` or Browser log — "Bootstrapped 100% (done)". Stuck at 50-85% → clock, blocking, or bridge dead (diagnostic-workflow.md §Tor).
Exit check: `curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip` → `"IsTor":true`.
CRITICAL: apps using SOCKS 127.0.0.1:9050 must do REMOTE DNS (`socks5-hostname`, not `socks5://`) or they leak DNS outside Tor.
Tor Browser ≠ using system tor; it bundles its own. Don't run both casually.

## I2P (i2pd reference; Java I2P console at 7657)

i2pd: `apt install i2pd` (or repo). Config `/etc/i2pd/i2pd.conf` (TOML-ish) — verify keys in `i2pd --help`/docs; VOLATILE.
Defaults: HTTP proxy 127.0.0.1:4444, SOCKS 4445, web console 127.0.0.1:7070.
Status: console "Tunnels" page — building → ESTABLISHED (takes minutes on first run; reseed may take longer).
Reseed (bootstrap) blocked → set `reseed.fallback` or fetch via proxy if your network blocks the reseed hosts.
Use: point browser/application at HTTP proxy 4444 for `.i2p` sites; NEVER send clearnet traffic through it expecting anonymity (outproxy optional/slow).
I2P differs from Tor: closed network, both-direction hidden services, no default exit to clearnet.

## dnscrypt-proxy

Facts (verified 2026-08): supports DNSCrypt v2 (+ post-quantum variant), DoH over TLS 1.3 and QUIC, Anonymized DNSCrypt, ODoH (RFC 9230, since v2.0.46), local DoH server (ECH support), filtering, cloaking. VOLATILE — check `dnscrypt-proxy --version`.
Config `/etc/dnscrypt-proxy/dnscrypt-proxy.toml` (edit, don't regenerate):
```toml
listen_addresses = ['127.0.0.1:53']
ipv6_servers = false            # match actual connectivity
dnscrypt_servers = true
doh_servers = true
odoh_servers = false            # enable + routes below if threat model wants it
require_nolog = true
require_nofilter = true
server_names = ['...']          # from public resolvers list; VOLATILE names
[anonymized_dns]
routes = [ { server_name='*', via=['<anonymized-relay>', '...'] } ]
```
Test: `dnscrypt-proxy -resolve example.com` (shows resolver + DoH/DNSCrypt status) and `dig @127.0.0.1 example.com`.
Hook into system: systemd-resolved → `DNS=127.0.0.1` + `FallbackDNS=` (EMPTY! fallback = plaintext leak) in `/etc/systemd/resolved.conf`, restart resolved; or point /etc/resolv.conf at 127.0.0.1.

## unbound (caching validating resolver)

`/etc/unbound/unbound.conf` core:
```
server:
  interface: 127.0.0.1
  access-control: 127.0.0.0/8 allow
  do-ip4: yes
  do-udp: yes
  do-tcp: yes
  tls-upstream: no            # recursive mode: direct to authoritative
forward-zone:                  # OR forwarding mode:
  name: "."
  forward-addr: 127.0.0.1@5353   # e.g. to dnscrypt-proxy on 5353
```
Two modes: RECURSIVE (default, no forward-zone) or FORWARD to dnscrypt-proxy. Pick one per fundamentals.md §3.
Test: `unbound-checkconf`, `dig @127.0.0.1 example.com` → status NOERROR, and `dig @127.0.0.1 dnssec-failed.org` → SERVFAIL (proves DNSSEC validation active).

## systemd-resolved

`resolvectl status` — shows per-link DNS. DANGER: `FallbackDNS` (distro default!) silently goes plaintext when primary fails; `DNSOverTLS=opportunistic` degrades to plaintext on failure. For privacy: `DNS=127.0.0.1`, `FallbackDNS=`, `DNSOverTLS=no` (your local proxy already encrypts), or `DNSOverTLS=yes` with real DoT upstreams.

## Firewall — kill switch reference pattern

nftables (modern) — default-drop for physical iface, punch only what must pre-exist:
```
table inet filter {
  chain output {
    type filter hook output priority 0; policy drop;
    oifname "lo" accept
    oifname "wg0" accept
    ip daddr 203.0.113.10 udp dport 51820 accept   # PINNED endpoint IP, not hostname
    # tor: meta skuid tor accept ; i2pd: meta skuid i2pd accept ; dnscrypt via its own rule
    counter drop
  }
}
```
ufw equivalent: `ufw default deny outgoing`; `ufw allow out on wg0`; `ufw allow out to 203.0.113.10 port 51820 proto udp`.
WireGuard hooks in wg0.conf: `PostUp = <add rules>`, `PostDown = <remove rules>` so enforcement follows the tunnel.
The negative test that proves it: `wg-quick down wg0 && ping -c3 1.1.1.1` → must 100% packet loss. Success = failure.

## Version-check commands (use THESE instead of reciting versions)

`wg --version` · `openvpn --version` · `tor --version` · `i2pd --version` · `dnscrypt-proxy --version` · `unbound -V` · `resolvectl --version` · `nft --version` · `uname -r`
Last verified state (2026-08): dnscrypt-proxy active w/ ODoH+PQ; i2pd active (2.6x series); Java I2P active (2.1x series, Java ≥17). Anything more precise: run the command.
