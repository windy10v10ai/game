---
name: update-items-override
description: "Synchronize item changes after a Dota update: vanilla item overrides, upgraded clone values, and recipe costs affected by component price changes. Use only on explicit user request."
disable-model-invocation: true
---

# Update Items Override

Synchronize item changes according to the official patch log. A modification to a vanilla item will affect three places, and each batch must be completed one by one:

| Affected areas                                        | Documents                                                   | Rules                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| vanilla item itself                                   | `npc_items_override.txt`, `npc_items_override_neutral*.txt` | Same delta override rules as ability                                                                 |
| Clone the upper item (`BaseClass` = the vanilla item) | `npc_items_clone.txt`, etc.                                 | Recalculate with the new vanilla value according to the end-of-line comment rules                    |
| Recipes using price-changed materials                 | All `npc_items_*.txt`’s `item_recipe_*`                     | The recipe fee offsets the price difference, and the total price of the upper item remains unchanged |

delta override, comments, `延伸` tags and other rules will all follow P1–P3 of `update-abilities-override`. This file only writes the item-specific parts. The reference documents are `docs/reference/<version>/items.txt` and `neutral_items.txt` (for the method of obtaining `<version>`, see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference"). Use `grep` / fragment to read and position, and do not read the entire item file.

## Each batch process

1. **Check**: Give it to the background subagent of `model: "sonnet"` to compare the previous version with the new version `items.txt`, return:
   - The item system name, KV key, old and new values corresponding to each log
   - **All** `ItemCost` changes (item and `item_recipe_*`, including vanilla high-level items that have been passively changed in price due to material price increases), list the price difference
   - Other numerical differences not mentioned in the log

   The main session reads this addonitem file by itself, and the subagent does not determine the modification method.

2. **vanilla item**: This addon does not write this key → it will take effect automatically; if it writes → press P1–P3 to give a new value.

3. **Clone item**: For each changed item, `grep` produces all upper items of `"BaseClass"\s+"<item>"`:
   - end-of-line comments with vanilla values and rules (`// 175`, `// 15 x2`) → recalculate with the new vanilla value at the same rate, and the comment base is synchronized to the new value
   - comment cannot derive the magnification, or the value is the same as the old vanilla value and there is no comment → Use `AskUserQuestion` to ask item by item
   - Self-made item (`npc_items_custom.txt`, etc.) does not have vanilla value annotation → regarded as an independent design, no changes, just list it in the checklist

   clone block does not inherit vanilla `AbilityValues`. If vanilla is changed, the hard-coded keys of the clone block will not automatically follow and must be passed key by key.

4. **Recipe price linkage**:
   - The **effective price** of the material = override. If `ItemCost` is written, the override value will be used, otherwise the reference value will be used. Override is a material with a nailed price. The effective price difference is 0 and there is no linkage.
   - For each material with effective price difference Δ ≠ 0, `grep` all `npc_items_*.txt` `ItemRequirements` contains this addon formula of the item, subtract Δ from `ItemCost` of the formula, `ItemCost` of the upper item itself does not move
   - When the same formula contains multiple price-changed materials, Δ is accumulated
   - New formula fee ≤ 0 → Use `AskUserQuestion` to ask item by item (higher item price increase/recipe fee set to 0 and accept the total price change) The formula and total price of the
   - vanilla upper item are maintained by the official and do not belong to this addon formula and will not be processed in this step.

5. **Checklist**: Each log has one line, and a new paragraph lists the formula linkage (recipe name, material, Δ, old formula fee → new formula fee, total price of the upper item). Change after user confirmation.

6. **Complete the self-test and commit**:
   - `git diff` Only the rows in the check table were moved
   - Each modified formula: the sum of the effective prices of materials + formula fee = upper item `ItemCost`. If it is not equal before the change (the price is wrongly written), use `AskUserQuestion` to ask piece by piece when issuing the checklist (the price is changed to the actual total price / the current batch is unchanged), and the formula fee is not calculated back by yourself.
   - commit separately for each batch

## How to write this addon recipe

The total price of the upper item `ItemCost` is written separately, and there is no automatic correlation with the material price and formula fee. When the price of materials changes but the formula fee remains unchanged, the actual cost of synthesizing each piece will not match the marked price, so the formula fee will be linked with the material price difference, keeping the total price of the upper item unchanged.
