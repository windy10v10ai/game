LinkLuaModifier("modifier_sword_master_arbiter","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_arbiter_count","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_arbiter_quick_attack","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_arbiter_silence_and_mute","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_arbiter_resistance","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_arbiter_no_heal","Heroes/sword_master/sword_master_arbiter.lua", LUA_MODIFIER_MOTION_NONE)

sword_master_arbiter = sword_master_arbiter or class({})
modifier_sword_master_arbiter = modifier_sword_master_arbiter or class({})
modifier_sword_master_arbiter_count = modifier_sword_master_arbiter_count or class({})
modifier_sword_master_arbiter_quick_attack = modifier_sword_master_arbiter_quick_attack or class({})
modifier_sword_master_arbiter_silence_and_mute = modifier_sword_master_arbiter_silence_and_mute or class({})
modifier_sword_master_arbiter_resistance = modifier_sword_master_arbiter_resistance or class({})
modifier_sword_master_arbiter_no_heal = modifier_sword_master_arbiter_no_heal or class({})

function sword_master_arbiter:IsStealable() return false end
function sword_master_arbiter:Spawn()
    if not IsServer() then return end
    if self:GetLevel() ~= 1 then
        self:SetLevel(1)
    end

    local caster = self:GetCaster()
    if not caster:HasModifier("modifier_sword_master_arbiter_count") then
        local maxcount = self:GetSpecialValueFor("max_charges")
        caster:AddNewModifier(caster, self, "modifier_sword_master_arbiter_count", {duration = -1,count = maxcount})
    end
end

function sword_master_arbiter:OnOwnerSpawned()
    local caster = self:GetCaster()
    if not caster:HasModifier("modifier_sword_master_arbiter_count") then
        local maxcount = self:GetSpecialValueFor("max_charges")
        caster:AddNewModifier(caster, self, "modifier_sword_master_arbiter_count", {duration = -1,count = maxcount})
    end
end

function sword_master_arbiter:OnStolen()
    if not IsServer() then return end
    local caster = self:GetCaster()

    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    if modi_count then
        modi_count:SetHidden(false)
    end
end

function sword_master_arbiter:OnUnStolen()
    if not IsServer() then return end
    local caster = self:GetCaster()

    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    if modi_count then
        modi_count:SetHidden(true)
    end
end

function sword_master_arbiter:OnInventoryContentsChanged()
	if not IsServer() then return end
    local caster = self:GetCaster()
    if caster:HasModifier("modifier_item_aghanims_shard") then
        local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
        if modi_count ~= nil then
            local max_charge = self:GetSpecialValueFor("max_charges")
            modi_count:SetMaxCharge(max_charge)
        end
    end
end

function sword_master_arbiter:OnHeroCalculateStatBonus()
	self:OnInventoryContentsChanged()
end

function sword_master_arbiter:OnHeroLevelUp()
    if self:GetCaster():GetLevel() == self:GetHeroLevelRequiredToUpgrade() then
        self:UpgradeAbility(false)
    end
end

function sword_master_arbiter:GetBehavior()
    if self:GetCaster():HasScepter() then
        return DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_IMMEDIATE
    end
    return self.BaseClass.GetBehavior(self)
end

function sword_master_arbiter:OnSpellStart()
    local caster = self:GetCaster()
    caster:StartGestureWithPlaybackRate(ACT_DOTA_OVERRIDE_ABILITY_4,2)
    local charge_add = self:GetSpecialValueFor("scepter_charge_add")
    local charge_max = self:GetMaxAbilityCharges(self:GetLevel())
    local charge_after = self:GetCurrentAbilityCharges() + charge_add

    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    modi_count:AddCharge(charge_add)
    if charge_after < charge_max then
        self:SetCurrentAbilityCharges(charge_after)
    else
        self:RefreshCharges()
    end
end

function sword_master_arbiter:GetIntrinsicModifierName()
	return "modifier_sword_master_arbiter"
end

function sword_master_arbiter:ArbiterAttack(attacker,target)
    attacker.arbiter_attack = true
    attacker:PerformAttack(target, false, false, true, true, false, false, true)
    attacker.arbiter_attack = nil
end

function modifier_sword_master_arbiter_count:IsHidden() return self.hidden end
function modifier_sword_master_arbiter_count:IsPurgable() return false end
function modifier_sword_master_arbiter_count:IsPurgeException() return false end

function modifier_sword_master_arbiter_count:OnCreated(table)
    if not IsServer() then return end
    self:SetStackCount(table.count)
    self:SetHasCustomTransmitterData(true)
end

function modifier_sword_master_arbiter_count:OnRemoved()
    if not IsServer() then return end
    local ability = self:GetAbility()
    if ability ~= nil then
        local cooldown = ability:GetSpecialValueFor("charge_restore")
        local count_max = ability:GetSpecialValueFor("max_charges")
        local count = self:GetStackCount() + 1
        if count >= count_max then
            count = count_max
            cooldown = -1
        end

        local modi = self:GetParent():AddNewModifier(self:GetCaster(), ability, "modifier_sword_master_arbiter_count", {duration = cooldown,count = count})
        if modi then
            modi:SetHidden(self.hidden)
        end
    end
end

function modifier_sword_master_arbiter_count:AddCustomTransmitterData()
    return {hidden = self.hidden}
end

function modifier_sword_master_arbiter_count:HandleCustomTransmitterData(keys)
    self.hidden = keys.hidden == 1
end

function modifier_sword_master_arbiter_count:SetHidden(hidden)
    self.hidden = hidden
    self:SendBuffRefreshToClients()
end

function modifier_sword_master_arbiter_count:CastCharge(count)
    if not IsServer() then return end
    local ability = self:GetAbility()
    local count_after = self:GetStackCount() - count
    if count_after < 0 then
        count_after = 0
    end
    self:SetStackCount(count_after)
    if self:GetRemainingTime() <= 0 then
        local cooldown = ability:GetSpecialValueFor("charge_restore")
        self:SetDuration(cooldown, true)
    end
    if ability:GetLevel() >= 2 then
        local caster = self:GetCaster()
        caster:AddNewModifier(caster, ability, "modifier_sword_master_arbiter_quick_attack", {})
    end
end

function modifier_sword_master_arbiter_count:AddCharge(count)
    if not IsServer() then return end
    local ability = self:GetAbility()
    local count_max = ability:GetSpecialValueFor("max_charges")
    local count_after = self:GetStackCount() + count
    if count_after < count_max then
        self:SetStackCount(count_after)
    else
        self:SetStackCount(count_max)
        self:SetDuration(-1, true)
    end
end

function modifier_sword_master_arbiter_count:SetMaxCharge(count)
    if not IsServer() then return end
    local ability = self:GetAbility()
    local active_count = self:GetStackCount()
    if count > active_count then
        local remaining_time = self:GetRemainingTime()
        if remaining_time <= 0 then
            local cooldown = ability:GetSpecialValueFor("charge_restore")
            self:SetDuration(cooldown, true)
        end
    else
        self:SetStackCount(count)
        self:SetDuration(-1, true)
    end
end

function modifier_sword_master_arbiter:IsHidden() return true end
function modifier_sword_master_arbiter:RemoveOnDeath() return false end
function modifier_sword_master_arbiter:IsPurgable() return false end
function modifier_sword_master_arbiter:IsPurgeException() return false end
function modifier_sword_master_arbiter:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_HERO_KILLED,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_EVENT_ON_HERO_KILLED
    }
end

function modifier_sword_master_arbiter:OnTakeDamage(keys)

    local parent = self:GetParent()
    if keys.attacker == parent then
        if parent.arbiter_attack then
            local ability = self:GetAbility()
            local target = keys.unit
            if ability:GetLevel() >= 4 then
                local duration = ability:GetSpecialValueFor("lv4_duration")
                target:AddNewModifier(parent, ability, "modifier_sword_master_arbiter_no_heal", {duration = duration})
            end

            if ability:GetLevel() >= 5 then
                local modis = target:FindAllModifiers()
                target:Purge(true, false, false, false, true)
                Timers:CreateTimer(FrameTime(),function ()
                    for _, modi in ipairs(modis) do
                        if modi:IsNull() then
                            local duration = ability:GetSpecialValueFor("lv5_duration")
                            target:AddNewModifier(parent, ability, "modifier_sword_master_arbiter_silence_and_mute", {duration = duration})
                            break
                        end
                    end
                end)
            end

            local talent5_heal = ability:GetSpecialValueFor("talent_heal") / 100
            local heal = talent5_heal * keys.damage
            parent:HealWithParams(heal, ability, false, true, parent, false)
            SendOverheadEventMessage(parent, OVERHEAD_ALERT_HEAL, parent, heal, nil)
        end
    end
end

function modifier_sword_master_arbiter:OnHeroKilled(keys)

    local parent = self:GetParent()
    if keys.attacker == parent then
        local ability = self:GetAbility()
        if ability:GetLevel() >= 3 then
            local modi_count = parent:FindModifierByName("modifier_sword_master_arbiter_count")
            if modi_count then
                local count = ability:GetSpecialValueFor("lv3_charge_regen")
                modi_count:AddCharge(count)
            end
        end

        if ability:GetLevel() >= 6 then
            local duration = ability:GetSpecialValueFor("lv6_duration")
            parent:Purge(false, true, false, true, true)
            parent:AddNewModifier(parent, ability, "modifier_sword_master_arbiter_resistance", {duration = duration})
        end
    end

end


function modifier_sword_master_arbiter_quick_attack:IsPurgable() return false end
function modifier_sword_master_arbiter_quick_attack:IsPurgeException() return false end
function modifier_sword_master_arbiter_quick_attack:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_EVENT_ON_ATTACK_LANDED
}
end

function modifier_sword_master_arbiter_quick_attack:GetModifierAttackSpeedBonus_Constant()
    return 2000
end

function modifier_sword_master_arbiter_quick_attack:OnAttackLanded(keys)
    local parent = self:GetParent()
    if keys.attacker == parent then
        if not parent.chop_attack then
            self:Destroy()
        end
    end
end

function modifier_sword_master_arbiter_silence_and_mute:CheckState()
    return {
        [MODIFIER_STATE_SILENCED ] = true,
        [MODIFIER_STATE_MUTED] = true
    }
end

function modifier_sword_master_arbiter_resistance:OnCreated(keys)
    local ability = self:GetAbility()
    self.status_resistance = ability:GetSpecialValueFor("lv6_status_resistance")
    self.damage_reduction = -ability:GetSpecialValueFor("lv6_damage_reduction")
end

function modifier_sword_master_arbiter_resistance:OnRefresh(keys)
    self:OnCreated(keys)
end

function modifier_sword_master_arbiter_resistance:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATUS_RESISTANCE,
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
    }
end

function modifier_sword_master_arbiter_resistance:GetModifierStatusResistance()
    return self.status_resistance
end

function modifier_sword_master_arbiter_resistance:GetModifierIncomingDamage_Percentage()
    return self.damage_reduction
end
