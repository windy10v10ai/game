LinkLuaModifier("modifier_monkey_king_defy", "heroes/hero_monkey_king/monkey_king_defy", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_monkey_king_defy_strike", "abilities/ts_abilities/monkey_king_defy_strike", LUA_MODIFIER_MOTION_NONE)

monkey_king_defy = class({})

-- 觉醒后才能在被控制状态下施放：动态加 IGNORE_PSEUDO_QUEUE（觉醒前没有，引擎自然不放行被控施放）
function monkey_king_defy:GetBehavior()
    local behavior = DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_IMMEDIATE
    if self:GetSpecialValueFor('awaken_enabled') >= 1 then
        behavior = behavior + DOTA_ABILITY_BEHAVIOR_IGNORE_PSEUDO_QUEUE
    end
    return behavior
end

function monkey_king_defy:OnSpellStart()
    self.caster = self:GetCaster()
    self.duration = self:GetSpecialValueFor('duration')
    self.caster:EmitSound('Hero_MonkeyKing.FurArmy.Channel')
    -- 施放时强驱散自身减益（含控制效果）
    self.caster:Purge(false, true, false, true, true)
    local awakened = self:GetSpecialValueFor('awaken_enabled') >= 1
    if awakened then
        ApplyAwakenMagicImmunity(self.caster, self, self.duration)
    end
    self.caster:AddNewModifier(self.caster, self, "modifier_monkey_king_defy", { duration = self.duration })
    if awakened and self.caster:IsRealHero() and not self.caster:IsIllusion() then
        self.caster:AddNewModifier(self.caster, self, "modifier_monkey_king_defy_strike", { duration = self.duration })
    end
end

modifier_monkey_king_defy = class({})
function modifier_monkey_king_defy:IsHidden() return false end

function modifier_monkey_king_defy:IsDebuff() return false end

function modifier_monkey_king_defy:IsPurgable() return false end

function modifier_monkey_king_defy:IsPurgeException() return false end

function modifier_monkey_king_defy:RemoveOnDeath() return true end

function modifier_monkey_king_defy:AllowIllusionDuplicate() return false end

function modifier_monkey_king_defy:GetTexture() return "spe_new_ultimate" end

function modifier_monkey_king_defy:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
        MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
    }
end

function modifier_monkey_king_defy:GetModifierIncomingDamage_Percentage()
    return self.damageReduction
end

function modifier_monkey_king_defy:GetModifierStatusResistanceStacking()
    return self.statusResistance
end

-- 觉醒后大招期间 +100% 攻击力（值由 awaken special_bonus 键控制，未觉醒为 0）
function modifier_monkey_king_defy:GetModifierBaseDamageOutgoing_Percentage()
    return self.bonusAttackDamagePct
end

function modifier_monkey_king_defy:OnCreated(table)
    self.ability = self:GetAbility()
    self.caster = self:GetParent()
    self.damageReduction = self.ability:GetSpecialValueFor('damage_reduction')
    self.statusResistance = self.ability:GetSpecialValueFor('status_resistance')
    self.bonusAttackDamagePct = self.ability:GetSpecialValueFor('awaken_bonus_attack_damage_pct')
end

function modifier_monkey_king_defy:OnRefresh(table)
    self:OnCreated(table)
end

function modifier_monkey_king_defy:OnDestroy()
    if IsServer() then
        self:GetParent():RemoveModifierByName("modifier_monkey_king_defy_strike")
    end
end
