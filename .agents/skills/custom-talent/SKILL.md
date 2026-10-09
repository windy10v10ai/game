---
name: custom-talent
description: "Add or replace hero talents, especially replacing generic bonuses with ability-specific effects. Use when modifying hero talents or connecting a talent to an ability."
---

# Create Custom Talent

When adding or replacing talents for heroes, perform the following sequence to ensure that the key name, tier and localization text are consistent.

## 1) Design talent system name

- Use the system name without binding a value: `special_bonus_unique_<hero>_<effect>`
- Avoid writing fixed values in the system name (such as `_200`, `_50`)
- Only retain the original name when explicitly reusing official talents; custom talents take priority in creating independent keys

## 2) Modify ability and talent definitions (npc_abilities_override.txt)

- mounts the talent key in `AbilityValues` of the target ability (such as `"+200"`, `"-4"`, `"x2"`)
- Add talent definition block in the same hero section
- follows the fixed template:

```kv
// Custom talent
"special_bonus_unique_<hero>_<effect>"
{
	"AbilityType"					"ABILITY_TYPE_ATTRIBUTES"
	"AbilityBehavior"				"DOTA_ABILITY_BEHAVIOR_PASSIVE"
	"BaseClass"						"special_bonus_base"
}
```

## 3) Update hero talent slots and Build (npc_heroes_custom.txt)

- covers the corresponding talent slot in the hero block (usually `Ability10-17`)
- synchronizes the talent key of `Bot.Build`:
- `10/15/20/25` Fill in the selected talent
- `27/28/29/30` respectively fill in another talent of `10/15/20/25` If
- replaces the old talent, make sure `Ability slot` and `Build` are replaced at the same time, leaving no old keys

## 4) Update Chinese and English localization text (addon_schinese.txt / addon_english.txt)

- Add or replace key: `DOTA_Tooltip_ability_<talent_name>`
- localization text uses variable placeholders and does not hard-code values.
- Example: `"+{s:bonus_heal} 巫毒疗法治疗量"`, `"+{s:bonus_heal} Voodoo Restoration Heal"`

## 5) Self-test

- The keys of the same talent name in the four files are exactly the same
- `npc_abilities_override.txt` Contains:
- ability hook line
- talent definition block
- `npc_heroes_custom.txt` Contains:
- Correct Ability10-17 slot coverage
- Correct Build tier (including 27/28/29/30)
- localization has corresponding tooltip keys in both Chinese and English
- No residual references to old talents (replacement scenes must be cleared)

## 6) Common inspection commands

```powershell
Select-String -Path `
  game\scripts\npc\npc_abilities_override.txt,`
  game\scripts\npc\npc_heroes_custom.txt,`
  game\resource\addon_schinese.txt,`
  game\resource\addon_english.txt `
  -Pattern 'special_bonus_unique_<hero>_<effect>|DOTA_Tooltip_ability_special_bonus_unique_<hero>_<effect>'
```
