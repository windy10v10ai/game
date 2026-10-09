---
name: bot-item-build
description: "Expand candidate item pools for each bot build tier using item-build statistics CSV data. Use only on explicit user request."
disable-model-invocation: true
---

# Bot equipment candidate pool adjustment

adjusts `src/vscripts/ai/build-item/bot-build-config.ts` (hero exclusive candidate pool) based on statistical CSV and The tier equipment composition of
`bot-build-template.ts` (shared template candidate pool). For the

> reference file path, see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference".

---

## Background knowledge

### candidate pool sampling mechanism

`bot-build-state.ts` in `MAX_ITEMS_PER_TIER = 6`: Used when initializing each tier
`SampleWeightedWithoutReplacement` (`weighted-pool.ts`) 6 pieces are randomly selected from the candidate pool and entered into the actual purchase list
(The number of T5 fluctuates according to the `GetT5ItemCount` difficulty ladder, not fixed 6).

**The writing order of the candidate pool array has no impact on the result** - pure weighted random extraction, the weight defaults to 1, only if it is written as
`{ item, weight }` can customize the weight. Sorting and grouping are only for people to see and do not affect in-game behavior.

**When the candidate pool ≤ 6 pieces, the sampling is equal to returning the original without randomness**; it must be obvious **> 6** pieces to make "this one is different from the previous one",
can also leave room to continue optimizing the candidate pool based on winning rate data in the future (if it happens to be stuck at 6, there is no room for improvement). This is the skill for each The root reason why the
tier target quantity is lowered to **at least 8 units** (instead of exactly 6). **The best range is 8~10**, **not more than 12**——
exceeding 12 will dilute the actual selection probability of each piece of equipment and increase maintenance and manual verification costs. At this time, the weakest entries should be cut according to signal strength;
However, as long as the numbers between 8 and 12 are valuable equipment supported by real data, there is no need to forcibly cut them to get a certain "integer".

**T5 is an exception**: There are only about 18 pieces of T5 equipment in the entire equipment library. When spread out, the candidate pool of a single hero cannot support the range of 8~10.
The target is changed to **7~9 pieces, no more than 10 pieces**. The number of candidates is the optimization goal. It is not allowed to add candidates that are inconsistent with the hero's positioning in order to make up the number.
Equipment with only basic attributes or insufficient data. In the absence of reliable candidates, gaps are retained and explained to the user, waiting for supplementary data or confirmation.

> Writing the combat usage logic (when to use an item on whom) under `src/vscripts/ai/item/specs/` is another matter,
> has nothing to do with the candidate pool adjustment of this skill, see [bot-item-usage](../bot-item-usage/SKILL.md) skill.

### Tier attribution rule (`item-tier-config.ts`)

`ItemTier` Divided according to actual money, the interval is **left open and right closed** `(lower_bound, upper_bound]`:

| Tier | Range                | When |
| ---- | -------------------- | ---- |
| T1   | cost ≤ 2000          |
| T2   | 2000 < cost ≤ 5000   |
| T3   | 5000 < cost ≤ 10000  |
| T4   | 10000 < cost ≤ 30000 |
| T5   | cost > 30000         |

special props need to deviate from the price rules (for example, the price of `item_hand_of_midas` belongs to the T2 range but is specifically set to T1,
`item_excalibur` is placed at the top level of T4), a comment must be added next to the entry to explain the reason, **without changing the rule itself**. If the

hero exclusive pool (`targetItemsByTier` of `bot-build-config.ts`) is configured with a certain tier,
**completely replaces** the corresponding tier pool of `HeroTemplate` used by this hero and will not be merged.

### HeroTemplate Classification and Attributes Choose One Accessory

`HeroTemplate` According to the true main attributes of the hero (Dota official `AttributePrimary`, see
`docs/reference/<version>/npc_heroes.txt` corresponding to the hero’s `AttributePrimary` field) is divided into four types:
`Strength`/`Agility`/`Intelligence`/`Universal` (ALL). **New heroes must be checked before configuring `template` for the first time.
`AttributePrimary` Confirm, don't judge based on "what does this hero play like" or historical impressions** - even if the hero name sounds like Strength/Agility/
intelligence, actual `AttributePrimary` may also be ALL. Migrated hero's `template` field ends with `bot-build-config.ts` The current code of
shall prevail. Do not rely solely on `AttributePrimary` to "correct" the existing configuration - whether to reclassify it as Universal requires user confirmation.

`item_bracer` (wrist guard)/`item_wraith_band` (wraith lace)/`item_null_talisman` (ethereal pendant) are in the same price range
Choose one accessory from three attributes, mainly adding strength/agility/intelligence (each +5 main attribute +2 the other two). Strength, agility, and intelligence heroes must match
is the real main attribute and cannot be mixed with the other two pieces. All-round heroes are not forced to use or exclude these three items. Whether to retain them is determined based on their ability positioning and data.

### T5 equipment positioning reference

The hero adaptation positioning of some T5 equipment is not directly visible from the name. It is provided for reference when judging candidates:

- `item_hawkeye_turret` (Eagle Eye Turret): ability implementation requirement `IsRangedAttacker()`, only long-range heroes can trigger, it is the core T5 equipment of long-range heroes
- `item_magic_sword` (Demon Abyss Sword): Fusion of Battle Fury Ax + Absolute Defense-breaking Blade + Big Ice Eye, it is the core T5 equipment of the power hero

---

## Step 1: Collect CSV input

Use AskUserQuestion to ask the user to provide:

- Bot item-build statistics CSV path (`...英雄_BOT.csv`)
- Player item-build statistics CSV path (`...英雄_玩家.csv`)

requires at least one copy; both copies are sometimes processed according to "Data Priority" below. CSV format:
`物品,英雄,Average 时长_秒,胜率,事件数,Average 金钱` (header row skipped).

confirms the range of heroes to be adjusted this time (internal hero code, such as `npc_dota_hero_axe`). If the user gives the Chinese name of the hero (such as
"Windrunner" "Ryan"), the corresponding one was found in `npc_heroes.txt` (`docs/reference/<version>/`)
`npc_dota_hero_<id>` system name, and clearly list the Chinese name → system name in the reply for users to confirm that they have not mistakenly identified the hero.

---

## Step 2: Noise filtering

The following categories are excluded before analysis and are not considered candidates:

- **Consumables/neutral objects/rituals**: messenger, watch, smoke, gems, tp roll, recovery consumables (tango/flask/clarity/faerie_fire/enchanted_mango/infused_raindrop), cheese, etc.
- **Fusion/achievement raw materials**: `item_fusion_*`, `item_dragon_ball_*`, middleware whose name contains `_part`
- **Equipment that has been automatically processed by `consumablesByTier`**: `item_wings_of_haste`, `item_ultimate_scepter`,
  `item_ultimate_scepter_2`、`item_aghanims_shard`、`item_moon_shard_datadriven`、
  `item_tome_of_strength`/`item_tome_of_agility`/`item_tome_of_intelligence`。
  These do not enter the `targetItemsByTier` candidate pool proposals. If they are mixed in, they will overlap with the automatic purchase logic.
- **`ItemQuality: "consumable"` equipment**: Even if the cost falls within a certain tier range, it will not enter `targetItemsByTier`——
  This kind of equipment is essentially consumed after use (such as `item_tome_of_luoshu` in Luo Shu, `ItemPermanent: "0"` in KV), and is stuffed into the equipment slot.
  The candidate pool will occupy valuable slots but disappear after buying them. Before adding candidates, check whether the equipment is available
  `docs/reference/<version>/items.txt` or `ItemQuality` in `npc_items_custom.txt`.
- **Fixed candidate range for armband series**: `item_armlet` series only has `item_armlet` (basic file) or `item_armlet_pro_max`
  (ultimate file), **not available** `item_armlet_plus` (middleware), nor parallel branches after pro_max
  `item_armlet_light`/`item_armlet_dark`/`item_armlet_artifact`。
- **The equipment in `SellItemCommonJunkList` of `sell-item-config.ts`** (`item_magic_wand` and "consumables" Except for a few items listed in the
  paragraph - they are disposable/early consumable items that are designed to be thrown away): This list is for backpacks that have exceeded the sale threshold
  (7~9 pieces, `SellItem.GetSellThreshold`) `SellCommonJunkItems` **Unconditional** priority sale list.
  `RemoveCurrentTierItems` only protects "the tier currently being purchased". Once the build progress is advanced to the next tier, previously purchased,
  But the equipment on this list will be sold at half price the next time the backpack exceeds the threshold - regardless of whether it was bought specifically. No matter how strong the CSV signal is, it cannot be used.
  (such as `item_diffusal_blade`, `item_eagle`, `item_talisman_of_evasion`, naked
  `item_kaya`/`item_sange`/`item_yasha`). **Every time you generate a candidate pool, you must filter it one by one according to this list**. Don’t just rely on
  tier belonging and signal strength judgment.

---

## Step 3: Filter data by canonical tier (not by current placement)

reads `item-tier-config.ts` and takes the `tier` field of each device as the only authoritative basis. **Use this field when filtering CSV data**,
Don’t look at which tier bucket of `bot-build-config.ts` the equipment is currently placed in - the current placement may itself be an error to be corrected
(for example, historical attribution left after price/tier rule adjustment).

**Equipment that appears in the CSV but is not included in `item-tier-config.ts`** (does not belong to the second step noise filtering list, it is a real omission):
Don’t just skip or replace it with other equipment just because you can’t find the tier. **Strong signal (the number of events is obviously not low, especially when multiple heroes appear repeatedly at the same time)
(a piece of equipment that has not been included) will be automatically re-recorded without additional confirmation using AskUserQuestion** - first in `item-tier-config.ts`
Add this configuration: `cost` Get the "Average money" column of the CSV (the values in each row of the same equipment should be consistent, and can be the same price with similar naming/functions)
equipment mutually confirms each other), `tier` can be obtained by comparing the cost with the price range table in this section. After completion, follow the normal process to include it as a candidate. only when the signal
is skipped only if it is very weak (single digits, very low event count) or is clearly obsolete/renamed historical equipment.

**`ItemQuality: "component"` equipment skips even if the signal is strong**: on `docs/reference/<version>/items.txt`
Check the `ItemQuality` field of the equipment - marked as `"component"`, indicating that the official positions it as a synthetic middleware (such as
`item_orb_of_venom`, `item_helm_of_iron_will`, `item_diadem`) are not end-game equipment that players will keep for a long time.
should not be targeted by the candidate pool and is skipped regardless of how high the CSV event count is. `"secret_shop"`, `"artifact"` and other quality tags
is the final equipment that can be included normally.

**`nameCN` value source, you are prohibited from guessing the translation name**: Prioritize to find the authoritative translation name in the existing code - `item-tier-config.ts` if it already exists
Use the `nameCN` field of this equipment directly; if not, check `game/scripts/vscripts/bot/bot_item_data.lua` or other hero configurations Comments on the same equipment that appeared in
. If you can't find it, go to `game/resource/addon_schinese.txt` to search
`DOTA_Tooltip_Ability_<item_name>` key to get its value. If you can't find it in three places, ask the user again. Don't make assumptions based on impressions/similar equipment names.

---

## Step 4: Read the current candidate pool status

For each target hero:

- `Read bot-build-config.ts`, take the existing entries in each tier of the hero `targetItemsByTier`
- If a certain tier is not covered exclusively by a hero, `Read bot-build-template.ts` checks the corresponding hero `template`
  `HeroTemplate` Entries of the same tier in the configuration (as the current status baseline and also as a source of follow-up information)

---

## Step 5: Build expansion candidates tier by tier (data priority)

For each tier of each target hero, candidates are included in the following priority order until the number reaches **at least 8** (the optimal range is 8~10,
does not exceed 12, see item 6 below):

1. **Keep all equipment in the existing pool**
2. **Bot data priority**: Equipment that appears in the Bot CSV of the hero under the tier will be included\*\* (no event threshold is set,
   As long as the tier matches and is not noise, it doesn’t matter, because this is the actual historical purchasing behavior, and the signal itself is meaningful)
3. **Player Data Supplement**: If the "Existing + Bot" is still less than 8, normally purchase equipment first sorted by the holding time of the same tier, and then judged by the winning rate. The number of
   events is only used to confirm the sample size. For equipment in the item drawing pool, the number of events/selection rate cannot be regarded as active purchase preference, only the holding time and winning rate
   Only entries with outstanding performance in the same tier can be included
4. **Same as the hero template**: If the above sources are still not enough and you can’t find obviously suitable equipment, \*\*first press `HeroTemplate` corresponding to the hero’s main attribute Select the unused entries of the same tier in
   (Strength/Agility/Intelligence/Universal) instead of jumping directly to pure judgment—— The entries in the
   template are already universally available equipment for heroes of this attribute, which is more reliable than guessing. If it is still not enough, then check other roles with similar role positioning.
   tier (such as T5 of the power template may be borrowed by auxiliary heroes)
5. **Pure role positioning judgment**: If the template cannot make up the 8th item (the data is completely thin, and the template and tier entries have been used up),
   can list an equipment that fits the hero's ability positioning but has no data support as a candidate for confirmation (**it still needs to comply with the matching rules of selecting one accessory from three attributes**).
   It is not allowed to add equipment with only basic attributes or that obviously does not meet the positioning just to make up the numbers. Such candidates must be listed separately and ask the user for confirmation using an AskUserQuestion.
   Configuration will not be written before confirmation
6. **If the number exceeds 12, it will be cut according to the signal strength. If the number is between 8 and 12, it will not be forcibly cut.**: If the total number falls between 8 and 12, it is supported by real data.
   Valuable equipment, **keep all**; only when there are more than 12 items, the items with the weakest signal will be cut based on the sum of the number of Bot/player events, and the items with the weakest signal will be cut to less than 12 items.

Each candidate annotation source (Bot winning rate/number of events, number of player events, template borrowing, pure judgment) is for users to make decisions during the confirmation phase.

### 5.1 Key constraint: Mutually exclusive equipment cannot be placed in the same tier

`resolvedItems[tier]` is **buy out the entire list**, not "select one more" - `bot-build-manager.ts`
`TryPurchaseNormalItem` will buy every item hit by sampling in this tier in turn, and will not enter the next tier until all are purchased.
Therefore, equipment with mutually exclusive functions must not be put into the same tier candidate pool at the same time, otherwise the hero will buy them all, wasting money.

The most typical mutually exclusive group is **shoes**: `item_boots` (basic shoes), `item_power_treads`, `item_arcane_boots`,
`item_phase_boots` and `item_tranquil_boots` share the same `baseItems` in `item-tier-config.ts`
lower-level equipment (`item_boots`), there is no relationship between each other's replacement and sale** (each upgraded shoe will only replace `item_boots`
itself will not replace another upgraded shoe). **In each hero's candidate pool, only one type of footwear equipment can be reserved\*\* (and do not put
`item_boots` Leave it as "safety filling" - it is a low-end shoe and should be replaced directly after choosing the shoe you really want to use, not to coexist with the real shoe).

Before adding a candidate, check the `baseItems` chain of the equipment in `item-tier-config.ts`: if the two candidates are for the same function slot
Different branches (such as multiple shoes, or parallel versions that share the same lower equipment but do not replace each other), keep only one of them, and replace the rest with other non-conflicting equipment.

**Parallel branches of the same `baseItems` are the same, not just shoes**: If there are two pieces of equipment in `item-tier-config.ts`
`baseItems` both contain the same lower equipment (for example, `item_wasp_callous` and `item_wasp_despotic` both start with
`item_butterfly` are lower-level equipment, which are upgraded to two different branches of Butterfly respectively). They are **mutually exclusive parallel branches**, not complementary equipment——
does not replace each other in the sale substitution relationship (`GetReplacedItems`). If you buy them, they will not replace each other and sell them. If you buy them at the same time, it will be a waste of money.
Scan before adding candidates `item-tier-config.ts` Find all equipment groups that share the same `baseItems` entry, only keep the same tier
The one with the strongest signal (the lower tier itself, such as `item_butterfly`, can coexist with one of the branches, since the branch will replace it).

---

## Step 6: Present the proposal and wait for confirmation

Lists "Current Status → Proposal" by hero and tier, indicating the source of each new equipment. Small changes (a few heroes, a few tiers)
can be directly displayed in a table in the dialogue + one-time solicitation for confirmation; when the scale of changes is large (batch of heroes/multiple rounds of iterations), press
`superpowers:writing-plans` specification is written into the plan file.

The "pure judgment" equipment generated in step 5, item 5, must be highlighted separately when displayed, and should not be mixed with data-supported items to avoid misunderstandings by users.
has data endorsement.

---

## Step 7: Apply changes (after user confirmation)

- Edit `bot-build-config.ts` (or `bot-build-template.ts`, if a certain tier is generally narrow in the template layer itself,
  and multiple heroes will benefit from sharing this template, giving priority to expanding the template rather than repeating the same equipment for each hero)
- Equipment entry notes **Only write the Chinese name** (such as `// 金手指`), do not write the derivation process of trade-offs such as "supplementary for weak data signal" and "strong signal of winning rate"
  - According to the project comment protocol, no code comments are included during the discussion process. **Exception**: If it is a true tier ownership modification (such as moving a piece of equipment from the wrong tier
    tier bucket to the correct bucket), you can leave a brief description (such as `// 从 T5 移入，真实价格属于 T4`)
- If the canonical tier itself needs to be adjusted (for example, the price of a piece of equipment deviates from the price rules and is specifically set to another tier), in
  `item-tier-config.ts` Add a comment next to the corresponding entry to explain the reason.

### 7.1 Additional registration when migrating new heroes for the first time

The new item-build system is the only default behavior of `BotBaseAIModifier` - `Init()` will unconditionally call `InitializeHeroBuild` for heroes configured in `bot-build-config.ts`, and there is no longer a hero list switch. The old Lua item-build system (`modifier_bot_think_strategy`) has been removed together with the migration of all heroes. Adding `bot-build-config.ts` for the first time to a new hero does not require ** additional registration to any list after configuration, nor does it require ** additional creation of `src/vscripts/ai/hero/hero-<name>.ts`:
`getModifierName()` of `AI.ts` will fall to the general `BotBaseAIModifier` by default for heroes without exclusive judgment branches.
The migrated abaddon/axe/bane/bloodseeker/bounty_hunter has no exclusive files and all follow this default path. Only as a hero
Only when **customized ability casting logic** (beyond the general equipment/attack behavior) are needed can a new exclusive file be created and placed in `AI.ts`
`getModifierName()` adds the judgment branch, refer to the existing implementations such as `hero-viper.ts` and `hero-drow-ranger.ts`.

---

## Step 8: Consistency Verification

After the modification, you must confirm that no new "placement tier is inconsistent with canonical tier" problem has been introduced: write a temporary script (not submitted to the repository,
can be placed in the scratchpad directory) to parse each of `bot-build-config.ts` / `bot-build-template.ts`
The equipment name in the `[ItemTier.Tn]: [...]` block is compared with the `tier` field of `item-tier-config.ts` to confirm that there are 0 inconsistencies.

Also check the mutually exclusive group problem in Section 5.1: the script parses out from `item-tier-config.ts` all sharing the same `baseItems` Equipment grouping of
entry (shoe mutually exclusive group `item_boots`/`item_power_treads`/`item_arcane_boots`/`item_phase_boots`/
`item_tranquil_boots` is just one of them, `item_wasp_callous`/`item_wasp_despotic` share the same lower equipment The same applies to
parallel branches), scan each hero and each tier group by group to see if more than 2 items appear at the same time. If so, they must be repaired.

Then run:

```bash
npx eslint <changed_files> --max-warnings=0
npx jest src/vscripts/ai/build-item
```

---

## Skill interaction specification

- **Data priority is fixed**: Bot priority, player supplementation, template all-inclusive, pure judgment all-in-one, do not skip previous levels and use judgment directly.
- **Pure judgment equipment must be confirmed by AskUserQuestion** and cannot be decided by oneself.
- **Aim for at least 8 pieces, optimal range is 8~10, no more than 12** - exactly 6 pieces leaves no room for subsequent win rate driven iterations. 8~12 As long as it is valuable equipment supported by real data between
  , it can be retained. There is no need to forcibly cut it to a certain "integer"; only if it exceeds 12 pieces, you need to press the signal
  Strength cut. **T5 exception: The total amount of equipment library is small, the target is changed to 7~9 pieces, no more than 10 pieces**.
- **Not modified** `MAX_ITEMS_PER_TIER`, `GetT5ItemCount` difficulty ladder, tier boundary rule itself.
- **Note: only write the Chinese name of the equipment**, do not write the data source derivation process; only a brief reason for the tier attribute modification change is attached.
- **Shoes in the same tier (and other equipment in the same slot without sell-replacement relationship) can only retain one type**, `item_boots`
  does not coexist with real shoes as "safety filling", and should be removed from the candidate pool after real shoes are selected.
- **Choose one accessory from three attributes (wrist guards/wraith belt/ethereal pendant)**: Strength, agility, and intelligence heroes must match the real main attributes, check
  `AttributePrimary` of `docs/reference/<version>/npc_heroes.txt` confirmed. Universal heroes can be positioned and data by ability
  Choose one of these, but it is not mandatory.
- **item lottery pool data**: Winning a piece of equipment does not mean that the player actively chooses to purchase it, and cannot be sorted by the number of events/selection rate. Such equipment is only available in the same tier
  can be included in the candidate pool only if its holding time and winning rate are both outstanding. The number of events is only used to confirm the sample size.
- **Armband series only available`item_armlet`or`item_armlet_pro_max`**, not out`item_armlet_plus`, nor out
  `item_armlet_light`/`item_armlet_dark`/`item_armlet_artifact`。
