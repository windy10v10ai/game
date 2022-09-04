modifier_player_dky190_5 = class({})

function modifier_player_dky190_5:IsPurgable() return false end
function modifier_player_dky190_5:RemoveOnDeath() return false end
function modifier_player_dky190_5:GetTexture() return "player/dky190_5" end

-- 仅图标 属性合并在modifier_player_dky190_3
function modifier_player_dky190_5:OnCreated()
end
