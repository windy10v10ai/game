local HASTE_ITEM = "item_wings_of_haste"
local MOON_SHARD_ITEM = "item_moon_shard"

-- 两件都是吃掉后永久加成，玩家自己决定什么时候吃，这里只负责发到背包
function HasteMoonBundleOnSpell(keys)
	local ability = keys.ability
	local owner = keys.caster:GetPlayerOwner()
	if owner == nil then
		return
	end
	local hero = owner:GetAssignedHero()
	if hero == nil or hero:IsNull() then
		return
	end

	UTIL_Remove(ability)

	for _, itemName in pairs({ HASTE_ITEM, MOON_SHARD_ITEM }) do
		local item = CreateItem(itemName, owner, hero)
		if item ~= nil then
			hero:AddItem(item)
		end
	end
end
