modifier_saber = class({})

function modifier_saber:IsPurgable() return false end
function modifier_saber:RemoveOnDeath() return false end
function modifier_saber:GetTexture() return "saber" end

function modifier_saber:OnCreated()
end
