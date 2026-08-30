# VERIFICATION COMMANDS — packet-level cookbook (the layer that cannot lie)

Load: any VERIFY phase; any dispute about what is really happening.
All Linux. macOS: substitute `pfctl`/`tcpdump -i en0`; Windows: Wireshark/Get-NetRoute.

## State sweep (D0 — run before forming hypotheses)
```bash
ip a
ip route
ip -6 route
resolvectl status
wg show 2>/dev/null || echo "no wg"
ss -tunlp | grep -E ':(53|5353|853|9050|9051|4444|4445|7070)\s'
systemctl --failed --no-pager
timedatectl
sudo nft list ruleset | head -60
```

## Identity checks
```bash
curl -4 -s ifconfig.me        # expected exit (v4)
curl -6 -s ifconfig.me        # expected exit (v6) or CLEAN failure — native v6 = leak
curl --socks5-hostname 127.0.0.1:9050 -s https://check.torproject.org/api/ip
# Tor PASS: {"IsTor":true, ...}
```

## DNS truth
```bash
dig example.com +short                 # default path
dig @127.0.0.1 example.com +short      # explicit local resolver
dig @127.0.0.1 dnssec-failed.org       # PASS = SERVFAIL (validation working)
dnscrypt-proxy -resolve cloudflare.com # shows which encrypted resolver answered
resolvectl query example.com          # which link/resolver actually used
```

## Packet capture (the honest witness)
```bash
PHYS=$(ip route show default | awk '{print $5; exit}')
sudo tcpdump -ni $PHYS port 53 or port 853          # MUST stay empty on hardened box
sudo tcpdump -ni $PHYS 'not host <vpn-endpoint-ip>' # full-tunnel: MUST stay empty
sudo timeout 60 tcpdump -ni $PHYS -c 200            # idle-box inventory (DF8)
```
Read as: any packet matching a "must stay empty" filter IS the finding. Note the 5-tuple,
owning process (`ss -tunp | grep <ip>`), and direction.

## Enforcement (negative tests)
```bash
sudo wg-quick down wg0 && ping -c3 1.1.1.1   # PASS: 100% loss — any reply = broken switch
sudo systemctl stop dnscrypt-proxy && dig example.com   # PASS: failure — success = fallback exists
```
(Restore services after.)

## Firewall evidence
```bash
sudo nft list ruleset                          # rule-by-rule semantics
sudo nft list chain inet filter output         # counter deltas = live policy behavior
sudo iptables -L -v -n 2>/dev/null             # legacy stacks
```

## Path/MTU
```bash
ping -c3 -M do -s 1372 <tunnel-gateway>   # pass=1380+ MTU ok; stall=blackhole
tracepath <tunnel-gateway>                # shows PMTU discovery point
```

## Tor internals
```bash
journalctl -u tor -f                        # bootstrap progress live
curl --socks5-hostname 127.0.0.1:9050 https://check.torproject.org/api/ip
sudo ss -tunp | grep tor                    # who is tor actually talking to
# ISP-invisibility test: tcpdump must show NO direct connections to known relay IPs
```

## I2P internals
```bash
curl -s http://127.0.0.1:7070/?page=i2p_tunnel   # tunnel states (i2pd console)
curl -x http://127.0.0.1:4444 -s http://<known-eepsite>/ -m 30   # proxy path test
systemctl status i2pd
```

## Web-exposed confirmation sites (CONFIRM only — never the primary evidence)
ipleak.net (full tool suite) · dnsleaktest.com (extended) · test-ipv6.com ·
browserleaks.com/webrtc · check.torproject.org. Their result explains packet captures in
human terms; it does not replace them.
