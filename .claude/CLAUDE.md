# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.

## Language Preference

**Important: always reply in the user's language** (answer in whatever language the user writes in), unless:

- The user explicitly asks for a different language
- You are writing code, code comments, or commit messages (these stay in English)
- You are quoting technical terms, API names, or function names (keep their original English form)

When talking to the user:

- Use the user's language for explanations, summaries, and general communication
- Use English for code snippets, variable names, function names, and technical identifiers
- Mixing the user's language and English is fine when discussing code (explanations in the user's language, code references in English)

## Reply Style

The reader handles many things every day and has limited attention. Replies must:

- **Lead with the conclusion, then expand.** Put the key point in the first sentence, details after
- **Be short.** Short words, short sentences, short paragraphs; separate sections with headings or lists
- **Use plain language.** No obscure words or jargon; common technical terms (cache, interface, polling) are fine
- **Mention code names sparingly.** First say in the user's language what a function or variable does; the code name is only a supplement. Paths and commands are exempt
- **Give actions.** Tell the user what to do next instead of only listing symptoms
- **Cut unimportant details.** No pleasantries or preamble
- **Short does not mean dropping context.** Before a conclusion, explain what this is and under what circumstances it happens. Better one extra paragraph of context than a reader who cannot tell where the conclusion came from
- **Explain changes in a fixed order:** what it was → what it becomes → what the code has to do → where the problem is → what the user needs to do. Skip the first step and the reader loses the thread

This rule governs **content written for the user to read**: conversation replies, review reports, summaries, and explanatory documents.

The following have their own conventions, which win on conflict:

- Code comments (see "Comment Conventions"), commit messages (single-line English title), localization text (see `game/resource/CLAUDE.md`)
- Rule documents such as CLAUDE.md / SKILL.md: the primary reader is a model, so **precision beats readability**. Write field names, API names, and paths in full; do not blur them for the sake of readability

## Project Overview

Windy10v10AI is a PVE Dota 2 custom game with 10v10 matches, AI opponents, and a unique ability lottery system. The codebase uses TypeScript compiled to Lua for game logic (VScripts) and React + TypeScript for the UI (Panorama).

- **VScripts (backend)**: TypeScript → Lua, compiled with TypeScript-to-Lua (TSTL)
- **Panorama UI (frontend)**: React 16.14 + TypeScript → JavaScript, built with Webpack
- **Communication**: Custom Net Tables (two-way sync) and Custom Game Events (client → server)
- **Shared types**: TypeScript interfaces in `src/common/` define the contract between layers

## Development Commands

### Install and Setup

```bash
# Install dependencies and link game/content directories to Dota 2 addon folder
npm install

# Note: Code must be on the same hard drive partition as Dota 2
```

### Development Workflow

```bash
# Start Dota 2 Tools and watch mode (most common command)
npm run start
```

### Tests and Quality Checks

```bash
# Run Jest tests
npm test

# Lint TypeScript files
npm run lint
npm run lint:fix

# Build checks (run before committing to catch compile errors)
npm run build:panorama   # Webpack build for Panorama UI
npm run build:vscripts   # TSTL build for VScripts (TypeScript → Lua)
```

## Directory Map

Detailed conventions for each layer live in **the `CLAUDE.md` inside that layer's directory**. They load automatically when you read or write files in those directories; no need to read them manually:

| Directory | Contents | Rules |
|---|---|---|
| `src/` | Cross-layer contract: shared types, Net Table / Custom Event data flow | `src/CLAUDE.md` |
| `src/vscripts/` | Game logic, module singletons, AI, API calls, jest tests, TSTL pitfalls | `src/vscripts/CLAUDE.md` |
| `src/panorama/` | React UI, the two entry types, hud_main page split, less pitfalls | `src/panorama/CLAUDE.md` |
| `game/scripts/npc/` | All NPC KV (abilities/items/units/heroes), `#base` structure, ID ranges, format | `game/scripts/npc/CLAUDE.md` |
| `game/resource/` | Chinese/English/Russian localization conventions, icon png locations | `game/resource/CLAUDE.md` |
| `game/scripts/vscripts/` | TSTL build output (auto-generated, never edit by hand) + a little legacy plain Lua | — |
| `docs/reference/<version>/` | Snapshots of vanilla Dota 2 KV and tooltip text | — |
| `launcher/` | Only a README: the local dedicated-server launcher moved to `launcher/` in the firebase repo | — |

Module-level design and decisions go in a `README.md` in that module's directory (e.g. `src/vscripts/api/README.md` covers client-proxied HTTP, `src/vscripts/ai/build-item/README.md` covers item builds).

**The only global pitfall**: TypeScript files use LF (Unix) line endings, not CRLF (Windows).

## Looking Up Vanilla Abilities

When the user gives an **ability system name** (e.g. `dragon_knight_dragon_blood`), use it directly. `<version>` is the latest version directory under `docs/reference/` (including the letter suffix, e.g. `7.41f`); the file layout is described in `game/scripts/npc/CLAUDE.md`, section "原版 KV 参考".

When given a **Chinese name** (e.g. 「龙血」) or **hero name–ability name** (e.g. 「幻影刺客-幻影之矛」), search the Chinese name in `abilities_schinese.txt` and extract the system name from the matching line's key (`DOTA_Tooltip_ability_{system_name}`). If there are multiple candidates, ask the user to confirm with `AskUserQuestion`.

When given a **hero name**, locate the hero ID from file names under `heroes/` or from `abilities_schinese.txt`, then read the ability slots from `heroes/npc_dota_hero_<hero>.txt`.

When writing custom ability/item tooltips, refer to the official text to keep terminology consistent:

```bash
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_schinese.txt
grep "DOTA_Tooltip_ability_dragon_knight_dragon_blood" docs/reference/<version>/abilities_english.txt
```

## Implementation Style

Keep code changes minimal, prefer the simplest mechanism, and follow DRY (Don't Repeat Yourself), KISS (Keep It Simple), and YAGNI (You Aren't Gonna Need It):

- Reuse a string event instead of adding a new custom event
- Avoid over-replicating and over-analyzing
- Boolean method names use common, direct verbs; avoid abstract words and avoid repeating context already expressed by the owning class or file. E.g. `CanCast` beats `IsEligible` or `CanUseGenericFallback`
- When several places need the same logic (especially calculations that must stay consistent), extract a shared function instead of maintaining separate copies; if each caller implements it separately, later edits tend to change only one place and silently diverge

## Comment Conventions

Code comments only say **why it is done this way**, never **what this line does**. If the reader can understand it from the code itself, do not restate it in a comment. **If a comment merely restates code or details, do not write it at all** — values, field names, and behavior evolve with the code, but a restated copy in a comment does not update itself; once they disagree, the reader cannot tell which one is the source of truth.

Do not write:
- Facts that can be looked up directly in KV files: KV fields, behavior, cast range, etc.
- Provenance notes like "ported from function yyy in xxx.lua" (git history keeps that)
- Restating the meaning of a single field (`// override default level >= 3` after `ability: { level: { gte: 2 } }` is redundant)
- Paragraph-style lists of "what it does to heroes / what it does to creeps" when the code already says it clearly
- **Concrete effects and numbers of abilities/items** (they change between versions and belong to localization text). Config tables / code comments only name the hero or ability system name (e.g. `// 齐天大圣 觉醒`); do not restate effects like "+100% attack damage, +700 cast range" — they drift from the comment as soon as they change
- **Never** copy any concrete scenario / edge case / trade-off process / example from the discussion (specific languages, words, numbers, variable names, etc.) verbatim into comments. Even if those details came up repeatedly in discussion, the comment keeps only a one-sentence generalized design intent, with not a single concrete example — writing one is over-commenting and must be deleted
- **The "A used to be X, now/here it becomes Y" contrast pattern is itself the signal**: delete it regardless of whether it is true — even if reworded to sound more "technical" (dropping words like "this time" or "kept from"), as long as it structurally contrasts past and present it narrates a change process rather than stating a design fact. Delete the whole sentence; do not reword it
- **Itemized "why X was excluded / not implemented" lists are not written by default**; they belong in the PR description, and making them more concise does not change that

After writing comments, check them for these words: **old / original / vanilla / Lua / kept from / here / this time / this change / additional / changed to** (in Chinese comments: **旧 / 原版 / Lua / 沿用 / 这里 / 本次 / 此次 / 额外 / 改为**). Any of them means you are narrating a process — delete and rewrite, or delete the whole sentence.

Do write:
- The **reason** for choosing a value/approach ("level 1 damage is too low and the mana cost ratio too high, so only use from level 2")
- **Special handling** that differs from the default/convention ("AoE radius is far larger than cast range, so castMode must project to the edge")
- One or two sentences naming the ability's Chinese name / design purpose
- Comments on public methods (a module's external interface) start with one sentence describing **what it does**, without naming specific files/functions/API endpoints or other technical terms; edge cases and technical details go in inline comments above the relevant code lines, not piled into the top method description — and only non-obvious edge cases; branches readable from the code itself get no comment

One `/** one or two lines */` JSDoc per file is enough; no sections, no bullet lists.

## Plan Conventions

The plan phase focuses on **design reasoning and data flow**, not code details:

- **Design first, details later**: a plan contains background/goal, design decisions (why this way), data flow (who reads and writes what, field names, which layers it passes through), the list of files to change (one-line description each), and how to verify.
- **No code**: a plan must not contain concrete function signatures, full code blocks, or parameter lists. Those belong to the implementation phase.
- **Concise file list**: one line per file saying "what changes", not "how".

### Design Document Location

Design documents go in `docs/superpowers/specs/<YYYY-MM-DD>-<topic>-<purpose>.md`, **kept locally only, not under version control** (the whole `docs/superpowers/` directory is gitignored):

- `<purpose>` distinguishes several documents on the same topic: `design` for the solution design, a concrete scope for implementation notes (e.g. `game-read`)
- Do not create `docs/design/`; that directory is deprecated and deleted

The document above is a working draft that nobody reads after the session ends. **Design reasoning and decisions worth keeping must also be written into version control**: module-level ones go in that module's `README.md` (e.g. `src/vscripts/api/README.md`, `src/vscripts/ai/build-item/README.md`); ones affecting only one or two spots become code comments.

Issues only track the overall goal, shared conventions, progress, and verification results — no specific files, key lists, implementation steps, or design details. The implementation process stays in the local spec; long-lived constraints live in the nearest document next to the code. When a relevant document exists under version control, the issue links to it.

A module `README.md` is a **framework document**: it describes what the system looks like now, why it is built this way, and what was given up. It is maintained long-term.

- **Write for the reader, as short as possible.** Directories aimed at players or external readers only say what it does, how to use it, and how to build and release it — no design trade-offs
- **Only record key decisions the user signed off on.** Details the AI chose during implementation that may change later (timeouts, retry intervals, text placement, etc.) are not written, and must not be presented as the user's decisions
- **Do not organize by phase or batch.** Ask of each paragraph: "will this become invalid once some phase is done?" — anything that will (phase breakdown, progress, files changed in this phase, debugging process and evidence, measured numbers) goes in the issue, PR, or local spec, not the README
- **Do not restate what is already implemented; the code is the source of truth.** Call chains, constant names and values, what a function does, how fields are assembled — read them from the code; copying them into docs only makes the docs go stale first (same rule as "Comment Conventions"). The README keeps only what the code cannot tell you: constraints, decisions, and their reasons
- **One sentence of reasoning per decision.** When a rejected option is worth mentioning, add half a sentence in the reasoning: "did not pick X because Y"; comparison tables and trial calculations stay in the PR
- **Update only when a decision changes, not when a phase completes.** If a change adds or overturns a long-lived decision, update the README in the same PR without waiting to be asked; if it merely wires one more spot under an existing decision, leave the README alone

Deciding whether a sentence goes in the README or `CLAUDE.md`: if violating it means "this change was done wrong", it goes in the relevant directory's `CLAUDE.md`; if it means "the system's structure changed", it goes in the README.

## Git Workflow

### Branches

- Issue-driven changes are named `feature/<issue-id>-<short-kebab-summary>` (3–6 lowercase English words, e.g. `feature/2411-web-link-refresh`); non-issue-driven changes use the `fix/` `chore/` `docs/` prefixes with the same naming rule
- Always branch from the latest `develop`. **Never modify or commit any file directly on `develop`**, including design documents produced by skills — once you know you will write files, create the branch first
- Before starting, check `git status --short`, `git branch --show-current`, and `git worktree list`. If the current checkout is clean and not occupied by another session or an in-progress branch, create the new branch from the latest `develop` right here; do not create a worktree just because other sessions might exist
- When on an old branch that was already merged, verify the PR is merged, the local HEAD matches the PR's last commit, and there are no uncommitted changes; then switch back to `develop`, delete the old local branch, and create the new one. A remote shown as `gone` does not mean merged; after a squash merge, `git branch --merged` may also not list the old branch
- Use a worktree for isolation only when the current checkout has uncommitted changes, an unmerged branch is still in use, or several sessions genuinely share this checkout; never switch a checkout or branch another session is using

### Commits and PRs

- The PR base branch is always `develop`; titles are in English by default. For purely internal changes (refactoring, build, CI, docs, tests) decide on your own to skip the Release Note, without asking or checking the version number; otherwise ask the user to choose "patch / major version / no Release Note". When one is needed it must be generated with the `release-note` skill, never written by hand
- Write `Fixes #<issue-id>` in the Issue section only when the PR completes the entire scope of the issue, so merging closes it automatically; when an issue is split across several PRs, each PR only references `#<issue-id>`, and only the last PR that completes the full scope uses `Fixes`
- Commit format: a short single-line title (≤72 characters) + a body containing only `Co-Authored-By`
- The whole `docs/superpowers/` directory is excluded by `.gitignore`; spec documents produced by the brainstorming skill are kept locally only, not under version control — do not try to `git add` them

Only stage files clearly related to the current request; check `git status` before committing and do not include changes from other sessions or the user's own work. No need to list them for the user to confirm one by one. But if the current branch is not what you expect before committing (e.g. you should be on a feature branch but are on `develop`/`main`), ask the user to confirm the target branch first.

### Riding Along Small Changes

When you have an unmerged PR in hand, small changes like doc wording, comments, or convention additions go straight into it instead of opening a PR for each, with one sentence noting it in the PR body. Open a separate branch if any of these holds:

- It conflicts with the current PR's topic
- The current PR is already merged
- It cannot be explained in a sentence or two

With no open PR, hold them until the next PR; only open a separate one when the change is time-sensitive (blocking others, a live issue).

### Merging and Cleanup

Execute merges directly when the user gives a merge instruction; never merge on your own initiative:

| PR | Command |
|---|---|
| `feature` / `fix` / `chore` / `docs` → `develop` | `gh pr merge <number> --squash` |
| `develop` → `main` (release PR) | `gh pr merge <number> --merge` |

Add `--auto` when CI has not finished; never use `--admin` to bypass branch protection.

Clean up the local branch immediately after merging; remote branches are deleted automatically by repository settings. Git does not recognize squash-merged branches as merged, so `-D` is required:

```bash
git checkout develop
git pull
git branch -D <branch-name>
```

If the branch is in a worktree, first `git worktree remove <path> --force`, then delete the branch, then `git worktree prune`.

> For the full flow (branch creation, commit, push, filling in the PR template) see the `create-pr` skill.

## Documentation Self-Maintenance

When the user corrects Claude's approach, a document is found to contradict the actual code, or the user adds a new convention, trigger the `doc-update` skill to capture the valuable parts in documentation.

Choose where to put it by scope, **nearest first**:

| Content | Destination |
|---|---|
| Rules that hold only within one layer | That layer's `CLAUDE.md` (`src/vscripts/`, `src/panorama/`, `game/scripts/npc/`, `game/resource/`) |
| A module's design and decisions | That module's `README.md` |
| Flow and decisions for a type of task | The corresponding `SKILL.md` |
| Rules that truly span the whole project | This file |

This file keeps only project-wide general rules. Updating docs is part of completing a change (self-maintenance); do not wait for the user to ask.

## Saving Usage

Mechanical, time-consuming work like running tests, waiting for a match to end, or tallying logs goes to a SubAgent with a cheap model (`model: "haiku"`, or `"sonnet"` when judgment is needed); the main conversation only receives the conclusion. Write the full commands, pass criteria, and numbers to bring back in the SubAgent prompt — it does not inherit the main conversation's context. Design trade-offs and code changes still happen in the main conversation.

## Skill Interaction Conventions

When running a skill, **any unclear decision point must be asked as an option menu with the `AskUserQuestion` tool**; never assume. This applies to, but is not limited to:

- Multiple candidate target files (e.g. lottery pool vs. unit-specific)
- Unclear operation mode (create vs. fix)
- Vanilla ability information that cannot be determined (multiple candidates, version differences, etc.)

Each question is a separate `AskUserQuestion` call, with `options` listing concrete candidates and a short description for each.
