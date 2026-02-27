import { Player } from '../../api/player';
import { TowerPushStatus } from '../../modules/event/event-entity-killed';
import { PlayerHelper } from '../../modules/helper/player-helper';
import { reloadable } from '../../utils/tstl-utils';

/**
 * Bot推进策略管理器
 * 负责管理电脑的推进策略
 */
@reloadable
export class BotTeam {
  private botPushMin: number = 15; // 电脑开始推进的分钟数
  private botPushLevel: number = 10; // 电脑推进等级
  private baseBotPushMin: number = 15; // 基础推进时间（根据难度计算）
  private addAmount: number = 0; // Bot发钱的基础金额

  private readonly addAmountBase: number = 2; // Bot发钱的基础金额
  private readonly addAmountNeedLevel: number = 100; // 每多少玩家等级增加1的金额
  private readonly refreshInterval: number = 1; // 刷新策略间隔

  /**
   * 初始化Bot团队策略
   */
  constructor() {
    // 计算电脑推进时间
    this.initBotPushTime();
    // 计算Bot发钱的基础金额
    this.initAddAmount();
    // 每1秒刷新一次团队策略和给Bot发钱
    Timers.CreateTimer(this.refreshInterval, () => {
      this.refreshTeamStrategy();
      this.addMoneyForBots();
      return this.refreshInterval;
    });
  }

  /**
   * 根据难度计算基础推进时间
   */
  private initBotPushTime(): void {
    const botGoldXpMultiplier = GameRules.Option.direGoldXpMultiplier || 1;

    if (botGoldXpMultiplier <= 3) {
      this.baseBotPushMin = RandomInt(16, 20);
    } else if (botGoldXpMultiplier <= 5) {
      this.baseBotPushMin = RandomInt(13, 16);
    } else if (botGoldXpMultiplier <= 8) {
      this.baseBotPushMin = RandomInt(11, 13);
    } else if (botGoldXpMultiplier <= 10) {
      this.baseBotPushMin = RandomInt(8, 10);
    } else if (botGoldXpMultiplier <= 20) {
      this.baseBotPushMin = RandomInt(5, 7);
    } else {
      this.baseBotPushMin = RandomInt(4, 5);
    }

    // 初始化时，动态推进时间等于基础推进时间
    this.botPushMin = this.baseBotPushMin;

    print(`[BotTeam] Base bot push min: ${this.baseBotPushMin}`);

    // 根据难度计算电脑推进等级
    const randomLevel = RandomInt(0, 2); // 随机额外增加0~2级
    this.botPushLevel = this.getTowerRequiredLevel() + randomLevel;
    print(`[BotTeam] Bot push level: ${this.botPushLevel}`);
  }

  /**
   * 获取Bot团队平均等级
   */
  private getBotTeamAverageLevel(): number {
    let totalLevel = 0;
    let botCount = 0;

    // 遍历所有玩家，找出Bot玩家
    for (let playerId = 0; playerId < 24; playerId++) {
      if (!PlayerResource.IsValidPlayerID(playerId)) continue;

      // Bot玩家在夜魇阵营且是假玩家
      const playerTeam = PlayerResource.GetTeam(playerId);
      const isBot = PlayerResource.IsFakeClient(playerId);

      if (playerTeam === DotaTeam.BADGUYS && isBot) {
        const hero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (hero && hero.IsAlive()) {
          totalLevel += hero.GetLevel();
          botCount++;
        }
      }
    }

    // 返回平均等级，如果没有bot则返回1
    return botCount > 0 ? totalLevel / botCount : 1;
  }

  /**
   * 根据防御塔强度 需要的平均等级
   */
  private getTowerRequiredLevel(): number {
    const towerPower = GameRules.Option.towerPower;
    if (towerPower <= 200) {
      return 13;
    } else if (towerPower <= 300) {
      return 14;
    } else if (towerPower <= 400) {
      return 15;
    } else {
      return 16;
    }
  }

  /**
   * 根据防御塔状态计算推进层级
   * @returns 推进层级
   */
  private calculatePushTierByTowerStatus(): number {
    // 优先检查兵营状态（优先级更高）
    if (TowerPushStatus.barrackPushedGood > 5 || TowerPushStatus.barrackPushedBad > 5) {
      return -1; // 无限制推进
    } else if (TowerPushStatus.barrackPushedGood > 2 || TowerPushStatus.barrackPushedBad > 2) {
      return 5;
    }

    // 检查三塔状态
    if (TowerPushStatus.tower3PushedGood >= 2 || TowerPushStatus.tower3PushedBad >= 2) {
      return 4;
    }

    // 检查二塔状态
    if (TowerPushStatus.tower2PushedGood >= 2 || TowerPushStatus.tower2PushedBad >= 2) {
      return 3;
    }

    // 检查一塔状态
    if (TowerPushStatus.tower1PushedGood >= 2 || TowerPushStatus.tower1PushedBad >= 2) {
      return 2;
    }

    return 1;
  }

  /**
   * 刷新团队策略
   */
  private refreshTeamStrategy(): void {
    // 动态计算推进时间
    // 获取Bot团队平均等级
    const avgLevel = this.getBotTeamAverageLevel();
    const isStartPushForce = avgLevel >= this.botPushLevel;

    const gameTime = GameRules.GetDOTATime(false, false);
    const gameModeEntity = GameRules.GetGameModeEntity();

    if (gameTime >= this.botPushMin * 4 * 60) {
      // LATEGAME - 无限制推进
      gameModeEntity.SetBotsMaxPushTier(-1);
    } else if (gameTime >= this.botPushMin * 60 || isStartPushForce) {
      // MIDGAME - 开始推进 根据防御塔状态计算推进策略
      const pushTier = this.calculatePushTierByTowerStatus();
      gameModeEntity.SetBotsMaxPushTier(pushTier);
      gameModeEntity.SetBotsInLateGame(true);
      gameModeEntity.SetBotsAlwaysPushWithHuman(true);
    } else {
      // EARLYGAME - 不推进
      gameModeEntity.SetBotsInLateGame(false);
      gameModeEntity.SetBotsAlwaysPushWithHuman(false);
      gameModeEntity.SetBotsMaxPushTier(1);
    }
  }

  /**
   * 初始化Bot发钱的基础金额
   * 根据玩家等级（seasonLevel + memberLevel）增加
   */
  private initAddAmount(): void {
    const playerNumberBonus = Player.GetPlayerCount() / 2;

    // 遍历所有玩家，计算总等级
    let totalLevel = 0;
    for (const player of Player.playerList) {
      const seasonLevel = player.seasonLevel || 0;
      const memberLevel = player.memberLevel || 0;
      totalLevel += seasonLevel + memberLevel;
    }

    const levelBonus = totalLevel / this.addAmountNeedLevel;

    this.addAmount = Math.floor(this.addAmountBase + levelBonus + playerNumberBonus);
    print(
      `[BotTeam] Add amount: ${this.addAmount} (playerNumber: ${playerNumberBonus}, levelBonus: ${levelBonus})`,
    );
  }

  /**
   * 给Bot发钱
   * 每1秒调用一次(原Lua实现是2秒调用一次,现在金额减半以保持总量不变)
   */
  private addMoneyForBots(): void {
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime <= 0) return; // 避免除以0

    // 遍历所有Bot玩家(天辉和夜魇)
    PlayerHelper.ForEachPlayer((playerId) => {
      // 只给Bot发钱
      if (!PlayerHelper.IsBotPlayerByPlayerId(playerId)) return;

      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;

      // 根据队伍选择倍率
      const multiplier = GameRules.GoldXPFilter.getPlayerGoldXpMultiplier(playerId);

      // 金币上限是发钱速度的2倍
      const addMoney = multiplier * this.addAmount;
      const maxAmountPerSec = Math.floor(addMoney * 2);

      // 检查金币上限
      const totalGold = PlayerResource.GetTotalEarnedGold(playerId);
      const goldPerSec = totalGold / gameTime;

      // 如果玩家平均每秒赚的钱 > 原来的上限,则不发钱
      if (goldPerSec > maxAmountPerSec) return;

      // 发钱
      hero.ModifyGold(addMoney, true, ModifyGoldReason.GAME_TICK);
    });
  }
}
