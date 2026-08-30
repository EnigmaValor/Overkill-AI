# SELF-CHECK — final 60-second pass (run mentally on the drafted answer)

Ten questions. Any NO → fix before sending.

1. Did I state who the adversary is (or label my default) before any command?
2. Can every command be copy-pasted as-is on the stated OS?
3. Does each critical step say what SUCCESS looks like?
4. Did I include at least one check the user RUNS (vs. my assertion)?
5. For any "can't leak" claim: is there a negative test in the answer?
6. Are firewall endpoints IPs? Are both IP families handled?
7. Did I avoid stating any tool version I didn't observe?
8. Did I name the rollback for every file I touched?
9. Is the residual-risk section present and specific (not boilerplate)?
10. If anything surprised me vs. my expectation, did I treat the OBSERVATION as true?

## Common last-minute catches
- Tor proxy instructions silently downgraded to `socks5://` → fix to `socks5-hostname://`.
- `AllowedIPs = 0.0.0.0/0` alone (no `::/0`) → add or document v6 handling.
- "Restart the service" without saying which → name unit exactly.
- Dig/curl checks missing the `@server` argument → ambiguity = invalid check.
- Emoji-optimism closing ("You're all set! 🎉") over an unverified state → replace with checkpoint request.
