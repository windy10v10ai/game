# Remote effect checks

Start through `npm run launch` or equivalent with `-netconport 29000`.
Use `npm run dota:cmd -- "say -give item_blink" "say -stat"`.
Chat commands need `say`; console commands such as `script_reload` do not.
Use `--all` for complete output and `--settle <milliseconds>` for delayed effects.

The command contract belongs to
`src/vscripts/modules/debug/debug-cmd.ts`; these commands require Tools mode.
Use -stat/-watch/-cast/-give/-tp/-hurt for values and effects, -m for modifiers,
-aioff/-aion for AI, -g for gold/levels, and -clearunits/-spawnunits for targets.

For reproducible checks:

1. Pause AI and move away from fountain recovery.
2. Record baseline stats, grant the item with -give, then compare stats with KV.
3. Locate existing targets or spawn creeps; monitor them with -watch.
4. Cast using item/ability name and coordinate offsets; read modifier/damage logs.
5. Stop monitoring and restore AI.

Use spawned creeps and real towers instead of training dummies that can be
taken over by custom AI or affected by fountain/bot attacks.
Glyph immunity can suppress tower damage; distinguish it from a failed effect.
Watch covers the selected units; reopen it for other later-spawned targets.
Recovery logs omit natural regeneration, while decreases are fully recorded.
Restart after script_reload if old watcher timers duplicate output.

Alternate casting that reads Ctrl requires actual focused keyboard input;
remote commands do not simulate it.
Focus the window before visual inspection, since unfocused screenshots can
show stale health/time. Collapse the initial ability-selection panel before
checking animations.
