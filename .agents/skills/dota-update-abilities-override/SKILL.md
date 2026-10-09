---
name: dota-update-abilities-override
description: "Maintain npc_abilities_override.txt after Dota updates, either by a full hero review or by synchronizing official patch-note entries. Use only on explicit user request."
disable-model-invocation: true
---

# Ability patch synchronization

Owns `game/scripts/npc/npc_abilities_override.txt`.
Resolve identity/version through [vanilla lookup](../../docs/dota-references.md).
Read complete ability blocks, including nested `AbilityValues`, to determine
effective values; top-level grep alone can miss mana/cooldown overrides.

Use [override rules](references/override-rules.md) in order:
remove inherited/obsolete values, apply documented design deltas and level
extension, then update baseline comments.
Defaults are five basic levels and four ultimate levels; explicit MaxLevel wins.
Do not extend innate abilities; omit an override MaxLevel when vanilla is 1.

For a hero-wide pass, merge custom slots over current vanilla slots.
Include slots 1–3/6 and valid 4/5 entries; skip `generic_hidden`.
Innate entries in 4/5 receive only intended value deltas.

## Patch batches

Compare old/new reference blocks with supplied old/new patch values.
Snapshots can capture abilities at different times: do not infer both values
from one snapshot. If a not-yet-live change is absent from reference, use the
confirmed official notes; ask when snapshot status is uncertain.

List inherited changes, proposed override edits, talent replacements, and
unrelated old deviations separately. Old deviations require a separate decision;
do not silently add them to the batch.
Apply after the user confirms the concrete changes; verify the diff matches.
Keep batches separate when committing is requested.

Verify changed talents still exist in merged Ability10–17.
After each hero pass, use $dota-update-heroes-custom for existing Bot.Build
entries. Do not manufacture entries for heroes without a build.
