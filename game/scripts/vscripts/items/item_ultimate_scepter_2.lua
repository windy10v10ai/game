function Scepter2OnCreated(keys)
	-- bane A杖大招会卡顿，移除A杖效果
	-- if keys.caster:GetUnitName() ~= "npc_dota_hero_bane" then
	-- end
	-- add modifier_item_ultimate_scepter after 0.1s
	Timers:CreateTimer(0.1, function()
		if keys.target:HasModifier("modifier_item_ultimate_scepter") then
			keys.target:RemoveModifierByName("modifier_item_ultimate_scepter")
		end
		keys.caster:AddNewModifier(keys.caster, nil, "modifier_item_ultimate_scepter", { duration = -1 })
	end)
end

--[[ ============================================================================================================
	Author: Rook
	Date: January 26, 2015
	Called when Aghanim's Regalia is sold or dropped.  Removes the stock Aghanim's Scepter modifier if no other
	Aghanim's Scepter exist in the player's inventory.
================================================================================================================= ]]
function Scepter2OnDestroy(keys)
	Timers:CreateTimer(0.1, function()
		local num_scepters_in_inventory = 0
		for i = 0, 5, 1 do --Search for Aghanim's Regalia in the player's inventory.
			local current_item = keys.caster:GetItemInSlot(i)
			if current_item ~= nil then
				local item_name = current_item:GetName()

				if item_name == "item_ultimate_scepter_2" or item_name == "item_ultimate_scepter" then
					num_scepters_in_inventory = num_scepters_in_inventory + 1
				end
			end
		end
		local hasConsumedModifier = keys.caster:HasModifier("modifier_item_ultimate_scepter_2_consumed")
		--Remove the stock Aghanim's Scepter modifier if the player no longer has a Scepter in their inventory.
		if num_scepters_in_inventory == 0 and keys.caster:HasModifier("modifier_item_ultimate_scepter") and not hasConsumedModifier then
			keys.caster:RemoveModifierByName("modifier_item_ultimate_scepter")
		end
	end)
end

--[[	Author: Hewdraw
		Date: 17.05.2015	]]
function Scepter2OnSpell(keys)
	local consumedModifierName = "modifier_item_ultimate_scepter_2_consumed"

	-- 目标身上有消耗后的buff，则不消耗
	local hasConsumedModifier = keys.caster:HasModifier(consumedModifierName)
	if hasConsumedModifier then
		print("hasConsumedModifier: " .. tostring(hasConsumedModifier))
		return
	end

	-- 风暴双雄复制体无法释放，获得BUFF
	if keys.caster:HasModifier("modifier_arc_warden_tempest_double") then
		return
	end
	if keys.target:HasModifier("modifier_arc_warden_tempest_double") then
		return
	end

	if keys.caster:IsRealHero() and keys.target:IsRealHero() then
		if keys.target:HasModifier("modifier_item_ultimate_scepter") then
			keys.target:RemoveModifierByName("modifier_item_ultimate_scepter")
		end
		keys.target:AddNewModifier(keys.caster, nil, "modifier_item_ultimate_scepter", { duration = -1 })
		keys.ability:ApplyDataDrivenModifier(keys.caster, keys.target, consumedModifierName, {})
		-- ApplyItemDataDrivenModifier(_, keys.caster, keys.target, consumedModifierName, {})

		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		-- keys.caster:RemoveItem(keys.ability)
		UTIL_RemoveImmediate(keys.ability)
	end
end
