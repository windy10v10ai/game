modifier_player_adolphzero = class({})

function modifier_player_adolphzero:IsPurgable() return false end
function modifier_player_adolphzero:RemoveOnDeath() return false end
function modifier_player_adolphzero:GetTexture() return "player/adolphzero" end

function modifier_player_adolphzero:OnCreated()
	self.iMoveSpeed = 50

	self.iAttackRange = 0
	if self:GetParent():IsRangedAttacker() then
		self.iAttackRange = 200
	end

	local primaryAttributeBouns = 30
	self.strength = 0
	self.agility = 0
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
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
	}
end

function modifier_player_adolphzero:GetPriority()
	return MODIFIER_PRIORITY_LOW
end


function modifier_player_adolphzero:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_adolphzero:GetModifierAttackRangeBonus()
	return self.iAttackRange
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
