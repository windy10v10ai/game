# Commits, PRs, and Merging

## Commits and PRs

- The PR base branch is always `develop`; titles are in English by default. For purely internal changes (refactoring, build, CI, docs, tests) decide on your own to skip the Release Note, without asking or checking the version number; otherwise ask the user to choose "patch / major version / no Release Note". When one is needed it must be generated with the `release-note` skill, never written by hand
- Write `Fixes #<issue-id>` in the Issue section only when the PR completes the entire scope of the issue, so merging closes it automatically; when an issue is split across several PRs, each PR only references `#<issue-id>`, and only the last PR that completes the full scope uses `Fixes`
- Commit format: a short single-line title (≤72 characters) + a body containing only `Co-Authored-By`
- The whole `docs/superpowers/` directory is excluded by `.gitignore`; spec documents produced by the brainstorming skill are kept locally only, not under version control — do not try to `git add` them

Only stage files clearly related to the current request; check `git status` before committing and do not include changes from other sessions or the user's own work. No need to list them for the user to confirm one by one. But if the current branch is not what you expect before committing (e.g. you should be on a feature branch but are on `develop`/`main`), ask the user to confirm the target branch first.

## Riding Along Small Changes

When you have an unmerged PR in hand, small changes like doc wording, comments, or convention additions go straight into it instead of opening a PR for each, with one sentence noting it in the PR body. Open a separate branch if any of these holds:

- It conflicts with the current PR's topic
- The current PR is already merged
- It cannot be explained in a sentence or two

With no open PR, hold them until the next PR; only open a separate one when the change is time-sensitive (blocking others, a live issue).

## Merging and Cleanup

Execute merges directly when the user gives a merge instruction; never merge on your own initiative:

- `feature` / `fix` / `chore` / `docs` → `develop`: `gh pr merge <number> --squash`
- `develop` → `main` (release PR): `gh pr merge <number> --merge`

Add `--auto` when CI has not finished; never use `--admin` to bypass branch protection.

Clean up the local branch immediately after merging; remote branches are deleted automatically by repository settings. Git does not recognize squash-merged branches as merged, so `-D` is required:

```bash
git checkout develop
git pull
git branch -D <branch-name>
```

If the branch is in a worktree, first `git worktree remove <path> --force`, then delete the branch, then `git worktree prune`.

For the full flow (branch creation, commit, push, filling in the PR template) see the `create-pr` skill.
