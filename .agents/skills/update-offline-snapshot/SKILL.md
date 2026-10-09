---
name: update-offline-snapshot
description: "Export Firestore membership, points, awakening, and player-setting snapshots into game/scripts/kv before Workshop publishing. Use only on explicit user request."
disable-model-invocation: true
---

# Update Offline Snapshot

Export the KV snapshot from Firestore and drop it directly into this repository `game/scripts/kv/`. It will be released with the map by
`src/vscripts/api/player-snapshot.ts` Read when `/game/start` fails.

export script lives in **firebase repository** (`api/scripts/offline-snapshot/export-player-snapshot.ts`),
is not in this repository. It imports the ready-made `PlayerLevelHelper` in the backend to calculate the level, and the criteria is the same as the website——
**Do not write another export logic in this repository**.

## output

| File                         | Content                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `player_snapshot_member.kv`  | Membership level and expiration timestamp                                          |
| `player_snapshot_player.kv`  | Points, levels, attribute points (maximum volume)                                  |
| `player_snapshot_awaken.kv`  | Unlocked awakening hero                                                            |
| `player_snapshot_setting.kv` | Shortcut keys, quick spell casting, map game presets                               |
| `player_snapshot_meta.kv`    | Export time, the offline prompt in the game is displayed as "as of a certain date" |

## steps

### 1. Locate the firebase repository

defaults to the same level directory of this repository, that is, `<repository_parent>/firebase`. Used when the directory does not exist
`AskUserQuestion` Ask the user for the path, **Do not guess other locations, and do not clone**.

### 2. Execute export

is run under `api/` in the firebase repository, and the output directory is passed to the **absolute path** of this repository `game/scripts/kv/`:

```bash
cd <firebase>/api && npm run export:snapshot -- <absolute_repository_path>/game/scripts/kv
```

`--` cannot be omitted, otherwise the parameters will be eaten by npm and the file will fall into the default output directory of the firebase repository.
If the output directory does not exist, the script will create it by itself without mkdir first.

can read about 20,000 Firestore documents at a time, within the 50,000 free quota per day, but do not run it repeatedly just to try.

### 3. Verification output The

script prints `<file_name>: <number of lines> lines, <number of bytes> bytes` for each file. Check item by item:

- All five files exist and are not empty.
- The number of rows has not dropped sharply compared to the last time. **If there is a sudden drop, first check the cause and then decide whether to send or not** - usually there is a problem with the query window or field criteria. Sending out
  will cause the membership or attributes of a group of players to disappear out of thin air.

reports the four-line statistics to the user as they are. This is the only feedback to judge whether the window is opened appropriately.

## Release Notes

- `game/scripts/kv/` **The entire directory has been gitignore** (the snapshot contains clear text steamId production data). Change machine After
  clone, you must rerun this skill before it can be released, otherwise there will be no player data in the map.
- The five files total about 13MB and are directly included in the map package. Players have to re-download every time it is released, and the size changes are worth paying attention to.

## Common errors

| Phenomenon                                              | Cause and treatment                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Could not load the default credentials`                | This machine is not equipped with ADC, run `gcloud auth application-default login`                                                                            |
| The file fell into the firebase repository `output/`    | `npm run` and then `--` was missing, and the parameters were not passed to the script                                                                         |
| The data cannot be read in the game but the file exists | The snapshot is only read when `/game/start` **failed**. In Dota Tools, if the backend is open, it will not trigger. You need to stop the local backend first |

## Things not to be included in this skill

The number of days in the window, the field diameter, and the number of items in each collection—all are in the scripts and design documents of the firebase repository. Just copy it here
An expired copy that will not be updated, so the reader cannot tell which one is authentic.
