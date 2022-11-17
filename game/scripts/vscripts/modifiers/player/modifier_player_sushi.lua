modifier_player_sushi = class({})

function modifier_player_sushi:IsPurgable() return false end
function modifier_player_sushi:RemoveOnDeath() return false end
function modifier_player_sushi:GetTexture() return "player/sushi" end
