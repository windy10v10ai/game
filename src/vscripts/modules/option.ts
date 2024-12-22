import { PlayerHelper } from './helper/player-helper';

export class Option {
  radiantGoldXpMultiplier = 1;
  direGoldXpMultiplier = 1;
  radiantPlayerNumber = 10;
  direPlayerNumber = 10;
  towerPower = 100;

  startingGoldPlayer = 1000;
  startingGoldBot = 1000;
  respawnTimePercentage = 100;
  maxLevel = 50;
  sameHeroSelection = false;

  gameDifficulty = 0;

  constructor() {
    CustomGameEventManager.RegisterListener('game_options_change', (_, keys) => {
      return this.onGameOptionChange(keys);
    });

    // 难度选择
    CustomGameEventManager.RegisterListener('choose_difficulty', (_, keys) => {
      return this.onChooseDifficulty(keys);
    });
    CustomGameEventManager.RegisterListener('vote_end', (_, _key) => {
      return this.calculateDifficulty(true);
    });
  }

  onGameOptionChange(keys: GameOptionsChangeEventData & CustomGameEventDataBase) {
    CustomNetTables.SetTableValue('game_options', 'game_options', keys);
    this.radiantGoldXpMultiplier = keys.multiplier_radiant;
    this.direGoldXpMultiplier = keys.multiplier_dire;
    this.radiantPlayerNumber = keys.player_number_radiant;
    this.direPlayerNumber = keys.player_number_dire;
    this.towerPower = keys.tower_power_pct;
    this.startingGoldPlayer = keys.starting_gold_player;
    this.startingGoldBot = keys.starting_gold_bot;
    this.respawnTimePercentage = keys.respawn_time_pct;
    this.maxLevel = keys.max_level;
    this.sameHeroSelection = keys.same_hero_selection === 1;
  }

  onChooseDifficulty(keys: { difficulty: number } & CustomGameEventDataBase) {
    CustomNetTables.SetTableValue('difficulty_choice', keys.PlayerID.toString(), {
      difficulty: keys.difficulty,
    });

    this.calculateDifficulty(false);
  }

  calculateDifficulty(force: boolean) {
    const playerCount = PlayerHelper.GetHumamPlayerCount();
    let playerChosen = 0;
    let averageDifficulty = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerResource.GetConnectionState(playerId) !== ConnectionState.UNKNOWN) {
        const difficultyChosen = CustomNetTables.GetTableValue(
          'difficulty_choice',
          playerId.toString(),
        );
        if (difficultyChosen !== undefined) {
          playerChosen++;
          averageDifficulty += difficultyChosen.difficulty;
        }
      }
    });
    if (playerChosen !== 0) {
      averageDifficulty = averageDifficulty / playerChosen;
      // 四舍五入 FIXME 如果难度偏高 改成人数相同时优先选择低难度 + 0.4
      averageDifficulty = Math.floor(averageDifficulty + 0.5);
    }
    if (force || playerChosen >= playerCount) {
      CustomNetTables.SetTableValue('game_difficulty', 'all', { difficulty: averageDifficulty });
      this.gameDifficulty = averageDifficulty;
    }
  }
}
