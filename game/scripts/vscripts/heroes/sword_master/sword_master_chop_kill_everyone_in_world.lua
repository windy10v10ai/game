LinkLuaModifier("modifier_sword_master_chop_kill_everyone_in_world","Heroes/sword_master/sword_master_chop_kill_everyone_in_world.lua", LUA_MODIFIER_MOTION_NONE)

sword_master_chop_kill_everyone_in_world = sword_master_chop_kill_everyone_in_world or class({})
modifier_sword_master_chop_kill_everyone_in_world = modifier_sword_master_chop_kill_everyone_in_world or class({})

function sword_master_chop_kill_everyone_in_world:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_juggernaut.vsndevts", context )
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_faceless_void.vsndevts", context )
end

function sword_master_chop_kill_everyone_in_world:GetCastRange(vLocation, hTarget)
	return self:GetSpecialValueFor("radius")
end


function sword_master_chop_kill_everyone_in_world:OnAbilityPhaseStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:AddMagicImmune()
    end
end

function sword_master_chop_kill_everyone_in_world:OnAbilityPhaseInterrupted()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end
end

function sword_master_chop_kill_everyone_in_world:OnSpellStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end

    local radius = self:GetSpecialValueFor("radius")

    local enemies = FindUnitsInRadius(
        caster:GetTeam(),
        caster:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    caster:AddNewModifier(caster, self, "modifier_sword_master_chop_kill_everyone_in_world", {})
    for _, enemy in ipairs(enemies) do
        if ability ~= nil then
            ability:ChopAttack(caster,enemy)
        else
            caster:AddNewModifier(caster, self, "modifier_tidehunter_anchor_smash_caster", {})
            caster:PerformAttack(enemy, true, true, true, true, false, false, true)
            caster:RemoveModifierByName("modifier_tidehunter_anchor_smash_caster")
        end

        local particle_impact = ParticleManager:CreateParticle("particles/heroes/sword_master/children/sword_master_chop_kill_with_one_sword_impact.vpcf", PATTACH_ABSORIGIN_FOLLOW, enemy)
        ParticleManager:DestroyParticle(particle_impact, false)
        ParticleManager:ReleaseParticleIndex(particle_impact)
    end
    caster:RemoveModifierByName("modifier_sword_master_chop_kill_everyone_in_world")

    local particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_kill_everyone_in_world.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    caster:EmitSoundParams("Hero_Juggernaut.BladeDance",0,5,0)
    caster:EmitSound("Hero_FacelessVoid.TimeDilation.Cast.ti7_layer")

    local particle_text = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_kill_everyone_in_world_head.vpcf", PATTACH_OVERHEAD_FOLLOW, caster )
    ParticleManager:SetParticleControl(particle_text,0,caster:GetAbsOrigin())

    -- ParticleManager:SetParticleControl(particle, 5, Vector(350,0,0))
    Timers:CreateTimer(0.5,function ()
        ParticleManager:DestroyParticle(particle, false)
        ParticleManager:ReleaseParticleIndex(particle)
    end)

    -- Timers:CreateTimer(3,function ()
    --     ParticleManager:DestroyParticle(particle, false)
    --     ParticleManager:ReleaseParticleIndex(particle)
    -- end)


end

function modifier_sword_master_chop_kill_everyone_in_world:IsHidden() return true end
function modifier_sword_master_chop_kill_everyone_in_world:IsPurgable() return false end
function modifier_sword_master_chop_kill_everyone_in_world:IsPurgeException() return false end

function modifier_sword_master_chop_kill_everyone_in_world:OnCreated(table)
    local caster = self:GetCaster()
    local ability = self:GetAbility()
    local spellAmplif = (1 + caster:GetSpellAmplification(false))
    self.damage_bonus = ability:GetSpecialValueFor("base_damage") *  spellAmplif
    self.damage_crit = ability:GetSpecialValueFor("damage_crit") * spellAmplif
end

function modifier_sword_master_chop_kill_everyone_in_world:OnRefresh(table)
    self:OnCreated(table)
end

function modifier_sword_master_chop_kill_everyone_in_world:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE
    }
end

function modifier_sword_master_chop_kill_everyone_in_world:GetModifierPreAttack_BonusDamage()
    return self.damage_bonus
end

function modifier_sword_master_chop_kill_everyone_in_world:GetModifierPreAttack_CriticalStrike()
    return self.damage_crit
end



