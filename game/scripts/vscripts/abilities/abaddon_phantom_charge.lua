abaddon_phantom_charge = class({})

--------------------------------------------------------------------------------
function abaddon_phantom_charge:OnSpellStart()
	EmitSoundOn( "Hero_Abaddon.Curse.Proc", self:GetCaster() )
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_abaddon_phantom_charge",{duration=4}):SetStackCount(1)

	local illusion = CreateIllusions(
		self:GetCaster(), -- 拥有者
		self:GetCaster(), -- 复制者
		{
			outgoing_damage = -50,
			incoming_damage = 100,
			duration = 4,
		},
		2, -- 数量
		0, -- nPadding
		false, -- bScramblePosition
		false -- bFindClearSpace
	)
	
	local angle = 30
	local distance = 800
	local dir = {
		{RotatePosition(Vector(0,0,0),QAngle(0,angle,0),self:GetCaster():GetForwardVector()),RotatePosition(Vector(0,0,0),QAngle(0,-angle,0),self:GetCaster():GetForwardVector())},
		{RotatePosition(Vector(0,0,0),QAngle(0,angle,0),self:GetCaster():GetForwardVector()),RotatePosition(Vector(0,0,0),QAngle(0,angle*2,0),self:GetCaster():GetForwardVector())},
		{RotatePosition(Vector(0,0,0),QAngle(0,-angle,0),self:GetCaster():GetForwardVector()),RotatePosition(Vector(0,0,0),QAngle(0,-angle*2,0),self:GetCaster():GetForwardVector())}
	}
	--随机方向
	local dir2 = dir[RandomInt(1,3)]
	--幻象1
	illusion[1]:AddNewModifier(self:GetCaster(),self,"modifier_abaddon_phantom_charge",{duration=4})
	local table1 = {UnitIndex=illusion[1]:GetEntityIndex(),OrderType=DOTA_UNIT_ORDER_MOVE_TO_POSITION,Position=self:GetCaster():GetOrigin()+dir2[1]*distance,Queue=true}
	ExecuteOrderFromTable(table1)
	--幻象2
	illusion[2]:AddNewModifier(self:GetCaster(),self,"modifier_abaddon_phantom_charge",{duration=4})
	local table2 = {UnitIndex=illusion[2]:GetEntityIndex(),OrderType=DOTA_UNIT_ORDER_MOVE_TO_POSITION,Position=self:GetCaster():GetOrigin()+dir2[2]*distance,Queue=true}
	ExecuteOrderFromTable(table2)
end

--加速
modifier_abaddon_phantom_charge = class({})
LinkLuaModifier("modifier_abaddon_phantom_charge", "abilities/abaddon_phantom_charge", LUA_MODIFIER_MOTION_NONE)

function modifier_abaddon_phantom_charge:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT
	}
	return funcs
end
--状态声明
function modifier_abaddon_phantom_charge:CheckState()
	local state = {
		[MODIFIER_STATE_UNSLOWABLE] = true,
		[MODIFIER_STATE_NO_UNIT_COLLISION] = true,
	}
	return state
end
--百分比移速
function modifier_abaddon_phantom_charge:GetModifierMoveSpeedBonus_Percentage()
	return self:GetRemainingTime()/4*self:GetAbility():GetSpecialValueFor("movespeed")
end
--特效
function modifier_abaddon_phantom_charge:GetEffectName()
	return "particles/units/heroes/hero_abaddon/abaddon_curse_frostmourne_debuff.vpcf"
end
--当攻击
function modifier_abaddon_phantom_charge:OnAttackLanded(keys)
	if keys.attacker == self:GetParent() and self:GetStackCount()>0 and self:GetParent():IsRealHero() then
		local ability = self:GetAbility()
		keys.target:AddNewModifier(self:GetParent(),ability,"modifier_silence",{duration=ability:GetSpecialValueFor("silence_duration")})
		self:SetStackCount(0)
		
		local damage = ability:GetSpecialValueFor("damage") + self:GetParent():GetAverageTrueAttackDamage(nil)*ability:GetSpecialValueFor("ad")
		--额外伤害
		local damageInfo =
		{
			victim = keys.target,
			attacker = self:GetParent(),
			damage = damage,
			damage_type = DAMAGE_TYPE_MAGICAL,
			ability = self:GetAbility(),
		}
		ApplyDamage( damageInfo )
	end
end
--攻击速度
function modifier_abaddon_phantom_charge:GetModifierAttackSpeedBonus_Constant()
	return 400*self:GetStackCount()
end




