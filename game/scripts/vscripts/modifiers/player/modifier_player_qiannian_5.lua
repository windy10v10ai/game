modifier_player_qiannian_5 = class({})

function modifier_player_qiannian_5:IsPurgable() return false end
function modifier_player_qiannian_5:RemoveOnDeath() return false end
function modifier_player_qiannian_5:GetTexture() return "player/qiannian_5" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_5:OnCreated()
end
