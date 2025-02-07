antimage_mana_turbulence = class({})

--技能施法开始
function antimage_mana_turbulence:OnSpellStart()
	--声音
	EmitSoundOn( "Hero_Mars.Spear.Cast", self:GetCaster() )
	
	local caster = self:GetCaster()
	local dir = (self:GetCursorPosition()-caster:GetOrigin()):Normalized()
	local info = {
			EffectName = "particles/econ/items/sven/sven_ti7_sword/sven_ti7_sword_spell_great_cleave_crit.vpcf",
			Ability = self,
			vSpawnOrigin = caster:GetOrigin(), 
			fStartRadius = 50,
			fEndRadius = 280,
			vVelocity = dir * 2000,
			fDistance = 400,
			Source = self:GetCaster(),
			iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
			iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
	}
	ProjectileManager:CreateLinearProjectile(info)
end

--当命中
function antimage_mana_turbulence:OnProjectileHit(target,pos)
	if target then
		--造成伤害
		local damage = self:GetSpecialValueFor("damage")+self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetSpecialValueFor("ad")
		local damageInfo ={victim = target,attacker = self:GetCaster(),damage = damage,damage_type = DAMAGE_TYPE_MAGICAL,ability = self}
		ApplyDamage( damageInfo )
		--添加buff
		target:AddNewModifier(self:GetCaster(),self,"modifier_antimage_mana_turbulence",{duration=5})
	end
end
--------------------------------------------------------------------------------------------------
modifier_antimage_mana_turbulence = class({})
LinkLuaModifier("modifier_antimage_mana_turbulence", "abilities/antimage_mana_turbulence", LUA_MODIFIER_MOTION_NONE)

--特效
function modifier_antimage_mana_turbulence:GetEffectName()
	return "particles/items3_fx/mage_slayer_debuff.vpcf"
end
--特效
function modifier_antimage_mana_turbulence:GetEffectAttachType()
	return 7
end
--函数声明
function modifier_antimage_mana_turbulence:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MANACOST_PERCENTAGE_STACKING,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
	return funcs
end

--魔法损耗增加
function  modifier_antimage_mana_turbulence:GetModifierPercentageManacostStacking(keys)return -100 end
--技能增强
function  modifier_antimage_mana_turbulence:GetModifierSpellAmplify_Percentage()return -30 end
--cd变慢
function  modifier_antimage_mana_turbulence:GetModifierPercentageCooldown()return -50 end
--移速
function modifier_antimage_mana_turbulence:GetModifierMoveSpeedBonus_Percentage()
	if self:GetElapsedTime()<=self:GetAbility():GetSpecialValueFor("slow_duration") then
		return -100
	end
end