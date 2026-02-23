if item_swift_glove == nil then item_swift_glove = class({}) end
LinkLuaModifier("modifier_item_swift_glove", "items/item_swift_glove.lua", LUA_MODIFIER_MOTION_NONE)

function item_swift_glove:GetIntrinsicModifierName()
    return "modifier_item_swift_glove"
end

if modifier_item_swift_glove == nil then modifier_item_swift_glove = class({}) end

function modifier_item_swift_glove:IsHidden() return true end

function modifier_item_swift_glove:IsPurgable() return false end

function modifier_item_swift_glove:RemoveOnDeath() return false end

function modifier_item_swift_glove:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_swift_glove:OnCreated(params)
    local ability = self:GetAbility()
    if not ability then return end

    -- 缓存被动属性值
    self.bonus_strength = ability:GetSpecialValueFor("bonus_strength")
    self.bonus_agility = ability:GetSpecialValueFor("bonus_agility")
    self.bonus_intellect = ability:GetSpecialValueFor("bonus_intellect")
    self.bonus_attack_speed = ability:GetSpecialValueFor("bonus_attack_speed")
    self.bonus_movement_speed = ability:GetSpecialValueFor("bonus_movement_speed")

    -- Lua 逻辑需要的参数
    self.bat_reduction_pct = ability:GetSpecialValueFor("bat_reduction_pct")
    self.bonus_attack_range = ability:GetSpecialValueFor("bonus_attack_range")
end

function modifier_item_swift_glove:OnDestroy()
    -- 属性已迁移到 Lua modifier 实现
end

function modifier_item_swift_glove:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
    }
end

function modifier_item_swift_glove:GetModifierAttackRangeBonus()
    if self:GetParent():IsRangedAttacker() then
        return self.bonus_attack_range or 0
    end
    return 0
end

function modifier_item_swift_glove:GetModifierBaseAttackTimeConstant()
    if self.bat_check ~= true then
        self.bat_check = true
        local parent = self:GetParent()
        local current_bat = parent:GetBaseAttackTime()

        -- 手动计算百分比减少
        local bat_reduction_pct = self.bat_reduction_pct
        local new_bat = current_bat * (1 - bat_reduction_pct / 100)

        self.bat_check = false
        return new_bat
    end
end

function modifier_item_swift_glove:GetModifierBonusStats_Strength()
    return self.bonus_strength or 0
end

function modifier_item_swift_glove:GetModifierBonusStats_Agility()
    return self.bonus_agility or 0
end

function modifier_item_swift_glove:GetModifierBonusStats_Intellect()
    return self.bonus_intellect or 0
end

function modifier_item_swift_glove:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed or 0
end

function modifier_item_swift_glove:GetModifierMoveSpeedBonus_Constant()
    return self.bonus_movement_speed or 0
end

function modifier_item_swift_glove:GetModifierAttackRangeBonus()
    if self:GetParent():IsRangedAttacker() then
        return self:GetAbility():GetSpecialValueFor("bonus_attack_range")
    end
    return 0
end

function modifier_item_swift_glove:GetModifierBaseAttackTimeConstant()
    if self.bat_check ~= true then
        self.bat_check = true
        local parent = self:GetParent()
        local current_bat = parent:GetBaseAttackTime()

        -- 手动计算百分比减少
        local bat_reduction_pct = self.bat_reduction_pct
        local new_bat = current_bat * (1 - bat_reduction_pct / 100)

        self.bat_check = false
        return new_bat
    end
end

-- 在 modifier_item_swift_glove 中添加
function modifier_item_swift_glove:GetPriority()
    return MODIFIER_PRIORITY_HIGH -- 比鹰眼炮台更高的优先级
end
