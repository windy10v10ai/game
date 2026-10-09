---
name: dota-bot-ability-usage
description: "Implement AbilitySpec rules so bots cast a specified ability at the right time. Use when adding or adjusting bot ability casting; use dota-bot-item-usage for combat item activation."
---

# Bot ability casting

Owns `src/vscripts/ai/ability/specs/`.
Use `AbilitySpec` entries registered with `AbilityRegistry`;
do not add another hero-specific `UseAbilityXxx` execution path.
When migrating an existing override, retain its effective conditions and remove
the duplicate execution after verifying equivalence.

Resolve the ability and effective project KV using
[vanilla lookup](../../docs/dota-references.md).
Read `ability-spec.ts`, `ability-dispatcher.ts`, and
[shared casting rules](../../references/bot-casting.md) for supported fields.
Multiple scenarios for one ability share one file and an ordered `SPECS` array.
The hero's ability-slot order determines priority between different abilities.

## Targets and farming

Derive legal target sides from effective KV, not the tooltip.
Let the dispatcher fill casting range unless a deliberately smaller range or
a zero-range spatial effect needs an explicit limit.
Register multiple target-side entries when legal and useful.
`Self` bypasses target conditions; do not use it for enemy detection.

Ask before adding optional creep clearing. Eligible abilities have area damage,
can affect basic units, and are not strategically expensive.
Do not propose core escape/survival abilities or skills above roughly 45s
cooldown / 200 mana just to farm.
Place approved `EnemyCreep` rules after hero rules.
They run only in laning/push/farm/defend modes; dispatcher defaults are owned by
`CREEP_DEFAULT_CONDITION`. Override only intended differences.

Ancients are added centrally in farm mode using `ANCIENT_MIN_ABILITY_LEVEL`.
Respect `NOT_ANCIENTS`; use `excludeAncient` for a specific exception.

## Registration and checks

Add the import and `registerAll` call alphabetically to the appropriate
`specs/index-<start>-<end>.ts`, not the root `index.ts`.
Split groups approaching about 90 imports: TSTL's 200-local limit can prevent
the entire ability AI from loading.

Comments explain intent, not repeated condition numbers.
Build/type-check the spec and verify real casts in Tools using `[bot-cast]` logs.
A new declarative entry does not need a test that merely repeats its data;
dispatcher changes need meaningful framework tests.
