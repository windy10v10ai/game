modifier_wtf = class({})

function modifier_wtf:IsPurgable() return false end
function modifier_wtf:RemoveOnDeath() return false end
function modifier_wtf:IsHidden() return true end

function modifier_wtf:OnCreated(kv)
    if IsClient() then return end
end

function modifier_wtf:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
    }
end

function modifier_wtf:GetModifierPercentageCooldown()
    return 100
end
