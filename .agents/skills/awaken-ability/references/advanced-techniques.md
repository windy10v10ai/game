# awakening advanced techniques

is for `awaken-ability` to check on demand, and the main process does not need to be read through. Each item has a real implementation reference (Axe, Drow, PA, Shadow Demon, Ancient Titan, etc.).

### Advanced 1: Inherit the original ability level when inserting or adding

replacement branch naturally inherits the original ability level, but the **Insert/Add** branch defaults to `newLevel`, and the initial level does not follow the associated ability. When full level correlation is required (such as awakeningability and a certain ultimate being upgraded simultaneously), two-step matching is required:

1. **KV bidirectional `LinkedAbility`** (level synchronization during upgrade) - In the association ability of `npc_abilities_override.txt` and the awakeningability of `npc_abilities_custom_awaken.txt`, add a line on each side to point to the other side:

   ```
   "LinkedAbility" "Partner ability_name" // Two-way linkage and synchronous upgrade
   ```

   and `MaxLevel` of the two abilities must be consistent.

2. **Configuration `inheritLevelFrom`** (Inherit the initial level when adding) - `awaken-config.ts` Add this article:
   ```ts
   inheritLevelFrom: 'Association ability_name',
   ```
   `resolveNewLevel` will take the current level of the associated ability as the initial level when adding a new ability (evaluated before removing any ability, so `inheritLevelFrom` can be the ability inserted into the slot).

> Reference: Ax `axe_auto_culling_blade` ↔ `axe_culling_blade`.

> **Do not use `Innate "1"` + `DependentOnAbility` instead of `LinkedAbility`**: Officially, this combination is used in scenarios where "new ability is one level more than related ability" (Guchenshan Absolute Zero innate, Mars Sidekick), but those are the innate ability thresholds that come with the birth of a hero. The awakeningability of this project is dynamically added at runtime using the awakening stone `AddAbility()`. It is not a native innate threshold - adding `Innate "1"` to it. Actual testing will cause the ability/buff icon not to be displayed (Drow Ranger Shadow Arrow has stepped on awakening and has given up and returned to a fixed level). In the level correlation scenario, the above `LinkedAbility` + `inheritLevelFrom` (`MaxLevel` on both sides needs to be consistent); if the new ability wants to be one level more than the correlation ability, the priority is to change it to a fixed value/ungraded rather than introducing `DependentOnAbility`.

### Advanced 2: autocast automatically triggers (automatic casting)

"Automatically detect and cast after turning on autocast" class awakening, **there is already a shared base class `AutoCastAbility` (`src/vscripts/abilities/ts_abilities/shared/auto-cast-ability.ts`), inherit it directly, don't reinvent the wheel**:

- KV: `BaseClass ability_lua`, `AbilityBehavior` = `NO_TARGET | IMMEDIATE | AUTOCAST`, `ScriptFile` point to the `abilities/ts_abilities/...` compilation product, **do not write `Modifiers`** (intrinsic modifier is provided by the base class).
- inherits `AutoCastAbility` and only implements `OnAutoCastThink(caster)`; override `getThinkInterval()` (default 0.3) when needed. Sharing `modifier_autocast_think` is responsible for the callback after guarding `IsServer / IsAlive / GetAutoCastState`.
- base class helper: `getFullCastRange` (including cast distance enhancement), `findEnemiesInRange(caster, range, targetType, allowMagicImmune?)` (always excludes fog/invisibility, optional magic immunity on hit), `castImmediatelyOnTarget`.
- is cast with **`CastAbilityImmediately`**: The background of the player's hero is automatically cast **not** in order (`CastAbilityOnTarget`, etc. will interrupt the player's movement/attack). The new base class/helper is unified into `ts_abilities/shared/`.

> Reference: Ax `ts_abilities/axe_auto_culling_blade.ts` (kill line threshold + magic immunity), Zeus `ts_abilities/special_bonus_unique_zuus_upgrade.ts` (hero priority, lightning strike only for heroes, no magic immunity).

### Advanced 3: Monitor an ability to trigger the effect after casting a spell

needs to have an effect "after the hero casts a specific ability". The following two implementations are **not equivalent options**: monitoring + causing damage is **logical**, and **adding new ones from scratch will always use TS**; the DataDriven section is only an example of "maintaining existing datadriven ability", do not write new ones from scratch based on this.

- **TS intrinsic modifier (first choice added from scratch)**: The modifier of `@registerModifier` declares the event in `DeclareFunctions`, and determines `event.unit == parent` and `event.ability.GetAbilityName() == "targetability_name"` in the callback. Does not rely on ability behavior and is the most versatile. **First think about the triggering time and choose the right event**:
  - `MODIFIER_EVENT_ON_ABILITY_START` → `OnAbilityStart`: Triggered as soon as the forward shake starts** (the player can cancel the spell before the forward shake ends). It is only suitable for effects that require a pre-roll period to take effect (such as pre-roll adding magic to avoid interruption, see Shadow Demon's existing awakening). **Don't\*\* use it to resolve additional damage - the player can cancel the cast and it will be for nothing.
  - `MODIFIER_EVENT_ON_ABILITY_FULLY_CAST` → `OnAbilityFullyCast`: **The real OnSpellStart** is not triggered until the forward swing is completed, which is equivalent to "release completed". Always use this for additional damage/additional effects. When the target ability is pointed at a single target, the damage value can be directly `event.ability.GetSpecialValueFor("xxx")` to read the value of the current level of the trigger ability. It will naturally follow its level/scepter/talent grading, and there is no need to bring its own KV value.
  - `MODIFIER_EVENT_ON_ABILITY_END_CHANNEL` → `OnAbilityEndChannel`: **Boot End** triggers, and will be pushed when the reading bar is completed and interrupted/actively cancelled. For awakening that only takes effect during the boot period (such as the magic exemption during the boot period), use `FULLY_CAST` to open and `END_CHANNEL` to receive. **Do not write polling** - there is no `IsChannelling` on `CDOTA_BaseNPC` (only `CDOTABaseAbility.IsChanneling()`). If you write it according to the polling idea, it will not compile. Use `event.ability.GetChannelTime()` to apply for the duration, and hand over the actual recovery to `END_CHANNEL`. Reference: Ice Girl `special_bonus_unique_crystal_maiden_upgrade`.
- **DataDriven modifier (only to maintain existing)**: KV `Modifiers` plus `"Passive" "1"` resident modifier (with `"RemoveOnDeath" "0"` + `"Attributes" "MODIFIER_ATTRIBUTE_PERMANENT"`), using **`OnAbilityExecuted`** to block `RunScript`. The ability being cast is **`keys.event_ability`** (not `keys.ability`), the caster is `keys.caster`. Active skills (such as `UNIT_TARGET`) will also be permanently triggered.

> **Key Pitfall**: Do not superimpose the active skill `AbilityBehavior` on `DOTA_ABILITY_BEHAVIOR_PASSIVE` in order to keep the listener resident - actual testing will make the active skill **unable to be cast**. DataDriven's `Passive` modifier does not rely on ability behavior and can be resident, just maintain the original active behavior.

> **Key Pit**: If you want to add another **DataDriven modifier defined in **the same ability KV `Modifiers` in `RunScript` of `OnAbilityExecuted` (such as a limited time damage reduction buff), you must use `ability:ApplyDataDrivenModifier(caster, target, "modifier_name", {})`, and **cannot** use the general `unit:AddNewModifier(...)` - use `AddNewModifier` When loading the modifier defined by DataDriven, the modifier itself will not be loaded (it is not that the KV placeholder parsing fails, but that the entire modifier does not take effect), and the buff icon does not appear in the status bar. `AddNewModifier` is only applicable to borrowing other ability/native hardcoded modifiers (see Advanced 7), and is not applicable to the DataDriven modifier defined in your own KV.

> Reference: Shadow Demon `ability_lua` + `GetIntrinsicModifierName` monitor `nevermore_requiem`; `modifier_pa_awaken_dagger_listener` of PA `ability_datadriven` (`UNIT_TARGET`, without PASSIVE) use `OnAbilityExecuted`; Zeus `special_bonus_unique_zuus_upgrade` Is a PASSIVE datadriven listening example.

### Advanced 4: The value only takes effect after awakening (special_bonus related)

If you want a certain KV value of the original ability to "only change when the hero has awakeningability" (a fixed value that cannot be changed cleanly at runtime, such as projectile speed), use the **awakeningability name** as the `special_bonus` key to write the original ability override KV:

```
"dagger_speed"
{
    "value"                                         "1200"
"special_bonus_unique_phantom_assassin_upgrade" "=2100" // Overwrite after awakening
}
```

`=value` covers, `+value` increases, and `+N%` is also supported by percentage increase (for example, `+100%` means doubling. There are a lot of vanilla talent precedents in the project, such as `special_bonus_unique_dragon_knight_9 "+120%"`) - Use this when multi-tier fields need to be scaled proportionally as a whole. There is no need to manually calculate the absolute value of each tier before writing an array. The engine automatically applies it when it detects that the hero has the ability of the key with the same name.

> **Key pitfall: key must be the ability name prefixed by `special_bonus_`**. The engine relies on the prefix to identify which subkeys are "bonus overrides". Subkeys other than this prefix are treated as irrelevant metadata and **silently ignored** (the value remains unchanged and no error is reported). Even if awakeningability is a common learnable active skill (such as PA `special_bonus_unique_phantom_assassin_upgrade` is `UNIT_TARGET` active), as long as the name has a prefix, it can be used as a key; on the contrary, if the awakeningability name without a prefix (such as the previously used `sniper_assassinate_upgrade`) is written in, it will not take effect, and the awakeningability** must be renamed** to `special_bonus_unique_*` (along with changing the lottery pool reference, Lua Class name, localization key; ScriptFile path/Lua file name can be left unchanged, only ability class name in the file is synchronized). This key ability must also be owned by the hero and have level ≥ 1 before it can be applied.

> **The same value block can be hung with multiple `special_bonus_` keys, but the engine only applies the first hit ** in the block, so the awakening key must be ranked after `value` and before other keys. Before starting, read the entire section of the ability according to the method of `update-abilities-override` skill (override delta override + `docs/reference/<version>/heroes/` vanilla complete set, **vanilla keys will be merged in, only looking at override will leak**), and confirm which `special_bonus_*` are already in the block (common sources: vanilla talents, magic crystals, scepters, other awakenings). Ranking first means that all other bonuses on this field will be invalid after awakening. If it is unacceptable, change to a clean field, or use other implementation methods (DataDriven Modifiers / TS).

> **The original vanilla keys in the block must be explicitly rewritten one by one in override and ranked after the awakening keys**. Just writing the awakening key into override is not enough - vanilla keys that are not explicitly declared by override will be queued **before** the awakening key when merging, and awakening will also fail silently. The only function of these rewritten lines is to fix the key sequence, and they must be commented to prevent them from being cleared up redundantly by subsequent "delta override" (writing values ​​that are different from vanilla can add an extra layer of insurance).

> Actual measurement: `attack_count` of `tiny_tree_grab` originally had the vanilla talent `special_bonus_unique_tiny_6` and the magic crystal key. When the awakening key was ranked third, it **silently failed** (no error, the value remained unchanged); it only took effect after the awakening key was mentioned to `value` and the vanilla talent key was explicitly rewritten after it.

> Reference: PA awakening and hidden thorn `dagger_speed` 1200→2100; sniper `special_bonus_unique_sniper_assassinate_upgrade` headshot after awakening `proc_chance` `=100`.

### Advanced 5: Add magic to avoid but does not replace the real BKB

When adding magic immunity to a hero, directly `AddNewModifier("modifier_black_king_bar_immune")` will shorten/top off the player's own BKB. Always use the global tool function (`game/scripts/vscripts/util.lua`):

```lua
ApplyAwakenMagicImmunity(unit, ability, duration)
```

Skip when there is equal or longer BKB, otherwise add magic + play sound effect, **return whether it is actually applied**.

**TS code is given priority to use the existing TS package**: `applyAwakenMagicImmunity(unit, ability, duration)` exported by `src/vscripts/abilities/ts_abilities/shared/awaken-magic-immunity.ts` is the native TS implementation of the same logic (it also borrows `modifier_black_king_bar_immune` and does not replace the real BKB). Just reuse `import` directly. Do not bind `declare function` to Lua. The big picture. The difference between it and the Lua version is the return value: if the application is successful, it returns the handle of the modifier (`CDOTA_Buff`), if it is skipped, it returns `undefined` (the Lua version returns a Boolean value).

**Magic resistance must be written in its own ability KV `spell_reduce`**: `modifier_black_king_bar_immune` comes with only debuff immunity, the magic resistance value is the engine reading the `spell_reduce` field from the ability** that applies it (vanilla is `AbilityValues` of `item_black_king_bar`, the value is `60`). When borrowing awakeningability, if the awakeningability KV does not have this field, the player will only get debuff immunity and **magic resistance of 0\*\* - no error will be reported, no log will be logged, and the player can only find out by looking at the numerical values ​​on the actual machine. The field name must be consistent with `item_black_king_bar`, write in awakeningability's own `AbilityValues` (in line with Advanced 10), and do not insert vanilla ability override.

**Swing forward to add magic, avoid canceling refresh**: Magic avoidance is tied to `ON_ABILITY_START` (start of forward swing) when triggered, the player can cancel before the end of the forward swing and then cast the spell to refresh repeatedly (cancellation will not enter the CD, and does not consume mana). Defense method: Start cancellation detection only when `ApplyAwakenMagicImmunity` returns true; `StartIntervalThink` polls `IsInAbilityPhase()`, and if `GetCooldownTimeRemaining() <= 0` (cancelled) is removed after the end of the forward roll; **Criteria before removal** - `Destroy()` can only be used if `modifier_black_king_bar_immune` remaining ≤ the duration of this magic exemption, ** is never unconditional `RemoveModifierByName`** (The modifier with the same name cannot distinguish the source and will delete the real BKB by mistake).

> Reference: `OnIntervalThink` of Shadow Demon `special_bonus_unique_nevermore_upgrade.lua` Cancel detection; PA Blink/Dagger Demon immune.

### Advanced 6: Use Modifier to display pure passive marking ability (save space in ability column)

A purely passive and simple description of awakeningability (typically such as advanced 4's "value only takes effect after awakening" pure KV mark ability), it does not need to occupy a threshold in the ability column (castbar), and can be displayed using the resident buff icon instead:

- KV: `AbilityBehavior` plus `DOTA_ABILITY_BEHAVIOR_HIDDEN` (do not enter the ability column), and at the same time add a `Modifiers` sub-block, the sub-modifier is set to `"Passive" "1"` + `"IsHidden" "0"` (not hidden, displayed as a resident buff icon, automatically reusing `AbilityTextureName` as the icon).
- Localization: ability itself`DOTA_Tooltip_ability_<name>` / `_Description`**Keep without deleting**——awakening preview page`AwakenTab.tsx`use`DOTAAbilityImage`What is read is the tooltip of the ability, not the modifier. Make up an extra set`DOTA_Tooltip_modifier_<modifier_name>` / `_Description`, the content is completely consistent with the ability title/description, and ensure that the buff tooltip you see during play is consistent with the awakening page description.
- If there are hard-coded literals in the modifier description,`%`number, ** must also be escaped into`%%`** (Don’t miss it just because it is a modifier. The rules are consistent with the text. See`game/resource/CLAUDE.md`"localization text specification").
- **modifier tooltip does not support direct `%key%` reading of ability `AbilityValues`** (it will display blank or swallow the percent sign); the description of ability itself is not affected, and `%key%` can still be used normally. The modifier is divided into three types according to the implementation method:
  - **DataDriven and the value is hung in the built-in `MODIFIER_PROPERTY_*`** (such as `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`, `MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` and other standard attributes, which have been declared in the `Properties` block): **You can** directly dynamically obtain the value, just write `%dMODIFIER_PROPERTY_<property name>%%%` locally, and the engine automatically reads the modifier The current property value does not require any RunScript/OnTooltip code, nor does it need to be manually wrapped in white bold (there are precedents in the project: `monkey_king_defy`, `insight_armor_aura`).
  - **DataDriven and the value does not correspond to any built-in Property** (pure markability, no script): there is no code to add, and the description is written into specific numbers\*\*.
  - **TS/Lua script modifier** (`ability_lua` + `GetIntrinsicModifierName`, such as advanced 3 monitoring awakening): If the value will change (with level, talent, etc.), **don’t hard-code it** - use `MODIFIER_PROPERTY_TOOLTIP` to dynamically obtain the value: `DeclareFunctions` plus `ModifierFunction.TOOLTIP` implements `OnTooltip(): number` to return the target value (such as `this.GetAbility()?.GetSpecialValueFor('xxx') ?? 0`), and uses `%dMODIFIER_PROPERTY_TOOLTIP%%%` placeholder in localization (the same modifier can have up to two dynamic values, and the second one uses `MODIFIER_PROPERTY_TOOLTIP2`/`OnTooltip2`/`%dMODIFIER_PROPERTY_TOOLTIP2%`). Only truly fixed values ​​are hard-coded. **`%dMODIFIER_PROPERTY_TOOLTIP%` will not automatically add white bold like ability's `%key%`** (actual measurement), you need to manually package `<font color='#FFFFFF'><b>...</b></font>`, which is the same as the hard-coded value (this is only for custom `TOOLTIP`/`TOOLTIP2`, built-in Property is not affected).

> Reference: Winter Wyvern awakening `special_bonus_unique_winter_wyvern_upgrade` (DataDriven write-in value); Drow Ranger Shadow Bolt awakening `special_bonus_unique_drow_ranger_upgrade` (TS modifier, split probability will be increased by talent, use `OnTooltip` to dynamically display instead of write-in); Clockwerk awakening `special_bonus_unique_rattletrap_upgrade_shield` (DataDriven built-in Property Dynamic value, `%dMODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE%%%`).

### Advanced 7: Use native hardcoded modifier (such as invisibility) to achieve effects

Some effects (such as stealth) engines have native hard-coded modifier support, but the `Modifiers` block cannot be found in the target KV (it is fully compiled into the engine and cannot be copied). You can still directly borrow `AddNewModifier` by name in TS:

```ts
const invis = parent.AddNewModifier(parent, this.GetAbility(), "modifier_riki_backstab", {
  duration,
  fade_delay: fadeDelay,
});
```

The `duration` parameter usually causes the native modifier to automatically expire (such as `modifier_black_king_bar_immune`). **If the actual machine verification finds that a borrowed native modifier does not eat `duration`, it will be automatically removed** and use `Timers.CreateTimer(duration, callback)` instead of manual `Destroy()`. In `callback`, first `IsNull()` will be judged empty and then `Destroy()` (to prevent repeated call errors when it has been removed in advance by other means):

```ts
if (!invis) return;
Timers.CreateTimer(duration, () => {
  if (invis.IsNull()) return;
  invis.Destroy();
});
```

The native modifier may also support overwriting of other parameters with the same name (such as `fade_delay` in this example). Specifically, which parameters are effective and which fields should be read from its own awakeningability KV (rather than hard-coded). **There is no documentation and it can only be verified repeatedly by the actual machine**. Do not draw conclusions based on one test result.

> Reference: Windrunner awakening `windrunner_whirlwind_custom` (the passive modifier linked to `GetIntrinsicModifierName`) borrows Hidden Thorn `modifier_riki_backstab`; this passive coexists with ability's own active `OnSpellStart`, and the two do not affect each other - `GetIntrinsicModifierName` is not dependent `AbilityBehavior`, the active ultimate can normally retain behaviors such as `IMMEDIATE | NO_TARGET`.

### Advanced 8: When you need to read dynamic values such as "the caster's current AoE/attribute bonus", give priority to declaring a field with the same name in your own KV

When you want a certain value of awakeningability to automatically superimpose the caster's current AoE bonus (or other similar engine built-in bonus mechanisms), **Don't** use the "dumb value detection" technique (such as declaring a placeholder value of `value: "1"` plus `affected_by_aoe_increase: "1"`, then using `GetSpecialValueFor() - 1` to deduct the bonus percentage, and manually adding it to other values). The correct approach is to directly declare the target field itself in its own KV (the field name is consistent with vanilla, such as `scepter_aura_radius`), bring the same `affected_by_aoe_increase: "1"`, and let `GetSpecialValueFor('scepter_aura_radius')` directly return the final value that has been factored in the bonus. In this way, there is no need to read vanilla KV across capabilities, nor additional addition logic, and the `%scepter_aura_radius%` placeholder can be directly inlined into the localized text (consistent with vanilla writing).

### Advanced 9: `HasScepterUpgrade` + `scepter_description` will not display normally when replacing ability class at runtime

awakeningability is **runtime replacement** (replace the overall vanilla ability with the new `ability_lua` through `targetAbility` of `awaken-config.ts`), even if the KV contains `HasScepterUpgrade: "1"` and writes `_scepter_description`, the engine will not render this scepter comparison preview panel - because this panel relies on the ability instance of "heroes come with default, native learning", and the replacement class ability takes a completely different runtime mounting path. The effect description related to the Scepter should be written directly into the main `_Description` text (a `<font color='#92acf5'>Aghanim's Scepter</font>` prompt can be added), and do not expect `_scepter_description` to be displayed separately. (Note: The awakeningability that is permanently hung in the hero's default ability slot, such as `imba_chaos_knight_phantasm`, `scepter_description`, can be displayed normally. The problem only lies in the replacement class.)

### Advanced 10: Awakening exclusive parameters should not be stuffed into vanilla ability override KV

awakening ability needs to "follow the level/talent linkage of a certain vanilla ability" a certain value (such as the area radius expanding with the vanilla ability talent), **do not** write this awakening-specific custom field directly into `npc_abilities_override.txt` to save trouble. vanilla ability's own `AbilityValues` - even if the code has to pass `FindAbilityByName(Original Skill).GetSpecialValueFor('Custom Field')` To read it, you need to bind it with the same talent, and you cannot store fields in vanilla ability. This will cause a field that is only recognized by the awakening mechanism to be mixed into the delta override file of vanilla ability. People who read the override file will not be able to understand why this field exists. It is also easy to accidentally change or delete it when adjusting the balance of the vanilla ability value later.

Correct approach: The field is directly defined in awakeningability's own KV; when it is necessary to link the current level/talent of vanilla ability, read the level/effective value of the vanilla ability instance in the code, and use a formula to calculate the final value on the awakeningability side, instead of letting vanilla ability save the parameters for the awakening mechanism.

### Advanced 11: When the goal is to "simplify vanilla operations", give priority to wrapping an automated shell instead of re-implementing the vanilla mechanism.

The essence of some awakening appeals is "manual operation of vanilla ability is too cumbersome, and I hope it can be completed automatically for the player" (for example, an ability that requires two steps of manual casting + manual ending wants to be fully automated after automatic casting is turned on). This kind of demand can easily be over-designed into a new mechanism (such as introducing a continuous buff/domain/independent numerical system to simulate "the effect that should be achieved after automation"). In fact, it is not needed at all - vanilla ability's own casting logic, hit determination, and bonus effects do not need to be touched, and awakeningability only needs to be a layer of control shell.

This solution additionally solves the problem that the hero's ability slot is full and cannot add independent abilities: the vanilla ability is hidden (`SetHidden(true)`) on the hero instead of removed. The awakeningability occupies the same slot and is displayed externally. The own KV completely restores the vanilla value for players to view. Internally, the vanilla ability `OnSpellStart()` is called on behalf of the hero. Reuse all its effects - what the player sees is "the same ability slot has the autocast ability added", rather than "the ability is replaced with something else". This is a way to achieve minimal changes using the existing mechanisms of the engine. This idea should be given priority when slots are tight and you just want to add automation capabilities.

- Turn off automatic casting: the ability column displays the vanilla ability body, the player operates manually, and the behavior is exactly the same as when not awakening
- turns on automatic casting: the intrinsic modifier of awakeningability uses `OnIntervalThink` to periodically detect the triggering conditions (such as whether the cooling has improved, whether there is a suitable target within the range), and when the conditions are met, it will call vanilla ability itself instead of the player. `OnSpellStart()`\*\* (instead of reimplementing the ability effect), vanilla ability hit determination, bonus, and damage all take effect as they are; when the player needs to manually click on the second step operation (such as a certain ending/confirmation of ability), it is also judged in the detection loop whether the ability can be cast, and if it can be cast, it will be called on its behalf.

A signal to determine whether the "simplified operation" requirements have gone astray: if new numerical fields (radius, duration, bonus tier), new buff/debuffs that are not included in vanilla ability appear during the implementation process modifier, or the logic that requires "overlaying/overriding vanilla effects", it is most likely that the two things of "automated operation" and "changing ability effects" are mixed together - first go back and confirm which type of demand is, most "simplified operation" appeals only require the former. When the code triggers `OnSpellStart()`, `UseResources` must be added. See `src/vscripts/CLAUDE.md` "Common Traps".

**Replacement of class awakening still requires complete restoration of vanilla ability's KV value and localization text**: This layer of "automation shell" does not change the vanilla effect, so awakeningability's own KV (`AbilityValues`, `AbilityCooldown`, `AbilityManaCost`, `HasScepterUpgrade`, etc.) and localization description should be consistent with vanilla ability + The final value after `npc_abilities_override.txt` delta override remains exactly the same (when the player does not turn on automatic casting, the ability panel he sees is essentially vanilla ability itself). The new automatic casting instructions are appended after the vanilla description, and do not replace the vanilla effect description.

> Reference: Ancient Titan awakening `elder_titan_ancestral_spirit_awaken` - After automatic casting is turned on, when the cooldown improves and there are enemy heroes nearby, it will automatically cast the soul of the ancestors to the farthest hero (directly call `OnSpellStart` of vanilla `elder_titan_ancestral_spirit`), and automatically call vanilla when the wandering soul can be recalled. `elder_titan_return_spirit` does not add any new values/effects, and the vanilla hit bonus, armor and magic resistance reduction, KV values, and localized descriptions are all retained as they are.
