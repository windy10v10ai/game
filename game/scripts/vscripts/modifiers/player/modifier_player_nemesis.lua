modifier_player_nemesis = class({})

function modifier_player_nemesis:IsPurgable() return false end

function modifier_player_nemesis:RemoveOnDeath() return false end

function modifier_player_nemesis:GetTexture() return "player/nemesis" end
