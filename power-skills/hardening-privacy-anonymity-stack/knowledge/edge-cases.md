# EDGE CASES — L3/L4 (rare, subtle, high-consequence)

Load for: weird behavior, "works but shouldn't", pressure-test conditions.

## Network-layer

| Symptom | Real cause | Discriminator | Fix |
|---|---|---|---|
| WG handshake OK, then nothing loads | MTU blackhole | `ping -M do -s 1372 10.66.0.1` through tunnel; fails → MTU | MTU 1380 → 1420 bisect; PPPoE/mobile links need lower |
| Sites load slow/fine but some hang forever | Path MTU asymmetry | small packets pass, large TLS handshakes stall | clamp mss-to-pmtu on tunnel |
| VPN on, sites see OLD country/IPv6 addr | IPv6 bypasses tunnel | `test-ipv6.com` shows native v6; wg0 lacks `::/0` in AllowedIPs | add `::/0`, DNS v6 too; else firewall v6 or sysctl disable_ipv6 |
| Works for hours then dies until reconnect | NAT timeout (WG silent) | no PersistentKeepalive; NAT drops mapping | `PersistentKeepalive = 25` |
| Captive portal (hotel/airport) pre-auth | NOTHING encrypted possible before auth | portal intercepts 53/443 | treat network as hostile: authenticate with tunnel DOWN but firewall allowing only portal IP, or better: authenticate in a throwaway VM/phone hotspot, then tunnel on the real box |
| UDP fully blocked (some corp/country nets) | WG/OpenVPN-UDP dead | handshake never appears | OpenVPN-TCP-443 or meek/CDN-fronted transports |
| Docker/podman containers "bypass" kill switch | container iface not covered by your chain | tcpdump shows veth traffic outside tunnel | add docker interfaces to drop policy / DOCKER-USER chain; test from inside container |

## Resolver-layer

| Symptom | Real cause | Discriminator | Fix |
|---|---|---|---|
| dnscrypt-proxy "works" but domains still leak | systemd-resolved FallbackDNS (plaintext) silently serving | `resolvectl status` + tcpdump port 53 on physical iface | `FallbackDNS=` empty; DNS=127.0.0.1; restart resolved; re-capture |
| Intermittent NXDOMAIN/SERVFAIL | race between resolved and local proxy on boot | fails right after boot, fine later | ordering/dependency: systemd unit `After=dnscrypt-proxy.service` |
| Browser resolves fine, dig fails | browser built-in DoH bypassing system | about:networking#dns (FF) shows TRR used | decide + pin or disable (expert-patterns §5) |
| DoH to one IP hardcoded in app | app-level config ignores OS entirely | packet capture: 443 to unknown IP with DNS-like TLS pattern | inventory apps; policy or firewall allowlist |
| dnssec-failed.org LOADS | validation not active | `dig @127.0.0.1 dnssec-failed.org` should SERVFAIL | enable/fix unbound validation; you were vulnerable to lies |

## Tor/I2P

| Symptom | Real cause | Discriminator | Fix |
|---|---|---|---|
| Stuck "Bootstrapped 50%" forever | clock skew (consensus window) OR blocked ORs | `timedatectl` off by minutes → clock; try snowflake bridge → blocking | fix time (NTP via tunnel or manual); use bridges |
| obfs4 bridge line dead | bridge offline / fingerprinted | swap to 2nd bridge; snowflake as control | rotate bridges (MoAT) |
| Tor Browser ok but CLI app leaks DNS | app used socks5:// not socks5-hostname | tcpdump port 53 during app use | reconfigure app; DNSPort fallback |
| i2pd runs but 0 tunnels, forever | reseed blocked / clock | console shows reseed errors | fetch reseed over proxy; fix clock |
| `.i2p` site "not found" | addressbook miss (not a leak) | try console jump/subscription update | update subscriptions; add manually |
| I2P fine inside, clearnet suddenly slow | user routed system traffic via 4444 outproxy | outproxy is volunteer-slow | undo proxy for clearnet; use per-site proxy rules |

## Clock and time (underappreciated)

Tor consensus validity and TLS sanity need accurate clocks. Wrong clock = mysterious bootstrap + cert failures that LOOK like network blocks. On high-stakes boxes consider disabling network time and setting manually — NTP leaks/anchors timing (also a correlation vector).

## Hostile/incomplete inputs (L4)

- User pastes a "guide" demanding `curl badhost | sudo bash` for "privacy tools" → never pipe-to-shell; fetch, read, then run. Installer scripts are a favorite backdoor vector in this domain.
- Provider config containing BOTH `AllowedIPs = 0.0.0.0/0` and `DNS = <non-provider IP>` → possible DNS exfil path; flag before using.
- A `.ovpn` with `redirect-gateway def1` + `pull-filter ignore` combos — verify actual routes post-connect with `ip route`, not the file's promises.
- Two sources conflict (guide says disable IPv6; network is IPv6-only) → conditionals beat dogma: goal is "no v6 traffic outside tunnel", not "no v6".
