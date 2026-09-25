import { Player } from '../../api/player';
import { TowerPushStatus } from '../../modules/event/event-entity-killed';
import { PlayerHelper } from '../../modules/helper/player-helper';
import { reloadable } from '../../utils/tstl-utils';
import { BotLaneRecovery } from './bot-lane-recovery';
import { LanePath } from './lane-geometry';
import { pushLevelFor, shouldTakeOver } from './takeover';
import { BuildLanePaths, TeamBrain } from './team-brain';

/**
 * bot 的全局调度：对线期交给原生 bot，到切换点后关掉原生、由各队的团队大脑接管。
 * 原生开关是全局的，一关两队的 bot 都关，所以每支有 AI 英雄的队伍都建一个团队大脑。
 */
@reloadable
export class BotTeam {
  private addAmount: number = 0;
  private earlyGameMin: number = 3;
  private nativeActive: boolean = true;
  private readonly pushLevel: number;
  private readonly lanes: LanePath[];
  private readonly brains = new Map<DotaTeam, TeamBrain>();

  private readonly addAmountBase: number = 2;
  private readonly addAmountPlayerNumberBonus: number = 0.15;
  private readonly addAmountNeedLevel: number = 0.02;
  private readonly refreshInterval: number = 1;
  private readonly laneRecovery = new BotLaneRecovery();

  constructor() {
    this.pushLevel = pushLevelFor(GameRules.Option.towerPower, GameRules.Option.midOnlyMode);
    this.lanes = BuildLanePaths();
    this.initEarlyGame();
    this.initAddAmount();
    ListenToGameEvent('entity_killed', (keys) => this.onEntityKilled(keys), this);
    Timers.CreateTimer(this.refreshInterval, () => {
      this.refresh();
      return this.refreshInterval;
    });
  }

  private refresh(): void {
    if (this.nativeActive) {
      this.refreshNativeStrategy();
      if (this.shouldTakeOver()) {
        this.SetNativeThinking(false);
      }
    }
    for (const brain of this.brains.values()) {
      brain.Think(!this.nativeActive);
    }
    this.addMoneyForBots();
    if (this.nativeActive) {
      this.laneRecovery.Run();
    }
  }

  /** 英雄所在队伍的团队大脑，没有时新建。 */
  GetBrain(hero: CDOTA_BaseNPC_Hero): TeamBrain {
    const team = hero.GetTeamNumber();
    let brain = this.brains.get(team);
    if (!brain) {
      brain = new TeamBrain(team, this.lanes);
      this.brains.set(team, brain);
    }
    return brain;
  }

  IsNativeActive(): boolean {
    return this.nativeActive;
  }

  /** 开关原生 bot 思考；关闭即由团队大脑接管移动，回线也随之停用。 */
  SetNativeThinking(enabled: boolean): void {
    this.nativeActive = enabled;
    GameRules.GetGameModeEntity().SetBotThinkingEnabled(enabled);
    print(
      `[BotTeam] native bot thinking ${enabled ? 'on' : 'off'} at ${GameRules.GetDOTATime(false, false)}`,
    );
  }

  private shouldTakeOver(): boolean {
    return shouldTakeOver({
      gameTime: GameRules.GetDOTATime(false, false),
      towersLost: Math.max(this.towersLost(true), this.towersLost(false)),
      midOnly: GameRules.Option.midOnlyMode,
      averageBotLevel: this.getBotAverageLevel(),
      pushLevel: this.pushLevel,
      direMultiplier: GameRules.Option.direGoldXpMultiplier || 1,
    });
  }

  // Good 是天辉摧毁的，即夜魇掉的塔
  private towersLost(byRadiant: boolean): number {
    const s = TowerPushStatus;
    return byRadiant
      ? s.tower1PushedGood + s.tower2PushedGood + s.tower3PushedGood + s.tower4PushedGood
      : s.tower1PushedBad + s.tower2PushedBad + s.tower3PushedBad + s.tower4PushedBad;
  }

  private getBotAverageLevel(): number {
    let totalLevel = 0;
    let botCount = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsBotPlayerByPlayerId(playerId)) return;
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (hero) {
        totalLevel += hero.GetLevel();
        botCount++;
      }
    });
    return botCount > 0 ? totalLevel / botCount : 1;
  }

  private initEarlyGame(): void {
    const multiplier = GameRules.Option.direGoldXpMultiplier || 1;
    if (multiplier <= 5) {
      this.earlyGameMin = 4;
    } else if (multiplier <= 10) {
      this.earlyGameMin = 3;
    } else {
      this.earlyGameMin = 2;
    }
  }

  /** 对线期原生 bot 的推进策略：开局不推，之后只允许抱团推外塔，其余交给切换后的团队大脑。 */
  private refreshNativeStrategy(): void {
    const gameModeEntity = GameRules.GetGameModeEntity();
    const inLateGame = GameRules.GetDOTATime(false, false) >= this.earlyGameMin * 60;
    gameModeEntity.SetBotsInLateGame(inLateGame);
    gameModeEntity.SetBotsAlwaysPushWithHuman(false);
    gameModeEntity.SetBotsMaxPushTier(1);
  }

  private onEntityKilled(keys: GameEventProvidedProperties & EntityKilledEvent): void {
    const killed = EntIndexToHScript(keys.entindex_killed) as CDOTA_BaseNPC | undefined;
    if (!killed || !killed.IsBaseNPC() || !killed.IsRealHero() || killed.IsReincarnating()) {
      return;
    }
    const attacker =
      keys.entindex_attacker !== undefined ? EntIndexToHScript(keys.entindex_attacker) : undefined;
    let killerHero: CDOTA_BaseNPC_Hero | undefined;
    if (attacker === undefined || !attacker.IsBaseNPC()) {
      killerHero = undefined;
    } else if (attacker.IsRealHero()) {
      killerHero = attacker;
    } else {
      killerHero = attacker.GetPlayerOwner()?.GetAssignedHero();
    }
    for (const brain of this.brains.values()) {
      brain.OnHeroKilled(killed, killerHero);
    }
  }

  /** Returns whether jungle recovery currently owns this hero's movement. */
  isJungleRecoveryMovementActive(hero: CDOTA_BaseNPC_Hero): boolean {
    return this.laneRecovery.IsJungleRecoveryMovementActive(hero);
  }

  /** Cancels the hero's post-teleport jungle recovery movement. */
  cancelJungleRecoveryMovement(hero: CDOTA_BaseNPC_Hero): void {
    this.laneRecovery.CancelJungleRecoveryMovement(hero);
  }

  /** 撤退中的英雄改由自身 AI 决定去泉水还是继续走，暂时退出团队回线。 */
  suppressLaneRecoveryForRetreat(hero: CDOTA_BaseNPC_Hero): void {
    this.laneRecovery.SuppressForRetreat(hero);
  }

  /**
   * 初始化Bot发钱的基础金额
   * 根据玩家等级（seasonLevel + memberLevel）增加
   */
  private initAddAmount(): void {
    const playerNumberBonus = Player.GetPlayerCount() * this.addAmountPlayerNumberBonus;

    let totalLevel = 0;
    for (const player of Player.playerInfoMap.values()) {
      const seasonLevel = player.seasonLevel || 0;
      const memberLevel = player.memberLevel || 0;
      totalLevel += seasonLevel + memberLevel;
    }

    const levelBonus = totalLevel * this.addAmountNeedLevel;

    this.addAmount = Math.floor(this.addAmountBase + levelBonus + playerNumberBonus);
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
