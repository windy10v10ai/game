---
name: update-abilities-override
description: "Maintain npc_abilities_override.txt after Dota updates, either by a full hero review or by synchronizing official patch-note entries. Use only on explicit user request."
disable-model-invocation: true
---

# Update Abilities Override

Maintenance `game/scripts/npc/npc_abilities_override.txt`: Only write ** with delta override** of the current reference (extended level, intentional enhancement, etc.), the engine merges missing keys from vanilla.

## Prerequisites

For reference file paths, see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference". For the hero name/ability name search rules, see `.agents/docs/dota-references.md`.

Use `grep` / fragment read positioning, **disable** to read the entire override file at one time.

When judging the actual current value of an ability (such as mana consumption), you cannot just look at the docs/reference vanilla, nor just the top-level fields\*\* - override often writes the value as a nested sub-block within `AbilityValues` (such as `AbilityManaCost { "value" "9 10 11 12 13" }`) instead of the top-level field. Example: `drow_ranger_frost_arrows` vanilla 0 mana, this addon override is actually `AbilityValues` nested 9–13 mana per arrow, only grep the top layer `AbilityManaCost` will misjudge it as 0 mana. First read the entire section of the ability accurately (before the next top-level ability name), and check the top-level fields and the `AbilityValues` nested block at the same time; fall back to vanilla only when the override is not covered.

has two usages: when the user gives the **patch log** ("old value → new value" one by one), go to "Patch Log Synchronization"; when the user only gives the hero or version, go to "Execution Order (Hero by Hero)" for full reorganization.

## patch log synchronization

users post logs in batches, and go through each batch:

1. **Check**: Submit each change in this batch to the subagent of `model: "sonnet"`, compare the previous version and the new version of the `docs/reference` directory (for the layout, see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference"), return the system name, KV key, new and old values of each item, as well as changes not mentioned in the logs in the old and new diffs. The main session reads override and `npc_heroes_custom.txt` by itself (subagent does not determine the modification method).
2. **Checklist**: One line for each log, marking the status and processing of this addon——
   - this addon does not write this key → **automatically takes effect** (the same is true for basic attributes: the hero is inherited if it is not in `npc_heroes_custom.txt` or this field is not written)
   - override writes the key → press P1–P3 to give the new value
   - involves talents → Verify that the talent key is still in the `Ability10+` slot of the hero
   - Old deviations discovered by the way (the official batch has not been changed, but the override is inconsistent with the reference) → `AskUserQuestion` for each item (retain supplementary annotation/synchronize the official/do not move in this batch), and will not be incorporated into the default changes of this batch
3. **Wait for user confirmation before making changes**. After changing `git diff`, only the rows in the check table have been changed. **Each batch is committed separately**. The user returns to step 1 when sending the next batch.

When multiple batches are run in parallel, each batch sends a background subagent in the first step without waiting for each other; the checklist is issued one by one in batch order. Before starting work and reading override, confirm that the branch is based on the latest `develop` (compared after `git fetch`) to avoid repeated changes with the same PR that has just been merged.

When comparing the reference with the log text: the new version value of reference is consistent with the "new value" of the log, and the old version value is consistent with the "old value" of the log for verification. When the reference does not yet contain the change (the official announcement is not online yet), the log text shall prevail. Do not use the current value of the reference to infer the old and new values ​​- the capture time points of different abilities in the same snapshot may be inconsistent. If the two sides cannot match each other, first confirm the reference version status with the user.

## ability range

When the user does not specify ability, the slot is read from the reference hero file:

| Slot                                       | Rules                                                            |
| ------------------------------------------ | ---------------------------------------------------------------- | ---- |
| Ability1–3, Ability6                       | Include all                                                      |
| Ability4/5 = `generic_hidden`              | Skip                                                             |
| Ability4/5 innate ability (`"Innate" "1"`) | Do not extend the level, only write a clear value delta override |
| Ability4/5 other abilities                 | Same as Ability1–3 rules                                         | When |

> `npc_heroes_custom.txt` covers the slot, custom shall prevail.

## level rules

| Type                               | this addon MaxLevel                                                                                                                   | Reference Default |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Tips                               | 5                                                                                                                                     | 4                 |
| Ultimate (`ABILITY_TYPE_ULTIMATE`) | 4                                                                                                                                     | 3                 |
| Innate ability (`"Innate" "1"`)    | Not extended; if the reference explicitly states `MaxLevel "1"`, `MaxLevel` must not be written in override (delete the existing one) | —                 |

If the reference or override has explicitly stated `MaxLevel`, the explicit value shall prevail.

---

## Core Rules (by priority)

When maintaining any ability, strictly follow the order of P1 → P2 → P3, and the subsequent steps must not overturn the conclusion of the previous step.

### P1 Delete the same value and prohibited items

Keys that are literally identical to the reference\*\* will not be written in override, and those that have been written will be deleted.

**Same value judgment range:**

- single value is the same
- Multiple files. Each file is the same as the reference corresponding file, including repeating the last file to round up the MaxLevel (for example, referring to `"20 20 20"`, this addon writes `"20 20 20 20"`, which still has the same value)
- **Note**: "The first levels match the reference, and additional levels extend the arithmetic progression" **not the same value**. Example: refer to `"140 150 160 170"`, this addon MaxLevel=5 write `"140 150 160 170 180"`, the fifth tier 180 ≠ refer to the last tier 170, must be written as override
- `AbilityBehavior`, `SpellImmunityType`, `AbilityCastPoint` and other attribute keys
- Same as reference `special_bonus_unique_*` / `special_bonus_scepter` / `special_bonus_shard`
- **Any key in the sub-block** (`value`, `affected_by_aoe_increase`, `special_bonus_scepter`, etc.) is the same as the reference → delete this line and retain the sibling keys with delta override; if the sub-block has no delta override, delete the entire block

**Absolutely prohibited items:**

- `CalculateSpellDamageTooltip` (give it to vanilla)
- `special_bonus_facet_*` (obsolete in 7.41+); if the subkey only has obsolete facets but no `value`, new `value` is not allowed.
- refers to the key that once existed and is now deleted: it must be deleted from the override

**Reference to never-before-seen keys (customized by this addon):**

- override that do not exist in the previous reference, and the end-of-line comment **clearly says** `// 原版不存在，手动修改` → **reserved** Processing of
- end-of-line comment **without** this description (such as just writing `// x2.5` or no comment):
  - **Only for `LinkedAbility`/`AbilityDraftPreAbility`/Custom talent keys (`special_bonus_*` reference does not exist)** → Use `AskUserQuestion` to ask the user if they intend to add it; if confirmed, write `// 原版不存在，手动修改` and keep it, otherwise delete it
  - **Invalid key caused by changes in vanilla structure**: When the sub-block structure changes, it is handled according to the following rules:
    - is written as `value "X"` in the old format, and is changed to `special_bonus_scepter "Y"` (or `special_bonus_shard`) in the new format: **Automatic migration** - Migrate the design value of the old `value` to the new key name, use the original annotation to infer the magnification/difference value and recalculate it, write `"special_bonus_scepter" "migration value" // official value [rule tag]`, **No need to ask** (when the rules are clear); when the rules are unclear, use `AskUserQuestion` to confirm
    - The old format has auxiliary keys such as `RequiresScepter "1"`, but the new format does not have this key → Delete the auxiliary key directly, **no need to ask**
    - subkey has completely disappeared in the reference (non-structural migration) → **Delete directly without asking** The key name changes after the
- version is updated (such as the old version `foo_tooltip` → the new version `foo`): delete the old key name and press the new key name to go through the normal P1/P2/P3 process.
- **Before changing the talent (`special_bonus_unique_*`), you must verify that the key is still valid**: Before processing any changes involving talents, first refer to the `Ability10-17` list of the hero in the file `npc_heroes.txt` to verify whether the talent key still exists - version updates may replace a talent as a whole with another key (or even a completely different mechanism). This situation cannot be discovered by numerical recalculation alone. If the key no longer exists, it will be deemed to have been replaced. It will be processed again according to the new key. Do not continue to make numerical adjustments on the old key.
- **General talents whose values are embedded in the talent name (such as `special_bonus_cast_range_125`, `special_bonus_attack_damage_15`) are natively implemented by the engine and do not need to write any KV**: Just quote the talent name correctly in `Ability10-17` / `Bot.Build`, do not add a `AbilityValues` block for it

### P2 delta override and MaxLevel extension

#### Read design intent

- **`延伸` mark** → Pure grade expansion: Use the current reference value to re-extend by the difference, and the annotation base is synchronized to the current reference value
- **With end-of-line comments** (`x2`, `+N`, `差值N`, etc.) → Recalculate the value on the **current reference value** according to this rule; if the recalculation result does not match the existing value, enter the "Old version reference missing processing" process
- **No end-of-line comments** (old line written before the `延伸` mark was implemented) → Default is level expansion only; value must be the same as the reference for the first few levels + difference extension. If it is inconsistent with the reference, it is deemed that the official version has updated the value. **Synchronize directly to the latest official value and fill in additional levels (please add `延伸` comment, no need to ask)**

#### MaxLevel extension must be scanned (mandatory)

When the MaxLevel of this addon is higher than the reference, **refer to the entire section of the ability as the complete set** to scan all multi-level keys, and it is prohibited to only scan override existing lines:

| Multi-position key position                   | Description                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Block top with multiple tiers                 | `AbilityCooldown`, `AbilityManaCost`, `AbilityDuration`, `AbilityCastRange`, etc. |
| AbilityValues subblock                        | `"key" { "value" "a b c" ... }`                                                   |
| AbilityValues Top-level tiling (easy to leak) | Direct `"key_name" "a b c"` No sub-block                                          |

> **Top vs sub-block conflict**: If a key (such as `AbilityCooldown`) is placed in the `AbilityValues` sub-block, and override is written as top, the top-level writing method is **invalid** (sub-block takes precedence). During processing: Delete the top-level writing method in override, and process normally according to P1/P2/P3 in the `AbilityValues` sub-block. **No need to ask, deal with it directly**.

Determine each multi-level key in **Reference Complete Set** (including the difference set of "reference with override and without") in sequence:

1. **Equal values across all levels** → Do not write (P1 takes priority). Judgment criteria: Each reference level matches the corresponding addon level. If the reference has fewer levels, repeating its last value still matches every addon level (for example, refer to `20 20 20`, this addon MaxLevel=5 to supplement `20 20 20 20 20`, it is still the same value). **Note**: If the reference has only N levels and this addon MaxLevel > N, and the value of the additional level after extending by difference is different from the last reference level, it is an extension that needs to be written in override, **not the same value**.
2. **Constant single value** (the same number at all levels of this addon) → **Single token**, prohibited `n n n`
3. **Changes with level** → Number of tiers = valid MaxLevel; new tiers are extended according to adjacent differences

#### Numerical calculation

| situation                                                                                  | value processing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | end-of-line comments                                       |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Level expansion only                                                                       | The first few levels are the same as the reference, and the new levels are extended according to the difference                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `// 参考各档 延伸`                                         |
| Fixed difference                                                                           | Each tier = reference + N                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `// 参考各档 +N`                                           |
| Multiples                                                                                  | Refer to the Nth tier first and then multiply by the multiples                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `// 参考各档 xN` (the base number **must** be written out) |
| Custom key (reference has never been made, and there is `// 原版不存在，手动修改` comment) | Keep this addon value; MaxLevel extension must also be done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `// 原版不存在，手动修改`                                  |
| Reference None, and no above comments                                                      | Delete                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —                                                          |
| CD last level                                                                              | **Cap value**: basic ability 10s / ultimate 60s; refer to the minimum cooldown value in the tier `min`. <br>**Special rules for the ultimate**: If the reference min > 60s, **extend directly according to the original difference** (the last tier is not locked, the first tier is not adjusted), and there is no need to align the cap value. Example: Reference `100 90 80` (min=80 > 60), MaxLevel=4, last tier=70 → `100 90 80 70`. <br>**Basic ability/Ultimate min ≤ 60s**: The last tier lock is `max(min, cap)`, **Priority is given to maintaining the arithmetic sequence**. Steps: (1) Try to keep the reference first tier unchanged, new tolerance = `(last_level - reference_first_level) / (MaxLevel - 1)`; (2) If it cannot be divided evenly, **finely adjust the first tier** so that the tolerance is an integer and the last tier remains unchanged. <br>**CD numerical style**: Try to take integer multiples of 5 or 10 (such as 10, 15, 20, 25...). If the original difference is already a multiple of 5/10, extend it directly. Otherwise, round to the nearest integer to align the results. <br>**Scenario 1 · Ultimate min > 60, direct extension**: Reference `100 90 80`, MaxLevel=4 → `100 90 80 70`. <br>**Case 2 · The first tier remains unchanged, which is an integer tolerance**: Reference `22 18 14 10` (4 tiers, min=10), MaxLevel=5, extend the last tier 6 < 10 → last tier lock 10, (10-22)/4=-3 is evenly divisible → `22 19 16 13 10`. <br>**Case 3 · Adjust first tier to ensure integer tolerance**: Reference `20 17 14 11` (4 tiers, min=11), MaxLevel=5, extend 5th tier=8 < 10 → Last tier lock 10, keep first tier 20 (10-20)/4=-2.5 non-integer → Adjust first tier down to 18, tolerance -2 → `18 16 14 12 10`. | None                                                       |
| Insufficient CD tiers                                                                      | Keep the same grade difference and decrease to the reference last tier, such as reference `12 10 8 6` → `10 9 8 7 6`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | None                                                       |
| Percent key capping                                                                        | The key name ends with `_pct` (or other keys that clearly indicate the percentage): each level after extension must not exceed 100. If the reference maximum value > 50, the difference extension will exceed 100, then **rewrite the difference** so that the last tier is exactly equal to the reference maximum value (`max`), the difference = `(max - first_level) / (MaxLevel - 1)`, and each tier is evenly distributed; if it is not divisible, round up to the nearest integer. Example: Refer to `40 60 80 100`, MaxLevel=5, the last tier extension is 120 → change the difference value to 15 → `40 55 70 85 100`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `// 参考首档…末档 差值N`                                   |

#### Recalculate after version update (must be done when dealing with existing overrides)

When processing any ability that has an override record, **first check whether the reference base of all end-of-line comments is consistent with the current version**, and then execute P1/P2/P3:

> **When the annotation base = the current official value**: It means that the official version of this value has not been updated, no recalculation is required, the "Old version reference is missing" query is not triggered, the override existing value and annotation are directly retained, and the normal process of P1/P2 is continued.

1. annotation has a reference base (such as `// 15 30 45 60 x2`) and **reference base ≠ current official value**→ directly recalculate and write with the current version reference value according to the annotation rules, **no need to ask**
2. annotation has no reference base (only `// x2`) → directly recalculate and complete the annotation base according to the latest official value ×N, **no need to ask**
3. has no comment or `延伸` mark, and value is an extension of the official difference → automatically fill in the new file according to the official difference and write `延伸` comment, **no need to ask**
4. has no comment, and the value does not match the reference difference → **The official version has updated the value, directly synchronizes it to the latest official value and adds additional levels, no need to ask** (the old value is not retained, add `延伸` comment)

#### What to do when the old version reference is missing

trigger conditions (meet any one):

- The result after recalculation according to the comment rules does not match the existing value, and the old version reference does not exist (it is impossible to confirm whether the rules have changed)

**The following situations do not trigger inquiries and are handled directly according to P2 rules:**

- **No comment** → Regardless of whether the value is consistent with the reference, the latest official value will be synchronized directly without asking.
- **There are annotation rule marks (`xN`, `+N`, `差值N`, etc.), and the override value does not match the result of recalculation according to the current official value** → It is considered that the official version has updated the base, and the current official value is directly recalculated according to the annotation rules and written without asking.
- **The option is obviously only one reasonable way to deal with it** (such as deleting identical values, deleting non-compliant values without comments, P1 prohibited items) → deal with it directly, no need to ask

**Must use the `AskUserQuestion` tool to ask the user in the form of an option menu**, do not list A/B/C/D in words, and do not make assumptions.

**Query rules:**

- Each key to be decided is a separate question (`question` field), with a maximum of 4 questions in one batch; more than 4 keys will be asked in batches
- `header` Fill in the system key name (truncated to within 12 characters)
- `question` Description in Chinese: `「{技能中文名}」{中文属性名}（{系统键名}）：当前官方值 {参考值}，现有 override 值 {当前值}，原注释 {注释}。如何处理？` (**The Chinese name of the ability must be written at the beginning of the question** to facilitate users to distinguish which ability the attribute with the same name belongs to)
- `options` always provides the following options (select the relevant items according to the actual situation, irrelevant items can be omitted):
  - `× N 重算`: description Write down the specific candidate multiple and result (such as ×2 → result value); if the multiple is uncertain, use this option to let the user select Other to fill in, and then confirm with a separate question
  - `+ N 重算`: description Write the specific candidate difference and result
  - `纯等级扩展`: description writes the result value extended by the difference
  - `保留现有 value`: description Write the revised comment content
- If the multiple/difference requires a second confirmation (the user selected "×N" but did not specify N in the first round), initiate a second round of questions to list common multiple options
- ability Chinese name: directly use the comment above the ability block in the override file (such as `// 诅咒`); if there is no such ability block in the override, check `DOTA_Tooltip_ability_{ability_name}` from `docs/reference/{version}/abilities_schinese.txt` The Chinese name of the
- attribute is searched from `docs/reference/{version}/abilities_schinese.txt`: the value corresponding to `DOTA_Tooltip_ability_{ability_name}_{key_name}` (remove the colon at the end); if it cannot be found, use the system key name
- After the user selects, recalculate and update the value and comments according to his instructions.

### P3 comment format

Only write end-of-line comments if the override value is different from the reference. Format: `"本图值" // 参考值 [规则标记]`

| Scenario                             | Example                                              |
| ------------------------------------ | ---------------------------------------------------- |
| Single value comparison              | `"12" // 18`                                         |
| Multi-tier comparison                | `"90 80 70 60" // 150 130 110`                       |
| Pure level expansion                 | `"21 20 19 18 17" // 21 20 19 18 延伸`               |
| Multiples                            | `"30 60 90 120 150" // 15 30 45 60 x2`               |
| Fixed difference                     | `"300 500 700 900" // 200 400 600 800 +100`          |
| Change difference                    | `"3 3.5 4 4.5 5" // 3 4 5 6 差值0.5`                 |
| Reference value + design description | `"=0" // =1 移除 连环霜冻无限弹跳天赋`               |
| Pure design description              | `// 原版不存在，手动修改`, `// 百分比伤害，限制上限` |

**Rules:**

- `//` After **write the current reference official number** first, the magnification/delta override mark is placed **at the end**; after the reference value, **Chinese design instructions** can be followed to explain the intention, and the existing instructions should be retained
- multiple mark `x2` and so on **must** write the reference number at the same time, prohibited `// x2` no base number
- has the same value and does not occupy any pitfalls (`"30" // 30` → delete the entire row)
- Pure level expansion must be marked with `延伸`: only writing the reference value without marking indicates manual setting value, and the two cannot be mixed. The old row will only be replenished when it is changed this time, not the full amount.
- **Forbidden**: semicolon separated, lifestone/facet names
- Add reference to a non-existent key → end of line `// 中文原因`
- follows the existing comment style in the same file and hero section

---

## execution order (by hero)

1. **Scope**: Determine the ability list from the reference hero file (+`npc_heroes_custom.txt`)
2. **by ability**:
   a. Read the entire reference paragraph and list all multi-speed keys (complete set)
   b. Read the override ability block and mark the difference set (refer to whether there is override or not)
   c. **P1**: Delete the same value key + prohibited items
   d. **P2**: Handle delta override, expand additional levels, recalculate multiples/differences
   e. **P3**: Verification comment format
3. **Self-test**:
   - [ ] No copying of the same value, no identical token, multiple rows, single token for constant value
   - [ ] None `special_bonus_facet_*`, None `CalculateSpellDamageTooltip`
   - [ ] No key that no longer exists in the reference (including the renamed key as old `foo_tooltip` → new `foo`)
   - [ ] MaxLevel extended scanned reference full text including difference set (top of block + sub-block + top tile)
   - [ ] Percent key (`_pct`, etc.): Each level does not exceed 100; when the reference maximum value > 50, the difference cap has been rewritten
   - [ ] Annotated key: the reference base is consistent with the current version, the rule mark is consistent with the value recalculation result
   - [ ] `延伸` mark and uncommented key: value are completely consistent with the reference difference extension; the pure extension lines changed this time all have the `延伸` mark After
4. all heroes are processed, call `update-heroes-custom` to verify Bot.Build compliance one by one for the heroes modified this time (there is no Bot.Build when the hero is not in `npc_heroes_custom.txt`, skip it).
