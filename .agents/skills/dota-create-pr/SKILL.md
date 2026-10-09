---
name: dota-create-pr
description: "Create a feature branch, commit and push changes, and open a pull request. Use when the user requests a PR or completed implementation needs code review."
---

# Contributions and PRs

Branch/worktree/merge rules belong to [Git workflow](../../docs/git-workflow.md).
PRs target `develop`; use `.github/pull_request_template.md`.
Titles are English, at most 70 characters.
Commit subjects are at most 72 characters; put detailed explanation in the PR,
not the commit body. Any co-author trailer must identify the actual contributor.

Before pushing, inspect the branch upstream and any existing PR.
Push to the PR's head repository, not a hard-coded `origin`.
Check fork modification access when updating another author's PR;
do not create a second same-named branch in the wrong repository.
Stage only task changes and run both required builds before committing.

Use `Fixes #N` only for complete issue resolution.
Put outstanding verification in `## Checklist` checkboxes.
Pass multiline PR text through a UTF-8 temporary file and `--body-file`.

## Release notes

Skip release notes and version lookup for internal-only refactoring, tooling,
CI, tests, or documentation with no player-visible change.
Remove the unused template section.
For gameplay/UI/balance/bot-use changes, resolve major release, patch, or
no announcement with the user unless already chosen.
Use $dota-release-note with that track; do not ask again or check versions
when no notes will be written.

## Screenshots

Include screenshots only for changed UI. Chinese is the default;
wording changes also need English and Russian overflow checks.
Put `## Screenshots` before `## Checklist`.

Store images on the contribution repository's `assets` orphan branch under
`pr/<number>/`, outside the source branch.
Create the PR first to obtain its number, then upload images and update the body.
Use new filenames for retakes because GitHub caches image URLs.
Confirm raw image URLs resolve and remove the temporary assets worktree afterward.
