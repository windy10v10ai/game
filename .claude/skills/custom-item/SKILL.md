---
name: custom-item
description: 从零自制新物品或合成神器，含 item_lua / item_datadriven 选型与物品属性性能。
---

# 自定义物品（从零自制）

`BaseClass` 是 `item_datadriven` / `item_lua` 的新物品与多材料合成神器。继承原版差分、数值倍率克隆走 `clone-item`。KV 格式、`#base`、ID 号段见 `game/scripts/npc/CLAUDE.md`，文案见 `game/resource/CLAUDE.md`。

## 1. 先查复用

判模式前自己对着 `../../references/vanilla-modifiers.md` 过一遍，命中就直接复用，后面的选型都不用走：

- 需求说「继承 / 参照 / 基于某个原版装备」→ 套那件装备的 modifier，字段名照抄它的 `AbilityValues`
- 通用状态（魔免、眩晕、禁锢、沉默、无敌、击退、定时死亡）→ 清单「通用状态」
- 与原版物品或技能的现成行为一致（溅射、减甲、反伤、缴械、位移、真视）→ 清单对应行

清单只收本仓已在用的。原版确有对应物品/技能而清单没有时，按该文件「表外的怎么找」查名再试；语义不符的原版 modifier 会连带它的其他行为一起生效，这种就自己写。

做法：自己 KV 里按**原版字段名**写值，`AddNewModifier` 时传自己的 ability，原版 modifier 就按这些值工作，连属性一起复用，不交回调税，数值只有一处、tooltip 直接 `%字段名`（范例 `item_magic_crit_blade` 的属性全部由 `modifier_item_devastator` 提供，自己 `Properties` 一条没有）。

字段名从 `docs/reference/<version>/items.txt` 逐条核对，下面三条踩中都不报错、只会数值悄悄不对：

1. **按需取用**：只写要的字段，不写的效果不生效。主动关掉某个子效果时可显式写 `0`
2. **写了就被套用**：自己的 `Properties` 再声明同名属性会双倍。模式 2 的镜像值（`bonus_health` 这类沿用原版字段名的）同样会被原版 modifier 读走
3. **多个原版共有字段各读一次**：复用两个以上原版 modifier 时先查它们 `AbilityValues` 的交集

字段冲突的处理（默认让原版提供，何时改名规避）与排查方法 → `references/datadriven-scope.md`「复用原版 modifier」。

## 2. 选模式

复用消化不掉的部分，只有两个模式：

|                 | 模式 1「DataDriven 主体」                          | 模式 2「TS 主体」                                              |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `BaseClass`     | `item_datadriven`                                  | `item_lua`                                                     |
| 属性住在        | 物品自己 KV 的 `Modifiers` → `Properties`          | `npc_items_modifier.txt` 里 `item_apply_modifiers` 的 `_stats` |
| 逻辑住在        | KV Actions；不够时 `RunScript` 调原生 Lua 全局函数 | `src/vscripts/items/ts_items/<name>.ts`                        |
| 数值真相源      | 一处                                               | 两处（真值 + tooltip 镜像值）                                  |
| modifier 清空   | 引擎自动                                           | 三处生命周期对齐（基类已实现）                                 |
| 类型检查 / jest | 无                                                 | 有                                                             |

先查 `references/datadriven-scope.md` 判断哪些部分 DataDriven 表达不了，再看表外部分的形态：

- 一段**动作**（造伤害、生成单位、挂原版 modifier、发金币、整理场上物品）→ 模式 1
- 一个**常驻 modifier**（`ABSORB_SPELL`、`PROCATTACK_FEEDBACK`、带记账的 `OnAttackLanded`、内置冷却、跨实例状态同步）→ 模式 2

判据是要不要写一个 modifier 类，不是行数。模式 1 的 Lua 里出现 `LinkLuaModifier` + `class({})` 就该走模式 2。`item_lua` + 手写 `class({})` 原生 Lua 是弃用写法：存量照原写法改，新物品不用。

**回调税**：Lua/TS modifier 的每个 `GetModifier*` 都是引擎每查一次回一次 Lua，单位越多越卡；DataDriven `Properties` 由引擎原生求值。所以数值常量属性（永久与限时 buff 都算）不写在 TS 里：模式 1 写自己 KV；模式 2 永久的写 `_stats`，限时 buff 写成完整 DataDriven modifier 由脚本 `ApplyItemDataDrivenModifier` 传 `duration`。`item_lua` 的 KV 不支持自己的 `Modifiers` 块，所以才有 `item_apply_modifiers`。

**镜像值**：`_stats` 的 `%value` 只能引 `item_apply_modifiers` 自己的 `AbilityValues`（键加 `<物品名>_` 前缀），物品 tooltip 引不到，于是物品自己的 `AbilityValues` 要再写一条 `xxx_tooltip`。改数值要手动同步两处。

完成：每个效果都已归到「复用原版」「模式内 KV」「表外脚本」之一。

## 3. modifier 的挂载与清空

清空责任跟着挂法走：

| 挂法                                      | 谁清空                                                                           | 用在        |
| ----------------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| 物品自己 KV 的 `Modifiers`                | 引擎，随物品得失                                                                 | 模式 1      |
| KV `ApplyModifier` + `Duration`           | 引擎，到期                                                                       | 模式 1 主动 |
| 脚本 `AddNewModifier` 带 duration         | 引擎，到期                                                                       | 两个模式    |
| 脚本 `AddNewModifier` 挂永久原版 modifier | 自己：在 DataDriven modifier 的 `OnCreated` / `OnDestroy` 里存句柄再 `Destroy()` | 模式 1      |
| `BaseItemModifier.vanillaModifierNames`   | 基类，按句柄精确销毁                                                             | 模式 2      |
| `item_apply_modifiers` 的 `_stats`        | `RefreshItemDataDrivenModifier`，基类三个生命周期已调                            | 模式 2      |

模式 1 的写法与多个原版 modifier 的批量记账 → `references/datadriven-scope.md`。

## 4. 写骨架

两个模式的 KV / TS 骨架与易踩的坑 → `references/mode-skeletons.md`。

## 5. 合成配方与 ID

```kv
"item_recipe_my_new_item"
{
    "BaseClass"          "item_datadriven"
    "Model"              "models/props_gameplay/recipe.vmdl"
    "AbilityTextureName" "item_recipe_my_new_item"
    "ItemCost"           "<图纸费用>"
    "ItemRecipe"         "1"
    "ItemResult"         "item_my_new_item"
    "ItemRequirements"
    {
        "01"             "item_a;item_b"   // 这条配方要 a 和 b 各一件
    }
}
```

- 每个 `"0N"` 是一条完整配方，行内 `;` 分隔的是这条配方的全部材料（AND），同一材料要两件就写两次；无属性的令牌材料（如 `item_fusion_agile`）排最后。写成一行一件材料就变成「任一件都能合成」
- 多条 `"0N"` 之间是 OR。默认只写 `"01"`，用户明确要求任意顺序都能合成时才写多条（如 `item_recipe_armlet_artifact`）
- `ItemCost` 按「材料总价 + 图纸费 = 物品总价」反推，数值找用户确认或参考同类神器
- `"ID"` 按 `game/scripts/npc/CLAUDE.md`「ID 分配」取所在文件号段的下一个数，写入后不再改
- 配方材料增删、可选材料的属性与主动技能要不要带进成品 → `references/recipe-changes.md`

## 6. 收尾

- KV 落点：普通自制物品 `npc_items_custom.txt`；神器系列 `npc_items_artifact.txt`；`_stats` 与独立 DataDriven modifier `npc_items_modifier.txt`（物品本体不放这里）
- 图标走 `add-image`；bot 会买 `/bot-item-build`，会用 `bot-item-usage`
- 改 KV 后重启 Dota Tools（`script_reload` 不重读 KV）；模式 1 的 Lua 改完 `script_reload` 即可
- 复用过原版 modifier 的物品，实机确认属性数值与 KV 一致：双倍是静默的，tooltip 显示的是 KV 值
- 实机验证按 `dota-live-test`「验物品与技能」：`-give` 发物品、`-stat` 核对属性、`-cast` + `-watch` 验主动

不明确时用 `AskUserQuestion` 问：表外部分是动作还是常驻 modifier；字段冲突让原版提供还是改名；某条属性是否表外（先查表）；合成材料、配方费、总价；是否多路径合成。
