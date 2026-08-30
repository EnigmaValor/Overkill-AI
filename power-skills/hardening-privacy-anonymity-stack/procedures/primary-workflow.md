# PRIMARY WORKFLOW — state machine (authoritative)

Load: ALWAYS. This file is the controller. Entry/exit criteria are binding; a transition
without its criteria met is an error, not a style issue.

```
INTAKE → CLASSIFY → CONTEXT_CHECK → THREAT_MODEL_GATE → ROUTE → PLAN → EXECUTE → OBSERVE → VERIFY
                                                                                          │
                                                            FAIL ◄───────────────────────┘
                                                             │
                                                        DIAGNOSE → REPLAN → EXECUTE  (max 3 cycles)
                                                             │ still failing
                                                          ESCALATE
VERIFY pass → QUALITY_GATE → FINALIZE → LEARN
```

## State definitions

| State | Entry | Must do | Exit when | Forbidden |
|---|---|---|---|---|
| INTAKE | any request | restate the actual ask in one line; list unknowns | ask classified | inventing requirements user didn't state |
| CLASSIFY | ask restated | label: SETUP / VERIFY / DIAGNOSE / EDUCATION / TEARDOWN (+ subtool) | label chosen | blending labels silently |
| CONTEXT_CHECK | labeled | OS/distro, existing stack (discover commands OK), authorization confirmed; missing REQUIRED inputs → ask ONCE (batched) or state explicit assumption | context written down | starting EXECUTE with OS unknown; asking serial single questions |
| THREAT_MODEL_GATE | setup/stack-choice tasks | if goal unstated: either (a) ask the 3 questions (fundamentals §1) or (b) apply DEFAULT: "hide traffic+domains from local network and ISP; not anonymity from targeted adversary" AND LABEL IT | model present (given or default-labeled) | silently skipping; assuming "maximum anonymity always" |
| ROUTE | model + context | pick procedure file via decision-trees/routing.md | one procedure chosen | choosing two and merging ad hoc |
| PLAN | procedure chosen | numbered step list; each step names its verification | plan written | unverifiable steps ("make sure it works") |
| EXECUTE | plan ready | follow procedure exactly; exact commands; config changes get backups first | steps done or first failure | improving mid-execution without replan; fabricating outputs |
| OBSERVE | output produced | record ACTUAL outputs verbatim (user-pasted or command) | observations recorded | treating predictions as observations |
| VERIFY | observations in | run matching checks (verification-workflow.md); negative tests for enforcement claims | each claim has evidence | declaring success from confidence |
| FAIL-loop | verification failed OR new symptom | enter diagnostic-workflow.md; one hypothesis at a time; smallest discriminating test | hypothesis confirmed → fix → regression test | shotgun fixes (reinstall/reboot/switch-provider as first move); >3 cycles without ESCALATE |
| QUALITY_GATE | verification passed | run verification/quality-gates.md checklist | all gates green | skipping gates "because it's simple" |
| FINALIZE | gates green | emit 5-part output contract (SKILL.md Outputs) | contract complete | omitting residual-risk section |
| LEARN | finalized | if anything surprised you: one-line lesson candidate with the evidence (feed to maintainer loop) | noted | rewriting skill files unilaterally |

## Binding invariants (violating any = redo the step)

1. No EXECUTE before CONTEXT_CHECK names the OS (or a labeled assumption).
2. No setup answer without a threat-model line (given or default-labeled).
3. No "no leak"/"working"/"fixed" claim without an observation recorded in OBSERVE.
4. No firewall rule that references a hostname.
5. No recommended version numbers from memory — check commands only.
6. Refusal tasks (escalation.md) exit at CONTEXT_CHECK, politely, with the safe alternative.

## Interaction economy

- Batch questions: one message, all unknowns, each with the default you'd assume.
- Prefer discover-by-command over ask-user when the user's box can answer (`ip a`, `resolvectl status`).
- Long setups: emit checkpoints — "after step 3 you should see X; paste output if not".
