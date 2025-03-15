require('modifiers/player/enable_player_modifier')
require('event/js_event')
require('event/creep')
require('event/chat')
require('event/kill')


function AIGameMode:ArrayShuffle(array)
    local size = #array
    for i = size, 1, -1 do
        local rand = math.random(size)
        array[i], array[rand] = array[rand], array[i]
    end
    return array
end

function AIGameMode:InitPlayerGold()
    if self.PreGameOptionsSet then
        print("[AIGameMode] InitPlayerGold")
        for i = 0, (DOTA_MAX_TEAM_PLAYERS - 1) do
            if IsHumanPlayer(i) then
                PlayerResource:SetGold(i, (self.iStartingGoldPlayer - 600), true)
            end
        end
    else
        Timers:CreateTimer(0.5, function()
            print("[AIGameMode] Try InitPlayerGold in 0.5s")
            AIGameMode:InitPlayerGold()
        end)
    end
end

function AIGameMode:OnGameStateChanged(keys)
    local state = GameRules:State_Get()

    if state == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
    elseif state == DOTA_GAMERULES_STATE_HERO_SELECTION then
        if IsServer() then
            self:InitPlayerGold()
        end
    elseif state == DOTA_GAMERULES_STATE_STRATEGY_TIME then
        -- 计算天辉玩家人数
        self.playerNumber = 0
        for playerID = 0, DOTA_MAX_TEAM_PLAYERS - 1 do
            if PlayerResource:IsValidPlayerID(playerID) and PlayerResource:IsValidPlayer(playerID) and not PlayerResource:IsFakeClient(playerID) then
                self.playerNumber = self.playerNumber + 1
            end
        end

        if not self.PreGameOptionsSet then
            print("[AIGameMode] Setting pre-game options STRATEGY_TIME")
            self:PreGameOptions()
        end
    elseif state == DOTA_GAMERULES_STATE_PRE_GAME then
        local gameDifficulty = CustomNetTables:GetTableValue('game_difficulty', 'all').difficulty
        -- modifier towers
        local tTowers = Entities:FindAllByClassname("npc_dota_tower")
        local iTowerLevel = math.max(gameDifficulty, 1)
        for k, v in pairs(tTowers) do
            local towerName = v:GetName()

            -- add tower ability
            if string.find(towerName, "tower3") or string.find(towerName, "tower4") then
                v:AddAbility("tower_ursa_fury_swipes"):SetLevel(iTowerLevel)
                v:AddAbility("tower_shredder_reactive_armor"):SetLevel(iTowerLevel)
                v:AddAbility("tower_troll_warlord_fervor"):SetLevel(iTowerLevel)
            end
        end
        local fort = Entities:FindAllByClassname("npc_dota_fort")
        for k, v in pairs(fort) do
            -- add tower ability
            v:AddAbility("tower_ursa_fury_swipes"):SetLevel(iTowerLevel)
            v:AddAbility("tower_shredder_reactive_armor"):SetLevel(iTowerLevel)
            v:AddAbility("tower_troll_warlord_fervor"):SetLevel(iTowerLevel)
            v:AddAbility("tower_antimage_mana_break"):SetLevel(iTowerLevel)
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
        buffLevelGood = buffLevelGood + 3
    end
    if AIGameMode.tower3PushedBad == 1 then
        buffLevelBad = buffLevelBad + 1
    elseif AIGameMode.tower3PushedBad > 1 then
        buffLevelBad = buffLevelBad + 3
    end

    if AIGameMode.tower4PushedGood > 1 then
        buffLevelGood = buffLevelGood + 2
        buffLevelMegaGood = buffLevelMegaGood + 1
    end
    if AIGameMode.tower4PushedBad > 1 then
        buffLevelBad = buffLevelBad + 2
        buffLevelMegaBad = buffLevelMegaBad + 1
    end

    buffLevelMegaGood = buffLevelMegaGood + AIGameMode.creepBuffLevel
    buffLevelMegaBad = buffLevelMegaBad + AIGameMode.creepBuffLevel

    if (GameTime >= (45 * 60)) then
        buffLevelGood = buffLevelGood + 5
        buffLevelBad = buffLevelBad + 5
        buffLevelMegaGood = buffLevelMegaGood + 5
        buffLevelMegaBad = buffLevelMegaBad + 5
    elseif (GameTime >= (40 * 60)) then
        buffLevelGood = buffLevelGood + 4
        buffLevelBad = buffLevelBad + 4
        buffLevelMegaGood = buffLevelMegaGood + 4
        buffLevelMegaBad = buffLevelMegaBad + 4
    elseif (GameTime >= (35 * 60)) then
        buffLevelGood = buffLevelGood + 3
        buffLevelBad = buffLevelBad + 3
        buffLevelMegaGood = buffLevelMegaGood + 3
        buffLevelMegaBad = buffLevelMegaBad + 3
    elseif (GameTime >= (30 * 60)) then
        buffLevelGood = buffLevelGood + 2
        buffLevelBad = buffLevelBad + 2
        buffLevelMegaGood = buffLevelMegaGood + 2
        buffLevelMegaBad = buffLevelMegaBad + 2
    elseif (GameTime >= (25 * 60)) then
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


    if hEntity:IsRealHero() and not hEntity.bInitialized then
        -- Bots modifier 机器人AI脚本
        if not IsHumanPlayer(hEntity:GetPlayerOwnerID()) then
            -- FIXME 用ts脚本替换
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
        end

        -- Player Buff
        if IsHumanPlayer(hEntity:GetPlayerOwnerID()) then
            EnablePlayerModifier(hEntity)
        end

        hEntity.bInitialized = true
    end
end

function AIGameMode:OnPlayerLevelUp(keys)
    local iEntIndex = PlayerResource:GetPlayer(keys.PlayerID):GetAssignedHero():entindex()
    local iLevel = keys.level
    -- Set DeathXP 击杀经验
    Timers:CreateTimer(0.5, function()
        local hEntity = EntIndexToHScript(iEntIndex)
        if hEntity:IsNull() then
            return
        end
        if iLevel <= 30 then
            hEntity:SetCustomDeathXP(40 + hEntity:GetCurrentXP() * 0.08)
        else
            hEntity:SetCustomDeathXP(3000 + hEntity:GetCurrentXP() * 0.03)
        end
    end)
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
        SendOverheadEventMessage(hHero, OVERHEAD_ALERT_GOLD, hHero,
            iGold * AIGameMode:GetPlayerGoldXpMultiplier(event.PlayerID), nil)
    end

    -- if event.PlayerID ~= nil and item ~= nil and hHero ~= nil and item:GetAbilityName() == "item_bag_of_season_point" then
    --     local iPoint = item:GetSpecialValueFor("bonus_season_point")
    --     AIGameMode.playerBonusSeasonPoint[event.PlayerID] = AIGameMode.playerBonusSeasonPoint[event.PlayerID] + iPoint
    --     SendOverheadEventMessage(hHero, OVERHEAD_ALERT_SHARD, hHero, iPoint, nil)
    -- end
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

function AIGameMode:FilterSeasonPointDifficulty(points)
    -- 根据难度积分加倍
    local difficulty = CustomNetTables:GetTableValue('game_difficulty', 'all').difficulty
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
    return points
end

-- TODO remove
function AIGameMode:FilterSeasonPoint(points, winnerTeamId)
    if AIGameMode:IsInvalidGame() then
        return 0
    end
    if AIGameMode.iDesiredDire < 10 then
        points = points * AIGameMode.iDesiredDire / 10
    end

    if winnerTeamId ~= DOTA_TEAM_GOODGUYS then
        points = points * 0.5
    end

    return math.ceil(points)
end

-- TODO remove
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
