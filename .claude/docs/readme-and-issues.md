# Module READMEs and Issues

Issues only track the overall goal, shared conventions, progress, and verification results — no specific files, key lists, implementation steps, or design details. The implementation process stays in the local spec; long-lived constraints live in the nearest document next to the code. When a relevant document exists under version control, the issue links to it.

A module `README.md` is a framework document: it describes what the system looks like now, why it is built this way, and what was given up. It is maintained long-term.

- Write for the reader, as short as possible. Directories aimed at players or external readers only say what it does, how to use it, and how to build and release it — no design trade-offs
- Only record key decisions the user signed off on. Details the AI chose during implementation that may change later (timeouts, retry intervals, text placement, etc.) are not written, and must not be presented as the user's decisions
- Do not organize by phase or batch. Ask of each paragraph: "will this become invalid once some phase is done?" — anything that will (phase breakdown, progress, files changed in this phase, debugging process and evidence, measured numbers) goes in the issue, PR, or local spec, not the README
- Do not restate what is already implemented; the code is the source of truth. Call chains, constant names and values, what a function does, how fields are assembled — read them from the code; copying them into docs only makes the docs go stale first (same rule as "Comment Conventions" in `AGENTS.md`). The README keeps only what the code cannot tell you: constraints, decisions, and their reasons
- One sentence of reasoning per decision. When a rejected option is worth mentioning, add half a sentence in the reasoning: "did not pick X because Y"; comparison tables and trial calculations stay in the PR
- Update only when a decision changes, not when a phase completes. If a change adds or overturns a long-lived decision, update the README in the same PR without waiting to be asked; if it merely wires one more spot under an existing decision, leave the README alone

Deciding whether a sentence goes in the README or `CLAUDE.md`: if violating it means "this change was done wrong", it goes in the relevant directory's `CLAUDE.md`; if it means "the system's structure changed", it goes in the README.
