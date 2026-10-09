---
name: bot-item-usage
description: "Implement ItemSpec rules so bots activate a specified combat item at the right time. Use for combat item behavior; use bot-item-build for purchasing decisions and bot-ability-usage for abilities."
---

# Write Bot item using Spec

registers "when and for whom the item is used" in the form of data to `ItemRegistry`, and `ItemDispatcher` automatically traverses the backpack and executes it at each bot tick.

> Architecture background: item and ability share the same set of target screening + spell distribution core `TryCastBySpec`
> ([target-dispatch.ts](src/vscripts/ai/action/target-dispatch.ts)), `AbilityDispatcher` and
> `ItemDispatcher` are just two different "candidate sources" - ability traversal `hero.GetAbilityByIndex`, item traversal
> `hero.GetItemInSlot(0~8)`. When writing ItemSpec, the capability boundary is exactly the same as AbilitySpec. See
> [bot-ability-usage](../bot-ability-usage/SKILL.md)facing`cast-condition.ts`Detailed description of fields, this document
> only talks about the item-specific parts.
>
> critical path:
>
> - Type: [src/vscripts/ai/item/item-spec.ts](src/vscripts/ai/item/item-spec.ts)
> - Registry: [src/vscripts/ai/item/item-registry.ts](src/vscripts/ai/item/item-registry.ts)
> - dispatcher: [src/vscripts/ai/item/item-dispatcher.ts](src/vscripts/ai/item/item-dispatcher.ts)
> - Shared condition/dispatch core: [src/vscripts/ai/action/target-dispatch.ts](src/vscripts/ai/action/target-dispatch.ts), [cast-condition.ts](src/vscripts/ai/action/cast-condition.ts)
> - spec directory: [src/vscripts/ai/item/specs/](src/vscripts/ai/item/specs/)
> - Aggregation registration: [src/vscripts/ai/item/specs/index.ts](src/vscripts/ai/item/specs/index.ts)

---

## Step 1: Determine which system this item should go to

First distinguish three sets of non-overlapping item logic to avoid falling into the wrong framework:

| item type                                                                                                                                       | ownership                                            | judgment criteria                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Consume immediately after purchase, no need to make battle timing decisions** (Wings of Rapidity, True Silver Moon, Book of Attributes, etc.) | `ConsumeItem.ConsumeKnownItems` of `consume-item.ts` | Use it as soon as you buy it, there is no judgment of "when to use it", only "can it be used" (CD/mana consumption)              |
| **Active items that require combat timing/target judgment** (covered by this skill)                                                             | `ItemSpec` + `ItemRegistry` + `ItemDispatcher`       | Requires decisions such as "use only when the enemy is nearby", "use only with residual health" and "skip the controlled target" |
| **Outfit decision** (what to buy, when to buy, what to sell)                                                                                    | `bot-item-build` skill                               | Completely unrelated to this skill, do not confuse it                                                                            |

Only the second category continues down the path.

---

## Step 2: Check whether there is already a spec and determine whether it belongs to the upgrade chain

```
Glob pattern: src/vscripts/ai/item/specs/<itemName>.ts
```

| Situation      | Processing                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Exists         | Operation mode = **Modify existing spec** (read and edit SPECS array according to user requirements) |
| Does not exist | Operation mode = **New spec file**                                                                   |

**Check the `baseItems` field of `item-tier-config.ts` before creating a new one**: If this item forms a clear upgrade chain with another item that already has a spec (such as `item_wasp_callous` → `item_wasp_golden`), and the usage conditions are exactly the same, **merge into the other party's file** (named after the starting point item of the chain), do not create a new file. Refer to existing writing methods such as [item_dagon.ts](src/vscripts/ai/item/specs/item_dagon.ts) (Dagon Level 1~5), [item_wasp_callous.ts](src/vscripts/ai/item/specs/item_wasp_callous.ts) (Big Core Glory Series), [item_refresher.ts](src/vscripts/ai/item/specs/item_refresher.ts) (Refresher Ball Series)], etc.

Only logically different parallel branches (sharing the same `baseItems` but with different effects, such as various types of shoes) should be separated into independent files or not shared at all.

---

## Step 3: Read item KV and extract key fields

Press `game/scripts/npc/CLAUDE.md` "vanilla KV reference" to locate the KV block of the item (vanilla check `docs/reference/<version>/items.txt`, clone/self-made check `game/scripts/npc/npc_items_clone.txt` / `npc_items_custom.txt`, override delta override check `npc_items_override.txt`):

| KV field                                              | Purpose                                         | Value mapping                                                                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `AbilityBehavior`                                     | Determine the cast calling method               | dispatcher automatically dispatches according to `UNIT_TARGET / POINT / AOE / NO_TARGET`, spec does not need to be concerned                                |
| `AbilityUnitTargetTeam` / `AbilityUnitTargetType`     | Decision `TargetSide`                           | Same as AbilitySpec rules; **But see "Detection Techniques for NO_TARGET item" below and cannot be copied directly**                                        |
| `AbilityCastRange`                                    | Casting distance                                | Same as AbilitySpec, dispatcher automatically fills in; **Many NO_TARGET items this field is 0**, in this case you must explicitly write `target.range.lte` |
| `AllowedInBackpack` / `ItemCanBeUsedWithoutInventory` | Whether to allow direct use in the spare column | `usableFromBackpack: true` is meaningful only if KV declares one of them (see the spare column section below)                                               | "Detection skills" for |

### NO_TARGET item (very important, easy to write wrong)

Many items have `NO_TARGET` behavior (self-buff, group effect), but it still requires judgment such as "use only when there are enemies/friendly forces around". **Don't** use `TargetSide.Self` just because it is NO_TARGET - `TargetSide.Self` will skip all `target` condition checks (`pickTarget` returns itself directly to Self, see target-dispatch.ts). The correct way to write

: `targetSide` still fill in the real detection objects such as `EnemyHero` / `FriendlyHero`, and rely on `target.count` / `target.range` for detection; since the actual behavior is NO_TARGET, `CastAbilityOnTargetByBehavior` will eventually ignore the selected target and directly `CastAbilityNoTarget`. Reference [item_magic_scepter.ts](src/vscripts/ai/item/specs/item_magic_scepter.ts), [item_wasp_callous.ts](src/vscripts/ai/item/specs/item_wasp_callous.ts).

Only pure buff items (such as Adi King) that really "do not need to detect anything, use it as soon as the CD is ready" use `TargetSide.Self` and do not write `condition`, refer to [item_adi_king.ts](src/vscripts/ai/item/specs/item_adi_king.ts).

**In this trick, `ignoresMagicImmune: true` almost always needs to be added**: NO_TARGET item itself does not have the `MAGIC_IMMUNE_ENEMIES` flag. If it is not set explicitly, the magic-immune enemies will be filtered out by `FilterTargetWithCondition`, resulting in the target not being found and the ability not being released.

---

## Step 4: Confirm the conditions of use with the user

In addition to the common conditions listed in [bot-ability-usage](../bot-ability-usage/SKILL.md) (blood volume, quantity, level, `notActionable`, `noModifier`, etc.), common item scenarios include:

0. **Write the full threshold for the rules of minions**: The default threshold and mode filtering of `EnemyCreep` of ability are superimposed by `AbilityDispatcher`, and `ItemDispatcher` is not superimposed. The item's spec for the minion explicitly writes `target.count`, `self.noEnemyHeroInRange` and mana, refer to [item_meteor_hammer.ts](src/vscripts/ai/item/specs/item_meteor_hammer.ts).

1. **Exclude Ancient Wild**: `target.unitCondition.excludeAncient: true` (Items such as Team Hand/Infinity Gauntlet that are used on minions are recommended to be retained even if the candidate pool itself does not contain Ancient Wild. This is a defensive writing method).
2. **Use only if there are no enemy heroes/buildings nearby** (safe scene judgment, such as smoke): `self.noEnemyHeroInRange` / `self.noEnemyBuildingInRange`, the semantics are "skip if present", which is the opposite of "requiring the enemy to exist", don't be confused.
3. **Use only if there is no corresponding buff on you** (to avoid repeatedly casting the same effect, such as the smoke's own invisibility buff): `self.unitCondition.noModifier: '<modifier name>'`.
4. **ability+item total cooling pressure** (refresh ball): `self.cooldownTotal: { gte: N }`, the statistical range is the sum of all abilities + the remaining cooling of items in the main column (slots 0~5).
5. **Switch type** (switching form/mode): `condition.action.toggleOn: true`.
6. **Radical/Conservative OR Logical**: Write two specs for the same item, one short-range unconditional, one long-range + residual health, refer to the B2 group writing method (such as [item_blade_mail_2.ts](src/vscripts/ai/item/specs/item_blade_mail_2.ts)).

---

## cast tier (`priority`)

bot organizes the main item column every 2 seconds: the spare column items fill in the vacancies, and then sort by `ItemPriority` (`Survival` → `Control` → `Buff` → `Damage` → `Default` → `Refresh`). `ItemDispatcher` is checked in grid order, so the tier decides who should be put first when the conditions are met at the same time.

- If left blank, it means `Default`. Pure attribute equipment without spec is also in this level.
- When the upgrade chain is merged into one file, each entry must be written in the same tier; `ItemRegistry.priorityOf` only reads the first spec of the item
- New items are marked tier only if they clearly belong to life-saving, control, gain, output or refresh.
- items in the same upgrade chain (`item-tier-config.ts` and `baseItems`) use the same tier, even if they are in different spec files

## Step 5: Spare Column Availability (`usableFromBackpack`)

Default `ItemDispatcher` skips the spare column (slot 6~8) items. Only pickups/situational items (Roshan Battle Flag, Smoke) are suitable for setting `usableFromBackpack: true`.

**Both conditions must be met at the same time, one is indispensable**:

1. TS side: spec riga `usableFromBackpack: true` (only affects whether our own dispatcher tries).
2. KV side: The KV block of this item requires one of `AllowedInBackpack "1"` or `ItemCanBeUsedWithoutInventory "1"` (otherwise the engine itself refuses to cast spells in the spare column, even if our dispatcher tries, it will be rejected by the engine). **Only changing TS but not KV is a common omission**. Confirm KV easily when adding `usableFromBackpack`.

---

## Step 6: Write spec file

File name = `<itemName>.ts` (chain starting point item name for upgrade chain scenario), path `src/vscripts/ai/item/specs/`.

template:

```ts
import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** <Chinese item name>: <One sentence explaining when to use it and why it is so limited, do not include specific values>. */
export const SPECS: ItemSpec[] = [
  {
    itemName: '<itemName>',
    targetSide: TargetSide.<EnemyHero | EnemyCreep | FriendlyHero | FriendlyCreep | Self>,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
    // usableFromBackpack: true, // Only required for pickup/scenario items, see step 5
  },
];
```

The omitted parts should be omitted as much as possible, the same as the AbilitySpec rules (no condition will not be written, empty target/self will not be written).

---

## Step 7: Register in index.ts

Modify [src/vscripts/ai/item/specs/index.ts](src/vscripts/ai/item/specs/index.ts):

1. Add `import { SPECS as <camelName> } from './<itemName>';` on top (in alphabetical order)
2. calls `ItemRegistry.registerAll(<camelName>);` for the corresponding grouping paragraph in `registerItemSpecs()` (use the existing B1/B2/.../pickup object grouping comments in the file, and add a new one if no suitable grouping is found)

> dispatcher tries according to the `hero.GetItemInSlot(0~8)` slot traversal order. The priority between items is determined by the "actual slot of the item"; the priority of multiple specs of the same item is determined by the `SPECS` array order.

---

## Step 8: Verification

| Check              | Command/Action                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type / Compilation | `npm run lint && npm run build:vscripts`                                                                                                             |
| Unit test          | `npm test` (no need to add new spec test, the framework itself has test coverage)                                                                    |
| In-game            | `npm run start` Enter tools, let the bot buy the item and construct trigger conditions, and observe the console `[AI] CastByBehavior <itemName>` log |

---

## Common Traps

- **Do not write the NO_TARGET item that requires target detection as `TargetSide.Self`**: See the "Detection Techniques" section in the third step. This is the most common place to make mistakes.
- **Do not hand-write `range.lte` in the spec unless item `AbilityCastRange` is 0**: the dispatcher will automatically fill in the KV casting distance; the value of NO_TARGET item is usually 0. If not written, the search radius will always be 0 (equal to no target found), and must be written explicitly.
- **Items with the same upgrade chain and the same logic are merged into one file by default**: Check `prerequisite`/`upgrades` before creating a new one, see step two.
- **When merging into the same file, the chain starting point (base) item must also have its own entry**: The bot item-build may stop at a certain intermediate/starting tier. Only writing the highest level will cause the bot with a low tier to never trigger the usage logic (the dispatcher matches the spec exactly according to `item.GetName()`, without fallback). Reference [item_adi_king.ts](src/vscripts/ai/item/specs/item_adi_king.ts), [item_dagon.ts](src/vscripts/ai/item/specs/item_dagon.ts)]: There must be an entry for each tier that the bot may actually hold on the chain.
- **`usableFromBackpack` Changing only TS without changing KV will not take effect**: See step 5, both of which must be met at the same time.
- **Don't put items that are "consumed immediately after purchase" into the ItemSpec**: That type of item goes `consume-item.ts` and does not require combat decision-making. It is over-designed to mix it into the ItemSpec.
- **Spec file header comments do not repeat the specific values ​​​​in condition** (same as the rules of bot-ability-usage): only write intentions, do not write "900 range", "≥60 seconds" and other specific values ​​​​that will be out of touch with the code as the values ​​​​are adjusted.
- **`fillRangeFromCastRange` of `target-dispatch.ts` must not be modified in-place `condition.target`**: spec is a module-level singleton in `ItemRegistry`/`AbilityRegistry`, sharing the same reference across all heroes/all ticks. Writing in place will "freeze" the first calculated value into the shared spec. You only need to pay attention to this when modifying target-dispatch.ts itself. Writing a spec file will not trigger it.
