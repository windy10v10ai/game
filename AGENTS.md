PVE Dota 2 custom game with 10v10 battles, AI opponents, and an ability lottery.

## Language

- Write agent-facing documentation (`AGENTS.md`, `CLAUDE.md`, skills, and agent guides) in English.
- Write human-facing documentation in the language selected by the user. Ask if no language has been selected.

## Instructions

- Read applicable parent and scoped `CLAUDE.md` files explicitly; Codex does not discover them as scoped instructions. Project skills live in `.claude/skills/`.
- Ask unresolved skill decisions with concrete choices, one question per call: ambiguous targets, create versus repair, or vanilla identity/version. Use the client's available question interface.

## Task rules

- Before changing files or performing Git operations, read [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
- Before changing or building code, read [DEVELOPMENT.md](DEVELOPMENT.md); for comments, read [CODE_COMMENTS.md](CODE_COMMENTS.md).
- For vanilla ability lookup, read [DOTA_REFERENCES.md](DOTA_REFERENCES.md).
- Before writing plans, read [PLANNING.md](PLANNING.md); before changing documentation, read [DOCUMENTATION.md](DOCUMENTATION.md).
