LinkLuaModifier("modifier_goku_kaioken2", "heroes/hero_goku/goku_kaioken2", LUA_MODIFIER_MOTION_NONE)

goku_kaioken2 = goku_kaioken2 or class({})
modifier_goku_kaioken2 = modifier_goku_kaioken2 or class({})
modifier_goku_kaioken2_trigger = modifier_goku_kaioken2_trigger or class({})


function goku_kaioken2:GetBehavior()
		return self.BaseClass.GetBehavior(self)
end

function goku_kaioken2:GetAbilityTextureName()
		return "custom/goku/goku_kaioken"
end

function goku_kaioken2:GetIntrinsicModifierName()
    return "modifier_goku_kaioken2"
end





function modifier_goku_kaioken2:DeclareFunctions()
    local funcs = {
       MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
       MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE
    }
    return funcs
end

function modifier_goku_kaioken2:GetModifierSpellAmplify_Percentage()
        return self:GetAbility():GetSpecialValueFor("SpellAmplify_Percentage")
end
function modifier_goku_kaioken2:GetModifierPercentageCooldown()
        return self:GetAbility():GetSpecialValueFor("CooldownReduction")
end



