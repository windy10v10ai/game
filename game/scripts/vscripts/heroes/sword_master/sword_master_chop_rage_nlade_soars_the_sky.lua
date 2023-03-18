sword_master_chop_rage_nlade_soars_the_sky = sword_master_chop_rage_nlade_soars_the_sky or class({})

function sword_master_chop_rage_nlade_soars_the_sky:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_zuus.vsndevts", context )
end


function sword_master_chop_rage_nlade_soars_the_sky:OnAbilityPhaseStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:AddMagicImmune()
    end
end

function sword_master_chop_rage_nlade_soars_the_sky:OnAbilityPhaseInterrupted()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end
end

function sword_master_chop_rage_nlade_soars_the_sky:OnSpellStart()
    local caster = self:GetCaster()
    local ability = caster:FindAbilityByName("sword_master_chop")
    if ability ~= nil then
        ability:RemoveMagicImmune()
    end

    local width = self:GetSpecialValueFor("width")
    local length = self:GetSpecialValueFor("length")
    local stun_duration = self:GetSpecialValueFor("stun_duration")
    local damage_per = self:GetSpecialValueFor("damage_per") / 100
    local startpoint = caster:GetAbsOrigin()
    local direction = (self:GetCursorPosition() - startpoint):Normalized()
    if direction:Length2D() == 0 then
        direction = caster:GetForwardVector()
    end
    local endpoint = startpoint + (direction * length)
    local enemies = FindUnitsInLine(
        caster:GetTeam(),
        startpoint,
        endpoint,
        nil,
        width,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES)

    local damagetable = {
        victim = nil,
        attacker = caster,
        damage = 0,
        damage_type = DAMAGE_TYPE_PURE,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
        ability = self
    }

    for _, enemy in ipairs(enemies) do
        damagetable.victim = enemy
        damagetable.damage = enemy:GetMaxHealth() * damage_per
        ApplyDamage(damagetable)
        enemy:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})
    end

    local particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_rage_nlade_soars_the_sky.vpcf", PATTACH_POINT , caster)
    ParticleManager:SetParticleControl(particle, 0, startpoint+ direction * 100)
    ParticleManager:SetParticleControl(particle, 1, endpoint + direction * 100)

    local particle_text = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_chop_rage_nlade_soars_the_sky_head.vpcf", PATTACH_OVERHEAD_FOLLOW, caster )
    ParticleManager:SetParticleControl(particle_text,0,caster:GetAbsOrigin())

    caster:EmitSoundParams("Hero_Zuus.LightningBolt.Cast.Righteous",0,3,0)
end

