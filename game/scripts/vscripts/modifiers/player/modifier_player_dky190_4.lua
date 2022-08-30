modifier_player_dky190_4 = class({})

function modifier_player_dky190_4:IsPurgable() return false end
function modifier_player_dky190_4:RemoveOnDeath() return false end
function modifier_player_dky190_4:GetTexture() return "player/dky190_4" end

-- 仅图标 属性合并在modifier_player_dky190_3
function modifier_player_dky190_4:OnCreated()
end
