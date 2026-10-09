---
name: dota-update-heroes-custom
description: "Write and validate bot hero ability builds and talent selections in npc_heroes_custom.txt. Use before editing any Bot.Build, for build-order improvements or skill-point constraints, and after dota-update-abilities-override processes a hero."
---

# Bot ability builds and talents

Owns `Bot.Build` in `game/scripts/npc/npc_heroes_custom.txt`.
Merge custom hero slots over current vanilla hero slots before validating.
Use override MaxLevel, then hero ability KV, then defaults of three ultimate
levels / four basic levels.

A block in ability overrides does not prove that the hero has that ability.
Valid build abilities must occupy a merged, non-`generic_hidden` slot,
including slots beyond 6. Innate abilities are not level-up selections.

| Talent tier | Merged slots | First selection | Other selection |
| ----------- | ------------ | --------------- | --------------- |
| 10          | Ability10/11 | 10              | 27              |
| 15          | Ability12/13 | 15              | 28              |
| 20          | Ability14/15 | 20              | 29              |
| 25          | Ability16/17 | 25              | 30              |

Talent names must exactly match their merged slots.
For each basic ability, cumulative points through hero level L satisfy
`C(L) <= floor((L + 1) / 2)`, and total points do not exceed MaxLevel.
Adjacent-level picks are legal if this bound holds.
Ultimate picks are at least six hero levels apart; do not upgrade at 30.
Typical four-level ultimate picks are 6/12/18/24.

Keys 17/19/21/22 must be empty strings.
Other present level keys, including 23/24/26, need a valid selection;
23/24/26 must be non-talents. Preserve 23/26/31 when adjusting order.
Write levels 32+ only when a point remains.

Check slot identity, talent tier, total counts, per-level bounds, empty keys,
and ultimate spacing after edits. Do not create a build for an absent hero
merely to satisfy validation.
