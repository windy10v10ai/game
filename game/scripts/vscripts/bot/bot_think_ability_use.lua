--------------------
-- Initial
--------------------
if BotAbilityThink == nil then
	print("Bot Ability Think initialize!")
	_G.BotAbilityThink = class({}) -- put in the global scope
end

--------------------
-- Ability Think
--------------------
function BotAbilityThink:ThinkUseAbility(hHero)
	if not hHero then
		return
	end

	-- Get hero name
	local sHeroName = hHero:GetName()

	if sHeroName == "npc_dota_hero_tinker" then
		self:ThinkUseAbility_Tinker(hHero)
	end
end

function BotAbilityThink:ThinkUseAbility_Tinker(hHero)
	local hAbility1 = hHero:GetAbilityByIndex(0)
	local hAbility2 = hHero:GetAbilityByIndex(1)
	local hAbility3 = hHero:GetAbilityByIndex(2)
	local hAbility4 = hHero:GetAbilityByIndex(3)
	local hAbility5 = hHero:GetAbilityByIndex(4)
	local hAbility6 = hHero:GetAbilityByIndex(5)


	-- hAbility1 ~ 4 由 ability spec 系统接管，详见
	-- src/vscripts/ai/ability/specs/tinker_xxx.ts

	-- if hAbility6 is Channel
	if hAbility6:IsChanneling() then
		return false
	end

	-- item blink
	local hItemBlink = hHero:FindItemInInventory("item_blink")
	if hItemBlink == nil then
		hItemBlink = hHero:FindItemInInventory("item_arcane_blink")
	end
	if hItemBlink == nil then
		hItemBlink = hHero:FindItemInInventory("item_overwhelming_blink")
	end
	if hItemBlink == nil then
		hItemBlink = hHero:FindItemInInventory("item_swift_blink")
	end
	if hItemBlink == nil then
		hItemBlink = hHero:FindItemInInventory("item_arcane_blink_2")
	end
	if hItemBlink ~= nil and hItemBlink:IsFullyCastable() and hHero:GetManaPercent() > 20 and hHero:GetHealthPercent() > 50 then
		local iFindRange = 3500
		local distance = GetFullCastRange(hHero, hAbility1)
		local iTeamRange = distance + 300
		local hTarget = BotThink:FindNearestEnemyHeroesInRangeAndVisible(hHero, iFindRange)
		if hTarget then
			local vTarget = hTarget:GetOrigin()
			-- blink when has teammate
			local vTeammate = BotThink:FindNearestEnemyHeroesInRangeAndVisible(hTarget, iTeamRange)
			if vTeammate then
				local vBlink = vTarget - (vTarget - vTeammate:GetOrigin()):Normalized() * distance
				-- change 45 degree
				local iRandomDegree = RandomInt(-45, 45)
				vBlink = RotatePosition(vTarget, QAngle(0, iRandomDegree, 0), vBlink)

				hHero:CastAbilityOnPosition(vBlink, hItemBlink, hHero:GetPlayerOwnerID())
				return true
			end
		end
	end


	if hAbility5:IsFullyCastable() then
		-- if mp less than 10% go back to fountain
		if hHero:GetMana() < 300 or hHero:GetManaPercent() < 10 then
			-- get team
			local team = hHero:GetTeam()
			if team == 2 then
				hHero:CastAbilityOnPosition(Vector(-7170, -6725, 0), hAbility5, hHero:GetPlayerOwnerID())
				return true
			end
			if team == 3 then
				hHero:CastAbilityOnPosition(Vector(7100, 6300, 0), hAbility5, hHero:GetPlayerOwnerID())
				return true
			end
		end

		if hHero:GetLevel() > 17 and hHero:GetManaPercent() > 80 and hHero:GetHealthPercent() > 80 then
			-- if far away from teammate
			local iRange = 5000
			local tNearHeroes = BotThink:FindFriendHeroesInRangeAndVisible(hHero, iRange)
			if #tNearHeroes <= 1 then
				print("tinker tp think only self")
				-- if not teammate, find nearest teammate
				iRange = 20000
				local tAllHeroes = FindUnitsInRadius(hHero:GetTeam(), hHero:GetOrigin(), nil, iRange,
					DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_HERO, DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE,
					FIND_CLOSEST, false)
				-- if team hero hp > 90% go to him
				if #tAllHeroes > 1 and tAllHeroes[2]:GetHealthPercent() > 90 then
					hHero:CastAbilityOnPosition(tAllHeroes[2]:GetOrigin(), hAbility5, hHero:GetPlayerOwnerID())
					return true
				end
			end
		end
	end

	if hAbility6:IsFullyCastable() then
		local refreshAbilityCoolDownTotal = 30
		local refreshItemCoolDownTotal = 30

		local iAbilityCoolDownTotal = 0
		local iItemCoolDownTotal = 0
		iAbilityCoolDownTotal = iAbilityCoolDownTotal + hAbility1:GetCooldownTimeRemaining()
		iAbilityCoolDownTotal = iAbilityCoolDownTotal + hAbility2:GetCooldownTimeRemaining()
		iAbilityCoolDownTotal = iAbilityCoolDownTotal + hAbility3:GetCooldownTimeRemaining()
		iAbilityCoolDownTotal = iAbilityCoolDownTotal + hAbility4:GetCooldownTimeRemaining()

		iItemCoolDownTotal = iItemCoolDownTotal + hAbility5:GetCooldownTimeRemaining()
		for i = 0, 5 do
			local hItem = hHero:GetItemInSlot(i)
			if hItem ~= nil then
				-- if item name is refresh_core
				if not hItem:GetName() == "item_refresh_core" then
					iItemCoolDownTotal = iItemCoolDownTotal + hItem:GetCooldownTimeRemaining()
				end
			end
		end

		if iAbilityCoolDownTotal > refreshAbilityCoolDownTotal
			or iAbilityCoolDownTotal + iItemCoolDownTotal > refreshItemCoolDownTotal then
			hHero:CastAbilityNoTarget(hAbility6, hHero:GetPlayerOwnerID())
			return true
		end
	end
end
