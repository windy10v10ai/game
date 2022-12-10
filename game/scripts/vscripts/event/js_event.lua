
function AIGameMode:OnGetLoadingSetOptions(eventSourceIndex, args)
    if tonumber(args.host_privilege) ~= 1 then
        return
    end
    self.iGameDifficulty = tonumber(args.game_options.game_difficulty)
    self.iDesiredRadiant = tonumber(args.game_options.radiant_player_number)
    self.iDesiredDire = tonumber(args.game_options.dire_player_number)
    self.fPlayerGoldXpMultiplier = tonumber(args.game_options.player_gold_xp_multiplier)
    self.fBotGoldXpMultiplier = tonumber(args.game_options.bot_gold_xp_multiplier)

    self.iRespawnTimePercentage = tonumber(args.game_options.respawn_time_percentage)
    self.iMaxLevel = tonumber(args.game_options.max_level)

    self.iTowerPower = tonumber(args.game_options.tower_power)
    self.iTowerEndure = tonumber(args.game_options.tower_endure)
    self.iTowerHeal = tonumber(args.game_options.tower_heal)

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
    local optionId = keys.optionId
    -- 对应的游戏选择项目设定
    GameRules.GameOption[optionName] = {optionValue = optionValue, optionId = optionId}
    CustomNetTables:SetTableValue('game_options_table', 'game_option', GameRules.GameOption)
end

function AIGameMode:OnChooseDifficulty(keys)
    local playerId = keys.PlayerID
    local difficulty = keys.difficulty
    CustomNetTables:SetTableValue('difficulty_choice', tostring(playerId), {difficulty = difficulty})

    AIGameMode:CalculateDifficulty(false)
end

function AIGameMode:CalculateDifficulty(force)
    local playerCount = 0
    local playerChosen = 0
    local averageDifficulty = 0
    for i = 0, DOTA_MAX_TEAM_PLAYERS do
        if PlayerResource:GetConnectionState(i) ~= DOTA_CONNECTION_STATE_UNKNOWN then
            playerCount = playerCount + 1
            local difficultyChosen = CustomNetTables:GetTableValue('difficulty_choice', tostring(i))
            if difficultyChosen then
                playerChosen = playerChosen + 1
                averageDifficulty = averageDifficulty + difficultyChosen.difficulty
            end
        end
    end
    averageDifficulty = averageDifficulty / playerCount
    -- 人数相同时优先选择低难度
    averageDifficulty = math.floor(averageDifficulty + 0.4)
    if force or playerChosen >= playerCount then
        CustomNetTables:SetTableValue('game_difficulty', 'all', {difficulty = averageDifficulty})
    end
end
