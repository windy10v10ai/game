LinkLuaModifier( "modifier_ability_copy_item", "abilities/ability_copy_item.lua.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if ability_copy_item == nil then
	ability_copy_item = class({})
end
function ability_copy_item:GetIntrinsicModifierName()
	return "modifier_ability_copy_item"
end
---------------------------------------------------------------------
--Modifiers
if modifier_ability_copy_item == nil then
	modifier_ability_copy_item = class({})
end
function modifier_ability_copy_item:OnCreated(params)
	if IsServer() then
	end
end
function modifier_ability_copy_item:OnRefresh(params)
	if IsServer() then
	end
end
function modifier_ability_copy_item:OnDestroy()
	if IsServer() then
	end
end
function modifier_ability_copy_item:DeclareFunctions()
	return {
	}
end