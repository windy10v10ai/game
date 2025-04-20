import { GameEndPoint } from './event/game-end/game-end-point';
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
  sameHeroSelection = true;
  enablePlayerAttribute = true;

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
    this.enablePlayerAttribute = keys.enable_player_attribute === 1;
    CustomNetTables.SetTableValue('game_options', 'game_options', keys);
    CustomNetTables.SetTableValue('game_options', 'point_multiplier', {
      point_multiplier: GameEndPoint.GetCustomModeMultiplier(this),
    });
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

  public setMaxLevelXPRequire() {
    // 设置自定义英雄每个等级所需经验，这里的经验是升级到这一级所需要的总经验）
    const xpRequireMap: { [key: number]: number } = {
      1: 0,
      2: 200,
      3: 550,
      4: 1050,
      5: 1700,
      6: 2500,
      7: 3400,
      8: 4400,
      9: 5500,
      10: 6700,
      11: 8000,
      12: 9400,
      13: 10900,
      14: 12500,
      15: 14200,
      16: 16000,
      17: 17900,
      18: 19900,
      19: 22000,
      20: 24200,
      21: 26600,
      22: 29200,
      23: 32000,
      24: 35000,
      25: 38500,
      26: 42500,
      27: 47000,
      28: 52000,
      29: 57500,
      30: 63500,
    };
    // 经验列表不能超过最大等级
    for (let i = 31; i <= this.maxLevel; i++) {
      xpRequireMap[i] = xpRequireMap[i - 1] + i * 200;
    }
    GameRules.SetUseCustomHeroXPValues(true);
    const game: CDOTABaseGameMode = GameRules.GetGameModeEntity();
    game.SetCustomXPRequiredToReachNextLevel(xpRequireMap);
    game.SetUseCustomHeroLevels(true); // 是否启用自定义英雄等级
    game.SetCustomHeroMaxLevel(this.maxLevel); // 设置自定义英雄最大等级
    print('[GameConfig] xpRequireMap:');
    DeepPrintTable(xpRequireMap);
  }
}
