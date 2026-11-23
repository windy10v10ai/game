local function ShouldGrant(unit, itemName, excludedModifiers)
	if itemName == nil or itemName == "" then
		return false
	end
	for name in string.gmatch(excludedModifiers or "", "%S+") do
		if unit:HasModifier(name) then
			return false
		end
	end
	return true
end

function LootBundleOnSpell(keys)
	local ability = keys.ability
	local owner = keys.caster:GetPlayerOwner()
	if owner == nil then
		return
	end
	local hero = owner:GetAssignedHero()
	if hero == nil or hero:IsNull() then
		return
	end

	local pending = {}
	if ShouldGrant(hero, keys.loot_1, keys.skip_loot_1_if) then
		table.insert(pending, keys.loot_1)
	end
	if ShouldGrant(hero, keys.loot_2, keys.skip_loot_2_if) then
		table.insert(pending, keys.loot_2)
	end
	if #pending == 0 then
		return
	end

	UTIL_Remove(ability)
	for _, itemName in ipairs(pending) do
		local item = CreateItem(itemName, owner, hero)
		if item ~= nil then
			hero:AddItem(item)
		end
	end
end
