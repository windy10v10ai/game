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

-- 觉醒技能首次出现时默认开启自动吃甲，复活不重置玩家关掉的开关
function OnAwakenCreated(keys)
	local awaken = keys.ability
	if not awaken or awaken.autoCastInitialized then
		return
	end
	awaken.autoCastInitialized = true
	if not awaken:GetAutoCastState() then
		awaken:ToggleAutoCast()
	end
end

-- 每次扫描吃掉 6 格里自己买的全部锁子甲，走原版对自己施放以保持不打断玩家操作
function OnAutoConsumeThink(keys)
	local caster = keys.caster
	local awaken = keys.ability
	if not awaken or not awaken:GetAutoCastState() then
		return
	end
	if not caster:IsAlive() or not caster:IsRealHero() then
		return
	end
	local playerId = caster:GetPlayerOwnerID()
	for slot = DOTA_ITEM_SLOT_1, DOTA_ITEM_SLOT_6 do
		local item = caster:GetItemInSlot(slot)
		if item and item:GetAbilityName() == "item_chainmail" and item:GetPurchaser() == caster then
			caster:SetCursorCastTarget(caster)
			caster:CastAbilityImmediately(item, playerId)
			caster:SetCursorCastTarget(nil)
		end
	end
end
