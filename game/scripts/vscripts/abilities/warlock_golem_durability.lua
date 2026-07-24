warlock_golem_durability = class({})

function warlock_golem_durability:GetIntrinsicModifierName()
	return "modifier_warlock_golem_durability"
end

modifier_warlock_golem_durability = class({})
LinkLuaModifier(
	"modifier_warlock_golem_durability",
	"abilities/warlock_golem_durability",
	LUA_MODIFIER_MOTION_NONE
)

function modifier_warlock_golem_durability:IsHidden()
	return true
end

function modifier_warlock_golem_durability:IsPurgable()
	return false
end

function modifier_warlock_golem_durability:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_warlock_golem_durability:GetModifierStatusResistanceStacking()
	return self:GetAbility():GetSpecialValueFor("status_resistance")
end
