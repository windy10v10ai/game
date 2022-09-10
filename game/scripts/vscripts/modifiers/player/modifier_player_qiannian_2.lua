modifier_player_qiannian_2 = class({})

function modifier_player_qiannian_2:IsPurgable() return false end
function modifier_player_qiannian_2:RemoveOnDeath() return false end
function modifier_player_qiannian_2:GetTexture() return "player/qiannian_2" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_2:OnCreated()
end
