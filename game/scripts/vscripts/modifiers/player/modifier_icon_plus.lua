modifier_icon_plus = class({})

function modifier_icon_plus:IsPurgable() return false end
function modifier_icon_plus:RemoveOnDeath() return false end
function modifier_icon_plus:GetTexture() return "player/plusIcon" end
