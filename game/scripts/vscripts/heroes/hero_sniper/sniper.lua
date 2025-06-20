LinkLuaModifier( "modifier_sniper", "heroes/hero_sniper/sniper.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if sniper == nil then
	sniper = class({})
end
function sniper:GetIntrinsicModifierName()
	return "modifier_sniper"
end
---------------------------------------------------------------------
--Modifiers
if modifier_sniper == nil then
	modifier_sniper = class({})
end
function modifier_sniper:OnCreated(params)
	if IsServer() then
	end
end
function modifier_sniper:OnRefresh(params)
	if IsServer() then
	end
end
function modifier_sniper:OnDestroy()
	if IsServer() then
	end
end
function modifier_sniper:DeclareFunctions()
	return {
	}
end