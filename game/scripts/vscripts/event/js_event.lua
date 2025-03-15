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
    self.bSameHeroSelection = args.game_options.same_hero_selection
    self:PreGameOptions()
end
