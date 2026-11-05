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

-- 6 格里自己买的锁子甲走原版对自己施放吃掉，不打断玩家操作；备用格（7-9）里的甲在前 6 格有空位时先换进去，下次扫描再吃
function OnAutoConsumeThink(keys)
	local caster = keys.caster
	if not caster:IsAlive() or not caster:IsRealHero() then
		return
	end
	local playerId = caster:GetPlayerOwnerID()
	local emptySlots = {}
	for slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_6 do
		local item = caster:GetItemInSlot(slot)
		if not item then
			table.insert(emptySlots, slot)
		elseif item:GetAbilityName() == "item_chainmail" and item:GetPurchaser() == caster then
			caster:SetCursorCastTarget(caster)
			caster:CastAbilityImmediately(item, playerId)
			caster:SetCursorCastTarget(nil)
		end
	end
	for slot = DOTA_ITEM_SLOT_7, DOTA_ITEM_SLOT_9 do
		if #emptySlots == 0 then
			return
		end
		local item = caster:GetItemInSlot(slot)
		if item and item:GetAbilityName() == "item_chainmail" and item:GetPurchaser() == caster then
			caster:SwapItems(slot, table.remove(emptySlots, 1))
		end
	end
end
