# Custom Items Implementation Plan

Six new artifact-tier items. All use `item_lua` BaseClass with TypeScript implementations.
IDs allocated starting at **11200** (safe gap above highest existing 11101).

---

## ID Allocation

| Recipe ID | Item ID | Name |
|-----------|---------|------|
| 11200 | 11201 | item_reaper_soul |
| 11202 | 11203 | item_curse_of_ages |
| 11204 | 11205 | item_chaos_engine |
| 11206 | 11207 | item_void_paradox |
| 11208 | 11209 | item_primordial_mandate |
| 11210 | 11211 | item_thousand_cuts |

---

## Files to Modify / Create

### New TypeScript files (create)
- `src/vscripts/items/ts_items/item_reaper_soul.ts`
- `src/vscripts/items/ts_items/item_curse_of_ages.ts`
- `src/vscripts/items/ts_items/item_chaos_engine.ts`
- `src/vscripts/items/ts_items/item_void_paradox.ts`
- `src/vscripts/items/ts_items/item_primordial_mandate.ts`
- `src/vscripts/items/ts_items/item_thousand_cuts.ts`

### Existing files to modify
- `game/scripts/npc/npc_items_artifact.txt` — append all 12 KV blocks (6 recipes + 6 items)
- `game/scripts/shops.txt` — register items under the `"artifacts"` section
- `game/resource/addon_english.txt` — localization entries
- `game/resource/addon_schinese.txt` — Chinese localization entries
- `game/resource/addon_russian.txt` — Russian localization (copy English as placeholder)

---

## Item Specifications

---

### 1. `item_reaper_soul` — Buyback Denial

**Recipe:** `item_forbidden_blade` + `item_consumable_gem` + recipe (5,000g)  
**Total cost:** ~45,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_UNIT_TARGET` (active targets an enemy hero)

**AbilityValues:**
```
"bonus_strength"        "80"
"bonus_agility"         "100"
"bonus_intellect"       "100"
"bonus_damage"          "250"
"bonus_armor"           "25"
"buyback_deny_duration" "120"
"condemn_duration"      "12"
"condemn_buyback_deny"  "300"
"condemn_gold_bonus"    "500"
```

**TypeScript implementation — `item_reaper_soul.ts`:**

The item class (`item_reaper_soul extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_reaper_soul'`
- `OnSpellStart()`:
  - Get target hero with `this.GetCursorTarget()`
  - Apply `modifier_item_reaper_soul_condemned` to target for `condemn_duration` seconds

Passive modifier (`modifier_item_reaper_soul extends BaseModifier`):
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- `DeclareFunctions()`: `STATS_STRENGTH_BONUS`, `STATS_AGILITY_BONUS`, `STATS_INTELLECT_BONUS`, `PREATTACK_BONUS_DAMAGE`, `PHYSICAL_ARMOR_BONUS`
- Stat getters read from `GetAbility()?.GetSpecialValueFor(...)`
- `OnCreated()`: If server, call `ListenToGameEvent('entity_killed', this.OnEntityKilled, this)` — store handle with `GameEvents.RegisterListener`
- `OnEntityKilled(event)`: 
  - Get killed unit via `EntIndexToHScript(event.entindex)`
  - Check if it's a real hero (`IsRealHero()`)
  - Check if `event.killer_userid` matches the item owner's player ID via `PlayerResource.GetPlayerID(this.GetParent())`
  - If match: call `killedHero.SetBuybackCooldownTime(this.GetAbility()!.GetSpecialValueFor('buyback_deny_duration'))`
  - Also check if killed hero has `modifier_item_reaper_soul_condemned` — if so, use `condemn_buyback_deny` value instead, and grant `condemn_gold_bonus` to the item owner via `this.GetParent().GetPlayerOwner().ModifyGold(...)`
- `OnDestroy()`: Remove the game event listener

Condemned modifier (`modifier_item_reaper_soul_condemned extends BaseModifier`):
- `IsDebuff(): true`, `IsPurgable(): false`
- `GetTexture()`: `'item_reaper_soul'`
- Visual: red skull particle attached to unit

---

### 2. `item_curse_of_ages` — Permanent HP Erosion

**Recipe:** `item_shadow_impact` + `item_light_part` + recipe (3,000g)  
**Total cost:** ~50,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_UNIT_TARGET | DOTA_ABILITY_BEHAVIOR_NO_TARGET` — passive only, active is handled in `OnSpellStart`  
Actually set behavior as `DOTA_ABILITY_BEHAVIOR_UNIT_TARGET` for the active; the passive logic lives entirely in the modifier.

**AbilityValues:**
```
"bonus_intellect"           "100"
"bonus_strength"            "80"
"bonus_agility"             "80"
"bonus_spell_amp"           "50"
"bonus_damage"              "250"
"bonus_mana"                "1500"
"hp_reduction_per_stack"    "80"
"armor_reduction_per_10"    "3"
"magic_resist_per_20"       "15"
"active_instant_stacks"     "15"
"active_cast_range"         "600"
```

**TypeScript implementation — `item_curse_of_ages.ts`:**

Item class (`item_curse_of_ages extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_curse_of_ages'`
- `OnSpellStart()`:
  - Get target via `this.GetCursorTarget()`
  - Apply `modifier_item_curse_of_ages_stack` to target 15 times via a loop calling `target.AddNewModifier(...)`

Passive modifier (`modifier_item_curse_of_ages extends BaseModifier`):
- Stats: STR, AGI, INT, PREATTACK_BONUS_DAMAGE, SPELL_AMPLIFY_PERCENTAGE, MANA_BONUS
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- `DeclareFunctions()` includes `ON_ATTACK_LANDED`
- `OnAttackLanded(event)`:
  - Check `event.attacker === this.GetParent()` and target is a hero
  - Apply 1 stack of `modifier_item_curse_of_ages_stack` to `event.target`

Stack modifier (`modifier_item_curse_of_ages_stack extends BaseModifier`):
- **This modifier lives on the TARGET (enemy), not the item owner**
- `RemoveOnDeath(): true` (resets when the enemy dies — correct behavior)
- `IsStackable(): true` (via `GetAttributes()` returning `MULTIPLE`)
- `IsPurgable(): false`
- `IsDebuff(): true`
- `GetTexture()`: `'item_curse_of_ages'`
- `DeclareFunctions()`: `HEALTH_BONUS`, `PHYSICAL_ARMOR_BONUS`, `MAGICAL_RESISTANCE_BONUS`
- `GetModifierHealthBonus()`:
  - `return -(stackCount * hp_reduction_per_stack)` where stackCount = `this.GetStackCount()`
  - Use `this.GetStackCount()` — BUT: Dota's native stack modifier needs `GetStackCount()` to work. Use `SetStackCount` in `OnCreated`/`OnStackCountChanged`.
  - Actually: each application is a separate modifier instance. To track "stacks" as a count on ONE modifier, override `OnCreated` to check if this modifier already exists on the unit and increment its stack count. Pattern: check `parent.FindModifierByName('modifier_item_curse_of_ages_stack')`, if exists call `existingMod.SetStackCount(existingMod.GetStackCount() + 1)` and destroy self; otherwise `this.SetStackCount(1)`.
- `GetModifierHealthBonus()`: `return -(this.GetStackCount() * 80)`
- `GetModifierPhysicalArmorBonus()`: `return -(Math.floor(this.GetStackCount() / 10) * 3)`
- `GetModifierMagicalResistanceBonus()`: `return -(Math.floor(this.GetStackCount() / 20) * 15)`
- Cap: check `GetStackCount() >= 30` in `OnCreated` and don't add further

---

### 3. `item_chaos_engine` — Rotating Random Magic

**Recipe:** `item_dagon_ultra` + `item_hallowed_scepter` + `item_dark_part` + recipe (2,000g)  
**Total cost:** ~50,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE` (active lets you pick next effect)

**AbilityValues:**
```
"bonus_intellect"           "120"
"bonus_strength"            "80"
"bonus_agility"             "80"
"bonus_damage"              "200"
"bonus_spell_amp"           "80"
"bonus_mana"                "1500"
"nuke_damage"               "900"
"nuke_radius"               "700"
"stun_duration"             "1.5"
"stun_radius"               "700"
"polymorph_duration"        "2.0"
"silence_duration"          "4.0"
"meteor_damage"             "800"
"slow_pct"                  "80"
"slow_duration"             "3.0"
"spell_resist_reduction"    "50"
"spell_resist_duration"     "6.0"
"active_cooldown"           "25.0"
"active_mana_cost"          "600"
```

**TypeScript implementation — `item_chaos_engine.ts`:**

Item class (`item_chaos_engine extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_chaos_engine'`
- `OnSpellStart()` (the active — "choose next effect"):
  - Get intrinsic modifier instance on caster
  - Set `forcedNextEffect` field on it to whatever the player chooses
  - **Implementation note**: Since there's no UI to choose, the active cycles to the next effect in sequence (i.e. sets `cycleIndex` to the player's desired index, passed as a hardcoded option). Simpler: the active just forces the NEXT Wild Magic proc to use the effect at `(currentIndex + 1) % 8`, effectively previewing/controlling 1 cycle ahead. Add a boolean `hasForcedNext` and `forcedNextIndex`.
  
Passive modifier (`modifier_item_chaos_engine extends BaseModifier`):
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- Internal fields: `cycleIndex: number = 0` (0–7), `hasForcedNext: boolean = false`, `forcedNextIndex: number = 0`
- Stats: INT, STR, AGI, PREATTACK_BONUS_DAMAGE, SPELL_AMPLIFY_PERCENTAGE, MANA_BONUS
- `DeclareFunctions()` includes `ON_ABILITY_FULLY_CAST`
- `OnAbilityFullyCast(event)`:
  - Check `event.unit === this.GetParent()`
  - Check that the cast ability is NOT this item itself (avoid recursion) — `event.ability !== this.GetAbility()`
  - Determine effect index: if `hasForcedNext`, use `forcedNextIndex`, reset flag; else use `cycleIndex`
  - Advance `cycleIndex = (cycleIndex + 1) % 8`
  - Call `this.TriggerEffect(effectIndex, event)`
- `TriggerEffect(index, event)` — switch on index:
  - **0 (Nuke):** `ApplyDamage` magic to all units in `nuke_radius` around caster
  - **1 (AOE Stun):** `FindUnitsInRadius` → apply a timed modifier `modifier_chaos_engine_stun` (duration from `stun_duration`) to each
  - **2 (Polymorph):** Apply vanilla `modifier_sheepstick_debuff` via `target.AddNewModifier(...)` for `polymorph_duration` — target is the ability's cast target if available, else nearest enemy
  - **3 (Global Silence):** Apply `modifier_chaos_engine_silence` to ALL enemy heroes globally (iterate `HeroList.GetAllHeroes()`, filter enemies)
  - **4 (Meteor):** `CreateProjectile` or simply `ApplyDamage` pure to radius area — use a timer + particle for visual effect
  - **5 (Mass Slow):** Apply `modifier_chaos_engine_slow` to all enemies in `slow_radius` (use nuke_radius)
  - **6 (Spell Resist Reduction):** Apply `modifier_chaos_engine_spell_resist_debuff` to nearest enemy hero
  - **7 (Refresh Ability):** Iterate caster's abilities, call `ability.EndCooldown()` on a random non-item ability that is on cooldown

Temporary debuff modifiers (all simple KV or small TS modifier classes, `IsDebuff: true`):
- `modifier_chaos_engine_stun`: `CheckState` → `STUNNED: true`
- `modifier_chaos_engine_silence`: `CheckState` → `SILENCED: true`
- `modifier_chaos_engine_slow`: `MOVESPEED_BONUS_PERCENTAGE: -slow_pct`
- `modifier_chaos_engine_spell_resist_debuff`: `MAGICAL_RESISTANCE_BONUS: -spell_resist_reduction`

---

### 4. `item_void_paradox` — Death-Powered Permanent Scaling

**Recipe:** `item_withered_spring` + `item_dark_part` + recipe (4,000g)  
**Total cost:** ~50,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE` for active

**AbilityValues:**
```
"bonus_strength"            "180"
"bonus_health"              "2500"
"bonus_health_regen"        "80"
"bonus_armor"               "40"
"bonus_spell_amp"           "60"
"stats_per_death"           "70"
"damage_per_death"          "120"
"spell_amp_per_death"       "6"
"active_duration"           "20"
"active_cooldown"           "180"
"active_mana_cost"          "800"
```

**TypeScript implementation — `item_void_paradox.ts`:**

Item class (`item_void_paradox extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_void_paradox'`
- `OnSpellStart()` (the active — Paradox Shift):
  - Get intrinsic modifier, read its `deathStacks` count
  - Apply `modifier_item_void_paradox_active` for `active_duration` seconds with the current stack count stored in modifier creation params: `{ stacks: deathStacks }`

Passive modifier (`modifier_item_void_paradox extends BaseModifier`):
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- Internal field: `deathStacks: number = 0` — **must be persisted**. Since modifiers reset, store stacks in a custom net table or on the hero entity. Use `this.GetParent().SetModifierStackCount` approach — actually use `this.SetStackCount(n)` which is stored by the engine. Read via `this.GetStackCount()`.
- Base stats: STR, HEALTH_BONUS, HEALTH_REGEN_CONSTANT, PHYSICAL_ARMOR_BONUS, SPELL_AMPLIFY_PERCENTAGE
- Scaling stats added on top of base via `GetStackCount()`:
  - `GetModifierBonusStats_Strength()`: `base_str + (stackCount * stats_per_death)`
  - `GetModifierBonusStats_Agility()`: `stackCount * stats_per_death`
  - `GetModifierBonusStats_Intellect()`: `stackCount * stats_per_death`
  - `GetModifierPreAttack_BonusDamage()`: `stackCount * damage_per_death`
  - `GetModifierSpellAmplify_Percentage()`: `base_spell_amp + (stackCount * spell_amp_per_death)`
- `DeclareFunctions()`: all of the above + `ON_DEATH`
- `OnDeath(event)`:
  - Check `event.unit === this.GetParent()` (the item holder is the one dying)
  - `this.SetStackCount(this.GetStackCount() + 1)`
  - Refresh modifier stats: call `this.SendBuffRefreshToClients()`

Active boost modifier (`modifier_item_void_paradox_active extends BaseModifier`):
- Created with `{ stacks: N }` in params
- Stores `doubledStacks = params.stacks` in `OnCreated`
- `DeclareFunctions()`: STR, AGI, INT, PREATTACK_BONUS_DAMAGE, SPELL_AMPLIFY_PERCENTAGE
- Each getter returns `doubledStacks * per_death_value` (the EXTRA amount — doubles the stack effect for the duration)
- `GetTexture()`: `'item_void_paradox'`
- `IsHidden(): false`, visual particle on hero

---

### 5. `item_primordial_mandate` — Low-HP Berserker

**Recipe:** `item_dracula_mask` + `item_light_part` + recipe (5,000g)  
**Total cost:** ~52,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_TOGGLE` (the Blood Frenzy toggle). The Undying Will passive lives in the modifier.

**AbilityValues:**
```
"bonus_strength"            "130"
"bonus_agility"             "100"
"bonus_intellect"           "100"
"bonus_damage"              "250"
"bonus_health"              "2500"
"bonus_lifesteal"           "60"
"rage_damage_per_pct"       "0.8"
"rage_as_per_pct"           "0.8"
"rage_max_bonus"            "80"
"undying_will_cd"           "120"
"undying_will_damage"       "2500"
"undying_will_radius"       "700"
"undying_will_invis_dur"    "2.5"
"toggle_hp_drain"           "400"
"toggle_attack_speed"       "200"
"toggle_lifesteal"          "200"
"toggle_armor"              "50"
```

**TypeScript implementation — `item_primordial_mandate.ts`:**

Item class (`item_primordial_mandate extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_primordial_mandate'`
- `OnSpellStart()` (toggle activation):
  - Check if caster has `modifier_item_primordial_mandate_frenzy`
  - If yes: remove it (toggle off)
  - If no: apply it with no duration (permanent until toggled off)

Passive modifier (`modifier_item_primordial_mandate extends BaseModifier`):
- Base stats: STR, AGI, INT, PREATTACK_BONUS_DAMAGE, HEALTH_BONUS, plus lifesteal via `TOTALDAMAGEOUTGOING_PERCENTAGE` combined with custom lifesteal logic or `LIFESTEAL_AMPLIFY_PERCENTAGE`
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- `DeclareFunctions()`:
  - `PREATTACK_BONUS_DAMAGE` (base + rage scaling)
  - `ATTACKSPEED_BONUS_CONSTANT` (rage scaling)
  - `ON_ATTACKED` (for Undying Will trigger)
  - `ON_DEATH` — actually use `ON_TAKE_DAMAGE` to intercept lethal damage
  
- **Primal Fury scaling:**
  - `GetModifierPreAttack_BonusDamage()`:
    ```
    const parent = this.GetParent();
    const maxHp = parent.GetMaxHealth();
    const currentHp = parent.GetHealth();
    const missingPct = Math.max(0, (maxHp - currentHp) / maxHp * 100);
    const bonus = Math.min(rage_max_bonus, missingPct * rage_damage_per_pct);
    return base_damage + bonus_percent_of_base * bonus / 100; // approximate
    ```
    Actually: return base `bonus_damage` from the passive modifier separately; the rage scaling is an additional dynamic `PREATTACK_BONUS_DAMAGE` return.
    Simplest approach: `ThinkInterval` every 0.1s that reads HP%, sets a stored `rageBonus` value, then calls `SendBuffRefreshToClients()` to update modifier values.
    
- **Undying Will** — track via `undyingWillReady: boolean` (initialized true), `lastTriggered: number = 0`:
  - `DeclareFunctions()` includes `ON_TAKE_DAMAGE`
  - `OnTakeDamage(event)`:
    - If `event.unit !== this.GetParent()`: return
    - If `!this.undyingWillReady`: return
    - Check if damage would be lethal: `parent.GetHealth() - event.damage <= 0`
    - If lethal:
      - Set `undyingWillReady = false`
      - Schedule re-enable after `undying_will_cd` seconds
      - Set parent HP to 1: `parent.SetHealth(1)`
      - `event.damage = 0` — **Note:** this approach requires `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE` returning -100 for 1 frame. Better: use `DeclareFunctions ON_TAKE_DAMAGE` which fires AFTER damage; instead prevent with a rolling check. 
      - **Correct approach:** Add `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE` that returns 0 normally. When lethal damage is detected (HP <= damage), set a flag `blockNextDamage = true`, set HP to 1 via timer 0.0, return `-100` once from `GetModifierIncomingDamage_Percentage` to nullify the killing blow, then apply the Undying Will explosion and invulnerability.
      - Apply `modifier_item_primordial_mandate_invuln` for `undying_will_invis_dur` seconds (makes unit untargetable/invulnerable)
      - `ApplyDamage` pure `undying_will_damage` in `undying_will_radius` to all enemies

Frenzy toggle modifier (`modifier_item_primordial_mandate_frenzy extends BaseModifier`):
- `IsHidden(): false`, `IsPurgable(): false`
- `GetTexture()`: `'item_primordial_mandate'`
- `DeclareFunctions()`:
  - `ATTACKSPEED_BONUS_CONSTANT`: returns `toggle_attack_speed`
  - `PHYSICAL_ARMOR_BONUS`: returns `toggle_armor`
  - `HEALTH_REGEN_CONSTANT`: returns negative (drain is implemented via think)
- `OnIntervalThink()` (interval 0.1):
  - Drain `toggle_hp_drain * 0.1` HP from parent: `parent.SetHealth(parent.GetHealth() - drain_per_tick)`
  - If parent HP <= drain, kill them (don't drain below 1 — let Undying Will handle it)
  - Apply lifesteal: listen to `ON_ATTACK_LANDED`, on hit: `parent.SetHealth(parent.GetHealth() + damage * toggle_lifesteal / 100)`
- `GetEffectName()`: red aura particle

Invulnerability modifier (`modifier_item_primordial_mandate_invuln extends BaseModifier`):
- `CheckState()`: `{ INVULNERABLE: true, UNTARGETABLE: true }`
- `IsHidden(): false`, `IsPurgable(): false`
- Short duration, uses particle effect of death/rebirth

---

### 6. `item_thousand_cuts` — Simultaneous Multi-Target Attacks

**Recipe:** `item_sacred_trident` + `item_echo_sabre_2` + `item_hurricane_pike_2` + `item_fusion_agile` + recipe (0g)  
**Total cost:** ~40,000g  
**Behavior:** `DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE` (active buff)

**AbilityValues:**
```
"bonus_agility"             "100"
"bonus_strength"            "80"
"bonus_damage"              "200"
"bonus_attack_speed"        "200"
"bonus_attack_range"        "300"
"bat_reduction"             "0.3"
"passive_targets"           "4"
"passive_target_radius"     "550"
"passive_damage_pct"        "70"
"active_targets"            "10"
"active_attack_speed"       "200"
"active_ministun"           "0.3"
"active_duration"           "8"
"active_cooldown"           "20"
"active_mana_cost"          "300"
```

**TypeScript implementation — `item_thousand_cuts.ts`:**

Item class (`item_thousand_cuts extends BaseAbility`):
- `GetIntrinsicModifierName()` returns `'modifier_item_thousand_cuts'`
- `OnSpellStart()`:
  - Apply `modifier_item_thousand_cuts_active` for `active_duration` seconds to caster

Passive modifier (`modifier_item_thousand_cuts extends BaseModifier`):
- `RemoveOnDeath(): false`, `IsPurgable(): false`, `IsHidden(): true`
- `GetAttributes()`: `PERMANENT | MULTIPLE`
- `DeclareFunctions()`:
  - `STATS_AGILITY_BONUS`, `STATS_STRENGTH_BONUS`
  - `PREATTACK_BONUS_DAMAGE`
  - `ATTACKSPEED_BONUS_CONSTANT`
  - `ATTACK_RANGE_BONUS`
  - `BAT_OVERRIDE` — for BAT reduction: return `parent.GetBaseDayTimeVisionRange()... ` — actually use `MODIFIER_PROPERTY_BASEATTACK_TIME_CONSTANT` via `GetModifierBaseAttack_TimeConstant()`: `return -bat_reduction`
  - `ON_ATTACK_LANDED`
- `OnAttackLanded(event)`:
  - Guard: `event.attacker !== this.GetParent()`: return
  - Guard: `event.target` is an ally or not a unit: return
  - Check if active modifier is present to determine target count: `isActive = parent.HasModifier('modifier_item_thousand_cuts_active')`
  - `targetCount = isActive ? active_targets : passive_targets`
  - `FindUnitsInRadius(parent.GetTeamNumber(), event.target.GetAbsOrigin(), undefined, passive_target_radius, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO | DOTA_UNIT_TARGET_BASIC, ...)`
  - Filter out `event.target` (already being attacked normally), shuffle/sort, take up to `targetCount`
  - For each extra target: `ApplyDamage({ victim: extraTarget, attacker: parent, damage: event.damage * passive_damage_pct / 100, damage_type: DamageTypes.PHYSICAL, ability: this.GetAbility() })`
  - **Note:** Using `ApplyDamage` with `PHYSICAL` type applies armor reduction but NOT on-hit effects (lifesteal, crits, etc.). To trigger on-hit effects: use `parent.PerformAttack(extraTarget, true, true, true, true, false, false, true)` instead — this fires a real attack that triggers all on-hit modifiers.
  - If active and `ministun > 0`: apply a 0.3s stun modifier to each extra target
  - **Important:** Prevent infinite recursion — guard with a `isPerformingMultiAttack: boolean` flag, set true before performing extra attacks, reset after.

Active modifier (`modifier_item_thousand_cuts_active extends BaseModifier`):
- `IsHidden(): false`, `IsPurgable(): false`
- `GetTexture()`: `'item_thousand_cuts'`
- `DeclareFunctions()`: `ATTACKSPEED_BONUS_CONSTANT` returns `active_attack_speed`
- Visual: whirlwind/sword particle effect

---

## KV Blocks to Add to `npc_items_artifact.txt`

Append all 12 blocks at the end of the file (before the closing `}`):

```
// ============================================================
// NEW CUSTOM ITEMS — Reaper Soul, Curse of Ages, Chaos Engine,
//                    Void Paradox, Primordial Mandate, Thousand Cuts
// ============================================================

"item_recipe_reaper_soul"
{
    "ID"                    "11200"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_reaper_soul"
    "ItemCost"              "5000"
    "ItemRecipe"            "1"
    "ItemResult"            "item_reaper_soul"
    "ItemRequirements"
    {
        "01"    "item_forbidden_blade;item_consumable_gem"
    }
}

"item_reaper_soul"
{
    "BaseClass"             "item_lua"
    "ID"                    "11201"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_UNIT_TARGET"
    "AbilityUnitTargetTeam" "DOTA_UNIT_TARGET_TEAM_ENEMY"
    "AbilityUnitTargetType" "DOTA_UNIT_TARGET_HERO"
    "AbilityCastRange"      "700"
    "AbilityCooldown"       "30.0"
    "AbilityManaCost"       "400"
    "AbilityTextureName"    "item_reaper_soul"
    "ScriptFile"            "items/ts_items/item_reaper_soul"
    "ItemCost"              "45000"
    "ItemShopTags"          "damage;str;agi;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "reaper;soul;buyback"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_strength"        "80"
        "bonus_agility"         "100"
        "bonus_intellect"       "100"
        "bonus_damage"          "250"
        "bonus_armor"           "25"
        "buyback_deny_duration" "120"
        "condemn_duration"      "12"
        "condemn_buyback_deny"  "300"
        "condemn_gold_bonus"    "500"
    }
}

"item_recipe_curse_of_ages"
{
    "ID"                    "11202"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_curse_of_ages"
    "ItemCost"              "3000"
    "ItemRecipe"            "1"
    "ItemResult"            "item_curse_of_ages"
    "ItemRequirements"
    {
        "01"    "item_shadow_impact;item_light_part"
    }
}

"item_curse_of_ages"
{
    "BaseClass"             "item_lua"
    "ID"                    "11203"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_UNIT_TARGET"
    "AbilityUnitTargetTeam" "DOTA_UNIT_TARGET_TEAM_ENEMY"
    "AbilityUnitTargetType" "DOTA_UNIT_TARGET_HERO"
    "AbilityCastRange"      "600"
    "AbilityCooldown"       "30.0"
    "AbilityManaCost"       "500"
    "AbilityTextureName"    "item_curse_of_ages"
    "ScriptFile"            "items/ts_items/item_curse_of_ages"
    "ItemCost"              "50000"
    "ItemShopTags"          "int;str;damage;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "curse;ages;erosion"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_intellect"           "100"
        "bonus_strength"            "80"
        "bonus_agility"             "80"
        "bonus_spell_amp"           "50"
        "bonus_damage"              "250"
        "bonus_mana"                "1500"
        "hp_reduction_per_stack"    "80"
        "armor_reduction_per_10"    "3"
        "magic_resist_per_20"       "15"
        "active_instant_stacks"     "15"
    }
}

"item_recipe_chaos_engine"
{
    "ID"                    "11204"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_chaos_engine"
    "ItemCost"              "2000"
    "ItemRecipe"            "1"
    "ItemResult"            "item_chaos_engine"
    "ItemRequirements"
    {
        "01"    "item_dagon_ultra;item_hallowed_scepter;item_dark_part"
    }
}

"item_chaos_engine"
{
    "BaseClass"             "item_lua"
    "ID"                    "11205"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE"
    "AbilityCooldown"       "25.0"
    "AbilityManaCost"       "600"
    "AbilityTextureName"    "item_chaos_engine"
    "ScriptFile"            "items/ts_items/item_chaos_engine"
    "ItemCost"              "50000"
    "ItemShopTags"          "int;str;damage;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "chaos;engine;random;wild magic"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_intellect"           "120"
        "bonus_strength"            "80"
        "bonus_agility"             "80"
        "bonus_damage"              "200"
        "bonus_spell_amp"           "80"
        "bonus_mana"                "1500"
        "nuke_damage"               "900"
        "nuke_radius"               "700"
        "stun_duration"             "1.5"
        "polymorph_duration"        "2.0"
        "silence_duration"          "4.0"
        "meteor_damage"             "800"
        "slow_pct"                  "80"
        "slow_duration"             "3.0"
        "spell_resist_reduction"    "50"
        "spell_resist_duration"     "6.0"
    }
}

"item_recipe_void_paradox"
{
    "ID"                    "11206"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_void_paradox"
    "ItemCost"              "4000"
    "ItemRecipe"            "1"
    "ItemResult"            "item_void_paradox"
    "ItemRequirements"
    {
        "01"    "item_withered_spring;item_dark_part"
    }
}

"item_void_paradox"
{
    "BaseClass"             "item_lua"
    "ID"                    "11207"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE"
    "AbilityCooldown"       "180.0"
    "AbilityManaCost"       "800"
    "AbilityTextureName"    "item_void_paradox"
    "ScriptFile"            "items/ts_items/item_void_paradox"
    "ItemCost"              "50000"
    "ItemShopTags"          "str;health_pool;regen_health;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "void;paradox;death;stacks"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_strength"            "180"
        "bonus_health"              "2500"
        "bonus_health_regen"        "80"
        "bonus_armor"               "40"
        "bonus_spell_amp"           "60"
        "stats_per_death"           "70"
        "damage_per_death"          "120"
        "spell_amp_per_death"       "6"
        "active_duration"           "20"
    }
}

"item_recipe_primordial_mandate"
{
    "ID"                    "11208"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_primordial_mandate"
    "ItemCost"              "5000"
    "ItemRecipe"            "1"
    "ItemResult"            "item_primordial_mandate"
    "ItemRequirements"
    {
        "01"    "item_dracula_mask;item_light_part"
    }
}

"item_primordial_mandate"
{
    "BaseClass"             "item_lua"
    "ID"                    "11209"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_TOGGLE"
    "AbilityTextureName"    "item_primordial_mandate"
    "ScriptFile"            "items/ts_items/item_primordial_mandate"
    "ItemCost"              "52000"
    "ItemShopTags"          "str;agi;damage;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "primordial;mandate;berserker;frenzy"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_strength"            "130"
        "bonus_agility"             "100"
        "bonus_intellect"           "100"
        "bonus_damage"              "250"
        "bonus_health"              "2500"
        "bonus_lifesteal"           "60"
        "rage_damage_per_pct"       "0.8"
        "rage_as_per_pct"           "0.8"
        "rage_max_bonus"            "80"
        "undying_will_cd"           "120"
        "undying_will_damage"       "2500"
        "undying_will_radius"       "700"
        "undying_will_invis_dur"    "2.5"
        "toggle_hp_drain"           "400"
        "toggle_attack_speed"       "200"
        "toggle_lifesteal"          "200"
        "toggle_armor"              "50"
    }
}

"item_recipe_thousand_cuts"
{
    "ID"                    "11210"
    "Model"                 "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName"    "item_recipe_thousand_cuts"
    "ItemCost"              "0"
    "ItemRecipe"            "1"
    "ItemResult"            "item_thousand_cuts"
    "ItemRequirements"
    {
        "01"    "item_sacred_trident;item_echo_sabre_2;item_hurricane_pike_2;item_fusion_agile"
    }
}

"item_thousand_cuts"
{
    "BaseClass"             "item_lua"
    "ID"                    "11211"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE"
    "AbilityCooldown"       "20.0"
    "AbilityManaCost"       "300"
    "AbilityTextureName"    "item_thousand_cuts"
    "ScriptFile"            "items/ts_items/item_thousand_cuts"
    "ItemCost"              "40000"
    "ItemShopTags"          "agi;str;damage;attack_speed;hard_to_tag"
    "ItemQuality"           "artifact"
    "ItemAliases"           "thousand;cuts;multi;attack"
    "ItemDeclarations"      "DECLARE_PURCHASES_TO_TEAMMATES | DECLARE_PURCHASES_IN_SPEECH | DECLARE_PURCHASES_TO_SPECTATORS"
    "AbilityValues"
    {
        "bonus_agility"             "100"
        "bonus_strength"            "80"
        "bonus_damage"              "200"
        "bonus_attack_speed"        "200"
        "bonus_attack_range"        "300"
        "bat_reduction"             "0.3"
        "passive_targets"           "4"
        "passive_target_radius"     "550"
        "passive_damage_pct"        "70"
        "active_targets"            "10"
        "active_attack_speed"       "200"
        "active_ministun"           "0.3"
        "active_duration"           "8"
    }
}
```

---

## Localization to Add to `addon_english.txt`

Add before the closing `}` of the file:

```
// ─── Reaper Soul ───────────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_reaper_soul"                              "Reaper's Soul"
"DOTA_Tooltip_Ability_item_reaper_soul_Description"                  "<h1>Passive: Death Sentence</h1>Heroes you kill cannot buy back for %buyback_deny_duration% seconds. If they waste their buyback window, you gain %condemn_gold_bonus% gold.\n<h1>Active: Condemn</h1>Mark a target hero for %condemn_duration% seconds. If they die while marked, their buyback is denied for %condemn_buyback_deny% seconds."
"DOTA_Tooltip_Ability_item_reaper_soul_Lore"                         "The coin for the ferryman was never paid back."
"DOTA_Tooltip_Ability_item_reaper_soul_bonus_strength"               "+$str"
"DOTA_Tooltip_Ability_item_reaper_soul_bonus_agility"                "+$agi"
"DOTA_Tooltip_Ability_item_reaper_soul_bonus_intellect"              "+$int"
"DOTA_Tooltip_Ability_item_reaper_soul_bonus_damage"                 "+$damage"
"DOTA_Tooltip_Ability_item_reaper_soul_bonus_armor"                  "+$armor"
"DOTA_Tooltip_Ability_item_reaper_soul_buyback_deny_duration"        "BUYBACK DENY DURATION:"
"DOTA_Tooltip_Ability_item_reaper_soul_condemn_duration"             "CONDEMN DURATION:"
"DOTA_Tooltip_modifier_item_reaper_soul_condemned"                   "Condemned"
"DOTA_Tooltip_modifier_item_reaper_soul_condemned_Description"       "Death will deny your buyback."

// ─── Curse of Ages ─────────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_curse_of_ages"                            "Curse of Ages"
"DOTA_Tooltip_Ability_item_curse_of_ages_Description"                "<h1>Passive: Erosion</h1>Attacks permanently reduce target's maximum HP by %hp_reduction_per_stack%. Every 10 stacks also reduces armor by %armor_reduction_per_10%. Every 20 stacks also reduces magic resistance by %magic_resist_per_20%%%. Resets on target death.\n<h1>Active: Ancient Wither</h1>Instantly apply %active_instant_stacks% erosion stacks to the target."
"DOTA_Tooltip_Ability_item_curse_of_ages_Lore"                       "Time claims all things. You merely accelerate the process."
"DOTA_Tooltip_Ability_item_curse_of_ages_bonus_intellect"            "+$int"
"DOTA_Tooltip_Ability_item_curse_of_ages_bonus_strength"             "+$str"
"DOTA_Tooltip_Ability_item_curse_of_ages_bonus_agility"              "+$agi"
"DOTA_Tooltip_Ability_item_curse_of_ages_bonus_damage"               "+$damage"
"DOTA_Tooltip_Ability_item_curse_of_ages_bonus_spell_amp"            "+$spell_amp%%"
"DOTA_Tooltip_Ability_item_curse_of_ages_hp_reduction_per_stack"     "HP REDUCTION PER STACK:"
"DOTA_Tooltip_modifier_item_curse_of_ages_stack"                     "Curse of Ages"
"DOTA_Tooltip_modifier_item_curse_of_ages_stack_Description"         "Maximum HP, armor, and magic resistance are being eroded."

// ─── Chaos Engine ──────────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_chaos_engine"                             "Chaos Engine"
"DOTA_Tooltip_Ability_item_chaos_engine_Description"                 "<h1>Passive: Wild Magic</h1>Every spell cast triggers a bonus effect cycling through 8 outcomes: AOE nuke, AOE stun, polymorph, global silence, meteor, mass slow, spell resist shred, or ability refresh.\n<h1>Active: Load the Dice</h1>Advance the cycle by one step, previewing what the next Wild Magic effect will be."
"DOTA_Tooltip_Ability_item_chaos_engine_Lore"                        "Magic has no rules. It only has consequences."
"DOTA_Tooltip_Ability_item_chaos_engine_bonus_intellect"             "+$int"
"DOTA_Tooltip_Ability_item_chaos_engine_bonus_strength"              "+$str"
"DOTA_Tooltip_Ability_item_chaos_engine_bonus_agility"               "+$agi"
"DOTA_Tooltip_Ability_item_chaos_engine_bonus_damage"                "+$damage"
"DOTA_Tooltip_Ability_item_chaos_engine_bonus_spell_amp"             "+$spell_amp%%"

// ─── Void Paradox ──────────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_void_paradox"                             "Void Paradox"
"DOTA_Tooltip_Ability_item_void_paradox_Description"                 "<h1>Passive: Paradox Growth</h1>Each time you die, permanently gain +%stats_per_death% all stats, +%damage_per_death% damage, and +%spell_amp_per_death%%% spell amp. No limit.\n<h1>Active: Paradox Shift</h1>Instantly revive at full HP. For %active_duration% seconds, your current death stacks are doubled."
"DOTA_Tooltip_Ability_item_void_paradox_Lore"                        "Every ending is a beginning. He had died enough times to know."
"DOTA_Tooltip_Ability_item_void_paradox_bonus_strength"              "+$str"
"DOTA_Tooltip_Ability_item_void_paradox_bonus_health"                "+$health"
"DOTA_Tooltip_Ability_item_void_paradox_bonus_armor"                 "+$armor"
"DOTA_Tooltip_Ability_item_void_paradox_bonus_spell_amp"             "+$spell_amp%%"
"DOTA_Tooltip_Ability_item_void_paradox_stats_per_death"             "ALL STATS PER DEATH:"
"DOTA_Tooltip_Ability_item_void_paradox_damage_per_death"            "DAMAGE PER DEATH:"
"DOTA_Tooltip_modifier_item_void_paradox"                            "Paradox Growth"
"DOTA_Tooltip_modifier_item_void_paradox_Description"                "Power grows with each death."
"DOTA_Tooltip_modifier_item_void_paradox_active"                     "Paradox Shift"
"DOTA_Tooltip_modifier_item_void_paradox_active_Description"         "Death stacks are doubled."

// ─── Primordial Mandate ────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_primordial_mandate"                       "Primordial Mandate"
"DOTA_Tooltip_Ability_item_primordial_mandate_Description"           "<h1>Passive: Primal Fury</h1>For each 1%% of max HP missing, gain +%rage_damage_per_pct%%% damage and +%rage_as_per_pct%%% attack speed (max +%rage_max_bonus%%).\n<h1>Passive: Undying Will</h1>Once per %undying_will_cd%s: when a killing blow would slay you, survive with 1 HP, become untargetable for %undying_will_invis_dur%s, and deal %undying_will_damage% pure damage in %undying_will_radius% AoE.\n<h1>Toggle: Blood Frenzy</h1>Drain %toggle_hp_drain% HP/s to gain +%toggle_attack_speed%%% attack speed, +%toggle_lifesteal%%% lifesteal, and +%toggle_armor% armor."
"DOTA_Tooltip_Ability_item_primordial_mandate_Lore"                  "The more it bleeds, the more it hungers."
"DOTA_Tooltip_Ability_item_primordial_mandate_bonus_strength"        "+$str"
"DOTA_Tooltip_Ability_item_primordial_mandate_bonus_agility"         "+$agi"
"DOTA_Tooltip_Ability_item_primordial_mandate_bonus_damage"          "+$damage"
"DOTA_Tooltip_Ability_item_primordial_mandate_bonus_health"          "+$health"
"DOTA_Tooltip_Ability_item_primordial_mandate_rage_max_bonus"        "MAX RAGE BONUS:"
"DOTA_Tooltip_modifier_item_primordial_mandate_frenzy"               "Blood Frenzy"
"DOTA_Tooltip_modifier_item_primordial_mandate_frenzy_Description"   "Draining HP for increased attack speed, lifesteal, and armor."
"DOTA_Tooltip_modifier_item_primordial_mandate_invuln"               "Undying Will"
"DOTA_Tooltip_modifier_item_primordial_mandate_invuln_Description"   "Risen from the brink."

// ─── Thousand Cuts ─────────────────────────────────────────────────────────
"DOTA_Tooltip_Ability_item_thousand_cuts"                            "Thousand Cuts"
"DOTA_Tooltip_Ability_item_thousand_cuts_Description"                "<h1>Passive: Blade Storm</h1>Each attack simultaneously strikes up to %passive_targets% additional nearby enemies within %passive_target_radius% range for %passive_damage_pct%%% damage. Each hit is a real attack — triggers on-hit effects, crits, and lifesteal.\n<h1>Active: Tempest</h1>For %active_duration%s, strike up to %active_targets% enemies per attack, gain +%active_attack_speed%%% attack speed, and each hit applies a %active_ministun%s ministun."
"DOTA_Tooltip_Ability_item_thousand_cuts_Lore"                       "It was not one strike that won the war. It was every strike, everywhere, at once."
"DOTA_Tooltip_Ability_item_thousand_cuts_bonus_agility"              "+$agi"
"DOTA_Tooltip_Ability_item_thousand_cuts_bonus_strength"             "+$str"
"DOTA_Tooltip_Ability_item_thousand_cuts_bonus_damage"               "+$damage"
"DOTA_Tooltip_Ability_item_thousand_cuts_bonus_attack_speed"         "+$attack_speed"
"DOTA_Tooltip_Ability_item_thousand_cuts_bonus_attack_range"         "+$range"
"DOTA_Tooltip_Ability_item_thousand_cuts_passive_targets"            "EXTRA TARGETS:"
"DOTA_Tooltip_Ability_item_thousand_cuts_passive_damage_pct"         "%%DAMAGE PER EXTRA TARGET:"
"DOTA_Tooltip_modifier_item_thousand_cuts_active"                    "Blade Tempest"
"DOTA_Tooltip_modifier_item_thousand_cuts_active_Description"        "Striking all nearby enemies with every attack."
```

For `addon_schinese.txt` and `addon_russian.txt`: copy the same keys, use the English strings as placeholder values (the implementing agent should translate or leave as-is for a later pass).

---

## `game/scripts/shops.txt` Changes

In the `"artifacts"` section (around line 282), add all six items:

```
"item"      "item_reaper_soul"          // 死神之魂
"item"      "item_curse_of_ages"        // 岁月诅咒
"item"      "item_chaos_engine"         // 混沌引擎
"item"      "item_void_paradox"         // 虚空悖论
"item"      "item_primordial_mandate"   // 原初天命
"item"      "item_thousand_cuts"        // 千刃
```

---

## Implementation Notes for the Agent

### Patterns to follow
- Import style: copy `item_beast_helmet.ts` exactly — same imports from `../../utils/dota_ts_adapter`
- All modifier registrations use `@registerModifier('items/ts_items/item_NAME.lua')` with the `.lua` extension (TSTL compiles TS → Lua)
- All item classes use `@registerAbility()` decorator (no argument)
- Use `BaseItemModifier` (from `./base_item_modifier`) for modifiers that provide stat bonuses; use plain `BaseModifier` for temporary effect modifiers
- `GetSpecialValueFor` is the correct way to read KV values from the item ability

### Critical implementation traps

1. **item_reaper_soul:** The `SetBuybackCooldownTime` API sets the TIME REMAINING on the cooldown, not the cooldown duration. Pass the value directly. Check `event-buyback.ts` in `src/vscripts/modules/event/` to understand how the game's existing buyback system interacts — do not break the `MEMBER_BUYBACK_CD` logic. The reaper soul should only EXTEND cooldown time, not interfere with member buyback reduction.

2. **item_curse_of_ages stacks:** The stack modifier lives on the ENEMY target. Use `GetStackCount()` / `SetStackCount()` on a single persistent modifier instance (merge new applications into the existing one rather than creating multiple modifier instances).

3. **item_chaos_engine effect index:** Store `cycleIndex` as a plain TypeScript field on the modifier class. Since Lua/TSTL doesn't persist object fields across hot-reloads, also store it via `SetStackCount()` so it persists properly.

4. **item_void_paradox death stacks:** Same as above — use `SetStackCount()` to persist death count across modifier refreshes. The `ON_DEATH` event fires with `event.unit` being the dying unit.

5. **item_primordial_mandate death prevention:** Do not use `ON_DEATH` to prevent death (fires after death). Instead: `OnIntervalThink` at 0.05s interval — if `parent.GetHealth() <= 0` and `undyingWillReady`, restore HP to 1 and trigger the effect. Alternatively use `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE` returning -100 when HP would drop to 0.

6. **item_thousand_cuts recursion guard:** The `isPerformingMultiAttack` flag MUST be checked at the very start of `OnAttackLanded` to prevent the additional `PerformAttack` calls from recursively triggering this handler again. Use a module-level boolean or a flag on the modifier class instance.

### Texture files
Textures (`item_reaper_soul.png` etc.) do not exist yet. Use an existing texture as placeholder in `AbilityTextureName` — suggested placeholders:
- `item_reaper_soul` → use `"item_reaper_soul"` (will show broken icon until art is added — acceptable)
- Or temporarily point to `"item_skadi"`, `"item_bloodthorn"` etc.

The engine will not crash on missing textures, it will just show a fallback icon.

### Testing order
Implement and test in this order (simplest to most complex):
1. `item_thousand_cuts` — pure on-hit logic, no events, easiest to verify
2. `item_curse_of_ages` — on-hit stack modifier, verify stack merging
3. `item_void_paradox` — death event + stack persistence
4. `item_reaper_soul` — buyback API, verify interaction with event-buyback.ts
5. `item_chaos_engine` — cycling effects, test each of the 8 effects in isolation
6. `item_primordial_mandate` — death prevention is the hardest part, test toggle separately first
