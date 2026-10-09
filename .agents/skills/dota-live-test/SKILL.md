---
name: dota-live-test
description: "Run a real match in Dota 2 Tools and verify changes using persisted console logs. Use for requested live tests or engine-dependent events, modifiers, API flows, and bot behavior that Jest cannot cover."
---

# Dota Tools verification

Use persisted console logs for engine events, modifiers, API flows, and bot
decisions. Screenshots are for layout/visual effects; real input is required
for keyboard-dependent alternate casting.

Build changed vscripts before launching.
Use `npm run launch`; its logging and remote-console options are owned by
`src/scripts/launch.js`.
Logging requires startup `-condebug`; `con_logfile` is not a Source 2 command.
Do not start a second instance or terminate an existing user session without
resolving which process owns the test.

Choose a hero at startup with `npm run launch -- --hero <short-name>`.
Changing heroes mid-match does not preload resources or rebuild module state.
Restart for KV changes; script reload alone does not reload KV.

## Bot matches

Use unattended matches for decision/movement/item-use checks:

```text
npm run perf -- --server tools --mode soak --soakMinutes 30 --soakTimescale 2 --minGames 1 --maxGames 1
```

| Scenario                   | Additional parameters                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| N5 1v10                    | `--boost false --radiantPlayers 2 --radiantMultiplier 15 --direMultiplier 7 --towerPower 300` |
| N6 / N8 1v10               | Same baseline; Dire multiplier/tower power 9/350 or 14/500                                    |
| Strong player              | Same difficulty scenario, Radiant multiplier 20                                               |
| Dominant player            | Same baseline plus `--radiantBoost true`                                                      |
| Radiant push/base pressure | `--boost false --radiantPlayers 5 --radiantMultiplier 10 --direMultiplier 1`                  |
| Fixed items / heroes       | `--testItems item_a,item_b` / `--botHeroes axe,lion`                                          |

Do not exceed timescale 2. Read `anomaly-<N>.md` before detailed logs.
Preserve required logs before another round clears them.
The Radiant proxy bot is not a real player's behavior; assess the opposing bots'
decisions, including tower defense, not merely score/deaths.

## Item and ability effects

Use [remote commands](references/remote-commands.md) for item grants, stat deltas,
casts, damage, and modifier changes.
Console port is 29000; use `npm run dota:cmd -- "<command>"`.
Record the starting log position and inspect only new output.
Correlate server `[VScript]` and client `[PanoramaScript]` timestamps.

## Backend-dependent tests

Only start the separate firebase backend for API tests.
Locate the user's checkout, not a hard-coded developer home directory.
Its Firestore/auth emulators use 8080/9099 and its API uses 3001.
Run the backend's configured emulator/API commands and wait for readiness
before the match. Verify `GetApiTarget()` in
`src/vscripts/api/api-client.local.ts` points to local.
Do not overwrite another process using those ports.

Remove temporary response-body logs after diagnosis.
Stop only processes created for the test and confirm their ports are released,
or tell the user which processes remain for another requested round.
