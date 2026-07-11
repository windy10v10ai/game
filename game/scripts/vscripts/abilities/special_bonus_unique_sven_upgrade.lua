function OnStormBoltCast(keys)
	local castedAbility = keys.event_ability
	if not castedAbility or castedAbility:GetAbilityName() ~= "sven_storm_bolt" then
		return
	end
	local caster = keys.caster
	local awaken = caster:FindAbilityByName("special_bonus_unique_sven_upgrade")
	if not awaken then
		return
	end
	local duration = awaken:GetSpecialValueFor("duration")
	ApplyAwakenMagicImmunity(caster, awaken, duration)
	awaken:ApplyDataDrivenModifier(caster, caster, "modifier_special_bonus_unique_sven_upgrade_buff", {})
end
