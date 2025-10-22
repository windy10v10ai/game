import { ApiClient } from '../api/api-client';
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
  fixedAbility = 'none';
  sameHeroSelection = false;
  enablePlayerAttribute = true;
  extraPassiveAbilities = false;

  gameDifficulty = 0;

  constructor() {
    CustomGameEventManager.RegisterListener('game_options_change', (_, keys) => {
      return this.OnGameOptionChange(keys);
    });

    // 难度选择
    CustomGameEventManager.RegisterListener('choose_difficulty', (_, keys) => {
      return this.OnChooseDifficulty(keys);
    });
    CustomGameEventManager.RegisterListener('vote_end', (_, _key) => {
      return this.CalculateDifficulty(true);
    });
  }

  OnGameOptionChange(keys: GameOptionsChangeEventData & CustomGameEventDataBase) {
    this.radiantGoldXpMultiplier = keys.multiplier_radiant;
    this.direGoldXpMultiplier = keys.multiplier_dire;
    this.radiantPlayerNumber = keys.player_number_radiant;
    this.direPlayerNumber = keys.player_number_dire;
    this.towerPower = keys.tower_power_pct;
    this.startingGoldPlayer = keys.starting_gold_player;
    this.startingGoldBot = keys.starting_gold_bot;
    this.respawnTimePercentage = keys.respawn_time_pct;
    this.maxLevel = keys.max_level;
    this.fixedAbility = keys.fixed_ability;
    this.sameHeroSelection = keys.same_hero_selection === 1; // 现在表示是否强制随机
    this.enablePlayerAttribute = keys.enable_player_attribute === 1;
    this.extraPassiveAbilities = keys.extra_passive_abilities === 1;
    // 如果启用强制随机,缩短英雄选择时间
    if (this.sameHeroSelection) {
      GameRules.SetHeroSelectionTime(2); // 设置为3秒,快速跳过
      GameRules.SetHeroSelectPenaltyTime(0);
    } else {
      GameRules.SetHeroSelectionTime(50); // 恢复正常时间
      GameRules.SetHeroSelectPenaltyTime(10);
    }
    CustomNetTables.SetTableValue('game_options', 'game_options', keys);
    CustomNetTables.SetTableValue('game_options', 'point_multiplier', {
      point_multiplier: GameEndPoint.GetDifficultyMultiplier(
        this.gameDifficulty,
        ApiClient.IsLocalhost(),
        this,
      ),
    });
  }

  OnChooseDifficulty(keys: { difficulty: number } & CustomGameEventDataBase) {
    CustomNetTables.SetTableValue('difficulty_choice', keys.PlayerID.toString(), {
      difficulty: keys.difficulty,
    });

    this.CalculateDifficulty(false);
  }

  CalculateDifficulty(force: boolean) {
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
    if (playerChosen === 0) {
      // 如果没有人选择难度，则默认选择1
      averageDifficulty = 1;
    } else {
      averageDifficulty = averageDifficulty / playerChosen;
      // 四舍五入 FIXME 如果难度偏高 改成人数相同时优先选择低难度 + 0.4
      averageDifficulty = Math.floor(averageDifficulty + 0.5);
    }
    if (force || playerChosen >= playerCount) {
      CustomNetTables.SetTableValue('game_difficulty', 'all', { difficulty: averageDifficulty });
      this.gameDifficulty = averageDifficulty;
    }
  }

  SetDefaultDifficulty() {
    // if game difficulty is not set, set it to 1
    if (CustomNetTables.GetTableValue('game_difficulty', 'all') === undefined) {
      print('[Option] SetDefaultDifficulty');
      CustomNetTables.SetTableValue('game_difficulty', 'all', { difficulty: 1 });
      this.gameDifficulty = 1;
    }
  }
}
