# 优化物品属性以减少卡顿 - 完整指南

## 概述

在 Dota 2 自定义游戏中，Lua 实现的 modifier 属性计算会在每帧执行，导致性能问题。通过将简单的静态属性从 Lua 迁移到 DataDriven (KV 文件) 实现，可以显著减少卡顿。

## 核心思路

对于**可能导致卡顿的属性**：

- ❌ **不要**在 Lua 中通过 `DeclareFunctions()` 和 `GetModifier*()` 实现
- ✅ **应该**在 `npc_items_modifier.txt` 的 `item_apply_modifiers` 中使用 DataDriven 方式实现
- ✅ 在 Lua 代码中**移除**这些已迁移的属性

## 示例分析：阿迪王 (item_adi_king)

### 1. 原始 Lua 实现（已优化后的代码）

**文件位置**: `game/scripts/vscripts/items/item_adi_king.lua`

```lua
-- modifier_item_adi_king 已经移除了 DeclareFunctions 中的静态属性
function modifier_item_adi_king:DeclareFunctions()
    return {}  -- 已清空，静态属性已迁移到 DataDriven
end

-- ✅ OnCreated 中必须调用 OnRefresh 来初始化 DataDriven modifier
function modifier_item_adi_king:OnCreated(keys)
    -- 重要：必须调用 OnRefresh 来应用 DataDriven modifier
    self:OnRefresh(keys)

    -- 注意：以下代码仅作示例，item_adi_king 实际不需要读取这些值
    -- 如果这些值仅用于 tooltip 显示，不需要在 Lua 中读取！
    -- tooltip 显示只需在 npc_items_custom.txt 的 AbilityValues 中定义即可
    if self:GetAbility() == nil then
        return
    end
    -- 这些值在 item_adi_king 中实际并未使用，可以删除
    -- 仅作示例：如果 Lua 逻辑需要这些值，才需要读取
    self.sp = self:GetAbility():GetSpecialValueFor("sp")       -- 60
    self.att = self:GetAbility():GetSpecialValueFor("att")     -- 30
    self.ar = self:GetAbility():GetSpecialValueFor("ar")       -- 10
    self.rate = self:GetAbility():GetSpecialValueFor("rate")   -- 25
    self.bonus_evasion = self:GetAbility():GetSpecialValueFor("bonus_evasion") -- 10
end

-- OnRefresh 和 OnDestroy 中调用 RefreshItemDataDrivenModifier
-- 用于刷新 DataDriven modifier
function modifier_item_adi_king:OnRefresh(keys)
    self.stats_modifier_name = "modifier_item_adi_king_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end
```

### 2. DataDriven 实现（优化方案）

**文件位置**: `game/scripts/npc/npc_items_modifier.txt`

```kv
"DOTAAbilities"
{
    "item_apply_modifiers"
    {
        "ID"                            "3001"
        "AbilityBehavior"               "DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE"
        "BaseClass"                     "item_datadriven"

        "ItemPurchasable"               "0"
        "ItemSellable"                  "0"

        "AbilityValues"
        {
            // 其他物品...
        }

        "Modifiers"
        {
            // 阿迪王的静态属性 modifier
            "modifier_item_adi_king_stats"
            {
                "Passive"               "1"
                "IsHidden"              "1"
                "RemoveOnDeath"         "0"

                // 多个阿迪王不可叠加
                "Attributes"            "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"

                "Properties"
                {
                    "MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT"    "60"   // sp
                    "MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE"      "30"   // att
                    "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS"        "10"   // ar
                    "MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE"        "25"   // rate
                    "MODIFIER_PROPERTY_EVASION_CONSTANT"            "10"   // bonus_evasion
                }
            }
        }
    }
}
```

### 3. 物品定义

**文件位置**: `game/scripts/npc/npc_items_custom.txt`

```kv
"item_adi_king"
{
    "ID"                                "3047"
    "BaseClass"                         "item_lua"
    "AbilityTextureName"                "item_adi_king"
    "ScriptFile"                        "items/item_adi_king"

    "AbilityValues"
    {
        // 静态属性值（已迁移到 item_apply_modifiers 的 DataDriven，仅用于 tooltip 显示）
        "sp"                    "60"    // tooltip only - 移动速度
        "att"                   "30"    // tooltip only - 攻击力
        "ar"                    "10"    // tooltip only - 护甲
        "rate"                  "25"    // tooltip only - 转身速率
        "bonus_evasion"         "10"    // tooltip only - 闪避

        // 主动技能的实际值（在 Lua 中实现）
        "active_sp"             "35"
        "active_evasion"        "10"
        "dur"                   "3"

        // 光环值（在 Lua 中实现）
        "aura_sp"               "5"
        "aura_rd"               "600"
    }
}
```

## 可优化的属性类型（从现有代码归纳）

**⚠️ 重要限制**：

- ✅ **只优化下面列表中的属性**
- ❌ **不在列表中的属性不要迁移到 DataDriven**
- ❌ **即使是静态值，如果不在列表中也不要迁移**

### 基础属性

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` - 力量加成
- `MODIFIER_PROPERTY_STATS_AGILITY_BONUS` - 敏捷加成
- `MODIFIER_PROPERTY_STATS_INTELLECT_BONUS` - 智力加成

### 攻击相关

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE` - 攻击力加成
- `MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` - 攻击速度加成（固定值）
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE` - 基础伤害加成百分比
- `MODIFIER_PROPERTY_ATTACK_RANGE_BONUS` - 攻击距离加成

### 防御相关

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS` - 物理护甲加成
- `MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS` - 魔法抗性加成
- `MODIFIER_PROPERTY_EVASION_CONSTANT` - 闪避率

### 移动相关

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` - 移动速度加成（固定值）
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE` - 移动速度加成百分比
- `MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE` - 移动速度加成（唯一）
- `MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE` - 绝对移动速度
- `MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE` - 转身速率百分比

### 生命/魔法相关

- `MODIFIER_PROPERTY_HEALTH_BONUS` - 生命值加成
- `MODIFIER_PROPERTY_MANA_BONUS` - 魔法值加成
- `MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT` - 生命恢复（固定值）
- `MODIFIER_PROPERTY_MANA_REGEN_CONSTANT` - 魔法恢复（固定值）

### 法术相关

- `MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE` - 法术增强百分比

## 优化步骤（标准流程）

### 第一步：识别需要优化的属性

**检查清单**：

1. ✅ 属性在**可优化的属性类型列表**中
2. ✅ 属性值是**静态的**（固定数值）
3. ✅ 属性没有**复杂逻辑**

**同时满足以上 3 个条件才能优化！**

在 Lua 文件中找到：

```lua
function modifier_item_xxx:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,  -- ✅ 可优化（在列表中 + 静态值）
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,    -- ✅ 可优化（在列表中 + 静态值）
        MODIFIER_PROPERTY_EVASION_CONSTANT,          -- ✅ 可优化（在列表中 + 静态值）
        MODIFIER_PROPERTY_SOME_CUSTOM_PROPERTY,      -- ❌ 不优化（不在列表中）
        -- ❌ 不要优化动态计算的属性（如需要根据条件变化的）
    }
end
```

### 第二步：在 npc_items_modifier.txt 中添加 DataDriven modifier

在 `item_apply_modifiers` 的 `Modifiers` 块中添加：

```kv
"modifier_item_xxx_stats"  // 命名规范：modifier_物品名_stats
{
    "Passive"               "1"       // 被动
    "IsHidden"              "1"       // 隐藏（不显示图标）
    "RemoveOnDeath"         "0"       // 死亡不移除

    // 属性配置
    "Attributes"            "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"
    // MODIFIER_ATTRIBUTE_MULTIPLE - 允许叠加（如果不希望叠加则移除此标志）

    "Properties"
    {
        "MODIFIER_PROPERTY_XXX"    "数值"
        // 或使用变量："%变量名"（在 AbilityValues 中定义）
    }
}
```

**Attributes 常用组合**：

- 可叠加物品：`MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE`
- 不可叠加物品：`MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE`

### 第三步：修改 Lua 代码

**🔑 重要优化原则**：

1. ✅ **不保留已删除函数的注释** - 直接删除，保持代码简洁，不要保留DeclareFunctions中已删除声明的注释
2. ✅ **移除 `SetSecondaryCharges` 逻辑** - `OnRefresh` 和 `OnDestroy` 中不需要充能数更新
3. ✅ **简化代码** - 只保留必要的 `RefreshItemDataDrivenModifier` 调用

#### 3.1 清空 DeclareFunctions（如果所有属性都迁移了）

```lua
function modifier_item_xxx:DeclareFunctions()
    return {}  -- 已迁移到 DataDriven
end
```

#### 3.2 添加 OnCreated、OnRefresh 和 OnDestroy 刷新逻辑

```lua
-- ✅ OnCreated 必须调用 OnRefresh 来初始化
function modifier_item_xxx:OnCreated(keys)
    -- 重要：调用 OnRefresh 来应用 DataDriven modifier
    self:OnRefresh(keys)

    -- 如果 Lua 逻辑需要使用属性值，在这里读取
    if self:GetAbility() == nil then
        return
    end
    -- 仅在 Lua 逻辑真正需要时才读取，tooltip 显示不需要
    self.some_value = self:GetAbility():GetSpecialValueFor("some_value")
end

-- ✅ OnRefresh 负责刷新 DataDriven modifier
function modifier_item_xxx:OnRefresh(keys)
    self.stats_modifier_name = "modifier_item_xxx_stats"

    if IsServer() then
        -- 刷新 DataDriven modifier
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

-- ✅ OnDestroy 负责清理 DataDriven modifier
function modifier_item_xxx:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end
```

#### 3.3 移除 GetModifier 函数和不必要的注释

```lua
-- 直接删除这些函数，不需要保留注释
-- 已删除：
// GetModifierMoveSpeedBonus_Constant()
// GetModifierPreAttack_BonusDamage()
// GetModifierPhysicalArmorBonus()
// GetModifierAttackSpeedBonus_Constant()
// GetModifierAttackRangeBonus()
// 等等...
```

### 第四步：清理不必要的属性读取

**重要提示**：

1. ✅ `OnCreated` 中**必须调用** `self:OnRefresh(keys)` 来初始化 DataDriven modifier
2. ❌ 如果属性值仅用于 tooltip 显示，**不需要**在 Lua 中读取

```lua
function modifier_item_xxx:OnCreated(keys)
    -- ✅ 必须：调用 OnRefresh 来应用 DataDriven modifier
    self:OnRefresh(keys)

    if self:GetAbility() == nil then
        return
    end

    -- ❌ 错误：如果仅用于 tooltip，不需要这样做
    -- self.sp = self:GetAbility():GetSpecialValueFor("sp")
    -- self.att = self:GetAbility():GetSpecialValueFor("att")

    -- ✅ 正确：只在 Lua 逻辑真正需要这些值时才读取
    -- 例如：主动技能的参数、动态计算的基础值等
    self.active_sp = self:GetAbility():GetSpecialValueFor("active_sp")  -- Lua 逻辑需要
end
```

**Tooltip 显示的正确做法**：

- 在 `npc_items_custom.txt` 的 `AbilityValues` 中定义值
- 游戏引擎会自动将 `AbilityValues` 中的值显示在 tooltip 中
- Lua 代码无需读取这些值（除非逻辑需要）

```kv
// npc_items_custom.txt
"item_xxx"
{
    "AbilityValues"
    {
        // 静态属性值（已迁移到 item_apply_modifiers 的 DataDriven，仅用于 tooltip 显示）
        "sp"        "60"    // tooltip only - 移动速度
        "att"       "30"    // tooltip only - 攻击力
    }
}
```

**重要**：为已迁移的属性添加 `// tooltip only` 注释，便于区分哪些值仅用于显示。

## 注意事项

### ✅ 适合优化的场景

**必须同时满足以下所有条件**：

1. ✅ **在可优化列表中**：属性必须存在于上面的"可优化的属性类型"列表中
2. ✅ **静态属性**：属性值固定，不需要动态计算
3. ✅ **简单属性**：直接返回数值，没有复杂逻辑
4. ✅ **频繁触发**：每帧都会计算的属性

### ❌ 不适合优化的场景

**任何一条满足就不要优化**：

1. ❌ **不在可优化列表中**：即使是静态值，只要属性不在列表中就不要迁移
2. ❌ **动态计算**：属性值需要根据条件变化（如：基于生命值百分比）
3. ❌ **复杂逻辑**：需要调用函数或检查状态
4. ❌ **主动技能效果**：临时 buff/debuff（如阿迪王的主动加速）
5. ❌ **光环效果**：Aura 相关的 modifier
6. ❌ **事件驱动**：需要响应游戏事件的属性
7. ❌ **特殊属性**：如 `MODIFIER_PROPERTY_PROCATTACK_FEEDBACK`（攻击触发）等

### 示例：保留在 Lua 中的动态属性

```lua
-- ✅ 应该保留在 Lua 中（动态计算）
function modifier_item_xxx_buff:GetModifierMoveSpeedBonus_Percentage()
    return self.active_sp  -- 临时 buff，有持续时间
end

-- ✅ 应该保留在 Lua 中（光环效果）
function modifier_item_xxx_aura:GetModifierMoveSpeedBonus_Percentage()
    return self.aura_sp  -- 光环效果，需要 Lua 实现
end

-- ❌ 不应该在 Lua 中（静态属性）
-- function modifier_item_xxx:GetModifierMoveSpeedBonus_Constant()
--     return 60  -- 应该迁移到 DataDriven
-- end
```

## 高级优化：临时 Debuff 的 DataDriven 实现

### 适用场景

对于**有持续时间的临时 debuff**（如主动技能施加的减速、致盲等），可以直接在 `npc_items_modifier.txt` 中定义完整的 DataDriven modifier，而不是使用 `_stats` 辅助 modifier。

### 关键区别

| 方案                              | 适用场景         | 实现方式                                                   |
| --------------------------------- | ---------------- | ---------------------------------------------------------- |
| **RefreshItemDataDrivenModifier** | 永久物品基础属性 | 使用 `_stats` 后缀的 modifier                              |
| **完整 DataDriven Modifier**      | 临时 debuff/buff | 直接定义完整 modifier，在 Lua 中通过 `AddNewModifier` 施加 |

### 示例：兽化甲减速 debuff

#### DataDriven 定义

```kv
"modifier_item_beast_armor_debuff"
{
    "Passive"   "0"      // 非被动
    "IsDebuff"  "1"

    "Properties"
    {
        "MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE"  "-40"
        "MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT"  "-40"
    }
}
```

#### Lua 使用

```lua
-- ❌ 不需要 LinkLuaModifier
-- ✅ 使用 ApplyItemDataDrivenModifier 添加
ApplyItemDataDrivenModifier(_, caster, enemy, "modifier_item_beast_armor_debuff", {
    duration = duration
})
```

### 示例：辉耀灼烧（DataDriven + RunScript）

```kv
"modifier_item_beast_armor_radiance_enemy_aura"
{
    "Properties"
    {
        "MODIFIER_PROPERTY_MISS_PERCENTAGE"  "17"  // 静态属性
    }

    "ThinkInterval"  "1.0"
    "OnIntervalThink"
    {
        "RunScript"
        {
            "Function"  "RadianceBurnDamage"  // Lua 函数处理伤害
        }
    }
}
```

### 优势对比

| 对比项     | 传统 Lua Modifier | 完整 DataDriven Modifier |
| ---------- | ----------------- | ------------------------ |
| **代码量** | ~50 行 Lua        | ~20 行 KV                |
| **性能**   | 每帧调用 Lua      | 引擎原生处理             |
| **维护性** | 代码分散          | 配置集中                 |
| **灵活性** | 完全灵活          | 静态属性 + RunScript     |

### 重要限制

⚠️ **无法在 DataDriven 中实现的功能**：

- `MODIFIER_PROPERTY_ABSORB_SPELL`（莲花格挡）- 必须用 Lua
- `OnTakeDamage` 的复杂伤害逻辑 - 必须用 Lua
- 需要维护状态的逻辑（如冷却时间管理）- 必须用 Lua

对于这些场景，仍需保持 `BaseClass = "item_lua"` 并使用 Lua modifier。

## 总结

通过将**静态属性**从 Lua 迁移到 DataDriven：

1. ✅ 显著减少每帧 Lua 调用次数
2. ✅ 降低 CPU 占用，减少卡顿
3. ✅ 保留 Lua 用于复杂逻辑和动态效果
4. ✅ 提升游戏整体性能

**优化原则**：

- 永久物品属性 → 使用 `RefreshItemDataDrivenModifier` + `_stats` modifier
- 临时 debuff/buff → 直接定义完整 DataDriven modifier
- 复杂逻辑 → DataDriven 调用 Lua 函数（`RunScript`）
- 特殊功能（如法术格挡）→ 必须保留 Lua modifier
