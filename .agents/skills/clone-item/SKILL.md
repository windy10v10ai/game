---
name: clone-item
description: "Clone a vanilla Dota item into an upgraded item with approximately doubled values, a recipe, and localization. Use for enhanced vanilla items; use custom-item for original designs."
---

# Custom upgrade item (new/update)

clones the vanilla Dota item into an upgraded version (such as `item_shivas_guard` → `item_shivas_guard_2`), write
`game/scripts/npc/npc_items_clone.txt` and complete localization. For the

> reference file path, see `game/scripts/npc/CLAUDE.md` "vanilla KV Reference".

---

## The first step: parse the item input

The name given by the user is the system name of the cloned item, which may be:

- **Clone item system name** (such as `item_armlet_light`, `item_shivas_guard_2`) → use directly
- **Chinese name** (such as "Holy Light Armband") → Search in `game/resource/addon_schinese.txt` to extract the corresponding system name
- If there are multiple candidates, use `AskUserQuestion` to let the user confirm Naming rules for

cloned items: usually the vanilla name plus a suffix (such as `_2`, `_light`, `_dark`, etc.), **not mandatory to end with `_2`**.

**Key criteria for judging "clone item"**: `BaseClass` of the item block is neither `item_datadriven` nor `item_lua`, that is, it is inherited from a vanilla item (such as `"BaseClass" "item_armlet"`).

If the user gives a **vanilla item name** (which can be found in `docs/reference/<version>/items.txt`, and the name itself is the top-level key), the user needs to be asked for the naming suffix of the clone (such as `_2`, `_light`, etc.).

---

## Step 2: Existence detection (decision mode)

After parsing the cloned item name, search all possible files:

```
Grep pattern: "<cloned_item_name>"
files: game/scripts/npc/npc_items_clone.txt
       game/scripts/npc/npc_items_custom.txt
       game/scripts/npc/npc_items_artifact.txt
```

**Judge whether it is a clone**: In the search results, find the item block (`"<cloned_item_name>"\n{`) and read its `BaseClass`:

- `BaseClass` = `item_datadriven` or `item_lua` → **Not a clone** (It is a self-made item, use `custom-item` skill instead)
- `BaseClass` = other vanilla item names (such as `item_armlet`) → **is a cloned version**

| Situation                                                                             | Processing                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Found in npc_items_clone.txt and is a clone**                                       | Target file = npc_items_clone.txt; Mode = **Update**                                            |
| **Found in old file and is a clone** (npc_items_custom.txt or npc_items_artifact.txt) | Prompt user: Found in old file, will be migrated to npc_items_clone.txt; Mode = **Update**      |
| **All files not found**                                                               | Mode = **New**                                                                                  |
| **Found but BaseClass is item_datadriven/item_lua**                                   | Inform the user that the item is a self-made item, not a clone, use `custom-item` skill instead |

---

## Step 3: Determine the vanilla item name and read the KV

**How to determine the vanilla item name**:

- **Update mode**: Read directly from the `BaseClass` field of the existing clone block (such as `"BaseClass" "item_armlet"` → vanilla name = `item_armlet`)
- **New Mode**:
  - If the clone name given by the user is in the form `item_<base>_<suffix>`, try to search for `"item_<base>"` in `docs/reference/<version>/items.txt`
  - If a unique match is found, use it; if it cannot be found or there is ambiguity, use `AskUserQuestion` to ask the user "What is the vanilla BaseClass of this cloned item?"

Search from `docs/reference/<version>/items.txt`:

1. vanilla recipe block: `"item_recipe_<vanilla_name_without_item_prefix>"`
2. vanilla item block: `"<vanilla_item_name>"`

Completely reads all fields of both blocks (`ItemCost`, `AbilityValues`, `AbilityBehavior`, etc.).

---

## Step 4: Ask for formula materials (new mode)

is created, the recipe needs to contain:

- **vanilla item itself** (required, that is, the vanilla item name corresponding to `BaseClass`, such as `item_armlet`)
- **Other additional materials** (need to ask the user)

> Use `AskUserQuestion` to ask: "What are the additional accessories? (Enter the item system name, separate multiple items with semicolons, such as `item_platemail;item_vitality_booster`; if there are no additional materials, enter "none")"

If the user provides a cloned version of the item (such as `item_veil_of_discord_2`), keep this name; otherwise, use the vanilla name.

Recipe cost: Ask the user, or the default calculation formula is ≈ total target price of cloned items - vanilla item price - sum of additional material vanilla prices.

### 4-A: Verify all material prices (mandatory)

**The price of each material (including the vanilla item itself + all additional materials) must be read item by item from `docs/reference/<version>/items.txt` and verified by the `ItemCost` field**, and cannot be calculated based on memory or prices in training data.

execution method:

```
For each material item_name, search the item block in docs/reference/<version>/items.txt and read its ItemCost.
```

Record the price of each item and summarize it: total material price = vanilla item price + Σ price of each additional material. Drawing fee = total user target price - total material price.

> **Common trap**: The item price will change with the version (for example, `item_ultimate_orb` is 2800 in 7.41, not 2100 in the old version), do not rely on the memory value in the training data.

---

## Step 5: Build Recipe KV

format reference `item_recipe_shivas_guard_2`:

```kv
	//=================================================================================================================
	// <item English name> <item Chinese name>
	//=================================================================================================================
	"item_recipe_<name>_2"
	{
	    "BaseClass"                     "item_datadriven"
	    "Model"                         "models/props_gameplay/recipe.vmdl"
	    "AbilityTextureName"            "item_recipe_<name>_2"
	    "ItemCost"                      "<recipe_cost>"
	    "ItemRecipe"                    "1"
	    "ItemResult"                    "item_<name>_2"
	    "ItemRequirements"
	    {
	        "01"                        "<vanilla_item_name>;<extra_items>"
	    }
	}

	"item_<name>_2"
	{
	    ...
	}
```

> - Add `//===...===` separated comments above the recipe block, format: `// <Chinese item name>`
> - There is no annotation between the recipe and the item body, they are directly adjacent.

> - `BaseClass` use `"item_datadriven"` uniformly to avoid the risk of non-existent vanilla recipe
> - `ID` field is not required, the engine will automatically assign it

---

## Step 6: Build item KV (numeric enhancement)

is strictly compared to vanilla, **keeping the indentation format completely consistent** (tab width, line break position).

Required fields:

- `"BaseClass"` → vanilla item name (such as `"item_shivas_guard"`)
- `"AbilityBehavior"` → copy vanilla
- `"AbilityTextureName"` → `"item_<name>_2"`
- `"ItemCost"` → Calculate new price (= vanilla price + additional material price + recipe fee)
- Other vanilla top-level fields (`AbilityCooldown`, `AbilityManaCost`, `FightRecapLevel`,
  `SpellDispellableType`、`AbilityCastRange`、`AbilityCastPoint`、
  `ItemShopTags`, `ItemQuality`, `ItemAliases`, `AbilitySharedCooldown`, etc.) → Copy vanilla

**Numerical magnification determination**:

- magnification = total price of cloned item ÷ price of vanilla item (reserve one decimal place, such as 2.0×, 1.5×, etc.)
- If the total price is known (the user provides the formula materials and price in the fourth step), it will be automatically calculated.
- **If the magnification cannot be determined, use `AskUserQuestion` to ask the user**: "What is the attribute magnification of this cloned item? (such as 2.0, 1.5)"

**AbilityValues numerical enhancement rules**:

- **Grownable attributes** (damage, armor, attribute bonus, mana/life recovery, casting range, range, etc.) → × multiplier (rounded, giving priority to integers)
- **Fixed mechanism values** (cooling time, cast time, movement speed, slowdown percentage, duration, speed, etc.) → **unchanged**, copy vanilla
- Annotate the vanilla value with `//` on the right side of each value (example: `"bonus_armor"   "30"   // 15`, magnification 2.0×)

For values containing subblocks (such as `aura_radius`), the subblock structure is preserved:

```kv
"aura_radius"
{
    "value"     "<doubled_value>"    // <original_value>
    "affected_by_aoe_increase"  "1"
}
```

---

## Step 7: Update mode — Synchronize vanilla KV

updates an existing cloned item, the latest version of `docs/reference/<version>/items.txt` is used as the baseline:

1. Read the complete field list of the current vanilla item block
2. **Delete** vanilla fields that no longer exist in the clone block (obsolete keys)
3. **Supplement** Fields added by vanilla but missing from the clone block (enhanced rules are the same as step 6)
4. **Reserved** Only fields that are available in clone item but not in vanilla (such as `ItemAliases`, `AbilitySharedCooldown`, `AbilityTextureName`, `ID` and other clone-specific fields)
5. Re-verify all `AbilityValues` according to the enhanced rules, compare with the current value of vanilla × the current multiplier (growable attributes, multiplier = total price of cloned items ÷ vanilla price, ask the user if unsure), the fixed mechanism value is consistent with vanilla
6. **Top-level fields** (`AbilityBehavior`, `AbilityCooldown`, `AbilityManaCost`, `FightRecapLevel`, `SpellDispellableType`, etc.) are consistent with vanilla

Also perform **Step 9 Localization Update** (see below).

---

## Step 8: Icon reminder

item icon to take effect, **three places must be present** (remove the `item_` prefix from the file name, such as `shivas_guard_2.png`):

1. `game/resource/flash3/images/items/<name>_2.png`
2. `content/panorama/images/items/<name>_2.png` (copy of the same png)
3. `content/panorama/layout/custom_game/images_items.xml` middle row `<Image id="<name>_2" class="SeqImg" src="file://{images}/items/<name>_2.png" />` If

- **does not exist** under flash3 → remind the user: "Please create the `<name>_2.png` image file in the `game/resource/flash3/images/items/` directory. `AbilityTextureName` has been set to `item_<name>_2`." After placing it, you can complete steps 2 and 3.
- If ** already exists under flash3 ** → directly complete steps 2 and 3 After

is completed, run `npm run lint:images` to verify that the three points are consistent.

---

## Step 9: Localization

### 9-A locates vanilla localization key

Read all Tooltip keys of vanilla item from `docs/reference/<version>/abilities_english.txt` and `abilities_schinese.txt`:

```
Grep pattern: DOTA_Tooltip_ability_item_<name>
```

Also check whether the clone key already exists in the project localization file:

```
Grep pattern: item_<name>_2
files: game/resource/addon_english.txt, game/resource/addon_schinese.txt
```

In **update mode**, the Chinese and English description of the cloned item must be aligned with the current version of vanilla:

- **Description**: Use vanilla's current Description as the template, replace the key name with the clone name, and keep the content consistent with vanilla (no placeholders deleted in the old version are added)
- **Note\***: Synchronize all current Note entries of vanilla (new ones will be added, and deleted ones of vanilla will be removed from the clone)
- **Attribute row** (`_bonus_xxx`): consistent with the key name in vanilla’s current `AbilityValues` (the attribute row deleted by vanilla is also deleted from the clone localization, and the new one added by vanilla is added)
- **Lore**: retain the customized Lore of the cloned version and do not follow vanilla updates

### 9-B Copy and rewrite the key name

Replace `item_<name>` in the vanilla key name with `item_<name>_2`.

**item name naming rules** (refer to the naming convention of existing cloned items):

- **Description, comments, attribute lines**: The values ​​are completely consistent with vanilla, no changes are made
- **item name line** (`DOTA_Tooltip_Ability_item_<name>_2`): must be changed to a new name, the rules are as follows:
  - **Chinese**: Give it a distinctive new name (do not simply add "2" or "upgraded version") to reflect a more powerful and legendary feeling. Examples: "Athena's Guard", "God's Staff", "Invincible Blade", "Holy Axe", "True Satan's Evil Power". `<font color='#color'>name</font>` can be used to increase visual effects.
  - **English**: `<font color='#color'>Upgraded</font> original English name` format is preferred; if there is a good independent name, it can also be used directly.
  - is named by Claude **Independently creative naming**, the style is consistent with the existing clone item, and the user is not asked.

contains at least:

- `DOTA_Tooltip_Ability_item_<name>_2` — item name
- `DOTA_Tooltip_ability_item_<name>_2_Description` — Description
- `DOTA_Tooltip_ability_item_<name>_2_Lore` (if vanilla has it)
- `DOTA_Tooltip_ability_item_<name>_2_Note*` (if vanilla has it)
- `DOTA_Tooltip_ability_item_<name>_2_<stat>` — attribute bonus row (corresponding to the value in `AbilityValues`)

### 9-C Write localization file

follows the project localization format (tab indentation):

```
		// <item Chinese name>_2
		"DOTA_Tooltip_Ability_item_<name>_2"    "..."
		"DOTA_Tooltip_ability_item_<name>_2_Description"    "..."
		...

```

writes `game/resource/addon_english.txt` and `game/resource/addon_schinese.txt` simultaneously.
Add the comment `// <Chinese item name>_2` before each group of entries, and leave a blank line after the entry.

---

## Step 10: Shops replacement

Search for custom shops files in the following locations (`docs/reference/shops.txt` is a read-only reference and will not be modified):

```
Glob: game/**/shops*.txt
Glob: game/scripts/npc/shops*.txt
```

If a writable shops file is found:

1. Search whether it contains vanilla item name (such as `item_shivas_guard`)
2. If it exists, **directly replace the vanilla item name with the clone version name** (such as `item_shivas_guard_2`) without asking the user

If no writable shops file is found, skip this step.

---

## Step 11: Write the target file

Target file: `game/scripts/npc/npc_items_clone.txt`

If the file does not exist, create and write the file header:

```kv
// DO NOT EDIT MANUALLY. Managed by clone-item skill.
"DOTAAbilities"
{
```

and the end of the file:

```kv
}
```

Append (or update) the recipe block and item block in the file, the format is `item_recipe_shivas_guard_2` /
`item_shivas_guard_2` is written in `npc_items_custom.txt`.

also confirms `npc_items_clone.txt` at the top level of `npc_items_custom.txt` (if the file uses `#include` or the reference mechanism)
has been included (if there is `#include` mechanism in the project, add it; if not, skip it and configure it manually later).

---

## Self-check list

- [ ] vanilla item KV read (recipe + item main block)
- [ ] Recipe block: No `ID` field, BaseClass = `item_datadriven`, ItemResult = `<cloned_item_name>`, material contains vanilla item (from BaseClass)
- [ ] item block: None `ID` field, BaseClass = `<vanilla_item_name>` (not item_datadriven/item_lua), AbilityTextureName = `<cloned_item_name>`
- [ ] All material prices have been verified by reading ItemCost item by item from `docs/reference/<version>/items.txt` (not from memory)
- [ ] AbilityValues: Growth attributes × 2, fixed mechanism value remains unchanged, each item is accompanied by a vanilla value annotation
- [ ] ItemCost = sum of vanilla + additional materials + recipe fee
- [ ] The picture is available in three places (flash3 png / content png / images_items.xml registration), or the user has been reminded to create the flash3 one, `npm run lint:images` passed
- [ ] addon_english.txt and addon_schinese.txt have been written to the localization key synchronously
- [ ] The localized key name prefix exactly matches the item system name.
- [ ] npc_items_clone.txt is in the correct format (with file header/footer, and KV blocks are nested correctly)
- [ ] According to the "Verify item and ability" of `dota-live-test` on the actual machine, send the item and `-stat` to check that the attributes are consistent with the KV
