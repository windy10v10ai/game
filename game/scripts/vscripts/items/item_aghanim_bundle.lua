local SCEPTER_ITEM = "item_ultimate_scepter"
local SHARD_ITEM = "item_aghanims_shard"
-- 拿着原版神杖与吃掉神杖是两种来源的同一个效果，两种都算已有
local SCEPTER_MODIFIERS = { "modifier_item_ultimate_scepter", "modifier_item_ultimate_scepter_consumed" }
local SHARD_MODIFIER = "modifier_item_aghanims_shard"

local function HasAnyModifier(unit, names)
	for _, name in pairs(names) do
		if unit:HasModifier(name) then
			return true
		end
	end
	return false
end

-- 一件顶两件：缺神杖补神杖，缺魔晶补魔晶。两样都已有时不消耗，留着以后再用
function AghanimBundleOnSpell(keys)
	local ability = keys.ability
	local owner = keys.caster:GetPlayerOwner()
	if owner == nil then
		return
	end
	local hero = owner:GetAssignedHero()
	if hero == nil or hero:IsNull() then
		return
	end

	local hasScepter = HasAnyModifier(hero, SCEPTER_MODIFIERS)
	local hasShard = hero:HasModifier(SHARD_MODIFIER)
	if hasScepter and hasShard then
		return
	end

	UTIL_Remove(ability)

	if not hasScepter then
		local scepter = CreateItem(SCEPTER_ITEM, owner, hero)
		if scepter ~= nil then
			hero:AddItem(scepter)
		end
	end
	if not hasShard then
		local shard = CreateItem(SHARD_ITEM, owner, hero)
		if shard ~= nil then
			hero:AddItem(shard)
		end
	end
end
