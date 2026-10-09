---
name: custom-item
description: "Create an original custom item, including artifacts assembled from multiple components. Use for new item designs, item_lua versus item_datadriven choices, and item-property performance; use clone-item for scaled vanilla clones."
---

# Custom item (self-made from scratch)

| scene                                                                                                             | skill          |
| ----------------------------------------------------------------------------------------------------------------- | -------------- |
| Inherit vanilla item delta override, numerical multiplier clone (`BaseClass` = vanilla item name)                 | `clone-item`   |
| **Made from scratch** (`BaseClass` = `item_datadriven` / `item_lua`, including multi-material synthesis artifact) | **This skill** |

> icon, localization, KV tab indentation, `#base` introduction, reference file path - all see `add-image` skill, `game/scripts/npc/CLAUDE.md` and `game/resource/CLAUDE.md`, this article will not repeat them.

---

## Step 1: Check reuse first

Before choosing an implementation mode, consult `../shared-references/vanilla-modifiers.md` yourself. If you hit it, it will be reused directly. You don’t need to go through the entire selection chain, and you don’t need to ask the user for this:

- "Inherit/reference/based on a certain vanilla equipment" appears in the requirement → directly apply the modifier of that equipment, and copy its field name `AbilityValues`
- The effect is a general state (magic immunity, stun, imprisonment, silence, invincibility, knockback, timed death) → Directly in the "General State" section of the list
- The effect is consistent with the ready-made behavior of a vanilla item or hero ability (splash, armor reduction, counter damage, disarm, displacement, true sight) → check the corresponding line in the list The list of

only includes the ones already in use in this repository, **not the complete set**. If it is not in the list but vanilla does have a corresponding item/ability, click on the file "How to find it outside the table" to find the modifier name and try again. Do not directly implement it yourself. On the contrary, don't force it: a vanilla modifier with inconsistent semantics will take effect along with its own other behaviors and properties, making it more difficult to troubleshoot than writing it yourself.

writes the value according to the **vanilla field name** in its own KV, and when `AddNewModifier` passes its own ability in, the vanilla modifier works according to these values ​​- it is the engine's native C++, does not pay callback tax, and **reuses even the attributes**.

`item_magic_crit_blade` has **not a single `Properties`** in his own `Modifiers` block\*\*, Intelligence 200 / Attack Speed 80 / Armor 14 all provided by `modifier_item_devastator`:

| field                   | vanilla `item_devastator` | `item_magic_crit_blade` |
| ----------------------- | ------------------------- | ----------------------- |
| `bonus_intellect`       | 40                        | 200                     |
| `bonus_attack_speed`    | 40                        | 80                      |
| `int_damage_multiplier` | 0.75                      | 1.25                    |
| `active_mres_reduction` | 20                        | 40                      |

Therefore this path avoids the main cost of both modes:

|                        | Reuse vanilla modifier     | Mode 1 write yourself `Properties` | Mode 2 sink `item_apply_modifiers` |
| ---------------------- | -------------------------- | ---------------------------------- | ---------------------------------- |
| Attribute declaration  | **No need to write**       | To write `Properties`              | To write `_stats`                  |
| Numerical truth source | **item own KV, one place** | one place                          | two places (+ mirror value)        |
| tooltip                | **Direct `%field_name`**   | Direct reference                   | To write `_tooltip` mirror         |
| Logical code amount    | **0**                      | Actions                            | TS                                 |

7 items in the repository do this: `item_beast_armor` (Blade Armor), `item_beast_shield` (Eternal Vestment), `item_hawkeye_turret` (Destruction), `item_magic_crit_blade` (Holy Axe), `item_magic_sword` (Frenzy Battle Ax + Destruction), `item_forbidden_staff` (Spirit Binding Cord), `item_shadow_impact` (Extreme Blade).

### Three mechanism rules

is copied from `docs/reference/<version>/items.txt`. **Check each item**. If these three items are checked, no error will be reported, but the value will be quietly wrong:

1. **Access on demand** - only write the fields you want. The corresponding effects of fields that are not written will not take effect, and there is no need to completely copy vanilla `AbilityValues`. When you don't want a certain sub-effect, you can delete the key or fill in `0` (`item_magic_sword` explicitly writes `bonus_damage_per_kill` and so on as `0` to express "I know this effect exists and take the initiative to turn it off").
2. **If you write it, it will be applied** - your own `Properties` **Do not** declare the attribute with the same name again, otherwise add the vanilla modifier once, add your own `Properties` once, and the **value will be doubled**. This is also true for the **mirror values** of mode 2: those image values ​​other than `xxx_tooltip` that follow the vanilla field name (`bonus_health` / `bonus_mana`, etc.) will still be read by the vanilla modifier. "Tooltip only" is just a statement in the comment, and the engine does not recognize it. When checking for intersection, you cannot skip it just because tooltip only is marked.
3. **Multiple vanilla common fields will be read once each** - When reusing two or more vanilla modifiers, first check their intersection `AbilityValues`. Fields falling within the intersection will be added once by each modifier. What should I do if the

### field conflicts?

**Let vanilla provide it by default** (keep the vanilla field name, do not write `Properties` yourself) - the least number of lines, the field name is self-explanatory. This is how `bonus_armor` 60 of `item_beast_armor` was given to Blade Armor.

Hit any of the following to **change the name to avoid** (change the field name that cannot be read by vanilla, provide it yourself `Properties`):

- Multiple vanilla fields share the same name and must be split -`item_magic_sword`Reuse Battle Fury + Obliteration, both`bonus_damage`, so this field is not written in KV, and instead`bonus_damage_passive`Provided by myself, neither vanilla can read it
- vanilla The value of this field is `0` or it is obviously a legacy field - it may be deleted during version synchronization at any time, and the attribute will disappear silently
- This value belongs to the item's own set of attributes and does not want to be influenced by vanilla behavior - for example, `bonus_intellect_passive` of `item_beast_armor` and `bonus_strength` / `bonus_agility` belong to the "full attribute" three-piece set

renaming will also affect localization: the key of the stat tooltip is `DOTA_Tooltip_ability_<item_name>_<field_name>`, and this line must also be changed after the field is renamed.

Method to check whether existing items have violated rules 2 and 3 → `references/datadriven-scope.md`.

---

## Step 2: Select mode

There are only two modes for reusing the parts that cannot be digested.

|                                         | Mode 1 "**DataDriven principal**"                                              | Mode 2 "**TS principal**"               |
| --------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| `BaseClass`                             | `item_datadriven`                                                              | `item_lua`                              |
| Properties live in                      | item own KV of `Modifiers` → `Properties`                                      | `item_apply_modifiers` of `_stats`      |
| The logic lives in the Actions block of | KV; when it is not enough `RunScript` calls the native Lua **global function** | `src/vscripts/items/ts_items/<name>.ts` |
| Numerical truth source                  | **One place**                                                                  | Two places (true value + mirror value)  |
| clear modifier                          | **engine automatic**                                                           | manual alignment of three life cycles   |
| type checking / jest                    | none                                                                           | **yes**                                 |
| Warehouse Stock                         | 18 Pure KV + 20 with RunScript                                                 | 7                                       |

**Only deprecated writing**: `item_lua` + handwritten `class({})` Native Lua (35 stocks) - neither type nor declarative convenience. The existing items are not migrated. When modifying existing items, they are continued according to the original writing method and cannot be reconstructed easily.

### Demarcation: Is what is outside the table "action" or "modifier"

First check `references/datadriven-scope.md` to determine which parts DataDriven cannot express (check the table, do not rely on memory). Let’s look at the part outside the table and see what form it looks like:

- Outside the table is an **action** - causing damage, generating units, hanging a vanilla modifier, issuing gold coins, and organizing items on the field → **Mode 1**, `RunScript` is written as a Lua global function Outside the
- table is a **resident modifier** - `ABSORB_SPELL`, `PROCATTACK_FEEDBACK`, `OnAttackLanded` with accounting, built-in cooling, cross-instance status synchronization → **Mode 2**

**Checkable out-of-bounds signal**: Once `LinkLuaModifier` + `class({})` appears in the Lua file in mode 1, it has fallen into the deprecated writing method and it is time to go to mode 2. There are no exceptions among the 13 samples in the repository - the 10 pure global functions (lines 11~179) are all healthy, and the three with `class({})` (`item_beast_armor` 195 lines / `item_hawkeye_turret` 256 lines / `item_magic_crit_blade` 193 lines) were exactly what should have been written as TS. Note that the reason for these three out of bounds is the handwritten modifier, not that they reuse vanilla - the reused part itself is clean.

**The number of lines is not a criterion**, `item_collector` 179 lines are all global functions, which is still clean mode 1.

### callback tax

Each `GetModifier*` of the Lua/TS modifier is "the engine checks once → returns Lua once". The more units there are and the more frequent the queries, the more stuck it becomes. This is the **callback tax**. DataDriven `Properties` is evaluated natively by the engine and does not pay taxes.

Therefore, **Numerical constant attributes are never written in TS**. Both permanent attributes and limited-time buffs are counted: mode 1 writes its own KV; mode 2 sinks `item_apply_modifiers`-permanently writes the `_stats` block by `BaseItemModifier` to align the layers, and the limited-time buff is written into a complete modifier block, by script `ApplyItemDataDrivenModifier` passed on `duration`. These attributes in the project have already been fully migrated (`npc_items_modifier.txt` 27 `_stats` blocks), and new items will do so.

`item_lua`'s KV **does not support** its own `Modifiers` block (0 examples of full positions), which is exactly why `item_apply_modifiers` exists, not a style choice.

### Image value: cost of mode 2

`item_apply_modifiers` is a global singleton fake item that no one holds. `%value` of `_stats` can only reference its own `AbilityValues` (the key must be prefixed with `<item_name>_`). The item tooltip cannot be referenced there, so the same number needs to be written in two places:

```kv
// npc_items_modifier.txt → AbilityValues of item_apply_modifiers: true
"item_saint_orb_bonus_all_stats"    "30"

// npc_items_custom.txt → item_saint_orb own AbilityValues: mirror value, only displayed for tooltip
"bonus_all_stats_tooltip"           "30"
```

To change the value, you must manually synchronize the two places, and there is no mechanism to report an error. Mode 1 does not have this problem - there is only one place for the value, and the tooltip refers directly to the same key.

---

## Step 3: Mount and clear modifier

**Clear responsibilities and follow the hanging method**. If you choose the wrong hanging method, you will have to make up the accounting by yourself.

| Hanging method                                               | Who is responsible for emptying                                                                                                   | Used in               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `Modifiers` of the item's own KV                             | **Engine**, automatically hang and pick with the gain and loss of the item                                                        | Mode 1                |
| KV `ApplyModifier` with vanilla modifier + `Duration`        | **Engine**, time limit expired                                                                                                    | Mode 1 active ability |
| Script `AddNewModifier` hangs **modifier with duration**     | **Engine**, time limit expires                                                                                                    | Two modes             |
| Script `AddNewModifier` hangs **permanent** vanilla modifier | **self**, `ability.added_modifiers` array + `OnDestroy` traverses `Destroy()`                                                     | mode 1                |
| `vanillaModifierNames` of `BaseItemModifier`                 | **Base class**, picked up and removed according to the gain and loss of the item and destroyed accurately according to the handle | **Only mode 2**       |
| `_stats` of `item_apply_modifiers`                           | **`RefreshItemDataDrivenModifier`**, `OnCreated`/`OnRefresh`/`OnDestroy` need to be adjusted in three places                      | **Only mode 2**       |

**`item_apply_modifiers` only belongs to mode 2**: 27 items corresponding to `_stats` are 100% `item_lua`, and there is no `item_datadriven`. Mode 1 has its own `Modifiers` block, which is not needed and should not be touched.

Mode 1 When hanging the **permanent** vanilla modifier, use the DataDriven modifier's own `OnCreated` / `OnDestroy` event block as a hook (example `item_beast_armor`) - these two callbacks are triggered by the engine with the gain and loss of items, which is more reliable than judging the timing by yourself. Batch accounting writing method for multiple vanilla modifiers → `references/datadriven-scope.md`.

---

## Step 4: Pattern Skeleton

### Mode 1 "DataDriven main body"

value and trigger are in the same KV block. Example `item_wasp_despotic` (zero script: `Random` / `ApplyModifier` / `RemoveModifier` / `FireSound` string out probability of critical hit + active buff): A complete list of

```kv
"item_my_new_item"
{
    "BaseClass"             "item_datadriven"
    "AbilityBehavior"       "DOTA_ABILITY_BEHAVIOR_PASSIVE"
    "AbilityTextureName"    "my_new_item"
    "AbilityValues" { "bonus_armor" "30" }
    "Modifiers"
    {
        "modifier_item_my_new_item"
        {
            "Passive"        "1"
            "IsHidden"       "1"
            "Attributes"     "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"
            "Properties" { "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS" "%bonus_armor" }
        }
    }
}
```

A complete list of Actions can be found on [Valve Wiki](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven#Actions). You can also directly`ApplyModifier`A vanilla modifier (example`item_beast_shield`of`modifier_black_king_bar_immune`), you don’t have to first add it to your own`Modifiers`Declared in the block.

**Actions cannot be expressed, connect to RunScript**, Lua puts `game/scripts/vscripts/items/<name>.lua`, and only writes global functions:

```kv
"OnSpellStart"
{
    "RunScript" { "ScriptFile" "items/item_my_new_item"  "Function" "MyNewItemOnSpell" }
}
```

`ScriptFile` of `RunScript` must be native Lua - the TSTL product is a module package, the function is not in the global scope of the file, and there is no precedent for the repository. To write TS, go to mode 2 and don't try to make RunScript point to the compiled product.

### Mode 2 "TS Main Body"

KV `BaseClass` = `item_lua`, `ScriptFile` points to `items/ts_items/<name>`; implement `src/vscripts/items/ts_items/`, the item body inherits `BaseItem`, and the intrinsic modifier inherits `BaseItemModifier`. Example `item_saint_orb.ts`, `item_six_paths_reincarnation_gun.ts`:

```ts
import { BaseItem, registerAbility, registerModifier } from "../../utils/dota_ts_adapter";
import { BaseItemModifier } from "./base_item_modifier";

@registerAbility("item_my_new_item")
export class ItemMyNewItem extends BaseItem {
  GetIntrinsicModifierName(): string {
    return "modifier_item_my_new_item_passive";
  }
}

@registerModifier("items/ts_items/item_my_new_item", "modifier_item_my_new_item_passive")
export class ModifierItemMyNewItemPassive extends BaseItemModifier {
  override statsModifierName = "modifier_item_my_new_item_stats"; // Fill in if there are no permanent attributes ''
  override vanillaModifierNames = ["modifier_item_xxx"]; //Reuse vanilla modifier, if not, do not write it
  // Only hand-written logic outside the references/datadriven-scope.md table
}
```

`BaseItemModifier` has realized the synchronization of `_stats` in three life cycles (aligning the layers according to the number of instances of the item in the backpack), as well as the hanging of the vanilla modifiers in `vanillaModifierNames`. **When overriding these three callbacks, `super.XXX()`** must be called, otherwise the properties will be silently invalid.

`vanillaModifierNames` receives an array. One item can reuse multiple vanilla modifiers at the same time; the base class saves the handle and destroys it one by one `Destroy()`. Do not write `RemoveModifierByName` yourself (see `references/datadriven-scope.md` for the reason). If the

item has no permanent attributes at all (consumables/tools, 4 of the 7 TS items have this), `statsModifierName` will be filled in with `''`, and `item_apply_modifiers` will not be touched at all.

**Two easy pitfalls**: The newly added **visible** buff/debuff of

- item (`IsHidden()` is `false`) must explicitly overwrite `GetTexture()`, and return the **system registration name** of the item (with `item_` prefix). Based on this, the engine finds `AbilityTextureName` of item KV and then locates the actual png, not the texture file name itself.
- The **first time** of `StartIntervalThink(interval)` `OnIntervalThink` triggers immediately, instead of waiting for an interval. The logic of "Settlement every N seconds" requires a mark to skip the first callback, otherwise it will be settled one more time at the moment of creation.

---

## Step 5: Synthesis formula and ID

```kv
"item_recipe_my_new_item"
{
    "BaseClass"          "item_datadriven"
    "Model"              "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName" "item_recipe_my_new_item"
    "ItemCost"           "<recipe_cost>"
    "ItemRecipe"         "1"
    "ItemResult"         "item_my_new_item"
    "ItemRequirements"
    {
"01" "item_a;item_b" // This recipe requires one piece a and one piece b each
"02" "item_c;item_c" // or two pieces c
    }
}
```

- Each `"0N"` is **a complete recipe**. What is separated by `;` in the line is **all the materials** required for this recipe (AND, if one is missing, it cannot be combined); if you need two of the same material, write it twice in the line. If there are pure token materials with no attributes such as `item_fusion_agile` mixed in the industry, it is customary to rank them at the bottom, and materials with numerical values ​​at the front.
- is **OR** between multiple `"0N"`, and any one of them can be synthesized. **Multi-path synthesis** (the same finished product allows different intermediate products to be spelled out, for example, `item_recipe_armlet_artifact` uses two to cover two orders). It is only used when the user explicitly requires that "any order can be synthesized". By default, only `"01"` is written.
- Don't think of `"0N"` as a "slot" - written as one material per line, the actual effect is that "any material can be synthesized", and an error occurs silently.
- `ItemCost`: According to "total price of materials + drawing fee = total price of item", please confirm the specific value with the user or refer to the pricing of similar artifacts.

### ID assignment

Self-made items (non-clone) require explicit `"ID"`. Take the maximum value of `"ID"` + 1 in all **`game/scripts/npc/npc_items*.txt` files** - the ID segments of each file are interleaved with each other (custom 3021 onwards, artifact 9623 onwards, mixed within the same segment), scanning only one file will cause collision. Once the

```
Grep pattern: "ID"
files: game/scripts/npc/npc_items_*.txt
```

ID is written, do not change it (there is a convention note in the project: "Do not change this once established").

### Attribute selection when formula materials are changed

multi-path fusion artifacts are usually **fixed values**, regardless of which path is taken (precedent: `item_fusion_agile` is a pure token with no attributes and is only used as a synthesis condition). When a recipe adds/replaces an optional material, do not default to "keep fixed attributes unchanged" or "incorporate all values of the new material directly into the finished product". Use `AskUserQuestion` to give the user a choice between 2 and 3 based on the material input cost:

- Cheap/restricted purchase token material: does not contribute attributes and maintains the status quo
- High-value artifact materials (thousands to tens of thousands of gold): Discarding its unique values (damage/armor/life recovery, etc.) completely is a waste of investment. You can consider adding one or two simple values; however, triggering mechanisms (blood exchange, chain effects, active single-target gains, etc.) are usually not included, otherwise the finished product will stack too many mechanisms.
- Each level clearly indicates which mechanisms have been discarded. Do not make decisions on your own.

If the **active ability** of an optional material requires inheritance to the finished product (rather than discarding it), three synchronizations are indispensable:

1. KV: The finished product `AbilityBehavior` is changed to the target type, `AbilityUnitTarget*` / `AbilityCastRange` is completed, and the original charging / shared cooling mechanism of the active
2. script: Move the `OnSpellStart` logic of the source material to the finished product implementation (the charging consumption determination should also be changed to check the finished product’s own item name)
3. bot will use: In addition to the ItemSpec registration of `bot-item-usage`, check the file called by hard-coding the item name - reusing the same piece of ability logic will not allow the bot to automatically recognize the new item, and a line must be explicitly added

---

## Step 6: Finishing

- **Icon/Localization/`#base` introduces new KV files** → `add-image` skill and `game/resource/CLAUDE.md` (when the item has active + passive at the same time, use `\n` to separate the two segments of `<h1>`, do not use `<br><br>`)
- **KV landing point** → Ordinary homemade item `npc_items_custom.txt`; Dragon Ball/Blessing and other artifact series `npc_items_artifact.txt`; `_stats` of `item_apply_modifiers` and independent DataDriven modifier `npc_items_modifier.txt` (**do not put** the item body)
- **bot knows how to buy/use** → `bot-item-build` (purchase decision), `bot-item-usage` (combat use)
- **Verification** → Restart Dota Tools after changing the KV (`script_reload` does not re-read the KV); in Mode 1, Lua can be changed to `script_reload`; in Mode 2, run `npm run build:vscripts` once at the end to only read the error report and not read the compiled product. The runtime behavior depends on jest (own branch logic) + Dota Tools Real running
- **The item of vanilla modifier has been reused**, and the actual machine confirmed that the attribute value is consistent with KV (double is silent, and the tooltip displays the KV value, not the actual effective value)
- **Real machine verification** Press the "Verify item and ability" of `dota-live-test`: `-give` sends items, `-stat` checks attributes, `-cast` + `-watch` verifies automatically, and the entire log is read without clicking the interface.

## Ask when unclear

Use the `AskUserQuestion` menu to confirm, do not assume:

- Mode selection: When the semantics of the external part of the table are unclear whether it is "action" or "resident modifier"
- Should "let vanilla provide it" or "change the name to avoid it" for field conflicts? When the criterion is not unique
- Whether a certain attribute is out of the table (check `references/datadriven-scope.md` first, then ask if you are still not sure)
- Synthetic materials, formula cost, total item price
- Is multi-path synthesis required?
