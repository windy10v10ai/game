---
name: dota-bot-item-build
description: "Expand candidate item pools for each bot build tier using item-build statistics CSV data. Use only on explicit user request."
disable-model-invocation: true
---

# Bot item candidate pools

Owns `src/vscripts/ai/build-item/bot-build-config.ts` and
`bot-build-template.ts`; `item-tier-config.ts` owns canonical item tiers.
Combat activation belongs to $dota-bot-item-usage.

Use at least one bot/player statistics CSV and a resolved hero scope.
Expected columns are item, hero, average held seconds, win rate, event count,
and average gold; skip the header.
Analyze bot/player sources separately before combining evidence.

## Pool semantics

A hero's configured tier replaces the template tier rather than merging with it.
Arrays are weighted samples without replacement; order has no gameplay effect.
Six-or-fewer candidates remove ordinary tier randomness.
Aim for 8–10 useful candidates, retain justified 8–12 pools, cap at 12.
T5 targets 7–9 and caps at 10. Do not add unsuitable items to meet a quota.
Do not change `MAX_ITEMS_PER_TIER`, difficulty counts, or price boundaries.

Use canonical `tier`, not current pool placement.
Price bands are T1 ≤2000, T2 ≤5000, T3 ≤10000, T4 ≤30000, T5 >30000;
document deliberate exceptions beside their canonical entries.

For a new hero, verify `AttributePrimary` before selecting
Strength/Agility/Intelligence/Universal. Do not reclassify an existing template
solely from that field without confirmation.
Bracer/Wraith Band/Null Talisman must match a non-universal hero's main attribute;
universal heroes are judged by role and evidence.

## Candidate selection

Filter consumables, neutrals, fusion/Dragon Ball/part tokens, automatic
`consumablesByTier` purchases, KV consumable/component items, and
`SellItemCommonJunkList` before assessing signals.
The armlet series permits only `item_armlet` or `item_armlet_pro_max`.
Check mechanical eligibility, such as `IsRangedAttacker()` for Hawkeye Turret.

Preserve valid existing candidates, then use bot observations, player data,
same-attribute template candidates, and finally role-based proposals.
Player item-lottery event counts do not prove purchase preference:
use holding time and win rate; counts establish sample adequacy.
Trim over-cap pools by weakest supported signal.
Unsupported role-based additions require user confirmation before writing.

Do not skip strongly evidenced missing canonical items: verify cost from the
consistent CSV price and current KV, then add their canonical entry.
Skip weak or obsolete records.
Resolve `nameCN` from existing config/comments, then localization; ask if absent.

## Exclusivity and application

Bots buy every sampled item, not one choice from the sample.
Keep only one footwear branch, without basic boots as filler.
The same rule applies to parallel `baseItems` upgrades that do not replace
each other; a lower item may coexist with its upgrading branch.
Retain the strongest branch rather than buying multiple non-replacing variants.

Show current/proposed pools and candidate evidence, with unsupported proposals
separate; apply after confirmation.
Prefer widening a shared template when several heroes need the same change.
Keep item-name comments; record a brief reason for tier corrections/exceptions,
not analysis history.
Adding a build does not require a hero-specific AI file or extra registration.

Verify all changed pool entries match canonical tiers and contain no conflicting
branches. Run the configured linter on changed files and
`npx jest src/vscripts/ai/build-item`.
