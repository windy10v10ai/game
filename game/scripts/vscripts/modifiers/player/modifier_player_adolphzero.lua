modifier_player_adolphzero = class({})

function modifier_player_adolphzero:IsPurgable() return false end
function modifier_player_adolphzero:RemoveOnDeath() return false end
function modifier_player_adolphzero:GetTexture() return "player/adolphzero" end

function modifier_player_adolphzero:OnCreated()
	self.iMoveSpeed = 150

	self.iAttackRange = 200
	self.iSpellAmplify = 30
	self.iLifeSteal = 15
	self.iCooldownReduction = 32

	local primaryAttributeBouns = 30
	self.strength = 20
	self.agility = 20
	self.intellect = 0
	-- get parent's primary attribute
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
function modifier_player_adolphzero:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_adolphzero:GetPriority()
	return MODIFIER_PRIORITY_LOW
end


function modifier_player_adolphzero:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_adolphzero:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_adolphzero:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_adolphzero:GetModifierAttackRangeBonus()
	if self:GetParent():IsRangedAttacker() then
		return self.iAttackRange
	end
	return 0
end

function modifier_player_adolphzero:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_adolphzero:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_adolphzero:GetModifierBonusStats_Intellect()
	return self.intellect
end

function modifier_player_adolphzero:GetModifierBaseAttackTimeConstant()
	if self.bat_check ~= true then
		self.bat_check = true
        local current_bat = self:GetParent():GetBaseAttackTime()

        local bat_reduction = 0.1
        local new_bat = current_bat - bat_reduction
        self.bat_check = false
        return new_bat
    end
end

function modifier_player_adolphzero:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

function modifier_player_adolphzero:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_adolphzero:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
