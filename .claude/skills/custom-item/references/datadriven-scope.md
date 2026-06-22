# DataDriven 可表达范围与 Lua 落点参考

供 `custom-item` 第一步「整体实现方式选型」与第二步「属性拆分」查表使用。

官方文档：https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

## 可迁移到 DataDriven `Properties` 的属性

只有以下属性可以直接写 KV `Properties`（无论物品本身是 `item_datadriven` 自带 `Modifiers`，还是 `item_lua` 挪进 `item_apply_modifiers` 的 `_stats` 子 modifier）：

**基础属性**
- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` / `_AGILITY_BONUS` / `_INTELLECT_BONUS`

**攻击相关**
- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE`、`MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT`
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE`、`MODIFIER_PROPERTY_ATTACK_RANGE_BONUS`

**防御相关**
- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS`、`MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS`、`MODIFIER_PROPERTY_EVASION_CONSTANT`

**移动相关**
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` / `_PERCENTAGE` / `_UNIQUE`、`MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE`、`MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE`

**生命/魔法相关**
- `MODIFIER_PROPERTY_HEALTH_BONUS`、`MODIFIER_PROPERTY_MANA_BONUS`
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT`、`MODIFIER_PROPERTY_MANA_REGEN_CONSTANT`

**法术相关**
- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE`

## 可用 `States` 块表达的状态

```kv
"States"
{
    "MODIFIER_STATE_ROOTED"     "MODIFIER_STATE_VALUE_ENABLED"
    "MODIFIER_STATE_DISARMED"   "MODIFIER_STATE_VALUE_ENABLED"
}
```

常用：`MODIFIER_STATE_ROOTED`（禁锢）、`DISARMED`（缴械）、`SILENCED`（沉默）、`MUTED`（锁闭）、`STUNNED`、`HEXED`、`INVISIBLE`、`INVULNERABLE`、`MAGIC_IMMUNE`、`FLYING`、`NO_HEALTH_BAR`、`NO_UNIT_COLLISION`、`ATTACK_IMMUNE`、`UNSELECTABLE`、`CANNOT_MISS`、`BLIND`。值：`MODIFIER_STATE_VALUE_ENABLED` / `_DISABLED`。

## 必须留在 Lua 的属性/逻辑

- `MODIFIER_PROPERTY_ABSORB_SPELL`（法术格挡，如莲花球）
- `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK`（攻击触发反馈）
- 需要动态计算的值（按生命百分比/层数/条件判断，DataDriven 静态 `%value` 表达不了）
- 光环中带逐帧判断逻辑、`OnTakeDamage` 等需要复杂分支的事件回调

## 复用 Dota 原生 modifier（无需任何虚拟物品）

```lua
-- OnCreated
caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})
-- OnDestroy
caster:RemoveModifierByName("modifier_item_eternal_shroud")
```

原生 modifier 自动从传入的 `ability` 读取它需要的 `AbilityValues` 字段（按原版字段名补全即可），不要在自己 KV 的 `Modifiers` 块里重复定义这个原生 modifier。

## `item_apply_modifiers` 共享 hub 的三类场景

`game/scripts/npc/npc_items_modifier.txt` 里的 `item_apply_modifiers`（`BaseClass item_datadriven`）是一个全局共享物品，专门用来存放各个 `item_lua` 物品「纯数值常量加成」部分的 DataDriven 定义，避免每个物品都要写一遍 Lua `GetModifier*`。

### A. 永久物品基础属性（绑定物品实例，最常见）

- 命名约定：`modifier_item_<name>_stats`，写进 `item_apply_modifiers` 的 `Modifiers` 块
- Lua/TS 物品的 intrinsic modifier 在 `OnCreated`（必须先调 `OnRefresh`）/`OnRefresh`/`OnDestroy` 里调用：
  ```lua
  RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
  ```
  TS 直接继承 `src/vscripts/items/ts_items/base_item_modifier.ts` 的 `BaseItemModifier`，只需声明 `statsModifierName` 字段，三个生命周期回调已实现。
- 该函数会按持有者背包里这个物品的**实例数**，自动同步 `_stats` modifier 的叠加层数（多件叠加用 `MODIFIER_ATTRIBUTE_MULTIPLE`）。
- `OnCreated` 里只读取 Lua **真正需要**的值（特殊逻辑用的），仅用于 tooltip 显示的值不要读，也不要在 Lua `DeclareFunctions()`/`GetModifier*()` 里保留已迁移属性的重复实现。

### B. 永久 BUFF（不绑定物品实例，例如消耗品永久赋予）

- 直接在 `npc_items_modifier.txt` 写完整 DataDriven modifier（不需要 `_stats` 后缀，也不需要 Lua modifier 类）
- 消耗物品的 Lua/TS 里调用：
  ```lua
  ApplyItemDataDrivenModifier(_, caster, target, "modifier_xxx", {})
  ```
- 参考：`item_tome_of_luoshu`、`item_ultimate_scepter_2`

### C. 临时 Buff / Debuff（有持续时间）

- 同样直接写完整 DataDriven modifier（`Properties` 为静态部分；需要逐帧效果时加 `ThinkInterval` + `OnIntervalThink` 的 `RunScript`）
- 用 `ApplyItemDataDrivenModifier` 附加到目标，并传入 `duration`

## 决策口诀

- 整个物品没有「必须 Lua」的逻辑 → `BaseClass = item_datadriven`，属性写自己 KV 的 `Modifiers`，不需要 hub
- 物品因为别的逻辑必须留 `item_lua`，但部分属性是纯数值常量 → 那部分属性进 `item_apply_modifiers` 的 `_stats`，Lua/TS 里只手写「表外」属性
- 不绑定物品实例的永久效果 → `ApplyItemDataDrivenModifier` + 完整 modifier
- 有持续时间的临时效果 → 完整 DataDriven modifier（+ `RunScript` 处理逐帧逻辑）
