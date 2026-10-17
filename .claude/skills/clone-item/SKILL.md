---
name: clone-item
description: 把原版物品克隆成升级版（数值约 2 倍 + 配方）。
---

# 克隆原版物品（新建 / 更新）

把原版物品克隆为升级版（如 `item_shivas_guard` → `item_shivas_guard_2`），写入 `game/scripts/npc/npc_items_clone.txt`（由本 skill 维护）并补全本地化。参考文件路径见 `game/scripts/npc/CLAUDE.md`「原版 KV 参考」。

## 1. 定物品与模式

用户给的是克隆物品名（`item_armlet_light`、`item_shivas_guard_2`，后缀不限 `_2`）或中文名（在 `game/resource/addon_schinese.txt` 搜系统名，多个候选用 `AskUserQuestion`）。给的是原版物品名（`items.txt` 的顶层 key）时，问用户克隆版后缀。

在 `npc_items_clone.txt`、`npc_items_custom.txt`、`npc_items_artifact.txt` 里搜物品块，读 `BaseClass`：

| 情况                                               | 处理                                                 |
| -------------------------------------------------- | ---------------------------------------------------- |
| 在 `npc_items_clone.txt`，`BaseClass` 是原版物品名 | **更新模式**                                         |
| 在另外两个文件，`BaseClass` 是原版物品名           | 告诉用户将迁移到 `npc_items_clone.txt`，**更新模式** |
| `BaseClass` 是 `item_datadriven` / `item_lua`      | 是自制物品，转 `custom-item`                         |
| 都没找到                                           | **新建模式**                                         |

原版物品名：更新模式取现有块的 `BaseClass`；新建模式按 `item_<base>_<suffix>` 在 `items.txt` 搜 `"item_<base>"`，不唯一就问用户。从 `items.txt` 完整读原版物品块与 `"item_recipe_<原版名去掉 item_>"` 块。

更新模式按 `references/update-mode.md` 同步 KV 与本地化，然后跳到第 5 步。

## 2. 配方材料与价格（新建）

配方 = 原版物品本身 + 用户给的额外材料。用 `AskUserQuestion` 问额外材料（系统名用 `;` 分隔，没有就「无」）；用户给的是克隆版材料（如 `item_veil_of_discord_2`）就保留克隆名。

**每项材料的 `ItemCost` 都从当前版本 `items.txt` 读出来核实**（价格随版本变动，如 `item_ultimate_orb` 在 7.41 是 2800）。图纸费 = 用户目标总价 − 材料总价，或问用户。

完成：每项材料的价格都有出处。

## 3. Recipe KV

格式对照 `item_recipe_shivas_guard_2`：

```kv
	//=================================================================================================================
	// <物品中文名>
	//=================================================================================================================
	"item_recipe_<name>_2"
	{
	    "BaseClass"                     "item_datadriven"
	    "Model"                         "models/props_gameplay/recipe.vmdl"
	    "AbilityTextureName"            "item_recipe_<name>_2"
	    "ItemCost"                      "<图纸费>"
	    "ItemRecipe"                    "1"
	    "ItemResult"                    "item_<name>_2"
	    "ItemRequirements"
	    {
	        "01"                        "<原版物品名>;<额外材料>"
	    }
	}

	"item_<name>_2"
	{
	    ...
	}
```

分隔注释只在 recipe 上方，recipe 与物品本体直接相邻。recipe 统一 `item_datadriven`。两个块都不写 `ID`，引擎自动分配。

## 4. 物品 KV（数值加强）

缩进、换行与原版一致。`BaseClass` = 原版物品名，`AbilityTextureName` = `item_<name>_2`，`ItemCost` = 原版 + 额外材料 + 图纸费；`AbilityBehavior` 与其他顶层字段（`AbilityCooldown`、`AbilityManaCost`、`FightRecapLevel`、`SpellDispellableType`、`AbilityCastRange`、`AbilityCastPoint`、`ItemShopTags`、`ItemQuality`、`ItemAliases`、`AbilitySharedCooldown` 等）复制原版。

倍率 = 克隆总价 ÷ 原版价格（一位小数），算不出来就问用户。`AbilityValues`：

- 可成长属性（伤害、护甲、属性、回复、施法距离、范围）× 倍率，取整
- 固定机制值（冷却、施法时间、移速、减速百分比、持续时间、速度）照抄原版
- 每个值右侧 `//` 注原版值（`"bonus_armor"   "30"   // 15`）；有子块的（如带 `affected_by_aoe_increase` 的 `aura_radius`）保留子块结构

## 5. 图标

文件名去掉 `item_` 前缀。flash3 下还没有 png 时提醒用户放 `game/resource/flash3/images/items/<name>_2.png`；有了就按 `add-image` 的物品图标流程补 content 副本与 xml 登记。

## 6. 本地化

grep 原版两份说明文本里的 `DOTA_Tooltip_ability_item_<name>`，把键名换成克隆名。至少包含名称、`_Description`、原版有的 `_Lore` / `_Note*`、与 `AbilityValues` 对应的属性行。描述、Note、属性行的值与原版一致。

**名称**由你自主创意命名，风格与现有克隆物品一致：中文起有传说感的新名字（「雅典娜的守护」「天神杖」「真·撒旦之邪力」，不简单加「2」），可加 `<font color='#颜色'>`；英文优先 `<font color='#颜色'>Upgraded</font> 原版英文名`。

按 `game/resource/CLAUDE.md` 三语同步写入，每组条目前加 `// <物品中文名>` 注释、条目后空一行。

## 7. 商店

`Glob game/**/shops*.txt` 找可写的 shops 文件（`docs/reference/shops.txt` 只读），里面有原版物品名就直接换成克隆名。

## 完成标准

- recipe 与物品块无 `ID`；recipe 材料含原版物品；物品 `BaseClass` 是原版物品名
- 每项材料价格都从 `items.txt` 核实；`ItemCost` 等于各项之和
- 可成长属性已乘倍率、固定机制值不变，每项带原版注释
- 图标三处齐备或已提醒用户，`npm run lint:images` 通过
- 三语本地化键与物品系统名完全匹配
- 实机按 `dota-live-test`「验物品与技能」发物品，`-stat` 核对属性与 KV 一致
