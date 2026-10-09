---
name: dota-update-offline-snapshot
description: "Export Firestore membership, points, awakening, and player-setting snapshots into game/scripts/kv before Workshop publishing. Use only on explicit user request."
disable-model-invocation: true
---

# Offline player snapshots

The exporter belongs to the separate firebase repository:
`api/scripts/offline-snapshot/export-player-snapshot.ts`.
Do not create a competing exporter here.
Look for sibling `firebase/`; if absent, ask for its path rather than guessing
or cloning another checkout. The fork needs its own authorized backend access.

From its `api/` directory, run:

```text
npm run export:snapshot -- <absolute-game-repository>/game/scripts/kv
```

Keep the npm `--` separator; without it the exporter may use its own output
directory. Avoid repeat exports just to test connectivity: they read production data.

Expected files are `player_snapshot_member.kv`, `player_snapshot_player.kv`,
`player_snapshot_awaken.kv`, `player_snapshot_setting.kv`, and
`player_snapshot_meta.kv`.
Verify all are nonempty, report exporter row/byte counts, and investigate
sharp drops before packaging: missing rows can remove player entitlements.

`game/scripts/kv/` is ignored because snapshots contain Steam IDs and player
data. A fresh publishing machine needs a fresh export.
`src/vscripts/api/player-snapshot.ts` reads snapshots only when
`/game/start` fails; a reachable local backend will bypass this path.
Missing ADC credentials are configured through
`gcloud auth application-default login` in the backend environment.

Query windows, schemas, and collection limits remain owned by the exporter,
not copied into this skill.
