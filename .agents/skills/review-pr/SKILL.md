---
name: review-pr
description: "Review changes using this repository's established review criteria. Use when the user requests review of a PR, branch, or proposed changes."
---

# PR Review Process

1. **Input**: The user provides the PR number or branch name.
2. **Confirm checkout**: Ask whether switching is required. Only fetch the target branch when needed, while retaining the ability to push to the original PR branch:
   - has a PR number: first use `gh pr view <PR_number> --json headRefName,headRepository,headRepositoryOwner` to obtain the PR head branch and repository URL.
   - uses an independent remote (such as `review-pr-<PR_number>`) for this PR, uses `git remote add --no-tags -t "<headRefName>" "review-pr-<PR_number>" "<headRepositoryUrl>"` to limit the fetch refspec to this branch, and then executes `git fetch --no-tags "review-pr-<PR_number>"`. **DO NOT** Use the author's fork remote with `+refs/heads/*`, nor `gh pr checkout` which would create such a wildcard remote; local Git auto-sync may pull the entire fork as a result.
   - creates a **local branch** with the same name from `review-pr-<PR_number>/<headRefName>` and sets upstream; the same name allows `git push` to be directly returned to the original PR branch after modification. If a local branch with the same name or a review remote with the same name already exists, check the URL, upstream and workspace status first, and do not overwrite or delete it directly. After
   - checkout, use `git config --get-all remote.review-pr-<PR_number>.fetch` to verify that only `+refs/heads/<headRefName>:refs/remotes/review-pr-<PR_number>/<headRefName>` exists, and use `git for-each-ref refs/remotes/review-pr-<PR_number>` to confirm that only the target branch exists. After the
   - PR is completed and push is no longer needed, the user can be asked whether to execute `git remote remove review-pr-<PR_number>` to clean up the remote-tracking ref of the PR; the local modified branch will not be deleted with the remote.
   - only has the branch name (same repository): `git switch <branch>`.
3. **Generate report**: Review the changes according to the following judgment criteria, explain from the user's perspective what functions are implemented, whether the implementation method complies with the specifications, and whether there is over-design or redundant testing that deserves to be simplified. At the same time:
   - shown in full in conversation
   - is downloaded to `docs/review/pr-{PR_number}.md` (reduced to `docs/review/review-{branch_name}.md` when there is no PR number); `docs/review/` has been added to `.gitignore`, and the report will not be entered into version control.
4. **Update log check**: After the report is given, first use one or two sentences to reiterate to the user the actual impact of this change on the player (for players, not code details), and then check whether the update log has been written:
   - Use `gh pr list --repo windy10v10ai/game --state open --label release --json number,title,url` to find the aggregate release PR, read its body to see if there are entries for this change When
   - is missing, use `AskUserQuestion` to ask the user whether to rewrite it; if the user agrees, call `release-note` skill to generate it.
   - **The log is only written to the release PR, not the reviewed function PR**
   - Pure reconstruction, documentation, CI and other changes that are not perceptible to players, directly explain that no logs are needed and no questions are needed.
5. **Confirm item by item**: Ask the user one by one whether they need to deal with the problems listed in the report.
   - The items that the user chooses not to process will be written back into the report md, marked as "Confirmed Ignore" and the reason.
   - User additionally pointed out problems not listed in the report, added them to the independent section "User Supplementary Problems" in the report md, marked them as "User Supplements, Claude did not find", and incorporated them into the next step for processing one by one.
6. **Select processing method**: For the issues confirmed to be dealt with (including those added by users), users will be asked one by one to choose "modify by themselves" or "comment to PR":
   - Modify by yourself: edit directly on the branch of the current checkout
   - comment to PR: Submit with `gh pr comment` or inline comment according to the output specification below
7. **Add feedback log**: Mark the "Confirmed Ignore" and "User Supplement" entries with their respective judgment standard categories (corresponding to 1-6 below or "Dependency Upgrade"; those that do not belong to any existing categories are marked "New"), and add them to `docs/review/_feedback-log.md` (also gitignore): date, PR/branch, category, decision (ignored/supplemented), brief description.
8. **Trigger self-optimization**: Check the log after appending - the same category is ignored ≥3 times in a row, or the user's supplementary question appears ≥2 times in the same category, call `doc-update` skill, propose to adjust the judgment criteria of this SKILL.md (add new entries/adjust expressions or priorities/reduce the weight of outdated entries), and write it after confirmation by the user.

# PR Review Judgment Criteria

is sorted by the frequency of occurrence in this repository's history review. The higher the position, the more repeatedly emphasized the position.

## 1. Root causes take priority over surface repairs

When encountering a bug, first locate the real mechanism and explain the mechanism instead of just describing the symptom fix. Common root cause categories: `LinkLuaModifier` is not registered, causing the referenced modifier to never take effect, and local constants with the same name as the global Dota engine are lexically obscured (see `src/vscripts/CLAUDE.md` "Do not use local constants with the same name globally as the Dota engine"). When you find similar problems, give priority to pointing out the root cause location, rather than staying at "this should be changed to X".

## 2. Give priority to reusing Dota’s native mechanisms and be wary of creating your own parallel logic.

A complete set of state synchronization/numeric conversion logic is hand-crafted to simulate a certain effect. It is the most bug-prone, most difficult to troubleshoot, and the most expensive type of implementation. When you see this kind of code, you should ask: Is there any ready-made vanilla ability mechanism, modifier, or helper in the existing project that can be reused instead of re-implementing it in parallel? This kind of problem deserves to be pointed out clearly in the comments, even if it can be solved.

performance is another price: if a custom Lua modifier declares a large number of attribute fields, or relies on `OnIntervalThink` to detect the synchronization status frame by frame, the overhead is significantly higher than the Dota native modifier that can be directly reused through shelling. When reviewing this type of implementation, you should ask more about whether it can be replaced with a native modifier, rather than just "it can run".

## 3. Test validity

For the criteria, see the "Testing" chapter of `src/vscripts/CLAUDE.md` (only its own branch/computation logic is tested, and the engine contract is not tested). During review, check against this standard whether the new test actually verifies the logical branch, or is just a string match or a pure mock call assertion.

## 4. KV / localization consistency and deduplication

- KV field alignment uses tabs without spaces, and the color code is capitalized (see `game/resource/CLAUDE.md` "localization text specification")
- The same constant/price hard-coded in multiple places (such as the cost of the bot's tier configuration and the ItemCost of the KV) should be converged into a single source.
- KV fields that become invalid after the mechanism is changed (such as `AbilityUnitTargetTeam`/`Flags` left after the target selection method is changed) must be cleaned up together and do not leave dead configurations.

## 5. Large-scale player-side impacts require phased verification

When it comes to full difficulty/global mechanism changes or balance changes, it is recommended to make it optional first, or verify it in custom mode first, rather than directly enabling it for all players.

## 6. Dota-specific correctness checks

For explicit damage flag bits (`DamageFlag.REFLECTION`/`NO_SPELL_AMPLIFICATION`, etc.) and ability enhancement, and the upper limit design to prevent the value from being infinitely increased, please refer to the existing corresponding entries in `src/vscripts/CLAUDE.md` "Common Traps".

## Dependency and package upgrade PRs

When a PR upgrades dependencies of `package.json` (such as a PR automatically initiated by dependabot), in addition to the above general standards, it also requires:

- Explain the role of this package in the project: runtime dependency or devDependency only for building/testing, which modules/links are used
- Assess upgrade risks: version span (patch/minor/major), whether there are any known breaking changes or security bulletins, whether it affects build products or runtime behavior
- gives clear processing suggestions, divided into categories:
  - **Can be merged directly**: devDependency or minor version/patch upgrade with small impact, no destructive changes
  - **Recommended to merge after testing**: It affects the build product or runtime behavior, or the change description is not clear enough, so you need to run the build/in-game verification first
  - **Need to be modified and merged**: The upgrade brings destructive API changes. There is code in the project that relies on old behaviors, and the code needs to be changed simultaneously.

## output specification

- first outputs the review results in the conversation and does not publish them directly to PR; only when the user explicitly instructs to publish, `gh pr comment` (top-level review) or inline comments (located to specific lines of code, selected according to the needs of the problem) are used to submit, and the formal APPROVE/REQUEST_CHANGES status is not submitted - the final merge decision is left to the manual
- Concise, arranged by problem severity, not a line-by-line list
- It is enough to point out minor issues without requiring the other party to make major changes; only differences at the structural level such as Article 2 above are worthy of a stronger tone.
- Give a brief positive confirmation when you cannot find a substantive issue. Do not write for the sake of writing.
- follows the CLAUDE.md "reply style": each question first explains the vanilla mechanism involved or the current situation before the change, then what the PR has been changed to, and finally the question and the specific actions the user needs to take. Do not use the entire heap function name or variable name. The code name should only be supplemented after the Chinese description.
