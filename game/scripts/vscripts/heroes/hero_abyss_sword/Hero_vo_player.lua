LinkLuaModifier( "modifier_Hero_vo_player", "heroes/hero_abyss_sword/Hero_vo_player.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if Hero_vo_player == nil then
	Hero_vo_player = class({})
end
function Hero_vo_player:GetIntrinsicModifierName()
	return "modifier_Hero_vo_player"
end
---------------------------------------------------------------------
--Modifiers
if modifier_Hero_vo_player == nil then
	modifier_Hero_vo_player = class({})
end
function modifier_Hero_vo_player:OnCreated(params)
	if IsServer() then
	end
end
function modifier_Hero_vo_player:OnRefresh(params)
	if IsServer() then
	end
end
function modifier_Hero_vo_player:OnDestroy()
	if IsServer() then
	end
end
function modifier_Hero_vo_player:DeclareFunctions()
	return {
	}
end