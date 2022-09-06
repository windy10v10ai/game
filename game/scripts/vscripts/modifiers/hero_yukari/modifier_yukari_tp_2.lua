modifier_yukari_tp_2 = class({})

--------------------------------------------------------------------------------
-- Classifications
function modifier_yukari_tp_2:IsHidden()
	return false
end

function modifier_yukari_tp_2:IsDebuff()
	return self:GetCaster():GetTeamNumber()~=self:GetParent():GetTeamNumber()
end

function modifier_yukari_tp_2:IsStunDebuff()
	return true
end

function modifier_yukari_tp_2:IsPurgable()
	return true
end

function modifier_yukari_tp_2:RemoveOnDeath()
	return false
end

--------------------------------------------------------------------------------
-- Initializations
function modifier_yukari_tp_2:OnCreated( kv )
	-- references
	local damage = self:GetAbility():GetSpecialValueFor( "damage_x" )+ self:GetCaster():FindTalentValue("special_bonus_yukari_20")
	self.radius = 75
	

	if not IsServer() then return end
	-- precache damage
	self.damageTable = {
		-- victim = target,
		attacker = self:GetCaster(),
		damage = damage,
		damage_type = self:GetAbility():GetAbilityDamageType(),
		ability = self:GetAbility(), --Optional.
	}
	if not IsServer() then return end
	-- find enemies
	local enemies = FindUnitsInRadius(
		self:GetCaster():GetTeamNumber(),	-- int, your team number
		self:GetParent():GetOrigin(),	-- point, center point
		nil,	-- handle, cacheUnit. (not known)
		self.radius,	-- float, radius. or use FIND_UNITS_EVERYWHERE
		DOTA_UNIT_TARGET_TEAM_ENEMY,	-- int, team filter
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
		0,	-- int, flag filter
		0,	-- int, order filter
		false	-- bool, can grow cache
	)

	for _,enemy in pairs(enemies) do
		-- apply damage
		self.damageTable.victim = enemy
		ApplyDamage( self.damageTable )

		-- play overhead event
		SendOverheadEventMessage(
			nil,
			OVERHEAD_ALERT_BONUS_SPELL_DAMAGE,
			self:GetParent(),
			self.damageTable.damage,
			nil
		)
	end
	self:GetParent():AddNoDraw()
end


--------------------------------------------------------------------------------
