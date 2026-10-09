---
name: bot-ai-tuning
description: "Improve bot decisions and movement after takeover: combat, defense, pushing, positioning, teleporting, tower avoidance, and glyph use. Use for abnormal bot behavior or proactive AI investigation; ability casting, item use, and item builds belong to their dedicated skills."
---

# Bot AI Tuning

In each round, logs are reviewed first and then modified: the conclusion must be reproducible using log lines, and the reasons must not be guessed based on descriptions. Long-term decisions and their rationale are at [src/vscripts/ai/team/README.md](../../../src/vscripts/ai/team/README.md), the single source of truth for this process.

## 1. Locate the log phenomenon

log is in `C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/console.log`, only output in development mode or automated test matches:

| Prefix                                | Content                                                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[bot-ai] t=M:SS <hero>`              | One line when judging changes: position, task, target, distance from target and assembly point; `our=` / `enemy=` combat power and participants included in the battle |
| `[bot-ai] team=N t=<seconds> defend=` | Building threats seen by the team: `Building id:stage:combat power`, stage engaged / warning / creeps                                                                  |
| `[bot-pos] t=<seconds>`               | One line every 5 seconds: location, task, distance from task point, position, teleportation scroll, whether channeling or attacking                                    |
| `[bot-cast]`                          | Each spell cast and item used                                                                                                                                          |
| `thinking for N ms`                   | The unit think timeout reported by the engine is used to detect performance degradation                                                                                |

First run `npm run bot-anomaly` to see the exception summary, and then grep dozens of lines of related heroes at that time according to the game time mentioned by the user.

Completion conditions: Be able to use log lines to explain clearly the tasks, positions and judgment basis of each bot that had the accident at the time, and match them one by one with the phenomena described by the user.

## 2. Identify the responsible layer

| Layer                   | File                                                                   | What to do                                                                                       |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Team assignment         | `ai/team/team-plan.ts`                                                 | Who will defend, fight, push, farm, and the order                                                |
| Situation awareness     | `ai/team/team-brain.ts`                                                | Threats, engagement points, combat power, position allocation, tower defense, buying and selling |
| Hero execution          | `ai/hero/bot-base.ts`                                                  | Position, movement command, tower avoidance, teleportation, giving way                           |
| Position judgment       | `ai/hero/engagement.ts`                                                | The threshold of fighting, waiting and withdrawing                                               |
| Geometry and estimation | `ai/team/formation.ts`, `ai/hero/tower-retreat.ts`, `ai/team/glyph.ts` | Formation, withdrawal from tower area, tanking tower attacks, tower defense timing               |

Common root causes are compared with these categories:

- **Switch back and forth near the threshold**: Use the same threshold to start and continue, or only look at the person at this moment. Use hysteresis: start strict, continue to relax, and continue to count what you were doing in the previous round.
- **Task snatched**: Non-urgent tasks are assigned in front of urgent ones, and people are taken away.
- **Attack move was blocked**: I used an attack move to travel a long distance, but was intercepted by towers, minions, and wild monsters around me.
- **Single Point Destination**: Multiple people go to the same point and form a group, or the points fall on terrain that is inaccessible.

Completion conditions: Point out which judgment of which file the cause falls on, and explain why it produces this phenomenon.

## 3. Explain clearly before taking action

Explain the current behavior, the proposed behavior, and the reason for the change. When making changes to overturn or add long-term decisions in the README, wait for user confirmation; correct bugs directly.

Completion conditions: The user has confirmed, or the change does not involve long-term decisions.

## 4. Implement the change

- Place decision and calculation logic in modules such as `team-plan.ts`, `engagement.ts`, `tower-retreat.ts`, `formation.ts`, and `glyph.ts` that do not touch the engine. First write the failed tests and then modify them; it is just the glue to adjust the engine API without writing the tests (see `src/vscripts/CLAUDE.md` "Test")
- Maintain performance by running code every time it thinks, see `src/vscripts/CLAUDE.md` "Bot does not adjust pathfinding every time it thinks"
- The new log is only output in development mode, wrap it with `IS_DEBUG_RUN`

Completion conditions: `npx jest src/vscripts/ai` all passed, `npm run build:vscripts` without errors and warnings.

## 5. Synchronize documents and PR

The long-term decision has changed, and the corresponding entries in the README will be updated in the same change; an additional item will be added to the "change" described in the PR, and an item will be added to the "Checklist" to be confirmed by the actual machine.

Completion conditions: README and PR descriptions are consistent with the code criteria.

## 6. Verification

tells the user what to see after restarting a game or reloading the script. When you need to verify it yourself, press [dota-live-test](../dota-live-test/SKILL.md)'s "Verify bot AI behavior" to run an automatic game and compare the number of exception reports and thinking timeouts before and after the change.

team AI changes are at least based on the dota-live-test scenario table running "1v10 according to difficulty" and "1v10 player strength": online is mainly one player against 10 bots of N5-N8 difficulty. The behavior of the two sides of the player is the most different, and it cannot be measured in a full game. What matters is whether bots make poor decisions and provide sufficient opposition (see `ai/team/README.md` "Games Expected by Players" for the goal), not the winning rate and the number of deaths.

Completion conditions: There are no script errors in both games, and the behavior targeted by the changes can be matched in the logs of both games.
