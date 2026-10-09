---
name: dota-custom-item
description: "Create an original custom item, including artifacts assembled from multiple components. Use for new item designs, item_lua versus item_datadriven choices, and item-property performance; use dota-clone-item for scaled vanilla clones."
---

# Original items

Owns original item designs; vanilla `BaseClass` upgrades belong to $dota-clone-item.
Check [native modifiers](../../references/vanilla-modifiers.md) first.
Reuse native behavior only when it matches the intended item semantics.

## Implementation choice

| Need beyond native reuse                                                                               | Implementation                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Declarative properties/actions, or a one-shot action                                                   | `item_datadriven`; native Lua global functions through `RunScript` only when Actions cannot express it |
| Persistent custom logic, spell absorption, attack accounting, internal cooldowns, cross-instance state | `item_lua` with TypeScript `BaseItem` and `BaseItemModifier`                                           |

Read [DataDriven scope](references/datadriven-scope.md) when deciding whether
KV can express a property/action or when managing modifier ownership.
Do not introduce Lua `class({})` modifiers inside the DataDriven action path.
Keep legacy implementations when maintaining them, unless migration is required
by the requested change.

## Values and modifier ownership

- Static numerical properties, permanent or temporary, live in KV
  `Modifiers/Properties`, not TS getters.
- DataDriven items own their `Modifiers` block; do not route their stats through
  `item_apply_modifiers`.
- `item_lua` cannot use its own `Modifiers` block. Its stats live in
  `npc_items_modifier.txt`, attached through `BaseItemModifier`.
- `item_apply_modifiers` reads its own prefixed `AbilityValues` keys.
  Keep the item's `_tooltip` mirror values synchronized manually.
- Call the superclass when overriding creation/refresh/destruction hooks.
  Use `statsModifierName = ''` when the item has no permanent stats.
- Use `vanillaModifierNames` for native modifiers in TS. Destroy stored handles,
  not every modifier with the same name.
- Retain a matching vanilla field name only when native behavior should supply it.
  Rename fields with different intended semantics or obsolete native contracts,
  and update the matching localization stat keys.
- Visible script modifiers return the item registration name, including
  `item_`, from `GetTexture()`.
- `StartIntervalThink` fires its first callback immediately; skip that callback
  when the intended effect begins only after an interval.

## KV, recipes, and IDs

Ordinary item bodies belong in `npc_items_custom.txt`, artifact-series bodies
in `npc_items_artifact.txt`; modifier KV is not an item-body file.
Assign a new original item ID as the maximum across all `npc_items*.txt` + 1.
Keep established IDs unchanged.

Each `ItemRequirements` row is a complete AND recipe; separate rows are OR
alternatives. Repeat a material name when two copies are needed.
Use one recipe row unless alternative paths are explicitly requested.
Prefer stat-bearing components before pure fusion tokens.
Finished `ItemCost` must equal component costs plus recipe fee.

When changing fusion components, resolve whether their stats/active behavior
should carry over before writing the result. Pure tokens need not add stats;
expensive components require an explicit design decision.
If carrying over an active, synchronize casting KV, script logic, and bot item
recognition, including hard-coded callers.

Follow the [custom asset rules](../dota-add-image/SKILL.md) and
[localization reference](../dota-localization-format-guide/references/format.md).
Build script changes; restart Tools after KV changes.
For native modifier reuse, verify actual stats with `-stat`, then use
`-cast` / `-watch` for active effects.
