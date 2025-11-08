LinkLuaModifier("modifier_item_withered_spring", "items/item_withered_spring", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_withered_spring_active", "items/item_withered_spring", LUA_MODIFIER_MOTION_NONE)

item_withered_spring = class({})

function item_withered_spring:GetIntrinsicModifierName()
    return "modifier_item_withered_spring"
end

function item_withered_spring:OnSpellStart()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    -- 回血 音效
    caster:EmitSound("Item.GuardianGreaves.Activate")

    -- 永恒之盘触发音效
    caster:EmitSound("DOTA_Item.AeonDisk.Activate")

    -- 添加主动buff
    caster:AddNewModifier(caster, self, "modifier_item_withered_spring_active", { duration = duration })

    -- 驱散负面效果
    caster:Purge(false, true, false, true, true)

    -- 立即恢复生命值
    local instant_heal = self:GetSpecialValueFor("instant_heal")
    caster:Heal(instant_heal, self)

    -- 永恒之盘触发特效 - 护盾爆发效果
    local particle = ParticleManager:CreateParticle(
        "particles/items4_fx/combo_breaker_buff.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        caster
    )
    ParticleManager:ReleaseParticleIndex(particle)
end

-- 被动modifier
modifier_item_withered_spring = class({})

function modifier_item_withered_spring:IsHidden() return true end

function modifier_item_withered_spring:IsPurgable() return false end

function modifier_item_withered_spring:IsPurgeException() return false end

function modifier_item_withered_spring:RemoveOnDeath() return false end

function modifier_item_withered_spring:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_withered_spring:OnCreated()
    self:OnRefresh()

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 只读取 Lua 逻辑需要的属性（客户端和服务器端都需要）
    self.health_regen_pct = ability:GetSpecialValueFor("health_regen_pct")
    self.status_resistance = ability:GetSpecialValueFor("status_resistance")
    self.hp_threshold = ability:GetSpecialValueFor("hp_threshold")

    if IsServer() then
        self:StartIntervalThink(0.1) -- 每0.1秒检查生命值
    end
end

function modifier_item_withered_spring:OnRefresh()
    self.stats_modifier_name = "modifier_item_withered_spring_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_withered_spring:OnIntervalThink()
    if not IsServer() then return end

    local parent = self:GetParent()
    local ability = self:GetAbility()

    if not ability or ability:IsNull() then return end

    -- 检查生命值是否低于阈值
    local hp_pct = parent:GetHealthPercent()
    if hp_pct <= self.hp_threshold and ability:IsFullyCastable() then
        -- 自动触发主动技能
        ability:OnSpellStart()
        ability:UseResources(false, false, false, true) -- 消耗冷却
    end
end

function modifier_item_withered_spring:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_withered_spring:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
    }
end

function modifier_item_withered_spring:GetModifierHealthRegenPercentageUnique()
    return self.health_regen_pct or 0
end

function modifier_item_withered_spring:GetModifierStatusResistanceStacking()
    return self.status_resistance or 0
end

-- 主动buff
modifier_item_withered_spring_active = class({})

function modifier_item_withered_spring_active:IsHidden() return false end

function modifier_item_withered_spring_active:IsDebuff() return false end

function modifier_item_withered_spring_active:IsPurgable() return false end

function modifier_item_withered_spring_active:GetTexture()
    return "item_withered_spring"
end

function modifier_item_withered_spring_active:OnCreated()
    if not self:GetAbility() then return end

    -- 客户端和服务器端都需要读取
    self.bonus_armor_active = self:GetAbility():GetSpecialValueFor("bonus_armor_active")
    self.bonus_regen_active = self:GetAbility():GetSpecialValueFor("bonus_regen_active")
    self.status_resistance = self:GetAbility():GetSpecialValueFor("status_resistance_active") or 80

    if not IsServer() then return end

    -- 服务器端逻辑
    self.damage_reduction = self:GetAbility():GetSpecialValueFor("damage_reduction") or -30 -- 30%减伤 = 不受任何伤害
    -- 添加持续的视觉效果(只在主动触发时显示)
    local particle = ParticleManager:CreateParticle(
        "particles/items4_fx/combo_breaker_buff.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        self:GetParent()
    )
    self:AddParticle(particle, false, false, -1, false, false)
end

function modifier_item_withered_spring_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
    }
end

function modifier_item_withered_spring_active:GetModifierPhysicalArmorBonus()
    return self.bonus_armor_active or 0
end

function modifier_item_withered_spring_active:GetModifierConstantHealthRegen()
    return self.bonus_regen_active or 0
end

function modifier_item_withered_spring_active:GetModifierIncomingDamage_Percentage()
    return self.damage_reduction or -30
end

function modifier_item_withered_spring_active:GetModifierStatusResistanceStacking()
    return self.status_resistance or 80
end

function modifier_item_withered_spring_active:CheckState()
    return {
        [MODIFIER_STATE_DEBUFF_IMMUNE] = true, -- 免疫debuff
    }
end
