# DataDriven scope and item modifier ownership

Use the existing item implementations and
[Valve DataDriven reference](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven)
when a capability is not listed. Absence here does not prove engine non-support;
verify unfamiliar properties in Tools before rollout.

## Properties used by this project

With the `MODIFIER_PROPERTY_` prefix:

| Area        | Suffixes                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Attributes  | STATS_STRENGTH_BONUS, STATS_AGILITY_BONUS, STATS_INTELLECT_BONUS                                                                |
| Attacks     | PREATTACK_BONUS_DAMAGE, ATTACKSPEED_BONUS_CONSTANT, BASEDAMAGEOUTGOING_PERCENTAGE, ATTACK_RANGE_BONUS, PREATTACK_CRITICALSTRIKE |
| Defense     | PHYSICAL_ARMOR_BONUS, MAGICAL_RESISTANCE_BONUS, EVASION_CONSTANT, MISS_PERCENTAGE, INCOMING_DAMAGE_PERCENTAGE                   |
| Movement    | MOVESPEED_BONUS_CONSTANT, MOVESPEED_BONUS_PERCENTAGE, MOVESPEED_BONUS_UNIQUE, MOVESPEED_ABSOLUTE, TURN_RATE_PERCENTAGE          |
| Health/mana | HEALTH_BONUS, MANA_BONUS, HEALTH_REGEN_CONSTANT, MANA_REGEN_CONSTANT, HP_REGEN_AMPLIFY_PERCENTAGE                               |
| Vision      | BONUS_DAY_VISION, BONUS_NIGHT_VISION                                                                                            |
| Spells      | SPELL_AMPLIFY_PERCENTAGE, COOLDOWN_PERCENTAGE                                                                                   |

Known unsuitable properties remain on the script side:
`STATUS_RESISTANCE_STACKING` and `HEALTH_REGEN_PERCENTAGE_UNIQUE`.
Regen amplification is a different effect, not a replacement for percent regen.

KV `States` uses `MODIFIER_STATE_*` and enabled/disabled values.
Existing uses include rooted, disarmed, silenced, muted, stunned, hexed,
invisible, invulnerable, magic immune, flying, collision/health-bar exclusions,
attack immune, unselectable, cannot-miss, and blind.

## Declarative versus scripted behavior

Actions and event blocks can compose probability checks, apply/remove effects,
sound/particles, and damage without a script.
Example: `item_wasp_despotic` removes an old crit flag, rolls Random, applies
the successful flag, then clears it after the attack.

One-shot/timed actions may call native Lua global functions through RunScript.
Persistent custom modifiers, dynamic properties, spell absorption, proc feedback,
attack records, internal cooldowns, and cross-instance synchronization use TS.
A RunScript `ScriptFile` cannot point at a TSTL module expecting global functions.

## Native reuse

Compare reused native AbilityValues field names with the item's own
Properties references. Overlap can add the same stat twice.
Also compare fields across multiple reused native modifiers.
Use independent names when the intended item stat must not feed native behavior.

Timed modifier handles expire through the engine if verified to honor duration.
Permanent DataDriven native effects attach through OnCreated and clean up
through OnDestroy, storing handles (for example in `ability.added_modifiers`).
Destroy each saved non-null handle; `RemoveModifierByName` also removes effects
owned by other item instances.
TS uses `BaseItemModifier.vanillaModifierNames` for this ownership.

## Shared item_apply_modifiers

Only item_lua items use the singleton definition in
`game/scripts/npc/npc_items_modifier.txt`.
DataDriven items keep properties in their own KV.

Permanent instance stats use `modifier_item_<name>_stats`, prefixed canonical
AbilityValues keys on `item_apply_modifiers`, and matching `_tooltip` mirrors
on the item. Read canonical values in logic, not tooltip-only mirrors.
`RefreshItemDataDrivenModifier` aligns stacks to item-instance count;
multiple instances need MULTIPLE attributes.
Native Lua calls include the leading TSTL context argument:
`RefreshItemDataDrivenModifier(_, ability, modifierName)`.
TS calls omit it. Creation, refresh, and destruction must all synchronize.

Permanent consumable buffs use a complete KV modifier applied through
`ApplyItemDataDrivenModifier`, without item-instance stack tracking.
Temporary buffs use the same helper with duration.
Visible KV buffs need IsHidden 0, IsBuff 1, and an item-prefixed TextureName.
Examples: `item_tome_of_luoshu`, `item_ultimate_scepter_2`,
`modifier_item_withered_spring_active`.
