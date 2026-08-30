# RECOVERY MATRIX — symptom → recovery procedure → regression test

One line per failure. Procedures live in procedures/*.md; this matrix maps them.

| Symptom (observed) | Confirmed cause (after D-loop) | Recovery | Regression test that proves it |
|---|---|---|---|
| Port-53 packets on physical iface | system resolver bypass | recovery-workflow rollback of resolver config → S4 | tcpdump 2 min silent while browsing |
| test-ipv6 shows native v6 under VPN | AllowedIPs no ::/0 | edit wg0.conf (backup first) → wg-quick cycle | `curl -6` = tunnel v6 or clean fail |
| Ping answers with tunnel down | no firewall kill switch | S6 with pinned endpoint | negative test: down → ping 100% loss |
| No WG handshake | endpoint/keys/UDP-blocked | fix per D-table (keys/endpoint/TCP-variant) | `wg show` handshake <30s |
| Handshake + dead browsing | MTU blackhole | MTU bisect 1420→1380 | `ping -M do -s 1372` gateway passes |
| Bootstrap stuck ~50% | clock skew | timedatectl fix; restart tor | Bootstrapped 100% |
| Bootstrap stuck ~0-15% | OR blocking | bridges snowflake→obfs4→private; or Tor-over-VPN | 100% + tcpdump shows no direct relays |
| IsTor:false | socks5 vs hostname / wrong port | reconfig app; DNSPort | api/ip → true |
| i2pd 0 tunnels | reseed blocked | console reseed via proxy | tunnels ESTABLISHED |
| Eepsite not found | addressbook miss | update subscriptions | known-good eepsite loads |
| dig SERVFAIL all | dnscrypt dead / upstream unreachable | restart; check tunnel; upstream | dig NOERROR; dnscrypt -resolve shows encrypted |
| dig ok, browser not | browser DoH elsewhere | policy pin/disable TRR | about:networking matches policy |
| WebRTC shows real IP | vanilla browser STUN | disable WebRTC / Tor Browser | browserleaks clean |
| DNS reverts on reboot | resolv.conf churn | resolved ownership; guard file | reboot → CORE-5 #4 still clean |
| Self-locked out (remote fw change) | hasty nft commit | console access; scheduled-revert preinstalled | future changes via `at` revert test |
| Provider DNS unreachable in tunnel | AllowedIPs narrow / not routed | widen to /0 or local resolver | dig via tunnel resolver |
| Torrent client shows home IP | bind-iface unset | bind to tunnel iface / proxy | ipleak torrent tool shows exit |
| Tor usage visible to ISP | no bridges/VPN | circumvention ladder | tcpdump: no direct OR IPs |

## When cause is NOT yet confirmed

The matrix applies ONLY after the diagnostic-workflow confirms the cause. Jumping symptom→fix
without D2 localization is the banned shotgun pattern (A5). If two causes produce identical
symptoms (e.g., MTU vs dead relay for "slow"), run the discriminating test first.
