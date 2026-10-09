# DataDriven expressible range and `item_apply_modifiers` usage

is used for table lookup in the second step of `custom-item` "Select Mode". Official document: https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

## can be written into the properties of `Properties`

The following attributes can be written directly to KV `Properties` (mode 1 writes the item's own `Modifiers`, mode 2 writes `_stats` of `item_apply_modifiers`). **All are already in use in this repository**, and the number of occurrences is taken from `npc_items_custom.txt` / `npc_items_artifact.txt` / `npc_items_modifier.txt`:

**Basic attributes**

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

**Attack related**

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`、`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_ATTACK_RANGE_BONUS`
- `MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE` (Crit multiplier; trigger probability using `Random` event block, see below)

**Defense related**

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`
- `MODIFIER_PROPERTY_EVASION_CONSTANT`、`MODIFIER_PROPERTY_MISS_PERCENTAGE`
- `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`

**Mobile related**

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE` / `_UNIQUE`、`MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE`
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE`

**Life/Magic/Vision**

- `MODIFIER_PROPERTY_HEALTH_BONUS`、`MODIFIER_PROPERTY_MANA_BONUS`
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT`、`MODIFIER_PROPERTY_MANA_REGEN_CONSTANT`
- `MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE`
- `MODIFIER_PROPERTY_BONUS_DAY_VISION`、`MODIFIER_PROPERTY_BONUS_NIGHT_VISION`

**Spell related**

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE`、`MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE`

The attribute name that is not in the table does not necessarily mean that it will not work (DataDriven support is wider than this), but **there is no precedent in this repository**, so verify it in Dota Tools first and then roll it out.

**Confirmed to be unavailable**, the hit stays directly on the script side, don't try to sink:

- `MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING`
- `MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE`(The above table`HP_REGEN_AMPLIFY_PERCENTAGE`It’s a reply amplification, the semantics are different and cannot be replaced)

`npc_items_custom.txt`There are several places in`（不在可优化列表）`The annotation refers to this list.

## can be written into the status of `States`

```kv
"States"
{
    "MODIFIER_STATE_ROOTED"     "MODIFIER_STATE_VALUE_ENABLED"
    "MODIFIER_STATE_DISARMED"   "MODIFIER_STATE_VALUE_ENABLED"
}
```

Commonly used: `ROOTED` (confinement), `DISARMED` (disarm), `SILENCED`, `MUTED`, `STUNNED`, `HEXED`, `INVISIBLE`, `INVULNERABLE`, `MAGIC_IMMUNE`, `FLYING`, `FORCED_FLYING_VISION`, `NO_HEALTH_BAR`, `NO_UNIT_COLLISION`, `ATTACK_IMMUNE`, `UNSELECTABLE`, `CANNOT_MISS`, `BLIND`. Value: `MODIFIER_STATE_VALUE_ENABLED`/`_DISABLED`.

## Declarative triggers without scripts

`Modifiers`event block within (`OnAttackStart` / `OnAttackLanded` / `OnSpellStart` / `OnIntervalThink`...) With Actions, a whole probabilistic trigger chain can be expressed without any scripting. example`item_wasp_despotic`：`OnAttackStart`inside`RemoveModifier`Clear last result →`Random`Throw`%crit_chance` → `OnSuccess` `ApplyModifier`Add critical modifier → after hit`OnAttackLanded`Again`RemoveModifier`Clear it.

When judging "whether this logic can be pure KV", first see if it can be broken down into a combination of the steps of "rolling dice → hanging/picking modifier → playing sound effects/special effects → causing damage".

## The part that must be left on the script side

The part outside the table determines which mode to go to according to the shape:

**"action" type → `RunScript` global function in mode 1**

- One-time settlement: causing damage, generating units, issuing gold experience, playing special sound effects, and organizing entities on the field
- hangs/picks a vanilla modifier (the hanging point uses the `OnCreated` / `OnDestroy` event block of the DataDriven modifier itself)
- frame-by-frame/timed single-step action (`RunScript` settles one damage in `ThinkInterval` + `OnIntervalThink`)

**"Resident modifier" type → TS for mode 2**

- `MODIFIER_PROPERTY_ABSORB_SPELL` (spell blocking, such as Qinglian Orb)
- `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK` (attack trigger feedback)
- requires **dynamic calculation** of the value (judged by health percentage/number of layers/target armor/conditions, static `%value` cannot express it)
- Event callback with accounting: built-in cooling timer, attack record tracking, `OnTakeDamage` complex branch
- Status that requires synchronization across item instances (multiple item charging alignment, etc.)

The criterion is not the code length, but whether to write a modifier class. Once `LinkLuaModifier` + `class({})` appears in Lua in mode 1, it means the wrong mode has been selected.

## Reusing vanilla modifier: Field conflict troubleshooting

See SKILL.md for the selection rules and three mechanism rules. The first step is the verification method.

**Check whether an item has checked "Double the field with the same name"**, two-step comparison:

1. Gets the `AbilityValues` field name of the reused vanilla item from `docs/reference/<version>/items.txt` (the key is under the 4th level tab indentation, and it will be missed if you press the 3rd level matching)
2. gets the field name referenced by `%xxx` in this item `Modifiers` → `Properties` The intersection of

and the two is not empty = this attribute is added once by the vanilla modifier and added once by its own `Properties`. When reusing two or more vanillas, the fields of those vanillas must be intersected with each other, and the fields falling within them will be read once.

Checked precedents: `item_beast_shield` / `item_hawkeye_turret` / `item_magic_crit_blade` / `item_forbidden_staff` / `item_shadow_impact` The intersection is empty; `item_magic_sword` uses `bonus_damage_passive` to circumvent the common problem between Battle Fury and Obliteration `bonus_damage`; `item_beast_armor` was once doubled on `bonus_damage` / `bonus_intellect`, and has been renamed and corrected.

**Pending/removal of permanent vanilla modifier**:

Mode 2 can declare `BaseItemModifier` and `vanillaModifierNames`. The abstraction is all covered by the base class. Do not write it yourself.

mode 1 In the `OnCreated` / `OnDestroy` event block of DataDriven modifier `RunScript`, **save the handle and then `Destroy()`**:

```lua
-- OnCreated
local modifier = caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})
-- OnDestroy
if modifier and not modifier:IsNull() then modifier:Destroy() end
```

**Do not use `RemoveModifierByName`** - it is deleted by name and will be deleted together with the modifier of the same name attached to other item instances. When multiple items are superimposed, the properties will be lost silently. For the storage location of the handle, see the multi-modifier writing method below.

Do not repeatedly define this vanilla modifier in the `Modifiers` block of your own KV.

**When merging multiple vanilla modifiers at the same time**, `RemoveModifierByName` has to handwrite the names one by one, which is not versatile enough; instead use `ability` to hang an array record handle, and `OnDestroy` uniformly traverses `Destroy()`:

```lua
-- OnCreated
local m1 = caster:AddNewModifier(caster, ability, "modifier_item_devastator", {})
local m2 = caster:AddNewModifier(caster, ability, "modifier_item_xxx", {})
ability.added_modifiers = ability.added_modifiers or {}
if m1 then table.insert(ability.added_modifiers, m1) end
if m2 then table.insert(ability.added_modifiers, m2) end

-- OnDestroy
for _, modifier in pairs(ability.added_modifiers or {}) do
    if modifier and not modifier:IsNull() then
        modifier:Destroy()
    end
end
ability.added_modifiers = nil
```

Example: `item_magic_crit_blade.lua` (merge `modifier_item_devastator`), `item_beast_armor.lua` (merge `modifier_item_blade_mail`). Three types of scenarios for

## `item_apply_modifiers`

`item_apply_modifiers` (`BaseClass item_datadriven`) in `game/scripts/npc/npc_items_modifier.txt` is a global singleton item, which stores the DataDriven definition of the "pure numerical constant bonus" part of the `item_lua` item - because the KV of `item_lua` does not support its own `Modifiers` block.

**Only service mode 2**: 100% of the items corresponding to 27 `_stats` are `item_lua`. The attributes of mode 1 are written in the item's own `Modifiers` block and are not touched here.

### A. Permanent item basic attributes (binding item instances, the most common)

- named `modifier_item_<name>_stats`, written into the `Modifiers` block of `item_apply_modifiers`
- The canonical value is written into `item_apply_modifiers`'s own `AbilityValues`. The key must be prefixed with `<item_name>_` (such as `item_saint_orb_bonus_all_stats`). `Properties` is referenced by `%<prefixed_key>`; item's own `AbilityValues` is added. `xxx_tooltip` **Image value** for tooltip display
- TS: `BaseItemModifier` inherits `src/vscripts/items/ts_items/base_item_modifier.ts`, only declares `statsModifierName`, and the three life cycle callbacks have been implemented
- Stock native Lua: `OnCreated` (`OnRefresh` must be adjusted first)/`OnRefresh`/`OnDestroy` All three places are adjusted
  ```lua
  RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
  ```
  The first parameter `_` is the implicit context parameter of the TSTL compiled product, which must be occupied by the Lua side; this parameter is not written when calling on the TS side.
- This function automatically aligns the number of overlays of `_stats` according to the **instance number** of the item in the holder's backpack (multiple items require `MODIFIER_ATTRIBUTE_MULTIPLE`)
- In the read-only script ** in `OnCreated`, you must actually use the ** value; do not read the value that is only displayed by the tooltip, and do not retain the repeated implementation of the sunk attribute in `DeclareFunctions()` / `GetModifier*()`

### B. Permanent BUFF (not bound to item instances, such as consumables permanently given)

- writes the complete DataDriven modifier directly in `npc_items_modifier.txt` (no need for `_stats` suffix, nor script-side modifier class)
- is called in the script that consumes the item:
  ```lua
  ApplyItemDataDrivenModifier(_, caster, target, "modifier_xxx", {})
  ```
- Reference: `item_tome_of_luoshu`, `item_ultimate_scepter_2`

### C. Temporary Buff / Debuff (with duration)

- also writes the complete DataDriven modifier (`Properties` puts the static part; when frame-by-frame effects are needed, add `ThinkInterval` + `OnIntervalThink`’s `RunScript`)
- is attached to the target with `ApplyItemDataDrivenModifier` and passed in `duration`
- visible buff (to appear in the status bar) add `"IsHidden" "0"` + `"IsBuff" "1"` + `"TextureName"`. The value is filled in the `AbilityTextureName` of the item, and **must be prefixed with `item_`**
- Reference: `modifier_item_withered_spring_active` (item active buff), `modifier_global_member_normal` (unlimited visible global buff)

## Decision-making Tips

- The external part of the table is **action** → Mode 1, `RunScript` calls Lua global function, the attribute still writes its own KV, **does not touch `item_apply_modifiers`**, there is only one value
- The part outside the table is **resident modifier** → Mode 2, pure numerical constant attribute sinks `item_apply_modifiers` of `_stats`, TS only writes the part outside the table by hand
- Mode 2 but no permanent attributes (consumables/tools) → `statsModifierName = ''`, also do not touch `item_apply_modifiers`
- If you want to eliminate the parts outside the table → first check if there is a vanilla modifier that can be reused. If it can be reused, return to mode 1.
- Permanent effect without binding item instance → `ApplyItemDataDrivenModifier` + complete modifier
- Temporary effects with duration → Full DataDriven modifier (+ `RunScript` handles frame-by-frame logic)
