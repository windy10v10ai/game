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
		-- Invoker's upgrade picker checks for the engine's original item name.
		local needsNativeScepter = itemName == "item_ultimate_scepter_copy" and hero:GetUnitName() == "npc_dota_hero_invoker"
		local item = CreateItem(needsNativeScepter and "item_ultimate_scepter" or itemName, owner, hero)
		if item ~= nil then
			if needsNativeScepter then
				item:SetSellable(false)
				item:SetPurchaseTime(-100)
			end
			hero:AddItem(item)
		end
	end
end

-- 馈赠直接给永久加成，不发物品：急速之翼的加成用自带的数据驱动 modifier，
-- 银月之晶用原版吞噬 modifier，两者的互斥判断与单件物品共用同一批 modifier 名
function HasteMoonBundleOnSpell(keys)
	local ability = keys.ability
	local hero = keys.caster
	if hero == nil or hero:IsNull() or not hero:IsRealHero() or hero:HasModifier("modifier_arc_warden_tempest_double") then
		return
	end

	local granted = false
	if not hero:HasModifier("modifier_item_wings_of_haste_consumed") and not hero:HasModifier("modifier_item_wings_of_haste_consumed_copy") then
		ability:ApplyDataDrivenModifier(hero, hero, "modifier_item_wings_of_haste_consumed_copy", {})
		granted = true
	end
	if not hero:HasModifier("modifier_item_moon_shard_consumed") then
		-- 原版 modifier 只在以原版银月物品为 ability 时才出属性，所以借一件临时银月挂上再删掉
		local moonShard = CreateItem("item_moon_shard", hero, hero)
		hero:AddNewModifier(hero, moonShard, "modifier_item_moon_shard_consumed", {})
		UTIL_Remove(moonShard)
		granted = true
	end
	if not granted then
		return
	end

	hero:EmitSound("Hero_Alchemist.Scepter.Cast")
	UTIL_Remove(ability)
end
