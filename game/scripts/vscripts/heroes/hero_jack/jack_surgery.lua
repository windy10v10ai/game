LinkLuaModifier("modifier_jack_surgery", "heroes/hero_jack/jack_surgery", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_jack_surgery_target", "heroes/hero_jack/jack_surgery", LUA_MODIFIER_MOTION_NONE)

jack_surgery = jack_surgery or class({})
modifier_jack_surgery = modifier_jack_surgery or class({})
modifier_jack_surgery_target = modifier_jack_surgery_target or class({})

function jack_surgery:GetIntrinsicModifierName()
    return "modifier_jack_surgery"
end

function modifier_jack_surgery:OnCreated()
    if not IsServer() then return end
    self.countTable = {}
    self:StartIntervalThink(0.1)
end

function modifier_jack_surgery:OnIntervalThink()
    if not IsServer() then return end
    local count = 0
    for key, value in pairs(self.countTable) do
        count = count + value
    end
    self:SetStackCount(count)
end


function modifier_jack_surgery:DeclareFunctions()
    local funcs = {
        MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET,
        MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE
    }
    return funcs
end

function modifier_jack_surgery:OnAttackLanded(keys)
    local parent = self:GetParent()
    if not keys.target:IsHero() then return end
    if keys.attacker == parent then
        local ability = self:GetAbility()
        local duration = ability:GetSpecialValueFor("duration")
        local modi =  keys.target:AddNewModifier(parent, ability, "modifier_jack_surgery_target", {duration = duration})
        if parent:HasModifier("modifier_jack_murderer_of_the_misty_night") and parent:HasModifier("modifier_jack_presence_concealment_invision") then
            for i = 1, ability:GetSpecialValueFor("max_count"), 1 do
                modi:OnRefresh()
            end
        end
    end
end

function modifier_jack_surgery:GetModifierHealAmplify_PercentageTarget()
    return self:GetStackCount() * self:GetAbility():GetSpecialValueFor("heal_down")
end

function modifier_jack_surgery:GetModifierHPRegenAmplify_Percentage()
    return self:GetStackCount() * self:GetAbility():GetSpecialValueFor("regen_down")
end

function modifier_jack_surgery:GetModifierLifestealRegenAmplify_Percentage()
    return self:GetStackCount() * self:GetAbility():GetSpecialValueFor("attack_lifesteal_down")
end

function modifier_jack_surgery:GetModifierSpellLifestealRegenAmplify_Percentage()
    return self:GetStackCount() * self:GetAbility():GetSpecialValueFor("spell_lifesteal_down")
end




function modifier_jack_surgery_target:OnCreated(table)
    local ability = self:GetAbility()
    local caster = self:GetCaster()
    local parent = self:GetParent()
    self.maxcount = ability:GetSpecialValueFor("max_count")
    self.heal_down = -ability:GetSpecialValueFor("heal_down")
    self.regen_down = -ability:GetSpecialValueFor("regen_down")
    self.attack_lifesteal_down = -ability:GetSpecialValueFor("attack_lifesteal_down")
    self.spell_lifesteal_down = -ability:GetSpecialValueFor("spell_lifesteal_down")
    if not IsServer() then return end
    if self:GetStackCount() < self.maxcount then
        self:IncrementStackCount()
    end

    if self:GetStackCount() >= 5 and self.particle == nil then
        self.particle = ParticleManager:CreateParticle("particles/generic_gameplay/generic_break.vpcf", PATTACH_OVERHEAD_FOLLOW, parent)
        self:AddParticle(self.particle,false, false, -1, false, false )
        parent:PlayVoice("npc_dota_hero_brewmaster.vo.Surgery.Cast")
    end

    local modi_caster = caster:FindModifierByName("modifier_jack_surgery")
    if modi_caster ~= nil then
        modi_caster.countTable[self:GetParent():GetEntityIndex()] = self:GetStackCount()
    end
end

function modifier_jack_surgery_target:OnRefresh(table)
    self:OnCreated(table)
end

function modifier_jack_surgery_target:DeclareFunctions()
    local funcs = {
        MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET,
        MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE
    }
    return funcs
end

function modifier_jack_surgery_target:CheckState()
    if self:GetStackCount() == self.maxcount then
        return {[MODIFIER_STATE_PASSIVES_DISABLED] = true}
    end
end


function modifier_jack_surgery_target:GetModifierHealAmplify_PercentageTarget()
    return self:GetStackCount() * self.heal_down
end

function modifier_jack_surgery_target:GetModifierHPRegenAmplify_Percentage()
    return self:GetStackCount() * self.regen_down
end

function modifier_jack_surgery_target:GetModifierLifestealRegenAmplify_Percentage()
    return self:GetStackCount() * self.attack_lifesteal_down
end

function modifier_jack_surgery_target:GetModifierSpellLifestealRegenAmplify_Percentage()
    return self:GetStackCount() * self.spell_lifesteal_down
end

function modifier_jack_surgery_target:OnDestroy()
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_caster = caster:FindModifierByName("modifier_jack_surgery")
    if modi_caster ~= nil then
        modi_caster.countTable[self:GetParent():GetEntityIndex()] = nil
    end
end
