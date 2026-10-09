---
name: dota-bot-item-usage
description: "Implement ItemSpec rules so bots activate a specified combat item at the right time. Use for combat item behavior; use dota-bot-item-build for purchasing decisions and dota-bot-ability-usage for abilities."
---

# Bot combat item use

Owns `src/vscripts/ai/item/specs/`, `ItemSpec`, `ItemRegistry`, and
`ItemDispatcher`. Items consumed immediately after purchase belong to
`ConsumeItem.ConsumeKnownItems`; purchase/sale decisions belong to
$dota-bot-item-build.

Read effective item KV and [shared casting rules](../../references/bot-casting.md).
Before adding a file, inspect `item-tier-config.ts`:
an upgrade chain with identical use conditions shares a file named after its
starting item. Different-effect branches remain separate.
Every holdable item in a chain needs its own entry, including the base item;
dispatch matches the exact name and has no upgrade fallback.

## Item-specific traps

- A `NO_TARGET` item can still need enemy/ally detection.
  Use the real detection side, not `Self`, because `Self` skips target filters.
  The behavior dispatcher will still issue a no-target cast.
- If cast range is zero, explicitly supply detection `target.range.lte`.
  Otherwise preserve engine cast-range filling.
- For presence detection that must count immune enemies, set
  `ignoresMagicImmune: true`; no-target KV alone does not supply that flag.
- Item creep rules do not inherit ability clearing defaults.
  Write required count, safety, mana, and ancient exclusions explicitly.
- `cooldownTotal` counts abilities plus main-inventory item cooldowns.
- Backpack casting needs both `usableFromBackpack: true` and KV
  `AllowedInBackpack "1"` or `ItemCanBeUsedWithoutInventory "1"`.
  Enable it only for suitable pickup/situational items.

## Priority and registration

`ItemPriority` orders survival, control, buff, damage, default, then refresh.
Items are tried in actual slot order; specs for the same item use array order.
Keep one priority across each upgrade chain, including separate files;
`priorityOf` reads the first spec. Omit priority when Default is appropriate.

Register alphabetically in `src/vscripts/ai/item/specs/index.ts` within the
matching existing group. Comments explain use intent without duplicate thresholds.
Build/type-check and verify item use with `[bot-cast]` logs in Tools.
