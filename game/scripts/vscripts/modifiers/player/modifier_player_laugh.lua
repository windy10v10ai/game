modifier_player_laugh = class({})

function modifier_player_laugh:IsPurgable() return false end
function modifier_player_laugh:RemoveOnDeath() return false end
function modifier_player_laugh:GetTexture() return "player/plusIcon" end
