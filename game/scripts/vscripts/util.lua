function TsPrint(_, s)
	if not AIGameMode.DebugMode then
		return
	end
	GameRules:SendCustomMessage(s, DOTA_TEAM_GOODGUYS, 0)
end

function TsPrintTable(_, t, indent, done)
	if not AIGameMode.DebugMode then
		return
	end
	PrintTable(t, indent, done)
end

function Printf(pattern, ...)
	if not AIGameMode.DebugMode then
		return
	end
	local str = string.format(pattern, ...)
	GameRules:SendCustomMessage(str, DOTA_TEAM_GOODGUYS, 0)
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
		unit:SetModifierStackCount(modifier, caster, unit:GetModifierStackCount(modifier, ability) + stack_amount)
	else
		ability:ApplyDataDrivenModifier(caster, unit, modifier, {})
		unit:SetModifierStackCount(modifier, caster, stack_amount)
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
			DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_INVULNERABLE +
			DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
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

function Set(list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end

function SetMember(list)
	local set = {}
	for _, l in ipairs(list) do set[l] = { enable = 1, expireDateString = "获取失败" } end
	return set
end

function SpellLifeSteal(keys, hAbility, ilifeSteal)
	local hParent = hAbility:GetParent()
	if keys.attacker == hParent and keys.inflictor and IsEnemy(keys.attacker, keys.unit) and
		bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION and
		bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL) ~= DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL then
		local iHeal = keys.damage * (ilifeSteal / 100)

		if keys.unit:IsCreep() then
			iHeal = iHeal / 5
		end

		-- Printf("法术吸血: "..iHeal)
		hParent:HealWithParams(iHeal, hAbility:GetAbility(), false, true, hParent, true)
		local pfx = ParticleManager:CreateParticle("particles/items3_fx/octarine_core_lifesteal.vpcf",
			PATTACH_ABSORIGIN_FOLLOW, hParent)
		ParticleManager:ReleaseParticleIndex(pfx)
	end
end

-- 计算实际造成的伤害
function CalculateActualDamage(damage, target)
	local target_armor = target:GetPhysicalArmorValue(false)
	damage = damage * (1 - target_armor * 0.06 / (1 + math.abs(target_armor) * 0.06))

	-- print("damage after reduction: "..damage)
	return damage
end

print("Util loaded.")

function IsGoodTeamPlayer(playerid)
	if playerid == nil or not PlayerResource:IsValidPlayerID(playerid) then
		return false
	end
	return PlayerResource:GetTeam(playerid) == DOTA_TEAM_GOODGUYS
end

function IsBadTeamPlayer(playerid)
	if playerid == nil or not PlayerResource:IsValidPlayerID(playerid) then
		return false
	end
	return PlayerResource:GetTeam(playerid) == DOTA_TEAM_BADGUYS
end

function IsEnemy(unit1, unit2)
	if unit1 == nil or unit2 == nil then
		return false
	end
	return unit1:GetTeamNumber() ~= unit2:GetTeamNumber()
end

function GetFullCastRange(hHero, hAbility)
	-- 兼容 技能 or 物品
	return hAbility:GetCastRange(hHero:GetOrigin(), nil) + hHero:GetCastRangeBonus()
end

function GetBuyBackCost(playerId)
	local iNetWorth = PlayerResource:GetNetWorth(playerId)
	local cost = math.floor(200 + iNetWorth / 20)
	cost = math.min(cost, 50000)
	return cost
end

function SelectEveryValidPlayerDoFunc(func)
	-- type func = void function(playerID)
	for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
		if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
			PlayerResource:GetSelectedHeroEntity(playerID) then
			func(playerID)
		end
	end
end

--------------------------------------------------------------------------------
-- Hero
--------------------------------------------------------------------------------
function IsHeroUncontrollable(hHero)
	if hHero:IsNull() then return true end
	-- if hero is dead, do nothing
	if hHero:IsAlive() == false then return true end
	-- 眩晕
	if hHero:IsStunned() then return true end
	-- 变羊
	if hHero:IsHexed() then return true end
	-- 噩梦
	if hHero:IsNightmared() then return true end
	-- 虚空大
	if hHero:IsFrozen() then return true end
	-- 禁用物品
	if hHero:IsMuted() then return true end


	-- 战吼，决斗，冰龙大
	if hHero:HasModifier("modifier_axe_berserkers_call") or hHero:HasModifier("modifier_legion_commander_duel") or hHero:HasModifier("modifier_winter_wyvern_winters_curse") then return true end

	-- 哈斯卡 A杖大
	if hHero:HasModifier("modifier_huskar_life_break_taunt") then return true end

	-- TP
	if hHero:HasModifier("modifier_teleporting") then return true end

	return false
end

--------------------------------------------------------------------------------
-- DataDrive modifier
--------------------------------------------------------------------------------
if not _G.GLOBAL_APPLY_MODIFIERS_ITEM then
	_G.GLOBAL_APPLY_MODIFIERS_ITEM = CreateItem("item_apply_modifiers", nil, nil)
end

function RefreshItemDataDrivenModifier(item, modifier)
	local caster = item:GetCaster()
	local itemName = item:GetName()
	Timers:CreateTimer(0.1, function()
		print("Add DataDriven Modifier " .. modifier)
		-- get how many item caster has
		local itemCount = 0
		for i = 0, 5 do
			local itemInSlot = caster:GetItemInSlot(i)
			if itemInSlot and itemInSlot:GetName() == itemName then
				itemCount = itemCount + 1
			end
		end
		local modifiers = caster:FindAllModifiersByName(modifier)
		local modifierCount = #modifiers

		print("itemCount: " .. itemCount)
		print("modifierCount: " .. modifierCount)

		if itemCount > modifierCount then
			for i = 1, itemCount - modifierCount do
				GLOBAL_APPLY_MODIFIERS_ITEM:ApplyDataDrivenModifier(caster, caster, modifier, {})
			end
		end

		if itemCount < modifierCount then
			-- remove modifier
			for i = 1, modifierCount - itemCount do
				modifiers[i]:Destroy()
			end
		end
	end)
end

function ApplyItemDataDrivenModifier(target, modifierName, modifierTable)
	GLOBAL_APPLY_MODIFIERS_ITEM:ApplyDataDrivenModifier(target, target, modifierName, modifierTable)
end

function IsHumanPlayer(playerID)
	local steamAccountID = PlayerResource:GetSteamAccountID(playerID)
	return steamAccountID ~= 0
end

function IsAbilityBehavior(behavior, judge)
	-- Convert userdata to number if necessary
	if type(behavior) ~= "number" then
		behavior = tonumber(tostring(behavior))
	end

	if not behavior then
		return false
	end

	return bit.band(behavior, judge) == judge
end
