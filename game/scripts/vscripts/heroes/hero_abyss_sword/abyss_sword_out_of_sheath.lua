LinkLuaModifier("modifier_abyss_sword_out_of_sheath", "heroes/hero_abyss_sword/abyss_sword_out_of_sheath", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_abyss_sword_out_of_sheath_shard", "heroes/hero_abyss_sword/abyss_sword_out_of_sheath", LUA_MODIFIER_MOTION_NONE)

abyss_sword_out_of_sheath = abyss_sword_out_of_sheath or class({})
modifier_abyss_sword_out_of_sheath = modifier_abyss_sword_out_of_sheath or class({})
modifier_abyss_sword_out_of_sheath_shard = modifier_abyss_sword_out_of_sheath_shard or class({})

function abyss_sword_out_of_sheath:GetBehavior()
    if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
		return DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
	else
		return self.BaseClass.GetBehavior(self)
	end
end

function abyss_sword_out_of_sheath:GetCooldown()
    if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
		return self:GetSpecialValueFor("shard_cooldown")
	end
end

function abyss_sword_out_of_sheath:GetCastRange()
    if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
		return self:GetSpecialValueFor("shard_range")
	end
end

function abyss_sword_out_of_sheath:GetManaCost()
    if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
		return self:GetSpecialValueFor("shard_manacost")
	end
end

function abyss_sword_out_of_sheath:OnSpellStart()
    local target = self:GetCursorTarget()
    local caster = self:GetCaster()
    local target_origin = target:GetAbsOrigin()
    local caster_origin = caster:GetAbsOrigin()
    local distance = (target_origin - caster_origin):Length2D()
    local direction = (target_origin - caster_origin):Normalized()
    local blink_point = caster_origin + direction * (distance - 128)
    local duration = self:GetSpecialValueFor("shard_duration")

    local blink_pfx_start = ParticleManager:CreateParticle("particles/econ/items/phantom_assassin/phantom_assassin_arcana_elder_smith/pa_arcana_phantom_strike_start.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(blink_pfx_start,0,caster_origin)
    ParticleManager:ReleaseParticleIndex(blink_pfx_start)


    caster:SetAbsOrigin(blink_point)

    caster:SetContextThink("FindClearSpace", function()
        FindClearSpaceForUnit(caster, blink_point, true)
    end,FrameTime())

    local blink_pfx_end = ParticleManager:CreateParticle("particles/econ/items/phantom_assassin/phantom_assassin_arcana_elder_smith/pa_arcana_phantom_strike_end.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(blink_pfx_end,0,target_origin)
    ParticleManager:ReleaseParticleIndex(blink_pfx_end)

	local duration = duration * (1 - target:GetStatusResistance())
    target:AddNewModifier(caster,self,"modifier_abyss_sword_out_of_sheath_shard",{duration = duration})

    caster:PerformAttack(target, true, true, true, true, false, false, true)
    caster:MoveToTargetToAttack(target)
    caster:EmitSound("Hero_Abyss_Sword.OutOfSheath.Shard")
end

function abyss_sword_out_of_sheath:GetIntrinsicModifierName()
    return "modifier_abyss_sword_out_of_sheath"
end

function modifier_abyss_sword_out_of_sheath:RemoveOnDeath() return false end
function modifier_abyss_sword_out_of_sheath:IsPurgeable() return false end
function modifier_abyss_sword_out_of_sheath:DeclareFunctions()
    local funcs = {
        MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
        MODIFIER_EVENT_ON_ATTACK_LANDED
    }
    return funcs
end


function modifier_abyss_sword_out_of_sheath:OnAttackLanded(keys)
    local parent = self:GetParent()
    local ability = self:GetAbility()
    if keys.attacker == parent then
        if self.critProc then
            keys.target:EmitSound("Hero_Abyss_Sword.OutOfSheath.Impact")
            local lifesteal = ability:GetSpecialValueFor("lifesteal")
            parent:HealWithParams(lifesteal/100 * keys.damage,ability,true,true,parent,false)
            self.critProc = false
            local crit_pfx = ParticleManager:CreateParticle("particles/custom/sword_spirit/abyss_sword_out_of_sheath_impact.vpcf", PATTACH_ABSORIGIN_FOLLOW, keys.target)
            ParticleManager:ReleaseParticleIndex(crit_pfx)
        end
    end
end


function modifier_abyss_sword_out_of_sheath:GetModifierPreAttack_CriticalStrike(keys)
    if self:GetParent():PassivesDisabled() then return nil end
    local parent = self:GetParent()
    local ability = self:GetAbility()
    if ability and keys.attacker == parent and not parent:PassivesDisabled() then
        local chance = ability:GetSpecialValueFor("chance")
        self.critProc = false
        local HasTalent = false
        local talent = parent:FindAbilityByName("special_bonus_unique_abyss_sword_6")
        if talent and talent:GetLevel() > 0 then
            HasTalent = true
        end
        if RollPseudoRandomPercentage(chance,DOTA_PSEUDO_RANDOM_NONE, parent) or (HasTalent and parent:HasModifier("modifier_abyss_sword_rush_night_sword_qi")) then

            -- parent:StartGestureWithPlaybackRate(ACT_DOTA_ATTACK, parent:GetSecondsPerAttack())

            parent:EmitSound("Hero_Juggernaut.BladeDance")
            self.critProc = true
            local percentage = ability:GetSpecialValueFor("percentage")
            return percentage
        end
    end
end


function modifier_abyss_sword_out_of_sheath_shard:CheckState()
    return {[MODIFIER_STATE_PASSIVES_DISABLED] = true}
end

function modifier_abyss_sword_out_of_sheath_shard:GetEffectName()
    return "particles/generic_gameplay/generic_break.vpcf"
end

function modifier_abyss_sword_out_of_sheath_shard:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

