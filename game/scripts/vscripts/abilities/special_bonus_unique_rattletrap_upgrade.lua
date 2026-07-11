function OnCogsCast(keys)
	local castedAbility = keys.event_ability
	if not castedAbility or castedAbility:GetAbilityName() ~= "rattletrap_power_cogs" then
		return
	end
	local caster = keys.caster
	local awaken = caster:FindAbilityByName("special_bonus_unique_rattletrap_upgrade")
	if not awaken then
		return
	end
	local duration = awaken:GetSpecialValueFor("duration")
	ApplyAwakenMagicImmunity(caster, awaken, duration)
	awaken:ApplyDataDrivenModifier(caster, caster, "modifier_special_bonus_unique_rattletrap_upgrade_shield", {})
end
