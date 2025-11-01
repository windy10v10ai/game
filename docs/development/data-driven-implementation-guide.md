# DataDriven 实现指南

## 概述

本文档记录了将传统 Lua modifier 迁移到 DataDriven 实现的经验和最佳实践，以 item_magic_sword 为例。

官方文档: https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Scripting/Abilities_Data_Driven

## 核心概念

### DataDriven vs Lua Modifier

| 特性     | DataDriven     | Lua Modifier |
| -------- | -------------- | ------------ |
| 性能     | 更优           | 较差         |
| 维护性   | 配置化         | 代码化       |
| 灵活性   | 有限           | 完全灵活     |
| 适用场景 | 简单属性、事件 | 复杂逻辑     |

### 混合架构原则

- **DataDriven 处理**：简单属性、modifier 管理、事件触发
- **Lua 处理**：复杂逻辑、伤害计算、特效管理

## 实现步骤

### 1. 分析现有功能

以 item_magic_sword 为例：

**原始功能**：

- 被动属性加成（攻击力、全属性）
- 溅射伤害
- 攻击减速
- 主动技能（物理转纯粹伤害）

**分类**：

- ✅ **DataDriven 适合**：属性加成、减速 debuff、modifier 管理
- ⚠️ **需要 Lua**：溅射伤害、纯粹伤害计算

### 2. DataDriven 配置结构

`kv
"item_magic_sword"
{
"BaseClass" "item_datadriven"
"ID" "10328"
"AbilityTextureName" "moyuanjian"
"AbilityBehavior" "DOTA_ABILITY_BEHAVIOR_NO_TARGET | DOTA_ABILITY_BEHAVIOR_IMMEDIATE"

    // 技能参数
    "AbilityValues"
    {
        "active_duration"       "6"
        "convert_pct"           "15"
        "bonus_all_stats"       "80"
        "bonus_damage"          "300"
        "cleave_distance"       "600"
        "cleave_damage_percent" "100"
        "slow_duration"         "2.0"
        "slow_pct"              "-60"
    }

    // 技能事件
    "OnSpellStart"
    {
        "ApplyModifier"
        {
            "Target"            "CASTER"
            "ModifierName"      "modifier_item_magic_sword_active"
            "Duration"          "%active_duration"
        }
        "RunScript"
        {
            "ScriptFile"        "items/item_magic_sword"
            "Function"          "MagicSwordOnSpellStart"
        }
    }

    // Modifier 定义
    "Modifiers"
    {
        "modifier_item_magic_sword_stats"
        {
            "Passive"           "1"
            "IsHidden"          "1"
            "Attributes"        "MODIFIER_ATTRIBUTE_PERMANENT | MODIFIER_ATTRIBUTE_MULTIPLE | MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE"

            "Properties"
            {
                "MODIFIER_PROPERTY_STATS_STRENGTH_BONUS"      "%bonus_all_stats"
                "MODIFIER_PROPERTY_STATS_AGILITY_BONUS"       "%bonus_all_stats"
                "MODIFIER_PROPERTY_STATS_INTELLECT_BONUS"     "%bonus_all_stats"
                "MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE"    "%bonus_damage"
            }

            "OnAttackLanded"
            {
                "RunScript"
                {
                    "ScriptFile"    "items/item_magic_sword"
                    "Function"      "MagicSwordCleaveEffect"
                }
                "ApplyModifier"
                {
                    "Target"        "TARGET"
                    "ModifierName"  "modifier_item_magic_sword_debuff"
                    "Duration"      "%slow_duration"
                }
            }
        }

        "modifier_item_magic_sword_active"
        {
            "IsBuff"            "1"
            "IsPurgable"        "0"
            "TextureName"       "item_magic_sword"

            "OnCreated"
            {
                "RunScript"
                {
                    "ScriptFile"    "items/item_magic_sword"
                    "Function"      "MagicSwordActiveOnCreated"
                }
            }

            "OnAttackLanded"
            {
                "RunScript"
                {
                    "ScriptFile"    "items/item_magic_sword"
                    "Function"      "MagicSwordActiveOnAttackLanded"
                }
            }
        }

        "modifier_item_magic_sword_debuff"
        {
            "IsDebuff"          "1"
            "IsPurgable"        "1"
            "TextureName"        "item_magic_sword"

            "Properties"
            {
                "MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE" "%slow_pct"
            }
        }
    }

}
`

### 3. Lua 函数实现

`lua
-- 主动技能音效
function MagicSwordOnSpellStart(keys)
local caster = keys.caster
EmitSoundOn("Hero_Juggernaut.BladeFury", caster)
end

-- 主动效果特效
function MagicSwordActiveOnCreated(keys)
if not IsServer() then return end

    local parent = keys.caster
    local ability = keys.ability

    local fx = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_juggernaut/juggernaut_blade_fury.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        parent
    )
    ParticleManager:ReleaseParticleIndex(fx)

end

-- 溅射效果
function MagicSwordCleaveEffect(params)
if not IsServer() then return end
if not params.attacker:IsRealHero() then return end
if params.attacker:IsRangedAttacker() then return end
if params.attacker:GetTeam() == params.target:GetTeam() then return end

    local ability = params.ability
    if not ability then return end

    local cleave_distance = ability:GetSpecialValueFor("cleave_distance")
    local cleave_damage_percent = ability:GetSpecialValueFor("cleave_damage_percent")
    local cleave_damage_percent_creep = ability:GetSpecialValueFor("cleave_damage_percent_creep")
    local target_loc = params.target:GetAbsOrigin()

    local enemies = FindUnitsInRadius(
        params.attacker:GetTeamNumber(),
        target_loc,
        nil,
        cleave_distance,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)

    for _, enemy in pairs(enemies) do
        if enemy ~= params.target then
            local damage_percent = enemy:IsCreep() and cleave_damage_percent_creep or cleave_damage_percent
            local cleave_damage = attacker_damage * damage_percent / 100

            ApplyDamage({
                victim = enemy,
                attacker = params.attacker,
                damage = cleave_damage,
                damage_type = DAMAGE_TYPE_PHYSICAL,
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability = ability,
            })
        end
    end

end

-- 纯粹伤害处理
function MagicSwordActiveOnAttackLanded(params)
if not IsServer() then return end

    if params.attacker ~= params.caster then return end

    local ability = params.ability
    if not ability then return end

    local convert_pct = ability:GetSpecialValueFor("convert_pct")

    local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)
    local actual_damage = CalculateActualDamage(attacker_damage, params.target)
    local pure_damage = actual_damage * convert_pct / 100

    ApplyDamage({
        victim = params.target,
        attacker = params.attacker,
        damage = pure_damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })

    SendOverheadEventMessage(nil, OVERHEAD_ALERT_DAMAGE, params.target, actual_damage + pure_damage, nil)

end
`

## 关键经验

### 1. 事件选择

**OnAttackLanded vs OnTakeDamage**：

- OnAttackLanded：攻击命中时触发，适合攻击相关效果
- OnTakeDamage：受到伤害后触发，适合伤害处理

**选择原则**：

- 攻击效果 → OnAttackLanded
- 伤害处理 → OnTakeDamage

### 2. 参数传递

**DataDriven 事件参数**：

- keys.caster - 施法者
- keys.ability - 技能
- params.attacker - 攻击者
- params.target - 目标
- params.damage - 伤害值

### 3. Modifier 管理

**完全 DataDriven 化**：

- 移除所有 LinkLuaModifier 调用
- 移除 Lua modifier 类定义
- 使用 ApplyModifier 添加 modifier

**光环 Modifier 命名规范**：

- 光环效果必须以 `_aura` 结尾

示例：

```
"modifier_item_radiance"  // 光环发射器
{
    "Aura"  "modifier_item_radiance_enemy_aura"  // 光环效果
    ...
}

"modifier_item_radiance_enemy_aura"  // 被 aura 应用的光环效果
{
    "Properties"
    {
        "MODIFIER_PROPERTY_MISS_PERCENTAGE"  "%aura_miss_percentage"
    }
}
```

### 4. 伤害计算优化

**精确伤害计算**：
`lua
-- 获取攻击者真实攻击力
local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)

-- 计算实际伤害（考虑护甲）
local actual_damage = CalculateActualDamage(attacker_damage, params.target)
`

### 5. 特效管理

**特效生命周期**：

- OnCreated - 添加持续特效
- OnDestroy - 释放一次性特效

## 最佳实践

### 1. 代码组织

- **DataDriven**：配置、属性、简单事件
- **Lua**：复杂逻辑、计算、特效

### 2. 性能优化

- 优先使用 DataDriven 属性
- 减少 Lua 函数调用
- 合理使用 IsServer() 检查

### 3. 维护性

- 参数统一在 AbilityValues 中定义
- 使用有意义的函数名
- 添加适当的注释

### 4. 调试技巧

`lua
-- 调试参数结构
print("FunctionName")
PrintTable(params)
`

## 常见问题

### 1. Modifier 不生效

**检查项**：

- DataDriven 配置是否正确
- ApplyModifier 参数是否正确
- Lua 函数是否存在

### 2. 事件不触发

**检查项**：

- 事件名称是否正确
- 函数参数是否匹配
- IsServer() 检查

### 3. 伤害计算错误

**检查项**：

- 使用正确的伤害计算函数
- 参数传递是否正确
- 伤害类型是否匹配

## 总结

DataDriven + Lua 混合架构提供了最佳的性能和维护性平衡：

- **DataDriven** 处理简单、重复性的功能
- **Lua** 处理复杂、需要灵活性的逻辑
- 两者结合实现高效、可维护的代码

通过合理的架构设计，可以显著提升代码性能和开发效率。
