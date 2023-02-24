LinkLuaModifier("modifier_sword_master_tap_count","Heroes/sword_master/sword_master_tap.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_tap_damage_bonus","Heroes/sword_master/sword_master_tap.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_sword_master_tap_passives_disabled","Heroes/sword_master/sword_master_tap.lua", LUA_MODIFIER_MOTION_NONE)

sword_master_tap = sword_master_tap or class({})
modifier_sword_master_tap_count = modifier_sword_master_tap_count or class({})
modifier_sword_master_tap_damage_bonus = modifier_sword_master_tap_damage_bonus or class({})
modifier_sword_master_tap_passives_disabled = modifier_sword_master_tap_passives_disabled or class({})

function sword_master_tap:Precache(context)
	PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_beastmaster.vsndevts", context )
end

function sword_master_tap:Spawn()
    local caster = self:GetCaster()
    if caster.combos == nil then
        caster.combos = {}
    end
end


function sword_master_tap:CastFilterResultLocation()
    if not IsServer() then return end
    local caster = self:GetCaster()
    local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
    if modi_count and modi_count:GetStackCount() == 0 then
        return UF_FAIL_CUSTOM
    end

    return UF_SUCCESS
end

function sword_master_tap:GetCustomCastErrorLocation()
    return "执剑泰斗点数不足"
end

function sword_master_tap:OnSpellStart()
    local caster = self:GetCaster()
    self:AddTapCount()

    local width = self:GetSpecialValueFor("width")
    local length = self:GetSpecialValueFor("length")
    local stun_duration = self:GetSpecialValueFor("stun_duration")
    local startpoint = caster:GetAbsOrigin()
    local direction = (self:GetCursorPosition() - startpoint):Normalized()
    if direction:Length2D() == 0 then
        direction = caster:GetForwardVector()
    end
    local endpoint = startpoint + (direction * length)

    local targetFlag = DOTA_UNIT_TARGET_FLAG_NONE

    local talent6 = caster:FindAbilityByName("special_bonus_unique_sword_master_6")
    if talent6 ~= nil and talent6:GetLevel() ~= 0 then
        targetFlag = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
    end

    local enemies = FindUnitsInLine(
        caster:GetTeam(),
        startpoint,
        endpoint,
        nil,
        width,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        targetFlag
    )

    caster:AddNewModifier(caster, self, "modifier_sword_master_tap_damage_bonus", {})

    local talent_duration = self:GetSpecialValueFor("talent_duration")
    for _, enemy in ipairs(enemies) do
        local ability_arbiter = caster:FindAbilityByName("sword_master_arbiter")
        if ability_arbiter ~= nil then
            ability_arbiter:ArbiterAttack(caster,enemy)
        else
            caster:AddNewModifier(caster, self, "modifier_tidehunter_anchor_smash_caster", {})
            caster:PerformAttack(enemy, false, false, true, true, false, false, true)
            caster:RemoveModifierByName("modifier_tidehunter_anchor_smash_caster")
        end
        enemy:AddNewModifier(caster, self, "modifier_stunned", {duration = stun_duration})

        if talent_duration ~= 0 then
            enemy:AddNewModifier(caster, self, "modifier_sword_master_tap_passives_disabled", {duration = talent_duration})
        end
    end
    caster:RemoveModifierByName("modifier_sword_master_tap_damage_bonus")

    local particle = ParticleManager:CreateParticle("particles/heroes/sword_master/sword_master_tap.vpcf", PATTACH_ABSORIGIN_FOLLOW , caster)
    ParticleManager:SetParticleControl(particle, 0, startpoint)
    ParticleManager:SetParticleControl(particle, 1, endpoint)

    caster:EmitSound("Item.OgreSealTotem.Smash")
end

function sword_master_tap:AddTapCount()
    local caster = self:GetCaster()
    if caster:HasAbility("sword_master_chop") then
        table.insert(caster.combos,caster:AddNewModifier(caster, self, "modifier_sword_master_tap_count", {}))
        if #caster.combos > 3 then
            caster.combos[1]:Destroy()
            table.remove(caster.combos,1)
        end
    end

    if IsServer() then
        if caster:HasAbility("sword_master_chop") then
            if #caster.combos == 3 then
                local ability = caster:FindAbilityByName("sword_master_chop")
                ability:SetUltimateType(true)
            end
        end

        local modi_count = caster:FindModifierByName("modifier_sword_master_arbiter_count")
        if modi_count ~= nil then
            modi_count:CastCharge(1)
        end
    end
end

function modifier_sword_master_tap_count:RemoveOnDeath() return false end
function modifier_sword_master_tap_count:IsPurgable() return false end
function modifier_sword_master_tap_count:IsPurgeException() return false end
function modifier_sword_master_tap_count:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_sword_master_tap_damage_bonus:IsHidden() return true end
function modifier_sword_master_tap_damage_bonus:IsPurgable() return false end
function modifier_sword_master_tap_damage_bonus:IsPurgeException() return false end
function modifier_sword_master_tap_damage_bonus:OnCreated()
    local caster = self:GetCaster()
    self.damage_bonus = self:GetAbility():GetSpecialValueFor("damage_bonus")

    local ability_arbiter = caster:FindAbilityByName("sword_master_arbiter")
    if ability_arbiter ~= nil and ability_arbiter:GetLevel() >= 6 then
        self.damage_bonus = self.damage_bonus + caster:GetAgility()
    end

    self.damage_bonus = self.damage_bonus * (1 + caster:GetSpellAmplification(false))
end


function modifier_sword_master_tap_damage_bonus:DeclareFunctions()
    return {MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_POST_CRIT}
end

function modifier_sword_master_tap_damage_bonus:GetModifierPreAttack_BonusDamagePostCrit(keys)
    return self.damage_bonus
end

function modifier_sword_master_tap_passives_disabled:CheckState()
    return {[MODIFIER_STATE_PASSIVES_DISABLED] = true}
end

function table.contains(table, element)
    for _, value in pairs(table) do
      if value == element then
        return true
      end
    end
    return false
end
