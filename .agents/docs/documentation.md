# Documentation

- Human documentation uses matching relative paths under `docs/ru/`, `docs/en/`, and `docs/zh-CN/`; add `docs/<language-code>/` for further languages. Keep diagrams and attachments in `docs/shared/`. When changing a translated document, update its existing language counterparts in the same change. Agent-facing instructions remain in English.
- Put lasting module decisions in module READMEs and local implementation reasons in comments. Issues hold steps/progress and link to designs, not detailed design. Put requirements in scoped instructions and structural decisions in READMEs.
- READMEs record user-approved lasting decisions, one reason per decision; no phases, progress, investigations, measurements, or code-derived facts. Comparisons/calculations belong in PRs. External/player docs cover usage, building, and publishing. Update lasting decisions in the same PR, not merely after a phase or a new caller.
- Use `.claude/skills/doc-update/SKILL.md` for reusable user corrections/conventions and documentation contradictions. Global rules belong in `AGENTS.md`, layer rules in scoped `CLAUDE.md`, module decisions in READMEs, and workflow rules in skills.
