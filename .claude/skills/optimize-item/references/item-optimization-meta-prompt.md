# Dota 2 自定义物品性能优化 Meta Prompt

本文档提供一个完整的 meta prompt,用于指导 AI 优化 Dota 2 自定义物品性能,将 Lua 实现迁移到 DataDriven 实现。

**官方文档**: https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

---

## Meta Prompt

你是一个 Dota 2 自定义游戏物品性能优化专家。你的任务是将基于 Lua 的物品实现优化为 DataDriven 实现,以减少游戏卡顿和提升性能。

### 核心优化原则

1. **BaseClass 迁移**: 将物品 `BaseClass` 从 `item_lua` 改为 `item_datadriven`
2. **属性 DataDriven 化**: 将静态属性从 Lua `GetModifier*()` 函数迁移到 DataDriven `Properties` 块
3. **最小化 Lua 代码**: 仅在 DataDriven 无法实现的功能时使用 Lua
4. **保持功能完整**: 优化后物品功能必须与优化前完全一致

### 实现方式优先级

优化物品时，按以下优先级选择实现方式：

**1. 优先 DataDriven** ⭐⭐⭐

- 静态属性加成 → 使用 `Properties` 块
- 状态控制 → 使用 `States` 块
- **主动技能逻辑 → 使用 `OnSpellStart` + DataDriven Actions (FireSound, ApplyModifier, Damage 等)**
- 特效音效 → 使用 `EffectName` (modifier 特效) + `FireSound` (音效)
- 事件触发 → 使用 DataDriven Events (`OnSpellStart`, `OnAttackLanded`, `OnTakeDamage` 等)

**2. 其次 Dota 2 原生 Modifier** ⭐⭐

- 复杂被动效果 → 复用原生 modifier（如 `modifier_item_eternal_shroud`）
- 在 Lua 的 OnCreated 中添加: `caster:AddNewModifier(caster, ability, "modifier_xxx", {})`
- 原生 modifier 自动从 `AbilityValues` 读取参数

**3. 最后 Lua Modifier** ⭐

- 仅在 DataDriven 和原生 modifier 都无法实现时使用
- 动态计算的属性（基于层数、生命值百分比等）
- 特殊功能（`MODIFIER_PROPERTY_ABSORB_SPELL` 等）
- 复杂的伤害计算和冷却管理

**优化目标**: 尽可能使用 DataDriven（性能最优）> 原生 modifier（次优）> Lua modifier（最差）

### 可使用 DataDriven 实现的属性列表

**⚠️ 重要**: 只有以下列表中的属性可以迁移到 DataDriven,不在列表中的属性必须保留在 Lua 中。

#### 基础属性

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` - 力量加成
- `MODIFIER_PROPERTY_STATS_AGILITY_BONUS` - 敏捷加成
- `MODIFIER_PROPERTY_STATS_INTELLECT_BONUS` - 智力加成

#### 攻击相关

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE` - 攻击力加成
- `MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` - 攻击速度加成(固定值)
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE` - 基础伤害加成百分比
- `MODIFIER_PROPERTY_ATTACK_RANGE_BONUS` - 攻击距离加成

#### 防御相关

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS` - 物理护甲加成
- `MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS` - 魔法抗性加成
- `MODIFIER_PROPERTY_EVASION_CONSTANT` - 闪避率

#### 移动相关

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` - 移动速度加成(固定值)
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE` - 移动速度加成百分比
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE` - 移动速度加成(唯一)
- `MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE` - 绝对移动速度
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE` - 转身速率百分比

#### 生命/魔法相关

- `MODIFIER_PROPERTY_HEALTH_BONUS` - 生命值加成
- `MODIFIER_PROPERTY_MANA_BONUS` - 魔法值加成
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT` - 生命恢复(固定值)
- `MODIFIER_PROPERTY_MANA_REGEN_CONSTANT` - 魔法恢复(固定值)

#### 法术相关

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE` - 法术增强百分比

### 可使用 DataDriven 实现的状态 (States)

DataDriven modifier 支持通过 `States` 块控制单位状态:

```kv
"States"
{
    "MODIFIER_STATE_ROOTED"     "MODIFIER_STATE_VALUE_ENABLED"
    "MODIFIER_STATE_DISARMED"   "MODIFIER_STATE_VALUE_ENABLED"
}
```

**常用状态列表**:

- `MODIFIER_STATE_ROOTED` - 禁锢（无法移动）
- `MODIFIER_STATE_DISARMED` - 缴械（无法攻击）
- `MODIFIER_STATE_SILENCED` - 沉默（无法施法）
- `MODIFIER_STATE_MUTED` - 锁闭（无法使用物品）
- `MODIFIER_STATE_STUNNED` - 眩晕
- `MODIFIER_STATE_HEXED` - 妖术
- `MODIFIER_STATE_INVISIBLE` - 隐身
- `MODIFIER_STATE_INVULNERABLE` - 无敌
- `MODIFIER_STATE_MAGIC_IMMUNE` - 魔法免疫
- `MODIFIER_STATE_FLYING` - 飞行
- `MODIFIER_STATE_NO_HEALTH_BAR` - 隐藏血条
- `MODIFIER_STATE_NO_UNIT_COLLISION` - 无视单位碰撞
- `MODIFIER_STATE_ATTACK_IMMUNE` - 攻击免疫
- `MODIFIER_STATE_UNSELECTABLE` - 无法选中
- `MODIFIER_STATE_CANNOT_MISS` - 攻击不会 Miss
- `MODIFIER_STATE_BLIND` - 致盲（攻击会 Miss）

**状态值**:

- `MODIFIER_STATE_VALUE_ENABLED` - 启用状态
- `MODIFIER_STATE_VALUE_DISABLED` - 禁用状态

### 必须使用 Lua 的特殊属性

以下 modifier 属性**无法**用 DataDriven 实现,必须使用 Lua:

- `MODIFIER_PROPERTY_ABSORB_SPELL` - 法术格挡(如莲花球)
- `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK` - 攻击触发反馈
- `MODIFIER_EVENT_ON_ATTACK_LANDED` - 攻击命中事件(需复杂逻辑时)
- `MODIFIER_EVENT_ON_TAKEDAMAGE` - 受伤事件(需复杂逻辑时)

### 复用原生 Modifier

对于复杂被动效果,优先考虑复用 Dota 2 原生 modifier,无需虚拟物品:

**直接添加原生 modifier**:

```lua
-- OnCreated 回调
caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})

-- OnDestroy 回调
caster:RemoveModifierByName("modifier_item_eternal_shroud")
```

**要点**:

- 原生 modifier 会从传入的 `ability` 读取 `AbilityValues`
- 在自定义物品的 `AbilityValues` 中添加原生 modifier 需要的参数
- 无需创建虚拟物品或 dummy item
- 不要在 DataDriven Modifiers 块中定义已有的原生 modifier

**示例**: 复用法师泳衣 (Eternal Shroud) 被动

```kv
"AbilityValues"
{
    // 自定义物品属性
    "bonus_strength"     "150"

    // Eternal Shroud modifier 需要的参数
    "mana_restore_pct"   "50"
    "stack_threshold"    "600"
    "stack_duration"     "10"
    "max_stacks"         "8"
    "stack_resist"       "4"
}
```

### 优化实施步骤

#### 步骤 1: 分析现有 Lua 实现

读取以下文件:

1. `game/scripts/vscripts/items/item_<物品名>.lua` - Lua 逻辑
2. `game/scripts/npc/npc_items_custom.txt` - 物品定义(搜索 `item_<物品名>`)

识别:

- ✅ 可以迁移到 DataDriven 的静态属性(在上述列表中)
- ❌ 必须保留在 Lua 中的复杂逻辑
- 🔍 主动技能逻辑
- 🔍 特殊被动效果(光环、反伤等)

#### 步骤 2: 修改 npc_items_custom.txt

**2.1 修改物品定义头部**

```kv
"item_<物品名>"
{
    "BaseClass"         "item_datadriven"  // 从 item_lua 改为 item_datadriven
    "ScriptFile"        "items/item_<物品名>"  // 保留 ScriptFile
    "ID"                "<物品ID>"
    "AbilityTextureName" "<贴图名>"
    // ... 其他属性

    "AbilityValues"
    {
        // 所有属性值(用于 tooltip 和 DataDriven 引用)
        "bonus_strength"    "100"
        "bonus_damage"      "50"
        // ... 其他值

        // Lua 逻辑专用参数
        "active_duration"   "5"     // Lua 逻辑需要
        "cooldown_time"     "15"    // Lua 逻辑需要
    }
}
```

**2.2 添加主动技能逻辑(如果有)**

⚠️ **重要**: 优先使用 DataDriven Actions,仅在无法实现时才使用 Lua。

**DataDriven Actions 优先** ⭐⭐⭐ (推荐)

```kv
"OnSpellStart"
{
    "FireSound"
    {
        "EffectName"    "DOTA_Item.HurricanePike.Activate"
        "Target"        "CASTER"
    }

    "ApplyModifier"
    {
        "ModifierName"  "modifier_item_<物品名>_active"
        "Target"        "CASTER"
        "Duration"      "%active_duration"
    }
}
```

完整 Actions 列表参考: https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven#Actions

#### 步骤 3: 重写 Lua 文件

**重要**:

- Lua 文件使用 **4 个空格**缩进,不使用 tab。
- **Lua 中组合 MODIFIER_ATTRIBUTE 必须使用 `+` 而不是 `|`**
  - 正确: `return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE + MODIFIER_ATTRIBUTE_MULTIPLE`
  - 错误: `return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE | MODIFIER_ATTRIBUTE_MULTIPLE`
  - 注意: KV 文件（DataDriven）中使用 `|` 是正确的

#### 步骤 4: 清理旧定义

如果优化前使用了 `RefreshItemDataDrivenModifier`，优化后需要删除 `npc_items_modifier.txt` 中的旧 modifier 定义。

### 代码模式总结

**优化前 (item_lua)**:

- Lua: 完整的 modifier class（大量 `GetModifier*()`）
- KV: 仅物品定义和 `AbilityValues`

**优化后 (item_datadriven)**:

- KV: 物品定义 + `Modifiers`（`Properties/States/OnSpellStart` 等）
- Lua: 最小化代码（回调 + 必要的特殊逻辑）

### 参考示例与注意事项

详见原文档中的完整示例（`item_hawkeye_turret`、`item_beast_armor` 等）与注意事项清单。

