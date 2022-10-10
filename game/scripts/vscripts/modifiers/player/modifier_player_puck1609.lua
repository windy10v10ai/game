modifier_player_puck1609 = class({})

function modifier_player_puck1609:IsPurgable() return false end
function modifier_player_puck1609:RemoveOnDeath() return false end
function modifier_player_puck1609:GetTexture() return "player/puck1609" end
function modifier_player_puck1609:IsHidden() return true end

function modifier_player_puck1609:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE,
		MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE,
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end

function modifier_player_puck1609:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_player_puck1609:GetModifierPercentageCooldown()
	return 32
end

function modifier_player_puck1609:GetModifierCastRangeBonusStacking()
	return 200
end

function modifier_player_puck1609:GetModifierSpellAmplify_Percentage()
	return 40
end

function modifier_player_puck1609:GetModifierMoveSpeedBonus_Constant()
	return 200
end

function modifier_player_puck1609:GetModifierHealthRegenPercentage()
	return 2
end

function modifier_player_puck1609:GetModifierTotalPercentageManaRegen()
	return 2
end

function modifier_player_puck1609:GetModifierPhysicalArmorBonus()
	return 40
end

function modifier_player_puck1609:GetModifierMagicalResistanceBonus()
	return 40
end

function modifier_player_puck1609:GetModifierStatusResistanceStacking()
	return 32
end

function modifier_player_puck1609:GetModifierPreAttack_BonusDamage()
	return 60
end

function modifier_player_puck1609:GetModifierBonusStats_Strength()
	return 20
end

function modifier_player_puck1609:GetModifierBonusStats_Agility()
	return 20
end

function modifier_player_puck1609:GetModifierBonusStats_Intellect()
	return 20
end

function modifier_player_puck1609:GetModifierAttackRangeBonus()
	local hero = self:GetParent()
	if hero == nil then
		return 0
	end
	if hero:IsRangedAttacker() then
		return 200
	end
	return 0
end

function modifier_player_puck1609:GetModifierAttackSpeedBonus_Constant()
	return 90
end

function modifier_player_puck1609:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, 30, self:GetParent(), self:GetAbility())
end

