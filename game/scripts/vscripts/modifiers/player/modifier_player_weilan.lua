modifier_player_weilan = class({})

function modifier_player_weilan:IsPurgable() return false end
function modifier_player_weilan:RemoveOnDeath() return false end
function modifier_player_weilan:GetTexture() return "player/plusIcon" end
