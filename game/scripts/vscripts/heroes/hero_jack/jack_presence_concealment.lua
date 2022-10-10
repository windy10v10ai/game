LinkLuaModifier("modifier_jack_presence_concealment", "heroes/hero_jack/jack_presence_concealment", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_presence_concealment_invision", "heroes/hero_jack/jack_presence_concealment", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_presence_concealment_damage", "heroes/hero_jack/jack_presence_concealment", LUA_MODIFIER_MOTION_NONE)

jack_presence_concealment = jack_presence_concealment or class({})
modifier_jack_presence_concealment = modifier_jack_presence_concealment or class({})
modifier_jack_presence_concealment_invision = modifier_jack_presence_concealment_invision or class({})
modifier_jack_presence_concealment_damage = modifier_jack_presence_concealment_damage or class({})

function jack_presence_concealment:Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_phantom_assassin.vsndevts",context)
end

function jack_presence_concealment:GetBehavior()
	if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
        return DOTA_ABILITY_BEHAVIOR_IMMEDIATE + DOTA_ABILITY_BEHAVIOR_UNRESTRICTED + DOTA_ABILITY_BEHAVIOR_IGNORE_PSEUDO_QUEUE + DOTA_ABILITY_BEHAVIOR_NO_TARGET
	else
        return self.BaseClass.GetBehavior(self)
	end
end

function jack_presence_concealment:CastFilterResult()
    if not IsServer() then return end
    local caster = self:GetCaster()

    if GameRules:IsDaytime() and not caster:HasModifier("modifier_jack_murderer_of_the_misty_night") then
        return UF_FAIL_CUSTOM
    end

    return UF_SUCCESS
end

function jack_presence_concealment:GetCustomCastError()
    return "只能在晚上或者迷雾中使用"
end

function jack_presence_concealment:OnSpellStart()
    local caster = self:GetCaster()
    caster:Purge(false, true, false, true, true)

    if IsServer() then
        caster:EmitSound("Hero_PhantomAssassin.Blur")
        local particle_start = ParticleManager:CreateParticle("particles/heroes/jack/jack_presence_concealment_start.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
        ParticleManager:DestroyParticle(particle_start, false)
    end

    local modifier = caster:FindModifierByName("modifier_jack_presence_concealment")
    if modifier then
        modifier.active = true
        local modifier2 = caster:FindModifierByName("modifier_jack_presence_concealment_invision")
        if modifier2 then
            modifier2:SetDuration(-1, true)
        else
            caster:AddNewModifier(caster, self, "modifier_jack_presence_concealment_invision", {})
        end
    end

    caster:PlayVoice("npc_dota_hero_brewmaster.vo.PresenceConcealment.Cast")
end

function jack_presence_concealment:GetIntrinsicModifierName()
    return "modifier_jack_presence_concealment"
end

function modifier_jack_presence_concealment:IsHidden() return true end

function modifier_jack_presence_concealment:OnCreated(table)
    self.parent = self:GetParent()
    if not IsServer() then return end
    local ability = self:GetAbility()
    self.tick = 0.5
    self.active = false
    self.activeDay = false
    self.invis_time = 0
    self.in_invis_time = ability:GetSpecialValueFor("invision_time")
    self:StartIntervalThink(self.tick)
end

function modifier_jack_presence_concealment:OnIntervalThink()
    local ability = self:GetAbility()
    self.in_invis_time = ability:GetSpecialValueFor("invision_time")
    local activeDay = GameRules:IsDaytime()

    if self.activeDay ~= activeDay then
        self.activeDay = activeDay
        if not self.activeDay then
            self.parent:PlayVoice("npc_dota_hero_brewmaster.vo.PresenceConcealment.ToNight")
        end
    end

    local hasmodifier = false
    if self.parent:HasModifier("modifier_jack_murderer_of_the_misty_night") then
        hasmodifier = true
    end

    local active = false
    if activeDay and not hasmodifier then
        active = false
        self.parent:RemoveModifierByName("modifier_jack_presence_concealment_invision")
        self.invis_time = 0
        self.active = false
    else
        active = true
    end

    if active == true and self.active == false then
        if self.invis_time < self.in_invis_time then
            self.invis_time = self.invis_time + self.tick
        else
            self.active = true
            self.parent:AddNewModifier(self.parent, ability, "modifier_jack_presence_concealment_invision", {})
        end
    end
end

function modifier_jack_presence_concealment:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACKED,
        MODIFIER_EVENT_ON_HERO_KILLED
    }
end

function modifier_jack_presence_concealment:OnAttacked(keys)
    if keys.attacker == self.parent then
        self:RemoveInvision()
        if not keys.no_attack_cooldown then
            local chance = self:GetAbility():GetSpecialValueFor("talent_chance")
            if RollPseudoRandomPercentage(chance,DOTA_PSEUDO_RANDOM_CUSTOM_GAME_1, self.parent) then
                Timers:CreateTimer(0.2, function()
                    self.parent:PerformAttack(keys.target, true, true, true, true, false, false, true)
                end)
            end
        end
    end
end

function modifier_jack_presence_concealment:OnHeroKilled(keys)
    local parent = self:GetParent()
    if parent:HasModifier("modifier_item_aghanims_shard") and keys.unit == parent then
        self:GetAbility():EndCooldown()
    end
end

function modifier_jack_presence_concealment:RemoveInvision()
    if self.parent:HasModifier("modifier_jack_presence_concealment_invision") then
        local duration = self:GetAbility():GetSpecialValueFor("dmg_add_time")
        self.parent:RemoveModifierByName("modifier_jack_presence_concealment_invision")
        self.parent:AddNewModifier(self.parent,self:GetAbility(), "modifier_jack_presence_concealment_damage", {duration = duration})
    end
    self.invis_time = 0
    self.active = false
end


function modifier_jack_presence_concealment_invision:GetTexture()
    return "heroes/jack/jack_presence_concealment"
end

function modifier_jack_presence_concealment_invision:OnCreated(keys)
    self.parent = self:GetParent()
    if not IsServer() then return end
    self.parent:EmitSound("Hero_PhantomAssassin.Blur")
    local particle_start = ParticleManager:CreateParticle("particles/heroes/jack/jack_presence_concealment_start.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent )
    ParticleManager:DestroyParticle(particle_start, false)

    local particle_state = ParticleManager:CreateParticle("particles/heroes/jack/jack_presence_concealment.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent )
	self:AddParticle(particle_state,false, false, -1, false, false )
end

function modifier_jack_presence_concealment_invision:OnRefresh(keys)
	self:OnCreated(keys)
end

function modifier_jack_presence_concealment_invision:OnDestroy()
    if not IsServer() then return end
    self.parent:EmitSound("Hero_PhantomAssassin.Blur.Break")
end

function modifier_jack_presence_concealment_invision:CheckState()
    local status = {[MODIFIER_STATE_INVISIBLE] = true}
    if self:GetParent():HasModifier("modifier_jack_murderer_of_the_misty_night") then
        status[MODIFIER_STATE_TRUESIGHT_IMMUNE] = true
    end
    return status
end

function modifier_jack_presence_concealment_invision:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_TRANSLATE_ACTIVITY_MODIFIERS,
        MODIFIER_PROPERTY_INVISIBILITY_LEVEL,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE
        }
end

function modifier_jack_presence_concealment_invision:GetActivityTranslationModifiers()
	return "ability1"
end

function modifier_jack_presence_concealment_invision:GetModifierInvisibilityLevel()
    return 1
end

function modifier_jack_presence_concealment_invision:GetModifierMoveSpeedBonus_Percentage()
    return self:GetAbility():GetSpecialValueFor("movespeed_add")
end

function modifier_jack_presence_concealment_invision:GetModifierPreAttack_BonusDamage(keys)
    return self:GetCaster():GetAgility() * self:GetAbility():GetSpecialValueFor("dmg_add_agility")
end


function modifier_jack_presence_concealment_damage:DeclareFunctions()
    return {MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE}
end

function modifier_jack_presence_concealment_damage:GetModifierPreAttack_BonusDamage(keys)
    return self:GetCaster():GetAgility() * self:GetAbility():GetSpecialValueFor("dmg_add_agility")
end
