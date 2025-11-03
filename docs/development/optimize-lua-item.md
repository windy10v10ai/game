# 优化物品属性以减少卡顿 - 完整指南

## 概述

在 Dota 2 自定义游戏中，Lua 实现的 modifier 属性计算会在每帧执行，导致性能问题。通过将简单的静态属性从 Lua 迁移到 DataDriven (KV 文件) 实现，可以显著减少卡顿。

## 核心思路

对于**可能导致卡顿的属性**：

- ❌ **不要**在 Lua 中通过 `DeclareFunctions()` 和 `GetModifier*()` 实现
- ✅ **应该**在 `npc_items_modifier.txt` 的 `item_apply_modifiers` 中使用 DataDriven 方式实现
- ✅ 在 Lua 代码中**移除**这些已迁移的属性

## 示例分析：阿迪王 (item_adi_king)

### 1. 优化后的 Lua 实现

```lua
function modifier_item_adi_king:DeclareFunctions()
    return {}  -- 已清空，静态属性已迁移到 DataDriven
end

function modifier_item_adi_king:OnCreated(keys)
    self:OnRefresh(keys)  -- 必须调用 OnRefresh 来应用 DataDriven modifier
    -- 仅在 Lua 逻辑真正需要时才读取属性值，tooltip 显示不需要
end

function modifier_item_adi_king:OnRefresh(keys)
    self.stats_modifier_name = "modifier_item_adi_king_stats"
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_adi_king:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end
```

### 2. DataDriven 实现

**文件位置**: `game/scripts/npc/npc_items_modifier.txt`

```kv
"DOTAAbilities"
{
    "item_apply_modifiers"
    {
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
                    "MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT"    "60"
                    "MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE"      "30"
                    "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS"        "10"
                    "MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE"        "25"
                    "MODIFIER_PROPERTY_EVASION_CONSTANT"            "10"
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
    "AbilityValues"
    {
        // tooltip only - 静态属性值（已迁移到 DataDriven，仅用于显示）
        "sp"                    "60"
        "att"                   "30"
        "ar"                    "10"

        // Lua 逻辑需要的值
        "active_sp"             "35"
        "dur"                   "3"
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

#### 3.2 添加刷新逻辑

```lua
function modifier_item_xxx:OnCreated(keys)
    self:OnRefresh(keys)  -- 必须调用
end

function modifier_item_xxx:OnRefresh(keys)
    self.stats_modifier_name = "modifier_item_xxx_stats"
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_xxx:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end
```

#### 3.3 移除 GetModifier 函数

直接删除所有已迁移属性的 `GetModifier*()` 函数，不要保留注释。

### 第四步：清理不必要的属性读取

**重要原则**：

1. ✅ `OnCreated` 中必须调用 `self:OnRefresh(keys)`
2. ❌ 仅用于 tooltip 显示的属性值不需要在 Lua 中读取
3. ✅ Tooltip 显示：在 `npc_items_custom.txt` 的 `AbilityValues` 中定义即可

```lua
function modifier_item_xxx:OnCreated(keys)
    self:OnRefresh(keys)
    -- 只在 Lua 逻辑真正需要时才读取值
    self.active_sp = self:GetAbility():GetSpecialValueFor("active_sp")  -- Lua 需要
    -- ❌ 不要读取仅用于 tooltip 的值：self.sp = ...
end
```

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

## 进阶优化：永久 BUFF 的完全 DataDriven 实现

### 适用场景

对于**消耗型物品产生的永久 BUFF**（不绑定物品实例），可以完全使用 DataDriven 实现，无需任何 Lua modifier 定义。

### 关键特点

- ✅ **不绑定物品**：BUFF 独立存在，不依赖物品实例
- ✅ **完全 DataDriven**：无需 Lua modifier 类定义
- ✅ **性能最优**：所有属性由引擎原生处理

### 示例：A杖2消耗后的属性 (item_ultimate_scepter_2_consumed)

#### 1. DataDriven 完整定义

**文件位置**: `game/scripts/npc/npc_items_modifier.txt`

```kv
"modifier_item_ultimate_scepter_2_consumed"
{
    "Passive"       "1"
    "IsHidden"      "0"
    "IsPurgable"    "0"
    "IsPermanent"   "1"
    "RemoveOnDeath" "0"
    "TextureName"   "item_ultimate_regalia"

    // 可叠加
    "Attributes"    "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"

    "Properties"
    {
        "MODIFIER_PROPERTY_HEALTH_BONUS"             "600"
        "MODIFIER_PROPERTY_MANA_BONUS"               "600"
        "MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE" "24"
    }
}
```

#### 2. Lua 使用方式

```lua
-- 直接使用 ApplyItemDataDrivenModifier 施加 modifier
ApplyItemDataDrivenModifier(_, caster, target, "modifier_item_ultimate_scepter_2_consumed", {})
```

#### 3. 与物品属性优化的区别

| 对比项         | 物品属性优化 (RefreshItemDataDrivenModifier) | 永久 BUFF 优化 (ApplyItemDataDrivenModifier) |
| -------------- | -------------------------------------------- | --------------------------------------------- |
| **适用场景**   | 绑定物品实例的属性                           | 不绑定物品的永久 BUFF                         |
| **Lua 定义**   | 需要 Lua modifier 类 + OnRefresh 逻辑       | 完全不需要 Lua modifier 类                    |
| **modifier 名** | 使用 `_stats` 后缀                           | 直接使用原 modifier 名                        |
| **典型例子**   | 阿迪王（物品属性）                           | A杖2消耗、洛书消耗                            |

### 优势总结

- **代码减少**：Lua 文件可减少 50+ 行代码
- **性能最优**：无任何 Lua 调用，纯引擎处理
- **维护简单**：所有配置集中在 KV 文件

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

- 永久物品属性（绑定物品） → 使用 `RefreshItemDataDrivenModifier` + `_stats` modifier
- 永久 BUFF（不绑定物品） → 使用 `ApplyItemDataDrivenModifier` + 完整 DataDriven modifier
- 临时 debuff/buff → 直接定义完整 DataDriven modifier
- 复杂逻辑 → DataDriven 调用 Lua 函数（`RunScript`）
- 特殊功能（如法术格挡）→ 必须保留 Lua modifier
