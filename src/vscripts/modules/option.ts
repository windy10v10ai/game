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
  forceRandomHero = false;
  enablePlayerAttribute = true;

  gameDifficulty = 0;
  midOnlyMode = false;

  // 全员投完后延迟定稿，留出修改窗口（尤其单人自动投票会瞬间锁死）。vote_end 强制立即定稿。
  private static readonly FINALIZE_DELAY = 3;
  private static readonly FINALIZE_TIMER = 'difficulty_finalize';

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
    this.forceRandomHero = keys.force_random_hero === 1;
    this.enablePlayerAttribute = keys.enable_player_attribute === 1;
    this.midOnlyMode = keys.mid_only_mode === 1;
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
    if (force) {
      // vote_end：立即定稿，取消可能在途的延迟定稿
      Timers.RemoveTimer(Option.FINALIZE_TIMER);
      this.FinalizeDifficulty();
      return;
    }

    const playerCount = PlayerHelper.GetHumamPlayerCount();
    const { chosen } = this.CollectDifficultyVotes();
    if (chosen >= playerCount) {
      // 全员投完后留 3 秒窗口允许改票；每次新投票重置计时
      Timers.RemoveTimer(Option.FINALIZE_TIMER);
      Timers.CreateTimer(Option.FINALIZE_TIMER, {
        endTime: Option.FINALIZE_DELAY,
        callback: () => this.FinalizeDifficulty(),
      });
    }
  }

  private CollectDifficultyVotes() {
    let chosen = 0;
    let sum = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      if (PlayerResource.GetConnectionState(playerId) !== ConnectionState.UNKNOWN) {
        const choice = CustomNetTables.GetTableValue('difficulty_choice', playerId.toString());
        if (choice !== undefined) {
          chosen++;
          sum += choice.difficulty;
        }
      }
    });
    return { chosen, sum };
  }

  private FinalizeDifficulty() {
    const { chosen, sum } = this.CollectDifficultyVotes();
    let averageDifficulty: number;
    if (chosen === 0) {
      // 如果没有人选择难度，根据地图名选择默认难度，Dota默认1，Hard默认6
      averageDifficulty = this.GetDefaultDifficulty();
    } else {
      // 平均后四舍五入
      averageDifficulty = Math.floor(sum / chosen + 0.5);
    }
    CustomNetTables.SetTableValue('game_difficulty', 'all', { difficulty: averageDifficulty });
    this.gameDifficulty = averageDifficulty;
  }

  SetDefaultDifficulty() {
    // if game difficulty is not set, set it to 1
    if (CustomNetTables.GetTableValue('game_difficulty', 'all') === undefined) {
      print('[Option] SetDefaultDifficulty');
      CustomNetTables.SetTableValue('game_difficulty', 'all', { difficulty: 1 });
      this.gameDifficulty = this.GetDefaultDifficulty();
    }
  }

  GetDefaultDifficulty() {
    const mapDisplayName = GetMapName();
    print(`[Option] mapDisplayName: ${mapDisplayName}`);
    if (mapDisplayName === 'dota') {
      return 1;
    } else if (mapDisplayName === 'hard') {
      return 6;
    }
    return 1;
  }
}
