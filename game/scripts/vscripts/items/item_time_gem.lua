if item_time_gem == nil then item_time_gem = class({}) end
LinkLuaModifier("modifier_item_time_gem", "items/item_time_gem", LUA_MODIFIER_MOTION_NONE)

function item_time_gem:GetIntrinsicModifierName()
    return "modifier_item_time_gem"
end

function item_time_gem:IsRefreshable()
    return false -- ✅ 防止被修补匠刷新
end

function item_time_gem:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()

    -- 刷新所有技能
    for i = 0, caster:GetAbilityCount() - 1 do
        local ability = caster:GetAbilityByIndex(i)
        if ability and ability:GetAbilityType() ~= ABILITY_TYPE_ATTRIBUTES and not self:IsAbitilyException(ability) then
            ability:RefreshCharges()
            ability:EndCooldown()
        end
    end

    -- 刷新物品(除了刷新球系列)
    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        RefreshItem(self, item, caster)
    end

    local itemTp = caster:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
    RefreshItem(self, itemTp, caster)

    -- 音效和特效
    caster:EmitSound("DOTA_Item.Refresher.Activate")

    local particle_cast = "particles/items2_fx/refresher.vpcf"
    local effect_cast = ParticleManager:CreateParticle(particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:ReleaseParticleIndex(effect_cast)

    -- 物品会自动进入冷却,因为定义文件中有 AbilityCooldown
end

function item_time_gem:IsAbitilyException(ability)
    local exceptions = {
        ["dazzle_good_juju"] = true,
    }
    return exceptions[ability:GetName()]
end

-- Modifier
if modifier_item_time_gem == nil then modifier_item_time_gem = class({}) end

function modifier_item_time_gem:IsHidden() return true end

function modifier_item_time_gem:IsPurgable() return false end

function modifier_item_time_gem:RemoveOnDeath() return false end

function modifier_item_time_gem:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_time_gem:OnCreated(params)
    local ability = self:GetAbility()
    if not ability then return end

    -- 缓存被动属性值
    self.bonus_all_stats = ability:GetSpecialValueFor("bonus_all_stats")
    self.bonus_health = ability:GetSpecialValueFor("bonus_health")
    self.bonus_mana = ability:GetSpecialValueFor("bonus_mana")
    self.bonus_health_regen = ability:GetSpecialValueFor("bonus_health_regen")
    self.bonus_mana_regen = ability:GetSpecialValueFor("bonus_mana_regen")

    -- Lua 逻辑需要的参数
    self.bonus_cooldown = ability:GetSpecialValueFor("bonus_cooldown")
    self.bonus_cooldown_stack = ability:GetSpecialValueFor("bonus_cooldown_stack")
    self.cast_range_bonus = ability:GetSpecialValueFor("cast_range_bonus")
    self.manacost_reduction = ability:GetSpecialValueFor("manacost_reduction")
    self.cast_speed_pct = ability:GetSpecialValueFor("cast_speed_pct")

    if IsServer() then
        for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
            mod:GetAbility():SetSecondaryCharges(_)
        end
    end
end

function modifier_item_time_gem:OnDestroy()
    -- 属性已迁移到 Lua modifier 实现
end

function modifier_item_time_gem:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_CAST_RANGE_BONUS,
        MODIFIER_PROPERTY_MANACOST_PERCENTAGE_STACKING,
        MODIFIER_PROPERTY_CASTTIME_PERCENTAGE,
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_MANA_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
    }
end

function modifier_item_time_gem:GetModifierBonusStats_Strength()
    return self.bonus_all_stats or 0
end

function modifier_item_time_gem:GetModifierBonusStats_Agility()
    return self.bonus_all_stats or 0
end

function modifier_item_time_gem:GetModifierBonusStats_Intellect()
    return self.bonus_all_stats or 0
end

function modifier_item_time_gem:GetModifierHealthBonus()
    return self.bonus_health or 0
end

function modifier_item_time_gem:GetModifierManaBonus()
    return self.bonus_mana or 0
end

function modifier_item_time_gem:GetModifierConstantHealthRegen()
    return self.bonus_health_regen or 0
end

function modifier_item_time_gem:GetModifierConstantManaRegen()
    return self.bonus_mana_regen or 0
end

function modifier_item_time_gem:GetModifierPercentageManacostStacking()
    return self.manacost_reduction or 0
end

function modifier_item_time_gem:GetModifierPercentageCasttime()
    return self.cast_speed_pct or 0
end

function modifier_item_time_gem:GetModifierPercentageCooldown()
    local parent = self:GetParent()
    if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
        if parent:HasModifier("modifier_item_octarine_core")
            or parent:HasModifier("modifier_item_arcane_octarine_core")
            or parent:HasModifier("modifier_item_refresh_core") then
            return self.bonus_cooldown_stack
        else
            return self.bonus_cooldown or 50
        end
    end
end

function modifier_item_time_gem:GetModifierCastRangeBonus()
    return self.cast_range_bonus or 0
end
