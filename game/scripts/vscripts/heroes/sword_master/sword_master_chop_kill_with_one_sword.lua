sword_master_chop_kill_with_one_sword = sword_master_chop_kill_with_one_sword or class({})

function sword_master_chop_kill_with_one_sword:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_void_spirit.vsndevts", context )
end

function sword_master_chop_kill_with_one_sword:OnAbilityPhaseStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:AddMagicImmune()
    end
end

function sword_master_chop_kill_with_one_sword:OnAbilityPhaseInterrupted()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end
end


function sword_master_chop_kill_with_one_sword:OnSpellStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end

    local target = self:GetCursorTarget()
    local base_damage = self:GetSpecialValueFor("base_damage")
    local damage_per = self:GetSpecialValueFor("damage_per") / 100
    local distance_add = self:GetSpecialValueFor("distance_add")
    
    local casterOrigin = caster:GetAbsOrigin()
    local vector = target:GetAbsOrigin() - casterOrigin
    local direction = vector:Normalized()
    local distance = vector:Length2D() + distance_add
    local location = casterOrigin + direction * distance
    local stun_duration = self:GetSpecialValueFor("stun_duration")
    target:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})
    
    FindClearSpaceForUnit(caster, location, true)

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = base_damage + target:GetHealthDeficit() * damage_per,
        damage_type = DAMAGE_TYPE_PHYSICAL,
        damage_flags = DOTA_DAMAGE_FLAG_NONE, --Optional.
        ability = self, --Optional.
    })

    local particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_kill_with_one_sword.vpcf", PATTACH_POINT, caster)
    ParticleManager:SetParticleControl(particle, 0, casterOrigin)
    ParticleManager:SetParticleControl(particle, 1, location)
    ParticleManager:DestroyParticle(particle, false)
    ParticleManager:ReleaseParticleIndex(particle)
    
    local particle_impact = ParticleManager:CreateParticle("particles/heroes/sword_master/children/sword_master_chop_kill_with_one_sword_impact.vpcf", PATTACH_ABSORIGIN_FOLLOW, target)
    ParticleManager:DestroyParticle(particle_impact, false)
    ParticleManager:ReleaseParticleIndex(particle_impact)

    local particle_text = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_kill_with_one_sword_head.vpcf", PATTACH_OVERHEAD_FOLLOW, caster )
    ParticleManager:SetParticleControl(particle_text,0,caster:GetAbsOrigin())

    caster:EmitSound("Hero_VoidSpirit.AstralStep.Start")
end

