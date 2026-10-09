# Git

- Branch names: `feature/<issue-id>-<summary>` for issues; `fix/`, `chore/`, or `docs/` otherwise. Summaries use 3–6 lowercase English words in kebab case.
- Use the clean checkout unless uncommitted changes, an active unmerged branch, or actual shared use require a worktree. Do not switch another session's checkout.
- Before leaving an old merged branch, verify its PR is merged, HEAD matches the PR's final commit, and status is clean; then return to `develop`, delete it, and branch again. Neither a remote marked `gone` nor `git branch --merged` reliably establishes squash-merge status.
- Use `.agents/skills/create-pr/SKILL.md` for commits, pushes, PR templates, and release-note decisions. PRs target `develop`. Use `Fixes #<issue-id>` only when completing the entire issue; otherwise reference `#<issue-id>`.
- Add small wording/comment/instruction changes to an existing unmerged PR and mention them in its description. Split when the theme conflicts, the PR is merged, or the change needs more than two sentences to explain. Without an open PR, defer small changes unless time-sensitive or blocking someone.
- Merge commands: `gh pr merge <number> --squash` into `develop`, `--merge` for releases into `main`, `--auto` while CI is pending; never use `--admin` to bypass protection.
- After a verified merge, return to `develop`, pull, and remove the local branch (`git branch -D` for squash merges). For merged worktrees, use `git worktree remove <path> --force`, remove the branch, and run `git worktree prune`.
