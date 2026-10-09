---
name: dota-bot-ai-tuning
description: "Improve bot decisions and movement after takeover: combat, defense, pushing, positioning, teleporting, tower avoidance, and glyph use. Use for abnormal bot behavior or proactive AI investigation; ability casting, item use, and item builds belong to their dedicated skills."
---

# Bot decisions and movement

Use logs to establish the decision that produced the reported behavior.
Lasting design decisions belong to `src/vscripts/ai/team/README.md`;
changes to those decisions require user confirmation, while fixes within them
can proceed.

Run `npm run bot-anomaly` before inspecting the relevant console interval.
`[bot-ai]` records team/hero decisions and combat strength,
`[bot-pos]` records movement/positioning, `[bot-cast]` records casts, and
`thinking for N ms` identifies engine think timeouts.

| Concern                                       | Owner under `src/vscripts/`                                            |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Assignment and urgency                        | `ai/team/team-plan.ts`                                                 |
| Threats and engagement points                 | `ai/team/team-brain.ts`                                                |
| Movement, teleport, yielding, tower avoidance | `ai/hero/bot-base.ts`                                                  |
| Fight/wait/retreat thresholds                 | `ai/hero/engagement.ts`                                                |
| Formation, tower retreat, glyph               | `ai/team/formation.ts`, `ai/hero/tower-retreat.ts`, `ai/team/glyph.ts` |

Check hysteresis at decision thresholds, urgent tasks losing assigned heroes,
attack-move travel intercepted by nearby units, and multiple heroes sharing
one unreachable/crowded destination.
Explain the responsible decision and intended change before modifying lasting policy.

Keep pure calculations in engine-independent modules with meaningful regression
tests. Engine API glue follows the scoped testing rules in `src/vscripts/CLAUDE.md`.
New logs use `IS_DEBUG_RUN`; respect the scoped pathfinding performance rules.
Run `npx jest src/vscripts/ai` and build vscripts.

For team-AI changes, use $dota-live-test for both the difficulty-based 1v10
and strong-player 1v10 scenarios. Compare anomaly reports and think timeouts.
Judge decisions and opposition quality, not win rate or death count.
Update approved lasting decisions and the PR's in-game verification checklist.
