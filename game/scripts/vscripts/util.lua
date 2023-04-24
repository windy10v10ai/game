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
function TsLifeStealOnAttackLanded (_, params, iLifeSteal, hHero, hAbility)
	LifeStealOnAttackLanded (params, iLifeSteal, hHero, hAbility)
end

function LifeStealOnAttackLanded (params, iLifeSteal, hHero, hAbility)
	if IsServer() then
		local attacker = params.attacker
		if attacker == hHero then
			local hTarget = params.target
			local iDamage = params.damage
			if attacker:IsBuilding() or attacker:IsIllusion() then
				return
			end
			if hTarget:IsBuilding() or hTarget:IsIllusion() or (hTarget:GetTeam() == attacker:GetTeam()) then
				return
			end
			local iHeal = iDamage * iLifeSteal * 0.01
            attacker:HealWithParams(iHeal,hAbility,true,true,attacker,false)

			-- effect
			local lifesteal_pfx = ParticleManager:CreateParticle("particles/generic_gameplay/generic_lifesteal.vpcf", PATTACH_ABSORIGIN_FOLLOW, attacker)
			ParticleManager:SetParticleControl(lifesteal_pfx, 0, attacker:GetAbsOrigin())
			ParticleManager:ReleaseParticleIndex(lifesteal_pfx)
		end
	end
end

function TsSpellLifeSteal(_, keys, hAbility, ilifeSteal)
	SpellLifeSteal(keys, hAbility, ilifeSteal)
end

function SpellLifeSteal(keys, hAbility, ilifeSteal)
	local hParent = hAbility:GetParent()
	if keys.attacker == hParent and keys.inflictor and IsEnemy(keys.attacker, keys.unit) and
			bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION and
			bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL) ~= DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL then
		local dmg = keys.damage * (ilifeSteal / 100)

		if keys.unit:IsCreep() then
			dmg = dmg / 5
		end
		hParent:HealWithParams(dmg,hAbility:GetAbility(),false,true,hParent,true)
		local pfx = ParticleManager:CreateParticle("particles/items3_fx/octarine_core_lifesteal.vpcf", PATTACH_ABSORIGIN_FOLLOW, hParent)
		ParticleManager:ReleaseParticleIndex(pfx)
	end
end

print("Util loaded.")

function IsGoodTeamPlayer (playerid)
	if playerid == nil or not PlayerResource:IsValidPlayerID(playerid) then
		return false
	end
	return PlayerResource:GetTeam(playerid) == DOTA_TEAM_GOODGUYS
end

function IsBadTeamPlayer (playerid)
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
	local hHero = PlayerResource:GetSelectedHeroEntity(playerId)
	local iNetWorth = PlayerResource:GetNetWorth(playerId)
	local level = hHero:GetLevel()
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
