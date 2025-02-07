axe_one_man_army2 = class({})

--被动
function axe_one_man_army2:GetIntrinsicModifierName()
	return "modifier_axe_one_man_army2"
end

modifier_axe_one_man_army2 = class({})
LinkLuaModifier("modifier_axe_one_man_army2", "abilities/axe_one_man_army2", LUA_MODIFIER_MOTION_NONE)
--------------------------------------------------------------------------------

function modifier_axe_one_man_army2:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
	}
	return funcs
end
--无法驱散
function  modifier_axe_one_man_army2:IsPurgable() return false end
--隐藏
function  modifier_axe_one_man_army2:IsHidden() return true end
--力量
function  modifier_axe_one_man_army2:GetModifierBonusStats_Strength()
	return self:GetAbility():GetSpecialValueFor("armor_pct_as_strength")*0.01*self:GetCaster():GetPhysicalArmorValue(false)
end

