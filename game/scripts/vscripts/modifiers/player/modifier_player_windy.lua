modifier_player_windy = class({})

function modifier_player_windy:IsPurgable() return false end
function modifier_player_windy:RemoveOnDeath() return false end
function modifier_player_windy:GetTexture() return "player/windy" end

function modifier_player_windy:OnCreated()
end
