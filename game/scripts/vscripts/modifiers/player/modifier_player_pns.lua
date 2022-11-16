modifier_player_pns = class({})

function modifier_player_pns:IsPurgable() return false end
function modifier_player_pns:RemoveOnDeath() return false end
function modifier_player_pns:GetTexture() return "player/plusIcon" end
