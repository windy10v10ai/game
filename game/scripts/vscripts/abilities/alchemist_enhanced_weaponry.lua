alchemist_enhanced_weaponry = class({})

--被动
function alchemist_enhanced_weaponry:GetIntrinsicModifierName()
	return "modifier_alchemist_enhanced_weaponry"
end
function alchemist_enhanced_weaponry:OnSpellStart()
	EmitSoundOn( "Hero_Alchemist.ChemicalRage.Cast", self:GetCaster() )
	
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_alchemist_enhanced_weaponry2",{duration=self:GetSpecialValueFor("duration")})
end

--------------------------------------------------------------------------------------------------
--buff注册
modifier_alchemist_enhanced_weaponry = class({})
LinkLuaModifier("modifier_alchemist_enhanced_weaponry", "abilities/alchemist_enhanced_weaponry", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function  modifier_alchemist_enhanced_weaponry:IsHidden()return true end
-- 无法驱散
function  modifier_alchemist_enhanced_weaponry:IsPurgable()return false end

--函数声明
function modifier_alchemist_enhanced_weaponry:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
	}
	return funcs
end
--攻击距离
function modifier_alchemist_enhanced_weaponry:GetModifierAttackRangeBonus(keys)
	if not IsServer() then
		return self:GetAbility():GetSpecialValueFor("attack_range")
	elseif self:GetCaster():GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK then
		return self:GetAbility():GetSpecialValueFor("attack_range")
	else
	end
end
--主动效果
--------------------------------------------------------------------------------------------------------------------------
modifier_alchemist_enhanced_weaponry2 = class({})
LinkLuaModifier("modifier_alchemist_enhanced_weaponry2", "abilities/alchemist_enhanced_weaponry", LUA_MODIFIER_MOTION_NONE)

--特效
function modifier_alchemist_enhanced_weaponry2:GetEffectName()
	return "particles/units/heroes/hero_troll_warlord/troll_warlord_rampage_attack_speed_buff.vpcf"
end
--函数声明
function modifier_alchemist_enhanced_weaponry2:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
		MODIFIER_EVENT_ON_ATTACK_LANDED
	}
	return funcs
end
--攻击距离
function modifier_alchemist_enhanced_weaponry2:GetModifierAttackRangeBonus(keys)
	if not IsServer() then
		return self:GetAbility():GetSpecialValueFor("attack_range")
	elseif self:GetCaster():GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK then
		return self:GetAbility():GetSpecialValueFor("attack_range")
	else
	end
end
function  modifier_alchemist_enhanced_weaponry2:OnAttackLanded(keys)
	if keys.attacker == self:GetParent() then
		EmitSoundOn( "DOTA_Item.Nullifier.Slow",keys.target)
		keys.target:AddNewModifier(self:GetCaster(),self:GetAbility(),"modifier_alchemist_enhanced_weaponry_slow",{duration=0.4})
	end
end
--减速
--------------------------------------------------------------------------------------------------------------------------
modifier_alchemist_enhanced_weaponry_slow = class({})
LinkLuaModifier("modifier_alchemist_enhanced_weaponry_slow", "abilities/alchemist_enhanced_weaponry", LUA_MODIFIER_MOTION_NONE)
--特效
function modifier_alchemist_enhanced_weaponry_slow:GetEffectName()
	return "particles/items4_fx/nullifier_slow.vpcf"
end
--函数声明
function modifier_alchemist_enhanced_weaponry_slow:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}
	return funcs
end
--移速
function modifier_alchemist_enhanced_weaponry_slow:GetModifierMoveSpeedBonus_Percentage()
	return -100
end