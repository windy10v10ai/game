modifier_lumao = class({})

function modifier_lumao:IsPurgable() return false end
function modifier_lumao:RemoveOnDeath() return false end
function modifier_lumao:GetTexture() return "member/lumao" end

function modifier_lumao:OnCreated()
	self.iCooldownReduction = 40
	self.iStatusResist = 50
	self.iLifeSteal = 50
	self.iCastRange = 400
end

function modifier_lumao:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_lumao:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end


function modifier_lumao:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_lumao:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_lumao:GetModifierCastRangeBonus()
	return self.iCastRange
end

-- life steal on attack landed
function modifier_lumao:OnAttackLanded(params)
	if IsServer() then
		local attacker = params.attacker
		if attacker == self:GetParent() then
			local hTarget = params.target
			local iDamage = params.damage
			local iLifeSteal = self.iLifeSteal
			if not self:GetParent():IsRealHero() then
				return
			end
			if hTarget:IsBuilding() or hTarget:IsIllusion() or (hTarget:GetTeam() == attacker:GetTeam()) then
				return
			end
			local iHeal = iDamage * iLifeSteal * 0.01
			attacker:Heal(iHeal, attacker)

			-- effect
			local lifesteal_pfx = ParticleManager:CreateParticle("particles/generic_gameplay/generic_lifesteal.vpcf", PATTACH_ABSORIGIN_FOLLOW, attacker)
			ParticleManager:SetParticleControl(lifesteal_pfx, 0, attacker:GetAbsOrigin())
			ParticleManager:ReleaseParticleIndex(lifesteal_pfx)
		end
	end
end
