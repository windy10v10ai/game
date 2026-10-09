---
name: dota-review-pr
description: "Review changes using this repository's established review criteria. Use when the user requests review of a PR, branch, or proposed changes."
---

# Project PR review

For a PR checkout, inspect its head repository and branch first.
Use a dedicated `review-pr-<number>` remote restricted to that branch:
`git remote add --no-tags -t <head-branch> <remote> <head-url>`,
then fetch without tags.
Avoid wildcard fork refspecs and `gh pr checkout` that creates them:
local auto-sync can fetch the whole fork.
Verify the fetch refspec and remote refs are limited to the intended branch.
Preserve existing remotes/branches; do not overwrite a conflicting checkout.

Project-specific review concerns:

- Native modifier reuse and static KV properties versus high-frequency
  Lua property callbacks or parallel state synchronization.
- Missing modifier registration, engine-name shadowing, damage flags,
  unintended spell amplification, and unbounded scaling; see
  `src/vscripts/CLAUDE.md`.
- KV/localization alignment, stale targeting flags, duplicate price/constants,
  and meaningful owned-logic tests rather than engine-contract mocks.
- Global difficulty/balance changes need staged in-game verification.
- Dependency upgrades require checking whether they affect build output or
  runtime behavior and completing appropriate build/live checks.

Keep local reports under ignored `docs/review/pr-<number>.md` or
`review-<branch>.md`, including user supplements and explicitly ignored findings.
Only publish comments when requested; do not submit formal approval/change-request
status on the user's behalf.
Review-only authorization does not authorize implementing findings.

For player-visible changes, check the matching repository's open release PR.
If notes are missing, ask whether to add them through $dota-release-note;
review-generated notes go to the release PR, not the reviewed feature PR.
Internal-only changes need no release note.
