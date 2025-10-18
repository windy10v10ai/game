legion_commander_overwhelming_odds = class({})

function legion_commander_overwhelming_odds:GetBehavior()
    return DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_UNRESTRICTED
end

-- 添加这个函数来绕过决斗期间的施法限制
function legion_commander_overwhelming_odds:CastFilterResult()
    local caster = self:GetCaster()

    -- 即使在决斗期间也允许施法
    if caster:HasModifier("modifier_legion_commander_duel") then
        return UF_SUCCESS
    end

    return UF_SUCCESS
end

function legion_commander_overwhelming_odds:OnSpellStart()
    local caster = self:GetCaster()
    local target_point = caster:GetAbsOrigin()

    local radius = self:GetSpecialValueFor("radius")
    local base_damage = self:GetSpecialValueFor("damage")
    local damage_per_unit = self:GetSpecialValueFor("damage_per_unit")
    local damage_per_hero = self:GetSpecialValueFor("damage_per_hero")
    local bonus_attack_speed = self:GetSpecialValueFor("bonus_attack_speed")
    local duration = self:GetSpecialValueFor("duration")

    -- 获取决斗攻击力加成(魔晶提供90%)
    local duel_damage = 0
    if caster:HasModifier("modifier_legion_commander_duel_damage_boost") then
        local total_duel_damage = caster:GetModifierStackCount("modifier_legion_commander_duel_damage_boost", caster)
        local duel_damage_pct = self:GetSpecialValueFor("duel_damage_pct")
        duel_damage = total_duel_damage * (duel_damage_pct / 100)
    end

    caster:EmitSound("Hero_LegionCommander.Overwhelming.Cast")

    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_legion_commander/legion_commander_odds.vpcf", PATTACH_ABSORIGIN, caster)
    ParticleManager:SetParticleControl(particle, 0, caster:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, 0, 0))
    ParticleManager:ReleaseParticleIndex(particle)

    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        target_point,
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    local hero_count = 0
    local unit_count = 0

    for _, enemy in pairs(enemies) do
        if enemy:IsHero() then
            hero_count = hero_count + 1
        else
            unit_count = unit_count + 1
        end
    end

    local total_damage = base_damage + (unit_count * damage_per_unit) + (hero_count * (damage_per_hero + duel_damage))

    for _, enemy in pairs(enemies) do
        ApplyDamage({
            victim = enemy,
            attacker = caster,
            damage = total_damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = self
        })
        enemy:EmitSound("Hero_LegionCommander.Overwhelming.Location")
    end

    if hero_count > 0 then
        caster:AddNewModifier(caster, self, "modifier_legion_commander_overwhelming_odds_buff", {duration = duration})

        local shield_amount = total_damage * 0.4
        caster:AddNewModifier(caster, self, "modifier_legion_commander_overwhelming_odds_shield", {
            duration = duration,
            shield = shield_amount
        })
    end
end
LinkLuaModifier("modifier_legion_commander_overwhelming_odds_buff", "abilities/legion_commander_overwhelming_odds", LUA_MODIFIER_MOTION_NONE)

modifier_legion_commander_overwhelming_odds_buff = class({})

function modifier_legion_commander_overwhelming_odds_buff:IsHidden() return false end
function modifier_legion_commander_overwhelming_odds_buff:IsPurgable() return true end

function modifier_legion_commander_overwhelming_odds_buff:DeclareFunctions()
    return {MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT}
end

function modifier_legion_commander_overwhelming_odds_buff:GetModifierAttackSpeedBonus_Constant()
    return self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
end

function modifier_legion_commander_overwhelming_odds_buff:GetEffectName()
    return "particles/units/heroes/hero_legion_commander/legion_commander_odds_buff.vpcf"
end

function modifier_legion_commander_overwhelming_odds_buff:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

LinkLuaModifier("modifier_legion_commander_overwhelming_odds_shield", "abilities/legion_commander_overwhelming_odds", LUA_MODIFIER_MOTION_NONE)

modifier_legion_commander_overwhelming_odds_shield = class({})

function modifier_legion_commander_overwhelming_odds_shield:IsHidden() return false end
function modifier_legion_commander_overwhelming_odds_shield:IsPurgable() return true end

function modifier_legion_commander_overwhelming_odds_shield:OnCreated(params)
    if IsServer() then
        self.shield = params.shield or 0
    end
end

function modifier_legion_commander_overwhelming_odds_shield:DeclareFunctions()
    return {MODIFIER_PROPERTY_TOTAL_CONSTANT_BLOCK}
end

-- 修正:这里的函数名必须与类名完全匹配
function modifier_legion_commander_overwhelming_odds_shield:GetModifierTotal_ConstantBlock(params)
    if IsServer() and self.shield > 0 then
        local block = math.min(params.damage, self.shield)
        self.shield = self.shield - block
        if self.shield <= 0 then
            self:Destroy()
        end
        return block
    end
    return 0
end
