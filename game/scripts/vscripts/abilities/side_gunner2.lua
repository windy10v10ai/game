side_gunner2 = class({})

function side_gunner2:GetIntrinsicModifierName()
	return "modifier_side_gunner2"
end
--------------------------------------------------------------------------------------------------
modifier_side_gunner2 = class({})
LinkLuaModifier("modifier_side_gunner2", "abilities/side_gunner2", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function  modifier_side_gunner2:IsHidden()return true end
--当创建
function modifier_side_gunner2:OnCreated(keys)
	if not IsServer() then return end
	self:StartIntervalThink(self:GetAbility():GetSpecialValueFor("cool_down"))
end
--think
function  modifier_side_gunner2:OnIntervalThink()
	local units = FindUnitsInRadius(self:GetCaster():GetTeamNumber(),self:GetCaster():GetOrigin(),nil,700,DOTA_UNIT_TARGET_TEAM_ENEMY,DOTA_UNIT_TARGET_BASIC+1,48,FIND_CLOSEST,false)
	if units[1] and self:GetCaster():IsAlive() then
		self:GetCaster():PerformAttack(units[1],true,true,true,true,true,false,true)
	end
end


