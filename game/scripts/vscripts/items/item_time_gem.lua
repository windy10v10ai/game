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
        if ability and not ability:IsItem() and not self:IsAbitilyException(ability) then
            if ability:GetCooldownTimeRemaining() > 0 then
                ability:EndCooldown()
            end
        end
    end

    -- 刷新物品(除了刷新球系列)
    for i = 0, 8 do
        local item = caster:GetItemInSlot(i)
        self:RefreshItem(item, caster)
    end

    local itemTp = caster:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
    self:RefreshItem(itemTp, caster)

    -- 音效和特效
    caster:EmitSound("DOTA_Item.Refresher.Activate")

    local particle_cast = "particles/items2_fx/refresher.vpcf"
    local effect_cast = ParticleManager:CreateParticle(particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:ReleaseParticleIndex(effect_cast)

    -- 物品会自动进入冷却,因为定义文件中有 AbilityCooldown
end

function item_time_gem:RefreshItem(item, caster)
    if item and item:GetPurchaser() == caster then
        -- 防止刷新球系列物品互相刷新
        local share_cooldown_items = {
            ["item_refresher"] = true,
            ["item_refresher_shard"] = true,
            ["item_refresh_core"] = true,
            ["item_time_gem"] = true,
        }

        -- 如果是刷新球系列物品,直接返回,不刷新
        if share_cooldown_items[item:GetName()] then
            return
        end

        -- 刷新其他物品
        if item:IsRefreshable() then
            item:EndCooldown()
        end
    end
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

function modifier_item_time_gem:OnCreated()
    local ability = self:GetAbility()
    if ability then
        self.bonus_cooldown = ability:GetSpecialValueFor("bonus_cooldown")
        self.cast_range_bonus = ability:GetSpecialValueFor("cast_range_bonus")
        self.bonus_health = ability:GetSpecialValueFor("bonus_health")
        self.bonus_mana = ability:GetSpecialValueFor("bonus_mana")
        self.bonus_health_regen = ability:GetSpecialValueFor("bonus_health_regen")
        self.bonus_mana_regen = ability:GetSpecialValueFor("bonus_mana_regen")
        self.manacost_reduction = ability:GetSpecialValueFor("manacost_reduction") -- 新增
        self.cast_speed_pct = ability:GetSpecialValueFor("cast_speed_pct")
    end
end

function modifier_item_time_gem:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_CAST_RANGE_BONUS,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_MANA_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANACOST_PERCENTAGE_STACKING, -- 新增:减魔耗
        MODIFIER_PROPERTY_CASTTIME_PERCENTAGE,          -- 新增:减施法前摇
    }
end

function modifier_item_time_gem:GetModifierPercentageManacostStacking()
    --print("self.manacost_reduction")
    return (self.manacost_reduction or 0) -- 负值减少魔耗
end

function modifier_item_time_gem:GetModifierPercentageCasttime()
    return (self.cast_speed_pct or 0) -- 负值减少施法时间
end

function modifier_item_time_gem:GetModifierPercentageCooldown()
    -- 检查是否存在熔火核心
    if self:GetParent():HasModifier("modifier_item_refresh_core") then
        return 0
    end
    return self.bonus_cooldown or 50
end

function modifier_item_time_gem:GetModifierCastRangeBonus()
    return self.cast_range_bonus or 0
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
