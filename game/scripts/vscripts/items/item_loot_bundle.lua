-- 珍藏礼包：使用后把整套战利品发到背包。每个礼包发什么、什么时候不消耗，都在表里配
local BUNDLES = {
	item_aghanim_bundle = {
		-- 已有神杖效果时不再发神杖，两样都有则整个礼包不消耗，留着以后用
		{
			item = "item_ultimate_scepter_copy",
			skipIf = { "modifier_item_ultimate_scepter", "modifier_item_ultimate_scepter_consumed" },
		},
		{ item = "item_aghanims_shard", skipIf = { "modifier_item_aghanims_shard" } },
	},
	item_haste_moon_bundle = {
		{ item = "item_wings_of_haste_copy" },
		{ item = "item_moon_shard_copy" },
	},
}

local function HasAnyModifier(unit, names)
	for _, name in pairs(names or {}) do
		if unit:HasModifier(name) then
			return true
		end
	end
	return false
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

	local loot = BUNDLES[ability:GetAbilityName()]
	if loot == nil then
		return
	end

	local pending = {}
	for _, entry in pairs(loot) do
		if not HasAnyModifier(hero, entry.skipIf) then
			table.insert(pending, entry.item)
		end
	end
	if #pending == 0 then
		return
	end

	UTIL_Remove(ability)
	for _, itemName in pairs(pending) do
		local item = CreateItem(itemName, owner, hero)
		if item ~= nil then
			hero:AddItem(item)
		end
	end
end
