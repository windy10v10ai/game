local VANILLA_CONSUMED_MODIFIER = "modifier_item_ultimate_scepter_consumed"

local EQUIP_MODIFIER = "modifier_item_ultimate_scepter"

-- 只数前6格：背包里的物品被动不生效
local function HasScepter2Equipped(unit)
	for i = 0, 5 do
		local item = unit:GetItemInSlot(i)
		if item ~= nil and item:GetName() == "item_ultimate_scepter_2" then
			return true
		end
	end
	return false
end

-- 拿着升级杖时给原版A杖效果；原版杖自己的效果带物品来源，已有就不重复加
function Scepter2OnCreated(keys)
	Timers:CreateTimer(0.1, function()
		local unit = keys.target
		if unit:IsNull() or not HasScepter2Equipped(unit) or unit:HasModifier(EQUIP_MODIFIER) then
			return
		end
		unit:AddNewModifier(unit, nil, EQUIP_MODIFIER, { duration = -1 })
	end)
end

-- 升级杖离开前6格且没有别的升级杖时，只清掉自己加的无来源效果，原版杖带来源的效果由它自己管
function Scepter2OnDestroy(keys)
	Timers:CreateTimer(0.1, function()
		local unit = keys.target
		if unit:IsNull() or HasScepter2Equipped(unit) then
			return
		end
		for _, modifier in pairs(unit:FindAllModifiersByName(EQUIP_MODIFIER)) do
			if modifier:GetAbility() == nil then
				modifier:Destroy()
			end
		end
	end)
end

--[[	Author: Hewdraw
		Date: 17.05.2015	]]
function Scepter2OnSpell(keys)
	local consumedModifierName = "modifier_item_ultimate_scepter_2_consumed"

	-- 目标身上有消耗后的buff，则不消耗；顺手补上原版已消耗buff，防止A杖效果丢失后无法恢复
	local hasConsumedModifier = keys.target:HasModifier(consumedModifierName)
	if hasConsumedModifier then
		if not keys.target:HasModifier(VANILLA_CONSUMED_MODIFIER) then
			keys.target:AddNewModifier(keys.caster, nil, VANILLA_CONSUMED_MODIFIER, {})
		end
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
		-- 吃掉后的A杖效果交给原版已消耗buff，不再依赖随物品增删的临时buff
		keys.target:AddNewModifier(keys.caster, nil, VANILLA_CONSUMED_MODIFIER, {})
		keys.ability:ApplyDataDrivenModifier(keys.caster, keys.target, consumedModifierName, {})

		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		-- keys.caster:RemoveItem(keys.ability)
		UTIL_RemoveImmediate(keys.ability)
	end
end
