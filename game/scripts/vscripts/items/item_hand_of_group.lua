item_hand_of_group=class({})

LinkLuaModifier("modifier_item_hand_of_group_pa", "items/item_hand_of_group.lua", LUA_MODIFIER_MOTION_NONE)
function item_hand_of_group:GetIntrinsicModifierName()
    return "modifier_item_hand_of_group_pa"
end

function item_hand_of_group:OnSpellStart()
	local caster = self:GetCaster()
    local target = self:GetCursorTarget()
    local target_pos = target:GetAbsOrigin()
    local self_xp =self:GetSpecialValueFor("self_xp")
    local self_gold =self:GetSpecialValueFor("self_gold")
    local group_xp =self:GetSpecialValueFor("group_xp")
    local group_gold =self:GetSpecialValueFor("group_gold")
    local caster_playerid = -1

    if caster then
        caster_playerid = caster:GetPlayerOwnerID()
    end

    local pfx= ParticleManager:CreateParticle("particles/items2_fx/hand_of_midas.vpcf", PATTACH_ABSORIGIN,target)
    ParticleManager:SetParticleControl(pfx, 0, target_pos)
    ParticleManager:SetParticleControl(pfx, 1, target_pos)
    ParticleManager:ReleaseParticleIndex( pfx )

    target:ForceKill(false)
    caster:EmitSound( "DOTA_Item.Hand_Of_Midas" )
    caster:ModifyGoldFiltered( self_gold , true, DOTA_ModifyGold_CreepKill)
    caster:AddExperience( target:GetDeathXP() * self_xp * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid) , DOTA_ModifyXP_CreepKill, false, false )
    SendOverheadEventMessage(caster, OVERHEAD_ALERT_GOLD, target, self_gold * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid), caster)

    -- 团队增益
    local team = caster:GetTeamNumber()
    local all = FindUnitsInRadius(team, target_pos, nil, self:GetSpecialValueFor("group_range"), DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NONE, FIND_ANY_ORDER, false)
    for _,teammate in pairs(all) do
        if teammate:GetTeamNumber() == team then
            local teammate_playerid = teammate:GetPlayerOwnerID()
            teammate:EmitSound( "DOTA_Item.Hand_Of_Midas" )
            teammate:ModifyGoldFiltered( group_gold , true, DOTA_ModifyGold_CreepKill)
            teammate:AddExperience( target:GetDeathXP() * group_xp * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid) , DOTA_ModifyXP_CreepKill, false, false )
            SendOverheadEventMessage(teammate, OVERHEAD_ALERT_GOLD, teammate, group_gold * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid), caster)
        end
    end
end

modifier_item_hand_of_group_pa=class({})

function modifier_item_hand_of_group_pa:IsHidden()
    return true
end

function modifier_item_hand_of_group_pa:IsPurgable()
    return false
end

function modifier_item_hand_of_group_pa:IsPurgeException()
    return false
end

function modifier_item_hand_of_group_pa:GetAttributes()
	return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_hand_of_group_pa:OnCreated()
    if self:GetAbility() then
        self.attack_speed = self:GetAbility():GetSpecialValueFor("attack_speed")
    end
end

function modifier_item_hand_of_group_pa:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT
    }
end

function modifier_item_hand_of_group_pa:GetModifierAttackSpeedBonus_Constant()
    return self.attack_speed
end
