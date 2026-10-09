---
name: create-pr
description: "Create a feature branch, commit and push changes, and open a pull request. Use when the user requests a PR or completed implementation needs code review."
---

# Create Pull Request workflow

The complete process from creating a function branch to `develop` to initiating a PR.

---

## branch naming

- issue driver: `feature/{issue-number}-{branch-name}`, such as `feature/123-add-new-hero-ai`
- non-issue driver: use `fix/` `chore/` `docs/` prefix according to the nature of the change, such as `chore/remove-universal-rune`
- For prefix selection, worktree and multi-session isolation rules, see CLAUDE.md "Git Workflow › Branch"

---

## Step 1: Create a branch from develop

**must** be cut out from the latest `develop` and not derived from the current branch (which may be other unmerged feature branches):

```bash
git checkout develop
git pull
git checkout -b <prefix>/{issue-number}-{branch-name}
```

When there are uncommitted changes that need to be brought into a new branch locally, just cut the branch directly and the changes will follow. Do not use `git stash` to move: when the stash is not saved, `git stash pop` will pop up the old archive left earlier.

---

## Step 2: Development and submission

Commit format: short single-line title (≤72 characters) + text only write `Co-Authored-By`, no other description - leave detailed description to PR description.

```bash
git add <relevant_files>
git commit -m "$(cat <<'EOF'
<short_title>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

only stages files that are clearly related to this request; if the current branch does not meet expectations (for example, it should be in the feature branch but is in `develop`/`main`), first confirm the target branch with the user before submitting.

---

## Step 3：Push

**Push to the upstream remote of this branch. Do not write `origin` permanently. ** The upstream of your newly cut branch is `origin` (`-u` is pushed for the first time); if the branch follows the cross-repo PR raised by someone else's fork, the upstream is the remote of that fork, and pushing to `origin` will only create an additional branch with the same name in the main repository, and the PR will not receive new commits. Before pushing, confirm the upstream:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

---

## Step 4: Create Pull Request

- **base branch is fixed to `develop`**
- Using template `.github/pull_request_template.md`
- **Issue section**: When the branch name matches `^(feature|fix|chore|docs)/(\d+)`, extract the number and fill it in `- [ ] fix #<issue-id>` of the template; if there is no match, keep the placeholder or delete the line
- **Release Note Section**: First press "Release Note Three Select One" below to determine which track to take this time; when you need to write, you must call the `release-note` skill to generate\*\*, do not write by hand
- **PR title uses English by default**, brief summary change (≤70 characters)
- ** Matters to be confirmed/to be verified should be written in the `## Checklist` paragraph, using checkbox format** (such as `- [ ] Verify that the bot opens the armband correctly in Dota Tools`). Do not open another prose paragraph such as "To be confirmed" - when reviewing, you need to be able to check items one by one, not read a paragraph of explanatory text

```bash
gh pr create --base develop --title "<English_title>" --body-file <filled_template_file>
```

### interface screenshot

**Only put when the interface is changed** (Panorama layout, style, localization text that players can see), pure logic, numerical values, and AI changes will not be put.

- **Only capture Chinese by default**; when changing the interface localization text, capture a set of Chinese, English, and Russian languages to ensure that the long text does not overflow or crowd out the elements next to it.
- Only show the changed picture, only show the before change if you want to compare.
- **Picture-taking sub-agent, use `model: "sonnet"`**: Starting the server, waiting for loading, screenshots, and cropping are all fixed processes. It is very expensive to read back the pictures in the main session. In the handover, the state to be photographed, the cropping area, and the storage directory (session scratchpad) are written. The subagent reports the file path and "whether there is overflow, truncation, or white screen"; the main session only sees the final cropped small image. haiku cannot determine the typesetting problem, so don’t use it.
- Local dedicated service + client startup method and division of labor for sub-agent see `dota-live-test` skill; client plus `-language english` / `-language russian` all languages, start each language separately The

picture is placed in `pr/<PR_number>/` of the `assets` orphan branch, but not in the `develop` source tree. There is a PR number in the path, so the order is **Create the PR first, then push the image, and then `gh pr edit` update the text**:

```bash
git worktree add --detach <temporary_directory>/wt-assets origin/assets
cd <temporary_directory>/wt-assets && git checkout -B assets origin/assets
mkdir -p pr/<PR_number> && cp <image> pr/<PR_number>/
git add -A && git commit -m "Add screenshots for PR #<PR_number>" && git push origin assets
```

used up `git worktree remove <temporary_directory>/wt-assets --force`. The main text is quoted by `https://raw.githubusercontent.com/windy10v10ai/game/assets/pr/<PR_number>/<name>.png`. After pushing, please confirm by `curl -o /dev/null -w '%{http_code}'` 200. The retaken image has a new file name without overwriting the old file: GitHub caches the image in the PR by URL, and the old image is still displayed after being overwritten with the same name.

screenshot is placed before `## Checklist`, with a separate section of `## Screenshots`.

### Release Note Choose one of three

#### First determine whether the change is purely internal.

satisfies all two requirements and is **Purely Internal Change**:

1. The object of the change is code structure, build, CI, documentation, comments, testing or development debugging tools
2. Players cannot read an "update content" in the game - there is no addition or removal of content visible to the player, no numerical and balance changes, no UI and localization text changes, and whether the bot will use a certain ability or item has not changed. Even if the

refactoring and code migration bring about minor differences (changes in threshold criteria, removal of logic that overlaps with the existing system), as long as players do not read it as an update, it is still considered a purely internal change.

**Purely internal changes**: skip directly, no questions asked, no version number checked, no calling the `release-note` skill, delete the `## Release Note` segment in the PR template, and state in the PR description that there is no gameplay impact this time.

**No, or cannot be determined**: Click one of the three options below to ask a question.

#### Choose one of three when you can’t decide by yourself

uses `AskUserQuestion` to allow users to select one of the three tracks, and then check the version number after selecting - there is no need to check Steam and release PR when "Don't write" is selected:

| Options                                      | Applicable changes                                                                               | Follow-up actions                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Minor version patch (recommended by default) | Regular changes, accumulated under the current major version                                     | Call `release-note`, the parameter indicates "minor version patch"                                          |
| Large version                                | This time released as a new major version                                                        | Call `release-note`, the parameter indicates "large version", and it will be synchronized by `GAME_VERSION` |
| Do not write Release Note                    | The gameplay impact is at the borderline and the user does not judge the changes to be announced | Skip the skill and delete the `## Release Note` segment in the PR template                                  | The specific version number of |

(`v5.xx` / `v5.xxa`) is determined by `release-note` skill after this selection; this question only asks about the track and does not allow users to report the version number directly.

---

## Common Traps

- **Push to `origin` instead of the real upstream of the branch**: Check `gh pr list --head <branch>` to see if the branch already has a PR before taking action. If it already exists, it will no longer be created. Instead, it will be pushed to its head repository (cross-repo PR requires `maintainerCanModify` to be true) and the original PR link will be reported. The performance of pushing to the wrong place is that the main repository has branches with the same name out of thin air, but the head commit of the PR has not changed.
- **The branch is not cut out from develop**: If you directly `checkout -b` on another feature branch, the new branch will carry the unmerged changes of the previous branch, and the PR diff will contain irrelevant content
- **Release Note Handwriting**: You must run the `release-note` skill first, do not directly copy the change list and piece it together
- **Items to be confirmed should be written as independent paragraphs**: They should be placed in the same `## Checklist` as `I have tested the changes works well.`, each with a checkbox
- **Check the version number first and then ask about the track**: Check Steam and release PR when the track is not decided. When choosing "Don't write a Release Note", these queries are all in vain and will drag the user into unnecessary version number decisions.
- **Please ask questions for purely internal changes**: Refactoring, deleting code, building and document changes can be skipped at your own discretion. Asking questions only asks the user to confirm the obvious conclusion again.
