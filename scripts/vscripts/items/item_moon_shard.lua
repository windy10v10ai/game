--[[ 	Author: Hewdraw
		Date: 17.05.2015	]]

function MoonShardOnSpell( keys )
	local caster = keys.caster
	local target = keys.target
	local ability = keys.ability
	local modifier = keys.modifier

	if (caster:IsRealHero() or caster:GetName() == "npc_dota_lone_druid_bear") and (target:IsRealHero() or target:GetName() == "npc_dota_lone_druid_bear") and not caster:HasModifier("modifier_arc_warden_tempest_double") and not target:HasModifier("modifier_arc_warden_tempest_double") then
		AddStacks(ability, caster, target, modifier, 1, true)
		EmitSoundOnClient("Item.MoonShard.Consume", target)
		caster:RemoveItem(ability)
	end
end