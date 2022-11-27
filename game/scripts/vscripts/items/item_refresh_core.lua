LinkLuaModifier( "modifier_item_refresh_core", "items/item_refresh_core.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if item_refresh_core == nil then
	item_refresh_core = class({})
end
function item_refresh_core:GetIntrinsicModifierName()
	return "modifier_item_refresh_core"
end
---------------------------------------------------------------------
--Modifiers
if modifier_item_refresh_core == nil then
	modifier_item_refresh_core = class({})
end
function modifier_item_refresh_core:OnCreated(params)
	if IsServer() then
	end
end
function modifier_item_refresh_core:OnRefresh(params)
	if IsServer() then
	end
end
function modifier_item_refresh_core:OnDestroy()
	if IsServer() then
	end
end
function modifier_item_refresh_core:DeclareFunctions()
	return {
	}
end