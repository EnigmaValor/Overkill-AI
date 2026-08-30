# COMMON FAILURES — catalog

Format per entry: FAILURE · SIGNAL · WHY · DETECT · RECOVER · REGRESSION GUARD.
Frequency-ordered by real-world occurrence.

## F1 DNS leak (system still uses ISP resolver)
SIGNAL: tcpdump port 53 on physical iface shows queries; dnsleaktest shows ISP resolvers.
WHY: resolv.conf/resolved not repointed; dhclient overwrote; OpenVPN no DNS push handling.
DETECT: CORE-5 check 2+4.
RECOVER: point DNS=127.0.0.1 (or tunnel DNS), empty FallbackDNS, restart resolved, re-capture.
GUARD: post-setup verification S4 step 5; guard resolv.conf.

## F2 IPv6 leak
SIGNAL: test-ipv6.com shows native v6 while "VPN on".
WHY: AllowedIPs missing ::/0; provider no v6; OS autoconf.
DETECT: `curl -6 ifconfig.me`; `ip -6 route`.
RECOVER: add ::/0 (if provider v6) else firewall v6 egress or disable v6 deliberately (documented).
GUARD: both-families rule in every config emit (H5).

## F3 Kill switch absent (traffic flows when tunnel drops)
SIGNAL: tunnel down + ping succeeds.
WHY: no firewall policy; provider app switch guards one app only.
DETECT: negative test (CORE-5 #5).
RECOVER: S6 rules with pinned endpoint; re-run negative test.
GUARD: negative test mandatory in FINALIZE.

## F4 WebRTC STUN leak
SIGNAL: browserleaks.com/webrtc shows real public/LAN IP behind VPN.
WHY: vanilla browser with WebRTC on.
DETECT: browserleaks check.
RECOVER: Tor Browser, or disable WebRTC/policy, or test mode.
GUARD: browser checks in verification (browser section).

## F5 Tor app DNS leak (socks5 vs socks5-hostname)
SIGNAL: app works via Tor BUT tcpdump shows port-53 leaving.
WHY: local DNS resolution instead of remote through SOCKS.
DETECT: tcpdump during app use; curl flags.
RECOVER: switch app to socks5-hostname://; or DNSPort.
GUARD: mention socks5-hostname in EVERY Tor proxy instruction.

## F6 MTU blackhole
SIGNAL: handshake OK, big pages stall, ping small passes.
WHY: tunnel overhead vs path MTU.
DETECT: `ping -M do -s 1372`.
RECOVER: lower MTU 1420→1380 bisect; clamp mss.
GUARD: MTU sanity in VPN verify.

## F7 Clock skew breaks Tor
SIGNAL: bootstrap stuck ~45-60%; TLS cert weirdness.
WHY: consensus validity window missed.
DETECT: `timedatectl`.
RECOVER: fix time (via tunnel/manual), restart tor.
GUARD: D0 includes timedatectl.

## F8 Tor blocked/flagged by ISP
SIGNAL: stuck bootstrapping 0-15%; direct relay connections fail.
WHY: OR-port blocking or DPI.
DETECT: bridge swap test; snowflake as control.
RECOVER: bridges (snowflake/obfs4/private); or Tor-over-VPN.
GUARD: circumvention ladder (layered-architectures).

## F9 i2pd no tunnels
SIGNAL: console empty, 0 tunnels, no reseed.
WHY: blocked reseed hosts; clock; NAT.
DETECT: console logs.
RECOVER: reseed via proxy; fix clock; wait (first run is slow).
GUARD: S5 verify includes tunnel state.

## F10 resolv.conf churn
SIGNAL: DNS config reverts after reboot/reconnect.
WHY: dhclient/NetworkManager overwriting.
DETECT: file mtime vs incident; `nmcli` dns state.
RECOVER: resolved as single owner; guard file (chattr) if needed.
GUARD: post-reboot CORE-5 spot check.

## F11 Provider DNS inside tunnel unreachable
SIGNAL: tunnel up, dig times out.
WHY: provider DNS IP not routed/allowed; AllowedIPs narrow.
DETECT: dig @provider-DNS vs ping gateway.
RECOVER: widen AllowedIPs or switch to local resolver over tunnel.
GUARD: dig step in S1 verify.

## F12 Browser DoH bypass of system policy
SIGNAL: system blocked plaintext DNS yet browser resolves; TRR active.
WHY: built-in DoH default in some regions.
DETECT: about:networking#dns; packet capture shows browser 443 DNS-like to unpinned IP.
RECOVER: policy pin or disable (expert-patterns §5).
GUARD: browser section of verification.
