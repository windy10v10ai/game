LinkLuaModifier("modifier_sniper_assassinate_target", "heroes/hero_sniper/sniper_assassinate_upgrade",
	LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_assassinate_caster_crit", "heroes/hero_sniper/sniper_assassinate_upgrade",
	LUA_MODIFIER_MOTION_NONE)

function AssassinateAcquireTargets(keys)
	keys.ability.tTargets = keys.target_entities
	keys.ability:ApplyDataDrivenModifier(keys.caster, keys.caster, "modifier_assassinate_caster_datadriven", {})
	for i, v in pairs(keys.ability.tTargets) do
		v:AddNewModifier(keys.caster, keys.ability, "modifier_sniper_assassinate_target", { Duration = 4 })
	end
end

function AssassinateStart(keys)
	keys.caster:RemoveModifierByName("modifier_assassinate_caster_datadriven")
	ProcsAroundMagicStick(keys.caster)
	for i, v in pairs(keys.ability.tTargets) do
		keys.caster:EmitSound("Hero_Sniper.AssassinateProjectile")
		ProjectileManager:CreateTrackingProjectile({
			Target = v,
			Source = keys.caster,
			Ability = keys.ability,
			EffectName = "particles/econ/items/sniper/sniper_charlie/sniper_assassinate_charlie.vpcf",
			iMoveSpeed = 2500,
			vSourceLoc = keys.caster:GetAbsOrigin(), -- Optional (HOW)
			bDrawsOnMinimap = false,            -- Optional
			bDodgeable = true,                  -- Optional
			bIsAttack = true,                   -- Optional
			bVisibleToEnemies = true,           -- Optional
			bReplaceExisting = false,           -- Optional
			flExpireTime = GameRules:GetGameTime() + 10, -- Optional but recommended
			bProvidesVision = false,            -- Optional
		})
	end
	keys.ability.tTargets = nil
end

function AssassinateRemoveTarget(keys)
	for i, v in pairs(keys.ability.tTargets) do
		v:RemoveModifierByName("modifier_sniper_assassinate_target")
	end
	keys.ability.tTargets = nil
end

function AssassinateHit(keys)
	keys.caster:AddNewModifier(keys.caster, keys.ability, "modifier_assassinate_caster_crit", {})
	keys.caster:PerformAttack(keys.target, true, true, true, true, false, false, true)
	keys.caster:RemoveModifierByName("modifier_assassinate_caster_crit")
	keys.target:RemoveModifierByName("modifier_sniper_assassinate_target")
end

modifier_sniper_assassinate_target = class({})

function modifier_sniper_assassinate_target:IsPurgable() return false end

function modifier_sniper_assassinate_target:DeclareFunctions() return { MODIFIER_EVENT_ON_DEATH } end

function modifier_sniper_assassinate_target:OnDeath(keys)
	local hParent = self:GetParent()
	if keys.target ~= hParent then return end
	local hAbility = self.GetAbility()
	if hAbility.tTargets then
		for i, v in ipairs(hAbility.tTargets) do
			if v == hParent() then
				table.remove(hAbility.tTargets, i)
			end
		end
	end
end

function modifier_sniper_assassinate_target:CheckState()
	return {
		[MODIFIER_STATE_INVISIBLE] = false,
		[MODIFIER_STATE_PROVIDES_VISION] = true
	}
end

function modifier_sniper_assassinate_target:OnCreated()
	self.iParticle = ParticleManager:CreateParticleForTeam(
		"particles/econ/items/sniper/sniper_charlie/sniper_crosshair_charlie.vpcf",
		PATTACH_OVERHEAD_FOLLOW,
		self:GetParent(),
		self:GetCaster():GetTeamNumber()
	)
end

function modifier_sniper_assassinate_target:OnDestroy()
	ParticleManager:DestroyParticle(self.iParticle, true)
	ParticleManager:ReleaseParticleIndex(self.iParticle)
end

modifier_assassinate_caster_crit = class({})

function modifier_assassinate_caster_crit:DeclareFunctions() return { MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE } end

function modifier_assassinate_caster_crit:GetModifierPreAttack_CriticalStrike()
	return self:GetAbility():GetSpecialValueFor("scepter_crit_bonus")
end
