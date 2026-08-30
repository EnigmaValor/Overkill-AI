# RECOVERY WORKFLOW — rollbacks and emergencies

Load: any teardown/rollback request; any "I think I'm leaking RIGHT NOW" event.

## E0 — ACTIVE LEAK EMERGENCY (user says "it's exposed now")

Order is binding. Speed beats completeness.

1. STOP GENERATING TRAFFIC: kill the sensitive applications first (they keep re-leaking while you read).
2. Pull the network: `nmcli networking off` (or unplug/disable Wi-Fi). Physical layer never lies.
3. THEN diagnose at leisure: which path leaked (verification-workflow CORE-5) — with interface down, tcpdump history/logs.
4. Fix root cause (diagnostic-workflow) BEFORE re-enabling network.
5. Re-enable → immediately re-run CORE-5.
NEVER: "try another server" while leaking. NEVER: reboot first (destroys evidence in conntrack/logs).

## Rollback matrix

| Change | Rollback |
|---|---|
| wg0.conf edited | `cp wg0.conf.bak.<ts> wg0.conf && wg-quick down wg0 && wg-quick up wg0` |
| WG installed+enabled | `systemctl disable --now wg-quick@wg0; apt remove wireguard-tools` (configs stay in /etc/wireguard) |
| OpenVPN session | `sudo killall -SIGTERM openvpn` (or systemctl stop openvpn-client@<name>) |
| torrc edited | restore .bak; `systemctl restart tor` |
| Tor fully removed | `systemctl disable --now tor; apt remove tor torbrowser-launcher`; Tor Browser dir deleted manually |
| dnscrypt-proxy.toml edited | restore .bak; restart dnscrypt-proxy; dig test |
| resolved.conf edited | restore; `systemctl restart systemd-resolved` |
| resolv.conf replaced by installer | restore backup; `chattr +i /etc/resolv.conf` guard (remember to -i before future edits) |
| unbound added | stop/disable unbound; repoint resolved DNS=127.0.0.1 → original; restart |
| nft ruleset changed | `nft -f nft.pre-change` (file made before change; if lost: `nft flush ruleset` then restore distro default/service restart) |
| ufw policies changed | `ufw reset` (returns to distro defaults — re-check SSH allow if remote!) |
| i2pd added | `systemctl disable --now i2pd; apt remove i2pd`; remove /etc/i2pd and data dirs |
| Browser DoH/WebRTC changed | flip policy pref back; verify via about:networking#dns / browserleaks |

## Post-rollback verification (always)

CORE-5 subset: exit identity (`curl ifconfig.me` = expected post-rollback state), resolver truth, port-53 capture.
Rollback that leaves DNS pointing at a dead local resolver = self-DoS. Check `dig example.com` before closing.

## Teardown vs. pause

- PAUSE (temporary): stop tunnel services, leave configs/firewall. Fastest safe state.
- TEARDOWN (remove): rollback matrix + verify no leftover: `ss -tunlp` (no 9050/4444/53 listeners unexpected), `nft list ruleset` clean, resolv.conf sane.
- Witness check (high stakes): after teardown, tcpdump 5 min — box should show only EXPECTED plaintext flows for its now-normal state; surprising flows = leftover config (split tunnel, cron, app proxy).

## Change-window discipline (recovery is also prevention)

Before ANY risky change: `nft list ruleset > nft.pre-change`; `cp -a /etc/{wireguard,tor,dnscrypt-proxy,unbound} /root/backup-$(date +%s)`; know the one command that pulls network offline. Verify you can still get a shell (remote boxes: test firewall change with `at`-scheduled revert BEFORE committing — classic self-lockout).
