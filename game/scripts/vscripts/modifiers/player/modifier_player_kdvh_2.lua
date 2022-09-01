modifier_player_kdvh_2 = class({})

function modifier_player_kdvh_2:IsPurgable() return false end
function modifier_player_kdvh_2:RemoveOnDeath() return false end
function modifier_player_kdvh_2:GetTexture() return "player/plusIcon" end

-- 属性集合在modifier_player_kdvh_1
function modifier_player_kdvh_2:OnCreated()
end
