function OnCogsCast(keys)
	local castedAbility = keys.event_ability
	if not castedAbility or castedAbility:GetAbilityName() ~= "rattletrap_power_cogs" then
		return
	end
	local caster = keys.caster
	local awaken = caster:FindAbilityByName("special_bonus_unique_rattletrap_upgrade")
	if not awaken then
		return
	end
	local duration = awaken:GetSpecialValueFor("duration")
	ApplyAwakenMagicImmunity(caster, awaken, duration)
	awaken:ApplyDataDrivenModifier(caster, caster, "modifier_special_bonus_unique_rattletrap_upgrade_shield", {})
end

local function IsOwnChainmail(caster, item)
	return item and item:GetAbilityName() == "item_chainmail" and item:GetPurchaser() == caster
end

-- 走原版对自己施放，不打断玩家操作
local function ConsumeChainmail(caster, item)
	caster:SetCursorCastTarget(caster)
	caster:CastAbilityImmediately(item, caster:GetPlayerOwnerID())
	caster:SetCursorCastTarget(nil)
end

-- 合成整件装备时部件会在物品栏闪现，连续两次扫描都在才算玩家持有
local function IsReadyToConsume(item)
	if item.chainmailSeen then
		return true
	end
	item.chainmailSeen = true
	return false
end

-- 自己买的锁子甲在前 6 格直接吃；备用格（7-9）里的在前 6 格有空位时先换进去再吃
function OnAutoConsumeThink(keys)
	local caster = keys.caster
	if not caster:IsAlive() or not caster:IsRealHero() then
		return
	end
	local emptySlots = {}
	for slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_6 do
		local item = caster:GetItemInSlot(slot)
		if not item then
			table.insert(emptySlots, slot)
		elseif IsOwnChainmail(caster, item) and IsReadyToConsume(item) then
			ConsumeChainmail(caster, item)
		end
	end
	for slot = DOTA_ITEM_SLOT_7, DOTA_ITEM_SLOT_9 do
		if #emptySlots == 0 then
			return
		end
		local item = caster:GetItemInSlot(slot)
		if IsOwnChainmail(caster, item) and IsReadyToConsume(item) then
			local target = table.remove(emptySlots, 1)
			caster:SwapItems(slot, target)
			local moved = caster:GetItemInSlot(target)
			if IsOwnChainmail(caster, moved) then
				ConsumeChainmail(caster, moved)
			end
		end
	end
end
