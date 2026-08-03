# DataDriven 可表达范围与 `item_apply_modifiers` 用法

供 `custom-item` 第二步「选模式」查表使用。官方文档：https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

## 可写进 `Properties` 的属性

下列属性可直接写 KV `Properties`（模式 1 写物品自己的 `Modifiers`，模式 2 写 `item_apply_modifiers` 的 `_stats`）。**均为本仓已在用的**，出现次数取自 `npc_items_custom.txt` / `npc_items_artifact.txt` / `npc_items_modifier.txt`：

**基础属性**

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

**攻击相关**

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`、`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_ATTACK_RANGE_BONUS`
- `MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE`（暴击倍率；触发概率用 `Random` 事件块，见下）

**防御相关**

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`
- `MODIFIER_PROPERTY_EVASION_CONSTANT`、`MODIFIER_PROPERTY_MISS_PERCENTAGE`
- `MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE`

**移动相关**

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE` / `_UNIQUE`、`MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE`
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE`

**生命 / 魔法 / 视野**

- `MODIFIER_PROPERTY_HEALTH_BONUS`、`MODIFIER_PROPERTY_MANA_BONUS`
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT`、`MODIFIER_PROPERTY_MANA_REGEN_CONSTANT`
- `MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE`
- `MODIFIER_PROPERTY_BONUS_DAY_VISION`、`MODIFIER_PROPERTY_BONUS_NIGHT_VISION`

**法术相关**

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE`、`MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE`

表里没有的属性名不代表一定不行（DataDriven 支持面比这更宽），但**没有本仓先例**，先在 Dota Tools 验证再铺开。

## 可写进 `States` 的状态

```kv
"States"
{
    "MODIFIER_STATE_ROOTED"     "MODIFIER_STATE_VALUE_ENABLED"
    "MODIFIER_STATE_DISARMED"   "MODIFIER_STATE_VALUE_ENABLED"
}
```

常用：`ROOTED`（禁锢）、`DISARMED`（缴械）、`SILENCED`、`MUTED`、`STUNNED`、`HEXED`、`INVISIBLE`、`INVULNERABLE`、`MAGIC_IMMUNE`、`FLYING`、`FORCED_FLYING_VISION`、`NO_HEALTH_BAR`、`NO_UNIT_COLLISION`、`ATTACK_IMMUNE`、`UNSELECTABLE`、`CANNOT_MISS`、`BLIND`。值：`MODIFIER_STATE_VALUE_ENABLED` / `_DISABLED`。

## 声明式触发（不写脚本也能做的逻辑）

`Modifiers` 内的事件块（`OnAttackStart` / `OnAttackLanded` / `OnSpellStart` / `OnIntervalThink` …）配合 Actions 可以表达一整条概率触发链，无需任何脚本。范例 `item_wasp_despotic`：`OnAttackStart` 里 `RemoveModifier` 清上次结果 → `Random` 掷 `%crit_chance` → `OnSuccess` `ApplyModifier` 挂暴击 modifier → 命中后 `OnAttackLanded` 再 `RemoveModifier` 清掉。

判断「这条逻辑能不能纯 KV」时，先看它是不是能拆成「掷骰 → 挂/摘 modifier → 播音效/特效 → 造成伤害」这几步的组合。

## 必须留在脚本侧的部分

表外的部分按形态决定去哪个模式：

**「动作」型 → 模式 1 的 `RunScript` 全局函数**

- 一次性结算：造伤害、生成单位、发金币经验、播特效音效、整理场上实体
- 挂/摘一个原版 modifier（挂点用 DataDriven modifier 自身的 `OnCreated` / `OnDestroy` 事件块）
- 逐帧/定时的单步动作（`ThinkInterval` + `OnIntervalThink` 里 `RunScript` 结算一次伤害）

**「常驻 modifier」型 → 模式 2 的 TS**

- `MODIFIER_PROPERTY_ABSORB_SPELL`（法术格挡，如清莲宝珠）
- `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK`（攻击触发反馈）
- 需要**动态计算**的值（按生命百分比 / 层数 / 目标护甲 / 条件判断，静态 `%value` 表达不了）
- 带记账的事件回调：内置冷却计时、attack record 跟踪、`OnTakeDamage` 复杂分支
- 需要跨物品实例同步的状态（多件充能对齐等）

判据不是代码长度，是**要不要写一个 modifier 类**。模式 1 的 Lua 里一旦出现 `LinkLuaModifier` + `class({})`，就说明选错了模式。

## 复用原版 modifier：字段冲突排查

选型规则与三条机制规则见 SKILL.md 第一步，这里是查证手段。

**排查一个物品有没有踩中「同名字段双倍」**，两步对照：

1. 从 `docs/reference/<version>/items.txt` 取被复用原版物品的 `AbilityValues` 字段名（键在 4 层 tab 缩进下，按 3 层匹配会漏）
2. 取本物品 `Modifiers` → `Properties` 里 `%xxx` 引用的字段名

两者交集非空 = 该属性被原版 modifier 加一次、自己的 `Properties` 再加一次。复用两个以上原版时，还要取那几个原版彼此的字段交集，落在里面的字段会被各读一次。

已核对的先例：`item_beast_shield` / `item_hawkeye_turret` / `item_magic_crit_blade` / `item_forbidden_staff` / `item_shadow_impact` 交集为空；`item_magic_sword` 用 `bonus_damage_passive` 规避了狂战斧与黯灭共有的 `bonus_damage`；`item_beast_armor` 曾在 `bonus_damage` / `bonus_intellect` 上双倍，已改名修正。

**永久型原版 modifier 的挂/摘**：

```lua
-- OnCreated
caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})
-- OnDestroy
caster:RemoveModifierByName("modifier_item_eternal_shroud")
```

不要在自己 KV 的 `Modifiers` 块里重复定义这个原版 modifier。

**同时合并多个原版 modifier 时**，`RemoveModifierByName` 得逐个手写名字，不够通用；改用 `ability` 上挂一个数组记录句柄，`OnDestroy` 统一遍历 `Destroy()`：

```lua
-- OnCreated
local m1 = caster:AddNewModifier(caster, ability, "modifier_item_devastator", {})
local m2 = caster:AddNewModifier(caster, ability, "modifier_item_xxx", {})
ability.added_modifiers = ability.added_modifiers or {}
if m1 then table.insert(ability.added_modifiers, m1) end
if m2 then table.insert(ability.added_modifiers, m2) end

-- OnDestroy
for _, modifier in pairs(ability.added_modifiers or {}) do
    if modifier and not modifier:IsNull() then
        modifier:Destroy()
    end
end
ability.added_modifiers = nil
```

范例：`item_magic_crit_blade.lua`（合并 `modifier_item_devastator`）、`item_beast_armor.lua`（合并 `modifier_item_blade_mail`）。

## `item_apply_modifiers` 的三类场景

`game/scripts/npc/npc_items_modifier.txt` 里的 `item_apply_modifiers`（`BaseClass item_datadriven`）是全局单例物品，存放 `item_lua` 物品「纯数值常量加成」部分的 DataDriven 定义 —— 因为 `item_lua` 的 KV 不支持自己的 `Modifiers` 块。

**只服务模式 2**：27 个 `_stats` 对应的物品 100% 是 `item_lua`。模式 1 的属性写在物品自己的 `Modifiers` 块里，不碰这里。

### A. 永久物品基础属性（绑定物品实例，最常见）

- 命名 `modifier_item_<name>_stats`，写进 `item_apply_modifiers` 的 `Modifiers` 块
- 数值真值写进 `item_apply_modifiers` 自己的 `AbilityValues`，键须加 `<物品名>_` 前缀（如 `item_saint_orb_bonus_all_stats`），`Properties` 用 `%<前缀键>` 引用；物品自己的 `AbilityValues` 再补一条 `xxx_tooltip` **镜像值**供 tooltip 显示
- TS：继承 `src/vscripts/items/ts_items/base_item_modifier.ts` 的 `BaseItemModifier`，只声明 `statsModifierName`，三个生命周期回调已实现
- 存量原生 Lua：`OnCreated`（必须先调 `OnRefresh`）/ `OnRefresh` / `OnDestroy` 三处都调
  ```lua
  RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
  ```
  首参 `_` 是 TSTL 编译产物的隐式 context 参数，Lua 侧必须占位；TS 侧调用不写这一参
- 该函数按持有者背包里这个物品的**实例数**自动对齐 `_stats` 的叠加层数（多件叠加需 `MODIFIER_ATTRIBUTE_MULTIPLE`）
- `OnCreated` 里只读脚本**真正要用**的值；仅供 tooltip 显示的值不要读，也不要在 `DeclareFunctions()` / `GetModifier*()` 里保留已下沉属性的重复实现

### B. 永久 BUFF（不绑定物品实例，例如消耗品永久赋予）

- 直接在 `npc_items_modifier.txt` 写完整 DataDriven modifier（不需要 `_stats` 后缀，也不需要脚本侧 modifier 类）
- 消耗物品的脚本里调用：
  ```lua
  ApplyItemDataDrivenModifier(_, caster, target, "modifier_xxx", {})
  ```
- 参考：`item_tome_of_luoshu`、`item_ultimate_scepter_2`

### C. 临时 Buff / Debuff（有持续时间）

- 同样写完整 DataDriven modifier（`Properties` 放静态部分；需要逐帧效果时加 `ThinkInterval` + `OnIntervalThink` 的 `RunScript`）
- 用 `ApplyItemDataDrivenModifier` 附加到目标并传入 `duration`

## 决策口诀

- 表外部分是**动作** → 模式 1，`RunScript` 调 Lua 全局函数，属性仍写自己 KV，**不碰 `item_apply_modifiers`**，数值只有一处
- 表外部分是**常驻 modifier** → 模式 2，纯数值常量属性下沉 `item_apply_modifiers` 的 `_stats`，TS 只手写表外那部分
- 模式 2 但没有永久属性（消耗品 / 工具类）→ `statsModifierName = ''`，同样不碰 `item_apply_modifiers`
- 想消掉表外部分 → 先看有没有原版 modifier 能复用，能复用就退回模式 1
- 不绑定物品实例的永久效果 → `ApplyItemDataDrivenModifier` + 完整 modifier
- 有持续时间的临时效果 → 完整 DataDriven modifier（+ `RunScript` 处理逐帧逻辑）
