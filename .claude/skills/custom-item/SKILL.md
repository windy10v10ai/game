---
name: custom-item
description: 从零自制全新自定义物品（BaseClass = item_datadriven / item_lua，含多材料合成神器）。复用原版 modifier、两模式选型「DataDriven 主体」与「TS 主体」、回调税与镜像值取舍、合成配方与 ID 分配。区别于 clone-item（原版倍率克隆）。当用户说「做一个新物品」「合成神器」「物品属性会不会卡顿」「item_lua 还是 item_datadriven」时触发。
---

# 自定义物品（从零自制）

| 场景 | skill |
| ---- | ---- |
| 继承原版物品差分、数值倍率克隆（`BaseClass` = 原版物品名） | `clone-item` |
| **从零自制**（`BaseClass` = `item_datadriven` / `item_lua`，含多材料合成神器） | **本 skill** |

> 图标、本地化、KV tab 缩进、`#base` 引入、参考文件路径 —— 全部见 CLAUDE.md「图片资源管理」「Dota 2 参考文件速查」与 `localization-format-guide`，本文不重复。

---

## 第一步：先查复用

判模式之前**自己**先对着 `../shared-references/vanilla-modifiers.md` 过一遍，命中就直接复用，整条选型链都不用走，**不用为此询问用户**：

- 需求里出现「继承 / 参照 / 基于某个原版装备」→ 直接套那件装备的 modifier，字段名照抄它的 `AbilityValues`
- 效果是通用状态（魔免、眩晕、禁锢、沉默、无敌、击退、定时死亡）→ 清单「通用状态」一节直接有
- 效果与某个原版物品或英雄技能的现成行为一致（溅射、减甲、反伤、缴械、位移、真视）→ 查清单对应行

清单只收录了本仓已在用的，**不是全集**。清单里没有但原版确实有对应物品/技能时，按该文件「表外的怎么找」查出 modifier 名再试，别直接转为自己实现。反过来也不要硬凑：语义不符的原版 modifier 会连带它自己的其它行为和属性一起生效，比自己写更难排查。

在自己 KV 里按**原版字段名**写值，`AddNewModifier` 时把自己的 ability 传进去，原版 modifier 就按这些值工作——它是引擎原生 C++，不交回调税，而且**连属性一起复用**。

`item_magic_crit_blade` 自己的 `Modifiers` 块里**一条 `Properties` 都没有**，智力 200 / 攻速 80 / 护甲 14 全部由 `modifier_item_devastator` 提供：

| 字段 | 原版 `item_devastator` | `item_magic_crit_blade` |
| --- | --- | --- |
| `bonus_intellect` | 40 | 200 |
| `bonus_attack_speed` | 40 | 80 |
| `int_damage_multiplier` | 0.75 | 1.25 |
| `active_mres_reduction` | 20 | 40 |

因此这条路径同时避开两个模式的主要代价：

| | 复用原版 modifier | 模式 1 自己写 `Properties` | 模式 2 下沉 `item_apply_modifiers` |
| --- | --- | --- | --- |
| 属性声明 | **不用写** | 要写 `Properties` | 要写 `_stats` |
| 数值真相源 | **物品自己 KV，一处** | 一处 | 两处（+镜像值） |
| tooltip | **直接 `%字段名`** | 直接引 | 要写 `_tooltip` 镜像 |
| 逻辑代码量 | **0** | Actions | TS |

仓库里 7 个物品这么做：`item_beast_armor`（刃甲）、`item_beast_shield`（永世法衣）、`item_hawkeye_turret`（黯灭）、`item_magic_crit_blade`（圣斧）、`item_magic_sword`（狂战斧 + 黯灭）、`item_forbidden_staff`（缚灵索）、`item_shadow_impact`（绝刃）。

### 三条机制规则

字段名从 `docs/reference/<version>/items.txt` 抄，**逐条核对**，这三条踩中都不会报错，只会数值悄悄不对：

1. **按需取用**——只写你要的字段。不写的字段对应效果就不生效，不必完整复制原版 `AbilityValues`。不想要某个子效果时，删掉 key 或填 `0` 都可以（`item_magic_sword` 把 `bonus_damage_per_kill` 等显式写 `0`，表达"知道有这个效果，主动关了"）。
2. **写了就一定被套用**——自己的 `Properties` **不要**再声明同名属性，否则原版 modifier 加一次、自己的 `Properties` 再加一次，**数值双倍**。
3. **多个原版共有字段会各读一次**——复用两个以上原版 modifier 时，先查它们 `AbilityValues` 的交集。落在交集里的字段会被每个 modifier 各加一次。

### 字段冲突了怎么办

**默认让原版提供**（保持原版字段名，自己不写 `Properties`）——行数最少，字段名自解释。`item_beast_armor` 的 `bonus_armor` 60 就是这么交给刃甲的。

命中下面任一条才**改名规避**（换个原版读不到的字段名，自己 `Properties` 提供）：

- 多个原版共有同名字段，必须拆开 —— `item_magic_sword` 复用狂战斧 + 黯灭，两者都有 `bonus_damage`，于是 KV 里不写这个字段，改用 `bonus_damage_passive` 由自己提供，两个原版都读不到
- 原版该字段值为 `0` 或明显是遗留字段 —— 随时可能在版本同步中被删掉，属性会静默消失
- 该数值属于本物品自己的一组属性，不想被原版行为左右 —— 如 `item_beast_armor` 的 `bonus_intellect_passive` 与 `bonus_strength` / `bonus_agility` 同属"全属性"三件套

改名会连带影响本地化：stat tooltip 的 key 是 `DOTA_Tooltip_ability_<物品名>_<字段名>`，字段改名后这一行也要改。

排查已有物品是否踩中规则 2、3 的方法 → `references/datadriven-scope.md`。

---

## 第二步：选模式

复用消化不掉的部分，**只有两个模式**。

| | 模式 1「**DataDriven 主体**」 | 模式 2「**TS 主体**」 |
| ---- | ---- | ---- |
| `BaseClass` | `item_datadriven` | `item_lua` |
| 属性住在 | 物品自己 KV 的 `Modifiers` → `Properties` | `item_apply_modifiers` 的 `_stats` |
| 逻辑住在 | KV 的 Actions 块；不够时 `RunScript` 调原生 Lua **全局函数** | `src/vscripts/items/ts_items/<name>.ts` |
| 数值真相源 | **一处** | 两处（真值 + 镜像值） |
| modifier 清空 | **引擎自动** | 三处生命周期手动对齐 |
| 类型检查 / jest | 无 | **有** |
| 仓库存量 | 18 纯 KV + 20 带 RunScript | 7 |

**唯一弃用的写法**：`item_lua` + 手写 `class({})` 原生 Lua（35 个存量）—— 既无类型又无声明式便利。存量不迁移，改动存量物品时按原写法继续，不顺手重构。

### 分界：表外的是「动作」还是「modifier」

先查 `references/datadriven-scope.md` 判断哪些部分 DataDriven 表达不了（查表，不要凭记忆）。表外的部分再看它是什么形态：

- 表外的是一段**动作**——造伤害、生成单位、挂个原版 modifier、发金币、整理场上物品 → **模式 1**，`RunScript` 写成 Lua 全局函数
- 表外的是一个**常驻 modifier**——`ABSORB_SPELL`、`PROCATTACK_FEEDBACK`、带记账的 `OnAttackLanded`、内置冷却、跨实例状态同步 → **模式 2**

**可检查的越界信号**：模式 1 的 Lua 文件里一旦出现 `LinkLuaModifier` + `class({})`，就已经掉进弃用写法了，该走模式 2。仓库 13 个样本无一例外——10 个纯全局函数的（11~179 行）都健康，3 个长出 `class({})` 的（`item_beast_armor` 195 行 / `item_hawkeye_turret` 256 行 / `item_magic_crit_blade` 193 行）正是当初该写成 TS 的。注意这三个越界的原因是**那个手写 modifier**，不是它们复用原版 —— 复用部分本身是干净的。

**行数不是判据**，`item_collector` 179 行全是全局函数，仍然是干净的模式 1。

### 回调税

Lua/TS modifier 的每个 `GetModifier*` 都是「引擎每查一次 → 回一次 Lua」。单位越多、查询越频繁越卡，这就是**回调税**。DataDriven `Properties` 由引擎原生求值，不交税。

所以**永久数值常量属性一律不写在 TS 里**：模式 1 写自己 KV，模式 2 下沉 `item_apply_modifiers`。项目里这些属性早已全量迁走（`npc_items_modifier.txt` 27 个 `_stats` 块），新物品照此办。

`item_lua` 的 KV **不支持**自己的 `Modifiers` 块（全仓 0 例），这正是 `item_apply_modifiers` 存在的原因，不是风格选择。

### 镜像值：模式 2 的代价

`item_apply_modifiers` 是一件谁也不持有的全局单例假物品，`_stats` 的 `%value` 只能引它自己的 `AbilityValues`（键须加 `<物品名>_` 前缀）。物品 tooltip 引不到那里，同一个数字因此要写两处：

```kv
// npc_items_modifier.txt → item_apply_modifiers 的 AbilityValues：真值
"item_saint_orb_bonus_all_stats"    "30"

// npc_items_custom.txt → item_saint_orb 自己的 AbilityValues：镜像值，只为 tooltip 显示
"bonus_all_stats_tooltip"           "30"
```

改数值必须手动同步两处，没有任何机制会报错。模式 1 没有这个问题——数值只有一处，tooltip 直接引同一个键。

---

## 第三步：modifier 的挂载与清空

**清空责任跟着挂法走**，挂法选错就要自己补记账。

| 挂法 | 谁负责清空 | 用在 |
| ---- | ---- | ---- |
| 物品自己 KV 的 `Modifiers` | **引擎**，随物品得失自动挂摘 | 模式 1 |
| KV `ApplyModifier` 挂原版 modifier + `Duration` | **引擎**，时限到期 | 模式 1 主动技能 |
| 脚本 `AddNewModifier` 挂**带 duration** 的 modifier | **引擎**，时限到期 | 两个模式 |
| 脚本 `AddNewModifier` 挂**永久**原版 modifier | **自己**，`ability.added_modifiers` 数组 + `OnDestroy` 遍历 `Destroy()` | 两个模式 |
| `item_apply_modifiers` 的 `_stats` | **`RefreshItemDataDrivenModifier`**，`OnCreated`/`OnRefresh`/`OnDestroy` 三处都要调 | **只有模式 2** |

**`item_apply_modifiers` 只属于模式 2**：27 个 `_stats` 对应的物品 100% 是 `item_lua`，没有一个 `item_datadriven`。模式 1 有自己的 `Modifiers` 块，不需要也不应该碰它。

模式 1 挂**永久**型原版 modifier 时，把 DataDriven modifier 自身的 `OnCreated` / `OnDestroy` 事件块当钩子用（范例 `item_beast_armor`）——这两个回调由引擎随物品得失触发，比自己判断时机可靠。多个原版 modifier 的批量记账写法 → `references/datadriven-scope.md`。

---

## 第四步：模式骨架

### 模式 1「DataDriven 主体」

数值与触发在同一个 KV 块内。范例 `item_wasp_despotic`（零脚本：`Random` / `ApplyModifier` / `RemoveModifier` / `FireSound` 串出概率暴击 + 主动增益）：

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

Actions 完整清单见 [Valve Wiki](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven#Actions)。KV 里也可以直接 `ApplyModifier` 一个原版 modifier（范例 `item_beast_shield` 的 `modifier_black_king_bar_immune`），不必先在自己的 `Modifiers` 块里声明。

**Actions 表达不了时接 RunScript**，Lua 放 `game/scripts/vscripts/items/<name>.lua`，只写全局函数：

```kv
"OnSpellStart"
{
    "RunScript" { "ScriptFile" "items/item_my_new_item"  "Function" "MyNewItemOnSpell" }
}
```

`RunScript` 的 `ScriptFile` 必须是原生 Lua——TSTL 产物是模块包装，函数不在文件全局作用域，仓库无先例。要写 TS 就走模式 2，不要试图让 RunScript 指向编译产物。

### 模式 2「TS 主体」

KV `BaseClass` = `item_lua`，`ScriptFile` 指向 `items/ts_items/<name>`；实现放 `src/vscripts/items/ts_items/`，物品本体继承 `BaseItem`、intrinsic modifier 继承 `BaseItemModifier`。范例 `item_saint_orb.ts`、`item_six_paths_reincarnation_gun.ts`：

```ts
import { BaseItem, registerAbility, registerModifier } from '../../utils/dota_ts_adapter';
import { BaseItemModifier } from './base_item_modifier';

@registerAbility('item_my_new_item')
export class ItemMyNewItem extends BaseItem {
  GetIntrinsicModifierName(): string {
    return 'modifier_item_my_new_item_passive';
  }
}

@registerModifier('items/ts_items/item_my_new_item', 'modifier_item_my_new_item_passive')
export class ModifierItemMyNewItemPassive extends BaseItemModifier {
  override statsModifierName = 'modifier_item_my_new_item_stats'; // 无永久属性时填 ''
  // 只手写 references/datadriven-scope.md 表外的逻辑
}
```

`BaseItemModifier` 已实现三个生命周期的 `_stats` 同步（按背包里该物品实例数对齐层数）。**override 这三个回调时必须调 `super.XXX()`**，否则属性静默失效。

物品若压根没有永久属性（消耗品 / 工具类，7 个 TS 物品有 4 个如此），`statsModifierName` 填 `''`，完全不碰 `item_apply_modifiers`。

**两个易踩的坑**：

- 物品新增的**可见** buff/debuff（`IsHidden()` 为 `false`）都要显式覆盖 `GetTexture()`，返回该物品的**系统注册名**（带 `item_` 前缀）。引擎据此找到物品 KV 的 `AbilityTextureName` 再定位实际 png，**不是**贴图文件名本身。
- `StartIntervalThink(interval)` 的**第一次** `OnIntervalThink` 立即触发，不是等一个 interval。「每隔 N 秒结算一次」的逻辑需要用标记跳过首次回调，否则创建瞬间就多结算一次。

---

## 第五步：合成配方与 ID

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
        "01"             "item_a;item_b"   // 该槽位 a 或 b 任一满足
        "02"             "item_c"
    }
}
```

- 每个 `"0N"` 是一个**槽位**（槽位之间 AND，全部满足才能合成），槽位内用 `;` 分隔的是**该槽位可选项**（OR）。OR 列表里若混有 `item_fusion_agile` 这类无属性纯令牌材料，习惯排在该槽位**最后**（参考 `item_recipe_ten_thousand_swords`），有数值的材料排前面。
- **多路径合成**（同一神器允许不同顺序的中间品拼出，如 `item_recipe_sacred_trident` 用 4 个槽位覆盖 3 种顺序）仅在用户明确要求"任意顺序都能合成"时才用，默认单一路径。
- `ItemCost`：按「材料总价 + 图纸费 = 物品总价」反推，具体数值找用户确认或参考同类神器定价。

### ID 分配

自制物品（非克隆）需要显式 `"ID"`。取 **`game/scripts/npc/npc_items*.txt` 全部文件**中 `"ID"` 的最大值 + 1 —— 各文件 ID 段互相交错（custom 3021 起、artifact 9623 起，同一段内混排），只扫一个文件会撞号。

```
Grep pattern: "ID"
files: game/scripts/npc/npc_items_*.txt
```

ID 一旦写入不要再改（项目内已有惯例注释："Do not change this once established"）。

### 配方材料变更时的属性取舍

多路径融合神器的成品属性通常是**固定值**，与走哪条路径无关（先例：`item_fusion_agile` 是无属性纯令牌，仅作合成条件）。当配方新增/替换某个可选材料时，不要默认「维持固定属性不变」或「把新材料全部数值直接合并进成品」，按材料投入成本用 `AskUserQuestion` 给 2~3 档让用户取舍：

- 廉价/限购令牌材料：不贡献属性，维持现状
- 高价值神器材料（数千至数万金）：其独有数值（伤害/护甲/生命回复等）完全丢弃显得浪费投入，可考虑追加一两条简单数值；但触发型机制（换血、连锁效果、主动单体增益等）通常不带入，否则成品堆叠过多机制
- 每档明确标注舍弃了哪些机制，不要自行拍板

若某个可选材料的**主动技能**要求继承到成品（而非丢弃），三处同步缺一不可：

1. KV：成品 `AbilityBehavior` 改为目标型，补齐 `AbilityUnitTarget*` / `AbilityCastRange`，以及该主动原有的充能 / 共享冷却机制
2. 脚本：把源材料的 `OnSpellStart` 逻辑搬到成品实现里（充能消耗判定也要改成检查成品自己的物品名）
3. bot 会用：除 `bot-item-usage` 的 ItemSpec 登记外，检查按物品名硬编码调用的文件——复用同一段技能逻辑**不会**让 bot 自动识别新物品，必须显式加一行

---

## 第六步：收尾

- **图标 / 本地化 / `#base` 引入新 KV 文件** → CLAUDE.md 与 `localization-format-guide`（物品同时有主动 + 被动时，两段 `<h1>` 之间用 `\n` 分隔，不要用 `<br><br>`）
- **KV 落点** → 普通自制物品 `npc_items_custom.txt`；龙珠/祝福等神器系列 `npc_items_artifact.txt`；`item_apply_modifiers` 的 `_stats` 与独立 DataDriven modifier `npc_items_modifier.txt`（**不放**物品本体）
- **bot 会买 / 会用** → `bot-item-build`（购买决策）、`bot-item-usage`（战斗使用）
- **验证** → 改 KV 后重启 Dota Tools（`script_reload` 不重读 KV）；模式 1 的 Lua 改完 `script_reload` 即可；模式 2 收尾跑一次 `npm run build:vscripts` 只看报错，不读编译产物，运行时行为靠 jest（自己的分支逻辑）+ Dota Tools 实跑
- **复用过原版 modifier 的物品**，实机确认属性数值与 KV 一致（双倍是静默的，tooltip 显示的是 KV 值，不是实际生效值）

## 不明确时询问

用 `AskUserQuestion` 菜单确认，不要自行假设：

- 模式选型：表外部分是「动作」还是「常驻 modifier」语义不明时
- 字段冲突用「让原版提供」还是「改名规避」，判据不唯一时
- 某条属性是否表外（先查 `references/datadriven-scope.md`，仍不确定才问）
- 合成材料、配方费用、物品总价
- 是否需要多路径合成
