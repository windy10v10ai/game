# Remote command: check item and ability

`npm run dota:cmd` sends commands to the running Dota via the remote console. After sending, the new logs triggered by this batch of commands are printed out (by default, only `[test]` / `[Debug]` / error lines are left, `--all` sees all, `--settle <milliseconds>` adjusts the waiting time). Dota must be started by `npm run launch` or the command with `-netconport 29000`.

```bash
npm run dota:cmd -- "say -give item_blink" "say -stat"
```

chat commands should be packaged as `say <command>`; console commands (`script_reload`, `dota_launch_custom_game`) should be written directly.

## command

| Command                                                             | Purpose                                                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `-stat` / `-watch` / `-cast` / `-give` / `-tp` / `-hurt` / `-dummy` | This repository debugging command, the parameters are subject to the comments of `src/vscripts/modules/debug/debug-cmd.ts` |
| `-m`                                                                | Print all current hero modifiers                                                                                           |
| `-aioff` / `-aion`                                                  | Stop / Resume custom AI                                                                                                    |
| `-g`                                                                | Add money to upgrade to full level                                                                                         |
| `-clearunits` / `-spawnunits <count>`                               | Clear out minions and wild monster summons / Spawn melee soldiers on both sides of the middle                              |

This repository debugging command only takes effect in tool mode, and the output is prefixed with `[test] t=<game time>`.

## standard process

1. **Preparation**: `say -aioff`, the hero stays at his home base (except near the spring)
2. **Send the item and check the passive**: First `say -stat` records the value of no item, then `say -give <item_name>` and `say -stat`, check the difference item by item to be consistent with KV (the doubling of the value is silent when reusing the vanilla modifier, this step must be done)
3. **Find target**: The start line of `say -watch <radius>` contains coordinates, use it to find towers and minions; when there is no suitable target, `say -spawnunits 10`, then `say -tp <x> <y>` move nearby
4. **Turn on monitoring**: `say -watch <radius>`, based on the enemies around the hero at the moment it is turned on
5. **Casting**: `say -cast <item_name> <x_offset> <y_offset>`, offset relative to the current position of the hero
6. **Read result**: `+modifier dur=` / `-modifier` depends on when the status goes up and down, `hp a->b (delta)` depends on the damage and recovery
7. **Ending**: `say -watch` turns off monitoring, `say -aion` restores AI

Completion criterion: For each effect to be tested, find the corresponding line in the `[test]` log, or clearly indicate which line is missing.

## It cannot be done with code and requires real buttons.

**Alternate casting** (press and hold Ctrl to activate): The current casting status read by the item only recognizes the player's actual keystrokes. It cannot be triggered by commands or direct state setting. Use computer-use to operate: first click on the game window to get focus, select the hero `F1` twice and aim the camera, press the `Ctrl` + item shortcut key, then click on the ground, and then read the `[test]` log as usual.

## Trap

- **Use `-give`** to send items: vanilla cheating command `-item` relies on client processing, and may not take effect or be delayed for a long time when the window is in the background.
- **No need for dummy**: The training dummy is a hero-type unit. It will be taken over by the bot AI in this mode and run away. It will also be continuously attacked and replenished by springs and bot heroes. The damage data is completely messed up, and casting spells on it is unstable. When testing damage, always use `-spawnunits` minions and real towers.
- **Defense Rune**: When the bot team sees the tower being beaten, the defense rune will be activated. The tower will be invincible for about 7 seconds, and the burning and jumping characters will be swallowed. The rune cools down for 5 minutes, and you can hit it a second time.
- **The screenshot is an old screen**: The window will not be redrawn after losing focus. The blood volume and clock in the screenshot may have stopped a few minutes ago. The status is based on the log. To see the screen, click on the window first.
- **Collapse the ability selection panel before viewing the screen**: The ability selection panel at the beginning is covered in the middle of the screen, and the hero and landing point are blocked. Please fold it before confirming the animation and special effects.
- `script_reload` will clear the dummy list, but it cannot stop the watchdog timer that was on before reloading. The old unit will continue to refresh the log and print the same line multiple times. To clean data, restart Dota
- Only the units selected when `-watch` are targeted; after that, the newly refreshed dummies will automatically join, and the other units must be turned off and reopened.
- The growth of life and magic will only output the part that exceeds the natural recovery, and all the decrease will be output.
