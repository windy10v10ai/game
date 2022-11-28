LinkLuaModifier("modifier_abyss_sword_hidden_sharp", "heroes/hero_abyss_sword/abyss_sword_hidden_sharp", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_abyss_sword_hidden_sharp_interval", "heroes/hero_abyss_sword/abyss_sword_hidden_sharp", LUA_MODIFIER_MOTION_NONE)
abyss_sword_hidden_sharp = abyss_sword_hidden_sharp or class({})
modifier_abyss_sword_hidden_sharp = modifier_abyss_sword_hidden_sharp or class({})
modifier_abyss_sword_hidden_sharp_interval = modifier_abyss_sword_hidden_sharp_interval or class({})

function abyss_sword_hidden_sharp:OnSpellStart()
    self.time = 0
    self.attack_bounts = self:GetSpecialValueFor("attack_bounts")
    self.caster = self:GetCaster()
    self.duration = self:GetSpecialValueFor("duration")
    self.attack_times = self:GetSpecialValueFor("attack_times")
    self.caster:AddNewModifier(self.caster,self,"modifier_abyss_sword_hidden_sharp",{duration = self.duration,bonus = self.attack_bounts,times = self.attack_times,second = self.time})
    self.caster:AddNewModifier(self.caster,self,"modifier_abyss_sword_hidden_sharp_interval",{duration = self:GetSpecialValueFor("channel"),times = self.attack_times,buff_duration = self.duration,bonus = self.attack_bounts})
    EmitAnnouncerSoundForPlayer("npc_dota_hero_visage.vo.HiddenSharp.Cast", self.caster:GetPlayerOwnerID())
end

function abyss_sword_hidden_sharp:GetBehavior()
    if self:GetCaster():HasScepter() then
		return DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_IMMEDIATE
	else
		return self.BaseClass.GetBehavior(self)
	end
end

function abyss_sword_hidden_sharp:GetCastAnimation()
    if not self:GetCaster():HasScepter() then
		return ACT_DOTA_CHANNEL_ABILITY_1
	end
end

function abyss_sword_hidden_sharp:GetChannelTime()
    local caster = self:GetCaster()
    if caster:HasScepter() then
        return 0
    else
        return self:GetSpecialValueFor("channel")
    end
end

function abyss_sword_hidden_sharp:OnChannelFinish(interrupted)
    if self.caster:HasModifier("modifier_abyss_sword_hidden_sharp_interval") then
        self.caster:RemoveModifierByName("modifier_abyss_sword_hidden_sharp_interval")
    end
end

-- function abyss_sword_hidden_sharp:OnChannelThink(interval)
--     self.time = self.time + interval
--     self.modifier = self.caster:AddNewModifier(self.caster,self,"modifier_abyss_sword_hidden_sharp",{duration = self.duration,bonus = self.attack_bounts,times = self.attack_times,second = self.time})
-- end

function modifier_abyss_sword_hidden_sharp_interval:OnCreated(keys)
    self.time = 0
    self.tick = 0.1
    self.bonus = keys.bonus
    self.buff_duration = keys.buff_duration
    self.times = keys.times
    self.movespeed = self:GetAbility():GetSpecialValueFor("scepter_movespeed")
    if IsServer() then
        self:GetCaster():AddActivityModifier("ability3")
        self:GetCaster():EmitSound("Hero_Abyss_Sword.HiddenSharp.Cast")
        self:StartIntervalThink(self.tick)
    end
end

function modifier_abyss_sword_hidden_sharp_interval:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_abyss_sword_hidden_sharp_interval:OnDestroy()
    if IsServer() then
        self:OnIntervalThink()
        self:GetCaster():ClearActivityModifiers()
    end
end

function modifier_abyss_sword_hidden_sharp_interval:OnIntervalThink()
    if not IsServer() then return end
    self.time = self.time + self.tick
    self:GetCaster():AddNewModifier(self.caster,self,"modifier_abyss_sword_hidden_sharp",{duration = self.buff_duration,times = self.times,bonus = self.bonus,second = self.time})
end

function modifier_abyss_sword_hidden_sharp_interval:CheckState()
    return {[MODIFIER_STATE_MAGIC_IMMUNE] = true}
end

function modifier_abyss_sword_hidden_sharp_interval:DeclareFunctions()
    if self:GetCaster():HasScepter() then
        return {MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE_MIN}
    end
end

function modifier_abyss_sword_hidden_sharp_interval:GetEffectName()
    return "particles/custom/sword_spirit/abyss_sword_hidden_sharp_scepter.vpcf"
end

function modifier_abyss_sword_hidden_sharp_interval:GetModifierMoveSpeed_AbsoluteMin()
   return self:GetAbility():GetSpecialValueFor("scepter_movespeed")
end

function modifier_abyss_sword_hidden_sharp:AddCustomTransmitterData()
    return {
        bonus = self.bonus,
        second = self.second
    }
end

function modifier_abyss_sword_hidden_sharp:HandleCustomTransmitterData(keys)
    self.bonus = keys.bonus
    self.second = keys.second
end


function modifier_abyss_sword_hidden_sharp:OnCreated(keys)
    if IsServer() then
        self.second = keys.second
        self.bonus = keys.bonus * self.second
        if not self:GetCaster():HasScepter() then
            self:SetStackCount(keys.times)
        end
    end
    self:SetHasCustomTransmitterData(true)
    if not self.particle then
        self.particle = ParticleManager:CreateParticle("particles/custom/sword_spirit/abyss_sword_hidden_sharp_buff.vpcf",PATTACH_ABSORIGIN_FOLLOW,self:GetParent())
    end
    if self.particle then
        ParticleManager:SetParticleControl(self.particle,1,Vector(self.second * 10,0,0))
    end
end

function modifier_abyss_sword_hidden_sharp:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_abyss_sword_hidden_sharp:OnDestroy()
    ParticleManager:DestroyParticle(self.particle,false)
    ParticleManager:ReleaseParticleIndex(self.particle)
end


function modifier_abyss_sword_hidden_sharp:DeclareFunctions()
    local funcs
    if not self:GetCaster():HasScepter() then
        funcs = {
            MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
            MODIFIER_EVENT_ON_ATTACK_LANDED
        }
    else
        funcs = {
            MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE
        }
    end
    return funcs
end

function modifier_abyss_sword_hidden_sharp:GetModifierBaseDamageOutgoing_Percentage(keys)
    return self.bonus
end

function modifier_abyss_sword_hidden_sharp:OnAttackLanded(keys)
    local parent = self:GetParent()
    local ability = self:GetAbility()
    if keys.attacker == parent then
        if not parent:HasModifier("modifier_abyss_sword_rush_night_sword_qi") then
            self:DecrementStackCount()
            if self:GetStackCount() <= 0 then
                self:Destroy()
            end
        end
    end
end



