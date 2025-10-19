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
        for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
            mod:GetAbility():SetSecondaryCharges(_)
        end
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
        // tooltip 显示值，实际值在 modifier_item_adi_king_stats 中
        "sp"                    "60"    // 移动速度
        "att"                   "30"    // 攻击力
        "ar"                    "10"    // 护甲
        "rate"                  "25"    // 转身速率
        "bonus_evasion"         "10"    // 闪避

        // 主动技能的实际值（仍在 Lua 中实现）
        "active_sp"             "35"    // 主动移动速度加成
        "active_evasion"        "10"    // 主动闪避
        "dur"                   "3"     // 主动持续时间

        // 光环值（仍在 Lua 中实现）
        "aura_sp"               "5"     // 光环移动速度
        "aura_rd"               "600"   // 光环范围
    }
}
```

## 可优化的属性类型（从现有代码归纳）

### 基础属性

- `MODIFIER_PROPERTY_STATS_STRENGTH_BONUS` - 力量加成
- `MODIFIER_PROPERTY_STATS_AGILITY_BONUS` - 敏捷加成
- `MODIFIER_PROPERTY_STATS_INTELLECT_BONUS` - 智力加成

### 攻击相关

- `MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE` - 攻击力加成
- `MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT` - 攻击速度加成（固定值）
- `MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE` - 基础伤害加成百分比

### 防御相关

- `MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS` - 物理护甲加成
- `MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS` - 魔法抗性加成
- `MODIFIER_PROPERTY_EVASION_CONSTANT` - 闪避率

### 移动相关

- `MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT` - 移动速度加成（固定值）
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

在 Lua 文件中找到：

```lua
function modifier_item_xxx:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,  -- ✅ 可优化（静态值）
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,    -- ✅ 可优化（静态值）
        MODIFIER_PROPERTY_EVASION_CONSTANT,          -- ✅ 可优化（静态值）
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

        -- 如果物品可以叠加，需要更新充能数
        for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
            mod:GetAbility():SetSecondaryCharges(_)
        end
    end
end

-- ✅ OnDestroy 负责清理 DataDriven modifier
function modifier_item_xxx:OnDestroy()
    if IsServer() then
        -- 同样的刷新逻辑
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
        for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
            mod:GetAbility():SetSecondaryCharges(_)
        end
    end
end
```

#### 3.3 移除 GetModifier 函数

```lua
-- ❌ 删除这些函数（已迁移到 DataDriven）
-- function modifier_item_xxx:GetModifierMoveSpeedBonus_Constant()
--     return self.sp
-- end
--
-- function modifier_item_xxx:GetModifierPreAttack_BonusDamage()
--     return self.att
-- end
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
        // 这些值会自动显示在 tooltip 中，无需 Lua 读取
        "sp"        "60"    // %sp% 在 tooltip 中可用
        "att"       "30"    // %att% 在 tooltip 中可用
    }
}
```

## 注意事项

### ✅ 适合优化的场景

1. **静态属性**：属性值固定，不需要动态计算
2. **简单属性**：直接返回数值，没有复杂逻辑
3. **频繁触发**：每帧都会计算的属性

### ❌ 不适合优化的场景

1. **动态计算**：属性值需要根据条件变化（如：基于生命值百分比）
2. **复杂逻辑**：需要调用函数或检查状态
3. **主动技能效果**：临时 buff/debuff（如阿迪王的主动加速）
4. **光环效果**：Aura 相关的 modifier
5. **事件驱动**：需要响应游戏事件的属性

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

## 性能对比

### Lua 实现

- ❌ 每帧调用 `GetModifier*()` 函数
- ❌ 需要 Lua 虚拟机调用开销
- ❌ 多个物品 = 多次函数调用

### DataDriven 实现

- ✅ C++ 层直接计算
- ✅ 无 Lua 调用开销
- ✅ 引擎优化的属性计算

## 实战案例汇总

### 案例 1：跳跳跳 (item_jump_jump_jump)

```kv
"modifier_item_jump_jump_jump_stats"
{
    "Properties"
    {
        "MODIFIER_PROPERTY_STATS_STRENGTH_BONUS"    "%item_jump_jump_jump_bonus_all_stats"  // 35
        "MODIFIER_PROPERTY_STATS_AGILITY_BONUS"     "%item_jump_jump_jump_bonus_all_stats"
        "MODIFIER_PROPERTY_STATS_INTELLECT_BONUS"   "%item_jump_jump_jump_bonus_all_stats"
    }
}
```

### 案例 2：圣者宝珠 (item_saint_orb)

```kv
"modifier_item_saint_orb_stats"
{
    "Properties"
    {
        "MODIFIER_PROPERTY_STATS_STRENGTH_BONUS"        "%item_saint_orb_bonus_all_stats"  // 30
        "MODIFIER_PROPERTY_STATS_AGILITY_BONUS"         "%item_saint_orb_bonus_all_stats"
        "MODIFIER_PROPERTY_STATS_INTELLECT_BONUS"       "%item_saint_orb_bonus_all_stats"
        "MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS"        "20"
        "MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT"       "20"
        "MODIFIER_PROPERTY_MANA_REGEN_CONSTANT"         "15"
        "MODIFIER_PROPERTY_MANA_BONUS"                  "500"
    }
}
```

### 案例 3：洛书 (item_tome_of_luoshu)

```kv
"modifier_item_tome_of_luoshu_stats"
{
    "Attributes"    "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"  // 不可叠加

    "Properties"
    {
        "MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE"        "50"
        "MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE"   "80"
    }
}
```

## 调试技巧

### 1. 验证 DataDriven modifier 是否生效

```lua
-- 在 Lua 控制台中
local hero = PlayerResource:GetSelectedHeroEntity(0)
for _, mod in pairs(hero:FindAllModifiers()) do
    print(mod:GetName())
end
-- 应该看到 "modifier_item_xxx_stats"
```

### 2. 检查属性是否正确应用

```lua
local hero = PlayerResource:GetSelectedHeroEntity(0)
print("移动速度:", hero:GetIdealSpeed())
print("攻击力:", hero:GetAverageTrueAttackDamage(nil))
print("护甲:", hero:GetPhysicalArmorValue(false))
```

### 3. RefreshItemDataDrivenModifier 的作用

该函数用于：

- 购买/出售物品时刷新 DataDriven modifier
- 确保多个相同物品的属性正确叠加/移除
- 同步物品数量和 modifier 数量

## 总结

通过将**静态属性**从 Lua 迁移到 DataDriven：

1. ✅ 显著减少每帧 Lua 调用次数
2. ✅ 降低 CPU 占用，减少卡顿
3. ✅ 保留 Lua 用于复杂逻辑和动态效果
4. ✅ 提升游戏整体性能

**优化原则**：静态用 DataDriven，动态用 Lua。
