modifier_player_sun = class({})

function modifier_player_sun:IsPurgable() return false end
function modifier_player_sun:RemoveOnDeath() return false end
function modifier_player_sun:GetTexture() return "player/sun" end
