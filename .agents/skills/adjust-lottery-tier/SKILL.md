---
name: adjust-lottery-tier
description: "Review ability lottery tiers from win-rate CSV data and propose tier changes, additions, or removals. Use only on explicit user request."
disable-model-invocation: true
---

# lottery pool Tier review and adjustment

adjusts the Tier distribution of `src/vscripts/modules/lottery/lottery-abilities.ts` based on CSV statistics. For the reference file path of

> , see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference".

---

## Design principles (background knowledge)

### Theoretical weight vs actual behavior

`BASE_TIER_RATES = [1, 5, 20, 60, 100]` (T5→T1) corresponds to a single extraction weight of 1:4:15:40:40. However, ** players "draw 6 and choose 1" will choose the best**, and the actual selection distribution is seriously biased towards high-end:

| Tier | Theoretical weight % | Actual selection % (historical weighting) | Target pool proportion |
| ---- | -------------------- | ----------------------------------------- | ---------------------- |
| T5   | 1                    | ~6                                        | **4–5%**               |
| T4   | 4                    | ~18                                       | **13–15%**             |
| T3   | 15                   | ~26                                       | **21–23%**             |
| T2   | 40                   | ~33                                       | **33–36%**             |
| T1   | 40                   | ~17                                       | **24–27%**             |

Target pool ratio = 0.35 × theoretical + 0.65 × actual. Active/passive pools use the same set of target ratios\*\*.

### sample size and winning rate confidence (p≈0.8, 95% CI)

| n       | ±pp      | Availability                 |
| ------- | -------- | ---------------------------- |
| 50      | ±11.1    | Not available                |
| 100     | ±7.8     | Only look at extremes        |
| 150     | ±6.4     | Supporting evidence required |
| **200** | **±5.5** | **Judgment threshold line**  |
| 300     | ±4.5     | Relatively stable            |
| 500     | ±3.5     | Robust                       |

---

## Step 1: Collect CSV input

Use AskUserQuestion to ask the user to provide:

- activeability CSV path
- Passive ability CSV path

If only one copy is provided, only that pool will be processed; if both copies are provided, the two pools will be analyzed independently.

CSV format: `技能,等级维度,胜率,事件数` (header row skipped).

---

## Step 2: Parsing and Aggregation

For each CSV:

1. parses each line → `(name, tier, winrate, events)`.
2. Aggregation by tier:
   - `tier_events[t]` = total number of events in this file
   - `tier_count[t]` = the ability number of this file
   - `tier_winrate_avg[t]` = weighted mean `Σ(wr·ev) / Σev`
   - `tier_winrate_sd[t]` = event number weighted standard deviation (used to determine "deviation > Nσ")
3. Calculate the total number of events in the pool and the actual proportion of each file `tier_events[t] / total`.

---

## Step 3: Overall sample adequacy check (Key: Insufficient data must stop)

Use the following rules to determine whether the data is sufficient to support this analysis. **If any one is triggered, it will stop working, and the user will be prompted to supplement the data before running the skill**:

- The total number of events in the pool < 5000
- The **median number of ability events in any level is < 100** (the entire level is generally undersampled) Among the files with the number of
- ≥ 10, the ability ratio of `n ≥ 200` is < 30%

When stopping, the user is informed of the current data volume and gap, and no plan is generated.

---

## Step 4: Read the current pool status

`Read src/vscripts/modules/lottery/lottery-abilities.ts`。

parses two arrays `abilityTiersActive` / `abilityTiersPassive`, counting the number of items in each file and the ability list. Note that the ability in the lottery file has Chinese comments, and the comments are reserved for plan display.

---

## Step 5: Calculate the pool shape gap

for each pool:

- Target number of strips (according to midpoint proportion T5 4.5% / T4 14% / T3 22% / T2 34% / T1 25.5% × current total number of strips, rounded)
- difference = target − current

outputs "how many lines need to be added or subtracted" for each level.

### 5.1 Key Principle: Divide the ideal tiers according to the **whole pool winning rate quantiles**, and limit the speed of convergence

The essence of **tier is "the winning rate ranking position in the entire pool"**, not "quota" or "relative to the current average value".

#### 5.1.1 Wrong practice warning

- ❌ **Judgment by tier mean argmin**: The tier mean is contaminated by the tier content, resulting in "the T5 mean is pulled down by the T5 tail difference" → T4 head `|wr−μ_5|` is small instead → misjudgment of upshift. This method will amplify the pool shape deviation and will not converge.
- ❌ **According to "Quota Determine Direction"**: T5 is not allowed to upshift if it requires −1, and T1 is not allowed to downshift if it requires +3. It is out of touch with the actual matching degree of winning rate, resulting in the ability that obviously needs to be improved (such as `life_stealer_rage` 91.13%) being suppressed in T4, and the ability that obviously needs to be lowered sitting in T5.

#### 5.1.2 Correct approach: quantile anchoring ideal_tier

**Only use the ability** of `n ≥ 200` in the pool to calculate the ideal file:

1. Sort all n ≥ 200 abilities in descending order of winning rate to get rank.
2. Cut quantiles according to target proportion:
   - Top 4.5%: Ideal T5
   - Next 14%: Ideal T4
   - Next 22%: Ideal T3
   - Next 34%: Ideal T2
   - Remaining 25.5%: Ideal T1
3. `ideal_tier` of each ability = the file corresponding to the quantile interval where its rank falls. Advantages of
4. `shift = ideal_tier − current_tier`。

quantile method:

- **Self-stabilizing**: Does not rely on the current file average and will not be contaminated by file content.
- **Auto-converge pool shape**: By definition, after migrating completely according to ideal_tier, the pool shape is the target quantile.

#### 5.1.3 Conservative speed limit (avoiding a major change)

However, **a complete ideal_tier migration may produce 30+ changes**. A single version is too radical, and it is easy to accidentally damage the boundary capability, and also allows players to experience drastic changes in one version. Therefore, **speed limiting rules** are introduced:

- **Single-grade single change upper limit** = `max(3, current_tier_count × 15%)`. That is, the total number of ups and downs for each level does not exceed 15% of that level (or at least 3 items).
- **Priority sorting**: In descending order of `|shift|`, in descending order of the deviation of the winning rate from the original median. In each stage, the top-ranked candidates are selected for execution, and the over-limit parts are retained for the next version.
- **Cross-shift shift ≥ 2**: Prioritize migrations that retain these abilities because they deviate farthest and drag down the pool structure the most.
- **shift = ±1 and the boundary is close**: If the distance from the adjacent bin line is ≤ 1pp, it is preferable to keep shift=0 (to avoid repeated increases and decreases due to sample jitter).

#### 5.1.4 Final state simulation and pool shape verification

After all migration candidates are determined, use the following formula to simulate the final state:

```
final_state[t] = initial_state[t] + Σ(entering_tier) − Σ(leaving_tier) − Σ(removed_from_tier)
```

**Convergence Verification**: Each tier `|final_state − target|` must ≤ `|initial_state − target|` (that is, it cannot deviate in the opposite direction). If there is a reverse deviation:

- Check whether the ability of shift=0 has been moved (rolled back) by mistake.
- Check whether the up/down of the tier is unbalanced - if there is too much up but the number of bars actually needs to be increased, reduce the up candidates.

#### 5.1.5 multiple versions gradually converge

When the gap is large (|Initial − Target| > 5), one adjustment usually cannot be in place. At the end of the plan, clarify "Convergence X/Y of this round" and "Z items to be processed in the next version" as the input anchor points for the next run of the skill.

---

## Step 6: Label capabilities one by one

**Core method: Calculate the "best matching tier" (see 5.1.1) for each ability n ≥ 200, and determine the adjustment direction based on `shift = best_tier − current_tier`. ** The mean and σ of the same class are used for T1 special judgment and extreme judgment.

| Conditions                                                                                           | Tags                                                                                                |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| n < 50, ** and other abilities in the same category are common n ≥ 200**                             | `Ask user (very low pick rate)`                                                                     |
| 50 ≤ n < 200                                                                                         | `Observe (small sample)`, with "may need to be adjusted" remarks only when shift ≥ +2 or shift ≤ −2 |
| n ≥ 200 and shift = +1                                                                               | `Raise one tier`                                                                                    |
| n ≥ 200 and shift = −1, not T1                                                                       | `Lower one tier`                                                                                    |
| n ≥ 300 and shift ≥ +2 and deviation from the original mean > 15pp                                   | `Raise two tiers` (rare)                                                                            |
| n ≥ 300 and shift ≤ −2 and deviation from the original mean < −15pp, not T1                          | `Lower two tiers`                                                                                   |
| n ≥ 300 and shift = +1 and the number of events is in the same tier TOP 3 and the original tier ≥ T4 | `Recommend nerf` (OP signal, numerical processing, tier can be retained)                            |
| n ≥ 200 and the number of events is in the same category TOP 2 and shift = 0                         | `Observe (overexposure)`                                                                            |
| **T1 level** and n ≥ 200 and winning rate < T1 mean − 8pp                                            | `Ask user (abnormal T1 win rate)`                                                                   |
| Others (shift = 0 or invalid signal)                                                                 | `No change`                                                                                         |

> `best_tier` takes `argmin(|wr − μ_t|)`. If the distance between the two tiers is close (difference < 1pp), the lower tier is preferred (conservative).

**T1 last tier inquiry rule**: Ask only if the win rate of a certain T1 ability is lower than the T1 weighted average > 8pp. It's not "the last 10% must be eliminated" - the normal low T1 ability is retained.

---

## Step 7: Complete the Chinese name

For each ability that will be adjusted or marked, search the Chinese name in order for plan display:

1. `Grep` `game/resource/addon_schinese.txt`, mode `DOTA_Tooltip_ability_{system_name}\s+`, extract the value of the next line
2. If miss, `Grep` `docs/reference/<latest-version>/abilities_schinese.txt` same mode
3. cannot be found in both places → **Skip Chinese name**, only the system name is displayed in the plan (AskUserQuestion is not triggered)

`<latest-version>` Get the latest digital version directory under `docs/reference/`.

---

## Step 8: Generate Plan

**The "Final State Simulation" in Section 5·5.1** must be completed before writing the plan. The plan must include the "Initial→Final State→Target" comparison table (see the template below) to verify that each stage is converging to the target.

writes `C:\Users\windy\.claude\plans\adjust-lottery-tier-<yyyymmdd-hhmm>.md`, structure:

```markdown
# lottery pool Tier review - <date>

## Data overview

### Active pool (total events N)

| Tier | Number of items | Number of events | Proportion % | Weighted winning rate | Winning rate σ |

### Passive pool (total events N)

(same as above)

## Pool shape gap

| Tier | target% | Active current/number of target items/difference | Passive current/number of target items/difference |

## Active ability adjustment list

### T5 (need to add/subtract N items)

- `system_name` (Chinese name) | n=XXX | wr=XX% | **Raise one tier** → Deviation +Xpp, sufficient sample

### T4 / T3 / T2 / T1

(same structure as above)

### Requires manual confirmation (T1 winning rate is abnormal)

- `system_name` | ... | The execution phase will use AskUserQuestion to ask

### Requires manual confirmation (selection rate is too low)

- `system_name` | n=XX (median N in the same grade) | Almost no candidates, ask about downshifting/strengthening/Remove/retention

## Passive ability adjustment list

(same structure as above)

## Value adjustment list (transfer update-abilities-override)

- `system_name` | Recommend buff | Reason: The winning rate XX% is lower than the average Xpp of the same level, n=XXX
- `system_name` | Recommend nerf | Reason: OP signal

## Summary

- Upshift: N items / Downshift: N items
- Strengthening suggestions: N pieces / Weakening suggestions: N pieces
- Users to be inquired: N items
- No change：N items
```

---

## Step 9: User confirmation

outputs the plan file path and informs the user to check and confirm. Wait for user approval before entering the execution phase.

---

## Step 10: Perform pool structure adjustment (after user approval)

### 10.1 Process the "Ask User" tag item by item

Call AskUserQuestion **separately** for each ability of `Ask user (abnormal T1 win rate)` or `Ask user (very low pick rate)`:

- T1 abnormal winning rate options: `Buff values` / `Remove` / `Keep and observe`
- The selection rate is too low: `Lower one tier (increase exposure)` / `Buff values` / `Remove` / `Keep and observe`

### 10.2 Modify lottery-abilities.ts

Use the Edit tool to process the ability of each strip with the "up/down" label:

1. is deleted from the old `names` array (including its Chinese comment lines)
2. Insert the new file `names` into the array and try to put it into similar partitions (`// 大招` / `// 小技能` / `// 自定义技能` / `// 法球/开关技能` / `// 单位技能`)
3. retain the original Chinese annotation

**Pair removal class**: Remove the row (with comments) from the array.

**No modification** `BASE_TIER_RATES` / `PREMIUM_TIER_RATES`.

### 10.3 Handover of numerical adjustment suggestions

For each `Recommend buff` / `Recommend nerf` / ability selected by the user as "enhancement value":

- calls `update-abilities-override` skill to process the corresponding KV value
- processes one ability at a time and confirms the value changes with the user individually.

### 10.4 Verification prompts

prompts after completion of execution:

- runs `npm test`
- Enter the game and actual draw to verify the frequency changes of high-end occurrences

---

## Skill interaction specification

- **Insufficient data → Stop working** (Step 3), no plan is generated.
- **T1 The winning rate is abnormal/the selection rate is too low → AskUserQuestion**, one question and one answer.
- **Chinese name cannot be found → Skip**, do not ask.
- **Numerical enhancement/weakening → Transferred to `update-abilities-override`**, KV will not be changed in this skill.
- **Adjustment range**: Normal ±1 level; extreme (n≥300 and deviation >15pp) only ±2 levels.
- **No modification** `BASE_TIER_RATES` / `PREMIUM_TIER_RATES`.
