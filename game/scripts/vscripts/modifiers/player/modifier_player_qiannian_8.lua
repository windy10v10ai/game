modifier_player_qiannian_8 = class({})

function modifier_player_qiannian_8:IsPurgable() return false end
function modifier_player_qiannian_8:RemoveOnDeath() return false end
function modifier_player_qiannian_8:GetTexture() return "player/qiannian_8" end

-- 仅图标 属性在modifier_player_qiannian
function modifier_player_qiannian_8:OnCreated()
end
