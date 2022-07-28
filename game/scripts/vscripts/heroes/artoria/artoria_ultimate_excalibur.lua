-----------------------------
--    Ultimate Excalibur    --
-----------------------------

artoria_ultimate_excalibur = class({})

LinkLuaModifier("modifier_artoria_ultimate_excalibur", "heroes/artoria/modifiers/modifier_artoria_ultimate_excalibur", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_artoria_excalibur_debuff", "heroes/artoria/modifiers/modifier_artoria_excalibur_debuff", LUA_MODIFIER_MOTION_NONE )

function artoria_ultimate_excalibur:GetCooldown()
	return self:GetSpecialValueFor("AbilityCooldown")
end

function artoria_ultimate_excalibur:OnSpellStart()
	local caster = self:GetCaster()
	local targetPoint = self:GetCursorPosition()
	local ability = self
	local cast_delay = self:GetSpecialValueFor("cast_delay")
	self.interval = self:GetSpecialValueFor("interval")
	self.duration = self:GetSpecialValueFor("duration")

	EmitGlobalSound("artoria_excalibur")
	-- special bonus reduce cool down
	local artoria_excalibur = caster:FindAbilityByName("artoria_excalibur")
	if artoria_excalibur and not artoria_excalibur:IsNull() then
		artoria_excalibur:StartCooldown(self:GetCooldownTimeRemaining())
	end

	local chargeFxIndex = ParticleManager:CreateParticle( "particles/custom/artoria/artoria_ultimate_excalibur_charge.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster )

	local range = self:GetSpecialValueFor("range") - self:GetSpecialValueFor("width") -- We need this to take end radius of projectile into account

	local excal =
	{
		Ability = self,
        EffectName = "",
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

	-- Charge particles
	local excalibur_Charge = ParticleManager:CreateParticle("particles/custom/saber/max_excalibur/charge.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)

	Timers:CreateTimer(2.50, function()
		if not caster:IsAlive() then
			ParticleManager:DestroyParticle( chargeFxIndex, false )
			ParticleManager:ReleaseParticleIndex( chargeFxIndex )

			StopGlobalSound("artoria_excalibur")
		end
	end)

	self.timeCounter = 0

	Timers:CreateTimer(cast_delay, function()
		caster:ForcePlayActivityOnce(ACT_DOTA_CAST_ABILITY_6)
		Timers:CreateTimer( function()
				if self.timeCounter > self.duration then
					ParticleManager:DestroyParticle( chargeFxIndex, false )
					ParticleManager:ReleaseParticleIndex( chargeFxIndex )
					return
				end

				if caster:IsAlive() then
					excal.vSpawnOrigin = caster:GetAbsOrigin()
					excal.vVelocity = caster:GetForwardVector() * self:GetSpecialValueFor("speed")
					local projectile = ProjectileManager:CreateLinearProjectile(excal)
					self:FireSingleMaxParticle()
					ScreenShake(caster:GetOrigin(), 7, 2.0, 1, 10000, 0, true)
				end

				self.timeCounter = self.timeCounter + self.interval
				return self.interval
			end
		)
	end)
end

function artoria_ultimate_excalibur:FireSingleMaxParticle()
	local caster = self:GetCaster()
	local casterFacing = caster:GetForwardVector()
	local dummy = CreateUnitByName("dummy_unit", caster:GetAbsOrigin() + 100 * casterFacing, false, caster, caster, caster:GetTeamNumber())
	dummy:FindAbilityByName("dummy_unit_passive"):SetLevel(1)
	dummy:SetForwardVector(casterFacing)
	Timers:CreateTimer( function()
			if IsValidEntity(dummy) then
				local newLoc = dummy:GetAbsOrigin() + self:GetSpecialValueFor("speed") * 0.06 * casterFacing
				dummy:SetAbsOrigin(GetGroundPosition(newLoc,dummy))
				return 0.03
			else
				return nil
			end
		end
	)

	local excalFxIndex = ParticleManager:CreateParticle("particles/custom/saber/excalibur/shockwave.vpcf", PATTACH_ABSORIGIN_FOLLOW, dummy)
	ParticleManager:SetParticleControl(excalFxIndex, 4, Vector(self:GetSpecialValueFor("width"),0,0))

	Timers:CreateTimer(1.2, function()
		ParticleManager:DestroyParticle( excalFxIndex, false )
		ParticleManager:ReleaseParticleIndex( excalFxIndex )
		Timers:CreateTimer( 0.1, function()
				dummy:RemoveSelf()
				return nil
			end
		)
		return nil
	end)
end

function artoria_ultimate_excalibur:OnProjectileHit_ExtraData(hTarget, vLocation, tData)
	if hTarget == nil then return end

	if hTarget:IsMagicImmune() then
		return
	end

	local caster = self:GetCaster()
	local target = hTarget
	local damage = self:GetSpecialValueFor("damage") * self.interval

	if caster:HasModifier("modifier_item_ultimate_scepter") then
		damage = self:GetSpecialValueFor("damage_scepter") * self.interval
		target:AddNewModifier(caster, self, "modifier_artoria_excalibur_debuff", {duration = self.interval})
	end

	local dmgtable = {
		attacker = caster,
		victim = target,
		damage = damage,
		damage_type = DAMAGE_TYPE_MAGICAL,
		damage_flags = 0,
		ability = self
	}
	ApplyDamage(dmgtable)
end

-- Ability Channeling
function artoria_ultimate_excalibur:OnChannelFinish( bInterrupted )
	self.timeCounter = 10.0
end
