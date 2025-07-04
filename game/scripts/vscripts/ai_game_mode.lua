function Precache(context)
    PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_alchemist.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/game_sounds_custom.vsndevts", context)
end

if AIGameMode == nil then
    _G.AIGameMode = class({}) -- put in the global scope
end

require('timers')
require('util')
require('bot/bot_item_data')
require('events')
require('bot/bot_think_item_build')
require('bot/bot_think_item_use')
require('bot/bot_think_ability_use')
require('bot/bot_think_modifier')

function Activate()
    AIGameMode:InitGameMode()
end

function Precache(context)
    PrecacheResource("soundfile", "soundevents/hero_artoria.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_abyss_sword.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/voscripts/game_sounds_vo_abyss_sword.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_goku.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_saber.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/yukari_yakumo.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/hero_themes.vsndevts", context)
    PrecacheResource("soundfile", "soundevents/voscripts/game_sounds_vo_jack.vsndevts", context)
end

function AIGameMode:InitGameMode()
    AIGameMode:InitEvents()
    AIGameMode:LinkLuaModifiers()
    AIGameMode:InitGlobalVariables()
    if IsInToolsMode() then
        print("========Enter Debug Mode========")
        self.DebugMode = true
    end
    print("DOTA 2 AI Wars Loaded.")
end

function AIGameMode:InitGlobalVariables()
    -- AI连续死亡记录表
    AIGameMode.BotRecordSuccessiveDeathTable = {}
end

function AIGameMode:InitEvents()
    ListenToGameEvent("game_rules_state_change", Dynamic_Wrap(AIGameMode, "OnGameStateChanged"), self)
    ListenToGameEvent("npc_spawned", Dynamic_Wrap(AIGameMode, "OnNPCSpawned"), self)
    ListenToGameEvent("entity_killed", Dynamic_Wrap(AIGameMode, "OnEntityKilled"), self)
    ListenToGameEvent("dota_item_picked_up", Dynamic_Wrap(AIGameMode, "OnItemPickedUp"), self)

    -- 游戏选项事件
    CustomGameEventManager:RegisterListener("loading_set_options", function(eventSourceIndex, args)
        return AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args)
    end)
    -- 共享单位，禁用帮助
    CustomGameEventManager:RegisterListener("set_unit_share_mask", function(_, keys)
        return AIGameMode:SetUnitShareMask(keys)
    end)
end

function AIGameMode:LinkLuaModifiers()
    LinkLuaModifier("modifier_bot_think_strategy", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
    LinkLuaModifier("modifier_bot_think_item_use", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
    LinkLuaModifier("modifier_bot_think_ward", "bot/bot_think_modifier.lua", LUA_MODIFIER_MOTION_NONE)
end

function AIGameMode:PreGameOptions()
    self.iDesiredRadiant = self.iDesiredRadiant or 1
    self.iDesiredDire = self.iDesiredDire or 1

    self.fPlayerGoldXpMultiplier = self.fPlayerGoldXpMultiplier or 1
    self.fBotGoldXpMultiplier = self.fBotGoldXpMultiplier or 1

    self.iRespawnTimePercentage = self.iRespawnTimePercentage or 1
    self.iMaxLevel = self.iMaxLevel or 50

    self.iTowerPower = self.iTowerPower or 3

    self.iStartingGoldPlayer = self.iStartingGoldPlayer or 600
    self.iStartingGoldBot = self.iStartingGoldBot or 600
    self.bSameHeroSelection = self.bSameHeroSelection or 1
    self.fGameStartTime = 0

    local gameMode = GameRules:GetGameModeEntity()

    if self.bSameHeroSelection == 1 then
        GameRules:SetSameHeroSelectionEnabled(true)
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

    -- 初始化
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


    if self.fBotGoldXpMultiplier <= 3 then
        self.botPushMin = RandomInt(16, 20)
    elseif self.fBotGoldXpMultiplier <= 5 then
        self.botPushMin = RandomInt(13, 16)
    elseif self.fBotGoldXpMultiplier <= 8 then
        self.botPushMin = RandomInt(11, 13)
    elseif self.fBotGoldXpMultiplier <= 10 then
        self.botPushMin = RandomInt(8, 10)
    else
        self.botPushMin = RandomInt(5, 7)
    end

    print("botPushMin: " .. self.botPushMin)

    BotThink:SetTome()

    self.PreGameOptionsSet = true
end

-- FIXME 移除相关调用
-- 根据playerid获取金钱经验倍率
function AIGameMode:GetPlayerGoldXpMultiplier(iPlayerID)
    local mul = 1

    if IsHumanPlayer(iPlayerID) then
        mul = self.fPlayerGoldXpMultiplier
    elseif IsGoodTeamPlayer(iPlayerID) then
        mul = self.fPlayerGoldXpMultiplier
    else
        mul = self.fBotGoldXpMultiplier
    end

    return mul
end
