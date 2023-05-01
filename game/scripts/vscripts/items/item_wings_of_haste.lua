function WingsOfHasteOnSpell(keys)
	local modifierName = keys.modifier
	if keys.target:HasModifier(modifierName) then
		return UF_FAIL_CUSTOM
	end
	if (keys.caster:IsRealHero() or keys.caster:GetName() == "npc_dota_lone_druid_bear") and (keys.target:IsRealHero() or keys.target:GetName() == "npc_dota_lone_druid_bear") and not keys.caster:HasModifier("modifier_arc_warden_tempest_double") and not keys.target:HasModifier("modifier_arc_warden_tempest_double") then

		keys.ability:ApplyDataDrivenModifier(keys.caster, keys.target, modifierName, {})

		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		keys.caster:RemoveItem(keys.ability)
	end
end
