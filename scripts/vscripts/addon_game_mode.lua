function Precache( context )
	PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_alchemist.vsndevts", context )
	PrecacheResource("soundfile", "soundevents/game_sounds_custom.vsndevts", context )
end

if AIGameMode == nil then
	_G.AIGameMode = class({}) -- put in the global scope
end

require('timers')
require('settings')
require('events')
require('util')
require('bot/bot_think_item_build')
require('bot/bot_think_modifier')

function Activate()
	AIGameMode:InitGameMode()
end


function AIGameMode:InitGameMode()
	AIGameMode:InitGameOptions()
	AIGameMode:InitEvents()
	AIGameMode:LinkLuaModifiers()
	if IsInToolsMode() then
		self:EnterDebugMode()
	end
	print("DOTA 2 AI Wars Loaded.")
end


function AIGameMode:EnterDebugMode()
	print("========Enter Debug Mode========")
	self.DebugMode = true
	GameRules:SetCustomGameSetupAutoLaunchDelay( 10 )
	GameRules:SetPreGameTime( 30 )
	GameRules:SetStrategyTime( 10 )
	print("DOTA 2 AI Wars Loaded.")
end

function AIGameMode:InitGameOptions()
	GameRules:SetCustomGameSetupAutoLaunchDelay( AUTO_LAUNCH_DELAY )
	GameRules:LockCustomGameSetupTeamAssignment( LOCK_TEAM_SETUP )
	GameRules:EnableCustomGameSetupAutoLaunch( ENABLE_AUTO_LAUNCH )
	GameRules:SetHeroSelectionTime( HERO_SELECTION_TIME )
	GameRules:SetPreGameTime( PRE_GAME_TIME )
	GameRules:SetCustomGameTeamMaxPlayers(DOTA_TEAM_GOODGUYS, RADIANT_PLAYER_COUNT)
	GameRules:SetCustomGameTeamMaxPlayers(DOTA_TEAM_BADGUYS, DIRE_PLAYER_COUNT)
	GameRules:SetStrategyTime( STRATEGY_TIME )
	GameRules:SetShowcaseTime(0)
	GameRules:GetGameModeEntity():SetFreeCourierModeEnabled(true)

	GameRules.DropTable = LoadKeyValues("scripts/kv/item_drops.kv")
	-- 游戏选择项目初期化
	GameRules.GameOption = LoadKeyValues("scripts/kv/game_option.kv")
end


function AIGameMode:InitEvents()
	ListenToGameEvent("game_rules_state_change", Dynamic_Wrap(AIGameMode, "OnGameStateChanged"), self)
	ListenToGameEvent("dota_player_gained_level", Dynamic_Wrap(AIGameMode, "OnPlayerLevelUp"), self)
	ListenToGameEvent("npc_spawned", Dynamic_Wrap(AIGameMode, "OnNPCSpawned"), self)
	ListenToGameEvent("entity_killed", Dynamic_Wrap(AIGameMode, "OnEntityKilled"), self)
	--JS events
	CustomGameEventManager:RegisterListener("loading_set_options", function (eventSourceIndex, args) return AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args) end)
	-- 游戏选项改变事件
	CustomGameEventManager:RegisterListener("game_options_change", function(_, keys) return AIGameMode:OnGameOptionChange(keys) end)

end


function AIGameMode:LinkLuaModifiers()
	LinkLuaModifier("modifier_courier_speed", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_melee_resistance", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_tower_power", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_tower_endure", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_tower_heal", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_multi", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_sniper_assassinate_thinker", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_out_of_world", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)

	LinkLuaModifier("modifier_bot_think_strategy", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_bot_think_item_use", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
end


function AIGameMode:PreGameOptions()
	self.iDesiredRadiant = self.iDesiredRadiant or RADIANT_PLAYER_COUNT
	self.iDesiredDire = self.iDesiredDire or DIRE_PLAYER_COUNT

	self.fPlayerGoldXpMultiplier = self.fPlayerGoldXpMultiplier or PLAYER_GOLD_XP_MULTIPLIER
	self.fBotGoldXpMultiplier = self.fBotGoldXpMultiplier or BOT_GOLD_XP_MULTIPLIER

	self.iGoldPerTick = self.iGoldPerTick or GOLD_PER_TICK
	self.iGoldTickTime = self.iGoldTickTime or GOLD_TICK_TIME
	self.iRespawnTimePercentage = self.iRespawnTimePercentage or 1
	self.iMaxLevel = self.iMaxLevel or MAX_LEVEL
	self.iRadiantTowerPower = self.iRadiantTowerPower or 3
	self.iDireTowerPower = self.iDireTowerPower or 3
	self.iRadiantTowerEndure = self.iRadiantTowerEndure or 3
	self.iDireTowerEndure = self.iDireTowerEndure or 3
	self.iRadiantTowerHeal = self.iRadiantTowerHeal or 0
	self.iDireTowerHeal = self.iDireTowerHeal or 0
	self.iStartingGoldPlayer = self.iStartingGoldPlayer or 600
	self.iStartingGoldBot = self.iStartingGoldBot or 600
	self.bSameHeroSelection = self.bSameHeroSelection or 1
	self.bFastCourier = self.bFastCourier or 1
	self.fGameStartTime = 0
	GameRules:SetGoldPerTick(self.iGoldPerTick)
	GameRules:SetGoldTickTime(self.iGoldTickTime)
	GameRules:SetUseUniversalShopMode( true )
	GameRules:GetGameModeEntity():SetModifyGoldFilter( Dynamic_Wrap( AIGameMode, "FilterGold" ), self )
	GameRules:GetGameModeEntity():SetModifyExperienceFilter( Dynamic_Wrap( AIGameMode, "FilterXP" ), self )
	GameRules:GetGameModeEntity():SetRuneSpawnFilter( Dynamic_Wrap( AIGameMode, "FilterRune" ), self )
	GameRules:GetGameModeEntity():SetTowerBackdoorProtectionEnabled( true )
	GameRules:GetGameModeEntity():SetMaximumAttackSpeed( 1000 )
	-- 每点敏捷提供护甲
	GameRules:GetGameModeEntity():SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_AGILITY_ARMOR, 0.143)

	if self.DebugMode then
		GameRules:GetGameModeEntity():SetItemAddedToInventoryFilter( Dynamic_Wrap( AIGameMode, "FilterItemAdd" ), self )
	end
	-- loop functions
	AIGameMode:SpawnNeutralCreeps30sec()


	if self.bSameHeroSelection == 1 then
		GameRules:SetSameHeroSelectionEnabled( true )
	end
	if self.iMaxLevel ~= 30 then
		local tLevelRequire = {
			0,
			180,
			510,
			960,
			1520,
			2110,
			2850,
			3640,
			4480,
			5370,
			6310,
			7380,
			8580,
			10005,
			11555,
			13230,
			15030,
			16955,
			18955,
			21045,
			23145,
			25495,
			28095,
			30945,
			34045,
			37545,
			42045,
			47545,
			54045,
			61545,
		} -- value fixed
		local iRequireLevel = tLevelRequire[30]
		for i = 31, self.iMaxLevel do
			iRequireLevel = iRequireLevel+i*200
			table.insert(tLevelRequire, iRequireLevel)
		end
		GameRules:GetGameModeEntity():SetUseCustomHeroLevels( true )
		GameRules:SetUseCustomHeroXPValues( true )
		GameRules:GetGameModeEntity():SetCustomHeroMaxLevel(self.iMaxLevel)
		GameRules:GetGameModeEntity():SetCustomXPRequiredToReachNextLevel(tLevelRequire)
	end


	self.sumTowerPower = (AIGameMode.iRadiantTowerPower + AIGameMode.iDireTowerPower)
	self.creepBuffLevel = 0
	if self.sumTowerPower <= 10 then
		-- 150%
		self.creepBuffLevel = 0
	elseif self.sumTowerPower <= 12 then
		-- 175%
		self.creepBuffLevel = 1
	elseif self.sumTowerPower <= 14 then
		-- 200%
		self.creepBuffLevel = 2
	elseif self.sumTowerPower <= 16 then
		-- 250%
		self.creepBuffLevel = 3
	else
		-- 300%
		self.creepBuffLevel = 4
	end

	self.barrackPushedBad = 0
	self.barrackPushedGood = 0

	self.tower3PushedBad = 0
	self.tower3PushedGood = 0
	self.tower4PushedBad = 0
	self.tower4PushedGood = 0

	self.roshanNumber = 0

	self.botPushMin = RandomInt(9, 11)

	self.PreGameOptionsSet = true
end

function AIGameMode:SpawnNeutralCreeps30sec()
	GameRules:SpawnNeutralCreeps()
	Timers:CreateTimer(30, function ()
		AIGameMode:SpawnNeutralCreeps30sec()
	end)
end

------------------------------------------------------------------
--                        Gold/XP Filter                        --
------------------------------------------------------------------
function AIGameMode:FilterGold(tGoldFilter)
	local iGold = tGoldFilter["gold"]
	local iPlayerID = tGoldFilter["player_id_const"]
	local iReason = tGoldFilter["reason_const"]

	if iReason == DOTA_ModifyGold_HeroKill then

			if iGold > 2000 then
				iGold = 1000
			elseif iGold > 1000 then
				iGold = iGold/4 + 500
			elseif iGold > 500 then
				iGold = iGold/2 + 250
			else
				iGold = iGold
			end
	end

	if self.tHumanPlayerList[iPlayerID] then
		tGoldFilter["gold"] = math.floor(iGold*self.fPlayerGoldXpMultiplier)
	else
		tGoldFilter["gold"] = math.floor(iGold*self.fBotGoldXpMultiplier)
	end
	return true
end


function AIGameMode:FilterXP(tXPFilter)
	local iXP = tXPFilter["experience"]
	local iPlayerID = tXPFilter["player_id_const"]
	local iReason = tXPFilter["reason_const"]

	if self.tHumanPlayerList[iPlayerID] then
		tXPFilter["experience"] = math.floor(iXP*self.fPlayerGoldXpMultiplier)
	else
		tXPFilter["experience"] = math.floor(iXP*self.fBotGoldXpMultiplier)
	end
	return true
end


local bFirstRuneShouldSpawned = false
local bFirstRuneActuallySpawned = false
local tPossibleRunes = {
	DOTA_RUNE_ILLUSION,
	DOTA_RUNE_REGENERATION,
	DOTA_RUNE_HASTE,
	DOTA_RUNE_INVISIBILITY,
	DOTA_RUNE_DOUBLEDAMAGE,
	DOTA_RUNE_ARCANE
}

local tLastRunes = {}

function AIGameMode:FilterRune(tRuneFilter)
	if GameRules:GetGameTime() < 300+self.fGameStartTime then
		return true
	elseif GameRules:GetGameTime() > 2395+self.fGameStartTime then
		tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
		while tRuneFilter.rune_type == tLastRunes[tRuneFilter.spawner_entindex_const] do
			tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
		end
		tLastRunes[tRuneFilter.spawner_entindex_const] = tRuneFilter.rune_type
		return true
	else
		if bFirstRuneShouldSpawned then
			if bFirstRuneActuallySpawned then
				tLastRunes[tRuneFilter.spawner_entindex_const] = nil
				bFirstRuneShouldSpawned = false
				return false
			else
				tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
				while tRuneFilter.rune_type == tLastRunes[tRuneFilter.spawner_entindex_const] do
					tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
				end
				tLastRunes[tRuneFilter.spawner_entindex_const] = tRuneFilter.rune_type
				bFirstRuneShouldSpawned = false
				return true
			end
		else
			if RandomInt(0,1) > 0 then
				bFirstRuneActuallySpawned = true
				bFirstRuneShouldSpawned = true
				tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
				while tRuneFilter.rune_type == tLastRunes[tRuneFilter.spawner_entindex_const] do
					tRuneFilter.rune_type = tPossibleRunes[RandomInt(1, 6)]
				end
				tLastRunes[tRuneFilter.spawner_entindex_const] = tRuneFilter.rune_type
				return true
			else
				bFirstRuneActuallySpawned = false
				bFirstRuneShouldSpawned = true
				tLastRunes[tRuneFilter.spawner_entindex_const] = nil
				return false
			end
		end
	end
end

-- only run in tool debug mode
function AIGameMode:FilterItemAdd(tItemFilter)
	local item = EntIndexToHScript(tItemFilter.item_entindex_const)
	if item then
		if item:GetAbilityName() == "item_rapier" then
			return true
		end
		local itemPurchaseName = item:GetPurchaseTime()
		if itemPurchaseName == -100 then
			return true
		end
		local purchaser = item:GetPurchaser()
		if purchaser then
			if purchaser:IsControllableByAnyPlayer() then
				return true
			else
				return false
			end
		end
	end

	return true
end
