export class LoadingSetOptions {
  constructor() {
    CustomGameEventManager.RegisterListener('loading_set_options', (userId, args) =>
      this.OnGetLoadingSetOptions(userId, args),
    );
  }

  OnGetLoadingSetOptions(
    _: EntityIndex,
    args: NetworkedData<
      CCustomGameEventManager.InferEventType<LoadingSetOptionsEventData, object> & {
        PlayerID: PlayerID;
      }
    >,
  ) {
    if (args.host_privilege === 0) {
      return;
    }

    // player_gold_xp_multiplier: string;
    // bot_gold_xp_multiplier: string;
    // radiant_player_number: string;
    // dire_player_number: string;
    // respawn_time_percentage: string;
    // tower_power: string;
    // starting_gold_player: string;
    // starting_gold_bot: string;
    // max_level: string;
    // same_hero_selection: boolean;

    GameRules.Option.radiantGoldXpMultiplier = Number(args.game_options.player_gold_xp_multiplier);
    GameRules.Option.direGoldXpMultiplier = Number(args.game_options.bot_gold_xp_multiplier);
    GameRules.Option.radiantPlayerNumber = Number(args.game_options.radiant_player_number);
    GameRules.Option.direPlayerNumber = Number(args.game_options.dire_player_number);

    GameRules.Option.towerPower = Number(args.game_options.tower_power);
    GameRules.Option.startingGoldPlayer = Number(args.game_options.starting_gold_player);
    GameRules.Option.startingGoldBot = Number(args.game_options.starting_gold_bot);
    GameRules.Option.respawnTimePercentage = Number(args.game_options.respawn_time_percentage);

    print('GameRules.Option.radiantGoldXpMultiplier', GameRules.Option.radiantGoldXpMultiplier);
    print('GameRules.Option.direGoldXpMultiplier', GameRules.Option.direGoldXpMultiplier);

    GameRules.Option.gameDifficulty =
      CustomNetTables.GetTableValue('game_difficulty', 'all')?.difficulty ?? 0;
  }
}
