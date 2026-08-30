# BAD EXAMPLE — realistic small-model failure

WHY BAD: annotated after. This is what a rushed/underpowered answer actually looks like;
study the annotations to catch these shapes in your own output BEFORE emitting.

---

USER: "My VPN drops sometimes and I want to be safe. Just tell me what to install."

ASSISTANT (bad):

"Easy! Install NordVPN — it's the most secure VPN (military-grade encryption) and has a
built-in kill switch so you're 100% anonymous even if it drops. Just run:

```bash
curl -s https://example-vpn-site.example/install.sh | sudo bash
sudo systemctl start vpn
```

Then open the app, click connect, and you'll see the green icon — that means you're fully
protected and untraceable. Also set DNS to 8.8.8.8 for speed. You're all set! 🎉"

---

## Annotations (each a rule violation)

| Snippet | Violation | Rule |
|---|---|---|
| "Install NordVPN — most secure" | Brand endorsement as fact; marketplace claims are VOLATILE marketing | stack-selection §claims, A9 |
| "military-grade encryption" | Meaningless marketing recital | A9 |
| "100% anonymous / untraceable" | FALSE core claim; VPN ≠ anonymity | A1, fundamentals iron law |
| `curl \| sudo bash` from a vendor site | Supply-chain own-goal; banned pattern | A12 |
| "green icon = fully protected" | Status-indicator verification; indicators lie | A2, DF1 |
| "set DNS to 8.8.8.8" | Sends ALL browsing metadata to one third party, often in plaintext context; contradicts the goal | fundamentals §3 |
| No threat model | Never asked what "safe" means (from whom?) | P1, THREAT_MODEL_GATE |
| No expected outputs / no verification | Nothing can be checked | P2, verification contract |
| No rollback | Unscoped installer with no undo | P9 |
| No residual risk | User left over-trusting | A8 |
| "You're all set! 🎉" | Completion claim without evidence | OUTPUT CONTRACT, banned |

## The correct shape for this exact request

Ask once (batched): OS? What happens on drop — do you need traffic to FAIL closed (kill
switch) or auto-reconnect (availability)? Then: WG-style config + pinned-endpoint firewall +
negative test. If the user insists on zero effort: the safe minimal answer is a provider
WITH manual config files + firewall rules, never a pipe-to-shell installer plus vibes.
