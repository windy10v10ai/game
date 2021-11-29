local tBotNameList = {
	"npc_dota_hero_axe",
	"npc_dota_hero_nevermore",
	"npc_dota_hero_bane",
	"npc_dota_hero_bounty_hunter",
	"npc_dota_hero_bloodseeker",
	"npc_dota_hero_bristleback",
	"npc_dota_hero_chaos_knight",
	"npc_dota_hero_crystal_maiden",
	"npc_dota_hero_dazzle",
	"npc_dota_hero_death_prophet",
	"npc_dota_hero_dragon_knight",
	"npc_dota_hero_drow_ranger",
	"npc_dota_hero_earthshaker",
	"npc_dota_hero_jakiro",
	"npc_dota_hero_juggernaut",
	"npc_dota_hero_kunkka",
	"npc_dota_hero_lich",
	"npc_dota_hero_lina",
	"npc_dota_hero_lion",
	"npc_dota_hero_luna",
	"npc_dota_hero_necrolyte",
	"npc_dota_hero_omniknight",
	"npc_dota_hero_oracle",
	"npc_dota_hero_phantom_assassin",
	"npc_dota_hero_pudge",
	"npc_dota_hero_sand_king",
	"npc_dota_hero_skywrath_mage",
	"npc_dota_hero_sniper",
	"npc_dota_hero_sven",
	"npc_dota_hero_tiny",
	"npc_dota_hero_vengefulspirit",
	"npc_dota_hero_viper",
	"npc_dota_hero_windrunner",
	"npc_dota_hero_witch_doctor",
	"npc_dota_hero_skeleton_king",
	"npc_dota_hero_zuus",
}

local tSkillCustomNameList = {
	"npc_dota_hero_crystal_maiden",
	"npc_dota_hero_queenofpain",
	"npc_dota_hero_mirana",
	"npc_dota_hero_earthshaker",
	"npc_dota_hero_nevermore",
}

local tAPLevelList = {
	17,
	19,
	21,
	22,
	23,
	24,
	26,
}

function AIGameMode:ArrayShuffle(array)
	local size = #array
	for i = size, 1, -1 do
		local rand = math.random(size)
		array[i], array[rand] = array[rand], array[i]
	end
	return array
end


function AIGameMode:GetFreeHeroName()
	for i,v in ipairs(tBotNameList) do
		if PlayerResource:WhoSelectedHero(v, false) < 0 then
			return v
		end
	end
	return "npc_dota_hero_luna" -- Should never get here
end


function AIGameMode:BotCourierTransfer()
	local hCourier = Entities:FindByClassname(nil, "npc_dota_courier")

	while hCourier do
		if not self.tHumanPlayerList[hCourier:GetPlayerOwnerID()] then
			local hHero = PlayerResource:GetSelectedHeroEntity(hCourier:GetPlayerOwnerID())
			local hFountain = Entities:FindByClassnameWithin(nil, "ent_dota_fountain", hCourier:GetOrigin(), 1000)

			if hHero:GetNumItemsInStash() > 0 and not hHero.sTransferTimer and hFountain then
				hHero.sTransferTimer = Timers:CreateTimer({
					endTime = 2,
					hCourier = hCourier,
					hHero = hHero,
					callback = function (args)
						if args.hHero:GetNumItemsInStash() > 0 then
							local hAbility = args.hCourier:FindAbilityByName("courier_take_stash_and_transfer_items")
							args.hCourier:CastAbilityNoTarget(hAbility, args.hCourier:GetPlayerOwnerID())
						end

						args.hHero.sTransferTimer = nil
					end
				})
			end
		end

		hCourier = Entities:FindByClassname(hCourier, "npc_dota_courier")
	end
end

function AIGameMode:InitHumanPlayerListAndSetHumanStartGold()
	if self.PreGameOptionsSet then
		print("[AIGameMode] InitSettings")
		self.tHumanPlayerList = {}
		for i=0, (DOTA_MAX_TEAM_PLAYERS - 1) do
			if PlayerResource:IsValidPlayer(i) then
				-- set human player list
				self.tHumanPlayerList[i] = true
				-- set start gold
				PlayerResource:SetGold(i, (self.iStartingGoldPlayer-600),true)
			end
		end
	else
		Timers:CreateTimer(0.5, function ()
			print("[AIGameMode] Try InitSettings in 0.5s")
			AIGameMode:InitHumanPlayerListAndSetHumanStartGold()
		end)
	end
end

function AIGameMode:OnGameStateChanged(keys)
	local state = GameRules:State_Get()

	if state == DOTA_GAMERULES_STATE_HERO_SELECTION then
		if IsServer() == true then
			self:InitHumanPlayerListAndSetHumanStartGold()
		end
	elseif state == DOTA_GAMERULES_STATE_STRATEGY_TIME then
		if not self.PreGameOptionsSet then
			print("[AIGameMode] Setting pre-game options STRATEGY_TIME")
			self:PreGameOptions()
		end
		for i=0, (DOTA_MAX_TEAM_PLAYERS - 1) do
			if PlayerResource:IsValidPlayer(i) then
				if PlayerResource:GetPlayer(i) and not PlayerResource:HasSelectedHero(i) then
					PlayerResource:GetPlayer(i):MakeRandomHeroSelection()
				end
			end
		end

		-- Eanble bots and fill empty slots
		if IsServer() == true then
			local iPlayerNumRadiant = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_GOODGUYS)
			local iPlayerNumDire = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_BADGUYS)
			math.randomseed(math.floor(Time()*1000000))
			-- 随机英雄列表
			self:ArrayShuffle(tBotNameList)
			local sDifficulty = "unfair"
			if self.iDesiredRadiant > iPlayerNumRadiant then
				for i = 1, self.iDesiredRadiant - iPlayerNumRadiant do
					Tutorial:AddBot(self:GetFreeHeroName(), "", sDifficulty, true)
				end
			end
			if self.iDesiredDire > iPlayerNumDire then
				for i = 1, self.iDesiredDire - iPlayerNumDire do
					Tutorial:AddBot(self:GetFreeHeroName(), "", sDifficulty, false)
				end
			end
			GameRules:GetGameModeEntity():SetBotThinkingEnabled(true)
			Tutorial:StartTutorialMode()

			-- set bot start gold
			for i=0, (DOTA_MAX_TEAM_PLAYERS - 1) do
				if PlayerResource:IsValidPlayer(i) then
					if not self.tHumanPlayerList[i] then
						PlayerResource:SetGold(i, (self.iStartingGoldBot-600),true)
					end
				end
			end
		end

	elseif state == DOTA_GAMERULES_STATE_PRE_GAME then
		-- modifier towers
		local tTowers = Entities:FindAllByClassname("npc_dota_tower")
		for k, v in pairs(tTowers) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iRadiantTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iDireTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end

			-- set tower split
			local towerSplitShot = v:FindAbilityByName("tower_split_shot")
			if towerSplitShot then
				print("tower_split_shot name", v:GetName())
				local towerName = v:GetName()
				if string.find(towerName, "tower3") then
					towerSplitShot:SetLevel(2)
				elseif string.find(towerName, "tower4") then
					towerSplitShot:SetLevel(1)
				end
				towerSplitShot:ToggleAbility()
			end
		end
		local tTowers = Entities:FindAllByClassname("npc_dota_barracks")
		for k, v in pairs(tTowers) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iRadiantTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iDireTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end
		end
		local tTowers = Entities:FindAllByClassname("npc_dota_healer")
		for k, v in pairs(tTowers) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end
		end
		local tTowers = Entities:FindAllByClassname("npc_dota_fort")
		for k, v in pairs(tTowers) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iRadiantTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iDireTowerPower)
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end

			-- set tower split
			local towerSplitShot = v:FindAbilityByName("tower_split_shot")
			if towerSplitShot then
				towerSplitShot:SetLevel(4)
				towerSplitShot:ToggleAbility()
			end
		end

		Timers:CreateTimer(function ()
			AIGameMode:BotCourierTransfer()
			return 1.0
		end)

	elseif state == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
		self.fGameStartTime = GameRules:GetGameTime()
	end
end


function AIGameMode:OnEntityKilled(keys)
	local hEntity = EntIndexToHScript(keys.entindex_killed)
	-- on hero killed
	if hEntity:IsRealHero() and hEntity:IsReincarnating() == false then
		HeroKilled(keys)
		-- drop items only when killed by hero
		if EntIndexToHScript(keys.entindex_attacker):GetPlayerOwner() then
			AIGameMode:RollDrops(EntIndexToHScript(keys.entindex_killed))
		end
	end
	-- on barrack killed
	if hEntity:GetClassname() == "npc_dota_barracks" then
		RecordBarrackKilled(keys)
	end
end

function RecordBarrackKilled(keys)
	if AIGameMode.barrackKilledCount == nil then
		AIGameMode.barrackKilledCount = 0
	end
	AIGameMode.barrackKilledCount = AIGameMode.barrackKilledCount + 1
	print("barrack killed count", AIGameMode.barrackKilledCount)
end

function HeroKilled(keys)
	local hHero = EntIndexToHScript(keys.entindex_killed)
	local fRespawnTime = 0
	local iLevel = hHero:GetLevel()
	local tDOTARespawnTime = {5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 26, 30, 32, 34, 36, 38, 40, 45, 48, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 6
, 65, 66, 67 ,68, 69, 70}
	if iLevel <= 40 then
		fRespawnTime = math.ceil(tDOTARespawnTime[iLevel]*AIGameMode.iRespawnTimePercentage/100.0)
	else
		fRespawnTime = math.ceil((iLevel/4 + 60)*AIGameMode.iRespawnTimePercentage/100.0)
	end

	if hHero:FindModifierByName('modifier_necrolyte_reapers_scythe') then
		fRespawnTime = fRespawnTime+hHero:FindModifierByName('modifier_necrolyte_reapers_scythe'):GetAbility():GetLevel()*10
	end

	-- 血精石复活时间
	if hHero:HasItemInInventory('item_bloodstone') then
		for i = 0, 5 do
			local item = hHero:GetItemInSlot(i)
			if item then
				local item_name = item:GetName()
				if item_name == 'item_bloodstone' then
					fRespawnTime = fRespawnTime - item:GetCurrentCharges()
					break
				end
			end
		end
	end
	-- 复活时间至少1s
	if fRespawnTime < 1 then
		fRespawnTime = 1
	end
	hHero:SetTimeUntilRespawn(fRespawnTime)

	-- set streak end bounty
	-- local attckerUnit = EntIndexToHScript( keys.entindex_attacker )
	-- if attckerUnit:IsControllableByAnyPlayer() then
	-- 	KillBounty(hHero, attckerUnit)
	-- end
end

-- function KillBounty(hHero, attckerUnit)

-- 	local streak = hHero:GetStreak()
-- 	local killedPlayerId = hHero:GetPlayerID()
-- 	local killedName = PlayerResource:GetPlayerName(killedPlayerId)

-- 	local attackerPlayer = attckerUnit
-- 	if not attckerUnit:IsRealHero() then
-- 		print("event not realhero")
-- 		attackerPlayer = attckerUnit:GetOwner()
-- 	end
-- 	local attackerPlayerId = attackerPlayer:GetPlayerID()
-- 	local attackName = PlayerResource:GetPlayerName(attackerPlayerId)

-- 	-- bounty
-- 	local hLevel = hHero:GetLevel()
-- 	local killBounty = hLevel * 5 + 150
-- 	local msgKill = "<font color='#045ceb'> "..attackName.." </font>击杀了 "..killedName.." 获得赏金(bounty)<font color='#fef02e'>"..killBounty.."</font>！"
-- 	--PlayerResource:ModifyGold(attackerPlayerId, killBounty, true, 0)
-- 	--GameRules:SendCustomMessage(msgKill, attackerPlayer:GetTeamNumber(), 1)

-- 	if streak > 4 then
-- 		local streakBounty = 10 * streak * streak + 400
-- 		local msgStreak = "<font color='#045ceb'> "..attackName.." </font>终结了 "..killedName.." 的 <font color='#cc0000'>"..streak.."</font> 连杀。获得额外赏金(bounty)<font color='#fef02e'>"..streakBounty.."</font>！"
-- 		--attackerPlayer:ModifyGold(streakBounty, true, 0)
-- 		--GameRules:SendCustomMessage(msgStreak, attackerPlayer:GetTeamNumber(), 1)
-- 	end
-- end

function AIGameMode:RollDrops(hHero)
    local DropInfo = GameRules.DropTable
    if DropInfo then
        for item_name,chance in pairs(DropInfo) do
			for i = 0, 8 do
				local hItem = hHero:GetItemInSlot(i)
				if hItem then
					local hItem_name = hItem:GetName()
					if item_name == hItem_name then
						if RollPercentage(chance) then
							-- Remove the item
							hHero:RemoveItem(hItem)
							-- Create the item
							local item = CreateItem(item_name, nil, nil)
							if AIGameMode.DebugMode then
								item:SetPurchaseTime(-100)
							end
							local pos = hHero:GetAbsOrigin()
							local drop = CreateItemOnPositionSync( pos, item )
							local pos_launch = pos+RandomVector(RandomFloat(150,200))
							item:LaunchLoot(false, 200, 0.75, pos_launch)
						end
					end
				end
			end
        end
    end
end


function AIGameMode:OnNPCSpawned(keys)
	if GameRules:State_Get() < DOTA_GAMERULES_STATE_PRE_GAME then
		Timers:CreateTimer(1, function ()
			AIGameMode:OnNPCSpawned(keys)
		end)
		return
	end
	local hHero = EntIndexToHScript(keys.entindex)
	if hHero:IsNull() then return end

	if hHero:IsCourier() and self.bFastCourier == 1 then
		hHero:AddNewModifier(hHero, nil, "modifier_courier_speed", {})
	end

	if hHero:GetName() == "npc_dota_lone_druid_bear" then
		hHero:AddNewModifier(hHero, nil, "modifier_melee_resistance", {})
	end

	if hHero:IsHero() and not hHero.bInitialized then
		if hHero:GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK or hHero:GetName() == "npc_dota_hero_troll_warlord" or hHero:GetName() == "npc_dota_hero_lone_druid" then
			hHero:AddNewModifier(hHero, nil, "modifier_melee_resistance", {})
		end

		if hHero:GetName() == "npc_dota_hero_sniper" and self.tHumanPlayerList[hHero:GetPlayerOwnerID()] and not self.bSniperScepterThinkerApplierSet then
			require('heroes/hero_sniper/sniper_init')
			SniperInit(hHero, self)
		end

		if not self.tHumanPlayerList[hHero:GetPlayerOwnerID()] then
			if not hHero:FindModifierByName("modifier_bot_attack_tower_pick_rune") then
				hHero:AddNewModifier(hHero, nil, "modifier_bot_attack_tower_pick_rune", {})
			end
			if hHero:GetName() == "npc_dota_hero_axe" and not hHero:FindModifierByName("modifier_axe_thinker") then
				hHero:AddNewModifier(hHero, nil, "modifier_axe_thinker", {})
			end
		end

		hHero.bInitialized = true;
	end
end


function AIGameMode:OnPlayerLevelUp(keys)
	local iEntIndex=PlayerResource:GetPlayer(keys.player-1):GetAssignedHero():entindex()
	local iLevel=keys.level
	-- Set DeathXP 击杀经验
	Timers:CreateTimer(0.5, function ()
		if iLevel <= 30 then
			EntIndexToHScript(iEntIndex):SetCustomDeathXP(40 + EntIndexToHScript(iEntIndex):GetCurrentXP()*0.09)
		else
			EntIndexToHScript(iEntIndex):SetCustomDeathXP(3000 + EntIndexToHScript(iEntIndex):GetCurrentXP()*0.04)
		end
	end)


	-- Set Ability Points
	local hero = EntIndexToHScript(keys.player):GetAssignedHero()
	local level = keys.level

	for i,v in ipairs(tSkillCustomNameList) do
	  if v == hero:GetName() then
			for _,lv in ipairs(tAPLevelList) do
			  if lv == level then
					print("-----------------debug-----------------", hero:GetName().."level:"..level.." Add AP")

						-- Save current unspend AP
					local unspendAP = hero:GetAbilityPoints()
					hero:SetAbilityPoints(1 + unspendAP)
					break
			  end
			end

	    break
	  end
	end
end


function AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args)
	if tonumber(args.host_privilege) ~= 1 then return end
	self.iDesiredRadiant = tonumber(args.game_options.radiant_player_number)
	self.iDesiredDire = tonumber(args.game_options.dire_player_number)
	self.fPlayerGoldXpMultiplier = tonumber(args.game_options.player_gold_xp_multiplier)
	self.fBotGoldXpMultiplier = tonumber(args.game_options.bot_gold_xp_multiplier)

	self.iRespawnTimePercentage = tonumber(args.game_options.respawn_time_percentage)
	self.iMaxLevel = tonumber(args.game_options.max_level)
	self.iRadiantTowerPower = tonumber(args.game_options.radiant_tower_power)
	self.iDireTowerPower = tonumber(args.game_options.dire_tower_power)
	self.iRadiantTowerEndure = tonumber(args.game_options.radiant_tower_power)
	self.iDireTowerEndure = tonumber(args.game_options.dire_tower_power)
	self.iRadiantTowerHeal = tonumber(args.game_options.radiant_tower_heal)
	self.iDireTowerHeal = tonumber(args.game_options.dire_tower_heal)
	self.iStartingGoldPlayer = tonumber(args.game_options.starting_gold_player)
	self.iStartingGoldBot = tonumber(args.game_options.starting_gold_bot)
	self.bSameHeroSelection = args.game_options.same_hero_selection
	self.bFastCourier = args.game_options.fast_courier
	self:PreGameOptions()
end

function AIGameMode:OnGameOptionChange(keys)
	local optionName = keys.optionName
	local optionValue = keys.optionValue
	-- 对应的游戏选择项目设定
	GameRules.GameOption[optionName]=optionValue
	CustomNetTables:SetTableValue('game_options_table', 'game_option', GameRules.GameOption)
end
