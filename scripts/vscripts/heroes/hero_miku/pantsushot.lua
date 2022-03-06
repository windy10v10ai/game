pantsushot = class({})
LinkLuaModifier( "modifier_pantsushot", "modifiers/modifier_pantsushot", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_generic_stunned_lua", "modifiers/modifier_generic_stunned_lua", LUA_MODIFIER_MOTION_NONE )
--------------------------------------------------------------------------------
-- Passive Modifier
function pantsushot:GetIntrinsicModifierName()
	return "modifier_pantsushot"
end