---
name: dota-ability-blacklist
description: "Add abilities or items to the Butterfly Effect and Multicast random-retrigger blacklists. Use when an ability or item must be excluded from either random-trigger system."
---

# Random-retrigger blacklists

| System           | File                                                              | Abilities / items                                 | Entry              |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------- | ------------------ |
| Butterfly Effect | `game/scripts/vscripts/abilities/ability_blacklist_butterfly.lua` | `EXCLUDED_ABILITIES_ALLBUTTER` / `EXCLUDED_ITEMS` | `["name"] = true,` |
| Multicast        | `game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua`     | `no_support_abilitys` / `no_support_items`        | `name = 1,`        |

If the target system is ambiguous, ask whether to change one or both.
Resolve the internal ability name using [vanilla lookup](../../docs/dota-references.md);
display names can differ, for example Sproink is `enchantress_bunny_hop`.
Insert into the matching mechanism group, or append to the table if none fits.
Keep the surrounding hero and localized ability-name comment style.
