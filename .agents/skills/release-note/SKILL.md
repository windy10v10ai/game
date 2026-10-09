---
name: release-note
description: "Generate Chinese and English Steam Workshop release notes and optionally update an open PR. Use when a PR needs release notes; do not use for purely internal changes."
---

# Changelog

generates Chinese and English update logs for Windy10v10AI Steam Workshop.

## How to use

### manual

```
/changelog 5.11 修正猴子棒击、新增火焰风暴、同步7.40c
```

### PR from GitHub

```
/changelog #1234
```

Read the title, description, and commits from the PR and extract the updated content.

### from GitHub Issue

```
/changelog https://github.com/windy10v10ai/game/issues/1952
```

URL contains `/issues/` → Issue; there are two paths to pull the text:

**A. Standard path** (The text contains the lists of `### 7.41 同步核对` and `- [x]` / `- [ ]`):

1. `gh issue view <N> --repo windy10v10ai/game --json body`
2. intercepts the list lines between `### 7.41 同步核对` and the first `**说明**`.
3. counts completed `- [x]` and unfinished `- [ ]`; the total number = the sum of the two.
4. The completed hero name is used in "Multiple Heroes Parallel" and ends with `（Issue #N 英雄核对进度 x/总数）` / `(Issue #N hero checklist: x/total)`.
5. Remove BOM (`\uFEFF`) when parsing JSON.

**B. Fallback path** (no checklist): Write 2-5 player bullets according to the Issue title and description, **Do not** make up `x/total`.

## applicable scope

purely internal changes (refactoring, building, CI, documentation, testing, players cannot read a single update content) do not call this skill, and do not need to determine the version number; for the judgment criteria, see the "Release Note Three Select One" of the `create-pr` skill.

## version number decision (priority from top to bottom, hit and use) The

version number must be the specific `v…` string, and placeholders are prohibited. Format: Main version `5.00`/`5.10`, patch `5.00a`/`5.00b`.

When the caller (such as `create-pr`) has indicated in the parameters whether to use "major version" or "minor version patch" this time, **do not** repeat the question, skip the choice of one in step 3, and only use this track to solve the specific version number.

### 1. Explicit version supplied by the user

Appears in parameters`v5.xxa` / `5.xx`etc., the direct specification is`v…`use.

### 2. Special instruction `版本号+1`

Steam latest removes the letter suffix +0.01 to get the next major version (such as `v5.19b` → `v5.20`). If the open release PR versions are consistent, adopt them directly; if they are inconsistent, ask the user.

### 3. Open release PR large version > Steam (recommended value, please ask the user)

**Must WebFetch first** [Steam Workshop Changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2307479570)Take the first version on page 1 as the latest version of current Steam - **You must re-fetch each time you perform this step, and cached results from earlier sessions must not be used. **

```bash
gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url
```

- **release PR large version is strictly higher than Steam** (Steam `v5.45b`, release PR `v5.46`) → release PR version is only **recommended value**, use `AskUserQuestion` to let users choose one of the two (directly take the corresponding one when the track has been indicated by the caller):
  - Large version `v5.46` (recommended, that is, release PR title version)
  - minor version patch `v5.45c` (incremental result of step 4)
- **Steam has released the same version as the release PR** (Steam `v5.46`, release PR `v5.46`) → Go to step 4.
- Multiple release PR → Ask the user which one to use. The recommended value of

> cannot be used directly: release PR is automatically created by `create_release_pr.yml` after any PR is merged into `develop` (version = latest tag major version + 1). Its existence only indicates that there has been a merge, and does not mean that this change is released as a major version - users are often still patching minor versions continuously.

Regardless of whether the user chooses a major version or a minor version patch, this entry must be merged into the PR according to the "Aggregation Release PR" below.

### 4. Default: Steam increases patch letters with the same major version

Use the latest Steam version that has been fetched in step 3, and increment the letters under the same major version (`v5.19b` → `v5.19c`; `v5.20` → `v5.20a`). If there is no letter, the next level is `a`. Unable to parse when asking the user.

> `GAME_VERSION` (`GameConfig.ts`) does not contain a/b/c suffix; `v5.xxa` can appear only in Workshop localization text.

## output format

Chinese:

```
[b]游戏性更新 v5.20[/b]

- 更新内容
```

English:

```
[b]Gameplay update v5.20[/b]

- Update content
```

must be a real entry when delivered and no placeholders may be retained.

### Multiple heroes tied together

The same bullet lists all heroes; Chinese is separated by **, ** (full-width commas), ** prohibits ** from commas **, **; English is separated by **, **.

**Hero range determination rules:**

- **PR**: Extract the actual changed ability prefix (such as `pudge_`, `silencer_`, etc.) through `gh pr diff <N>`. Only the heroes actually involved in \*\*this PR are listed, and the heroes of other PRs must not be included.
- **Issue checklist**: Only heroes with `- [x]` checked are listed

**Progress mark (required for Issue + checklist):**

- Chinese: `（x/总数）` immediately after "ability update" and before the colon
- English: `(x/total)` Same location

sentence template:

```
- 同步 Dota 2 7.41 英雄的技能更新（x/总数）：英雄A，英雄B，英雄C
```

```
- Synced Dota 2 7.41 ability updates (x/total): Hero A, Hero B, Hero C
```

hero name **must** be looked up from localization files, **not allowed** from `abilities_schinese.txt` / `abilities_english.txt` guesses:

```bash
# Check the Chinese name of the hero (take pugna as an example)
grep -i "npc_dota_hero_pugna" game/resource/addon_schinese.txt
# If there is no result, check from the docs reference file
grep "npc_dota_hero_pugna:n" docs/reference/7.41/abilities_schinese.txt

# Check the English name of the hero
grep -i "npc_dota_hero_pugna" game/resource/addon_english.txt
grep "npc_dota_hero_pugna:n" docs/reference/7.41/abilities_english.txt
```

is not found, the value of the `npc_dota_hero_<id>:n` row in `docs/reference/<version>/abilities_schinese.txt` is used.

## Writing Principles

1. Be concise and clear, try to compress each item into one sentence; use commas to string multiple change points for the same goal in this one sentence, do not create a new sentence for each change point
2. Write the important ones at the front
3. Chinese full-width punctuation, English half-width punctuation
4. is expressed directly in both Chinese and English: avoid starting with `Fixed an issue where X...` in English and write directly `Fixed X...`; in Chinese, remove causal connections and referential function words such as "because of" and "this time", and directly state the changes
5. item/ability names and their internal effect/gain names (such as the specific name of "switch" ability) must be searched from the localization file (`addon_schinese.txt` in Chinese, `addon_english.txt` in English) before use. **It is forbidden to make up based on impressions/common Dota terminology** - the same item may have different effect names in different mods. Wrong writing is equivalent to fabricating a non-existent mechanism.
6. Prioritize using abbreviations and active sentence patterns that players are familiar with (such as "magic immunity/magic resistance" instead of "magic immunity, magic resistance and other effects"; "no longer triggers X" instead of "can no longer be selected by X"), avoid passive voice and long written sentences

### player to

- **Prohibited** Maintenance-oriented terms: KV, override, alignment reference, comment, AbilityValues, file path
- **Avoid** technical details (specific multiplier decimals, etc.) unless requested by the user; specific values that players need to understand (such as points multiplier tier) can be retained
- **Priority** Player perception: Who and what type of gameplay has changed to strengthen/weaken/correct
- **Do not write**awakening the increase or decrease in the limited-time free list (`FREE_TRIAL_HEROES` adds/removes heroes), even if the list is changed in the same PR
- **Bot AI behavior changes (add/amend bot's usage logic for a certain item or ability) only need to explain the behavior direction itself** (Chinese "bot now actively uses/activates XX", "bot no longer misuses XX"; English "Bot now actively uses/activates XX", "Bot no longer misuses" XX"), there is no need to describe what the effect of the item/ability is and what the value is - these are the inherent effects of the item/ability itself, not the content of this change. Writing them out will overwhelm the focus.
- Use the "multi-hero juxtaposition" sentence pattern when following up on multi-hero ability
- **Multiple changes to the same target are combined into one**: Multiple changes to the same hero/item/system (name changes, bonuses, new mechanisms, etc.) are strung into one sentence with commas. Do not open a separate bullet for each change point. Real case:
  - "Reworked the Infinity Gauntlet: changed the formula and attributes, added the active ability "Destroying Snap", with a 50% probability of directly annihilating the enemy hero" (recipe + attributes + new ability merged into one)
  - "The Monkey King's ultimate has been changed to Fighting the Victorious Buddha, and the Monkey King's awakening has been added: Ruyi Golden Cudgel's additional damage and casting distance have been increased, and the ultimate can be cast while being controlled, and the ability immunity is obtained" (renamed + multiple awakening effects merged into one)
- **Irrelevant small changes can also be merged side by side**: When multiple independent small corrections are very short, commas are allowed to be written side by side in the same article without having to expand them one by one. Real case: "Correction of Shadow Fiend, Phantom Assassin's awakening magic immunity will replace the Black King's Rod's magic immunity, Sniper Assassination's awakening comes with additional physical damage, and basic A staff stun" (Three unrelated corrections merged into one)
- **When the changes are trivial and numerous, use a general statement** instead of listing them one by one: "Fix some bugs and balance changes"
- The overall number of items is selected according to the amount of changes, usually 1-6 items; priority is given to merging and compressing the number of items, rather than opening more bullets to plug in each change point
- **The inside of each line should still be compressed into one line and one sentence and be as short as possible**: Remove the supplementary explanation in brackets, the ability enhancement name in quotation marks, spell amp/specific mechanism and other minor restrictions, leaving only the core changes that players can perceive. Example: Write "Newly added Lina awakening: Each time she releases Divine Slash, she will cause additional pure damage to the target equal to the damage of this Divine Slash", and no longer add "(affected by ability enhancement)"

### Extract information from PR

- is first extracted from the update list in the description; if there is no list, 3–5 items are inferred from commits
- When generating a large version block that aggregates release PRs, changes that have appeared in its reserved small version blocks or published small versions will not be written repeatedly; the large version block only retains the content to be released in this round.
- Note synchronization, KV comparison, and pure document changes will not be written if there is no gameplay impact.
- Multi-hero ability synchronization is summarized into a player bullet
- Numerical changes are expressed in qualitative terms unless specified by the user

## Common terminology comparison

| Chinese             | English            |
| ------------------- | ------------------ |
| Sync Dota update    | Sync Dota update   |
| Fix                 | Fix/Fixed          |
| New                 | Add/Added          |
| Adjustment          | Adjust/Adjusted    |
| ability draft pool  | Ability draft pool |
| Money/XP multiplier | Gold/XP multiplier |
| Neutral items       | Neutral items      |
| Battle point        | Battle point       |
| bot                 | Bot/Bots           |

## GAME_VERSION sync

File: `src/vscripts/modules/GameConfig.ts` without a/b/c suffixes (`v5.20` not `v5.20a`).

- The larger version of **the version selected this time** (removing a/b/c) is different from `GAME_VERSION` → **must be automatically modified** `GameConfig.ts`, **cannot be omitted**
- selected the minor version patch and the major version remains unchanged → No change (even if there is an open release PR of a higher version)

## Update Release Note of open PR

After generating the localization text, use the **option menu** to allow the user to select an operation (write function PR + merge into aggregate release PR / only write function PR / only commit changes / skip), and execute as selected.

uses the same editing process in both places: `gh pr view <N> --repo windy10v10ai/game --json body -q .body` takes body → change → write to temporary file (**UTF-8 without BOM**) → `gh pr edit <N> --body-file <file>`.

### Write current function PR

```bash
gh pr list --repo windy10v10ai/game --head $(git branch --show-current) --state open --json number,url
```

points by default if there is exactly one; if there are multiple, let the user select the number first; without open PR, only localization text will be output.

Keep the content above `## Release Note`, replace this title to the end of the article: splicing `## Release Note` + Chinese fence block + English fence block.

### Aggregate release PR

Label`release`the open PR(`develop → main`, the title is the major version number) is the **aggregation container** of all entries in this round: the major version entries are on top, and the unreleased minor version patch entries are accumulated in chunks according to version numbers.`---`under. This entry is **always** merged in, not just left in the feature PR. layout (reference [#2253](https://github.com/windy10v10ai/game/pull/2253)）：

```
## Checklist

- [ ] Update game version number

## Release Note

<Large version Chinese fence block>
<Large version English fence block>

---

<The patch version’s associated PR link and other checklist lines are manually maintained by the user>

<Patch version Chinese fence block>
<Patch version English fence block>
```

- **This is a minor version patch** → Only move under `---`: When the patch version number already has a fence block, the Chinese and English entries are appended to the end of the existing list; when it is a new patch version number, `---` + Chinese and English fence blocks are added at the end of the article. The large version fence block remains intact with the existing checklist line under `---`.
- **This is a major version** → Replace the Chinese and English fence blocks between `## Release Note` and the first `---`; all patch blocks under `---` are retained (each patch version has posted a log on Steam once, and the files will not be cleared).

## execution steps

1. **Determine parameter type** (Issue and PR numbers are independent):
   - URL contains `/issues/` → Issue (with checklist → path A; without → path B)
   - URL contains `/pull/`, or `#N` / pure number → PR
   - Others → Manual
2. **Determine the version**: Execute according to the "Version Number Decision" 1→2→3→4 priority; when step 3 is hit, the user must be allowed to choose between a major version and a minor version patch. If the caller has indicated the track, it will be used and no more questions will be asked.
3. **Generate update log**: Issue+checklist lists completed heroes and attaches `x/total`; PR lists all heroes; manually lists points by user.
4. **GAME_VERSION synchronization**: When major version changes, `GameConfig.ts` must be modified immediately and must not wait for user reminders.
5. **Output** Chinese and English versions, the title contains the specific version number.
6. **Write PR**: Use the options menu to let the user select the operation and execute it - write the current function PR, and merge the entries into the corresponding version block of the aggregate release PR.

### Self-inspection before delivery

- version number is a specific string, consistent in Chinese and English
- open release PR When the major version is higher than Steam, `AskUserQuestion` has been used to confirm whether to use the major version or the minor version patch; if the caller has indicated the track, the choice will be used, and there will be no repeated questions. The
- entry has been merged into the corresponding version block of the aggregate release PR, and the large version block remains intact with other patch blocks.
- Issue checklist `x/total` Statistics are correct; no checklist, no fabrication
- The multi-hero list is consistent with the actual range
- No maintenance technical term
- The same goal/same change topic is not split into multiple bullets; those that can be merged have been merged into one bullet with commas.
- have been verified by grep localization files, and there are no nouns made up based on impressions.
- Bot AI behavioral changes only describe the behavioral direction, but do not describe the effects or values of the item/ability itself.
