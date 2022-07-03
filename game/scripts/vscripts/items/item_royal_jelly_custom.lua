item_royal_jelly_custom = class({})
LinkLuaModifier("modifier_royal_jelly_custom", "items/item_royal_jelly_custom.lua", LUA_MODIFIER_MOTION_NONE)

function item_royal_jelly_custom:CastFilterResultTarget(hTarget)
	if hTarget:HasModifier("modifier_royal_jelly_custom") then
		return UF_FAIL_CUSTOM
	end
	if hTarget:HasModifier("modifier_arc_warden_tempest_double") then
		return UF_FAIL_NOT_PLAYER_CONTROLLED
	end
	local nResult = UnitFilter( hTarget, DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_NOT_CREEP_HERO + DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS + DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS + DOTA_UNIT_TARGET_FLAG_NOT_SUMMONED, self:GetCaster():GetTeamNumber() )
	if nResult ~= UF_SUCCESS then
		return nResult
	end
end

function item_royal_jelly_custom:GetCustomCastErrorTarget(hTarget)
	return "Royal Jelly does not stack on the same unit"
end

if IsServer() then
	function item_royal_jelly_custom:OnSpellStart()
		local target = self:GetCursorTarget()

		if target:HasModifier("modifier_royal_jelly_custom") then
			return
		else
			target:AddNewModifier(target, self, "modifier_royal_jelly_custom", {})
			EmitSoundOn( "Royal_Jelly.Consume", target )
		end

		self:SpendCharge()
	end
end


if modifier_royal_jelly_custom == nil then modifier_royal_jelly_custom = class({}) end

function modifier_royal_jelly_custom:RemoveOnDeath() return false end
function modifier_royal_jelly_custom:IsPermanent() return true end

function modifier_royal_jelly_custom:OnCreated()
	if self:GetAbility() then
		self.health_regen = self:GetAbility():GetSpecialValueFor("health_regen")
		self.mana_regen = self:GetAbility():GetSpecialValueFor("mana_regen")
	end
end

function modifier_royal_jelly_custom:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT
	}
end

function modifier_royal_jelly_custom:GetModifierConstantHealthRegen()
	return self.health_regen
end

function modifier_royal_jelly_custom:GetModifierConstantManaRegen()
	return self.mana_regen
end

function modifier_royal_jelly_custom:AllowIllusionDuplicate()
	return true
end

function modifier_royal_jelly_custom:GetTexture()
	return "item_royal_jelly"
end