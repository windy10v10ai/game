# Localization File Format Guide

## Overview

This document records the format requirements, synchronization specifications and maintenance strategies of three localized files: `game/resource/addon_schinese.txt`, `addon_english.txt`, and `addon_russian.txt`. The

language file is located at `game/resource/` and uses Valve's KeyValues ​​format.

## format requirements

### 1. Indentation and alignment

- **Use two tabs for indentation**
- **Use multiple tabs to align key names and values** so that all values start from the same position
- **Empty lines remain consistent**

**Example**:

```
		// item_beast_armor beast armor
		"DOTA_Tooltip_Ability_item_beast_armor"											"兽化甲"
		"DOTA_Tooltip_ability_item_beast_armor_Description"								"<h1>主动：不粘锅</h1>..."
		"DOTA_Tooltip_ability_item_beast_armor_Lore"									"集四大神器之力于一身的终极护甲..."
		"DOTA_Tooltip_ability_item_beast_armor_bonus_strength"							"+$all"
		"DOTA_Tooltip_ability_item_beast_armor_bonus_health"							"+$health"
```

### 2. Comment format

- **Comments are in Chinese and not translated**
- **The comments in the three language files must be completely consistent** (copy the Chinese comments directly to the English and Russian files)
- Format: `// item_name 中文名称`

### 3. Synchronize HTML tags

description text must be consistent across the three language versions:

#### newline character rule

- **Use `\n` to separate different `<h1>` header sections**
- **Use `<br><br>` for line breaks within paragraphs**

**When an item has both active and passive**, use `\n` (or `\n\n` if the content is long) to separate the two `<h1>` paragraphs. **Do not** use `<br><br>` to connect - the `<br>` series only uses line breaks within the same paragraph. Refer to the existing writing method:

```
"<h1>主动：伤害反弹</h1>...伤害提升%active_reflection_pct%%%。\n<h1>被动：伤害反弹</h1>...反弹%passive_reflection_constant%..."
```

(`item_blade_mail_2`, `item_sphere_2`, etc. are all based on this convention, and the delimiters of the three language versions must be consistent)

#### label usage specifications

- `<h1>标题</h1>` - for main titles (active, passive, etc.)
- `<br>` or `<br><br>` - used for line breaks within paragraphs
- `\n` - used to separate different main sections
- `<font color='#RRGGBB'>文本</font>` - for color text

#### color code specification

- **uppercase and lowercase is not enforced**, but the letters within the same color value must be in the same case (such as `#A74BD1` or `#a74bd1`, not mixed letters like `#A74Bd1`)

#### Common terms and color comparison (refer to the official Chinese localization summary)

Source: `docs/reference/<version>/abilities_schinese.txt` The official coloring convention for high-frequency status words, as well as the damage type coloring convention used by localization texts in the project (Lina talent, Artoria series ability, etc.), are summarized from high-frequency usage (non-exhaustive). When the newly added ability/item description encounters the following words, the corresponding color will be used first to maintain consistency with the official visual language. **Official English texts usually do not add color to these words**. According to the existing rules, the trilingual tags of this project still need to be consistent (see "HTML tag synchronization" above).

| Chinese terminology                                  | English                             | Color                                            | Remarks                                                                                                                                                                           |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure Damage                                          | `#FFE56E`                           | Gold, the project has an agreement               |
| Magic Damage                                         | `#05CAFF`                           | Blue, project agreement                          |
| Stun / Stun                                          | Stun                                | `#2DD5E4`                                        | Highest frequency status color                                                                                                                                                    |
| Silence                                              | Silence                             | `#6DB6E9`                                        | Spellcasting prohibited                                                                                                                                                           |
| Disarm                                               | Disarm                              | `#AFB912`                                        | Disable basic attacks                                                                                                                                                             |
| Locked                                               | Muted (item)                        | `#C3E1DB`                                        | The use of item is prohibited, often used in conjunction with the silence/disarm three-piece set (such as sorcery, silence)                                                       |
| Break                                                | `#DD621E`                           | Disable passive ability                          |
| Debuff Immunity                                      | `#D76907`                           |                                                  |
| Status Resistance                                    | `#B99012`                           |                                                  |
| Slow Resistance                                      | Slow Resistance                     | `#9EC8E3`                                        |                                                                                                                                                                                   |
| Stealth / Stealth                                    | Invisible                           | `#D7CCC7`                                        |                                                                                                                                                                                   |
| Fear                                                 | Fear                                | `#1EDDB7`                                        |                                                                                                                                                                                   |
| Nothingness                                          | Ethereal                            | `#57E550`                                        | Unable to attack/be attacked, magic damage received increased                                                                                                                     |
| Restraint                                            | Leash                               | `#E3D59E`                                        | Containment effect that will be interrupted when exceeding the range                                                                                                              |
| Entangle                                             | `#CAE96D`                           | Rooting Confinement                              |
| Phased                                               | `#9019E3`                           | Ignores unit collision and cannot be slowed down |
| Treatment / Recovery                                 | Heal                                | `#07D738`                                        |                                                                                                                                                                                   |
| Range                                                | AoE / Radius                        | `#C450E5`                                        |                                                                                                                                                                                   |
| Shield (universal/full damage)                       | Shield / Barrier                    | `#B97812`                                        | Absorb any type of damage                                                                                                                                                         |
| Physical Damage Barrier                              | `#B94512`                           | Only absorbs physical damage                     |
| Magic Damage Barrier / Spell Shield                  | Magic Damage Barrier / Spell Shield | `#1278B9`                                        | Absorbs magic damage only                                                                                                                                                         |
| Aghanim's Scepter / Shard                            | `#92ACF5`                           |                                                  |
| Red emphasis (warning or negative attribute changes) | —                                   | `#E03E2E`                                        | Used for warning localization text such as "cannot be discarded/cannot be destroyed", or numerical emphasis when attributes such as attack power and armor are reduced            |
| Gray supplementary instructions                      | —                                   | `#7D7D7D`                                        | Supplementary instructions in parentheses, such as "(valid for remote only)"                                                                                                      |
| Autocast / Autocast                                  | Autocast                            | `#00CED1`                                        | Turquoise, marked autocast effect description paragraph (red `#FF0000` was used in the project, but has been changed to this color to avoid confusion with warning red semantics) |
| awakening strengthening                              | Awakening Bonus                     | `#d000ff`                                        | Purple, the same color as the awakening mark of the ability title, marking the newly added/enhanced effect paragraph after awakening                                              |

**"Title: Description" peer format**: `自动施法：`, `觉醒强化：`. The titles of such paragraphs are uniformly written as `<font color='#颜色'>标题：</font>紧跟说明文字` (the title and colon are included in the font tag, and the description text is outside the tag and on the same line). Do not let the title occupy a separate line and then change the line to add the description - Reference How to write `elder_titan_ancestral_spirit_awaken`, `special_bonus_unique_bristleback_upgrade`.

#### Commonly used wording comparison

- **Superposition method of reducing magic resistance**: Instead of writing "(fixed value)", write "(subtractive superposition)" (English `(flat)` → `(additive)`). This is the standard way of distinguishing "subtractive superposition vs multiplicative superposition" in Dota terminology, which is more accurate than "fixed value"
- **Full attribute sum class description**: Write `[自身属性总和]` in Chinese, do not write `[你的全属性]`, align with the English fixed writing `the sum of all your attributes`
- **"Various casting" and "automatic casting" are two different Dota mechanisms, do not mix them**: "Various casting" means that the same ability has multiple casting methods that can be switched (such as point target/point ground in Thrall magma flow), "autocast" refers to the automatic triggering of switch-type passive detection (corresponding to `AbilityBehavior` `DOTA_ABILITY_BEHAVIOR_AUTOCAST`, such as Mana Shield, Painful Lash). When ability actually performs the `AUTOCAST` behavior, it must be written as "automatic casting." You cannot use the term "diverse casting" just because the effect has the look and feel of "switching to another style of play."

### 4. Complete Modifier description

All item and ability modifiers must contain complete descriptions:

```
		"DOTA_Tooltip_modifier_item_name_active"										"状态名称"
		"DOTA_Tooltip_modifier_item_name_active_Description"							"状态描述"

		"DOTA_Tooltip_modifier_item_name_debuff"										"Debuff名称"
		"DOTA_Tooltip_modifier_item_name_debuff_Description"							"Debuff描述"

		"DOTA_Tooltip_modifier_item_name_aura"											"Aura名称"
		"DOTA_Tooltip_modifier_item_name_aura_Description"								"Aura描述"
```

**modifier's `_Description` needs to write the ability effect itself, not just the current value** - players often click on the buff icon to confirm what this effect does. Write the content as ability `_Description`, and then add the current cumulative/dynamic value at the end.

**The value displayed by **ability in "separate line" must be filled back in the modifier body\*\* - the modifier has only one body text and no value panel. The value displayed by the `_xxx` label line on the ability side will not appear on the modifier. Such values ​​must be inlined into the modifier text as `%dMODIFIER_PROPERTY_TOOLTIP%` / `%dMODIFIER_PROPERTY_TOOLTIP2%` (each modifier has a maximum of two, and any excess should be summarized in text or split into multiple modifiers). Variable usage in

#### Modifier description

Modifier description, using the `%dMODIFIER_PROPERTY_XXX%` format:

```
"移动速度降低%dMODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE%%%，攻击速度降低%dMODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT%"
```

** Pitfall: `%key%` refers to the ability itself. `AbilityValues` does not take effect in the modifier** - `%dMODIFIER_PROPERTY_XXX%` works because it reads the `Properties` value declared by the modifier's own KV; it directly copies the `%splinter_targets%` in the ability description. etc., the writing method of quoting the ability `AbilityValues` field will not take effect for the `ability_lua`/pure script ability modifier (without the KV `Properties` block), and will display blank or swallow the percent sign. The description of the ability itself is not affected, and `%key%` can still be used normally.

**modifier If you want to display custom dynamic values ​​(non-standard MODIFIER_PROPERTY enumeration), use `MODIFIER_PROPERTY_TOOLTIP`**: only valid for Lua/TS script class modifier (DataDriven modifier has no script to implement, and can only hard-code numbers). In the modifier script, add `DeclareFunctions` to `MODIFIER_PROPERTY_TOOLTIP` (TS writes `ModifierFunction.TOOLTIP`) to implement `OnTooltip(): number` to return the target value (such as `GetSpecialValueFor` that reads ability), and use `%dMODIFIER_PROPERTY_TOOLTIP%` for localization. The same modifier can have up to two dynamic values, and the second one uses `MODIFIER_PROPERTY_TOOLTIP2`/`OnTooltip2`/`%dMODIFIER_PROPERTY_TOOLTIP2%`. When the value changes with level/talent, this will be used first instead of writing to death (actual test: The probability of awakening splitting of the Drow Ranger Shadow Arrow will be increased by the talent, so this mechanism is used instead of writing to death). Only truly fixed values ​​are hard-coded. ** Pitfall: `GetSpecialValueFor` cannot be adjusted in `OnTooltip` / `OnTooltip2`**——The tooltip is rendered on the client side, and the ability to get `AbilityValues` on the client side will fail. The entire `%dMODIFIER_PROPERTY_TOOLTIP%` placeholder is swallowed, and only the remaining percent signs remain in the text. The correct approach is to cache the value into the instance field in `OnCreated` / `OnRefresh` (**put before `if (!IsServer()) return;`**), and `OnTooltip` only returns this field (refer to `refreshValues` of `windrunner_whirlwind_custom.ts`).

**`%dMODIFIER_PROPERTY_TOOLTIP%` will not automatically include white bold** (different from ability `%key%`, confirmed by actual testing). `<font color='#FFFFFF'><b>...</b></font>` needs to be included manually, which is treated the same as hard-coding the value.

### 5. AbilityValues numerical display method

A `AbilityValues` value can only be displayed in one way. Do not write it in both places:

- **Inline in Description/Note body**: Use `%xxx%` to embed directly into the sentence without additional definition of `_xxx` tag line
- **On a separate line**: Define the `_xxx` label line (such as `"DOTA_Tooltip_ability_xxx_search_radius" "SEARCH RADIUS:"`), and `%xxx%` will no longer be repeated in the text.

**Multiple associated values** (several tiers/fields under the same mechanism, such as duration, times per second, reduction range) are recommended to be placed in separate lines to facilitate player comparison one by one in the value panel. **Isolated single value** (only affects one place and is not systematic) Both methods can be used. Choose whichever is more smooth and easy to read, but the same value should not be both inline and on a separate line - otherwise the text will appear repetitive.

## trilingual version synchronization requirements

### 1. Format consistency

- **All formats must be exactly the same** (indentation, alignment, blank lines)
- English and Russian versions should be aligned strictly according to the format of the Chinese version
- **Key sequence is consistent**: The same set of keys is located in the corresponding module in the three files and is arranged in the same order.

### 2. Content integrity

- **All entries must exist in both trilingual versions**
- When adding a new entry, it must be added to three files at the same time
- When deleting an entry, it must be deleted in three files at the same time

### 3. The content must be completely consistent

- **Key name**: must be exactly the same
- **Tab format**: indentation and alignment must be exactly the same
- **HTML tag**: position and format must be exactly the same
- **Value placeholder**: `%xxx%%%` format must be exactly the same
- **Note**: The content of the note must be exactly the same (use Chinese)

### 4. Translation text requirements

- **Just keep the meaning of the translated text roughly the same**, no word-for-word translation is required
- But the core meaning and functional description must be kept accurate

### 5. Item correspondence check list

- [ ] The comment format is consistent (use Chinese)
- [ ] All entries exist
- [ ] HTML tag format is consistent (especially the use of `\n` and `<br>`)
- [ ] The same color code and the same color value have the same internal case.
- [ ] Tab aligned
- [ ] The blank lines are in the same position
- [ ] The numerical placeholder format is the same

## Maintenance Precautions

1. Every time a localization file is modified, the format and alignment must be checked at the same time
2. When adding new entries, ensure that the format conforms to the specifications
3. When synchronizing the trilingual version, not only the content but also the format must be synchronized
4. Check before submission: Check for format errors
5. Avoid using TODO Note: All entries should be completed completely

## Language file maintenance strategy

- **Chinese (`addon_schinese.txt`)**: Must be maintained - add all new keys
- **English (`addon_english.txt`)**: Must be maintained - add all new keys
- **Russian (`addon_russian.txt`)**: Must maintain - all keys (no distinction between UI and ability/item). The missing Russian keys in the stock will be gradually filled, and no one-time full complement will be made: when changing a certain ability/item/UI module, all the keys of the item (including modifiers and items of the same series) will be filled in together; the existing Russian keys will be retained and updated simultaneously with Chinese and English, and shall not be deleted.

## Add new localization key

1. added to Chinese file (`addon_schinese.txt`)
2. added to English file (`addon_english.txt`)
3. is added to the Russian file (`addon_russian.txt`), consistent with the key sequence and comments of the Chinese file
4. When the changed entry is originally missing in Russian, all keys of the entry must be filled in together; the existing Russian must be modified or deleted simultaneously with Chinese and English.

## Chinese punctuation mark specification

**Important**: Chinese localized text must use full-width punctuation (`，` `。` `：` `？` `！`), do not use half-width punctuation (`,` `.` `:` `?` `!`).

## Find Dota 2 official ability name

When adding a Dota 2 ability that does not exist in the project language file, look for the official translation from the reference file (see the original document for an example path).

## General rules for localization

Try to use standard universal variable translations (such as `$damage`, `$all`, etc.) instead of direct text.

## is used in the code

```xml
<Label text="#my_new_key" />
```

```javascript
$.Localize("#my_new_key");
```

## file format

- Format: Valve KeyValues
- Encoding: UTF-8 No BOM
- End of line: CRLF

## related documents

- `game/resource/addon_schinese.txt`
- `game/resource/addon_english.txt`
- `game/resource/addon_russian.txt`
