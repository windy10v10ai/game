-----------------------------
--    Mana Burst   --
-----------------------------

artoria_mana_burst = class({})

LinkLuaModifier( "modifier_artoria_mana_burst_slow", "heroes/artoria/modifiers/modifier_artoria_mana_burst_slow", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_artoria_mana_burst", "heroes/artoria/modifiers/modifier_artoria_mana_burst", LUA_MODIFIER_MOTION_NONE )

function artoria_mana_burst:OnSpellStart()
	local caster = self:GetCaster()
	local damage = self:GetSpecialValueFor("damage")
	local radius = self:GetSpecialValueFor("radius")
	local duration = self:GetSpecialValueFor("duration")

	EmitSoundOn("Hero_ElderTitan.EarthSplitter.Destroy", caster)

	caster:EmitSound("artoria_mana_burst")
	-- special bonus purge
	local special_bonus_ability_1 = caster:FindAbilityByName("special_bonus_artoria_mana_burst_1")
	if special_bonus_ability_1 and special_bonus_ability_1:GetLevel() > 0 then
		-- purge debuff
		caster:Purge(false, true, false, false, false)
	end

	local blastFx = ParticleManager:CreateParticle("particles/custom/artoria/artoria_mana_burst.vpcf", PATTACH_CUSTOMORIGIN, nil)
    ParticleManager:SetParticleControl( blastFx, 0, caster:GetAbsOrigin())

	local targets = FindUnitsInRadius(caster:GetTeam(), caster:GetOrigin(), nil, radius , DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC, 0, FIND_ANY_ORDER, false)

		for k,mana_burst_target in pairs(targets) do
			if mana_burst_target:IsMagicImmune() then
				return
			end

			local dmgtable = {
				attacker = caster,
				victim = mana_burst_target,
				damage = damage,
				damage_type = DAMAGE_TYPE_MAGICAL,
				damage_flags = 0,
				ability = self
			}
			ApplyDamage(dmgtable)

			local slashParticleName = "particles/custom/saber/caliburn/slash.vpcf"
			local explodeParticleName = "particles/custom/saber/caliburn/explosion.vpcf"

			-- Create particle
			local slashFxIndex = ParticleManager:CreateParticle( slashParticleName, PATTACH_ABSORIGIN, mana_burst_target )
			local explodeFxIndex = ParticleManager:CreateParticle( explodeParticleName, PATTACH_ABSORIGIN, mana_burst_target )

			local duration = duration * (1 - mana_burst_target:GetStatusResistance())
			mana_burst_target:AddNewModifier(caster, self, "modifier_artoria_mana_burst_slow", { Duration = duration })

			Timers:CreateTimer(2.50, function()
				ParticleManager:DestroyParticle( slashFxIndex, false )
				ParticleManager:ReleaseParticleIndex( slashFxIndex )
				ParticleManager:DestroyParticle( explodeFxIndex, false )
				ParticleManager:ReleaseParticleIndex( explodeFxIndex )
			end)
		end

	Timers:CreateTimer(2.50, function()
		ParticleManager:DestroyParticle( blastFx, false )
		ParticleManager:ReleaseParticleIndex( blastFx )
	end)
end

function artoria_mana_burst:GetIntrinsicModifierName()
	return "modifier_artoria_mana_burst"
end
