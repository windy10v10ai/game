modifier_player_xys = class({})

function modifier_player_xys:IsPurgable() return false end
function modifier_player_xys:RemoveOnDeath() return false end
function modifier_player_xys:GetTexture() return "player/plusIcon" end
