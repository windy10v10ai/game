ancient_apparition_freezing_aura = class( {} )

function ancient_apparition_freezing_aura:GetIntrinsicModifierName()
	return "modifier_ancient_apparition_freezing_aura"
end

--技能施法开始
function ancient_apparition_freezing_aura:OnSpellStart()
	--声音
	-- EmitSoundOn( "Hero_EarthSpirit.Magnetize.Cast", self:GetCaster() )
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_ancient_apparition_freezing_damage_aura",{duration=8})
end
---------------------------------------------------------------------------------------
modifier_ancient_apparition_freezing_damage_aura = class({})
LinkLuaModifier("modifier_ancient_apparition_freezing_damage_aura", "abilities/ancient_apparition_freezing_aura", LUA_MODIFIER_MOTION_NONE)
--无法驱散
function  modifier_ancient_apparition_freezing_damage_aura:IsPurgable() return false end
--特效
function modifier_ancient_apparition_freezing_damage_aura:GetEffectName()
	return "particles/econ/items/crystal_maiden/crystal_maiden_maiden_of_icewrack/maiden_freezing_field_snow_arcana1.vpcf"
end
--当创建
function modifier_ancient_apparition_freezing_damage_aura:OnCreated(keys)
	if not IsServer() then return end
	EmitSoundOn( "Hero_Lich.ChainFrostLoop", self:GetCaster() )
end
--当销毁
function modifier_ancient_apparition_freezing_damage_aura:OnDestroy(keys)
	if not IsServer() then return end
	self:GetCaster():StopSound("Hero_Lich.ChainFrostLoop")
end

--残留时间
function  modifier_ancient_apparition_freezing_damage_aura:GetAuraDuration() return 0 end
--光环范围
function  modifier_ancient_apparition_freezing_damage_aura:GetAuraRadius() return 800 end
--是光环
function  modifier_ancient_apparition_freezing_damage_aura:IsAura() return true end
--光环buff
function  modifier_ancient_apparition_freezing_damage_aura:GetModifierAura() return "modifier_ancient_apparition_freezing_damage" end
--光环对象
function  modifier_ancient_apparition_freezing_damage_aura:GetAuraSearchTeam() return DOTA_UNIT_TARGET_TEAM_ENEMY end
function  modifier_ancient_apparition_freezing_damage_aura:GetAuraSearchType() return DOTA_UNIT_TARGET_BASIC+1 end
function  modifier_ancient_apparition_freezing_damage_aura:GetAuraSearchFlags() return 48 end
---------------------------------------------------------------------------------------------------------
modifier_ancient_apparition_freezing_damage = class({})
LinkLuaModifier("modifier_ancient_apparition_freezing_damage", "abilities/ancient_apparition_freezing_aura", LUA_MODIFIER_MOTION_NONE)
--无法驱散
function  modifier_ancient_apparition_freezing_damage:IsPurgable() return false end
--函数声明
function modifier_ancient_apparition_freezing_damage:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}
	return funcs
end
--当创建
function modifier_ancient_apparition_freezing_damage:OnCreated(keys)
	-- if not IsServer() then return end
	self:OnIntervalThink()
	self:StartIntervalThink(1)
end
--think
function  modifier_ancient_apparition_freezing_damage:OnIntervalThink()
	self.percentage = 1 - math.max((CalcDistanceBetweenEntityOBB(self:GetParent(),self:GetCaster())-100),0) /800
	if not IsServer() then return end
	--造成伤害
	local damage = self:GetAbility():GetSpecialValueFor("damage")+self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetAbility():GetSpecialValueFor("ad")
	local damageInfo ={victim = self:GetParent(),attacker = self:GetCaster(),damage = damage*self.percentage,damage_type = DAMAGE_TYPE_MAGICAL,ability = self:GetAbility()}
	ApplyDamage( damageInfo )
end
--移速
function modifier_ancient_apparition_freezing_damage:GetModifierMoveSpeedBonus_Percentage()
	return -50*(1 - math.max((CalcDistanceBetweenEntityOBB(self:GetParent(),self:GetCaster())-100),0) /800)
end


---------------------------------------------------------------------------------------------------------
modifier_ancient_apparition_freezing_aura = class({})
LinkLuaModifier("modifier_ancient_apparition_freezing_aura", "abilities/ancient_apparition_freezing_aura", LUA_MODIFIER_MOTION_NONE)

--隐藏
function  modifier_ancient_apparition_freezing_aura:IsHidden()return true end
--无法驱散
function  modifier_ancient_apparition_freezing_aura:IsPurgable() return false end
--光环范围
function  modifier_ancient_apparition_freezing_aura:GetAuraRadius() return 1200 end
--是光环
function  modifier_ancient_apparition_freezing_aura:IsAura() return true end
--光环buff
function  modifier_ancient_apparition_freezing_aura:GetModifierAura() return "modifier_ancient_apparition_freezing_aura2" end
--光环对象
function  modifier_ancient_apparition_freezing_aura:GetAuraSearchTeam() return DOTA_UNIT_TARGET_TEAM_ENEMY end
function  modifier_ancient_apparition_freezing_aura:GetAuraSearchType() return DOTA_UNIT_TARGET_BASIC+1 end
function  modifier_ancient_apparition_freezing_aura:GetAuraSearchFlags() return 48 end


--光环生效buff
modifier_ancient_apparition_freezing_aura2 = class({})
LinkLuaModifier("modifier_ancient_apparition_freezing_aura2", "abilities/ancient_apparition_freezing_aura", LUA_MODIFIER_MOTION_NONE)
--------------------------------------------------------------------------------

function modifier_ancient_apparition_freezing_aura2:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET,
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT
	}
	return funcs
end
--当创建
function modifier_ancient_apparition_freezing_aura2:OnCreated(keys)
	-- if not IsServer() then return end
	self.percentage  = self:GetAbility():GetSpecialValueFor("percentage")
end

--不隐藏
function  modifier_ancient_apparition_freezing_aura2:IsHidden()return false end
--无法驱散
function  modifier_ancient_apparition_freezing_aura2:IsPurgable() return false end
--回复增强
function  modifier_ancient_apparition_freezing_aura2:GetModifierHPRegenAmplify_Percentage(keys)return -self.percentage end
--吸血增强
function  modifier_ancient_apparition_freezing_aura2:GetModifierLifestealRegenAmplify_Percentage(keys)return -self.percentage end
--法吸增强
function  modifier_ancient_apparition_freezing_aura2:GetModifierSpellLifestealRegenAmplify_Percentage(keys)return -self.percentage end
--治疗增强
function  modifier_ancient_apparition_freezing_aura2:GetModifierHealAmplify_PercentageTarget(keys)return -self.percentage end
--回复降低
function  modifier_ancient_apparition_freezing_aura2:GetModifierConstantHealthRegen(keys)
	return -self:GetAbility():GetSpecialValueFor("hp_regen")
end