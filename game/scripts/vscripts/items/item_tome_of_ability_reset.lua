function OnSpellStart(params)
	print("OnSpellStart item_tome_of_ability_reset")
	local playerId = params.caster:GetPlayerID()
	print("playerId", playerId)

	-- 初始化技能重选次数
	local result = InitAbilityReset(_, playerId)
	if not result then
		print("InitAbilityReset failed")
		return
	end

	-- 消耗物品
	print("InitAbilityReset success")
	params.ability:SpendCharge(1)
end
