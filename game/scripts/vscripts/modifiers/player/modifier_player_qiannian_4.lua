modifier_player_qiannian_4 = class({})

function modifier_player_qiannian_4:IsPurgable() return false end
function modifier_player_qiannian_4:RemoveOnDeath() return false end
function modifier_player_qiannian_4:GetTexture() return "player/qiannian_4" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_4:OnCreated()
end
