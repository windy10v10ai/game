---
name: bot-ability-usage
description: "Implement AbilitySpec rules so bots cast a specified ability at the right time. Use when adding or adjusting bot ability casting; use bot-item-usage for combat item activation."
---

# Write Bot ability casting Spec

registers "when and where to cast this ability" in data form to `AbilityRegistry`, which is automatically traversed and executed by `AbilityDispatcher` at every bot tick.

> Architecture background: `AbilityDispatcher` (by spec registry) is the only target architecture for bot fine-tuned active casting. The existing handwritten logic of `UseAbilityXxx` is a migration debt. When modifying these capabilities, the rules should be migrated to spec and duplicate entries should be deleted. All new abilities must be spec-based, and do not add them to the hero file.
>
> critical path:
>
> - Type: [src/vscripts/ai/ability/ability-spec.ts](src/vscripts/ai/ability/ability-spec.ts)
> - Registry: [src/vscripts/ai/ability/ability-registry.ts](src/vscripts/ai/ability/ability-registry.ts)
> - dispatcher: [src/vscripts/ai/ability/ability-dispatcher.ts](src/vscripts/ai/ability/ability-dispatcher.ts)
> - Sharing condition/filter: [src/vscripts/ai/action/cast-condition.ts](src/vscripts/ai/action/cast-condition.ts)
> - spec directory: [src/vscripts/ai/ability/specs/](src/vscripts/ai/ability/specs/)
> - Aggregation registration: [src/vscripts/ai/ability/specs/index.ts](src/vscripts/ai/ability/specs/index.ts)

---

## Step 1: Parse ability input

is processed according to the `.agents/docs/dota-references.md` rules (supports system name/Chinese name/hero name-ability name), and finally gets **`abilityName`** (such as `omniknight_purification`).

---

## Step 2: Check if there is already a spec

```
Glob pattern: src/vscripts/ai/ability/specs/<abilityName>.ts
```

| Situation      | Processing                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Exists         | Operation mode = **Modify existing spec** (read and edit SPECS array according to user requirements) |
| Does not exist | Operation mode = **New spec file**                                                                   |

> The same ability has different conditions in different target scenarios (for example, against heroes/against minions). It can be expressed through multiple entries of the `SPECS` array in the same file. **Do not create multiple files**.

---

## Step 3: Read ability KV and extract key fields

Press `game/scripts/npc/CLAUDE.md` "vanilla KV Reference" to find the KV block of this ability and extract:

| KV field                | Purpose                              | Value mapping                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AbilityBehavior`       | Determine the cast calling method    | dispatcher automatically dispatches according to `UNIT_TARGET / POINT / AOE / NO_TARGET`, **spec does not need to be concerned**                                                                                                                                                                    |
| `AbilityUnitTargetTeam` | Decision `TargetSide`                | `ENEMY` → `EnemyHero/EnemyCreep/EnemyBuilding`; `FRIENDLY` → `FriendlyHero/FriendlyBuilding`; ability only affects the caster → `Self`                                                                                                                                                              |
| `AbilityUnitTargetType` | Distinguish heroes/minions/buildings | Use `*Hero` for `HERO`; use `EnemyCreep` for `BASIC/CREEP` only; use `*Building` for `BUILDING`; register multiple entries for the same ability when there are multiple legal targets and the semantics are reasonable** spec** (such as Frost Shield against friendly heroes + friendly buildings) |
| `AbilityCastRange`      | Casting range                        | **dispatcher will automatically filter targets** by cast range + casting distance bonus, spec usually **do not** handwrite `range.lte`                                                                                                                                                              |

If the ability is `PASSIVE` or pure `NO_TARGET` buff itself, there is no need to select the target → `TargetSide.Self`.

---

## Step 4: Confirm the casting conditions with the user

Use `AskUserQuestion` to confirm with the user the required items in the following items (unnecessary items are omitted directly, the simpler the spec, the better):

1. **Target health condition** (most common): For example, "Kill with residual health" `target.unitCondition.healthPercent.lte: 25`; "Low health teammate" `lte: 70`; "Avoid full health" `lte: 95`.
2. **Target number conditions**: Group ability requires "at least N enemies within the casting range before taking action" `target.count.gte: 3`. **Counting range = effective `range.lte`** (spec explicitly written takes precedence, if not written, press cast range / `rangeFromAbilityValue` to automatically complete), not a fixed 1800 pre-search radius. The count is only narrowed by survival and distance, and is not affected by `target.unitCondition`. If the criterion requires a larger observation range than the casting distance, please note that `range` also determines target screening. Zooming in will cause the bot to chase distant targets.
3. **Caster conditions**: For example, "use only when the mana level is sufficient" `self.unitCondition.manaPercent.gte: 50`, or "use a certain life-saving ability only when the blood level is low."
4. **ability level/charging conditions**: `ability.level.gte: 3`, `ability.charges.gte: 1`.
5. **Avoid repeated casts**: `target.unitCondition.noModifier: ['modifier_xxx']`, often used for continuous debuff/buff. Modifier name search `DOTA_Tooltip_modifier_<name>` Get `<name>`: **Check the project `game/resource/addon_schinese.txt`** first (customization/clone/override ability is subject to the localization of the project); if the project cannot be found, then check the reference latest version `docs/reference/<version>/abilities_schinese.txt` (vanilla ability). Example: Frost Shield = `modifier_lich_frost_shield`; `lich_frost_armor` is a project that clones arcane mage ice armor to lich. Vanilla lich does not have this ability, modifier name = `modifier_lich_frost_armor`, and is only defined in project localization.
6. **Skip the controlled target**: `target.unitCondition.notActionable: true`. If the target is in a hard control state such as dizziness/sheep/nightmare/void, it will be skipped. Using control ability on a controlled target is usually a waste.
7. **Cast spells only when there are no enemy heroes nearby**: `self.noEnemyHeroInRange: 900` (distance can be customized), often used to confirm safety before casting spells on minions or buildings. This field is checked at the dispatcher `tryCast` layer. It is not a subfield of `self.unitCondition` and is directly hung under `self`.
8. **Enough friendly minions are needed nearby**: `self.friendlyCreepNearby: { count: { gte: 3 } }`, often used in tower push scenarios (confirm that there is a push wave when casting the spell on `EnemyBuilding`). `range` If left blank, the default value is 900. This field is also directly hung under `self` and dispatcher inline `FindUnitsInRadius` checks.
9. **Excluding the caster himself**: `target.excludeSelf: true`. Friendly candidates naturally include casters and are ranked first with a distance of 0. Abilities that cost one's own life (such as Abaddon's Mist Coil) must be eliminated; it is usually reasonable to use pure buffs for yourself, do not add them casually.
10. **Relative orientation of the target**: `target.facing: 'front' | 'back'`, only the target located in the front/back half of the caster is retained (the dot product of the horizontal plane takes the sign, neither the front or side is satisfied). Ability with displacement is used to distinguish pursuit (jumping towards the target) and retreat (jumping with your back to the target), such as Zeus's holy jump.
11. **There are / no teammates nearby**: `self.allyHeroInRange: 1200` / `self.noAllyHeroInRange: 900`, only true heroes are counted, not including yourself. The former is used when the control and continuous casting ultimate skills require teammates to follow up the output or protect and guide (such as Demon's Claw, Extreme Cold Field); the latter is used when the control is released after receiving damage (such as Nightmare). Like `noEnemyHeroInRange`, it is directly hung under `self`.
12. **Only select targets with restricted movement**: `target.unitCondition.disabled: 'hard' | 'movement'`, the opposite of `notActionable` (skip if charged). `hard` only recognizes hard controls such as stun and sheep transformation; `movement` also recognizes entanglement and being slowed down to the point where it cannot run out of range. It is used to control the full ability (such as Mystic Glory, Soul Elegy).
13. **Circular area at a fixed position in front of the caster**: `target.aheadCircle: { distanceValue, radiusValue }`. Only targets falling within a circle at a fixed distance in front of the caster are selected. The distance and radius button names read the ability value. For non-target abilities (such as shadows of destruction) that take effect toward a fixed position in front of you, it is more accurate than `facing`; if the non-target ability cast range is 0, you must also explicitly write `range.lte`.
14. **Last until the ultimate is good**: `self.ultimateNotReady: true`, skip when the ultimate has been learned and can be released. It is used to release abilities that will be locked by the guide (such as Upheaval), so that the ultimate can be handed over first.
15. **End continuous casting early**: spec top `stopChannel: { noEnemyHeroInRange?, graceSeconds?, afterSeconds? }`, `graceSeconds` Let the enemy leave the range and then wait a few seconds before stopping (such as Hatsune dancing, the enemy briefly walks away without handing over the long guidance), checked by the hero executor during the guidance. If you don't write it, guide it to the end; only add the ability that is really needed. For example, if the drastic change stops after the enemy leaves, or if the end of luck is released, the guide will end and it will take effect immediately.
16. **Select only if there are many enemies around the target**: `target.enemiesNearby: { range, count }`, only select targets with at least count enemy units (counting heroes and creeps together) around them. Ability to cast on allies and incidentally damage enemies around them (such as Shadow Wave cast on teammates or one's own creeps).
17. **Select only if the target has a certain status**: `target.unitCondition.hasModifier: [...]`, select only if it has any of the modifiers, which is the opposite of `noModifier`. Used after other ability effects (for example, Flame of Purification can only be cast on teammates who have Edict of Fate or False Promise).
18. **Killing Threshold Multiple**: `healthAbilityValue.multiplier`, the threshold is multiplied by the multiple, used for the damage ability with short cooldown and expected to be fired several times in a row (such as the Flame of Purification takes twice the damage).
19. **Usage method of pressing the fight/withdraw decision**: `self.stance: 'fight' | 'retreat'`, read the fight/withdraw decision made by the hero layer (the persistence of the battle, the combat power of the tower, and the enemy's charge are all counted), and fighting back if you can't run are both counted. Abilities that can both strike first and escape, such as displacement and invisibility, are split into two parts. Don't use your own blood volume instead of judging the situation. `'fight'` is used for jumping into the enemy's side, making it difficult to retreat (such as Phantom Assault, Holy Jump forward, Pierce), and jumping over targets standing under insurmountable towers; `'retreat'` is used for escaping (such as Holy Jump Back, Shadow Blade).
20. **Target a tree**: `targetSide: TargetSide.Tree`, cast on the nearest tree near the caster (such as grabbing a tree), the target conditions are not applicable, only the conditions of the caster are considered.
21. **Ability will not be released until it is handed over**: `self.abilitiesOnCooldown: { seconds, count }`, at least count active abilities that have been learned will be cast when the remaining cooldown is no less than seconds, excluding items. Different from `cooldownTotal` (sum of ability plus item cooling, used for refresh types), it is used for gains that cannot cast spells when turned on or should be connected after ability (such as crazy mask).
22. **The target is running away with its back to the enemy**: `target.fleeing: <range>`, only the target with the nearest enemy hero behind it within the distance is selected. The judgment method is the same as `facing` but based on the direction of the target itself. The effect is used to push in the direction of the target (such as pushing a teammate's Force Staff). Pushing in the wrong direction will send the person into the enemy group.
23. **The target is being attacked by the tower**: `target.attackedByTower: true`, only select the target that is being attacked by the enemy's defense tower. With `FriendlyCreep`, it can give buffs (such as the Flame Crest) to the minions being attacked by the tower.
24. **Only hits targets that are beyond the reach of normal attacks**: `target.outOfAttackRange: true`, the lower limit of the distance is the current attack distance of the caster. It is used to cast forward or guide long, single-target abilities (such as assassination) that are not as good as normal attacks when close to the face, leaving it to chase residual health and hit from a distance.
25. **Multiple specs with the same name**: If the heroes/minions/buildings have different target scene conditions (such as a group of snake guards versus heroes/towers), write multiple `AbilitySpec` entries and sort by "put the most important ones first".
26. **Only select neutral units and filter by absolute health**: `target.unitCondition.neutralOnly: true` is limited to wild monsters, `target.unitCondition.health` is filtered by current absolute health.

### Whether to add a clearing rule for minions

After confirming the rules of the hero, we can then judge whether the ability should be cleared by the way. **Don't make your own decision, use `AskUserQuestion` to ask the user**, and include the cooldown and mana consumption of the ability in the option description, so that the user has a basis for judgment.

Ask only when all three conditions are met:

1. **Range Damage**. `AbilityBehavior` with `AOE`, or `POINT` with class capability, or `UNIT_TARGET` with `AOE`.
2. **can act on ordinary units**. `AbilityUnitTargetType` contains `BASIC` or `CREEP`; `POINT` and `NO_TARGET` are naturally satisfying. Only the unit of `HERO` cannot select minions with the specified ability and is directly excluded.
3. **No loss if used to clear troops**. If cooldown and mana are at critical ability levels, don’t ask questions and just rule them out. The experience line is a cooldown of more than 45 seconds or a mana of more than 200; at the same time, looking at the status of this ability in heroic battles, the core mobility and life-saving ability cannot be eliminated even if it is cheap.

No questions are asked in any of the following types of situations: single-target damage and single-target control, gain/shield/healing, pure displacement, and passive.

After the user agrees, add an entry of `targetSide: TargetSide.EnemyCreep` to the `SPECS` array in the same file, ranked after the rules for heroes. The default threshold is automatically applied by the dispatcher, and there is usually no need to write any conditions.

`EnemyCreep` rules are only tried in `laning`, `push`, `farm`, `defend` modes; clear single use uses `target.count.gte: 1` coverage clearing threshold in spec.

> **EnemyCreep default condition** (`CREEP_DEFAULT_CONDITION`, automatically applied by dispatcher, no need to write it repeatedly in spec):
>
> - `self.unitCondition.manaPercent.gte: 40`
> - `self.unitCondition.healthPercent.gte: 40`
> - `ability.level.gte: 2`
> - `self.noEnemyHeroInRange: 900`
> - `target.count.gte: 2`
>
> Ancient wilds are handled uniformly by the dispatcher, do not write another spec for Ancient: in `farm` mode, when the ability level reaches `target-dispatch.ts` `ANCIENT_MIN_ABILITY_LEVEL`, EnemyCreep candidates are automatically added to Ancient; KV `AbilityUnitTargetFlags` with `NOT_ANCIENTS` ability is skipped according to the engine criteria. When certain abilities really shouldn't be played in ancient times, write `target.unitCondition.excludeAncient: true` in their spec. The same path value explicitly specified in the
>
> spec will overwrite the default value through `DeepMerge` (NumberRange overall replacement, non-key level merging). For example, if you want to absorb mana only when your mana level is low: `self.unitCondition.manaPercent: { lte: 40 }` will replace the default `gte: 40`.

> The existing condition structure is found in `UnitCondition / AbilityCoindition / NumberRange` of [cast-condition.ts](src/vscripts/ai/action/cast-condition.ts).

Do not invent fields that `cast-condition.ts` does not have; if the user's request exceeds the existing conditional capabilities (for example, "do not cast when too close to the enemy tower"), inform the user that the current framework does not support it and needs to extend the dispatcher. Do not add the spec field by yourself.

---

## Step 5: Write spec file

file name = `<abilityName>.ts`, path `src/vscripts/ai/ability/specs/`.

template:

```ts
import { AbilitySpec, TargetSide } from '../ability-spec';

/**
* <Chinese ability name>: <vanilla behavior / target team excerpt, such as UNIT_TARGET / ENEMY / HERO>.
 *
* <One sentence to explain when to cast and why it is so limited. >
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: '<abilityName>',
    targetSide: TargetSide.<EnemyHero | EnemyCreep | EnemyBuilding | FriendlyHero | Self>,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 25 } },
      },
    },
  },
];
```

Try to omit the omitted parts:

- no condition → directly `targetSide: TargetSide.Self,` without writing `condition`.
- None `target` / `self` / `ability` Any branch → Do not write empty objects.

---

## Step 6: Registration

Find `src/vscripts/ai/ability/specs/index-<start>-<end>.ts` (such as `index-a-d.ts`) by the first letter of the ability name. In this file:

1. Add `import { SPECS as <camelName> } from './<abilityName>';` in alphabetical order
2. Add `AbilityRegistry.registerAll(<camelName>);` in alphabetical order to the registration function

Do not add the import back to `index.ts`: Each import is a top-level local variable in Lua. If a single file exceeds 200, `main function has more than 200 local variables` will be reported, and the entire ability AI will fail to load. When a grouped file is close to the upper limit (about 90 imports), it is subdivided alphabetically. The

> dispatcher traverses in the order of `hero.GetAbilityByIndex` slots, so the priority between multiple abilities is determined by "which slot of the hero the ability is hung in"; the priority of multiple specs with the same name is determined by the order of the SPECS array.

---

## Step 7: Verification

| Check            | Command/Action                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type/Compilation | `npm run lint && npm run build:vscripts`                                                                                                                    |
| Unit test        | `npm test` (no need to add new spec test, the framework itself has test coverage)                                                                           |
| In-game          | `npm run start` Enter tools, let a bot learn/draw the ability and construct trigger conditions, observe the console `[AI] CastByBehavior <abilityName>` log |

---

## Common Traps

- **Do not handwrite `range.lte`** in the spec: the dispatcher will automatically fill in `AbilityCastRange + GetCastRangeBonus` in the ability KV. Instead, handwriting will overwrite the default value, causing attempts to cast beyond the casting distance. Exception: spec wants a smaller search radius before explicitly overriding it.
- **Do not add new field types to spec**: spec fields can only be those defined in `ability-spec.ts`; new requirements must first extend `cast-condition.ts` and dispatcher before consumption.
- **Do not add new abilities to the hero file `UseAbilityXxx`**: New abilities will all go to spec. When encountering existing handwritten rules, move the effective conditions into spec, and delete the corresponding hero override after confirming that the behavior is equivalent. Hero-specific spellcasting cannot be retained as a long-term second execution layer.
- **toggle/autoCast class ability**: Expressed via `condition.action.toggleOn / toggleOff / autoCastOn`. The dispatcher only switches to the target state after hitting the action condition, and does not perform normal casting and dispatch; when it is already in the target state, it returns false and continues to try subsequent rules.
- **Switch that is only turned on when there is a target**: `action.toggleByTarget: true`, it turns on when it finds a target that meets the conditions, and turns it off when it cannot find it. One spec can turn it on and off at the same time (such as rot, voodoo recovery). `toggleOff` can only be turned off when "finding the target", and cannot express "turn off if there is no target".
- **Ability to point to both the unit and the ground**: The dispatcher is dispatched according to the runtime behavior, and the UNIT_TARGET bit points to the unit. Some abilities run with UNIT_TARGET and POINT at the same time (such as the enhanced totem of the A staff, upheaval, and throwing). Pointing to the enemy will be rejected by the engine and retried every tick. For this type of writing, `target.castMode: 'targetPosition'` is forced to click the ground. The `[bot-cast]` log in development mode contains `beh=` (runtime behavior bit). If the same ability appears repeatedly in a short period of time, the command is not executed successfully.
- **TSTL object spread trap**: See the last article of "Common Traps" of `src/vscripts/CLAUDE.md`; the spec file itself does not use spread, but if you need to extend the dispatcher / cast-condition, you **absolutely** cannot write `{ ...maybeUndefined }`.
- **KV numeric field terminology**: The current numeric field block name in Dota 2 KV is `AbilityValues` (the old version `AbilitySpecial` is obsolete). Use `AbilityValue` expressions uniformly in comments, field naming, and documents; the engine API `GetSpecialValueFor(key)` can still be called, but the variable names and comments should be written as `abilityValue` / `rangeFromAbilityValue` instead of `specialValue`.
- **Spec file header comments do not repeat the fields/values ​​in condition**: Comments only write the intention ("use if there are enemies within the range"), do not include the specific values ​​of fields such as `range.lte` ("within 900 range"). If the same value appears twice, if only one of them is changed subsequently, it will be self-contradictory, and it will be impossible to determine which one is the source of the truth. This rule also applies to ItemSpec (`ai/item/specs/`) files. When you find that the annotation value is inconsistent with the code, **don't change the code by assuming that the annotation represents the design intention and that the code is a typo** - you should first check git blame/real-machine testing to confirm who is the source of the truth, and then decide whether to change the code or the annotation.
