# AGENTS.md

The single project rules file for this repository is `.claude/CLAUDE.md`.

Before any code change, issue work, review, test, build, or release, you must read `.claude/CLAUDE.md` and follow its rules. If the context or tool behavior did not load `.claude/CLAUDE.md` automatically, read it yourself before starting.

Layer-specific rules live in the `CLAUDE.md` of each layer's directory (`src/`, `src/vscripts/`, `src/panorama/`, `game/scripts/npc/`, `game/resource/`). Before reading or writing files in one of these directories, read its `CLAUDE.md` as well; see "Directory Map" in `.claude/CLAUDE.md`.

Do not maintain duplicate project rules in this file; rule changes go only into `.claude/CLAUDE.md`, the relevant layer `CLAUDE.md`, or the corresponding skill.

## Section Index

After reading `.claude/CLAUDE.md`, focus first on the sections relevant to the current task:

- Language Preference
- Reply Style
- Project Overview
- Development Commands
- Directory Map
- Looking Up Vanilla Abilities
- Implementation Style
- Comment Conventions
- Plan Conventions
- Git Workflow
- Documentation Self-Maintenance
- Saving Usage
- Skill Interaction Conventions

## Skill Routing

If the task involves a specific workflow, you must also read the corresponding `.claude/skills/<skill-name>/SKILL.md`:

- Add or modify a custom ability: `.claude/skills/custom-ability/SKILL.md`
- Clone a vanilla ability: `.claude/skills/clone-ability/SKILL.md`
- Awakening abilities: `.claude/skills/awaken-ability/SKILL.md`
- Add or modify a custom item: `.claude/skills/custom-item/SKILL.md`
- Clone a vanilla item: `.claude/skills/clone-item/SKILL.md`
- Add or modify hero talents: `.claude/skills/custom-talent/SKILL.md`
- Random re-trigger blacklist (Butterfly Effect, Multicast): `.claude/skills/ability-blacklist/SKILL.md`
- Custom icons and UI images: `.claude/skills/add-image/SKILL.md`
- Bot ability casting logic: `.claude/skills/bot-ability-usage/SKILL.md`
- Bot item usage logic: `.claude/skills/bot-item-usage/SKILL.md`
- Bot item builds: `.claude/skills/bot-item-build/SKILL.md`
- Bot decision-making and movement: `.claude/skills/bot-ai-tuning/SKILL.md`
- Lottery pool tier adjustment: `.claude/skills/adjust-lottery-tier/SKILL.md`
- Ability override maintenance: `.claude/skills/update-abilities-override/SKILL.md`
- Item sync after a Dota patch: `.claude/skills/update-items-override/SKILL.md`
- Hero custom validation (bot skill builds, talents): `.claude/skills/update-heroes-custom/SKILL.md`
- Localization format and sync: `.claude/skills/localization-format-guide/SKILL.md`
- Loading screen FAQ: `.claude/skills/faq/SKILL.md`
- External API calls: `src/vscripts/api/README.md`
- Dota docs / API lookup: `.claude/skills/dota-docs-lookup/SKILL.md`
- In-game live testing in Dota 2 Tools: `.claude/skills/dota-live-test/SKILL.md`
- Review a PR or change: `.claude/skills/review-pr/SKILL.md`
- Create a PR: `.claude/skills/create-pr/SKILL.md`, using `.claude/skills/release-note/SKILL.md` when required
- Export the offline data snapshot before publishing: `.claude/skills/update-offline-snapshot/SKILL.md`
- Publish to the Workshop (test / production): `.claude/skills/deploy/SKILL.md`
- Capture documentation conventions: `.claude/skills/doc-update/SKILL.md`
