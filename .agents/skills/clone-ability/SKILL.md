---
name: clone-ability
description: "Create or repair delta clones of vanilla Dota abilities using the original ability as BaseClass. Use for vanilla-based custom abilities; use custom-ability for new implementations and awaken-ability for awakening slot replacements."
---

# Custom inheritance ability (new/modified)

Clone vanilla Dota ability (innate or normal) into a custom ability name, write this addon KV and complete the localization. For the reference file path of

> , see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference", and for the ability system name search rules, see `.agents/docs/dota-references.md`.

---

## Step 1: Parse ability input

is processed according to `.agents/docs/dota-references.md` rules (supports system name/Chinese name/hero name-ability name).

---

## Step 1 B: Existence detection (automatically determines the mode and target file) After

parses out the custom ability name (such as `xxx2`), **immediately** search for the ability name in the two target files:

```
Grep pattern: "crystal_maiden_glacial_guard2" (replace with actual ability_name)
files:
  - game/scripts/npc/npc_abilities_custom_lottery.txt
  - game/scripts/npc/npc_abilities_custom.txt
```

According to search results:

| Situation                  | Processing                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **Only found in one file** | Automatically determine target file = this file; Operation mode = **Correction**; Skip the second step and go directly to the third step |
| **Found in Both Files**    | Use `AskUserQuestion` to ask the user which file to select; Operation Mode = **Fixed**                                                   |
| **Neither file was found** | Continue to the second step of pre-interaction (ask for the target file; the operation mode defaults to **New**)                         | When |

> discovers that ability already exists, it informs the user: "`<ability_name>` has been found in `<file_name>` and enters correction mode."

---

## Step 2: Pre-interaction (only executed when ability does not exist)

### 2-A target file (asked when the user does not specify)

> "Please select the target file"

| Options                    | File                                                | Description                     |
| -------------------------- | --------------------------------------------------- | ------------------------------- |
| lottery poolability        | `game/scripts/npc/npc_abilities_custom_lottery.txt` | Random lottery system           |
| Unit/hero specific ability | `game/scripts/npc/npc_abilities_custom.txt`         | Specific units or custom heroes |

### 2-B-extra KV insertion position (`npc_abilities_custom_lottery.txt`)

There are three areas in this file. The new ability block must be inserted at the end of the corresponding area (immediately before the delimiting comment of the next area):

| Region                 | Location Flag                                                                | Applicability                                                 |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Innate ability         | `// Innate 天赋 技能` (line 5) to `// 普通升级 技能` before the divider line | All custom abilities cloned from innate abilities (process A) |
| Normal upgrade ability | `// 普通升级 技能` to `// lua 技能` before the divider line                  | Custom ability cloned from normal ability (process B)         |
| lua ability            | `// lua 技能` to the end of the file before `}`                              | Custom ability implemented in pure lua                        |

> Use `grep -n "^//"` to quickly locate the line numbers in the three areas.

### 2-B operating mode

New mode (default when ability does not exist); if the user explicitly specifies "correction" in the command, it will be changed to correction mode.

---

## Step 3: BaseClass type check

reads `BaseClass` of the **target ability block** (read the vanilla name when creating a new one; read the existing block when modifying):

| BaseClass value                                             | Processing                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| vanilla ability name (such as `dragon_knight_dragon_blood`) | Continue                                                                                                                 |
| `ability_datadriven`                                        | **Stop**: This ability is not inherited from vanilla, it is self-made from scratch → transfer to `custom-ability` skill. |
| `ability_lua`                                               | **Stop**: This ability is not inherited from vanilla, it is self-made from scratch → transfer to `custom-ability` skill. |

---

## Step 4: Read vanilla KV and merge with Override

**When creating a new ability**, KV basic source = vanilla + Override superposition:

1. reads the vanilla ability block from `docs/reference/<version>/npc_abilities.txt` (or corresponding hero file)
2. Find the ability block with the same name in `game/scripts/npc/npc_abilities_override.txt`:
   - If it exists, superimpose the **additional settings** (different keys/values from vanilla) in override to vanilla. Keys that exist in
   - Override but not in vanilla (marked `// 原版不存在，手动修改`) also need to be copied
3. merge the results as the initial KV of the new custom ability

**When correcting the existing ability**, skip this step and go directly to the sixth step of K key synchronization.

> **`dynamic_value` processing rules**: The sub-block containing `hero_levelup` (`hero_levelup` will no longer take effect after cloning) needs to be removed in its entirety and the value expanded to multiple levels. However, fields used for **tooltip dynamic display** (such as `current_slow_resistance`, `current_aoe`, `attack_speed_tooltip`, etc.) must retain their `dynamic_value` sub-blocks, which the engine relies on to calculate and display real-time values.

> **`affected_by_aoe_increase` processing rules**: The vanilla sub-block contains fields of `affected_by_aoe_increase "1"` (such as `radius`), which **cannot** be written in single-value form. They must be retained as sub-blocks and explicitly written to `affected_by_aoe_increase "1"`, otherwise the AOE gain will be invalid for this field.

---

## Step 5: Identify the vanilla ability type

is judged in the merged KV:

| Field                             | Judgment Result                                               |
| --------------------------------- | ------------------------------------------------------------- |
| `"Innate" "1"`                    | **Innate ability**, follow process A or process C (see below) |
| `"Innate" "0"` or no Innate field | **Normal ability**, go to process B                           |
| Unable to determine               | Ask user with `AskUserQuestion`                               |

### Innate ability: Choose process A or process C

For innate ability, **give priority to process C** (join lottery pool directly with vanilla name):

| Conditions                                                                                                                                | Recommended process                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| vanilla `AbilityBehavior` only contains `HIDDEN` (can be displayed and effective normally after being removed)                            | **Process C** — override to HIDDEN, vanilla name directly into the pool |
| Need to change value / multi-level growth / behavior adjustment (such as removing `NOT_LEARNABLE`, adding `UNIT_TARGET` attributes, etc.) | **Process A** — Clone to a custom ability name                          |

---

## Step 6: KV processing

### Process A — Innate ability (vanilla Innate "1")

1. is based on the merging result of the fourth step and uses a new key (such as `xxx2`) to write the target file.
2. `"BaseClass"` → Fill in the vanilla ability name.
3. `"Innate"` → changed to `"0"` (**required**, otherwise the engine will still process it innately).
4. `"AbilityBehavior"` → Remove `DOTA_ABILITY_BEHAVIOR_HIDDEN`; change to `"DOTA_ABILITY_BEHAVIOR_PASSIVE"` when using passive for lottery; keep active/switch and crop according to vanilla behavior to ensure that there are no signs such as `NOT_LEARNABLE` that prevent the display.
   - **If the result contains `UNIT_TARGET`**: Must **explicitly write** `AbilityUnitTargetTeam`, `AbilityUnitTargetType`, `AbilityCastRange` in the same block (cannot rely on BaseClass inheritance, otherwise the engine cannot select the target). Explicitly write `SpellImmunityType`, `SpellDispellableType`, `AbilityCastPoint`, `AbilityCooldown`, `AbilityManaCost` at the same time.
   - **If vanilla contains `IsGrantedByShard "1"` or `HasShardUpgrade "1"`**: The custom block must be overwritten as `"0"` to avoid the engine misjudging that crystal fragments are needed to be used.
5. `"AbilityValues"` → Copy fields and subkeys, but **exclude the following** (consistent with `update-abilities-override` P1 absolute prohibitions): The
   - sub-block contains the row of `special_bonus_unique_*` / `special_bonus_facet_*` → delete the row directly (the talent refers to the vanilla ability name, which is invalid for custom abilities)
   - After deleting the talent row, if the `value` of the sub-block is `"0"` and there are no other valid sub-keys → delete the entire sub-block
   - sub-block contains `special_bonus_scepter` / `special_bonus_shard` → Same as above
   - **The sub-block contains `hero_levelup` → must be removed** (`hero_levelup` sometimes does not take effect after cloning the innate ability). After removal, the value is expanded to multiple levels according to the following rules:
     1. Set `MaxLevel` to `"5"`
     2. Calculate the level 5 target value ≈ `base + 49 × hero_levelupstep` (corresponding to the value at vanilla level 50)
     3. takes 5 equal steps between `[base, target_value]`, rounding to make the sequence look good (priority 0.5 / integer step size)
     4. The remaining fields are determined by judgment whether to expand: only values with growth significance are expanded to level 5; fixed mechanism values (angle, magnification coefficient, etc.) remain single values. Expansion principle: Use **Level 3 ≈ original single value** as the anchor point, extend up and down equally, and round to make the sequence look good.

   Use `//` to mark the vanilla value on the right side of each remaining value (multi-level whole string comparison).

6. `"AbilityTextureName"` → Required; refer to vanilla resources or the same hero persona path.
7. Only supplements other keys (`MaxLevel`, `AbilityUnitDamageType`, etc.) when required by the mechanism; keys that are still read by Lua are not deleted.

### Process B - Normal ability (vanilla Innate "0" or none)

1. Based on the merge result of step 4, write the target file using the new key.
2. `"BaseClass"` → Fill in the vanilla ability name.
3. `"Innate"` → No need to write (normal ability defaults to 0).
4. `"AbilityBehavior"` → Keep vanilla behavior as needed; if it is used for lottery and has active ability, confirm that there is no need to adjust the behavior.
   - **If the result contains `UNIT_TARGET`**: Same as step 4 of process A, the target team/type/range and other casting attributes must be explicitly written.
   - **If vanilla contains `IsGrantedByShard "1"` or `HasShardUpgrade "1"`**: Same as step 4 of process A, the custom block must be overwritten as `"0"`.
5. `"AbilityValues"` → Same as step 5 of process A.
6. `"AbilityTextureName"` → Required.
7. Same as step 7 of process A.

### Process C — vanilla innate ability is directly put into the pool (go to HIDDEN override)

Applicable conditions: vanilla ability includes `DOTA_ABILITY_BEHAVIOR_HIDDEN`. After removing this mark, it can be displayed and effective normally without changing the value or behavior.

1. Add (or update) a block for the vanilla ability name in `game/scripts/npc/npc_abilities_override.txt`, writing the following two keys:
   - `AbilityBehavior`: Remove `DOTA_ABILITY_BEHAVIOR_HIDDEN` and leave the remaining behavior flags intact.
   - `IsOnCastBar "1"`: Make sure ability is shown on the cast bar.
2. **does not** create any new KV blocks in `npc_abilities_custom_lottery.txt`.
3. **does** not add any new entries in the localization file (vanilla localization has overridden it).
4. directly joins the `// 被动技能` area of ​​the corresponding tier with the **vanilla ability name** in `lottery-abilities.ts` (not the "custom ability" area).

---

## Step 7: Correction mode - K key synchronization vanilla

Perform this step only when correcting existing capabilities. The rules are the same as P1 of `update-abilities-override`:

1. reads the complete key set of the current version of vanilla from `docs/reference/<version>/npc_abilities.txt`
2. **Delete** the keys in the existing custom block that have the same value as vanilla\*\* (vanilla will automatically inherit when merging, no need to write again)
3. **Delete** vanilla keys that no longer exist (unless `// 原版不存在，手动修改` is explicitly commented at the end of the line)
4. **Supplement** Keys that are missing in the custom block but required for normal operation of ability (including: multi-level numerical keys, `AbilityUnitTargetTeam`/`AbilityUnitTargetType`/`AbilityCastRange` and other casting attributes, `SpellImmunityType`, `SpellDispellableType`, etc.)
5. Combined with override overlay logic: if the vanilla key value has been modified by override, the override value will be used synchronously

---

## Step 8: Localization

1. Use the Grep tool to search for all Tooltip keys with vanilla ability names:
   ```
   pattern: DOTA_Tooltip_ability_<vanilla_name>
   file: docs/reference/<version>/abilities_english.txt
   file: docs/reference/<version>/abilities_schinese.txt
   ```
2. Replace the vanilla ability name in the key name with the custom ability name, and the value remains consistent with vanilla.
3. contains at least: `DOTA_Tooltip_ability_<name>`, `_Description`, and the `_<suffix>` line corresponding to `%variable_name%` in the description.
4. writes `game/resource/addon_english.txt` and `addon_schinese.txt` synchronously, following the indentation and tab rules of localization-format-guide. Add the `// 英雄名 技能名` comment before each set of ability entries, and leave a blank line after the entry; the comment contents of the two files are **identical** (both use Chinese comments).
5. can skip the `Facet_` entry when the vanilla Facet localization text key is not used.

---

## Optional: Lottery and Bot registration If the ability

enters the lottery pool, add a new ability name to `src/vscripts/modules/lottery/lottery-abilities.ts` (and `lottery-abilities-bot.ts` if necessary). The tier and comment style should be consistent with the existing entries.

---

## Reference Example

`npc_abilities_custom_lottery.txt` in `dragon_knight_dragon_blood2` (innate → ordinary, process A); localization searches for the same name in `addon_english.txt` / `addon_schinese.txt`.

---

## Self-check list

- [ ] ability system name has been correctly parsed (Chinese/hero name-ability name format has been converted)
- [ ] BaseClass is the vanilla ability name (not `ability_lua` / `ability_datadriven`)
- [ ] Override additional settings have been superimposed when creating a new creation.
- [ ] Process A: `"Innate" "0"` and `AbilityBehavior` without `HIDDEN`
- [ ] Process B: Innate fields are processed on demand, Behavior is consistent with vanilla
- [ ] `AbilityValues` has been excluded. `special_bonus_unique_*` / `special_bonus_facet_*` / `special_bonus_scepter` / `special_bonus_shard` talent reference lines; after deleting the talent line, the sub-block with value "0" has been deleted in its entirety.
- [ ] Process A: If vanilla contains `hero_levelup`, it has been removed and expanded to 5-level multi-level (level 5 ≈ vanilla lv50 value, arithmetic rounding; other fields suitable for growth use level 3 ≈ original value as the anchor point to extend upward and downward arithmetic, and the fixed mechanism value remains a single value)
- [ ] `AbilityValues` All coverage items `//` vanilla control
- [ ] `AbilityTextureName` Filled out
- [ ] If `AbilityBehavior` contains `UNIT_TARGET`: explicitly written `AbilityUnitTargetTeam`, `AbilityUnitTargetType`, `AbilityCastRange`, `SpellImmunityType`, `SpellDispellableType`, `AbilityCastPoint`, `AbilityCooldown`, `AbilityManaCost`
- [ ] If vanilla contains `IsGrantedByShard "1"` or `HasShardUpgrade "1"`: the custom block has been overwritten as `"0"`
- [ ] Correction mode: vanilla synchronization K key has been pressed (delete same value, delete obsolete keys, add new keys)
- [ ] `addon_english.txt` is consistent with `addon_schinese.txt` key set, and the placeholder is consistent with vanilla
- [ ] If you enter the lottery pool, the lottery TS list has been changed
- [ ] Process C: Remove `HIDDEN` in override (the remaining behavior is retained) and add `IsOnCastBar "1"`; the vanilla name is directly written into the lottery TS `// 被动技能` area; no need to create a new KV block or localization entry
