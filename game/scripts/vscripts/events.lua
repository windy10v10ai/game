require('modifiers/player/enable_player_modifier')
require('event/kill')

function AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args)
    if tonumber(args.host_privilege) ~= 1 then
        return
    end
    self.iDesiredRadiant = tonumber(args.game_options.radiant_player_number)
    self.iDesiredDire = tonumber(args.game_options.dire_player_number)
    self.fPlayerGoldXpMultiplier = tonumber(args.game_options.player_gold_xp_multiplier)
    self.fBotGoldXpMultiplier = tonumber(args.game_options.bot_gold_xp_multiplier)

    self.iRespawnTimePercentage = tonumber(args.game_options.respawn_time_percentage)
    self.iMaxLevel = tonumber(args.game_options.max_level)

    self.iTowerPower = tonumber(args.game_options.tower_power)

    self.iStartingGoldPlayer = tonumber(args.game_options.starting_gold_player)
    self.iStartingGoldBot = tonumber(args.game_options.starting_gold_bot)
    self:PreGameOptions()
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
        -- REFACTORED: RefreshGameStatus moved to TypeScript (team-strategy.ts)
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

-- REFACTORED: RefreshGameStatus moved to TypeScript
-- - Push strategy: src/vscripts/ai/team/team-strategy.ts
-- - Buyback cost: src/vscripts/ai/team/team-strategy.ts
-- - Creep buff level: src/vscripts/modules/event/game-in-progress/game-status-refresh.ts

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

    local sName = hEntity:GetName()
    -- REFACTORED: Creep buff system moved to TypeScript
    -- See: src/vscripts/modules/event/game-in-progress/creep-buff-manager.ts


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

-- REFACTORED: GetLaneGoldMul moved to TypeScript
-- See: src/vscripts/modules/event/game-in-progress/creep-buff-manager.ts

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
