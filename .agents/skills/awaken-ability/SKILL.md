---
name: awaken-ability
description: "Create or modify awakened hero abilities that replace ability slots through awakening stones. Use for awakening enhancements; use clone-ability for vanilla delta clones and custom-ability for new abilities."
---

# Awaken Ability

awakening = The player uses awakening stones to transform the ability gauge of the designated hero. The configuration table + replacement algorithm is a pure TSTL module. Adding an awakening usually only changes the configuration + supplements the ability assets.

## architecture (three files)

| Documents                                          | Responsibilities                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/vscripts/modules/awaken/awaken-config.ts`     | `ABILITY_REPLACEMENTS` configuration table + `AbilityReplacement` interface. **Add awakening to change here**                                                                          |
| `src/vscripts/modules/awaken/awaken-replacer.ts`   | Replacement algorithm `executeReplacement` (three branches are added/replaced/inserted, with idempotent guards at the entrance); external `applyAwakenByHero`/`canAwaken`/`isAwakened` |
| `src/vscripts/items/ts_items/item_awaken_stone.ts` | awakening stone. `OnSpellStart` adjusts `applyAwakenByHero`, and `UTIL_Remove` succeeds; use `CastFilterResult`+`GetCustomCastError` to float the word "not supported/awakening"       |

## Three replacement operations

Each configuration entry records the awakening of a hero. The three operations are determined by field combinations:

| Operation   | Meaning                                                                                                 | Field                          |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **New**     | Add new ability directly, leaving the original ability unchanged                                        | Just fill in `newAbility`      |
| **Replace** | Remove an old ability and add a new ability (synchronize the learned level, no points will be refunded) | `targetAbility` + `newAbility` |
| **Insert**  | Insert a new ability into the specified slot, and the original ability retention level is added back    | `targetSlot` + `newAbility`    |

`AbilityReplacement` field:

- `heroName`: applicable hero (`npc_dota_hero_xxx`)
- `targetAbility?` / `targetSlot?`: Replace the target ability name or insert into the slot (choose one of the two; fill neither = pure new addition)
- `newAbility`: New ability name after awakening
- `newLevel`: Initial level of new ability. Use it in the replacement branch `newLevel > 0`, otherwise the original ability and learned level will be used.
- `inheritLevelFrom?`: See "Advanced 1" When

> `targetSlot` hits `generic_hidden` (empty slot), replacement is performed instead of insertion.

## Selection: First decide which implementation to use

Before taking action, first decide whether this awakening **only changes the value** or **requires new behavior**. Choosing the wrong one will bring a lot of unnecessary KV copying and the risk of hardcode failure.

| awakening content                                          | Practice                                                                                                                                                                                                                                           | Reference                                                                              |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Only change the value (damage/range/continuous/cooling...) | **The original ability remains unchanged**, add the `special_bonus_unique_<hero>_awaken` bonus line to the original ability value block of `npc_abilities_override.txt`; awakening sends a hidden passive as a trigger (purely new, `newLevel: 1`) | `special_bonus_unique_bristleback_upgrade`, `special_bonus_unique_monkey_king_upgrade` |
| New mechanism not found in vanilla                         | `ability_lua` New ability + TS implementation, pure new addition does not occupy the original slot                                                                                                                                                 | `special_bonus_unique_underlord_demons_reach_awaken`                                   |
| Add automatic spellcasting to the original ability         | `ability_lua` shell ability + `AUTOCAST`, replace the original ability with `targetAbility` to occupy the **original slot**; the original ability is hidden and retained, and the shell ability adjusts its `OnSpellStart()`                       | `elder_titan_ancestral_spirit_awaken`, `beastmaster_wild_axes_awaken`                  |

**It is forbidden to clone vanilla ability in order to change the value** (`BaseClass` fill in the vanilla ability name). `BaseClass` only inherits the code class, **does not inherit KV**: the clone block must copy the entire field of vanilla + override, and if a field is missing, the engine will use it as 0; the ability has also changed its name, and the hardcode linkage (A rod grant, broken crystal upgrade, and other abilities that add layers to it) that the engine searches for according to the original name will fail silently. One line of special bonus is enough for numerical bonus, and all these costs do not exist.

### special bonus bonus line

Add a line to the value block of the original ability of `npc_abilities_override.txt`. `+N` is the increment and `=N` is the coverage: When

```
"damage_amp"
{
	"value"										"5 6 7 8 9"
	"special_bonus_unique_beastmaster_awaken"	"+10"
}
```

vanilla is a flat value (`"heal_pct" "20"`), `value` must be written together when rewritten into a block, otherwise the original value will be lost; when vanilla is already a block, only add the bonus line, and do not repeat `value`. The

trigger uses an independent hidden passive (`ability_datadriven` + `PASSIVE | HIDDEN` + `MaxLevel 1`). **Do not take the shell ability concurrently** - the shell ability level will increase points according to the player. If you have not learned it, it will be level 0. `special_bonus` will not take effect.

### shell ability

shell ability is responsible for the cooling and mana consumption, and the KV must be written in full (including the talent reference line of `AbilityCooldown`). **Do not** overwrite `GetCooldown` / `GetManaCost` in TS and forward it to the native ability: that is a server-side hook. The client-side ability panel directly reads KV and does not run this Lua, and the panel will display 0.

## Steps to add a new awakening

### 1) Configuration

Add `ABILITY_REPLACEMENTS` to `awaken-config.ts`. Minimum form (purely new passive):

```ts
{
  heroName: 'npc_dota_hero_xxx',
  newAbility: 'special_bonus_unique_xxx_upgrade',
  newLevel: 1,
},
```

> **Note only write the hero name** (such as `// 齐天大圣 觉醒`), **Do not** list the ability effects/values that will change with the version. Effect descriptions belong to localization text and should not be scattered in configuration comments. Don't write a description that reiterates the result of the change such as "remove A and replace with B" - even if it does not contain a numerical value, it is still essentially an effect description and duplicates the localization text. The localization text will become obsolete as soon as the comment is changed. When you need to point out the mechanism, use the field name/system name (such as "Synchronized upgrade with Ultimate LinkedAbility"), and do not describe the gameplay effect.

### 2) awakeningability body

If `newAbility` reuse already has capability, skip this step. New capabilities need to be completed:

- **KV definition** → Write into `game/scripts/npc/npc_abilities_custom_awaken.txt` (already introduced by `#base`, no need to add it). Key fields `BaseClass`, `ScriptFile` (pointing to the implementation), `AbilityTextureName` (icon name):

  ```
  "special_bonus_unique_xxx_upgrade"
  {
      "BaseClass"             "ability_lua"
      "ScriptFile"            "abilities/ts_abilities/special_bonus_unique_xxx_upgrade"
      "AbilityTextureName"    "xxx_some_icon"
      "MaxLevel"              "5"
      "AbilityValues" { ... }
  }
  ```

- **`ScriptFile` realizes selection** → See `custom-ability` skill, awakening does not establish separate rules. The standard writing method of passive awakening: `GetIntrinsicModifierName()` returns a built-in modifier, which takes effect without learning. All adjustable values ​​​​are read from KV `AbilityValues`. The source code is `src/vscripts/abilities/`, and KV `ScriptFile` points to the compiled product `abilities/ts_abilities/<name>` (refer to Ax `axe_auto_culling_blade` and Zeus `special_bonus_unique_zuus_upgrade`).

- **awakening status must be visible in the game** → awakening is a permanent transformation that players can obtain by spending points. After entering the game, they must be able to confirm that they have awakened. **Ability bar visible** or **Resident buff icon** choose one, both are hidden = the player has zero perception and is considered unfinished:
  - ability column is visible: `AbilityBehavior` without `DOTA_ABILITY_BEHAVIOR_HIDDEN`. Automatic technology awakening is naturally sufficient (refer to PA `special_bonus_unique_phantom_assassin_upgrade`, Legion `legion_commander_auto_duel`).
  - resident buff icon: ability plus `HIDDEN` does not occupy the ability column, and hangs another **non-hidden** resident modifier - `IsHidden()` in TS returns `false`, DataDriven writes `"IsHidden" "0"` (refer to `special_bonus_unique_rattletrap_upgrade`, Swain `special_bonus_unique_sven_upgrade`). See Advanced 6 for details.

  When using the buff icon, `GetTexture()` and `DOTA_Tooltip_modifier_<modifier_name>` / `_Description` must be completed, otherwise the icon will be a purple block and there will be no explanation when hovering. **Only writing the tooltip localization text but setting the modifier to hidden** is the easiest combination to miss - the localization text lies in the file and can never be seen in the game.

- **Icon** → Do not put png when citing Dota2 vanilla ability name; only copy the png with the same name to `game/resource/flash3/images/spellicons/<name>.png` for custom icons. `AbilityTextureName` can also directly fill in the **Arcreasure/Variant texture path** (such as `necrolyte/apostle_of_decay_icons/necrolyte_heartstopper_aura`, `drow_ranger/immortal/drow_ranger_wave_of_silence`, `zuus_static_field_alt1`), and the engine will directly reference it, and there is no need to put png.

- **Localization** → New awakening entries are always ranked above old awakenings:
  - `addon_schinese.txt` / `addon_english.txt`: placed on the top of the `Awaken Abilities 觉醒技能` module, Chinese and English are synchronized.
  - `addon_russian.txt`: The `Awaken Abilities 觉醒技能` module placed at the end of the `Creep / Tower` block, before `// Сундук с сокровищами` (treasure chest). The opening comments of
  - awakening entries use Chinese `// 英雄 xxx觉醒`. See the title format below.

### 3) Title localization format (unified)

The ability name line is colored purple `#d000ff` and closed `</font>`:

- Chinese: `<font color='#d000ff'>名称 觉醒</font>` (**space** separated, no `-觉醒` hyphen)
- English: `<font color='#d000ff'>Name Awakened</font>`

**Do not** use `#8B008B`/`#00ff00`/`#a74abd` and other color values, and do not miss `</font>`. After adding an awakening, check that the title of the hero is consistent with other awakenings in the pool.

**Text keyword color (unified)**:

- Protection keywords such as magic immunity/debuff immunity → gold `#FFCC66` (refer to PA, Shadow Demon)
- damage type keywords ("pure damage/magic damage" etc. inline in the text) → pure `#FFE56E` (gold), magic `#05CAFF` (blue). The project has an existing agreement, and new additions will be aligned accordingly.
- automatic cast/trigger prompt → red `#FF0000` (refer to King Ax and Meat Hook)
- Scepter Upgrade Instructions → White `#FFFFFF` with "Scepter Upgrade:" prefix (refer to Necromancer Heart-Breaking Halo, Musket Assassination)
- **hard-coded value** → The engine only automatically puts white bold font for `%key%` variables. The specific handwritten numbers in the text will not change color and must be **manually** packaged into `<font color='#FFFFFF'><b>Number</b></font>` (white bold font, simulates engine numerical style; refer to Bristleback and Shadow Demon awakening). Each ability enhancement is on its own line (separated by `<br>`).

### 4) awakening preview page

Add `{ heroName, abilityName }` to `AWAKEN_ABILITIES` in `src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx`. This list is a display copy of the configuration table and needs to be synchronized manually, otherwise the new awakening will not appear on the "awakening" page of the personal center. Awakening Stone `_Description` no longer lists the hero name (point to this page), and there is no need to change the item description.

### 5) Limited time free trial list

New awakening is added to the limited exemption list by default, allowing players to try it without spending points. The list is maintained manually and needs to be modified in two places:

- `src/vscripts/modules/awaken/awaken-config.ts`of`FREE_TRIAL_HEROES`Add hero name (decision actually takes effect)
- `AwakenTab.tsx` corresponding entry plus `freeTrial: true` (determines whether the card displays the limited-free corner mark) After adding

, you must use `AskUserQuestion` to list the old heroes already in the list, and ask the user which ones have been removed - the list has no expiration mechanism, and it will continue to be free if you don't ask.

### 6) Verification

`npm run build:vscripts` does not report an error + `npx jest awaken-replacer` passes. Slot order/point refund/floating characters/runtime behavior must be confirmed by running Dota tools. After modifying vscripts, only check whether the compilation passes, and do not read the compilation product `.lua`.

---

## Advanced techniques

11 techniques are concentrated in `references/advanced-techniques.md`, and the main process does not need to be read. **Hit any of the following items before reading the corresponding item**:

| Requirements                                                                                     | Advanced                                                |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| awakeningability needs to be upgraded simultaneously with an original ability\*\*                | 1                                                       |
| To **autocast** (automatically detect and trigger after turning on autocast)                     | 2                                                       |
| To have additional effects after \*\*casting a certain ability                                   | 3                                                       |
| A certain original ability value is only changed after awakening\*\*                             | 4                                                       |
| **Add magic and avoid** (cannot replace the player's true BKB)                                   | 5                                                       |
| Pure passive mark ability wants to ** save the ability column slot **                            | 6                                                       |
| To borrow the engine's **native hardcoded modifier** (invisibility, etc.)                        | 7, see also `../shared-references/vanilla-modifiers.md` |
| To read the caster's **current AoE/attribute bonus**                                             | 8                                                       |
| The **scepter description** of the replacement class ability is not displayed                    | 9                                                       |
| Which KV\*\* should be put in the awakening exclusive parameter                                  | 10                                                      |
| The essence of the demand is to **simplify vanilla operations** rather than to change the effect | 11                                                      |

---

## Ask when unclear

When encountering these decision points, use the `AskUserQuestion` menu to ask. Do not assume on your own:

- Unknown operation type (add vs replace vs insert)
- Value/effect "Only takes effect after awakening" or "Globally takes effect on this hero"
- Does the level need to be associated with a certain ability?
- Whether the active skill should be automatically triggered
- Which old heroes already in the limited exemption list should be removed (see step 5, you need to ask every time you add awakening)
