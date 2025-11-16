import { TowerPushStatus } from '../../modules/event/event-entity-killed';
import { reloadable } from '../../utils/tstl-utils';

/**
 * Bot推进策略管理器
 * 负责管理电脑的推进策略
 */
@reloadable
export class BotTeam {
  private botPushMin: number = 15; // 电脑开始推进的分钟数

  private readonly refreshInterval: number = 1; // 刷新策略间隔

  /**
   * 初始化Bot团队策略
   */
  constructor() {
    // 计算电脑推进时间
    this.initBotPushTime();
    Timers.CreateTimer(2, () => {
      this.refreshTeamStrategy();
      return this.refreshInterval;
    });
  }

  /**
   * 根据难度计算电脑推进时间
   */
  private initBotPushTime(): void {
    const botGoldXpMultiplier = GameRules.Option.direGoldXpMultiplier || 1;

    if (botGoldXpMultiplier <= 3) {
      this.botPushMin = RandomInt(16, 20);
    } else if (botGoldXpMultiplier <= 5) {
      this.botPushMin = RandomInt(13, 16);
    } else if (botGoldXpMultiplier <= 8) {
      this.botPushMin = RandomInt(11, 13);
    } else if (botGoldXpMultiplier <= 10) {
      this.botPushMin = RandomInt(8, 10);
    } else if (botGoldXpMultiplier <= 20) {
      this.botPushMin = RandomInt(5, 7);
    } else {
      this.botPushMin = RandomInt(4, 5);
    }

    print(`[BotTeam] Bot push min: ${this.botPushMin}`);
  }

  /**
   * 刷新团队策略
   */
  private refreshTeamStrategy(): void {
    const gameTime = GameRules.GetDOTATime(false, false);
    const gameModeEntity = GameRules.GetGameModeEntity();

    if (gameTime >= this.botPushMin * 4 * 60) {
      // LATEGAME - 无限制推进
      gameModeEntity.SetBotsMaxPushTier(-1);
    } else if (gameTime >= this.botPushMin * 1.3 * 60) {
      // MIDGAME
      if (TowerPushStatus.tower3PushedGood >= 2 || TowerPushStatus.tower3PushedBad >= 2) {
        gameModeEntity.SetBotsMaxPushTier(4);
      }

      if (TowerPushStatus.barrackPushedGood > 5 || TowerPushStatus.barrackPushedBad > 5) {
        gameModeEntity.SetBotsMaxPushTier(-1);
      } else if (TowerPushStatus.barrackPushedGood > 2 || TowerPushStatus.barrackPushedBad > 2) {
        gameModeEntity.SetBotsMaxPushTier(5);
      }
    } else if (gameTime >= this.botPushMin * 60) {
      // MIDGAME - 开始推进
      gameModeEntity.SetBotsInLateGame(true);
      gameModeEntity.SetBotsAlwaysPushWithHuman(true);
      gameModeEntity.SetBotsMaxPushTier(3);
    } else {
      // EARLYGAME - 保守策略
      gameModeEntity.SetBotsInLateGame(false);
      gameModeEntity.SetBotsAlwaysPushWithHuman(false);
      gameModeEntity.SetBotsMaxPushTier(1);
    }
  }
}
