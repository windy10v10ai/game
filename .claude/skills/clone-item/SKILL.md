---
name: clone-item
description: >-
  Create or update a custom upgraded clone of a vanilla Dota item. Copies item
  KV from docs/reference items.txt into npc_items_clone.txt, creates recipe,
  boosts stats ~x2, and writes localization. Supports lookup by Chinese name or
  system name. Interactive menus for ambiguous decisions.
---

# 自定义升级物品（新建 / 更新）

将原版 Dota 物品克隆为升级版（如 `item_shivas_guard` → `item_shivas_guard_2`），写入
`game/scripts/npc/npc_items_clone.txt` 并补全本地化。

> 参考文件路径见 CLAUDE.md「Dota 2 参考文件速查」章节。

---

## 第一步：解析物品输入

用户给出的名字**即为克隆物品系统名**，可能是：
- **克隆物品系统名**（如 `item_armlet_light`、`item_shivas_guard_2`）→ 直接使用
- **中文名**（如「圣光臂章」）→ 在 `game/resource/addon_schinese.txt` 中搜索，提取对应系统名
- 若有多个候选，用 `AskUserQuestion` 让用户确认

克隆物品的命名规则：通常为原版名加后缀（如 `_2`、`_light`、`_dark` 等），**不强制要求 `_2` 结尾**。

**判断「克隆物品」的关键标准**：物品块的 `BaseClass` 不是 `item_datadriven` 也不是 `item_lua`，即继承自某个原版物品（如 `"BaseClass" "item_armlet"`）。

若用户给出的是**原版物品名**（在 `docs/reference/<version>/items.txt` 中能找到，且该名字本身就是顶层 key），则需询问用户克隆版的命名后缀（如 `_2`、`_light` 等）。

---

## 第二步：存在性检测（决定模式）

解析出克隆物品名后，搜索所有可能的文件：

```
Grep pattern: "<克隆物品名>"
files: game/scripts/npc/npc_items_clone.txt
       game/scripts/npc/npc_items_custom.txt
       game/scripts/npc/npc_items_artifact.txt
```

**判断是否为克隆版**：在搜索结果中，找到物品块（`"<克隆物品名>"\n{`），读取其 `BaseClass`：
- `BaseClass` = `item_datadriven` 或 `item_lua` → **不是克隆版**（是自制物品，改用 `custom-item` skill）
- `BaseClass` = 其他原版物品名（如 `item_armlet`）→ **是克隆版**

| 情况 | 处理 |
|------|------|
| **在 npc_items_clone.txt 中找到且是克隆版** | 目标文件 = npc_items_clone.txt；模式 = **更新** |
| **在旧文件中找到且是克隆版**（npc_items_custom.txt 或 npc_items_artifact.txt） | 提示用户：已在旧文件中找到，将迁移到 npc_items_clone.txt；模式 = **更新** |
| **所有文件均未找到** | 模式 = **新建** |
| **找到但 BaseClass 是 item_datadriven/item_lua** | 告知用户该物品是自制物品，不是克隆版，改用 `custom-item` skill |

---

## 第三步：确定原版物品名并读取 KV

**原版物品名的确定方式**：

- **更新模式**：从现有克隆块的 `BaseClass` 字段直接读取（如 `"BaseClass" "item_armlet"` → 原版名 = `item_armlet`）
- **新建模式**：
  - 若用户给出的克隆名形如 `item_<base>_<suffix>`，尝试在 `docs/reference/<version>/items.txt` 中搜索 `"item_<base>"`
  - 若找到唯一匹配，使用之；若找不到或有歧义，用 `AskUserQuestion` 询问用户「该克隆物品的原版 BaseClass 是什么？」

从 `docs/reference/<version>/items.txt` 搜索：
1. 原版 recipe 块：`"item_recipe_<原版名去掉item_前缀>"`
2. 原版物品块：`"<原版物品名>"`

完整读取两个块的所有字段（`ItemCost`、`AbilityValues`、`AbilityBehavior` 等）。

---

## 第四步：询问配方材料（新建模式）

新建时，配方需要包含：
- **原版物品本身**（必须，即 `BaseClass` 对应的原版物品名，如 `item_armlet`）
- **其他额外材料**（需问用户）

> 用 `AskUserQuestion` 询问：「额外配件有哪些？（输入物品系统名，多个用分号分隔，如 `item_platemail;item_vitality_booster`；若无额外材料输入"无"）」

若用户提供了克隆版的物品（如 `item_veil_of_discord_2`），保留该名称；否则使用原版名。

配方费用：询问用户，或默认计算公式 ≈ 克隆物品目标总价 - 原版物品价格 - 额外材料原版价格之和。

### 4-A：核实所有材料价格（强制）

**每项材料（含原版物品本身 + 所有额外材料）的价格必须从 `docs/reference/<version>/items.txt` 逐项读取 `ItemCost` 字段核实**，不得凭记忆或训练数据中的价格计算。

执行方式：
```
对每个材料物品名，在 docs/reference/<version>/items.txt 中搜索该物品块，读取其 ItemCost。
```

记录每项价格后汇总：材料总价 = 原版物品价格 + Σ 各额外材料价格。图纸费 = 用户目标总价 - 材料总价。

> **常见陷阱**：物品价格会随版本变动（如 `item_ultimate_orb` 在 7.41 为 2800，而非旧版的 2100），切勿依赖训练数据中的记忆值。

---

## 第五步：构建 Recipe KV

格式参考 `item_recipe_shivas_guard_2`：

```kv
	//=================================================================================================================
	// <物品英文名> <物品中文名>
	//=================================================================================================================
	"item_recipe_<name>_2"
	{
	    "BaseClass"                     "item_datadriven"
	    "Model"                         "models/props_gameplay/recipe.vmdl"
	    "AbilityTextureName"            "item_recipe_<name>_2"
	    "ItemCost"                      "<配方费用>"
	    "ItemRecipe"                    "1"
	    "ItemResult"                    "item_<name>_2"
	    "ItemRequirements"
	    {
	        "01"                        "<原版物品名>;<extra_items>"
	    }
	}

	"item_<name>_2"
	{
	    ...
	}
```

> - recipe 块上方加 `//===...===` 分隔注释，格式：`// <物品中文名>`
> - recipe 与物品本体之间**不加**注释，直接相邻

> - `BaseClass` 统一使用 `"item_datadriven"`，避免原版 recipe 不存在的风险
> - 不需要 `ID` 字段，引擎会自动分配

---

## 第六步：构建物品 KV（数值加强）

格式严格对照原版，**保持缩进格式完全一致**（tab 宽度、换行位置）。

必填字段：
- `"BaseClass"` → 原版物品名（如 `"item_shivas_guard"`）
- `"AbilityBehavior"` → 复制原版
- `"AbilityTextureName"` → `"item_<name>_2"`
- `"ItemCost"` → 计算新价格（= 原版价格 + 额外材料价格 + 配方费）
- 其他原版顶层字段（`AbilityCooldown`、`AbilityManaCost`、`FightRecapLevel`、
  `SpellDispellableType`、`AbilityCastRange`、`AbilityCastPoint`、
  `ItemShopTags`、`ItemQuality`、`ItemAliases`、`AbilitySharedCooldown` 等）→ 复制原版

**数值倍率确定**：
- 倍率 = 克隆物品总价 ÷ 原版物品价格（保留一位小数，如 2.0×、1.5× 等）
- 若总价已知（用户在第四步给出配方材料和价格）则自动计算
- **若无法确定倍率，用 `AskUserQuestion` 询问用户**：「该克隆物品的属性倍率是多少？（如 2.0、1.5）」

**AbilityValues 数值加强规则**：
- **可成长属性**（伤害、护甲、属性加成、法力/生命回复、施法范围、范围等）→ × 倍率（取整，优先整数）
- **固定机制值**（冷却时间、施法时间、移速、减速百分比、持续时间、速度等）→ **不变**，复制原版
- 每个值右侧用 `//` 注释原版值（例：`"bonus_armor"   "30"   // 15`，倍率 2.0×）

对于含子块的值（如 `aura_radius`），保留子块结构：
```kv
"aura_radius"
{
    "value"     "<2x值>"    // <原值>
    "affected_by_aoe_increase"  "1"
}
```

---

## 第七步：更新模式 — 同步原版 KV

更新现有克隆物品时，以最新版本的 `docs/reference/<version>/items.txt` 为基准：

1. 读取当前原版物品块的完整字段列表
2. **删除**克隆块中原版已不存在的字段（已废弃的键）
3. **补充**原版新增但克隆块缺失的字段（加强规则同第六步）
4. **保留**仅克隆物品有、原版没有的字段（如 `ItemAliases`、`AbilitySharedCooldown`、`AbilityTextureName`、`ID` 等克隆专属字段）
5. 重新按加强规则校验所有 `AbilityValues`，对照原版当前值 × 当前倍率（可成长属性，倍率 = 克隆物品总价 ÷ 原版价格，无法确定时询问用户），固定机制值与原版保持一致
6. **顶层字段**（`AbilityBehavior`、`AbilityCooldown`、`AbilityManaCost`、`FightRecapLevel`、`SpellDispellableType` 等）与原版保持一致

同时执行**第九步本地化更新**（见下方）。

---

## 第八步：图片提醒

检查图片文件是否存在：
```
game/resource/flash3/images/items/<name>_2.png
```
（注意：文件名去掉 `item_` 前缀，如 `shivas_guard_2.png`）

- 若**不存在** → 提醒用户：「请在 `game/resource/flash3/images/items/` 目录下创建 `<name>_2.png` 图片文件。`AbilityTextureName` 已设置为 `item_<name>_2`。」
- 若**已存在** → 无需任何提醒，直接跳过此步

---

## 第九步：本地化

### 9-A 定位原版本地化键

从 `docs/reference/<version>/abilities_english.txt` 和 `abilities_schinese.txt` 读取原版物品的所有 Tooltip 键：
```
Grep pattern: DOTA_Tooltip_ability_item_<name>
```

同时在项目本地化文件中检查克隆键是否已存在：
```
Grep pattern: item_<name>_2
files: game/resource/addon_english.txt, game/resource/addon_schinese.txt
```

**更新模式**下，必须将克隆物品的中英文说明与原版当前版本对齐：
- **Description**：以原版当前 Description 为模板，将键名替换为克隆名，内容与原版保持一致（不添加旧版中已删除的占位符）
- **Note\***：同步原版当前的所有 Note 条目（新增的补上，原版已删除的从克隆中移除）
- **属性行**（`_bonus_xxx`）：与原版当前 `AbilityValues` 中的键名保持一致（原版删除的属性行也从克隆本地化中删除，原版新增的补上）
- **Lore**：保留克隆版本的自定义 Lore，不跟随原版更新

### 9-B 复制并改写键名

将原版键名中的 `item_<name>` 替换为 `item_<name>_2`。

**物品名称命名规则**（参考现有已有克隆物品的命名惯例）：
- **描述、注释、属性行**：值与原版保持完全一致，不做改动
- **物品名称行**（`DOTA_Tooltip_Ability_item_<name>_2`）：必须改为新名称，规则如下：
  - **中文**：起一个有特色的全新名字（不要简单地加「2」或「升级版」），体现更强大、传说级的感觉。例：「雅典娜的守护」「天神杖」「无敌之刃」「神圣斧」「真·撒旦之邪力」。可选用 `<font color='#颜色'>名字</font>` 增加视觉效果。
  - **英文**：优先使用 `<font color='#颜色'>Upgraded</font> 原版英文名` 格式；若有好的独立名字也可直接使用。
  - 名称由 Claude **自主创意命名**，风格与现有克隆物品一致，不询问用户。

至少包含：
- `DOTA_Tooltip_Ability_item_<name>_2` — 物品名称
- `DOTA_Tooltip_ability_item_<name>_2_Description` — 描述
- `DOTA_Tooltip_ability_item_<name>_2_Lore`（若原版有）
- `DOTA_Tooltip_ability_item_<name>_2_Note*`（若原版有）
- `DOTA_Tooltip_ability_item_<name>_2_<stat>` — 属性加成行（对应 `AbilityValues` 中的值）

### 9-C 写入本地化文件

遵循项目本地化格式（tab 缩进）：

```
		// <物品中文名>_2
		"DOTA_Tooltip_Ability_item_<name>_2"    "..."
		"DOTA_Tooltip_ability_item_<name>_2_Description"    "..."
		...

```

同步写入 `game/resource/addon_english.txt` 和 `game/resource/addon_schinese.txt`。
每组条目前加注释 `// <物品中文名>_2`，条目后留一个空行。

---

## 第十步：Shops 替换

在以下位置搜索自定义 shops 文件（`docs/reference/shops.txt` 为只读参考，不修改）：
```
Glob: game/**/shops*.txt
Glob: game/scripts/npc/shops*.txt
```

若找到可写的 shops 文件：
1. 搜索其中是否包含原版物品名（如 `item_shivas_guard`）
2. 若存在，**直接将原版物品名替换为克隆版本名**（如 `item_shivas_guard_2`），不需询问用户

若未找到可写的 shops 文件，跳过此步。

---

## 第十一步：写入目标文件

目标文件：`game/scripts/npc/npc_items_clone.txt`

若文件不存在，创建并写入文件头：
```kv
// DO NOT EDIT MANUALLY. Managed by clone-item skill.
"DOTAAbilities"
{
```
以及文件尾：
```kv
}
```

在文件中追加（或更新）recipe 块和物品块，格式对照 `item_recipe_shivas_guard_2` /
`item_shivas_guard_2` 在 `npc_items_custom.txt` 中的写法。

同时在 `npc_items_custom.txt` 的顶层（若该文件用 `#include` 或引用机制）确认 `npc_items_clone.txt`
已被包含（若项目中有 `#include` 机制则添加；若无则跳过，后续手动配置）。

---

## 自检清单

- [ ] 原版物品 KV 已读取（recipe + 物品主块）
- [ ] Recipe 块：无 `ID` 字段，BaseClass = `item_datadriven`，ItemResult = `<克隆物品名>`，材料含原版物品（来自 BaseClass）
- [ ] 物品块：无 `ID` 字段，BaseClass = `<原版物品名>`（非 item_datadriven/item_lua），AbilityTextureName = `<克隆物品名>`
- [ ] 所有材料价格已从 `docs/reference/<version>/items.txt` 逐项读取 ItemCost 核实（非凭记忆）
- [ ] AbilityValues：可成长属性 × 2，固定机制值不变，每项附原版值注释
- [ ] ItemCost = 原版 + 额外材料 + 配方费之和
- [ ] 图片文件存在或已提醒用户创建
- [ ] addon_english.txt 和 addon_schinese.txt 已同步写入本地化键
- [ ] 本地化键名前缀与物品系统名完全匹配
- [ ] npc_items_clone.txt 格式正确（有文件头/尾，KV 块正确嵌套）
