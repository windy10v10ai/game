PVE Dota 2 custom game with 10v10 battles, AI opponents, and an ability lottery.

## Language

- Write agent-facing documentation (`AGENTS.md`, `CLAUDE.md`, skills, and agent guides) in English.
- Write human-facing documentation in the language selected by the user. Ask if no language has been selected.

## Instructions

- Ask unresolved skill decisions with concrete choices, one question per call: ambiguous targets, create versus repair, or vanilla identity/version. Use the client's available question interface.

## Work

- Before writing files, check status, current branch, and worktrees. Branch from latest `develop`; never edit or commit on `develop`, including local design drafts.
- Merge only on user instruction.
- Use LF in TypeScript. Do not edit TSTL output in `game/scripts/vscripts/`; legacy handwritten Lua there is editable.
- Run `npm run build:panorama` and `npm run build:vscripts` before committing.

## Task rules

- For project skill wiring, read [.agents/docs/skills.md](.agents/docs/skills.md).
- Before changing files or performing Git operations, read [.agents/docs/git-workflow.md](.agents/docs/git-workflow.md).
- Before changing or building code, read [.agents/docs/coding.md](.agents/docs/coding.md).
- For vanilla ability lookup, read [.agents/docs/dota-references.md](.agents/docs/dota-references.md).
- Before writing plans, read [.agents/docs/planning.md](.agents/docs/planning.md); before changing documentation, read [.agents/docs/documentation.md](.agents/docs/documentation.md).
