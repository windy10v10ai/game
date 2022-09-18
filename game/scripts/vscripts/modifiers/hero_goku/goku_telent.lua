ability_goku_telent = {}
function ability_goku_telent:GetIntrinsicModifierName()
	return "modifier_ability_goku_2_telent"
end

modifier_ability_goku_2_telent = {}
LinkLuaModifier("modifier_ability_goku_2_telent", "scripts/vscripts/modifiers/hero_goku/goku_telent.lua",
	LUA_MODIFIER_MOTION_NONE)
function modifier_ability_goku_2_telent:IsPurgable() return false end

function modifier_ability_goku_2_telent:RemoveOnDeath() return false end

function modifier_ability_goku_2_telent:IsDebuff() return false end

function modifier_ability_goku_2_telent:IsHidden()
	return true
end

function modifier_ability_goku_2_telent:DeclareFunctions()
	return {
		
	}
end

function modifier_ability_goku_2_telent:OnCreated()
	if not IsServer() then return end
	self:StartIntervalThink(FrameTime())
end

function modifier_ability_goku_2_telent:OnIntervalThink()
	if FindTelentValue(self:GetCaster(), "special_bonus_unique_goku_2_1") ~= 0 and
		not self:GetCaster():HasModifier("modifier_ability_goku_2_telent_1") then
		self:GetCaster():AddNewModifier(self:GetCaster(), self:GetAbility(), "modifier_ability_goku_2_telent_1", {}):
			SetStackCount(FindTelentValue(self:GetCaster(), "special_bonus_unique_goku_2_1"))
	end
	if FindTelentValue(self:GetCaster(), "special_bonus_unique_goku_2_2") ~= 0 and
		not self:GetCaster():HasModifier("modifier_ability_goku_2_telent_2") then
		self:GetCaster():AddNewModifier(self:GetCaster(), self:GetAbility(), "modifier_ability_goku_2_telent_2", {}):
			SetStackCount(FindTelentValue(self:GetCaster(), "special_bonus_unique_goku_2_2"))
	end
end

modifier_ability_goku_2_telent_1 = {} --天赋监听 + 150生命
LinkLuaModifier("modifier_ability_goku_2_telent_1", "scripts/vscripts/modifiers/hero_goku/goku_telent.lua",
	LUA_MODIFIER_MOTION_NONE)
function modifier_ability_goku_2_telent_1:IsHidden() return true end

function modifier_ability_goku_2_telent_1:IsPurgable() return false end

function modifier_ability_goku_2_telent_1:RemoveOnDeath() return false end

function modifier_ability_goku_2_telent_1:IsDebuff() return false end

function modifier_ability_goku_2_telent_1:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_ability_goku_2_telent_1:GetModifierSpellAmplify_Percentage()
	return 20
end

modifier_ability_goku_2_telent_2 = {}
LinkLuaModifier("modifier_ability_goku_2_telent_2", "scripts/vscripts/modifiers/hero_goku/goku_telent.lua",
	LUA_MODIFIER_MOTION_NONE)
function modifier_ability_goku_2_telent_2:IsHidden() return true end

function modifier_ability_goku_2_telent_2:IsPurgable() return false end

function modifier_ability_goku_2_telent_2:RemoveOnDeath() return false end

function modifier_ability_goku_2_telent_2:IsDebuff() return false end

function modifier_ability_goku_2_telent_2:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_ability_goku_2_telent_2:GetModifierPercentageCooldown()
	return 15
end
