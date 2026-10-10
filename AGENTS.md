# AGENTS.md

## Language Preference

Code, code comments, and commit messages are in English, whatever language the conversation uses. When editing code that has comments in another language, translate the comments you touch to English. Technical terms, API names, and function names keep their original English form in any language.

## Reply Style

Replies must:

- Lead with the conclusion, then expand. Put the key point in the first sentence, details after
- Be short. Short words, short sentences, short paragraphs; separate sections with headings or lists
- Use plain language. No obscure words or jargon; common technical terms (cache, interface, polling) are fine
- Mention code names sparingly. First say in the user's language what a function or variable does; the code name is only a supplement. Paths and commands are exempt
- Give actions. Tell the user what to do next instead of only listing symptoms
- Cut unimportant details. No pleasantries or preamble
- Short does not mean dropping context. Before a conclusion, explain what this is and under what circumstances it happens. Better one extra paragraph of context than a reader who cannot tell where the conclusion came from
- Explain changes in a fixed order: what it was → what it becomes → what the code has to do → where the problem is → what the user needs to do. Skip the first step and the reader loses the thread

This rule governs content written for the user to read: conversation replies, review reports, summaries, and explanatory documents.

The following have their own conventions, which win on conflict:

- Code comments (see "Comment Conventions"), commit messages (single-line English title), localization text (see `game/resource/CLAUDE.md`)
- Rule documents such as AGENTS.md / CLAUDE.md / SKILL.md: the primary reader is a model, so precision beats readability. Write field names, API names, and paths in full; do not blur them for the sake of readability

## Project Overview

Windy10v10AI is a PVE Dota 2 custom game with 10v10 matches, AI opponents, and a unique ability lottery system. The codebase uses TypeScript compiled to Lua for game logic (VScripts) and React + TypeScript for the UI (Panorama).

- Communication: Custom Net Tables (two-way sync) and Custom Game Events (client → server)
- Shared types: TypeScript interfaces in `src/common/` define the contract between layers

## Development Commands

- Code must be on the same hard drive partition as Dota 2; `npm install` links the `game/` and `content/` directories into the Dota 2 addon folder
- Run `npm run build:panorama` and `npm run build:vscripts` before committing to catch compile errors

## Directory Map

Detailed conventions for each layer live in the `CLAUDE.md` inside that layer's directory. Claude Code loads them automatically when reading or writing files in those directories; other agents must read the directory's `CLAUDE.md` before reading or writing files there:

- `src/`: cross-layer contract: shared types, Net Table / Custom Event data flow → `src/CLAUDE.md`
- `src/vscripts/`: game logic, module singletons, AI, API calls, jest tests, TSTL pitfalls → `src/vscripts/CLAUDE.md`
- `src/panorama/`: React UI, the two entry types, hud_main page split, less pitfalls → `src/panorama/CLAUDE.md`
- `game/scripts/npc/`: all NPC KV (abilities/items/units/heroes), `#base` structure, ID ranges, format → `game/scripts/npc/CLAUDE.md`
- `game/resource/`: Chinese/English/Russian localization conventions, icon png locations → `game/resource/CLAUDE.md`
- `game/scripts/vscripts/`: TSTL build output (auto-generated, never edit by hand) + a little legacy plain Lua
- `docs/reference/<version>/`: snapshots of vanilla Dota 2 KV and tooltip text

Module-level design and decisions go in a `README.md` in that module's directory (e.g. `src/vscripts/api/README.md` covers client-proxied HTTP, `src/vscripts/ai/build-item/README.md` covers item builds).

Task workflows live in `.claude/skills/<skill-name>/SKILL.md`. Claude Code discovers them automatically; other agents should list `.claude/skills/` and read the `SKILL.md` whose frontmatter `description` matches the task before starting it.

The only global pitfall: TypeScript files use LF (Unix) line endings, not CRLF (Windows).

## Looking Up Vanilla Abilities

When the user names a Dota ability or hero, or when writing ability/item tooltips, read `.claude/docs/vanilla-abilities.md` first.

## Implementation Style

- Reuse a string event instead of adding a new custom event
- Boolean method names use common, direct verbs; avoid abstract words and avoid repeating context already expressed by the owning class or file. E.g. `CanCast` beats `IsEligible` or `CanUseGenericFallback`
- When several places need the same logic (especially calculations that must stay consistent), extract a shared function instead of maintaining separate copies; if each caller implements it separately, later edits tend to change only one place and silently diverge

## Comment Conventions

Code comments only say why it is done this way, never what this line does. If the reader can understand it from the code itself, do not restate it in a comment. If a comment merely restates code or details, do not write it at all.

Do not write:
- Facts that can be looked up directly in KV files: KV fields, behavior, cast range, etc.
- Provenance notes like "ported from function yyy in xxx.lua" (git history keeps that)
- Restating the meaning of a single field (`// override default level >= 3` after `ability: { level: { gte: 2 } }` is redundant)
- Paragraph-style lists of "what it does to heroes / what it does to creeps" when the code already says it clearly
- Concrete effects and numbers of abilities/items (they change between versions and belong to localization text). Config tables / code comments only name the hero or ability system name (e.g. `// Monkey King awakening`); do not restate effects like "+100% attack damage, +700 cast range" — they drift from the comment as soon as they change
- Never copy any concrete scenario / edge case / trade-off process / example from the discussion (specific languages, words, numbers, variable names, etc.) verbatim into comments. Even if those details came up repeatedly in discussion, the comment keeps only a one-sentence generalized design intent, with not a single concrete example — writing one is over-commenting and must be deleted
- The "A used to be X, now/here it becomes Y" contrast pattern is itself the signal: delete it regardless of whether it is true — even if reworded to sound more "technical" (dropping words like "this time" or "kept from"), as long as it structurally contrasts past and present it narrates a change process rather than stating a design fact. Delete the whole sentence; do not reword it
- Itemized "why X was excluded / not implemented" lists are not written by default; they belong in the PR description, and making them more concise does not change that

After writing comments, check them for these words: old / original / vanilla / Lua / kept from / here / this time / this change / additional / changed to. Any of them means you are narrating a process — delete and rewrite, or delete the whole sentence.

Do write:
- The reason for choosing a value/approach ("level 1 damage is too low and the mana cost ratio too high, so only use from level 2")
- Special handling that differs from the default/convention ("AoE radius is far larger than cast range, so castMode must project to the edge")
- One or two sentences naming the ability / design purpose
- Comments on public methods (a module's external interface) start with one sentence describing what it does, without naming specific files/functions/API endpoints or other technical terms; edge cases and technical details go in inline comments above the relevant code lines, not piled into the top method description — and only non-obvious edge cases; branches readable from the code itself get no comment

One `/** one or two lines */` JSDoc per file is enough; no sections, no bullet lists.

## Plan Conventions

The plan phase focuses on design reasoning and data flow, not code details:

- Design first, details later: a plan contains background/goal, design decisions (why this way), data flow (who reads and writes what, field names, which layers it passes through), the list of files to change (one-line description each), and how to verify.
- No code: a plan must not contain concrete function signatures, full code blocks, or parameter lists. Those belong to the implementation phase.
- Concise file list: one line per file saying "what changes", not "how".

### Design Document Location

Design documents go in `docs/superpowers/specs/<YYYY-MM-DD>-<topic>-<purpose>.md`, kept locally only, not under version control (the whole `docs/superpowers/` directory is gitignored):

- `<purpose>` distinguishes several documents on the same topic: `design` for the solution design, a concrete scope for implementation notes (e.g. `game-read`)
- Do not create `docs/design/`; that directory is deprecated and deleted

The document above is a working draft that nobody reads after the session ends. Design reasoning and decisions worth keeping must also be written into version control: module-level ones go in that module's `README.md` (e.g. `src/vscripts/api/README.md`, `src/vscripts/ai/build-item/README.md`); ones affecting only one or two spots become code comments.

Before writing a module `README.md` or an issue, or deciding whether a rule goes in a README or a `CLAUDE.md`, read `.claude/docs/readme-and-issues.md`.

## Git Workflow

### Branches

- Issue-driven changes are named `feature/<issue-id>-<short-kebab-summary>` (3–6 lowercase English words, e.g. `feature/2411-web-link-refresh`); non-issue-driven changes use the `fix/` `chore/` `docs/` prefixes with the same naming rule
- Always branch from the latest `develop`. Never modify or commit any file directly on `develop`, including design documents produced by skills — once you know you will write files, create the branch first
- Before starting, check `git status --short`, `git branch --show-current`, and `git worktree list`. If the current checkout is clean and not occupied by another session or an in-progress branch, create the new branch from the latest `develop` right here; do not create a worktree just because other sessions might exist
- When on an old branch that was already merged, verify the PR is merged, the local HEAD matches the PR's last commit, and there are no uncommitted changes; then switch back to `develop`, delete the old local branch, and create the new one. A remote shown as `gone` does not mean merged; after a squash merge, `git branch --merged` may also not list the old branch
- Use a worktree for isolation only when the current checkout has uncommitted changes, an unmerged branch is still in use, or several sessions genuinely share this checkout; never switch a checkout or branch another session is using

### Commits, PRs, and Merging

Before committing, opening a PR, or merging, read `.claude/docs/commits-and-prs.md`.

## Documentation Self-Maintenance

When the user corrects Claude's approach, a document is found to contradict the actual code, or the user adds a new convention, trigger the `doc-update` skill to capture the valuable parts in documentation.

Choose where to put it by scope, nearest first:

- Rules that hold only within one layer → that layer's `CLAUDE.md` (`src/vscripts/`, `src/panorama/`, `game/scripts/npc/`, `game/resource/`)
- A module's design and decisions → that module's `README.md`
- Flow and decisions for a type of task → the corresponding `SKILL.md`
- Rules that truly span the whole project → this file

This file keeps only project-wide general rules. Never write rules into `.claude/CLAUDE.md`; it stays a one-line import of this file. Updating docs is part of completing a change (self-maintenance); do not wait for the user to ask.

## Saving Usage

Mechanical, time-consuming work like running tests, waiting for a match to end, or tallying logs goes to a SubAgent with a cheap model (`model: "haiku"`, or `"sonnet"` when judgment is needed); the main conversation only receives the conclusion. Write the full commands, pass criteria, and numbers to bring back in the SubAgent prompt — it does not inherit the main conversation's context. Design trade-offs and code changes still happen in the main conversation.

## Skill Interaction Conventions

When running a skill, any unclear decision point must be asked as an option menu with the `AskUserQuestion` tool; never assume. This applies to, but is not limited to:

- Multiple candidate target files (e.g. lottery pool vs. unit-specific)
- Unclear operation mode (create vs. fix)
- Vanilla ability information that cannot be determined (multiple candidates, version differences, etc.)

Each question is a separate `AskUserQuestion` call, with `options` listing concrete candidates and a short description for each.
