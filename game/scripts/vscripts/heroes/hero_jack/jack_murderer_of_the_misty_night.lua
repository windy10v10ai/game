LinkLuaModifier("modifier_jack_murderer_of_the_misty_night", "Heroes/jack/jack_murderer_of_the_misty_night", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_murderer_of_the_misty_night_aura", "heroes/hero_jack/jack_murderer_of_the_misty_night", LUA_MODIFIER_MOTION_NONE)

jack_murderer_of_the_misty_night = jack_murderer_of_the_misty_night or class({})
modifier_jack_murderer_of_the_misty_night = modifier_jack_murderer_of_the_misty_night or class({})
modifier_jack_murderer_of_the_misty_night_aura = modifier_jack_murderer_of_the_misty_night_aura or class({})

function jack_murderer_of_the_misty_night:Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_drowranger.vsndevts",context)
end

function jack_murderer_of_the_misty_night:GetAOERadius()
    return self:GetSpecialValueFor("radius")
end

function jack_murderer_of_the_misty_night:OnSpellStart()
    local caster = self:GetCaster()
    local location = self:GetCursorPosition()
    local duration = self:GetSpecialValueFor("duration")
    self:CastToLocation(location,duration)

    caster:PlayVoice("npc_dota_hero_brewmaster.vo.MurdererOfTheMistyNight.Cast")
end

function jack_murderer_of_the_misty_night:CastToLocation(location,duration)
    local caster = self:GetCaster()
    CreateModifierThinker(caster , self, "modifier_jack_murderer_of_the_misty_night_aura", {duration = duration}, location, caster:GetTeamNumber(), false)
end


function modifier_jack_murderer_of_the_misty_night_aura:OnCreated()
    local ability = self:GetAbility()
    self.caster = self:GetCaster()
    self.parent = self:GetParent()
    self.parent.move_speed_down = -ability:GetSpecialValueFor("movespeed_down")
    self.parent.attack_speed_down = -ability:GetSpecialValueFor("attackspeed_down")
    self.parent.turn_rate_down = -ability:GetSpecialValueFor("turnrate_down")
    self.parent.vision_range_down = -ability:GetSpecialValueFor("visionrange_down")
    self.radius = ability:GetSpecialValueFor("radius")
    if not IsServer() then return end
    self.parent:EmitSound("Hero_DrowRanger.Silence")
    local particle = ParticleManager:CreateParticle("particles/heroes/jack/jack_mist.vpcf",PATTACH_ABSORIGIN_FOLLOW,self.parent)
    ParticleManager:SetParticleControl(particle,1,Vector(self.radius,self.radius,self.radius))
    self:AddParticle(particle,false, false, -1, false, false )
end

function modifier_jack_murderer_of_the_misty_night_aura:OnDestroy()

end



function modifier_jack_murderer_of_the_misty_night_aura:IsAura() 				return true end

function modifier_jack_murderer_of_the_misty_night_aura:GetAuraRadius()			return self.radius end

function modifier_jack_murderer_of_the_misty_night_aura:GetAuraSearchTeam()		return DOTA_UNIT_TARGET_TEAM_BOTH end
function modifier_jack_murderer_of_the_misty_night_aura:GetAuraSearchType()		return DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO end

function modifier_jack_murderer_of_the_misty_night_aura:GetAuraEntityReject(hEntity)
     return hEntity ~= self.caster and hEntity:GetTeamNumber() == self.caster:GetTeamNumber()
end

function modifier_jack_murderer_of_the_misty_night_aura:GetModifierAura()		return "modifier_jack_murderer_of_the_misty_night" end

function modifier_jack_murderer_of_the_misty_night:GetTexture()
    return "heroes/jack/jack_murderer_of_the_misty_night"
end

function modifier_jack_murderer_of_the_misty_night:OnCreated(keys)
    if not IsServer() then return end
    self.owner = self:GetAuraOwner()
    self.move_speed_down = self.owner.move_speed_down
    self.attack_speed_down = self.owner.attack_speed_down
    self.turn_rate_down = self.owner.turn_rate_down
    self.vision_range_down = self.owner.vision_range_down
    self:SetHasCustomTransmitterData(true)
    -- self:SendBuffRefreshToClients()
end

function modifier_jack_murderer_of_the_misty_night:OnRefresh(keys)
    if not IsServer() then return end
    self.owner = self:GetAuraOwner()
    self.move_speed_down = self.owner.move_speed_down
    self.attack_speed_down = self.owner.attack_speed_down
    self.turn_rate_down = self.owner.turn_rate_down
    self.vision_range_down = self.owner.vision_range_down
    self:SendBuffRefreshToClients()
end


function modifier_jack_murderer_of_the_misty_night:AddCustomTransmitterData()
    return {
        move_speed_down = self.move_speed_down,
        attack_speed_down = self.attack_speed_down,
        turn_rate_down = self.turn_rate_down,
        vision_range_down = self.vision_range_down,
    }
end

function modifier_jack_murderer_of_the_misty_night:HandleCustomTransmitterData(keys)
    self.move_speed_down = keys.move_speed_down
    self.attack_speed_down = keys.attack_speed_down
    self.turn_rate_down = keys.turn_rate_down
    self.vision_range_down = keys.vision_range_down
end

function modifier_jack_murderer_of_the_misty_night:CheckState()
    if self:GetParent() == self:GetCaster() then
        return{[MODIFIER_STATE_INVISIBLE] = true}
    end
end

function modifier_jack_murderer_of_the_misty_night:DeclareFunctions()
    if self:GetParent() ~= self:GetCaster() then
        return {
            MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
            MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE,
            MODIFIER_PROPERTY_BONUS_VISION_PERCENTAGE
        }
    else
        return {
            MODIFIER_PROPERTY_INVISIBILITY_LEVEL
        }
    end
end

function modifier_jack_murderer_of_the_misty_night:GetModifierMoveSpeedBonus_Percentage()
    return self.move_speed_down
end

function modifier_jack_murderer_of_the_misty_night:GetModifierAttackSpeedBonus_Constant()
    return self.attack_speed_down
end

function modifier_jack_murderer_of_the_misty_night:GetModifierTurnRate_Percentage()
    return self.turn_rate_down
end

function modifier_jack_murderer_of_the_misty_night:GetBonusVisionPercentage()
    return self.vision_range_down
end

function modifier_jack_murderer_of_the_misty_night:GetModifierInvisibilityLevel()
    return 1
end
