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
    local is_passive_trigger = self.is_passive_trigger or false
    self.is_passive_trigger = false
    -- 被动免死触发时全额免伤/免出伤，直接把百分比数值传给 buff，避免布尔值经 KeyValues 转成 0/1 后被 Lua 当真值判定
    local damage_negation_pct = is_passive_trigger and -100 or 0

    -- 回血 音效
    caster:EmitSound("Item.GuardianGreaves.Activate")

    -- 添加主动buff
    caster:AddNewModifier(caster, self, "modifier_item_withered_spring_active",
        { duration = duration, damage_negation_pct = damage_negation_pct })

    -- 驱散负面效果
    caster:Purge(false, true, false, true, true)

    -- 卫士胫甲效果：回血回蓝对自身和范围内友军生效，主动buff不含在内
    local replenish_health = self:GetSpecialValueFor("replenish_health")
    local replenish_health_pct = self:GetSpecialValueFor("replenish_health_pct")
    local replenish_mana = self:GetSpecialValueFor("replenish_mana")
    local replenish_radius = self:GetSpecialValueFor("replenish_radius")
    local allies = FindUnitsInRadius(caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, replenish_radius,
        DOTA_UNIT_TARGET_TEAM_FRIENDLY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
        FIND_ANY_ORDER, false)

    if is_passive_trigger then
        -- 永恒之盘触发特效 - 护盾爆发效果，仅被动免死触发时播放
        local particle = ParticleManager:CreateParticle(
            "particles/items4_fx/combo_breaker_buff.vpcf",
            PATTACH_ABSORIGIN_FOLLOW,
            caster
        )
        ParticleManager:ReleaseParticleIndex(particle)
    end

    for _, ally in pairs(allies) do
        local heal_amount = replenish_health + ally:GetMaxHealth() * replenish_health_pct / 100
        ally:Heal(heal_amount, self)
        ally:GiveMana(replenish_mana)
        SendOverheadEventMessage(caster, OVERHEAD_ALERT_HEAL, ally, heal_amount, nil)
        SendOverheadEventMessage(caster, OVERHEAD_ALERT_MANA_ADD, ally, replenish_mana, nil)

        -- 卫士胫甲绳索特效：CP0 施法者、CP1 受益目标，每个目标各起一个实例
        local rope = ParticleManager:CreateParticle(
            "particles/items_fx/aoe_item_generic_caster_to_target_rope_guardian_greaves_base.vpcf",
            PATTACH_CUSTOMORIGIN,
            caster
        )
        ParticleManager:SetParticleControlEnt(rope, 0, caster, PATTACH_POINT_FOLLOW, "attach_hitloc",
            caster:GetAbsOrigin(), true)
        ParticleManager:SetParticleControlEnt(rope, 1, ally, PATTACH_POINT_FOLLOW, "attach_hitloc",
            ally:GetAbsOrigin(), true)
        -- puffs 子特效（目标周身光效）只走 CP4/5 这条多目标管线，不吃 CP0/1，需要单独补上
        ParticleManager:SetParticleControlEnt(rope, 4, caster, PATTACH_POINT_FOLLOW, "attach_hitloc",
            caster:GetAbsOrigin(), true)
        ParticleManager:SetParticleControlEnt(rope, 5, ally, PATTACH_POINT_FOLLOW, "attach_hitloc",
            ally:GetAbsOrigin(), true)
        ParticleManager:ReleaseParticleIndex(rope)
    end
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

function modifier_item_withered_spring:OnCreated(params)
    self:OnRefresh(params)

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 只读取 Lua 逻辑需要的属性（客户端和服务器端都需要）
    self.health_regen_pct = ability:GetSpecialValueFor("health_regen_pct")
    self.status_resistance = ability:GetSpecialValueFor("status_resistance")
    self.hp_threshold = ability:GetSpecialValueFor("hp_threshold")
end

function modifier_item_withered_spring:OnRefresh(params)
    self.stats_modifier_name = "modifier_item_withered_spring_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

-- 血量下限锁在 1，伤害结算时引擎同步钳制，避免单次爆发直接秒杀绕过阈值判定
function modifier_item_withered_spring:GetMinHealth()
    local parent = self:GetParent()
    if parent:HasModifier("modifier_ignore_invulnerable_kill") or parent:IsMuted() then
        return 0
    end

    local ability = self:GetAbility()
    if ability and not ability:IsNull() and ability:IsFullyCastable() then
        return 1
    end
    return 0
end

function modifier_item_withered_spring:OnTakeDamage(event)
    if not IsServer() then return end

    local parent = self:GetParent()
    -- 死亡时不触发
    if not parent:IsAlive() then return end

    if event.unit ~= parent then return end
    if parent:IsMuted() then return end

    local ability = self:GetAbility()
    if not ability or ability:IsNull() or not ability:IsFullyCastable() then return end

    if parent:GetHealthPercent() <= self.hp_threshold then
        ability.is_passive_trigger = true
        ability:OnSpellStart()
        ability:UseResources(false, false, false, true)
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
        MODIFIER_PROPERTY_MIN_HEALTH,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
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

function modifier_item_withered_spring_active:OnCreated(params)
    if not self:GetAbility() then return end

    self.damage_negation_pct = params and params.damage_negation_pct or 0

    -- 客户端和服务器端都需要读取
    self.bonus_armor_active = self:GetAbility():GetSpecialValueFor("bonus_armor_active")
    self.bonus_regen_active = self:GetAbility():GetSpecialValueFor("bonus_regen_active")
    self.status_resistance = self:GetAbility():GetSpecialValueFor("status_resistance_active") or 80
end

function modifier_item_withered_spring_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
        MODIFIER_PROPERTY_TOTALDAMAGEOUTGOING_PERCENTAGE,
    }
end

function modifier_item_withered_spring_active:GetModifierPhysicalArmorBonus()
    return self.bonus_armor_active or 0
end

function modifier_item_withered_spring_active:GetModifierConstantHealthRegen()
    return self.bonus_regen_active or 0
end

-- 被动免死触发时短暂免疫所有伤害，仿永恒之盘的保命效果
function modifier_item_withered_spring_active:GetModifierIncomingDamage_Percentage()
    return self.damage_negation_pct
end

function modifier_item_withered_spring_active:GetModifierTotalDamageOutgoing_Percentage()
    return self.damage_negation_pct
end

function modifier_item_withered_spring_active:GetModifierStatusResistanceStacking()
    return self.status_resistance or 80
end
