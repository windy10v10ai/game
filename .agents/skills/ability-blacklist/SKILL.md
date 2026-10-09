---
name: ability-blacklist
description: "Add abilities or items to the Butterfly Effect and Multicast random-retrigger blacklists. Use when an ability or item must be excluded from either random-trigger system."
---

# Ability Blacklist

There are two blacklists. When the target is unclear, use `AskUserQuestion` to let the user choose one or both:

| Blacklist        | File                                                              | Table name                                                     | Writing method             |
| ---------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| Butterfly Effect | `game/scripts/vscripts/abilities/ability_blacklist_butterfly.lua` | `EXCLUDED_ABILITIES_ALLBUTTER`(ability)/`EXCLUDED_ITEMS`(item) | `["ability_name"] = true,` |
| Multicast        | `game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua`     | `no_support_abilitys` (ability) / `no_support_items` (item)    | `ability_name = 1,`        |

## system name confirmation

ability display name (tooltip) may be different from the system name (for example, the display name is "Sproink" but the actual system name is `enchantress_bunny_hop`). Follow the `.agents/docs/dota-references.md` process and verify the corresponding relationship between `DOTA_Tooltip_ability_<system_name>` in `docs/reference/<version>/abilities_english.txt`. Do not directly copy the displayed name as the system name.

## Add location

Insert corresponding annotation groups according to mechanism classification (displacement/stealth/summoning/continuous casting/two-stage, etc.); if no matching group is found, add it to the corresponding table at the end of the file. In the comment, write the hero name + ability Chinese name.
