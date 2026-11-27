-- 原版与珍藏版共用同一份永久加成，吃过任意一种就不能再吃另一种
local CONSUMED_MODIFIERS = {
	"modifier_item_wings_of_haste_consumed",
	"modifier_item_wings_of_haste_consumed_copy",
}

local function HasConsumed(unit)
	for _, name in pairs(CONSUMED_MODIFIERS) do
		if unit:HasModifier(name) then
			return true
		end
	end
	return false
end

function WingsOfHasteOnSpell(keys)
	local modifierName = keys.modifier
	if HasConsumed(keys.target) then
		return UF_FAIL_CUSTOM
	end
	if keys.caster:IsRealHero() and keys.target:IsRealHero() and not keys.caster:HasModifier("modifier_arc_warden_tempest_double") and not keys.target:HasModifier("modifier_arc_warden_tempest_double") then
		keys.ability:ApplyDataDrivenModifier(keys.caster, keys.target, modifierName, {})

		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		-- keys.caster:RemoveItem(keys.ability)
		UTIL_RemoveImmediate(keys.ability)
	end
end
