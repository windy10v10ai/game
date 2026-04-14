---
name: clone-item
description: >-
  Create or update a custom upgraded clone of a vanilla Dota item. Copies item
  KV from docs/reference items.txt into npc_item_clone.txt, creates recipe,
  boosts stats ~x2, and writes localization. Supports lookup by Chinese name or
  system name. Interactive menus for ambiguous decisions.
---

# 自定义升级物品（新建 / 更新）

将原版 Dota 物品克隆为升级版（如 `item_shivas_guard` → `item_shivas_guard_2`），写入
`game/scripts/npc/npc_item_clone.txt` 并补全本地化。

> 参考文件路径见 CLAUDE.md「Dota 2 参考文件速查」章节。

---

## 第一步：解析物品输入

用户可给出：
- **系统名**（如 `item_shivas_guard`）→ 直接使用
- **中文名**（如「西瓦的守护」「晶化之刃」）→ 在 `docs/reference/<version>/items_schinese.txt`（若存在）或
  `game/resource/addon_schinese.txt` 中搜索中文名，提取对应系统名
- 若有多个候选，用 `AskUserQuestion` 让用户确认

克隆物品系统名默认为原版名加后缀 `_2`（如 `item_shivas_guard_2`）。
若用户指定不同后缀，按用户指定。

---

## 第二步：存在性检测（决定模式）

解析出克隆物品名后，搜索目标文件：

```
Grep pattern: "item_shivas_guard_2"
file: game/scripts/npc/npc_item_clone.txt
```

同时搜索以下旧版存放位置：
- `game/scripts/npc/npc_items_custom.txt`
- `game/scripts/npc/npc_items_artifact.txt`

| 情况 | 处理 |
|------|------|
| **仅在 npc_item_clone.txt 中找到** | 目标文件 = npc_item_clone.txt；模式 = **更新** |
| **仅在旧文件中找到**（npc_items_custom.txt 或 npc_items_artifact.txt） | 提示用户：已在旧文件中找到，将迁移到 npc_item_clone.txt；模式 = **更新** |
| **所有文件均未找到** | 模式 = **新建** |

---

## 第三步：读取原版物品 KV

从 `docs/reference/<version>/items.txt` 搜索：
1. 原版 recipe 块：`"item_recipe_<name>"`
2. 原版物品块：`"item_<name>"`

完整读取两个块的所有字段（`ItemCost`、`AbilityValues`、`AbilityBehavior` 等）。

---

## 第四步：询问配方材料（新建模式）

新建时，配方需要包含：
- **原版物品本身**（必须，如 `item_shivas_guard`）
- **其他额外材料**（需问用户）

> 用 `AskUserQuestion` 询问：「额外配件有哪些？（输入物品系统名，多个用分号分隔，如 `item_platemail;item_vitality_booster`）」

若用户提供了 `_2` 版本的物品（如 `item_veil_of_discord_2`），保留；否则使用原版。

配方费用：询问用户，或默认计算公式 ≈ 克隆物品目标总价 - 原版物品价格 - 额外材料原版价格之和。

---

## 第五步：构建 Recipe KV

格式参考 `item_recipe_shivas_guard_2`：

```kv
"item_recipe_<name>_2"
{
    // General
    //-------------------------------------------------------------------------------------------------------------
    "ID"                            "<新ID>"
    "Model"                         "models/props_gameplay/recipe.vmdl"
    "BaseClass"                     "item_recipe_<name>"
    "AbilityTextureName"            "item_recipe_<name>_2"
    "ItemCost"                      "<配方费用>"
    "ItemRecipe"                    "1"
    "ItemResult"                    "item_<name>_2"
    "ItemRequirements"
    {
        "01"                        "item_<name>;<extra_items>"
    }
}
```

**ID 分配规则**：

`npc_item_clone.txt` 专属 ID 段从 **6001** 开始，按以下规则分配：

**同系列物品**（`_2`、`_3` 等升级版本）：ID 连续 +1
```
item_recipe_xxx_2  →  6001
item_xxx_2         →  6002
item_recipe_xxx_3  →  6003
item_xxx_3         →  6004
```

**不同系列物品**：每个新系列从下一个 **×10 对齐** 的值开始（预留空间供同系列扩展）
```
item_recipe_xxx_2  →  6001   （第 1 个系列）
item_xxx_2         →  6002
item_recipe_yyy_2  →  6011   （第 2 个系列，从 6011 开始）
item_yyy_2         →  6012
item_recipe_zzz_2  →  6021   （第 3 个系列，从 6021 开始）
item_zzz_2         →  6022
```

分配步骤：
1. 读取 `npc_item_clone.txt` 中已有的所有 ID，确定当前最大已用系列编号
2. 新系列起始 ID = `6001 + 已有系列数 × 10`
3. 同系列内每增加一个物品对（recipe + 物品），在当前系列段内 +2

> 新建前 Grep 确认所选 ID 在所有 `npc_item*.txt` 文件中均未出现。已有其他文件占用的范围（3021–3099、9002–10335 等）均不与 6000 段冲突。

---

## 第六步：构建物品 KV（数值加强）

格式严格对照原版，**保持缩进格式完全一致**（tab 宽度、换行位置）。

必填字段：
- `"ID"` → 新分配 ID
- `"BaseClass"` → 原版物品名（如 `"item_shivas_guard"`）
- `"AbilityBehavior"` → 复制原版
- `"AbilityTextureName"` → `"item_<name>_2"`
- `"ItemCost"` → 计算新价格（= 原版价格 + 额外材料价格 + 配方费）
- 其他原版顶层字段（`AbilityCooldown`、`AbilityManaCost`、`FightRecapLevel`、
  `SpellDispellableType`、`AbilityCastRange`、`AbilityCastPoint`、
  `ItemShopTags`、`ItemQuality`、`ItemAliases`、`AbilitySharedCooldown` 等）→ 复制原版

**AbilityValues 数值加强规则**：
- **可成长属性**（伤害、护甲、属性加成、法力/生命回复、施法范围、范围等）→ × 2（取整，优先整数）
- **固定机制值**（冷却时间、施法时间、移速、减速百分比、持续时间、速度等）→ **不变**，复制原版
- 每个值右侧用 `//` 注释原版值（例：`"bonus_armor"   "30"   // 15`）

对于含子块的值（如 `aura_radius`），保留子块结构：
```kv
"aura_radius"
{
    "value"     "<2x值>"    // <原值>
    "affected_by_aoe_increase"  "1"
}
```

---

## 第七步：更新模式 — 同步原版

更新现有克隆物品时：
1. 从 `docs/reference/<version>/items.txt` 读取当前原版 KV
2. 删除克隆块中与原版**同值**的字段（BaseClass 会继承）
3. 补充原版新增但克隆块缺失的字段
4. 重新按加强规则校验 `AbilityValues`

---

## 第八步：图片提醒

检查图片文件是否存在：
```
game/resource/flash3/images/items/<name>_2.png
```
（注意：文件名去掉 `item_` 前缀，如 `shivas_guard_2.png`）

- 若**不存在** → 提醒用户：「请在 `game/resource/flash3/images/items/` 目录下创建 `<name>_2.png` 图片文件。`AbilityTextureName` 已设置为 `item_<name>_2`。」
- 若**已存在** → 无需提醒

---

## 第九步：本地化

### 9-A 定位原版本地化键

在 Dota 官方本地化文件中搜索原版物品的 Tooltip（如果存在）：
- `docs/reference/<version>/abilities_english.txt`（若含物品本地化）
- 或通过 Valve 物品 key 规则推断：`DOTA_Tooltip_Ability_item_<name>`

在项目本地化文件中搜索是否已有原版或克隆键：
```
Grep pattern: "item_<name>"
files: game/resource/addon_english.txt, game/resource/addon_schinese.txt
```

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

目标文件：`game/scripts/npc/npc_item_clone.txt`

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

同时在 `npc_items_custom.txt` 的顶层（若该文件用 `#include` 或引用机制）确认 `npc_item_clone.txt`
已被包含（若项目中有 `#include` 机制则添加；若无则跳过，后续手动配置）。

---

## 自检清单

- [ ] 原版物品 KV 已读取（recipe + 物品主块）
- [ ] ID 唯一，无冲突（4000+ 范围）
- [ ] Recipe 块：BaseClass = `item_recipe_<name>`，ItemResult = `item_<name>_2`，材料含原版物品
- [ ] 物品块：BaseClass = `item_<name>`，AbilityTextureName = `item_<name>_2`
- [ ] AbilityValues：可成长属性 × 2，固定机制值不变，每项附原版值注释
- [ ] ItemCost = 原版 + 额外材料 + 配方费之和
- [ ] 图片文件存在或已提醒用户创建
- [ ] addon_english.txt 和 addon_schinese.txt 已同步写入本地化键
- [ ] 本地化键名前缀与物品系统名完全匹配
- [ ] npc_item_clone.txt 格式正确（有文件头/尾，KV 块正确嵌套）
