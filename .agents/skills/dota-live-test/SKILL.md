---
name: dota-live-test
description: "Run a real match in Dota 2 Tools and verify changes using persisted console logs. Use for requested live tests or engine-dependent events, modifiers, API flows, and bot behavior that Jest cannot cover."
---

# Dota Live Test

is **logging to disk**: let Dota write the console output into a file and read it with `grep` instead of taking a screenshot to read the VConsole window.

`con_logfile` is not a valid command in Source 2, and the file log cannot be opened during operation. It can only be added in the **startup parameters**.

## Check bot AI behavior: use automatic play

When checking the bot's engagement, defense, advancement, and item casting, do not start the game manually. Use `npm run perf` to run an unattended round (steps 3 to 5 are handled by the script). Steps 1 and 6 are as usual:

```bash
npm run perf -- --server tools --mode soak --soakMinutes 30 --soakTimescale 2 --minGames 1 --maxGames 1
```

Add parameters according to the scene to be tested (see `parseArgs` of `src/scripts/perf.js` for all options):

| Scene                                               | Parameters                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1v10 by difficulty (N5 / N6 / N8)                   | `--boost false --radiantPlayers 2 --radiantMultiplier 15 --direMultiplier 7 --towerPower 300`; N6 changes to `9`, `350`, N8 changes to `14`, `500`. The Radiant bot plays the role of a player, and the multiplier is much higher than the player's actual 1.5, which makes up for the real person's bot's ability to kill and develop; at 5 and 10 times, the Radiant bot is leveled in 18-21 minutes, and no confrontation is detected |
| 1v10 strong players                                 | Any of the above difficulties mention `--radiantMultiplier` to `20`                                                                                                                                                                                                                                                                                                                                                                      |
| 1v10 player crushing                                | Add any of the above difficulties to `--radiantBoost true`: Radiant starts with full level and full money. The Radiant bot can't beat 10 bots no matter how high the magnification is. To test the crushing effect, you can only directly give money and level; it depends on whether the bot is stupid, not on the number of deaths                                                                                                     |
| Tianhui strongly recommends bot highlands and bases | `--boost false --radiantPlayers 5 --radiantMultiplier 10 --direMultiplier 1`                                                                                                                                                                                                                                                                                                                                                             |
| item casting                                        | `--testItems item_a,item_b`: issue items at the beginning and stop buying and selling equipment                                                                                                                                                                                                                                                                                                                                          |
| Designated hero appears                             | `--botHeroes axe,lion`                                                                                                                                                                                                                                                                                                                                                                                                                   |

- The acceleration does not exceed 2 times. Higher speed will bring down the server.
- At the end of each game, write `anomaly-<N>.md` in the running directory (stuck, no teleportation over long distances, crowded together, retreat and cutback, no tasks, no one is present when the building is hit), read it first and then grep the details. Manually use `npm run bot-anomaly [log_path]` to produce the same report
- will delete `console.log` when starting the next round. The logs to be retained should be copied to scratchpad first.
- When the Radiant is full, the player's hero is also handed over to the AI; when the Radiant is young, the player's hero stays in the spring, and the Radiant bot plays the player, and the existing bot logic is followed for buying equipment and laning. The report only counts the side with the larger number of players. The behavior of Radiant’s side does not represent the real players.

## Verify item and ability: send commands remotely

When testing passive attributes, active effects, when status goes up and down, and damage to units and buildings, do not click on the interface: start with a remote console port (step 3), then use `npm run dota:cmd` to send `-give` to send items, `-cast` to code cast, `-watch` to monitor changes, and directly read the log returned by the command. The backup casting (Ctrl) code cannot be triggered, so you need to use computer-use real keys. Command list and standard procedures → `references/remote-commands.md`.

Only use computer-use screenshots if you need to see the picture for description text layout and real keyboard and mouse feel.

## Paizi agent running

The following steps are a fixed process according to the script, and the context needs to be changed to determine whether the log is passed. Division of labor: The sub-agent runs the process and reports observations, and the main session makes judgments.

**Always send sub-agents for real-machine testing**, just check one or two points, and then return to it after making changes: waiting for loading, sending commands, reading logs, taking screenshots and going back and forth in the main session for several rounds, the consumption is much higher than writing a handover. Use the Agent tool to execute the command sequence and report log lines using `model: "haiku"`; use `"sonnet"` to read the logs to determine the phenomenon or use computer-use to operate the screen. \*\*One round of verification will be sent, and it will end when the run is over; if there is another round of verification, another one will be sent. The subagent is a cold start, and everything is written in the handover: what has been changed, whether a local backend is needed, the commands to be sent, which lines of logs to expect and the numbers to be brought back.

- **Only report observations**: which lines appear, what is the timestamp, and at which step it breaks. Diagnostics and code changes are left to the main session
- **Check the port before starting work**, if you haven’t started, you can do it yourself - the background process in the last round may not be still alive.
- **No ending**: Whether to close or not is determined by the main session, see step 6

The sub-agents who have obtained this skill will start from step 1 and will not be sent downwards.

## steps

### 1. Compilation changes

changed `src/vscripts/` and ran `npm run build:vscripts` once. `.js` under `content/panorama/` is automatically compiled and hot-reloaded by tools without manual processing.

Completion criterion: No error is reported during compilation.

### 2. Decide whether to use a local backend

Only check the in-game logic (ability, modifier, AI, UI) and skip to step 3. The API link must be verified before starting the backend.

backend in `C:/Users/windy/Documents/GitHub/firebase` (requires java):

```bash
firebase emulators:start --only firestore,auth --import ./firestore-backup --project windy10v10ai
```

```bash
cd api && npm run start
```

Use Bash's `run_in_background` for both of them. The output is written into the task file and no front-end polling is required. The simulator accounts for 8080 / 9099, and the API accounts for 3001. Wait for 3001 to enter LISTENING before starting the game, otherwise the start request will be empty.

also confirms `GetApiTarget()` of `src/vscripts/api/api-client.local.ts` and returns `'local'`.

Completion criterion: `netstat -ano | grep -E ":(8080|9099|3001)\b.*LISTENING"` All three ports are present.

### 3. Start Dota

Dota is running, directly `Start-Process` will open a second instance, and only one `Source2 - Warning` window will pop up. You need to `Stop-Process -Name dota2 -Force` first.

```powershell
$dota = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\bin\win64"; Start-Process -FilePath "$dota\dota2.exe" -WorkingDirectory $dota -ArgumentList '-novid','-tools','-addon','windy10v10ai','-condebug','-conclearlog','-netconport','29000','+dota_launch_custom_game','windy10v10ai','dota'
```

`-condebug` writes the output to `<dota>/game/dota/console.log` and `-conclearlog`. Clear the file every time it is started to avoid cross-session accumulation. `-netconport` opens the remote console for `npm run dota:cmd` to issue commands (`npm run launch` has been brought along). `+dota_launch_custom_game` allows the map to load automatically without clicking any buttons.

If you want to use `npm run launch -- --hero <hero_name>` (without the `npc_dota_hero_` prefix) when testing with a designated hero, the hero will be directly selected for the player at the start; starting without `--hero` will clear the last designation. There is no command to change heroes midway: replacing a hero does not preload resources, nor does it rebuild the hero status recorded in each module.

completion criterion: `console.log` appears and the volume is increasing.

### 4. Trigger the verification process The

opening process (`/game/start`, team selection, lottery initialization) is automatically completed when the map is loaded, and step 3 has been triggered.

There are two ways to restart when you need to run it again:

- **Restart the process**, the parameters are the same as above. Slow it down for a minute or two and it can be used in any environment.
- **VConsole command box** Enter `dota_launch_custom_game windy10v10ai dota` and reload in a few seconds. Requires a computer-use MCP that can operate windows, i.e. desktop applications; this set of tools is not available in the Claude Code CLI.

Write down the current line number (`wc -l < console.log`) before restarting, and then use `awk 'NR>N'` to only see the new part.

Completion criterion: The first output of the target process appears in the log.

### 5. Read log

```bash
grep -n "ApiHtmlProxy\|GameStartProxy" "C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/console.log"
```

Both outputs are in the same file, distinguished by prefix:

| Prefix             | Source           |
| ------------------ | ---------------- |
| `[VScript]`        | Server `print()` |
| `[PanoramaScript]` | Client `$.Msg()` |

Each line carries the `MM/DD HH:MM:SS` timestamp, and the cross-end timing (who comes first and who comes last, and how long the interval is) can be read directly, which is the main basis for locating handshake and timing issues. When

appears in the log, use Bash's `run_in_background` to run `until grep -q ...; do sleep 5; done`.

Completion criterion: Find the corresponding line in the log for each step of the target process, or clearly indicate at which step it breaks.

### 6. Closing

**Whether it is turned off or not is determined by the main session, and the sub-agent will not be turned off** - it will be turned off in the middle, and it will have to be restarted in the next round. Three situations:

- All verification completed → Close
- needs another round of testing → keep it
- User said it’s fine if it’s on → Keep it

When retaining, you should tell the user which processes have been retained, and do not let them silently occupy the port in the background. When

needs to be shut down, `TaskStop` only kills the outer shell of the background task. The simulator's java and API nodes will survive. You need to kill them by PID, and then confirm that all three ports have been released. Delete `console.log` as needed after exiting Dota. The sub-agent and sub-session sent out by

also need to be terminated: they will be stopped and archived after the report is completed, and the worktree and branches that have not submitted anything will be deleted together. This is the last step of a dispatch. Don’t wait for the user to ask “Why is it closed?”

Completion criteria: When shutting down, all three ports are released; when they are kept, the user has been told what has been left; none of the sessions sent out are still hanging.

## temporary debugging log

and `print` / `$.Msg` are temporarily added to locate the problem. They should be deleted after locating the problem, leaving only the call and result categories. Criterion: The log volume of a request does not increase with the data volume (the entire response body is not printed).
