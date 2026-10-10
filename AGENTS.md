# AGENTS.md

Windy10v10AI is a PVE Dota 2 custom game: 10v10 matches against AI opponents with an ability lottery. Game logic (VScripts) is TypeScript compiled to Lua; the UI (Panorama) is React + TypeScript. Layers communicate through Custom Net Tables (two-way sync) and Custom Game Events (client → server); interfaces in `src/common/` are the contract between them.

## Rules

- Never hardcode, commit, or log secrets: server keys come from `GetDedicatedServerKeyV3` at runtime, GA4 credentials from the backend. `game/scripts/kv/` holds production player data with plaintext steamIds; never commit it or copy its contents into replies, PRs, or issues.
- Never report an unrun or skipped check as passed; run checks after the last change.
- When docs, config, code, and tests disagree, report the contradiction instead of choosing.

## Language

- Code, code comments, and commit messages are in English, whatever language the conversation uses. Translate non-English comments you touch to English.
- Technical terms, API names, and function names keep their original English form in any language.
- Agent-facing files (`AGENTS.md`, `CLAUDE.md`, skills, `.claude/docs/`) are in English.
- Human docs (`README.md`, `.github/CONTRIBUTING.md`) have English, Chinese, and Russian versions; change this only when the user asks.

## Reply Style

Applies to content written for the user: replies, review reports, summaries, explanatory documents.

- Lead with the conclusion in the first sentence; details after.
- Short words, sentences, and paragraphs; separate sections with headings or lists.
- Plain language without obscure words or jargon; common technical terms (cache, interface, polling) are fine.
- Say in the user's language what a function or variable does before, or instead of, naming it. Paths and commands are exempt.
- Tell the user what to do next instead of only listing symptoms.
- No pleasantries, preamble, or unimportant details.
- Short does not mean dropping context: before a conclusion, say what this is and when it happens, even if that costs an extra paragraph.
- Explain changes in this order: what it was → what it becomes → what the code has to do → where the problem is → what the user needs to do. Never skip the first step.

These have their own conventions, which win on conflict:

- Code comments ("Comment Conventions"), commit messages (single-line English title), localization text (`game/resource/CLAUDE.md`).
- Rule documents (`AGENTS.md`, `CLAUDE.md`, `SKILL.md`): the reader is a model, so precision beats readability; write field names, API names, and paths in full.

## Setup and Checks

- Code must be on the same drive partition as Dota 2; `npm install` links `game/` and `content/` into the Dota 2 addon folder.
- Run `npm run build:panorama` and `npm run build:vscripts` before committing to catch compile errors.
- Fastest checks while working: `npx jest <test-file>`, `npx eslint <files>`, `npx tsc --noEmit -p src/vscripts/tsconfig.json`. Panorama has no standalone type check; use `npm run build:panorama`.
- TypeScript files use LF line endings, not CRLF.

## Directory Map

Read a directory's `CLAUDE.md` before reading or writing files there; Claude Code loads it automatically.

- `src/`: cross-layer contract, shared types, Net Table / Custom Event data flow → `src/CLAUDE.md`
- `src/vscripts/`: game logic, module singletons, AI, API calls, jest tests, TSTL pitfalls → `src/vscripts/CLAUDE.md`
- `src/panorama/`: React UI, the two entry types, hud_main page split, less pitfalls → `src/panorama/CLAUDE.md`
- `game/scripts/npc/`: all NPC KV (abilities, items, units, heroes), `#base` structure, ID ranges, format → `game/scripts/npc/CLAUDE.md`
- `game/resource/`: Chinese/English/Russian localization, icon png locations → `game/resource/CLAUDE.md`
- `game/scripts/vscripts/`: TSTL build output, never edit by hand; also a little legacy plain Lua
- `docs/reference/<version>/`: snapshots of vanilla Dota 2 KV and tooltip text

Module design and decisions go in a `README.md` in the module's directory (e.g. `src/vscripts/api/README.md`, `src/vscripts/ai/build-item/README.md`).

Task workflows live in `.claude/skills/<skill-name>/SKILL.md`. Claude Code discovers them automatically; other agents list `.claude/skills/` and read the `SKILL.md` whose frontmatter `description` matches the task before starting it.

## Looking Up Vanilla Abilities

When the user names a Dota ability or hero, or when writing ability/item tooltips, read `.claude/docs/vanilla-abilities.md` first.

## Implementation Style

- Make the smallest correct change. Prefer, in order: no change, existing code, the standard library, an installed dependency, new code. Stay in scope.
- Read narrowly: focused search, bounded reads, `git diff --stat` before diffs, quiet test output.
- Never read or search `node_modules/`, `package-lock.json`, `game/scripts/kv/`, or the Panorama, React, and TSTL build output listed in `.gitignore`.
- Do not create plan, summary, or notes files unless the user asks or a skill requires one.
- Reuse a string event instead of adding a new custom event.
- Name boolean methods with common, direct verbs; avoid abstract words and context the owning class or file already expresses (`CanCast`, not `IsEligible` or `CanUseGenericFallback`).
- When several places need the same logic, especially calculations that must stay consistent, extract a shared function; separate copies drift when only one gets edited.

## Comment Conventions

Comments say why, never what the line does. If a comment only restates the code or its details, do not write it.

Do not write:

- Facts available in KV files: fields, behavior, cast range, etc.
- Provenance such as "ported from function yyy in xxx.lua"; git history keeps it.
- Restated field meaning (`// override default level >= 3` after `ability: { level: { gte: 2 } }`).
- Paragraph lists of "what it does to heroes / to creeps" that the code already shows.
- Concrete effects and numbers of abilities/items; they change between versions and belong to localization text. Name only the hero or ability system name (`// Monkey King awakening`), not effects like "+100% attack damage, +700 cast range".
- Any concrete scenario, edge case, trade-off, or example from the discussion (specific languages, words, numbers, variable names). Keep one sentence of generalized design intent with no concrete example, even if the details came up repeatedly.
- The "A used to be X, now/here it is Y" contrast. Delete the whole sentence even if it is true or reworded to sound technical: contrasting past and present narrates a change, not a design fact.
- Itemized "why X was excluded / not implemented" lists; they belong in the PR description, however concise.

After writing comments, check for these words: old / original / vanilla / Lua / kept from / here / this time / this change / additional / changed to. Any of them signals narration: rewrite or delete the sentence.

Do write:

- The reason for a value or approach ("level 1 damage is too low and the mana cost ratio too high, so only use from level 2").
- Special handling that departs from the default or convention ("AoE radius is far larger than cast range, so castMode must project to the edge").
- One or two sentences naming the ability or the design purpose.
- On public methods (a module's external interface): one sentence on what it does, without naming files, functions, API endpoints, or other technical terms. Non-obvious edge cases and technical details go in inline comments above the relevant lines, not in the method description; branches readable from the code get no comment.

One `/** one or two lines */` JSDoc per file; no sections, no bullet lists.

## Plan Conventions

A plan covers design reasoning and data flow, not code:

- Background/goal, design decisions with reasons, data flow (who reads and writes what, field names, which layers it passes through), files to change, and how to verify.
- No function signatures, code blocks, or parameter lists; those belong to implementation.
- One line per file saying what changes, not how.

### Design Document Location

- Design documents go in `docs/superpowers/specs/<YYYY-MM-DD>-<topic>-<purpose>.md`. The whole `docs/superpowers/` directory is gitignored, so they stay local.
- `<purpose>` separates documents on one topic: `design` for the solution design, a concrete scope for implementation notes (e.g. `game-read`).
- Never create `docs/design/`; it is deprecated and deleted.
- The spec is a working draft nobody reads after the session. Reasoning and decisions worth keeping also go under version control: module-level ones in the module's `README.md`, ones affecting one or two spots as code comments.

Before writing a module `README.md` or an issue, or deciding whether a rule goes in a README or a `CLAUDE.md`, read `.claude/docs/readme-and-issues.md`.

## Git Workflow

### Branches

- Name issue-driven branches `feature/<issue-id>-<short-kebab-summary>` with 3–6 lowercase English words (e.g. `feature/2411-web-link-refresh`); otherwise use the `fix/`, `chore/`, or `docs/` prefix with the same rule.
- Always branch from the latest `develop`. Never modify or commit any file on `develop`, including design documents produced by skills; create the branch as soon as you know you will write files.
- Before starting, check `git status --short`, `git branch --show-current`, and `git worktree list`. If the checkout is clean and no other session or in-progress branch uses it, branch from the latest `develop` here; do not create a worktree just because other sessions might exist.
- On an old branch, first verify its PR is merged, the local HEAD matches the PR's last commit, and nothing is uncommitted; then switch to `develop`, delete the old local branch, and create the new one. A remote shown as `gone` does not mean merged, and after a squash merge `git branch --merged` may not list the branch.
- Use a worktree only when the checkout has uncommitted changes, an unmerged branch is still in use, or several sessions really share the checkout. Never switch a checkout or branch another session is using.

### Commits, PRs, and Merging

Before committing, opening a PR, or merging, read `.claude/docs/commits-and-prs.md`.

## Documentation Self-Maintenance

When the user corrects your approach, a document contradicts the code, or the user adds a new convention, run the `doc-update` skill to record it, as part of finishing the change and without waiting to be asked. Put it in the nearest scope:

- A rule for one layer → that layer's `CLAUDE.md` (`src/vscripts/`, `src/panorama/`, `game/scripts/npc/`, `game/resource/`)
- A module's design and decisions → the module's `README.md`
- Flow and decisions for a type of task → the corresponding `SKILL.md`
- A rule that truly spans the whole project → `AGENTS.md`

Never write rules into `.claude/CLAUDE.md`; it stays a one-line import of `AGENTS.md`.

## Saving Usage

Delegate mechanical, time-consuming work (running tests, waiting for a match to end, tallying logs) to a SubAgent on a cheap model: `model: "haiku"`, or `"sonnet"` when judgment is needed. The SubAgent does not inherit the conversation, so its prompt must contain the full commands, pass criteria, and numbers to bring back; the main conversation receives only the conclusion. Design trade-offs and code changes stay in the main conversation.

## Skill Interaction Conventions

When running a skill, ask every unclear decision as an option menu with `AskUserQuestion` instead of assuming, for example:

- Several candidate target files (lottery pool vs. unit-specific)
- Unclear operation mode (create vs. fix)
- Undeterminable vanilla ability information (several candidates, version differences)

Ask each question in a separate `AskUserQuestion` call, with `options` listing concrete candidates and a short description each.
