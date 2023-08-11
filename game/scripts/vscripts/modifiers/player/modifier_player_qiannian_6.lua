modifier_player_qiannian_6 = class({})

function modifier_player_qiannian_6:IsPurgable() return false end
function modifier_player_qiannian_6:RemoveOnDeath() return false end
function modifier_player_qiannian_6:GetTexture() return "player/qiannian_6" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_6:OnCreated()
end
