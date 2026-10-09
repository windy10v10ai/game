---
name: dota-custom-talent
description: "Add or replace hero talents, especially replacing generic bonuses with ability-specific effects. Use when modifying hero talents or connecting a talent to an ability."
---

# Hero talents

Custom talent names use `special_bonus_unique_<hero>_<effect>`, without fixed
numbers. Keep a vanilla name only when intentionally reusing that talent.

A talent change spans these owners:

- `game/scripts/npc/npc_abilities_override.txt`: link the talent from the
  affected ability's `AbilityValues`, and define a custom passive attribute
  talent with `BaseClass "special_bonus_base"`,
  `AbilityType "ABILITY_TYPE_ATTRIBUTES"`, and passive behavior.
- `game/scripts/npc/npc_heroes_custom.txt`: replace the relevant
  `Ability10–17` slot and matching `Bot.Build` selections.
- Localization: use `DOTA_Tooltip_ability_<talent_name>` and
  `{s:<value_key>}` placeholders instead of hard-coded numbers.

For build tiers, `10/15/20/25` choose one talent and
`27/28/29/30` choose the corresponding other talent.
Use $dota-update-heroes-custom to verify slot/tier consistency.
Remove old references when replacing a talent and follow
$dota-localization-format-guide for maintained language entries.
