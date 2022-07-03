LinkLuaModifier("modifier_sniper_assassinate_target", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_assassinate_caster_crit", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)

function AssassinateAcquireTargets(keys)
	keys.ability.tTargets = keys.target_entities
	keys.ability:ApplyDataDrivenModifier(keys.caster, keys.caster, "modifier_assassinate_caster_datadriven", {})
	for i, v in pairs(keys.ability.tTargets) do
		v:AddNewModifier(keys.caster, keys.ability, "modifier_sniper_assassinate_target", {Duration = 4})
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
		vSourceLoc= keys.caster:GetAbsOrigin(),                -- Optional (HOW)
		bDrawsOnMinimap = false,                          -- Optional
		bDodgeable = true,                                -- Optional
		bIsAttack = true,                                -- Optional
		bVisibleToEnemies = true,                         -- Optional
		bReplaceExisting = false,                         -- Optional
		flExpireTime = GameRules:GetGameTime() + 10,      -- Optional but recommended
		bProvidesVision = false,                           -- Optional
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