modifier_player_asprose = class({})

function modifier_player_asprose:IsPurgable() return false end
function modifier_player_asprose:RemoveOnDeath() return false end
function modifier_player_asprose:GetTexture() return "player/asprose" end

function modifier_player_asprose:OnCreated()
	self.iMoveSpeed = 200
	self.iCooldownReduction = 32
	self.iModelScale = -50
	self.iLifeSteal = 15
	local primaryAttributeBouns = 60
	self.strength = 0
	self.agility = 0
	self.intellect = 0
	if IsClient() then return end
	local primaryAttribute = self:GetParent():GetPrimaryAttribute()
	if primaryAttribute == 0 then
		self.strength = self.strength + primaryAttributeBouns
	elseif primaryAttribute == 1 then
		self.agility = self.agility + primaryAttributeBouns
	elseif primaryAttribute == 2 then
		self.intellect = self.intellect + primaryAttributeBouns
	end
end
function modifier_player_asprose:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_MODEL_SCALE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end


function modifier_player_asprose:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_asprose:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_asprose:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_asprose:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_asprose:GetModifierModelScale()
	return self.iModelScale
end

function modifier_player_asprose:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_asprose:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_asprose:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_asprose:GetModifierBonusStats_Intellect()
	return self.intellect
end
