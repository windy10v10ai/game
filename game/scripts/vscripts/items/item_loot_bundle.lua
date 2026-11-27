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
-- 银月之晶让原版物品自己施放（原版 modifier 只认原版物品当 ability，其他挂法都出不了属性），
-- 两者的互斥判断与单件物品共用同一批 modifier 名
function HasteMoonBundleOnSpell(keys)
	local ability = keys.ability
	local hero = keys.caster
	if hero == nil or hero:IsNull() or not hero:IsRealHero() or hero:HasModifier("modifier_arc_warden_tempest_double") then
		return
	end

	local needsWings = not hero:HasModifier("modifier_item_wings_of_haste_consumed") and not hero:HasModifier("modifier_item_wings_of_haste_consumed_copy")
	local needsMoon = not hero:HasModifier("modifier_item_moon_shard_consumed")
	if not needsWings and not needsMoon then
		return
	end

	if needsWings then
		ability:ApplyDataDrivenModifier(hero, hero, "modifier_item_wings_of_haste_consumed_copy", {})
	end
	hero:EmitSound("Hero_Alchemist.Scepter.Cast")
	UTIL_Remove(ability)

	if needsMoon then
		local moonShard = CreateItem("item_moon_shard", hero, hero)
		hero:AddItem(moonShard)
		-- 备用栏的物品不能施放，临时换进主栏，施放后原物品换回
		local slot = moonShard:GetItemSlot()
		local swappedSlot = nil
		if slot > DOTA_ITEM_SLOT_6 then
			hero:SwapItems(slot, DOTA_ITEM_SLOT_6)
			swappedSlot = slot
		end
		hero:CastAbilityOnTarget(hero, moonShard, hero:GetPlayerOwnerID())
		if swappedSlot ~= nil then
			hero:SwapItems(DOTA_ITEM_SLOT_6, swappedSlot)
		end
		if not moonShard:IsNull() then
			UTIL_Remove(moonShard)
		end
	end
end
