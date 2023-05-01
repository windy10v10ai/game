LinkLuaModifier("modifier_sword_master_chop_attack_bonus","Heroes/sword_master/sword_master_chop.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_chop_magic_immune","Heroes/sword_master/sword_master_chop.lua", LUA_MODIFIER_MOTION_NONE)
sword_master_chop = sword_master_chop or class({})
modifier_sword_master_chop_attack_bonus = modifier_sword_master_chop_attack_bonus or class({})
modifier_sword_master_chop_magic_immune = modifier_sword_master_chop_magic_immune or class({})

function sword_master_chop:Spawn()
    self.comboTable =
    {
        [0] = "sword_master_chop_kill_with_one_sword",
        [1] = "sword_master_chop_kill_everyone_in_world",
        [2] = "sword_master_chop_swift_incomparable_swordsmanship",
        [3] = "sword_master_chop_rage_nlade_soars_the_sky",
    }

    if not IsServer() then return end
    self:SetActivated(false)
    local caster = self:GetCaster()
    caster:AddNewModifier(caster, self, "modifier_sword_master_chop_attack_bonus", {})
end

function sword_master_chop:AddMagicImmune()
    local caster = self:GetCaster()
    caster:AddNewModifier(caster, self, "modifier_sword_master_chop_magic_immune", {})
end

function sword_master_chop:RemoveMagicImmune()
    local caster = self:GetCaster()
    caster:RemoveModifierByName("modifier_sword_master_chop_magic_immune")
end

function sword_master_chop:SetUltimateType(active)
    local caster = self:GetCaster()
    local active_ability_name = caster:GetAbilityByIndex(5):GetName()
    if active then
        local type = 0
        if caster:HasModifier("modifier_sword_master_sweep_count") then
            type = 1
        elseif caster:HasModifier("modifier_sword_master_thrust_count") then
            type = 2
        elseif caster:HasModifier("modifier_sword_master_tap_count") then
            type = 3
        end

        local change_ability = self.comboTable[type]
        if change_ability ~= nil then
            caster:SwapAbilities(active_ability_name, change_ability, false, true)
        else
            if active_ability_name ~= "sword_master_chop_kill_with_one_sword" then
                caster:SwapAbilities(active_ability_name, "sword_master_chop_kill_with_one_sword", false, true)
            end
        end
    else
        caster:RemoveAllModifiersOfName("modifier_sword_master_sweep_count")
        caster:RemoveAllModifiersOfName("modifier_sword_master_tap_count")
        caster:RemoveAllModifiersOfName("modifier_sword_master_thrust_count")
        if active_ability_name ~= "sword_master_chop_kill_with_one_sword" then
            caster:SwapAbilities(active_ability_name, "sword_master_chop_kill_with_one_sword", false, true)
        end
    end
end

function sword_master_chop:AddIntrinsicModifierCount()
    local caster = self:GetCaster()
    caster:AddNewModifier(caster, self, "modifier_sword_master_chop_attack_bonus", {})
end

function sword_master_chop:ChopAttack(attacker,target)
    attacker.chop_attack = true
    attacker:PerformAttack(target, true, true, true, true, false, false, true)
    attacker.chop_attack = nil
end

function modifier_sword_master_chop_attack_bonus:RemoveOnDeath() return false end
function modifier_sword_master_chop_attack_bonus:IsPurgeException() return false end
function modifier_sword_master_chop_attack_bonus:IsPurgable() return false end
function modifier_sword_master_chop_attack_bonus:IsHidden() return self:GetStackCount() == 0 end

function modifier_sword_master_chop_attack_bonus:OnRefresh(table)
    if not IsServer() then return end
    self:IncrementStackCount()
end

function modifier_sword_master_chop_attack_bonus:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_EVENT_ON_ABILITY_FULLY_CAST,
        MODIFIER_EVENT_ON_HERO_KILLED
    }
end

function modifier_sword_master_chop_attack_bonus:GetModifierPreAttack_BonusDamage()
    return self:GetStackCount() * self:GetAbility():GetSpecialValueFor("damage_stack")
end

function modifier_sword_master_chop_attack_bonus:OnAbilityFullyCast(keys)
    if not IsServer() then return end
    if keys.unit == self:GetParent() then
        local ability = self:GetAbility()
        if table.contains(ability.comboTable,keys.ability:GetName()) then
            ability:SetUltimateType(false)
        end
    end
end

function modifier_sword_master_chop_attack_bonus:OnHeroKilled(keys)
    if not IsServer() then return end
    local parent = self:GetParent()
    if keys.attacker == parent then
        local ability = self:GetAbility()
        if keys.inflictor ~= nil then
            if table.contains(ability.comboTable,keys.inflictor:GetName()) then
                ability:AddIntrinsicModifierCount()
            end

        else
            if parent.chop_attack then
                ability:AddIntrinsicModifierCount()
            end
        end
    end
end

function modifier_sword_master_chop_magic_immune:IsHidden() return true end
function modifier_sword_master_chop_magic_immune:IsPurgeException() return false end
function modifier_sword_master_chop_magic_immune:IsPurgable() return false end
function modifier_sword_master_chop_magic_immune:CheckState()
    return {[MODIFIER_STATE_MAGIC_IMMUNE] = true}
end
