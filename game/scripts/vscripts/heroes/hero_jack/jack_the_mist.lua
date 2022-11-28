LinkLuaModifier("modifier_jack_murderer_of_the_misty_night", "heroes/hero_jack/jack_murderer_of_the_misty_night", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_the_mist_aura", "heroes/hero_jack/jack_the_mist", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_the_mist_cast", "heroes/hero_jack/jack_the_mist", LUA_MODIFIER_MOTION_NONE)

jack_the_mist = jack_the_mist or class({})
modifier_jack_the_mist_aura = modifier_jack_the_mist_aura or class({})
modifier_jack_the_mist_cast = modifier_jack_the_mist_cast or class({})

function jack_the_mist:Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_drowranger.vsndevts",context)
end

function jack_the_mist:GetCastRange(vLocation, hTarget)
    return self:GetSpecialValueFor("radius_active")
end

function jack_the_mist:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("duration")
    GameRules:BeginTemporaryNight(duration)
    caster:AddNewModifier(caster, self, "modifier_jack_the_mist_aura", {duration = duration})


    if not IsServer() then return end
    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_night_stalker/nightstalker_ulti.vpcf",PATTACH_ABSORIGIN_FOLLOW,caster)
    ParticleManager:DestroyParticle(particle, false)
    ParticleManager:ReleaseParticleIndex(particle)
    caster:EmitSound("Hero_DrowRanger.Silence")
    caster:PlayVoice("npc_dota_hero_brewmaster.vo.TheMist.Cast")
end

-- function jack_the_mist:GetIntrinsicModifierName()
--     return "modifier_jack_the_mist_aura"
-- end

function modifier_jack_the_mist_aura:IsHidden() return false end

function modifier_jack_the_mist_aura:RemoveOnDeath()
    return true
end

function modifier_jack_the_mist_aura:OnCreated()
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    -- self.radius_normal = self:GetAbility():GetSpecialValueFor("radius_normal")
    self.radius_active = self:GetAbility():GetSpecialValueFor("radius_active")
    self.radius = self.radius_active
    self.aura = false
    self:StartIntervalThink(0.1)
end

function modifier_jack_the_mist_aura:OnIntervalThink()
    local ability_misty = self:GetParent():FindAbilityByName("jack_murderer_of_the_misty_night")
    self.parent.move_speed_down = -ability_misty:GetSpecialValueFor("movespeed_down")
    self.parent.attack_speed_down = -ability_misty:GetSpecialValueFor("attackspeed_down")
    self.parent.turn_rate_down = -ability_misty:GetSpecialValueFor("turnrate_down")
    self.parent.vision_range_down = -ability_misty:GetSpecialValueFor("visionrange_down")
    if self.parent:HasScepter() then
        self.aura = true
        if not IsServer() then return  end
        if self.parent:IsAlive() then
            if self.particle == nil then
                self.particle = ParticleManager:CreateParticle("particles/heroes/jack/jack_mist.vpcf",PATTACH_ABSORIGIN_FOLLOW,self.parent)
                ParticleManager:SetParticleControl(self.particle,1,Vector(self.radius,self.radius,self.radius))
            end
        else
            if self.particle ~= nil then
                ParticleManager:DestroyParticle(self.particle, false)
                ParticleManager:ReleaseParticleIndex(self.particle)
                self.particle = nil
            end
        end
    else
        self.aura = false
        if self.particle ~= nil then
            ParticleManager:DestroyParticle(self.particle, false)
            ParticleManager:ReleaseParticleIndex(self.particle)
            self.particle = nil
        end
    end
end

-- function modifier_jack_the_mist_aura:SetActive(active)
--     if active then
--         self:RefreshRadius(self.radius_active)
--     else
--         self:RefreshRadius(self.radius_normal)
--     end

-- end

function modifier_jack_the_mist_aura:RefreshRadius(radius)
    self.radius = radius
    if self.particle ~= nil then
        ParticleManager:DestroyParticle(self.particle, false)
        ParticleManager:ReleaseParticleIndex(self.particle)
        self.particle = ParticleManager:CreateParticle("particles/heroes/jack/jack_mist.vpcf",PATTACH_ABSORIGIN_FOLLOW,self.parent)
        ParticleManager:SetParticleControl(self.particle,1,Vector(self.radius,self.radius,self.radius))
    end
end

function modifier_jack_the_mist_aura:IsAura() return self.aura end

function modifier_jack_the_mist_aura:GetAuraRadius()return self.radius end

function modifier_jack_the_mist_aura:GetAuraSearchTeam()		return DOTA_UNIT_TARGET_TEAM_BOTH end
function modifier_jack_the_mist_aura:GetAuraSearchType()		return DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO end

function modifier_jack_the_mist_aura:GetAuraEntityReject(hEntity)
     return hEntity ~= self.caster and hEntity:GetTeamNumber() == self.caster:GetTeamNumber()
end

function modifier_jack_the_mist_aura:GetModifierAura()		return "modifier_jack_murderer_of_the_misty_night" end
function modifier_jack_the_mist_aura:OnDestroy()
    ParticleManager:DestroyParticle(self.particle, false)
    ParticleManager:ReleaseParticleIndex(self.particle)
end

-- function modifier_jack_the_mist_cast:OnCreated(table)
--     if not IsServer() then return end
--     self.aura = self:GetParent():FindModifierByName("modifier_jack_the_mist_aura")
--     self.aura:SetActive(true)
-- end

-- function modifier_jack_the_mist_cast:OnDestroy()
--     if not IsServer() then return end
--     self.aura:SetActive(false)
-- end
