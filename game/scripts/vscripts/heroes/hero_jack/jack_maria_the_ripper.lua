LinkLuaModifier("modifier_jack_maria_the_ripper", "heroes/hero_jack/jack_maria_the_ripper", LUA_MODIFIER_MOTION_NONE)

jack_maria_the_ripper = jack_maria_the_ripper or class({})
modifier_jack_maria_the_ripper = modifier_jack_maria_the_ripper or class({})

function jack_maria_the_ripper:Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_queenofpain.vsndevts",context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_phantom_assassin.vsndevts",context)
end

function jack_maria_the_ripper:OnSpellStart()
    self.target = self:GetCursorTarget()
    local caster = self:GetCaster()
    local caster_origin = caster:GetAbsOrigin()
    local target_origin = self.target:GetAbsOrigin()
    local blink_point = target_origin - self.target:GetForwardVector() * 128
    local modi = self.target:FindModifierByName("modifier_jack_surgery_target")
    local count = 0
    local attacktimes_count = self:GetSpecialValueFor("attacktimes_count")
    if modi then
        count = math.ceil(modi:GetStackCount() * attacktimes_count)
    end
    local stun_duration = self:GetSpecialValueFor("stun_duration")
    local attack_duration = self:GetSpecialValueFor("attack_duration")
    local tick = attack_duration / count
    if count == 0 then
        attack_duration = 0
        tick = 999
    end

    local blink_pfx_start = ParticleManager:CreateParticle("particles/econ/items/phantom_assassin/phantom_assassin_arcana_elder_smith/pa_arcana_phantom_strike_start.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(blink_pfx_start,0,caster_origin)
    ParticleManager:ReleaseParticleIndex(blink_pfx_start)


    caster:EmitSound("Hero_QueenOfPain.Blink_in")
    caster:SetAbsOrigin(blink_point)

    caster:SetContextThink("FindClearSpace", function()
        caster:EmitSound("Hero_QueenOfPain.Blink_out")
        FindClearSpaceForUnit(caster, blink_point, true)
    end,FrameTime())

    local blink_pfx_end = ParticleManager:CreateParticle("particles/econ/items/phantom_assassin/phantom_assassin_arcana_elder_smith/pa_arcana_phantom_strike_end.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(blink_pfx_end,0,target_origin)
    ParticleManager:ReleaseParticleIndex(blink_pfx_end)

    self.target:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})
    caster:AddNewModifier(caster, self, "modifier_jack_maria_the_ripper", {duration = attack_duration,tick = tick})

    -- caster:PerformAttack(target, true, true, true, true, false, false, true)
    caster:MoveToTargetToAttack(self.target)

    caster:PlayVoice("npc_dota_hero_brewmaster.vo.MariaTheRipper.Cast")
end

function modifier_jack_maria_the_ripper:OnCreated(table)
    if not IsServer() then return end
    local parent = self:GetParent()
    parent:StartGesture(ACT_DOTA_CHANNEL_ABILITY_5)
    self:StartIntervalThink(table.tick)
end

function modifier_jack_maria_the_ripper:OnIntervalThink()
    local parent = self:GetParent()
    local target = self:GetAbility().target
    local parentOrigin = parent:GetAbsOrigin()
    local targetOrigin = target:GetAbsOrigin()
    local vector = (parentOrigin - targetOrigin):Normalized()
    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact_dagger.vpcf", PATTACH_ABSORIGIN_FOLLOW, target)
    ParticleManager:SetParticleControlEnt(particle, 0, target, PATTACH_POINT_FOLLOW, "attach_hitloc", targetOrigin,true)
    ParticleManager:SetParticleControl(particle, 1, targetOrigin)
    ParticleManager:SetParticleControlForward(particle, 1, RotatePosition(Vector(0,0,0), QAngle(0,RandomInt(-30, 30), 0), vector))

    target:EmitSound("Hero_PhantomAssassin.CoupDeGrace")
    target:EmitSound("Hero_Centaur.Gore")

    parent:PerformAttack(target, true, true, true, true, false, false, true)
end

function modifier_jack_maria_the_ripper:OnDestroy()
    if not IsServer() then return end
    local parent = self:GetParent()
    parent:FadeGesture(ACT_DOTA_CHANNEL_ABILITY_5)
end

function modifier_jack_maria_the_ripper:CheckState()
    return {
        [MODIFIER_STATE_STUNNED] = true,
        [MODIFIER_STATE_TRUESIGHT_IMMUNE] = true,
        [MODIFIER_STATE_INVISIBLE] = true
    }
end

function modifier_jack_maria_the_ripper:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_INVISIBILITY_LEVEL
    }
end

function modifier_jack_maria_the_ripper:GetModifierInvisibilityLevel()
    return 1
end
