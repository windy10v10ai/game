modifier_player_kudo = class({})

function modifier_player_kudo:IsPurgable() return false end
function modifier_player_kudo:RemoveOnDeath() return false end
function modifier_player_kudo:GetTexture() return "player/plusIcon" end
