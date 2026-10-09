---
name: dota-clone-item
description: "Clone a vanilla Dota item into an upgraded item with approximately doubled values, a recipe, and localization. Use for enhanced vanilla items; use dota-custom-item for original designs."
---

# Vanilla item clones

Owns items whose `BaseClass` is a vanilla item name, not `item_lua` or
`item_datadriven`. Those belong to $dota-custom-item.

Search `npc_items_clone.txt`, `npc_items_custom.txt`, and
`npc_items_artifact.txt` under `game/scripts/npc/`.
Repair existing clones; move legacy clone definitions into `npc_items_clone.txt`.
Read `BaseClass` to identify the vanilla item. A suffix need not be `_2`;
ask for the clone name or vanilla identity if unresolved.

Read the complete current item and recipe blocks using
[vanilla lookup](../../docs/dota-references.md).
For a new recipe, include the vanilla item itself and ask for unspecified
additional materials and pricing. Keep supplied custom material names.
Verify each material's effective `ItemCost` in current KV, not from memory.

## Recipe and scaling

- Recipe `BaseClass` is `item_datadriven`; use
  `models/props_gameplay/recipe.vmdl`, `ItemRecipe "1"`, and the exact
  clone name in `ItemResult`.
- One `ItemRequirements` row lists all materials separated by semicolons.
  Keep the recipe immediately before the item body, with the surrounding
  section comment above the pair.
- Do not assign new IDs to clones or their recipes.
- Finished price equals effective component prices plus recipe fee.
  Derive the enhancement multiplier from finished price / vanilla price,
  rounded to one decimal, or ask when unresolved.
- Scale growable damage, armor, attributes, regeneration, range, etc.
  Keep fixed cooldowns, cast time, movement speed, slow percentages,
  durations, and projectile speed unchanged.
- Preserve vanilla subblock structure and AoE flags. Annotate scaled values
  with their vanilla baseline.
- Copy casting/behavior fields required by the vanilla implementation and
  set `AbilityTextureName` to the clone's registration name.

## Updating and integration

Compare every field against the current vanilla item: remove obsolete keys,
add required new fields, recalculate scalable values, and retain intentional
clone-specific fields and existing IDs.
Update Description, Note entries, and stat labels from current vanilla text;
retain custom Lore. Give new clones a distinctive Chinese name and a fitting
English name, typically "Upgraded" plus the original name.
Follow the [localization reference](../dota-localization-format-guide/references/format.md)
and the [custom asset rules](../dota-add-image/SKILL.md).

Replace vanilla shop entries with the clone where a writable project shop
contains them; never edit read-only reference shops.
Confirm the clone file is included by the root item KV.
Restart Dota Tools after KV changes and compare actual `-stat` deltas with KV:
a tooltip alone does not prove reused native modifiers apply the new values.
