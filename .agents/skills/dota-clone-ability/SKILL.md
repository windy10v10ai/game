---
name: dota-clone-ability
description: "Create or repair delta clones of vanilla Dota abilities using the original ability as BaseClass. Use for vanilla-based custom abilities; use dota-custom-ability for new implementations and dota-awaken-ability for awakening slot replacements."
---

# Vanilla ability clones

Resolve the vanilla identity and version with [vanilla lookup](../../docs/dota-references.md).
Search both `npc_abilities_custom_lottery.txt` and `npc_abilities_custom.txt`
under `game/scripts/npc/` before creating a block. Repair an existing definition
in its current file; ask if both files contain it. For a new definition, ask
whether it belongs to the lottery or a specific hero/unit when unspecified.

This skill owns clones whose `BaseClass` is a vanilla ability name.
Use $dota-custom-ability for `ability_lua` / `ability_datadriven` implementations.

## KV rules

- New clones start from the complete vanilla block plus project overrides,
  including explicitly marked custom keys. `BaseClass` inherits implementation,
  not a complete KV configuration.
- Prefer adding a vanilla innate directly to the lottery when removing
  `HIDDEN` is sufficient: override only behavior and `IsOnCastBar "1"`,
  retain other flags, and register the vanilla name in the passive pool.
  Do not create a clone block or duplicate vanilla localization for this case.
- A cloned innate needs `Innate "0"`; remove hidden/unlearnable flags as
  required by the intended behavior.
- For `UNIT_TARGET`, explicitly define target team/type/range, immunity,
  dispellability, cast point, cooldown, and mana cost.
- Clear inherited `IsGrantedByShard` / `HasShardUpgrade` when the clone
  must work without a shard.
- Remove vanilla talent/facet/scepter/shard bonus references that cannot apply
  to the renamed ability. Delete emptied zero-value blocks.
- Replace `hero_levelup` scaling with five explicit levels:
  level 5 approximates `base + 49 * step`; interpolate evenly and prefer
  integer or half-unit steps. For other scalable single values, anchor level 3
  near the vanilla value; leave fixed mechanism constants unchanged.
- Preserve tooltip-related `dynamic_value` blocks and
  `affected_by_aoe_increase "1"` subblocks.
- Supply `AbilityTextureName`, and retain keys used by the implementation.
  Annotate changed values with their vanilla baseline.

When repairing, remove identical inherited values and obsolete vanilla keys;
retain marked intentional custom keys and explicit fields required for casting.
Use current project overrides when they change the baseline.
In lottery KV, append within the appropriate innate, normal-upgrade, or Lua section.

## Integration

Rename vanilla tooltip keys to the clone name, including Description and
attribute labels used by its placeholders. Skip unused facet entries.
Preserve surrounding localization comments and spacing; follow
the [localization reference](../dota-localization-format-guide/references/format.md) for all maintained languages.
If requested for the lottery, update `lottery-abilities.ts` and the applicable
bot pool under `src/vscripts/modules/lottery/`.
Use existing definitions such as `dragon_knight_dragon_blood2` as examples,
rather than copying a generic skeleton.

Build vscripts and verify casting, targeting, and scaled values in Dota Tools.
