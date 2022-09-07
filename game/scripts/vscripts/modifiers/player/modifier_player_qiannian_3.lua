modifier_player_qiannian_3 = class({})

function modifier_player_qiannian_3:IsPurgable() return false end
function modifier_player_qiannian_3:RemoveOnDeath() return false end
function modifier_player_qiannian_3:GetTexture() return "player/qiannian_3" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_3:OnCreated()
end
