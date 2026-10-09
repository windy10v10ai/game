# Documentation

## Readers and content

- Player guides cover subscribing to the Workshop addon, starting a match, lobby options,
  difficulty and bot settings, and custom mechanics such as the ability lottery and awakening.
  Explain where the player acts, requirements or costs, the result, and restrictions. Use visible
  UI labels from the relevant localization; do not substitute internal event or class names.
- Developer guides cover prerequisites, initial setup, launching Workshop Tools, editing and
  rebuilding the addon, testing a change, and preparing a contribution. Distinguish playing the
  published addon from running a local development checkout.
- Maintainer guides cover release and Workshop publishing procedures and required access.
  Distinguish the original project's services and credentials from those available to a fork;
  do not promise that a fork inherits access to the original backend.
- Document supported workflows verified in code, configuration, tests, or existing instructions.
  Treat desired features, unverified behavior, and working notes as review inputs, not facts.
  Report disagreements between sources before writing a definitive instruction.

## Practical guides

- Keep pages only when they explain a verified project-specific workflow, constraint, or decision.
  Omit generic tool onboarding, obvious advice, and duplicated setup instructions. Merge short
  link collections into the relevant guide. Publish troubleshooting remedies only when verified;
  an old anecdote or a plausible repair is insufficient.
- For an installation or command sequence, state the required software/version, working directory,
  execution surface (PowerShell, Workshop Tools, or VConsole), expected result, and how to verify it.
  Explain commands that relocate files, create addon links, or may replace existing content before
  asking the reader to run them.
- Explain settings by their player-visible effect, where to change them, and when they take effect.
  Include prerequisites and incompatible options when verified. Do not copy entire configuration
  files or lists of balance values into prose.
- Troubleshooting entries contain a recognizable symptom or error, a diagnostic check, a targeted
  remedy, and a success check. Prefer preserving user changes over blanket reinstall instructions.
- Bug-report guidance requests reproduction steps, expected/actual behavior, addon version,
  relevant settings, and useful logs or screenshots. Tell readers to remove credentials and
  personal data before sharing diagnostic material.
- Keep one canonical guide for each workflow and link to it from indexes and the root README.
  Add only populated pages; do not create empty topic directories or promise unavailable guides.

## Languages and layout

- Human documentation uses matching relative paths under `docs/ru/`, `docs/en/`, and
  `docs/zh-CN/`; add `docs/<language-code>/` for further languages. Keep diagrams and attachments
  in `docs/shared/`. When changing a translated document, update its existing language counterparts
  in the same change.
- Keep language selection in `docs/README.md`; do not add links to other translations inside
  localized pages. Preserve commands, paths, identifiers, and placeholders across translations;
  use the matching game's localization for UI terminology.

## Ownership and maintenance

- Put lasting module decisions in module READMEs and local implementation reasons in comments.
  Issues hold steps/progress and link to designs, not detailed design. Put requirements in scoped
  instructions and structural decisions in READMEs.
- Module architecture READMEs record user-approved lasting decisions, one reason per decision;
  no phases, progress, investigations, measurements, or code-derived implementation details.
  Comparisons/calculations belong in PRs. User guides may include verified commands, settings,
  and expected results needed to complete a task.
- Update lasting decisions in the same PR, not merely after a phase or a new caller. Update affected
  user guides when a change alters setup, UI labels, settings, gameplay workflows, or recovery steps.
- Record reusable user corrections in the nearest existing owner. Explicit user rules may be
  applied directly; confirm inferred conventions before adding them. Keep one source per rule
  and replace duplicate copies with pointers. Global rules belong in `AGENTS.md`, layer rules in
  scoped `CLAUDE.md`, module decisions in READMEs, and workflow rules in skills.
