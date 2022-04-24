function DebugPrint(...)
	local spew = -1
	if spew == -1 and BAREBONES_DEBUG_SPEW then
		spew = 1
	end

	if spew == 1 then
		print(...)
	end
end

function DebugPrintTable(...)
	local spew = -1
	if spew == -1 and BAREBONES_DEBUG_SPEW then
		spew = 1
	end

	if spew == 1 then
		PrintTable(...)
	end
end

function PrintTable(t, indent, done)
	--print ( string.format ('PrintTable type %s', type(keys)) )
	if type(t) ~= "table" then
		return
	end

	done = done or {}
	done[t] = true
	indent = indent or 0

	local l = {}
	for k, v in pairs(t) do
		table.insert(l, k)
	end

	table.sort(l)
	for k, v in ipairs(l) do
		-- Ignore FDesc
		if v ~= "FDesc" then
			local value = t[v]

			if type(value) == "table" and not done[value] then
				done[value] = true
				print(string.rep("\t", indent) .. tostring(v) .. ":")
				PrintTable(value, indent + 2, done)
			elseif type(value) == "userdata" and not done[value] then
				done[value] = true
				print(string.rep("\t", indent) .. tostring(v) .. ": " .. tostring(value))
				PrintTable((getmetatable(value) and getmetatable(value).__index) or getmetatable(value), indent + 2, done)
			else
				if t.FDesc and t.FDesc[v] then
					print(string.rep("\t", indent) .. tostring(t.FDesc[v]))
				else
					print(string.rep("\t", indent) .. tostring(v) .. ": " .. tostring(value))
				end
			end
		end
	end
end

-- Adds [stack_amount] stacks to a modifier
function AddStacks(ability, caster, unit, modifier, stack_amount, refresh)
	if unit:HasModifier(modifier) then
		if refresh then
			ability:ApplyDataDrivenModifier(caster, unit, modifier, {})
		end
		unit:SetModifierStackCount(modifier, ability, unit:GetModifierStackCount(modifier, ability) + stack_amount)
	else
		ability:ApplyDataDrivenModifier(caster, unit, modifier, {})
		unit:SetModifierStackCount(modifier, ability, stack_amount)
	end
end

function ProcsAroundMagicStick(hUnit)
	local tUnits =
		FindUnitsInRadius(
		hUnit:GetTeamNumber(),
		hUnit:GetOrigin(),
		nil,
		1200,
		DOTA_UNIT_TARGET_TEAM_ENEMY,
		DOTA_UNIT_TARGET_HERO,
		DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_INVULNERABLE + DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
		FIND_ANY_ORDER,
		false
	)
	for i, v in ipairs(tUnits) do
		if v:CanEntityBeSeenByMyTeam(hUnit) then
			for i = 0, 9 do
				if v:GetItemInSlot(i) and v:GetItemInSlot(i):GetName() == "item_magic_stick" then
					CHARGE_RADIUS = v:GetItemInSlot(i):GetSpecialValueFor("charge_radius")
					if v:GetItemInSlot(i):GetCurrentCharges() < v:GetItemInSlot(i):GetSpecialValueFor("max_charges") then
						v:GetItemInSlot(i):SetCurrentCharges(v:GetItemInSlot(i):GetCurrentCharges() + 1)
						break
					end
				end
				if v:GetItemInSlot(i) and v:GetItemInSlot(i):GetName() == "item_magic_wand" then
					CHARGE_RADIUS = v:GetItemInSlot(i):GetSpecialValueFor("charge_radius")
					if v:GetItemInSlot(i):GetCurrentCharges() < v:GetItemInSlot(i):GetSpecialValueFor("max_charges") then
						v:GetItemInSlot(i):SetCurrentCharges(v:GetItemInSlot(i):GetCurrentCharges() + 1)
						break
					end
				end
			end
		end
	end
end

function Set (list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end

function SetMember (list)
	local set = {}
	for _, l in ipairs(list) do set[l] = {enable=1, expireDateString="获取失败"} end
	return set
end

print("Util loaded.")
