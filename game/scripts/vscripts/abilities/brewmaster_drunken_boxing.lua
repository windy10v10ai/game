brewmaster_drunken_boxing = class({})

function brewmaster_drunken_boxing:OnSpellStart()
	EmitSoundOn("Hero_Brewmaster.Brawler.Cast", self:GetCaster())

	self:GetCaster():AddNewModifier(self:GetCaster(), self, "modifier_brewmaster_drunken_move",
		{ duration = self:GetSpecialValueFor("duration") })
end

--被动
function brewmaster_drunken_boxing:GetIntrinsicModifierName()
	return "modifier_brewmaster_drunken_boxing"
end

--------------------------------------------------------------------------------------------------
modifier_brewmaster_drunken_move = class({})
LinkLuaModifier("modifier_brewmaster_drunken_move", "abilities/brewmaster_drunken_boxing", LUA_MODIFIER_MOTION_NONE)
--特效
function modifier_brewmaster_drunken_move:GetEffectName()
	return "particles/units/heroes/hero_brewmaster/brewmaster_cinder_brew_debuff.vpcf"
end

--函数声明
function modifier_brewmaster_drunken_move:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE
	}
	return funcs
end

--移速
function modifier_brewmaster_drunken_move:GetModifierMoveSpeedBonus_Percentage()
	return self:GetAbility():GetSpecialValueFor("move_speed_bonus")
end

--当创建
function modifier_brewmaster_drunken_move:OnCreated(keys)
	if not IsServer() then return end
	self.cycle = 1
	self.time = 0
	self.dir = true
	self.interval = 0.03
	self:StartIntervalThink(self.interval)
end

--当销毁
function modifier_brewmaster_drunken_move:OnDestroy(keys)
	if not IsServer() then return end
	FindClearSpaceForUnit(self:GetParent(), self:GetParent():GetOrigin(), false)
end

--think
function modifier_brewmaster_drunken_move:OnIntervalThink()
	self.time = self.time + self.interval
	if self.time > self.cycle then
		self.time = 0
		self.dir = not self.dir
		self.cycle = RandomFloat(0.5, 1.5)
	end
	local caster = self:GetCaster()
	local sway_speed = self:GetAbility():GetSpecialValueFor("sway_speed")
	local offset = caster:GetLeftVector() * sway_speed * self.interval
	if self.dir then
		caster:SetOrigin(caster:GetOrigin() + offset)
	else
		caster:SetOrigin(caster:GetOrigin() - offset)
	end
end

--------------------------------------------------------------------------------------------------
modifier_brewmaster_drunken_boxing = class({})
LinkLuaModifier("modifier_brewmaster_drunken_boxing", "abilities/brewmaster_drunken_boxing", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function modifier_brewmaster_drunken_boxing:IsHidden() return true end

--函数声明
function modifier_brewmaster_drunken_boxing:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_EVASION_CONSTANT,
	}
	return funcs
end

function modifier_brewmaster_drunken_boxing:GetModifierEvasion_Constant()
	local number = self:GetAbility():GetSpecialValueFor("miss")
	if self:GetCaster():HasModifier("modifier_brewmaster_drunken_move") then
		number = number * self:GetAbility():GetSpecialValueFor("crit_multiplier")
	end
	return math.min(number, 100)
end

function modifier_brewmaster_drunken_boxing:GetModifierPreAttack_CriticalStrike()
	--主动概率翻倍
	local number = self:GetAbility():GetSpecialValueFor("miss")
	if self:GetCaster():HasModifier("modifier_brewmaster_drunken_move") then
		number = number * self:GetAbility():GetSpecialValueFor("crit_multiplier")
	end

	if RandomInt(1, 100) <= number then
		self.is_critical = true
		return self:GetAbility():GetSpecialValueFor("damage")
	end
	self.is_critical = false
	return 0
end

function modifier_brewmaster_drunken_boxing:OnAttackLanded(keys)
	if not IsServer() then return end

	-- 确保是持有该 Buff 的单位发起的攻击
	if keys.attacker == self:GetParent() and self.is_critical then
		-- 播放音效
		EmitSoundOn("Hero_Brewmaster.Brawler.Crit", keys.target)
	end
end
