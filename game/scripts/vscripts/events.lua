require('modifiers/player/enable_player_modifier')
require('event/js_event')
require('event/creep')
require('event/chat')
require('event/kill')
require('event/bot_herolist')

local tSkillCustomNameList = { "npc_dota_hero_crystal_maiden", "npc_dota_hero_queenofpain", "npc_dota_hero_mirana",
                               "npc_dota_hero_earthshaker", "npc_dota_hero_nevermore" }

local tAPLevelList = { 17, 19, 21, 22, 23, 24, 26 }


function AIGameMode:ArrayShuffle(array)
    local size = #array
    for i = size, 1, -1 do
        local rand = math.random(size)
        array[i], array[rand] = array[rand], array[i]
    end
    return array
end

function AIGameMode:GetFreeHeroName(isRadiant)
    local tFreeHeroName = tBotNameList
    if not isRadiant and self.iGameDifficulty == 6 then
        tFreeHeroName = tBotAllStar
    end
    print("tFreeHeroName".. tostring(isRadiant))
    PrintTable(tFreeHeroName)
    for i, v in ipairs(tFreeHeroName) do
        if PlayerResource:WhoSelectedHero(v, false) < 0 then
            return v
        end
    end
    return "npc_dota_hero_luna" -- Should never get here
end

function AIGameMode:InitHeroSelection()
    if self.PreGameOptionsSet then
        print("[AIGameMode] InitSettings")
        -- 初始化玩家列表和初期金钱
        self.tHumanPlayerList = {}
        -- 是否更换了会员英雄
        self.tIfChangeHeroList = {}
        -- 是否选择了物品
        self.tIfItemChosen = {}
        self.tIfItemChooseInited = {}
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:GetConnectionState(i) ~= DOTA_CONNECTION_STATE_UNKNOWN then
                -- set human player list
                self.tHumanPlayerList[i] = true
                self.tIfChangeHeroList[i] = false
                self.tIfItemChosen[i] = false
                self.tIfItemChooseInited[i] = false
                -- set start gold
                PlayerResource:SetGold(i, (self.iStartingGoldPlayer - 600), true)
            end
        end

        -- 添加bot和初期金钱
        local iPlayerNumRadiant = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_GOODGUYS)
        local iPlayerNumDire = PlayerResource:GetPlayerCountForTeam(DOTA_TEAM_BADGUYS)
        math.randomseed(math.floor(Time() * 1000000))
        -- 随机英雄列表
        print("[AIGameMode] Random hero list")
        self:ArrayShuffle(tBotNameList)

        if self.iGameDifficulty == 6 then
            print("[AIGameMode] Use all star hero list start")
            local iRandomTeam = math.random(1, 11)
            print("[AIGameMode] Random team: " .. tostring(iRandomTeam))
            for _, v in ipairs(tBotAllStarRandom["team" .. tostring(iRandomTeam)]) do
                table.insert(tBotAllStar, v)
            end
            self:ArrayShuffle(tBotAllStar)
        end

        local sDifficulty = "unfair"
        if self.iDesiredDire > iPlayerNumDire then
            for i = 1, self.iDesiredDire - iPlayerNumDire do
                Tutorial:AddBot(self:GetFreeHeroName(false), "", sDifficulty, false)
            end
        end
        if self.iDesiredRadiant > iPlayerNumRadiant then
            for i = 1, self.iDesiredRadiant - iPlayerNumRadiant do
                Tutorial:AddBot(self:GetFreeHeroName(true), "", sDifficulty, true)
            end
        end
        GameRules:GetGameModeEntity():SetBotThinkingEnabled(true)
        Tutorial:StartTutorialMode()
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:IsValidPlayer(i) then
                if not self.tHumanPlayerList[i] then
                    PlayerResource:SetGold(i, (self.iStartingGoldBot - 600), true)
                end
            end
        end
    else
        Timers:CreateTimer(0.5, function()
            print("[AIGameMode] Try InitSettings in 0.5s")
            AIGameMode:InitHeroSelection()
        end)
    end
end

function AIGameMode:OnGameStateChanged(keys)
    local state = GameRules:State_Get()

    if state == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
        if IsServer() then
            PlayerController:Init()
        end
    elseif state == DOTA_GAMERULES_STATE_HERO_SELECTION then
        if IsServer() then
            self:InitHeroSelection()
        end
    elseif state == DOTA_GAMERULES_STATE_STRATEGY_TIME then
        if not self.PreGameOptionsSet then
            print("[AIGameMode] Setting pre-game options STRATEGY_TIME")
            self:PreGameOptions()
        end
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if PlayerResource:IsValidPlayer(i) then
                if PlayerResource:GetPlayer(i) and not PlayerResource:HasSelectedHero(i) then
                    PlayerResource:GetPlayer(i):MakeRandomHeroSelection()
                end
            end
        end

        Timers:CreateTimer(1, function()
            self:EndScreenStats(1, false)
        end)

    elseif state == DOTA_GAMERULES_STATE_PRE_GAME then
        -- modifier towers
        local tTowers = Entities:FindAllByClassname("npc_dota_tower")
        for k, v in pairs(tTowers) do
            local towerName = v:GetName()
            if string.find(towerName, "tower1") then
                -- 一塔攻击最高200%
                if self.iTowerPower > 7 then
                    v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(7)
                else
                    v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
                end
            else
                v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
            end
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local barracks = Entities:FindAllByClassname("npc_dota_barracks")
        for k, v in pairs(barracks) do
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local healer = Entities:FindAllByClassname("npc_dota_healer")
        for k, v in pairs(healer) do
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end
        local fort = Entities:FindAllByClassname("npc_dota_fort")
        for k, v in pairs(fort) do
            v:AddNewModifier(v, nil, "modifier_tower_power", {}):SetStackCount(self.iTowerPower)
            v:AddNewModifier(v, nil, "modifier_tower_endure", {}):SetStackCount(self.iTowerEndure)
            v:AddNewModifier(v, nil, "modifier_tower_heal", {}):SetStackCount(self.iTowerHeal)
        end

        -- refresh every 10 seconds
        Timers:CreateTimer(2, function()
            AIGameMode:RefreshGameStatus()
            return 10
        end)

    elseif state == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
        self.fGameStartTime = GameRules:GetGameTime()

        GameRules:SpawnNeutralCreeps()
        -- start loop in 30 seconds
        if IsClient() then
            return
        end

        -- 每分钟30秒时刷一次怪
        Timers:CreateTimer(30, function()
            AIGameMode:SpawnNeutralCreeps30sec()
            return 60
        end)
    end
end

function AIGameMode:SpawnNeutralCreeps30sec()

    local GameTime = GameRules:GetDOTATime(false, false)
    print("SpawnNeutral at GetDOTATime " .. GameTime)
    GameRules:SpawnNeutralCreeps()
end

function AIGameMode:RefreshGameStatus()

    -- save player info
    self:EndScreenStats(1, false)

    -- set global state
    local GameTime = GameRules:GetDOTATime(false, false)
    if (GameTime >= ((AIGameMode.botPushMin * 4) * 60)) then
        -- LATEGAME
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
    elseif (GameTime >= ((AIGameMode.botPushMin * 1.3) * 60)) then
        -- MIDGAME
        if AIGameMode.tower3PushedGood >= 2 or AIGameMode.tower3PushedBad >= 2 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(4)
        end

        if AIGameMode.barrackPushedGood > 5 or AIGameMode.barrackPushedBad > 5 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(-1)
        elseif AIGameMode.barrackPushedGood > 2 or AIGameMode.barrackPushedBad > 2 then
            GameRules:GetGameModeEntity():SetBotsMaxPushTier(5)
        end
    elseif (GameTime >= (AIGameMode.botPushMin * 60)) then
        -- MIDGAME
        GameRules:GetGameModeEntity():SetBotsInLateGame(true)
        GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(true)
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(3)
    else
        -- EARLYGAME
        GameRules:GetGameModeEntity():SetBotsInLateGame(false)
        GameRules:GetGameModeEntity():SetBotsAlwaysPushWithHuman(false)
        GameRules:GetGameModeEntity():SetBotsMaxPushTier(1)
    end

    -- 设置买活金钱
    SelectEveryValidPlayerDoFunc(function(playerId)
        if PlayerResource:IsFakeClient(playerId) then
            if AIGameMode.tower3PushedGood > 0 or AIGameMode.tower3PushedBad > 0 then
                PlayerResource:SetCustomBuybackCost(playerId, GetBuyBackCost(playerId))
            else
                PlayerResource:SetCustomBuybackCost(playerId, 100000)
            end
        else
            PlayerResource:SetCustomBuybackCost(playerId, GetBuyBackCost(playerId))
        end
    end)

    -- set creep buff level
    local buffLevelGood = 0
    local buffLevelBad = 0
    local buffLevelMegaGood = 0
    local buffLevelMegaBad = 0

    if AIGameMode.tower3PushedGood == 1 then
        buffLevelGood = buffLevelGood + 1
    elseif AIGameMode.tower3PushedGood > 1 then
        buffLevelGood = buffLevelGood + 2
    end
    if AIGameMode.tower3PushedBad == 1 then
        buffLevelBad = buffLevelBad + 1
    elseif AIGameMode.tower3PushedBad > 1 then
        buffLevelBad = buffLevelBad + 2
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

    if (GameTime >= (50 * 60)) then
        buffLevelGood = buffLevelGood + 5
        buffLevelBad = buffLevelBad + 5
        buffLevelMegaGood = buffLevelMegaGood + 5
        buffLevelMegaBad = buffLevelMegaBad + 5
    elseif (GameTime >= (45 * 60)) then
        buffLevelGood = buffLevelGood + 4
        buffLevelBad = buffLevelBad + 4
        buffLevelMegaGood = buffLevelMegaGood + 4
        buffLevelMegaBad = buffLevelMegaBad + 4
    elseif (GameTime >= (40 * 60)) then
        buffLevelGood = buffLevelGood + 3
        buffLevelBad = buffLevelBad + 3
        buffLevelMegaGood = buffLevelMegaGood + 3
        buffLevelMegaBad = buffLevelMegaBad + 3
    elseif (GameTime >= (35 * 60)) then
        buffLevelGood = buffLevelGood + 2
        buffLevelBad = buffLevelBad + 2
        buffLevelMegaGood = buffLevelMegaGood + 2
        buffLevelMegaBad = buffLevelMegaBad + 2
    elseif (GameTime >= (30 * 60)) then
        buffLevelGood = buffLevelGood + 1
        buffLevelBad = buffLevelBad + 1
        buffLevelMegaGood = buffLevelMegaGood + 1
        buffLevelMegaBad = buffLevelMegaBad + 1
    elseif (GameTime >= (20 * 60)) then
        buffLevelGood = buffLevelGood + 1
        buffLevelBad = buffLevelBad + 1
    end

    -- 未推掉任何塔时，不设置小兵buff
    if AIGameMode.tower1PushedGood == 0 then
        buffLevelGood = 0
    end
    if AIGameMode.tower1PushedBad == 0 then
        buffLevelBad = 0
    end

    buffLevelGood = math.min(buffLevelGood, 8)
    buffLevelBad = math.min(buffLevelBad, 8)
    buffLevelMegaGood = math.min(buffLevelMegaGood, 8)
    buffLevelMegaBad = math.min(buffLevelMegaBad, 8)

    AIGameMode.creepBuffLevelGood = buffLevelGood
    AIGameMode.creepBuffLevelBad = buffLevelBad
    AIGameMode.creepBuffLevelMegaGood = buffLevelMegaGood
    AIGameMode.creepBuffLevelMegaBad = buffLevelMegaBad

end

-- 买活时间设定
function AIGameMode:OnBuyback(e)
    local playerId = e.player_id
    local hEntity = EntIndexToHScript(e.entindex)
    -- 需要等待一段时间，否则GetBuybackCooldownTime()获取的值是0
    Timers:CreateTimer(0.5, function()
        if hEntity:IsRealHero() and hEntity:IsReincarnating() == false then
            local hHero = hEntity
            -- 会员买活时间上限设置
            local memberBuybackCooldownMaximum = 120
            local steamAccountID = PlayerResource:GetSteamAccountID(playerId)
            if PlayerController:IsMember(steamAccountID) then
                local buybackTime = hHero:GetBuybackCooldownTime()
                if buybackTime > memberBuybackCooldownMaximum then
                    buybackTime = memberBuybackCooldownMaximum
                end
                hHero:SetBuybackCooldownTime(buybackTime)
            end
        end
    end)
end

function AIGameMode:OnLastHit(keys)
    if keys.FirstBlood == 1 then
        local hero = PlayerResource:GetSelectedHeroEntity(keys.PlayerID)
        if hero and hero:HasAbility("Hero_vo_player") then
            hero:PlayVoiceAllPlayerIgnoreCooldown(hero:GetName() .. ".vo.FirstBlood")
        end
    end
end

function AIGameMode:OnPickHeroSpawn(keys)
    local heroname = keys.hero
    local hero = EntIndexToHScript(keys.heroindex)
    if hero:HasAbility("Hero_vo_player") then
        hero:PlayVoiceIgnoreCooldown(heroname .. ".vo.Spawn")
    end
end

function AIGameMode:OnNPCSpawned(keys)
    if GameRules:State_Get() < DOTA_GAMERULES_STATE_PRE_GAME then
        Timers:CreateTimer(1, function()
            AIGameMode:OnNPCSpawned(keys)
        end)
        return
    end
    local hEntity = EntIndexToHScript(keys.entindex)
    if not hEntity or hEntity:IsNull() then
        return
    end

    if hEntity:IsBaseNPC() then
        local playerid = hEntity:GetPlayerOwnerID()
        if playerid then
            local hero = PlayerResource:GetSelectedHeroEntity(playerid)
            if hero and hero == hEntity and hero:HasAbility("Hero_vo_player") then
                if not hero.isBuyBack then
                    hero:PlayVoiceIgnoreCooldown(hero:GetName() .. ".vo.Respawn")
                end
                hero.isBuyBack = false
            end
        end
    end

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

        -- 随时间增加金钱
        local originMaxGold = hEntity:GetMaximumGoldBounty()
        local originMinGold = hEntity:GetMinimumGoldBounty()
        local mul = AIGameMode:GetLaneGoldMul()
        local modifiedMaxGold = originMaxGold * mul
        local modifiedMinGold = originMinGold * mul
        hEntity:SetMaximumGoldBounty(modifiedMaxGold)
        hEntity:SetMinimumGoldBounty(modifiedMinGold)

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
                ability:SetLevel(buffLevelMega)
                return
            elseif string.find(sUnitName, "mega") then
                -- mega creep
                local ability = hEntity:AddAbility("creep_buff_mega")
                ability:SetLevel(buffLevelMega)
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
        if hEntity:GetAttackCapability() == DOTA_UNIT_CAP_MELEE_ATTACK or sName == "npc_dota_hero_troll_warlord" or
                sName == "npc_dota_hero_lone_druid" then
            hEntity:AddNewModifier(hEntity, nil, "modifier_melee_resistance", {})
        end

        if sName == "npc_dota_hero_sniper" and not self.bSniperScepterThinkerApplierSet then
            require('heroes/hero_sniper/sniper_init')
            SniperInit(hEntity, self)
        end

        -- choose item 玩家抽选物品
        if self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] and not self.tIfItemChosen[hEntity:GetPlayerOwnerID()] and
                not self.tIfItemChooseInited[hEntity:GetPlayerOwnerID()] then
            self:SpecialItemAdd(hEntity)
            self.tIfItemChooseInited[hEntity:GetPlayerOwnerID()] = true
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
            -- hEntity:SetControllableByPlayer(-1, true)
        end

        -- Player Buff
        if self.tHumanPlayerList[hEntity:GetPlayerOwnerID()] then
            EnablePlayerModifier(hEntity)
            PlayerController:InitPlayerProperty(hEntity)
        end

        hEntity.bInitialized = true
    end
end

function AIGameMode:OnPlayerLevelUp(keys)
    local iEntIndex = PlayerResource:GetPlayer(keys.player - 1):GetAssignedHero():entindex()
    local iLevel = keys.level
    -- Set DeathXP 击杀经验
    Timers:CreateTimer(0.5, function()
        local hEntity = EntIndexToHScript(iEntIndex)
        if hEntity:IsNull() then
            return
        end
        if iLevel <= 30 then
            hEntity:SetCustomDeathXP(40 + hEntity:GetCurrentXP() * 0.09)
        else
            hEntity:SetCustomDeathXP(3500 + hEntity:GetCurrentXP() * 0.03)
        end
    end)

    -- Set Ability Points
    local hero = EntIndexToHScript(keys.player):GetAssignedHero()
    local level = keys.level

    for i, v in ipairs(tSkillCustomNameList) do
        if v == hero:GetName() then
            for _, lv in ipairs(tAPLevelList) do
                if lv == level then
                    print("-----------------debug-----------------", hero:GetName() .. "level:" .. level .. " Add AP")
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

function AIGameMode:OnItemPickedUp(event)
    -- if not courier
    if not event.HeroEntityIndex then
        return
    end

    local item = EntIndexToHScript(event.ItemEntityIndex)
    local hHero = EntIndexToHScript(event.HeroEntityIndex)
    if event.PlayerID ~= nil and item ~= nil and hHero ~= nil and item:GetAbilityName() == "item_bag_of_gold" then
        local iGold = item:GetSpecialValueFor("bonus_gold")
        hHero:ModifyGoldFiltered(iGold, true, DOTA_ModifyGold_RoshanKill)
        SendOverheadEventMessage(hHero, OVERHEAD_ALERT_GOLD, hHero, iGold * AIGameMode:GetPlayerGoldXpMultiplier(event.PlayerID), nil)
    end
end

function AIGameMode:SetUnitShareMask(data)
    local toPlayerID = data.toPlayerID
    if PlayerResource:IsValidPlayerID(toPlayerID) then
        local playerId = data.PlayerID
        -- flag: bitmask; 1 shares heroes, 2 shares units, 4 disables help
        local flag = data.flag
        local disable = data.disable == 1
        PlayerResource:SetUnitShareMaskForPlayer(playerId, toPlayerID, flag, disable)

        local disableHelp = CustomNetTables:GetTableValue("disable_help", tostring(playerId)) or {}
        disableHelp[tostring(to)] = disable
        CustomNetTables:SetTableValue("disable_help", tostring(playerId), disableHelp)
    end
end

function AIGameMode:OnPlayerReconnect(keys)
    local playerID = keys.PlayerID
    if not self.tHumanPlayerList[playerID] then
        DisconnectClient(playerID, true)
        return
    end
    local new_state = GameRules:State_Get()
    if new_state > DOTA_GAMERULES_STATE_HERO_SELECTION then
        if PlayerResource:IsValidPlayer(playerID) then
            if PlayerResource:HasSelectedHero(playerID) or PlayerResource:HasRandomed(playerID) then
                -- This playerID already had a hero before disconnect
            else
                if not PlayerResource:IsBroadcaster(playerID) then
                    local hPlayer = PlayerResource:GetPlayer(playerID)
                    hPlayer:MakeRandomHeroSelection()
                    PlayerResource:SetHasRandomed(playerID)

                    if new_state > DOTA_GAMERULES_STATE_WAIT_FOR_MAP_TO_LOAD then
                        local hHero = PlayerResource:GetSelectedHeroEntity(playerID)
                        if hHero then
                            print("hHero:RemoveSelf()")
                            hHero:RemoveSelf()
                        end
                        local pszHeroClass = PlayerResource:GetSelectedHeroName(playerID)
                        local hTeam = PlayerResource:GetTeam(playerID)
                        local vPositions = nil
                        if hTeam == DOTA_TEAM_GOODGUYS then
                            vPositions = Vector(-6900, -6400, 384)
                        else
                            vPositions = Vector(7000, 6150, 384)
                        end
                        local hHero = CreateUnitByName(pszHeroClass, vPositions, true, nil, nil, hTeam)
                        hHero:SetControllableByPlayer(playerID, true)
                        hPlayer:SetAssignedHeroEntity(hHero)
                        hPlayer:SpawnCourierAtPosition(vPositions)
                    end
                end
            end
        end
    end
end

function AIGameMode:EndScreenStats(winnerTeamId, bTrueEnd)
    local time = GameRules:GetDOTATime(false, true)
    -- local matchID = tostring(GameRules:GetMatchID())

    local data = {
        version = "1.18",
        -- matchID = matchID,
        mapName = GetMapName(),
        players = {},
        options = {},
        gameOption = {},
        winnerTeamId = winnerTeamId,
        isWinner = true,
        duration = math.floor(time),
        flags = {}
    }

    data.options = {
        playerGoldXpMultiplier = tostring(self.fPlayerGoldXpMultiplier),
        botGoldXpMultiplier = tostring(self.fBotGoldXpMultiplier),
        towerPower = AIGameMode:StackToPercentage(self.iTowerPower),
        towerEndure = AIGameMode:StackToPercentage(self.iTowerEndure)
    }
    -- send to api server
    data.gameOption = {
        gameDifficulty = self.iGameDifficulty,
        playerGoldXpMultiplier = self.fPlayerGoldXpMultiplier,
        botGoldXpMultiplier = self.fBotGoldXpMultiplier,
        towerPower = self.iTowerPower,
        towerEndure = self.iTowerEndure,
    }

    local basePoint = 0
    if time > 3600 then
        basePoint = 40
    else
        basePoint = math.floor(10 + time / 120)
    end

    local playerNumber = 0
    -- 参战率积分
    local battleParticipationBase = 15

    local mostdamagePlayerID_1 = -1
    local mostdamage_1 = 0
    local mostdamagePlayerID_2 = -1
    local mostdamage_2 = 0
    local mostdamagePlayerID_3 = -1
    local mostdamage_3 = 0

    local mostDamageReceivedPlayerID_1 = -1
    local mostDamageReceived_1 = 0
    local mostDamageReceivedPlayerID_2 = -1
    local mostDamageReceived_2 = 0

    local mostHealingPlayerID_1 = -1
    local mostHealing_1 = 0
    local mostHealingPlayerID_2 = -1
    local mostHealing_2 = 0

    local mostTowerKillPlayerID_1 = -1
    local mostTowerKill_1 = 0
    local mostTowerKillPlayerID_2 = -1
    local mostTowerKill_2 = 0

    for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
        if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and
                PlayerResource:GetSelectedHeroEntity(playerID) then
            local hero = PlayerResource:GetSelectedHeroEntity(playerID)
            if hero and IsValidEntity(hero) and not hero:IsNull() then
                local steamAccountID = PlayerResource:GetSteamAccountID(playerID)
                local membership = PlayerController:IsMember(steamAccountID)
                local memberInfo = PlayerController:GetMember(steamAccountID)
                local damage = PlayerResource:GetRawPlayerDamage(playerID)
                local damagereceived = 0
                for victimID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
                    if PlayerResource:IsValidPlayerID(victimID) and PlayerResource:IsValidPlayer(victimID) and
                            PlayerResource:GetSelectedHeroEntity(victimID) then
                        if PlayerResource:GetTeam(victimID) ~= PlayerResource:GetTeam(playerID) then
                            damagereceived = damagereceived + PlayerResource:GetDamageDoneToHero(victimID, playerID)
                        end
                    end
                end
                local healing = PlayerResource:GetHealing(playerID)
                local assists = PlayerResource:GetAssists(playerID)
                local deaths = PlayerResource:GetDeaths(playerID)
                local kills = PlayerResource:GetKills(playerID)
                local towerKills = PlayerResource:GetTowerKills(playerID)

                local playerInfo = {
                    steamid = tostring(PlayerResource:GetSteamID(playerID)),
                    membership = membership,
                    memberInfo = memberInfo,
                    kills = kills or 0,
                    deaths = deaths or 0,
                    assists = assists or 0,
                    damage = damage or 0,
                    damagereceived = damagereceived or 0,
                    heroName = hero:GetUnitName() or "Haachama",
                    lasthits = PlayerResource:GetLastHits(playerID) or 0,
                    heroHealing = healing or 0,
                    points = 0,
                    str = hero:GetStrength() or 0,
                    agi = hero:GetAgility() or 0,
                    int = hero:GetIntellect() or 0,
                    items = {},
                    isDisconnect = false,
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

                if not PlayerResource:IsFakeClient(playerID) then
                    playerNumber = playerNumber + 1

                    if PlayerResource:GetConnectionState(playerID) == DOTA_CONNECTION_STATE_CONNECTED then
                        playerInfo.points = basePoint
                    else
                        playerInfo.isDisconnect = true
                    end
                    -- 参战积分
                    local teamKills = GetTeamHeroKills(PlayerResource:GetTeam(playerID))

                    if teamKills > 0 then
                        local battleParticipation = math.floor(battleParticipationBase * ((kills + assists) / teamKills))
                        print("battleParticipation", battleParticipation)
                        playerInfo.points = playerInfo.points + battleParticipation
                    end

                    if damage > mostdamage_1 then
                        mostdamagePlayerID_3 = mostdamagePlayerID_2
                        mostdamage_3 = mostdamage_2
                        mostdamagePlayerID_2 = mostdamagePlayerID_1
                        mostdamage_2 = mostdamage_1
                        mostdamagePlayerID_1 = playerID
                        mostdamage_1 = damage
                    elseif damage > mostdamage_2 then
                        mostdamagePlayerID_3 = mostdamagePlayerID_2
                        mostdamage_3 = mostdamage_2
                        mostdamagePlayerID_2 = playerID
                        mostdamage_2 = damage
                    elseif damage > mostdamage_3 then
                        mostdamagePlayerID_3 = playerID
                        mostdamage_3 = damage
                    end

                    if damagereceived > mostDamageReceived_1 then
                        mostDamageReceivedPlayerID_2 = mostDamageReceivedPlayerID_1
                        mostDamageReceived_2 = mostDamageReceived_1
                        mostDamageReceivedPlayerID_1 = playerID
                        mostDamageReceived_1 = damagereceived
                    elseif damagereceived > mostDamageReceived_2 then
                        mostDamageReceivedPlayerID_2 = playerID
                        mostDamageReceived_2 = damagereceived
                    end

                    if healing > mostHealing_1 then
                        mostHealingPlayerID_2 = mostHealingPlayerID_1
                        mostHealing_2 = mostHealing_1
                        mostHealingPlayerID_1 = playerID
                        mostHealing_1 = healing
                    elseif healing > mostHealing_2 then
                        mostHealingPlayerID_2 = playerID
                        mostHealing_2 = healing
                    end

                    if towerKills > mostTowerKill_1 then
                        mostTowerKillPlayerID_2 = mostTowerKillPlayerID_1
                        mostTowerKill_2 = mostTowerKill_1
                        mostTowerKillPlayerID_1 = playerID
                        mostTowerKill_1 = towerKills
                    elseif towerKills > mostTowerKill_2 then
                        mostTowerKillPlayerID_2 = playerID
                        mostTowerKill_2 = towerKills
                    end

                end

                data.players[playerID] = playerInfo
            end
        end
    end

    AIGameMode.playerNumber = playerNumber
    local pointT1 = playerNumber * 1.2
    local pointT2 = playerNumber * 0.8
    local pointT3 = playerNumber * 0.4

    if mostdamagePlayerID_1 ~= -1 then
        data.players[mostdamagePlayerID_1].points = data.players[mostdamagePlayerID_1].points + pointT1
    end
    if mostdamagePlayerID_2 ~= -1 then
        data.players[mostdamagePlayerID_2].points = data.players[mostdamagePlayerID_2].points + pointT2
    end
    if mostdamagePlayerID_3 ~= -1 then
        data.players[mostdamagePlayerID_3].points = data.players[mostdamagePlayerID_3].points + pointT3
    end


    if mostDamageReceivedPlayerID_1 ~= -1 then
        data.players[mostDamageReceivedPlayerID_1].points = data.players[mostDamageReceivedPlayerID_1].points + pointT1
    end
    if mostDamageReceivedPlayerID_2 ~= -1 then
        data.players[mostDamageReceivedPlayerID_2].points = data.players[mostDamageReceivedPlayerID_2].points + pointT2
    end
    if mostHealingPlayerID_1 ~= -1 then
        data.players[mostHealingPlayerID_1].points = data.players[mostHealingPlayerID_1].points + pointT1
    end
    if mostHealingPlayerID_2 ~= -1 then
        data.players[mostHealingPlayerID_2].points = data.players[mostHealingPlayerID_2].points + pointT2
    end
    if mostTowerKillPlayerID_1 ~= -1 then
        data.players[mostTowerKillPlayerID_1].points = data.players[mostTowerKillPlayerID_1].points + pointT1
    end
    if mostTowerKillPlayerID_2 ~= -1 then
        data.players[mostTowerKillPlayerID_2].points = data.players[mostTowerKillPlayerID_2].points + pointT2
    end
    -- filter points
    for playerID, playerInfo in pairs(data.players) do
        playerInfo.points = AIGameMode:FilterSeasonPoint(playerInfo, winnerTeamId)
    end

    local sTable = "ending_stats"

    CustomNetTables:SetTableValue(sTable, "player_data", data)

    return data
end


function AIGameMode:FilterSeasonPoint(playerInfo, winnerTeamId)
    local points = playerInfo.points

    if AIGameMode:IsInvalidGame() then
        return 0
    end
    if AIGameMode.iDesiredDire < 10 then
        points = points * AIGameMode.iDesiredDire / 10
    end

    if GameRules:GetDOTATime(false, true) < 10 * 60 then
        points = points * 0.5
    end
    if winnerTeamId ~= DOTA_TEAM_GOODGUYS then
        points = points * 0.5
    end
    -- 根据难度积分加倍
    local difficulty = self.iGameDifficulty
    if difficulty == 1 then
        points = points * 1.2
    elseif difficulty == 2 then
        points = points * 1.4
    elseif difficulty == 3 then
        points = points * 1.6
    elseif difficulty == 4 then
        points = points * 1.8
    elseif difficulty == 5 then
        points = points * 2.0
    elseif difficulty == 6 then
        points = points * 2.2
    end
    return math.ceil(points)
end

function AIGameMode:IsInvalidGame()
    if AIGameMode.DebugMode then
        return false
    end

    if GameRules:IsCheatMode() then
        return true
    end

    if GameRules:GetDOTATime(false, true) < 5 * 60 then
        return true
    end
    return false
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
        return "400%"
    elseif iStackCount == 11 then
        -- for test
        return "500%"
    else
        return "100%"
    end
end

