# Awakening engine constraints

Read the relevant section for the mechanism being changed.

## Linked levels

For add/insert, use `inheritLevelFrom` for the initial level and bidirectional
`LinkedAbility` with matching MaxLevel for later upgrades.
Replacement naturally inherits the old level.
Do not substitute `Innate "1"` plus `DependentOnAbility` for dynamically
added awakenings; tested runtime additions can lose their icons.
Example: `axe_auto_culling_blade` linked to `axe_culling_blade`.

## Autocast and automation shells

Reuse `src/vscripts/abilities/ts_abilities/shared/auto-cast-ability.ts`.
Implement `OnAutoCastThink`; its modifier handles server/alive/autocast guards.
Use immediate casting, not orders that interrupt player movement/attacks.
KV supplies NO_TARGET/IMMEDIATE/AUTOCAST and script registration,
not a duplicate DataDriven Modifiers block.

For automation-only requests, retain and hide the native ability, display the
shell in its original slot, and call native `OnSpellStart` with the required
`UseResources` handling. Preserve native effects and effective KV/localization.
Manual mode must retain native behavior.
Do not add new buffs/numerical systems unless the request also changes effects.
Example: `elder_titan_ancestral_spirit_awaken`.

## Cast events

New listeners use a TS intrinsic modifier, filtering the casting unit and ability.
Use START only for pre-cast protection: casts can still be cancelled.
Use FULLY_CAST for committed extra damage/effects.
Use END_CHANNEL to remove channel-only effects on completion or interruption;
do not poll a nonexistent unit `IsChannelling` API.

For existing DataDriven listeners, `OnAbilityExecuted` exposes
`keys.event_ability`, not `keys.ability`.
Do not add PASSIVE to an active ability's behavior just to keep a listener alive.
Apply modifiers defined in the same DataDriven KV with
`ApplyDataDrivenModifier`, not `AddNewModifier`.

## Conditional numerical bonuses

Bonus keys must be ability names prefixed `special_bonus_`.
The hero must own that ability at level 1+.
`=N` replaces, `+N` adds, and `+N%` scales.
The engine applies the first matching bonus in the value block.

Read the complete merged vanilla/override value block before inserting a bonus.
Place awakening after `value` and before competing bonuses.
To enforce ordering, explicitly repeat affected vanilla bonus keys after it and
annotate those lines as ordering constraints, so delta cleanup retains them.
If disabling later bonuses is unacceptable, choose another mechanism.
Example: `tiny_tree_grab` awakening ordering.

## Debuff immunity without replacing BKB

Reuse TS `applyAwakenMagicImmunity` from
`ts_abilities/shared/awaken-magic-immunity.ts`, or Lua
`ApplyAwakenMagicImmunity` from `game/scripts/vscripts/util.lua`.
They skip an equal/longer existing BKB effect.
TS returns the created handle or undefined; Lua returns a boolean.

The applying awakening KV needs `spell_reduce` for magic resistance;
the native immunity modifier alone does not provide that value.
For START protection, detect cancelled casts and destroy only the effect created
by this cast when its duration still matches. Never remove all same-named
modifiers, which could delete the player's real BKB.

## Visibility and tooltips

A hidden passive awakening can display a persistent visible modifier instead.
Keep ability tooltips for the profile preview and add matching modifier tooltips.
Dynamic tooltip values follow the localization reference; cache script values
on the client before a server-only guard.
See `special_bonus_unique_drow_ranger_upgrade`.

## Native effects and dynamic values

Consult [native modifiers](../../../references/vanilla-modifiers.md).
Verify candidate names in Tools. If a native modifier ignores duration,
expire its saved handle with a timer and an IsNull guard.
Active abilities can also have intrinsic modifiers; they need not become PASSIVE.

For AoE bonuses, define the actual field in the awakening's KV with
`affected_by_aoe_increase "1"` and read its effective value.
Do not reverse-engineer bonuses through dummy values.

Runtime replacement abilities may not render `_scepter_description` even
with `HasScepterUpgrade`; include the Scepter effect in the main Description.
Keep awakening-only parameters in the awakening's KV.
Read native ability level/effective values for linkage instead of storing custom
awakening fields in vanilla override KV.
