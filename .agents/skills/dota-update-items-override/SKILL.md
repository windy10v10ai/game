---
name: dota-update-items-override
description: "Synchronize item changes after a Dota update: vanilla item overrides, upgraded clone values, and recipe costs affected by component price changes. Use only on explicit user request."
disable-model-invocation: true
---

# Item patch synchronization

Read current/previous item references and effective addon KV.
Use [override rules](../dota-update-abilities-override/references/override-rules.md)
for delta cleanup and documented design intent.

Each patch can affect vanilla overrides, cloned items, and custom recipes.
Compare all item/recipe `ItemCost` changes, including changes omitted from
the supplied notes; confirm snapshot/patch discrepancies before applying.

- Unoverridden vanilla keys inherit automatically.
- Find every clone whose `BaseClass` is the changed vanilla item.
  Clones do not inherit complete `AbilityValues`; compare every affected key.
  Recalculate documented multipliers/deltas from the new baseline.
  Ask when design intent is unresolved. Independent custom designs are not
  automatically scaled with vanilla.
- For each changed material, calculate effective old/new cost after overrides.
  An override fixing its cost makes the effective delta zero.
- In custom recipes, subtract the sum of material deltas, including repeated
  components, from recipe fee to preserve the finished item's price.
  Leave finished `ItemCost` unchanged.
- Ask about non-positive recipe fees and pre-existing total-price mismatches;
  do not silently change the finished price or reverse-engineer a new fee.
  Official vanilla recipes are maintained by vanilla and are outside this step.

Present patch changes and recipe linkage before applying the approved batch.
Verify component effective costs + recipe fee = finished price and that the diff
contains only approved entries. Keep requested batches in separate commits
when committing is authorized.
