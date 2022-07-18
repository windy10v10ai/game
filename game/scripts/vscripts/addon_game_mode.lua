function Precache( context )
	PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_alchemist.vsndevts", context )
	PrecacheResource("soundfile", "soundevents/game_sounds_custom.vsndevts", context )
end

if AIGameMode == nil then
	_G.AIGameMode = class({}) -- put in the global scope
end

require('timers')
require('util')
require('settings')
require('bot/bot_item_data')
require('events')
require('bot/bot_think_item_build')
require('bot/bot_think_item_use')
require('bot/bot_think_ability_use')
require('bot/bot_think_modifier')
require('web/web_server')

function Activate()
	AIGameMode:InitGameMode()
end

function Precache( context )
    PrecacheResource("soundfile", "soundevents/hero_artoria.vsndevts", context)
	PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_abyss_sword.vsndevts", context)
	PrecacheResource("soundfile", "soundevents/voscripts/game_sounds_vo_abyss_sword.vsndevts", context)
	PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_goku.vsndevts", context)
	PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_saber.vsndevts", context)
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
	GameRules:SetCustomGameSetupAutoLaunchDelay( 30 )
	GameRules:SetHeroSelectionTime( 15 )
	GameRules:SetStrategyTime( 10 )
	GameRules:SetPreGameTime( 10 )
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
	ListenToGameEvent( "dota_item_picked_up", Dynamic_Wrap( AIGameMode, "OnItemPickedUp" ), self )
	ListenToGameEvent( "player_chat", Dynamic_Wrap( AIGameMode, "OnPlayerChat" ), self )
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
	LinkLuaModifier("modifier_sniper_assassinate_thinker", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_out_of_world", "global_modifiers.lua", LUA_MODIFIER_MOTION_NONE)

	LinkLuaModifier("modifier_bot_think_strategy", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_bot_think_item_use", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_bot_think_ward", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
	LinkLuaModifier("modifier_member", "modifiers/player/modifier_member", LUA_MODIFIER_MOTION_NONE)
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

	self.iTowerPower = self.iTowerPower or 3
	self.iTowerEndure = self.iTowerEndure or 3
	self.iTowerHeal = self.iTowerHeal or 0

	self.iStartingGoldPlayer = self.iStartingGoldPlayer or 600
	self.iStartingGoldBot = self.iStartingGoldBot or 600
	self.bSameHeroSelection = self.bSameHeroSelection or 1
	self.bFastCourier = self.bFastCourier or 1
	self.fGameStartTime = 0
	GameRules:SetGoldPerTick(self.iGoldPerTick)
	GameRules:SetGoldTickTime(self.iGoldTickTime)
	GameRules:SetUseUniversalShopMode( true )

	local gameMode = GameRules:GetGameModeEntity()
	gameMode:SetModifyGoldFilter( Dynamic_Wrap( AIGameMode, "FilterGold" ), self )
	GameRules:GetGameModeEntity():SetModifyExperienceFilter( Dynamic_Wrap( AIGameMode, "FilterXP" ), self )

	-- 神符
	gameMode:SetUseDefaultDOTARuneSpawnLogic( true )

	gameMode:SetTowerBackdoorProtectionEnabled( true )
	gameMode:SetMaximumAttackSpeed( MAXIMUM_ATTACK_SPEED )
	gameMode:SetMinimumAttackSpeed( MINIMUM_ATTACK_SPEED )
	-- 每点敏捷提供护甲
	gameMode:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_AGILITY_ARMOR, 0.143)

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


	self.sumTowerPower = AIGameMode.iTowerPower
	self.creepBuffLevel = 0
	self.creepBuffLevelGood = 0
	self.creepBuffLevelBad = 0
	self.creepBuffLevelMegaGood = 0
	self.creepBuffLevelMegaBad = 0
	if self.sumTowerPower <= 5 then
		-- 150%
		self.creepBuffLevel = 0
	elseif self.sumTowerPower <= 7 then
		-- 200%
		self.creepBuffLevel = 1
	elseif self.sumTowerPower <= 8 then
		-- 250%
		self.creepBuffLevel = 2
	elseif self.sumTowerPower <= 9 then
		-- 300%
		self.creepBuffLevel = 3
	else
		-- 500%
		self.creepBuffLevel = 4
	end

	self.barrackPushedBad = 0
	self.barrackPushedGood = 0

	self.tower1PushedBad = 0
	self.tower1PushedGood = 0
	self.tower2PushedBad = 0
	self.tower2PushedGood = 0
	self.tower3PushedBad = 0
	self.tower3PushedGood = 0
	self.tower4PushedBad = 0
	self.tower4PushedGood = 0

	self.roshanNumber = 0

	if self.fBotGoldXpMultiplier < 5 then
		self.botPushMin = RandomInt(12, 14)
	elseif self.fBotGoldXpMultiplier <= 5 then
		self.botPushMin = RandomInt(10, 12)
	elseif self.fBotGoldXpMultiplier <= 8 then
		self.botPushMin = RandomInt(8, 10)
	else
		self.botPushMin = RandomInt(6, 8)
	end

	print("botPushMin: "..self.botPushMin)

	BotThink:SetTome()

	self.PreGameOptionsSet = true
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
		if self.bRadiantBotSameMulti and PlayerResource:GetTeam(iPlayerID) == DOTA_TEAM_GOODGUYS then
			tGoldFilter["gold"] = math.floor(iGold*self.fPlayerGoldXpMultiplier)
		else
			tGoldFilter["gold"] = math.floor(iGold*self.fBotGoldXpMultiplier)
		end
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
		if self.bRadiantBotSameMulti and PlayerResource:GetTeam(iPlayerID) == DOTA_TEAM_GOODGUYS then
			tXPFilter["experience"] = math.floor(iXP*self.fPlayerGoldXpMultiplier)
		else
			tXPFilter["experience"] = math.floor(iXP*self.fBotGoldXpMultiplier)
		end
	end
	return true
end
