local tBotNameList = {
	--"npc_dota_hero_abaddon",// 不会放技能，只会物品和A人
	--"npc_dota_hero_antimage",// 不会放技能，只会物品和A人
	--"npc_dota_hero_spirit_breaker",// 不会放技能，只会物品和A人
	--"npc_dota_hero_silencer",// 不会放技能，只会物品和A人
	"npc_dota_hero_axe",
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
	-- "npc_dota_hero_mirana", // 不会放技能，只会物品和A人
	"npc_dota_hero_nevermore",
	"npc_dota_hero_necrolyte",
	"npc_dota_hero_ogre_magi",
	"npc_dota_hero_omniknight",
	"npc_dota_hero_oracle",
	"npc_dota_hero_phantom_assassin",
	"npc_dota_hero_pudge",
	"npc_dota_hero_riki",
	-- "npc_dota_hero_razor", // 在泉水站着完全不动
	-- "npc_dota_hero_shadow_shaman", // 不会放技能，只会物品和A人
	"npc_dota_hero_sand_king",
	"npc_dota_hero_skywrath_mage",
	"npc_dota_hero_sniper",
	"npc_dota_hero_sven",
	-- "npc_dota_hero_tidehunter", // 在泉水站着完全不动
	"npc_dota_hero_tiny",
	"npc_dota_hero_vengefulspirit",
	"npc_dota_hero_viper",
	"npc_dota_hero_warlock",
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

-- 测试密码
local developerSteamAccountID = {}
developerSteamAccountID[136407523]="windy"
developerSteamAccountID[1194383041]="咸鱼"
developerSteamAccountID[143575444]="茶神"
developerSteamAccountID[314757913]="孤尘"
developerSteamAccountID[916506173]="Arararara"
developerSteamAccountID[385130282]="米米花"


-- 称号属性
local lumaoSteamAccountID = Set {
	-- 成神
	128984820,
	-- 测试
	-- 916506173,
}

local luoshuSteamAccountID = Set {
	-- 洛书
	136668998,
	-- 测试
	-- 136407523,
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
			WebServer:Initial()
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
			if not self.DebugMode then
				print("[AIGameMode] Random hero list")
				self:ArrayShuffle(tBotNameList)
			end
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
		Timers:CreateTimer(1, function ()
			self:EndScreenStats(true, false)
		end)

	elseif state == DOTA_GAMERULES_STATE_PRE_GAME then
		-- modifier towers
		local tTowers = Entities:FindAllByClassname("npc_dota_tower")
		for k, v in pairs(tTowers) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				if self.iRadiantTowerPower >= 10 then
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(5)
				else
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iRadiantTowerPower)
				end
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				if self.iDireTowerPower >= 10 then
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(5)
				else
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iDireTowerPower)
				end
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end

			-- set tower split
			local towerName = v:GetName()
			if string.find(towerName, "tower4") then
				local towerSplitShot = v:AddAbility("tower_split_shot")
				if towerSplitShot then
					towerSplitShot:SetLevel(1)
					towerSplitShot:ToggleAbility()
				end
			end
		end
		local barracks = Entities:FindAllByClassname("npc_dota_barracks")
		for k, v in pairs(barracks) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end
		end
		local healer = Entities:FindAllByClassname("npc_dota_healer")
		for k, v in pairs(healer) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)
			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iDireTowerHeal)
			end
		end
		local fort = Entities:FindAllByClassname("npc_dota_fort")
		for k, v in pairs(fort) do
			if v:GetTeamNumber() == DOTA_TEAM_GOODGUYS then
				if self.iRadiantTowerPower >= 10 then
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(5)
				else
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iRadiantTowerPower)
				end
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iRadiantTowerEndure)
				v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iRadiantTowerHeal)

				v:AddNewModifier(v, nil, "modifier_multi", {}):SetStackCount(math.floor(self.fPlayerGoldXpMultiplier*10))

			elseif v:GetTeamNumber() == DOTA_TEAM_BADGUYS then
				if self.iDireTowerPower >= 10 then
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(5)
				else
					v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iDireTowerPower)
				end
				v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iDireTowerEndure)
				v:AddNewModifier(v, nil, "modifier_multi", {}):SetStackCount(self.iDireTowerHeal)

				v:AddNewModifier(v, nil, "modifier_multi", {}):SetStackCount(math.floor(self.fBotGoldXpMultiplier*10))
			end

			-- set fort split
			local towerSplitShot = v:AddAbility("tower_split_shot")
			if towerSplitShot then
				towerSplitShot:SetLevel(2)
				towerSplitShot:ToggleAbility()
			end
		end

		Timers:CreateTimer(1, function ()
			AIGameMode:RefreshGameStatus10sec()
		end)

	elseif state == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
		self.fGameStartTime = GameRules:GetGameTime()

		GameRules:SpawnNeutralCreeps()
		-- start loop in 30 seconds
		if IsClient() then return end
		Timers:CreateTimer(30, function ()
			AIGameMode:SpawnNeutralCreeps30sec()
		end)

	elseif state == DOTA_GAMERULES_STATE_POST_GAME then
		self:EndScreenStats(true, true)
	end
end


function AIGameMode:SpawnNeutralCreeps30sec()

	local GameTime = GameRules:GetDOTATime(false, false)
	print("SpawnNeutral at GetDOTATime " .. GameTime)
	GameRules:SpawnNeutralCreeps()

	-- callback every minute
	Timers:CreateTimer(60, function ()
		AIGameMode:SpawnNeutralCreeps30sec()
	end)
end


function AIGameMode:RefreshGameStatus10sec()

	-- save player info
	self:EndScreenStats(true, false)

	-- set global state
	local GameTime = GameRules:GetDOTATime(false, false)
	if (GameTime >= ((AIGameMode.botPushMin * 4) * 60)) then						-- LATEGAME
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
	elseif (GameTime >= ((AIGameMode.botPushMin + 4) * 60)) then						-- MIDGAME
		if AIGameMode.tower3PushedGood >= 2 or AIGameMode.tower3PushedBad >= 2 then
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
		end

		if AIGameMode.barrackPushedGood > 5 or AIGameMode.barrackPushedBad > 5 then
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
		elseif AIGameMode.barrackPushedGood > 2 or AIGameMode.barrackPushedBad > 2 then
			GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
		end
	elseif (GameTime >= (AIGameMode.botPushMin * 60)) then						-- MIDGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(true)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
	else													-- EARLYGAME
		GameRules:GetGameModeEntity():SetBotsInLateGame(false)
		GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
		GameRules:GetGameModeEntity():SetBotsMaxPushTier(1)
	end

	-- set creep buff level
	local buffLevelGood = 0
	local buffLevelBad = 0
	local buffLevelMegaGood = 0
	local buffLevelMegaBad = 0

	if AIGameMode.tower1PushedGood > 0 then
		buffLevelGood = buffLevelGood + 1
	end
	if AIGameMode.tower1PushedBad > 0 then
		buffLevelBad = buffLevelBad + 1
	end

	if AIGameMode.tower2PushedGood > 0 then
		buffLevelGood = buffLevelGood + 1
	end
	if AIGameMode.tower2PushedBad > 0 then
		buffLevelBad = buffLevelBad + 1
	end

	if AIGameMode.tower3PushedGood > 0 then
		buffLevelGood = buffLevelGood + 1
	end
	if AIGameMode.tower3PushedBad > 0 then
		buffLevelBad = buffLevelBad + 1
	end

	if AIGameMode.tower4PushedGood > 1 then
		buffLevelGood = buffLevelGood + 1
		buffLevelMegaGood = buffLevelMegaGood + 1
	end
	if AIGameMode.tower4PushedBad > 1 then
		buffLevelBad = buffLevelBad + 1
		buffLevelMegaBad = buffLevelMegaBad + 1
	end

	buffLevelMegaGood = buffLevelMegaGood + AIGameMode.creepBuffLevel
	buffLevelMegaBad = buffLevelMegaBad + AIGameMode.creepBuffLevel

	if (GameTime >= (15 * 60)) then
		buffLevelGood = buffLevelGood + 1
		buffLevelBad = buffLevelBad + 1
		buffLevelMegaGood = buffLevelMegaGood + 1
		buffLevelMegaBad = buffLevelMegaBad + 1
	end

	if (GameTime >= (30 * 60)) then
		buffLevelGood = buffLevelGood + 1
		buffLevelBad = buffLevelBad + 1
		buffLevelMegaGood = buffLevelMegaGood + 1
		buffLevelMegaBad = buffLevelMegaBad + 1
	end

	if (GameTime >= (45 * 60)) then
		buffLevelGood = buffLevelGood + 1
		buffLevelBad = buffLevelBad + 1
		buffLevelMegaGood = buffLevelMegaGood + 1
		buffLevelMegaBad = buffLevelMegaBad + 1
	end

	if (GameTime >= (60 * 60)) then
		buffLevelGood = buffLevelGood + 1
		buffLevelBad = buffLevelBad + 1
		buffLevelMegaGood = buffLevelMegaGood + 1
		buffLevelMegaBad = buffLevelMegaBad + 1
	end

	buffLevelGood = math.min(buffLevelGood, 8)
	buffLevelBad = math.min(buffLevelBad, 8)
	buffLevelMegaGood = math.min(buffLevelMegaGood, 8)
	buffLevelMegaBad = math.min(buffLevelMegaBad, 8)

	AIGameMode.creepBuffLevelGood = buffLevelGood
	AIGameMode.creepBuffLevelBad = buffLevelBad
	AIGameMode.creepBuffLevelMegaGood = buffLevelMegaGood
	AIGameMode.creepBuffLevelMegaBad = buffLevelMegaBad

	print("creep buff level good " .. buffLevelGood)
	print("creep buff level bad " .. buffLevelBad)
	print("creep buff level mega good " .. buffLevelMegaGood)
	print("creep buff level mega bad " .. buffLevelMegaBad)

	-- callback every 10 seconds
	Timers:CreateTimer(10, function ()
		AIGameMode:RefreshGameStatus10sec()
	end)
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
		RecordBarrackKilled(hEntity)
	end
	-- on tower killed
	if hEntity:GetClassname() == "npc_dota_tower" then
		RecordTowerKilled(hEntity)
	end
end

function RecordBarrackKilled(hEntity)
	local team = hEntity:GetTeamNumber()
	if DOTA_TEAM_GOODGUYS == team then
		AIGameMode.barrackPushedBad = AIGameMode.barrackPushedBad + 1
		print("barrackPushedBad ", AIGameMode.barrackPushedBad)
	elseif DOTA_TEAM_BADGUYS == team then
		AIGameMode.barrackPushedGood = AIGameMode.barrackPushedGood + 1
		print("barrackPushedGood ", AIGameMode.barrackPushedGood)
	end
end

function RecordTowerKilled(hEntity)
	local team = hEntity:GetTeamNumber()
	local sName = hEntity:GetUnitName()
	if string.find(sName, "tower1") then
		if DOTA_TEAM_GOODGUYS == team then
			AIGameMode.tower1PushedBad = AIGameMode.tower1PushedBad + 1
			print("tower1PushedBad ", AIGameMode.tower1PushedBad)
		elseif DOTA_TEAM_BADGUYS == team then
			AIGameMode.tower1PushedGood = AIGameMode.tower1PushedGood + 1
			print("tower1PushedGood ", AIGameMode.tower1PushedGood)
		end
	elseif string.find(sName, "tower2") then
		if DOTA_TEAM_GOODGUYS == team then
			AIGameMode.tower2PushedBad = AIGameMode.tower2PushedBad + 1
			print("tower2PushedBad ", AIGameMode.tower2PushedBad)
		elseif DOTA_TEAM_BADGUYS == team then
			AIGameMode.tower2PushedGood = AIGameMode.tower2PushedGood + 1
			print("tower2PushedGood ", AIGameMode.tower2PushedGood)
		end
	elseif string.find(sName, "tower3") then
		if DOTA_TEAM_GOODGUYS == team then
			AIGameMode.tower3PushedBad = AIGameMode.tower3PushedBad + 1
			print("tower3PushedBad ", AIGameMode.tower3PushedBad)
		elseif DOTA_TEAM_BADGUYS == team then
			AIGameMode.tower3PushedGood = AIGameMode.tower3PushedGood + 1
			print("tower3PushedGood ", AIGameMode.tower3PushedGood)
		end
	elseif string.find(sName, "tower4") then
		if DOTA_TEAM_GOODGUYS == team then
			AIGameMode.tower4PushedBad = AIGameMode.tower4PushedBad + 1
			print("tower4PushedBad ", AIGameMode.tower4PushedBad)
		elseif DOTA_TEAM_BADGUYS == team then
			AIGameMode.tower4PushedGood = AIGameMode.tower4PushedGood + 1
			print("tower4PushedGood ", AIGameMode.tower4PushedGood)
		end
	end
end
function HeroKilled(keys)
	local hHero = EntIndexToHScript(keys.entindex_killed)
	local fRespawnTime = 0
	local iLevel = hHero:GetLevel()
	local tDOTARespawnTime = {4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 60}
	if iLevel <= 40 then
		fRespawnTime = math.ceil(tDOTARespawnTime[iLevel]*AIGameMode.iRespawnTimePercentage/100.0)
	else
		fRespawnTime = math.ceil((iLevel/4 + 50)*AIGameMode.iRespawnTimePercentage/100.0)
	end

	if hHero:FindModifierByName('modifier_necrolyte_reapers_scythe') then
		fRespawnTime = fRespawnTime+hHero:FindModifierByName('modifier_necrolyte_reapers_scythe'):GetAbility():GetLevel()*10
	end

	-- 复活时间至少1s
	if fRespawnTime < 1 then
		fRespawnTime = 1
	end
	hHero:SetTimeUntilRespawn(fRespawnTime)
end

function AIGameMode:RollDrops(hHero)
    if GameRules.DropTable then
        for item_name,chance in pairs(GameRules.DropTable) do
			for i = 0, 8 do
				local hItem = hHero:GetItemInSlot(i)
				if hItem then
					local hItem_name = hItem:GetName()
					if item_name == hItem_name then
						if RollPercentage(chance) then
							-- Remove the item
							hHero:RemoveItem(hItem)
							-- Create the item
							AIGameMode:CreateItem(item_name, hHero)
						end
					end
				end
			end
        end
    end
end

function AIGameMode:CreateItem(sItemName, hEntity)
	local item = CreateItem(sItemName, nil, nil)
	local pos = hEntity:GetAbsOrigin()
	local drop = CreateItemOnPositionSync( pos, item )
	local pos_launch = pos+RandomVector(RandomFloat(150,200))
	item:LaunchLoot(false, 200, 0.75, pos_launch)
end

function AIGameMode:OnNPCSpawned(keys)
	if GameRules:State_Get() < DOTA_GAMERULES_STATE_PRE_GAME then
		Timers:CreateTimer(1, function ()
			AIGameMode:OnNPCSpawned(keys)
		end)
		return
	end
	local hEntity = EntIndexToHScript(keys.entindex)
	if hEntity:IsNull() then return end

	if hEntity:IsCourier() and self.bFastCourier == 1 then
		hEntity:AddNewModifier(hEntity, nil, "modifier_courier_speed", {})
		return
	end

	local sName = hEntity:GetName()
	if sName == "npc_dota_creep_lane" or sName == "npc_dota_creep_siege" then
		local sUnitName = hEntity:GetUnitName()
		local team = hEntity:GetTeamNumber()
		local buffLevel = 0
		local buffLevelMega = 0
		if DOTA_TEAM_GOODGUYS == team then
			buffLevel = AIGameMode.creepBuffLevelGood
			buffLevelMega = AIGameMode.creepBuffLevelMegaGood
		elseif DOTA_TEAM_BADGUYS == team then
			buffLevel = AIGameMode.creepBuffLevelBad
			buffLevelMega = AIGameMode.creepBuffLevelMegaBad
		end

		if buffLevel > 0 then
			if not string.find(sUnitName, "upgraded") and not string.find(sUnitName, "mega") then
				-- normal creep
				local ability = hEntity:AddAbility("creep_buff")
				ability:SetLevel(buffLevel)
				return
			end
		end

		if buffLevelMega > 0 then
			if string.find(sUnitName, "upgraded") and not string.find(sUnitName, "mega") then
				-- upgrade creep
				local ability = hEntity:AddAbility("creep_buff_upgraded")
				ability:SetLevel(buffLevel)
				return
			elseif string.find(sUnitName, "mega") then
				-- mega creep
				local ability = hEntity:AddAbility("creep_buff_mega")
				ability:SetLevel(buffLevel)
				return
			end
		end
	end

	if hEntity:IsCreep() then
		if sName == "npc_dota_roshan" then
			local ability_roshan_buff = hEntity:FindAbilityByName("roshan_buff")
			ability_roshan_buff:SetLevel(self.roshanNumber)
			local ability_gold_bag = hEntity:FindAbilityByName("generic_gold_bag_fountain")
			ability_gold_bag:SetLevel(self.roshanNumber)

			self.roshanNumber = self.roshanNumber + 1
			if self.roshanNumber > 4 then
				self.roshanNumber = 4
			end
			return
		end
	end

	if sName == "npc_dota_lone_druid_bear" then
		hEntity:AddNewModifier(hEntity, nil, "modifier_melee_resistance", {})
	end

	if hEntity:IsRealHero() and not hEntity.bInitialized then
		if hEntity:GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK or sName == "npc_dota_hero_troll_warlord" or sName == "npc_dota_hero_lone_druid" then
			hEntity:AddNewModifier(hEntity, nil, "modifier_melee_resistance", {})
		end

		if sName == "npc_dota_hero_sniper" and not self.bSniperScepterThinkerApplierSet then
			require('heroes/hero_sniper/sniper_init')
			SniperInit(hEntity, self)
		end

		-- Bots modifier 机器人AI脚本
		if not self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] then
			if not hEntity:HasModifier("modifier_bot_think_strategy") then
				hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_strategy", {})
			end
			if not hEntity:HasModifier("modifier_bot_think_item_use") then
				hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_item_use", {})
			end
			if tBotItemData.wardHeroList[sName] then
				if not hEntity:HasModifier("modifier_bot_think_ward") then
					hEntity:AddNewModifier(hEntity, nil, "modifier_bot_think_ward", {})
				end
			end
			hEntity:SetControllableByPlayer(-1, true)
		end

		-- Player Buff
		if self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] then
			local steamAccountID = PlayerResource:GetSteamAccountID(hEntity:GetPlayerOwnerID())
			if lumaoSteamAccountID[steamAccountID] then
				LinkLuaModifier("modifier_lumao", "modifiers/player/modifier_lumao", LUA_MODIFIER_MOTION_NONE)
				hEntity:AddNewModifier(hEntity, nil, "modifier_lumao", {})
			end
			if luoshuSteamAccountID[steamAccountID] then
				LinkLuaModifier("modifier_saber", "modifiers/player/modifier_saber", LUA_MODIFIER_MOTION_NONE)
				hEntity:AddNewModifier(hEntity, nil, "modifier_saber", {})
			end
			if WebServer.memberSteamAccountID[steamAccountID] then
				hEntity:AddNewModifier(hEntity, nil, "modifier_member", {})
			end
		end

		hEntity.bInitialized = true
	end
end


function AIGameMode:OnPlayerLevelUp(keys)
	local iEntIndex=PlayerResource:GetPlayer(keys.player-1):GetAssignedHero():entindex()
	local iLevel=keys.level
	-- Set DeathXP 击杀经验
	Timers:CreateTimer(0.5, function ()
		local hEntity = EntIndexToHScript(iEntIndex)
		if hEntity:IsNull() then return end
		if iLevel <= 30 then
			hEntity:SetCustomDeathXP(40 + hEntity:GetCurrentXP()*0.09)
		else
			hEntity:SetCustomDeathXP(3500 + hEntity:GetCurrentXP()*0.03)
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

function AIGameMode:OnItemPickedUp( event )
	-- if not courier
	if not event.HeroEntityIndex then return end

	local item = EntIndexToHScript( event.ItemEntityIndex )
	local hHero = EntIndexToHScript( event.HeroEntityIndex )
	if event.PlayerID ~= nil and item ~= nil and hHero ~= nil and item:GetAbilityName() == "item_bag_of_gold" then
		local iGold = item:GetSpecialValueFor("bonus_gold")
		hHero:ModifyGoldFiltered(iGold, true, DOTA_ModifyGold_RoshanKill)
		SendOverheadEventMessage(hHero, OVERHEAD_ALERT_GOLD, hHero, iGold, nil)
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
	if args.game_options.radiant_bot_same_multi == 1 or args.game_options.radiant_bot_same_multi == "1" then
		self.bRadiantBotSameMulti = true
	else
		self.bRadiantBotSameMulti = false
	end
	self:PreGameOptions()
end

function AIGameMode:OnGameOptionChange(keys)
	local optionName = keys.optionName
	local optionValue = keys.optionValue
	-- 对应的游戏选择项目设定
	GameRules.GameOption[optionName]=optionValue
	CustomNetTables:SetTableValue('game_options_table', 'game_option', GameRules.GameOption)
end


function AIGameMode:OnPlayerChat( event )
	local iPlayerID = event.playerid
	local sChatMsg = event.text
	if not iPlayerID or not sChatMsg then return end
	local steamAccountID = PlayerResource:GetSteamAccountID(iPlayerID)

	if developerSteamAccountID[steamAccountID] then
		if sChatMsg:find( '^-greedisgood$' ) then
			-- give money to the player
			-- get hero
			local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
			local iGold = 10000
			hHero:ModifyGold(iGold, true, DOTA_ModifyGold_Unspecified)
			GameRules:SendCustomMessage(
				"号外号外！开发者:"..developerSteamAccountID[steamAccountID].." 用自己的菊花交换了增加10000金币",
				DOTA_TEAM_GOODGUYS,
				0
			)
			return
		end
		if sChatMsg:find( '^pos$' ) then
			-- get position
			local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
			-- print position
			local pos = hHero:GetAbsOrigin()
			GameRules:SendCustomMessage(
				"开发者:"..developerSteamAccountID[steamAccountID].." 的位置是:"..pos.x..","..pos.y..","..pos.z,
				DOTA_TEAM_GOODGUYS,
				0
			)
			print("开发者:"..developerSteamAccountID[steamAccountID].." 的位置是:"..pos.x..","..pos.y..","..pos.z)
			return
		end

		if sChatMsg:find( '^modifier$' ) then
			-- get position
			local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
			-- print all modifiers
			local modifiers = hHero:FindAllModifiers()
			for _,modifier in pairs(modifiers) do
				print("Get here modifiers: ", modifier:GetName())
			end
			return
		end
	end

	if WebServer.memberSteamAccountID[steamAccountID] then
		local pszHeroClass
		if sChatMsg:find( '^圣剑.*解放.*$' ) then
			pszHeroClass = "npc_dota_hero_broodmother"
		end
		if pszHeroClass ~= nil then
			local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
			PlayerResource:ReplaceHeroWith(iPlayerID, pszHeroClass, hHero:GetGold(), hHero:GetCurrentXP())
			return
		end
	end
	if WebServer.memberAbyssAccountID[steamAccountID] then
		local pszHeroClass
		if sChatMsg:find( '沉渊之剑' ) then
			pszHeroClass = "npc_dota_hero_visage"
		end
		if pszHeroClass ~= nil then
			local hHero = PlayerResource:GetSelectedHeroEntity(iPlayerID)
			PlayerResource:ReplaceHeroWith(iPlayerID, pszHeroClass, hHero:GetGold(), hHero:GetCurrentXP())
			return
		end
	end
end


function AIGameMode:EndScreenStats(isWinner, bTrueEnd)
    local time = GameRules:GetDOTATime(false, true)
    --local matchID = tostring(GameRules:GetMatchID())

    local data = {
        version = "1.18",
        --matchID = matchID,
        mapName = GetMapName(),
        players = {},
        options = {},
        isWinner = isWinner,
        duration = math.floor(time),
        flags = {}
    }

	data.options = {
		playerGoldXpMultiplier = tostring(self.fPlayerGoldXpMultiplier),
		botGoldXpMultiplier = self.fBotGoldXpMultiplier > 10 and "??" or self.fBotGoldXpMultiplier,
		radiantTowerPower = AIGameMode:StackToPercentage(self.iRadiantTowerPower),
		direTowerPower = AIGameMode:StackToPercentage(self.iDireTowerPower),
	}

    for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
        if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and PlayerResource:GetSelectedHeroEntity(playerID) then
            local hero = PlayerResource:GetSelectedHeroEntity(playerID)
            if hero and IsValidEntity(hero) and not hero:IsNull() then
                -- local tip_points = WebServer.TipCounter[playerID] or 0
				local steamAccountID = PlayerResource:GetSteamAccountID(playerID)
                local membership = WebServer.memberSteamAccountID[steamAccountID] and true or false
                local damage = PlayerResource:GetRawPlayerDamage(playerID)
                local damagereceived = 0

                for victimID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
					if PlayerResource:IsValidPlayerID(victimID) and PlayerResource:IsValidPlayer(victimID) and PlayerResource:GetSelectedHeroEntity(victimID) then
						if PlayerResource:GetTeam(victimID) ~= PlayerResource:GetTeam(playerID) then
							damagereceived = damagereceived + PlayerResource:GetDamageDoneToHero(victimID, playerID)
						end
					end
				end

                local playerInfo = {
                    steamid = tostring(PlayerResource:GetSteamID(playerID)),
                    steamAccountID = steamAccountID,
                    membership = membership,
                    kills = PlayerResource:GetKills(playerID) or 0,
                    deaths = PlayerResource:GetDeaths(playerID) or 0,
                    assists = PlayerResource:GetAssists(playerID) or 0,
                    damage = damage or 0,
                    damagereceived = damagereceived or 0,
                    heroName = hero:GetUnitName() or "Haachama",
                    lasthits = PlayerResource:GetLastHits(playerID) or 0,
                    heroHealing = PlayerResource:GetHealing(playerID) or 0,
                    str = hero:GetStrength() or 0,
                    agi = hero:GetAgility() or 0,
                    int = hero:GetIntellect() or 0,
                    items = {},
                }


				for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
					local item = hero:GetItemInSlot(item_slot)
					if item then
						playerInfo.items[item_slot] = item:GetAbilityName()
					end
				end

				local hNeutralItem = hero:GetItemInSlot(DOTA_ITEM_NEUTRAL_SLOT)
				if hNeutralItem then
					playerInfo.items[DOTA_ITEM_NEUTRAL_SLOT] = hNeutralItem:GetAbilityName()
				end

                data.players[playerID] = playerInfo
            end
        end
    end

    local sTable = "ending_stats"

    CustomNetTables:SetTableValue(sTable, "player_data", data)
end

function AIGameMode:StackToPercentage(iStackCount)
	if iStackCount == 1 then
		return "50%"
	elseif iStackCount == 2 then
		return "75%"
	elseif iStackCount == 3 then
		return "100%"
	elseif iStackCount == 4 then
		return "125%"
	elseif iStackCount == 5 then
		return "150%"
	elseif iStackCount == 6 then
		return "175%"
	elseif iStackCount == 7 then
		return "200%"
	elseif iStackCount == 8 then
		return "250%"
	elseif iStackCount == 9 then
		return "300%"
	elseif iStackCount == 10 then
		return "??"
	else
		return "100%"
	end
end
