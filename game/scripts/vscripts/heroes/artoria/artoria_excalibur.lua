-----------------------------
--    Excalibur    --
-----------------------------
LinkLuaModifier("modifier_artoria_check", "heroes/artoria/modifiers/modifier_artoria_check", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_saber_excalibur", "heroes/artoria/modifiers/modifier_saber_excalibur", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_artoria_excalibur_debuff", "heroes/artoria/modifiers/modifier_artoria_excalibur_debuff",
	LUA_MODIFIER_MOTION_NONE)

artoria_excalibur = class({})

function artoria_excalibur:GetAbilityDamageType()
	if self:GetCaster():HasScepter() then
		return DAMAGE_TYPE_PURE
	else
		return DAMAGE_TYPE_MAGICAL
	end
end

function artoria_excalibur:GetIntrinsicModifierName()
	return "modifier_artoria_check"
end

function artoria_excalibur:GetCooldown()
	return self:GetSpecialValueFor("AbilityCooldown")
end

function artoria_excalibur:OnSpellStart()
	local caster = self:GetCaster()
	local targetPoint = self:GetCursorPosition()
	local ability = self
	local cast_delay = self:GetSpecialValueFor("cast_delay")
	self.interval = self:GetSpecialValueFor("interval")
	self.duration = self:GetSpecialValueFor("duration")

	caster:EmitSound("artoria_excalibur")
	local artoria_ultimate_excalibur = caster:FindAbilityByName("artoria_ultimate_excalibur")
	if artoria_ultimate_excalibur and not artoria_ultimate_excalibur:IsNull() then
		artoria_ultimate_excalibur:StartCooldown(self:GetCooldownTimeRemaining())
	end

	local chargeFxIndex = ParticleManager:CreateParticle("particles/custom/artoria/artoria_excalibur_charge.vpcf",
		PATTACH_ABSORIGIN_FOLLOW, caster)

	local range = self:GetSpecialValueFor("range") -
		self:GetSpecialValueFor("width") -- We need this to take end radius of projectile into account

	local excal =
	{
		Ability = self,
		EffectName = "particles/custom/saber/excalibur/shockwave.vpcf",
		iMoveSpeed = self:GetSpecialValueFor("speed"),
		vSpawnOrigin = caster:GetAbsOrigin(),
		fDistance = range,
		fStartRadius = self:GetSpecialValueFor("width"),
		fEndRadius = self:GetSpecialValueFor("width"),
		Source = caster,
		bHasFrontalCone = true,
		bReplaceExisting = false,
		iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
		iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_NONE,
		iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
		fExpireTime = GameRules:GetGameTime() + 5,
		bDeleteOnHit = false,
		vVelocity = caster:GetForwardVector() * self:GetSpecialValueFor("speed")
	}

	--Removes Super Saiyan
	Timers:CreateTimer(3.0, function()
		if caster:IsAlive() then
			ParticleManager:DestroyParticle(chargeFxIndex, false)
			ParticleManager:ReleaseParticleIndex(chargeFxIndex)
			StopGlobalSound("artoria_excalibur")
		end
	end)

	self.timeCounter = 0
	Timers:CreateTimer(cast_delay, function()
		caster:ForcePlayActivityOnce(ACT_DOTA_CAST_ABILITY_6)
		Timers:CreateTimer(function()
			if self.timeCounter > self.duration then
				ParticleManager:DestroyParticle(chargeFxIndex, false)
				ParticleManager:ReleaseParticleIndex(chargeFxIndex)
				return
			end

			if caster:IsAlive() then
				excal.vSpawnOrigin = caster:GetAbsOrigin()
				excal.vVelocity = caster:GetForwardVector() * self:GetSpecialValueFor("speed")
				local projectile = ProjectileManager:CreateLinearProjectile(excal)
				self:FireSingleMaxParticle()
				ScreenShake(caster:GetOrigin(), 5, 0.1, 1, 10000, 0, true)
			end

			self.timeCounter = self.timeCounter + self.interval
			return self.interval
		end
		)
	end)
end

function artoria_excalibur:FireSingleMaxParticle()
	local caster = self:GetCaster()
	local casterFacing = caster:GetForwardVector()
	local dummy = CreateUnitByName("dummy_unit", caster:GetAbsOrigin() + 100 * casterFacing, false, caster, caster,
		caster:GetTeamNumber())
	dummy:FindAbilityByName("dummy_unit_passive"):SetLevel(1)
	dummy:SetForwardVector(casterFacing)
	Timers:CreateTimer(function()
		if IsValidEntity(dummy) then
			local newLoc = dummy:GetAbsOrigin() + self:GetSpecialValueFor("speed") * 0.06 * casterFacing
			dummy:SetAbsOrigin(GetGroundPosition(newLoc, dummy))
			return 0.03
		else
			return nil
		end
	end
	)

	local excalFxIndex = ParticleManager:CreateParticle("particles/custom/saber/excalibur/shockwave.vpcf",
		PATTACH_CUSTOMORIGIN_FOLLOW, dummy)

	Timers:CreateTimer(1.20, function()
		ParticleManager:DestroyParticle(excalFxIndex, false)
		ParticleManager:ReleaseParticleIndex(excalFxIndex)
		Timers:CreateTimer(0.5, function()
			dummy:RemoveSelf()
			return nil
		end
		)
		return nil
	end)
end

function artoria_excalibur:OnProjectileHit_ExtraData(hTarget, vLocation, tData)
	if hTarget == nil then return end

	if hTarget:IsMagicImmune() then
		return
	end

	local caster = self:GetCaster()
	local target = hTarget
	local damage = self:GetSpecialValueFor("damage") * self.interval

	if caster:HasScepter() then
		target:AddNewModifier(caster, self, "modifier_artoria_excalibur_debuff", { duration = self.interval })
	end

	local dmgtable = {
		attacker = caster,
		victim = target,
		damage = damage,
		damage_type = self:GetAbilityDamageType(),
		damage_flags = 0,
		ability = self
	}
	ApplyDamage(dmgtable)
end

-- Ability Channeling
function artoria_excalibur:OnChannelFinish(bInterrupted)
	self.timeCounter = 10.0
end
