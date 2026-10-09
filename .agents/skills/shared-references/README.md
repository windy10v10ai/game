# Shared skill references

contains reference materials that must be checked for more than two skills. **This directory does not have `SKILL.md` and will not be loaded as a skill**, so it does not occupy the context of each round - it is only read when pointed to by the skill using a relative path.

| File                   | Content                                                                                                                                      | Cited by Who                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `vanilla-modifiers.md` | List of reusable vanilla modifiers (three groups of common status / vanilla item / vanilla ability), including off-table name lookup methods | `custom-item`, `custom-ability`, `awaken-ability` |

## What should be put in

Include only material that two or more skills need to consult. The lookup table dedicated to a single skill stores the skill's own `references/`.

Choose the owner by asking what would happen if the material were missing:

- Hard constraints whose absence would cause incorrect code → `CLAUDE.md` of this layer (automatically loaded when files in that directory are changed); `AGENTS.md` (must be entered in every round) is the only one that truly spans the entire project.
- Decision-making and process when doing certain tasks → `SKILL.md` corresponding to skill
- A lookup table that can only be read by some branches → skill's own `references/`
- Lookup table read by multiple skills → this directory

When adding a new file, register it in the above table, and add a relative path guide (`../shared-references/<file>.md`) to each skill that references it.
