pantsushot = class({})
LinkLuaModifier("modifier_pantsushot", "modifiers/hero_miku/modifier_pantsushot", LUA_MODIFIER_MOTION_NONE)
--------------------------------------------------------------------------------
-- Passive Modifier
function pantsushot:GetIntrinsicModifierName()
	return "modifier_pantsushot"
end
