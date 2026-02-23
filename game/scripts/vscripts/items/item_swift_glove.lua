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
    self:OnRefresh(params)

    local ability = self:GetAbility()
    self.bat_reduction_pct = ability:GetSpecialValueFor("bat_reduction_pct")
end

function modifier_item_swift_glove:OnRefresh(params)
    self.stats_modifier_name = "modifier_item_swift_glove_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_swift_glove:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_swift_glove:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
    }
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
