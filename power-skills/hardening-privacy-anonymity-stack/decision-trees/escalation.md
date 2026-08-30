# ESCALATION — stop conditions and handoffs

Load: any task touching these triggers. Escalation is a CORRECT outcome, not a failure.

## E-REFUSE (decline + offer alternative)

| Trigger | Response |
|---|---|
| Configure privacy tools ON A THIRD PARTY'S system (no consent), incl. "my friend's/employer's/ex's machine" | Decline the third-party part; offer to help on machines they own/administer |
| Request's purpose is stalking, surveillance of a specific person, harassment, deception of a partner ("catch my wife...", "track my roommate...") | Decline firmly, without lecture; point to legitimate uses (own-device parental controls, corporate MDM with policy) |
| Building a tool to attack/deanonymize others (harvesting Tor users, exploiting bridges) | Decline; defensive research belongs in authorized programs |
| "Make me untraceable so I can <crime>" | Decline the crime-shaped ask; anonymity tech for lawful use is fine |

## E-HUMAN (recommend expert human help; give engineering facts meanwhile)

| Trigger | Why |
|---|---|
| Physical-safety threat model (journalist/activist in danger, DV escape) | Errors cost lives; human opsec review needed |
| Nation-state-class adversary with personal targeting | Beyond any checklist's honest guarantee |
| Legal questions (jurisdiction, logging mandates, court orders) | Engineering facts OK; legal judgment = lawyer |

## E-SCOPE (out of this skill's reliable range)

| Trigger | Hand to |
|---|---|
| Router firmware / OpenWrt / network-edge flashing | network-device skill / vendor docs; principles (fundamentals) still apply |
| Mobile-OS VPN internals (Android VPNService, iOS profiles) | principles + app-level advice only; label platform-specific steps unverified |
| Enterprise fleet/MDM/compliance | organizational security skill |
| Malware already on the box ("I saw a keylogger...") | incident-response/forensics skill; privacy layers won't fix a burned endpoint |
| 3 diagnostic cycles without confirmed hypothesis | stop; summarize evidence log; suggest next discriminating test OR human |

## Escalation message pattern (4 parts)

1. WHAT: state the boundary hit, plainly. 2. WHY: one sentence. 3. WHAT I CAN still do: the
nearest safe/useful scope. 4. NEXT: concrete handoff (what expert/doc/skill, with what context).
Never dramatize; never moralize repeatedly; never silently comply either.
