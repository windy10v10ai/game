---
name: custom-ability
description: "Implement a new TypeScript ability from scratch. Use for original custom abilities; use clone-ability for vanilla inheritance and awaken-ability for awakening slot replacements."
---

# Custom ability (made from scratch)

Write a **new**ability (no inheritance of vanilla values, no awakening replacement). First use the following table to confirm whether this is the skill you should use:

| scene                                                                                       | skill            |
| ------------------------------------------------------------------------------------------- | ---------------- |
| Inherit vanilla abilitydelta override to change value/behavior (`BaseClass` = vanilla name) | `clone-ability`  |
| awakening stone replacement/insertion into hero ability slot                                | `awaken-ability` |
| **Made from scratch** (TS `@registerAbility`, KV `BaseClass` = `ability_lua`)               | **This skill**   |

> icon, localization, KV tab indentation, `#base` introduction, ability system name search, reference file path - all see `add-image` skill, `game/scripts/npc/CLAUDE.md` and `game/resource/CLAUDE.md`, this article will not repeat them.

---

## Step 1: Check reuse first Before writing

, go through `../shared-references/vanilla-modifiers.md` yourself first - the vanilla modifier is the engine's native C++. If you can choose it, you don't need to implement it yourself, and you don't need to ask the user for it. Commonly used abilities are listed in the "General Status" section: stun, imprisoned, silenced, invincible, knockback, timed death, magic immunity, and the ready-made effects in the "vanilla ability modifier" section (backstab, frost arrow slowdown, anchor strike instant mark). The

list only includes the ones already in use in this repository, not the complete set. If there is no corresponding capability but vanilla does have it, click "How to find it outside the table" of the file to find the modifier name and try again.

## Step 2: Implementation method selection

**Always use TS (TSTL) when adding new files from scratch** - type safe, jest-capable, and able to reuse the helpers and types of `src/`; ts compilation is not a burden (the development environment compiles automatically).

| Situation                          | What to do                                   |
| ---------------------------------- | -------------------------------------------- |
| **Added from scratch** (mostly)    | **TS**                                       |
| Already implemented in pure Lua    | **Keep Lua**, no forced migration, no profit |
| Existing DataDriven implementation | **Keep DataDriven**, maintenance only        |

`ability_datadriven` **Not used for new writing from scratch**: Ability usually does not have a resident attribute bonus, and the declarative advantage of DataDriven cannot be used, but type checking is lost. The same goes for pure Lua, which has neither types nor declarative convenience, which is the worst combination.

> **Exception: When the ability really needs to be attached to the resident numerical attribute**, each `GetModifier*` of the Lua/TS modifier is "the engine checks once → returns to Lua once", and it will be stuck when there are many units. If there are few units of action (a few summons), you can follow the same instructions. `OnCreated` caches the value once, and `GetModifier*` returns to the cache (refer to Witch Doctor awakening `special_bonus_unique_witch_doctor_upgrade`, Death Guard press spell amp to amplify the attack). It is worth changing to KV `Modifiers`→`Properties` only when it has a large scope of effect and is a purely static constant; for the complete selection on the item side, please see the "Callback Tax" section of the `custom-item` skill.

---

## Step 3: Skeleton

implements `src/vscripts/abilities/` (example `src/vscripts/abilities/ts_abilities/ward_slot/`), automatically registers with decorator, and extends `BaseAbility` / `BaseModifier` from `utils/dota_ts_adapter`:

```ts
import { BaseAbility, registerAbility } from "../../utils/dota_ts_adapter";

@registerAbility("my_ability")
export class MyAbility extends BaseAbility {
  OnSpellStart(): void {
    /* ... */
  }
}
```

KV `BaseClass` writes `ability_lua` and `ScriptFile` to point to the TSTL compilation product path `abilities/ts_abilities/<name>`. Engine enumeration members use normalized names (`UnitFilterResult.FAIL_CUSTOM`, see `src/vscripts/CLAUDE.md`).

Passive ability standard writing: `GetIntrinsicModifierName()` returns a hidden built-in modifier, which takes effect without learning. All adjustable values ​​​​are read from KV `AbilityValues`.

<details>
<summary>Maintain the skeleton of existing DataDriven/pure Lua ability (not used for new writing from scratch)</summary>

DataDriven: KV directly writes `Modifiers`, and uses `%key` to reference `AbilityValues` for the value; when it contains logic, use `OnAbilityExecuted` / `OnIntervalThink` and other event blocks `RunScript` to transfer a Lua segment.

```
"my_ability"
{
    "BaseClass"             "ability_datadriven"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_PASSIVE"
    "AbilityValues" { "bonus_armor" "10" }
    "Modifiers"
    {
        "modifier_my_ability"
        {
            "Passive"           "1"
            "IsHidden"          "1"
            "RemoveOnDeath"     "0"
            "Properties" { "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS" "%bonus_armor" }
        }
    }
}
```

Pure Lua: implement `game/scripts/vscripts/abilities/<name>.lua`, `class({})` + `LinkLuaModifier`, **without TSTL**, complete hot reloading of `script_reload`. KV `BaseClass` = `ability_lua`, `ScriptFile` = `abilities/<name>`.

</details>

---

## Advanced techniques

autocast automatically triggers (shared base class `AutoCastAbility`), monitors a certain ability to cast spells, adds magic to avoid BKB, `special_bonus` only takes effect when a specific ability is used, and borrows the native hardcoded modifier - these are currently only used by awakeningability, concentrated in `../awaken-ability/references/advanced-techniques.md`, check by title when needed.

### ballistic hit determination: use native `OnProjectileHit`

`ProjectileManager:CreateTrackingProjectile` / `CreateLinearProjectile` After passing in `Ability = self`, the engine will automatically call `OnProjectileHit(target, location)` of the ability class when the ballistic trajectory actually hits the target (if `ExtraData` is passed during creation, it will be `OnProjectileHit_ExtraData(target, location, data)`). Damage/stun and other hit effects are written in this callback for settlement. **Don't** hand calculate "distance ÷ movement speed" when `travel_time` is opened again and `Timers:CreateTimer` is triggered delayed - that is just an estimate. The target's mid-displacement/flash will deviate, and the target's dodge judgment cannot be respected. `bIsAttack = true` will not let the engine automatically calculate the damage of an attack repeatedly, and manual `ApplyDamage` / `PerformAttack` in the callback will not conflict. Reference `heroes/hero_sniper/sniper_assassinate_upgrade.lua`.

---

## Closing

- **Icons / Localization / `#base` introduces new KV files** → See `add-image` skill and `game/resource/CLAUDE.md`.
- **Enter lottery pool** → Add ability name to `src/vscripts/modules/lottery/lottery-abilities.ts` (and `lottery-abilities-bot.ts`).
- **bot knows how to use** → see `bot-ability-usage`.
- **Verification** → Run `npm run build:vscripts` once at the end to see if an error is reported, and do not read the compiled product; the runtime behavior depends on jest (own branch logic) + Dota tools running. When maintaining pure Lua, `script_reload` actually runs.

## Ask when unclear

Use the `AskUserQuestion` menu to confirm, do not assume: Is

- ability a passive attribute, active logic or a mixture?
- Whether the active skill is made into autocast and automatically triggered
- Is the value "effective globally for this hero" or "effective only when having a certain ability"
