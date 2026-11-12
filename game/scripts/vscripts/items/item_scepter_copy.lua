local SCEPTER_MODIFIER = "modifier_item_ultimate_scepter"
local CONSUMED_MODIFIER = "modifier_item_ultimate_scepter_consumed"
local SCEPTER_ITEMS = { "item_ultimate_scepter", "item_ultimate_scepter_2", "item_ultimate_scepter_copy" }

local function HasOtherScepterItem(unit)
	for i = 0, 5 do
		local item = unit:GetItemInSlot(i)
		if item ~= nil then
			local name = item:GetName()
			for _, scepterItem in pairs(SCEPTER_ITEMS) do
				if name == scepterItem then
					return true
				end
			end
		end
	end
	return false
end

-- 复制品靠能力名判断不到 A杖效果，自己挂一份原版神杖的被动；已有来源就不重复挂
function ScepterCopyOnCreated(keys)
	Timers:CreateTimer(0.1, function()
		local unit = keys.target
		if unit == nil or unit:IsNull() then
			return
		end
		if unit:HasModifier(SCEPTER_MODIFIER) or unit:HasModifier(CONSUMED_MODIFIER) then
			return
		end
		unit:AddNewModifier(unit, nil, SCEPTER_MODIFIER, { duration = -1 })
	end)
end

-- 复制品离身时只撤掉自己挂的那份，别人给的（原版杖、吃掉的神杖）不动
function ScepterCopyOnDestroy(keys)
	Timers:CreateTimer(0.1, function()
		local unit = keys.target
		if unit == nil or unit:IsNull() then
			return
		end
		if HasOtherScepterItem(unit) or unit:HasModifier(CONSUMED_MODIFIER) then
			return
		end
		for _, modifier in pairs(unit:FindAllModifiersByName(SCEPTER_MODIFIER)) do
			if modifier:GetAbility() == nil then
				modifier:Destroy()
			end
		end
	end)
end
