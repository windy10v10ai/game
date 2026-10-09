# Reusable vanilla modifier list

When making your own items/abilities, give priority to picking them from here. If you can pick them, you don’t have to implement them yourself - the vanilla modifier is native C++ of the engine and does not pay callback tax.

**The following table is all in use and verified by this repository, and is far from the complete set**. Just because it's not in the table doesn't mean it can't be done - when vanilla has a corresponding item/ability, follow "How to find it outside the table" at the end of the article to look up the name and try again. Don't give up and implement it yourself.

## Two hanging methods

```kv
// KV (mode 1): temporary effect, the engine automatically picks up according to Duration
"ApplyModifier"
{
    "ModifierName"  "modifier_black_king_bar_immune"
    "Target"        "CASTER"
    "Duration"      "%active_duration"
}
```

```lua
-- script (both modes are acceptable): the permanent type must be removed by yourself in OnDestroy
caster:AddNewModifier(caster, ability, "modifier_item_devastator", {})
```

The `ability` passed in determines whose `AbilityValues` this modifier reads - **This is the source of "reusing attributes together"**, and it is also the source of double fields with the same name. See the first step of SKILL.md for field rules.

## General status

is not bound to any item/ability and can be directly installed anywhere.

| modifier                         | effect                        | parameter                                                                       | repository precedent                                                         |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `modifier_stunned`               | Dizziness                     | `duration`                                                                      | The most commonly used one in the entire repository, 19 files are in use     |
| `modifier_rooted`                | Confinement                   | `duration`                                                                      | `event-npc-spawned.ts`                                                       |
| `modifier_silence`               | Silence                       | `duration`                                                                      | `Debug.ts`                                                                   |
| `modifier_invulnerable`          | Invincible                    | `duration`                                                                      | `primal_split.lua`                                                           |
| `modifier_knockback`             | Knockback displacement        | Displacement parameter table needs to be transmitted (distance/height/duration) | `item_heavens_halberd_v2.ts`, `liu_kick.lua`                                 |
| `modifier_kill`                  | Kill the host upon expiration | `duration`                                                                      | Set the lifespan of the eye position/summon, `ability_ward_observer_slot.ts` |
| `modifier_black_king_bar_immune` | BKB                           | `duration`                                                                      | `item_beast_shield` KV, `awaken-magic-immunity.ts`                           |
| `modifier_fountain_glyph`        | Defense runes                 | `duration`                                                                      | `event-npc-spawned.ts`                                                       |

If you feel dizzy, don’t write it yourself: `modifier_stunned` has been written in a unified way for all repositorys, just match `duration`. The length of time the engine hangs on the enemy will not be shortened according to the status resistance. In TS, `calculateStatusResistedDuration` is used first (see `src/vscripts/CLAUDE.md` for rules), and in Lua, `1 - target:GetStatusResistance()` is used.

## vanilla item modifier

When reusing, write the value in **own** KV according to the vanilla field name. The field name is checked. `docs/reference/<version>/items.txt` corresponds to `AbilityValues` of the item.

| modifier                                      | source item       | effect                                                                                                                                                                                                                                               | repository precedent                      |
| --------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `modifier_item_blade_mail`                    | Blade Armor       | Passive damage + attributes                                                                                                                                                                                                                          | `item_beast_armor`                        |
| `modifier_item_blade_mail_reflect`            | Blade Armor       | Active counter-injury (with `duration`)                                                                                                                                                                                                              | `item_beast_armor`                        |
| `modifier_item_battlefury`                    | Battle Fury Ax    | Splash + Attributes                                                                                                                                                                                                                                  | `item_magic_sword`                        |
| `modifier_item_desolator`                     | Destruction       | Attack armor reduction + attributes                                                                                                                                                                                                                  | `item_hawkeye_turret`, `item_magic_sword` |
| `modifier_item_devastator`                    | Holy Ax           | Intelligence converted to damage / reduced magic resistance + attributes                                                                                                                                                                             | `item_magic_crit_blade`                   |
| `modifier_item_eternal_shroud`                | Eternal Vestments | Convert Spell Damage to Magic + Attributes                                                                                                                                                                                                           | `item_beast_shield`                       |
| `modifier_item_gungir`                        | Soul binding rope | Attack triggers group imprisonment + attributes                                                                                                                                                                                                      | `item_forbidden_staff`                    |
| `modifier_item_angels_demise`                 | Ultimate Blade    | Passive body                                                                                                                                                                                                                                         | `item_shadow_impact`                      |
| `modifier_item_angels_demise_slow` / `_break` | Ultimate Blade    | Slowdown / Destruction (with `duration`)                                                                                                                                                                                                             | `item_shadow_impact`                      |
| `modifier_item_lotus_orb_active`              | Qinglian Baozhu   | Rebound directional spell (with `duration`)                                                                                                                                                                                                          | `item_saint_orb.ts`, `item_beast_armor`   |
| `modifier_heavens_halberd_debuff`             | Heaven's Halberd  | Disarm (with `duration`)                                                                                                                                                                                                                             | `item_heavens_halberd_v2.ts`              |
| `modifier_item_force_staff_motion`            | Force Staff       | Linear Displacement (with `duration`)                                                                                                                                                                                                                | `item_force_staff`                        |
| `modifier_item_swift_blink_buff`              | Swift flash       | Attack speed/movement speed gain                                                                                                                                                                                                                     | `item_jump_jump_jump`                     |
| `modifier_item_overwhelming_blink_debuff`     | Flashing power    | Slow down (with `duration`)                                                                                                                                                                                                                          | `item_jump_jump_jump`                     |
| `modifier_item_arcane_blink_buff`             | Secret Flash      | Reduced casting swing and mana consumption, read the old version fields `cast_pct_improvement` / `manacost_reduction` (the current vanilla KV has deleted these two fields, the engine still recognizes them, and has been tested) (with `duration`) | `item_jump_jump_jump`                     |
| `modifier_item_meteor_hammer`                 | Meteor Hammer     | Passive attributes (three-dimensional / ability enhancement / magic recovery enhancement)                                                                                                                                                            | `item_jump_jump_jump`                     |
| `modifier_item_meteor_hammer_burn`            | Meteor Hammer     | Burning damage + slowdown, units and buildings read `burn_dps_units` / `burn_dps_buildings` (with `duration`)                                                                                                                                        | `item_jump_jump_jump`                     |
| `modifier_item_blink_dagger`                  | Jump knife        | After being damaged by the enemy hero or Roshan, let the entire item enter `blink_damage_cooldown` cooling, `item_lua` item also takes effect                                                                                                        | `item_jump_jump_jump`                     |
| `modifier_item_ultimate_scepter`              | Aghanim's Scepter | Scepter effect (`duration = -1` is permanent)                                                                                                                                                                                                        | `item_ultimate_scepter_2`                 |
| `modifier_item_buff_ward`                     | Scouting Guard    | Eye Existence Status                                                                                                                                                                                                                                 | `ability_ward_observer_slot.ts`           |
| `modifier_item_ward_true_sight`               | Sentry Guard      | True Sight                                                                                                                                                                                                                                           | `ability_ward_sentry_slot.ts`             |

## vanilla ability modifier

borrows the ready-made effect of a certain hero's ability.

| modifier                                  | source                          | effect                                                                                                                                        | repository precedent                             |
| ----------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `modifier_tidehunter_anchor_smash_caster` | Tide Hunter Anchor Strike       | Packaged in `PerformAttack` The outer layer is marked "instant attack triggered by ability", the 10 abilities are uniformly written like this | `sword_master_tap.lua`, `artoria_strike_air.lua` |
| `modifier_riki_backstab`                  | Rikimaru Sword and Spy          | Attack from behind to increase damage                                                                                                         | `windrunner_whirlwind_custom.ts`                 |
| `modifier_drow_ranger_frost_arrows_slow`  | Drow Ranger Frost Arrow         | Attack slowdown (with `duration`)                                                                                                             | `special_bonus_unique_drow_ranger_upgrade.ts`    |
| `modifier_brewmaster_belligerent_damage`  | Brewmaster Elemental Separation | Clone Damage Increase                                                                                                                         | `primal_split.lua`                               |
| `modifier_brewmaster_void_brawler_slow`   | Brewmaster Elemental Separation | Clone Slowdown                                                                                                                                | `primal_split.lua`                               |

`modifier_tidehunter_anchor_smash_caster` is fixed as hang → `PerformAttack` → pick immediately. Just follow the precedent. Don’t just hang without picking. How to find

## outside the table The

vanilla modifier name is the internal name of the engine and is not found in the KV file (just because `grep items.txt` cannot be found does not mean it does not exist). Search in the following order and try first if you find a candidate:

**1. Vanilla localization anti-check** - covering all **visible** buff/debuffs (those that players can see the icons), there are 2596 `DOTA_Tooltip_modifier_*` keys in `abilities_schinese.txt`:

```bash
# Know which item/ability it is: use its system name as the key word
grep -o "DOTA_Tooltip_modifier_.*blade_mail.*" docs/reference/<version>/abilities_schinese.txt
# only knows the Chinese effect name: first search the Chinese to locate the key, and then get the modifier name in the key
grep "缴械" docs/reference/<version>/abilities_schinese.txt
```

**2. Guess the naming convention**——**The hidden passive modifier has no tooltip and cannot be found in the localization** (the passive bodies of Holy Axe, Soul Binding Cord, and Absolute Blade are all like this). Most of them are `modifier_` + item system name, but there are exceptions and can only be used as candidates:

| item                   | modifier                          | deviation                                                      |
| ---------------------- | --------------------------------- | -------------------------------------------------------------- |
| `item_blade_mail`      | `modifier_item_blade_mail`        | None, spell directly                                           |
| `item_bfury`           | `modifier_item_battlefury`        | The full name is used, not the abbreviation of the system name |
| `item_heavens_halberd` | `modifier_heavens_halberd_debuff` | Without `item_` prefix                                         |

**3. Check the documentation** - If there is no result in the above two steps, use `dota-docs-lookup` skill (ModDota API Index / Valve Wiki).

**4. Real machine verification** - If the name is guessed incorrectly, no error will be reported\*\*, but silence will have no effect. After you get the candidate, you must hang it up in Dota Tools to confirm that it is really effective. Do not write the code just because the name looks like it.

was not found after four steps, so I pressed the second step of SKILL.md to select the mode and implemented it myself.
