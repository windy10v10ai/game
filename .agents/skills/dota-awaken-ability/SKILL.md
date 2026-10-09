---
name: dota-awaken-ability
description: "Create or modify awakened hero abilities that replace ability slots through awakening stones. Use for awakening enhancements; use dota-clone-ability for vanilla delta clones and dota-custom-ability for new abilities."
---

# Hero awakening

Owns awakening stones and ability slot transformation, not ordinary vanilla clones.

## Owners and replacement

- `src/vscripts/modules/awaken/awaken-config.ts`: `ABILITY_REPLACEMENTS`,
  `AbilityReplacement`, and `FREE_TRIAL_HEROES`.
- `awaken-replacer.ts` in the same directory: replacement algorithm.
- `src/vscripts/items/ts_items/item_awaken_stone.ts`: activation and errors.
- `game/scripts/npc/npc_abilities_custom_awaken.txt`: new awakening KV.
- `src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx`: preview cards.

Only `newAbility` adds without removing an existing ability;
`targetAbility` replaces while retaining the learned level without a refund;
`targetSlot` inserts and restores displaced abilities at their existing levels.
A `generic_hidden` target slot is replaced, not inserted.
In replacement mode, a positive `newLevel` overrides the inherited level.
Resolve ambiguous operation/level linkage before implementation.

## Choose the smallest mechanism

- Numerical-only awakening: keep the original ability and add an awakening
  `special_bonus_unique_*` line to its override value block.
  Activate it through an independent hidden level-1 passive.
  Do not clone vanilla solely to change numbers.
- New behavior: implement a TS `ability_lua` ability.
- Autocast of existing behavior: use a shell in the original slot and retain
  the hidden native ability for forwarding.

When converting a flat value to a bonus subblock, include its original `value`.
When vanilla already supplies a block, add only the changed bonus line.
A player-leveled shell cannot serve as the bonus trigger: level 0 would disable it.
Shell cooldown and mana cost must be complete in KV; forwarding server getters
does not populate the client ability panel.

## Player integration

Awakening must be visible through an ability-bar entry or a non-hidden persistent
buff with texture and modifier tooltip. Hiding both leaves the feature unfinished.
Use hero-name comments in the configuration; effects belong in localization.

Synchronize `ABILITY_REPLACEMENTS` with `AWAKEN_ABILITIES` in the preview page.
New awakenings enter the free-trial list by default: update both
`FREE_TRIAL_HEROES` and the card's `freeTrial: true`.
Ask which existing trials to remove; there is no automatic expiry.

New localized entries precede old awakenings in the existing awakening section
of each language. Titles use `#d000ff`, with "Name Awakened" in English and
a space before the Chinese awakening suffix.
Other text colors and numerical markup belong to
the [localization reference](../dota-localization-format-guide/references/format.md).
For custom icons, follow the [asset rules](../dota-add-image/SKILL.md); vanilla/persona textures need no PNG.

Read [advanced techniques](references/advanced-techniques.md) only for linked
levels, autocast, cast events, conditional bonuses, immunity, native hard-coded
effects, runtime AoE, Scepter descriptions, or simplification of vanilla controls.
Build vscripts and run `npx jest awaken-replacer`; verify slot order, levels,
errors, visibility, and actual effects in Tools.
