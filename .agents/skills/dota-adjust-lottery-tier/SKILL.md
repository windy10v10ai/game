---
name: dota-adjust-lottery-tier
description: "Review ability lottery tiers from win-rate CSV data and propose tier changes, additions, or removals. Use only on explicit user request."
disable-model-invocation: true
---

# Ability lottery tiers

Owns `src/vscripts/modules/lottery/lottery-abilities.ts`.
Use active/passive win-rate CSVs independently; process only supplied pools.
Columns are ability, tier, win rate, and event count; skip the header.
Do not change `BASE_TIER_RATES` or `PREMIUM_TIER_RATES`.

Read [statistical rules](references/statistical-rules.md) before analyzing data.
They define sample adequacy, whole-pool quantile assignment, conservative
migration limits, and final-state convergence.
Use quantiles for movement direction; current-tier means only support
exceptional low-T1/extreme-value checks.

Resolve displayed names from project localization, then current vanilla text;
use the system name if no translation exists.
Present evidence and initial/proposed/target counts before applying changes.
Use the repository's [planning location](../../docs/planning.md) for a large plan;
do not write to another developer's private profile directory.

Apply only approved migrations/removals. Preserve the existing mechanism
sections and localized comments, and ask separately about unusually weak T1
or rarely selected abilities.
KV buffs/nerfs are separate design decisions, handled by $dota-update-abilities-override.
After editing, check membership/counts against the approved simulation and run
the lottery tests; verify selection behavior in Tools when needed.
