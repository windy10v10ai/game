import {
  GameEndDto,
  GameEndGameOptionsDto,
  GameEndPlayerDto,
} from '../../../api/analytics/dto/game-end-dto';
import { GA4 } from '../../../api/analytics/ga4/ga4';
import { HeroItemUsage } from '../../../api/analytics/hero-item-usage';
import { GA4DailyTaskTracker } from '../../../api/analytics/ga4/ga4-daily-task-tracker';
import { GA4PickAbilityTracker } from '../../../api/analytics/ga4/ga4-pick-ability-tracker';
import { Game } from '../../../api/game';
import { reloadable } from '../../../utils/tstl-utils';
import { isAwakened } from '../../awaken/awaken-replacer';
import { GameConfig } from '../../GameConfig';
import { LagTelemetry } from '../../lag-telemetry/lag-telemetry';
import { NetTableHelper } from '../../helper/net-table-helper';
import { PlayerHelper } from '../../helper/player-helper';
import { EventPlayerDisconnect } from '../event-player-disconnect';
import { GameEndPoint } from './game-end-point';

const FORT_MIN_HEALTH_MODIFIER = 'modifier_fort_min_health';
// 基地锁在 1 血，检查间隔内回血最多约 45，阈值要高过它才不会被回血顶过去
const FORT_SETTLE_HEALTH = 50;
const FORT_CHECK_INTERVAL = 0.25;
// 结算三次尝试各 3 秒，再久就不等回调，照常推掉基地
const SETTLE_WAIT_SECONDS = 10;

@reloadable
export class GameEnd {
  public static gameEndTriggered: boolean = false;
  public static settled: boolean = false;

  /** 基地掉到阈值就开始结算，回调回来或等待超时后再推掉基地 */
  public static WatchForts(forts: CDOTA_BaseNPC[]): void {
    for (const fort of forts) {
      fort.AddAbility('fort_min_health')?.SetLevel(1);
    }
    Timers.CreateTimer(FORT_CHECK_INTERVAL, () => {
      for (const fort of forts) {
        if (IsValidEntity(fort) && fort.IsAlive() && fort.GetHealth() <= FORT_SETTLE_HEALTH) {
          this.SettleThenEnd(fort);
          return undefined;
        }
      }
      return FORT_CHECK_INTERVAL;
    });
  }

  /** 基地没锁住被直接打死时兜底：进入结算画面后收不到回调，结果只能标成未确认 */
  public static OnFortKilled(fort: CDOTA_BaseNPC): void {
    this.OnGameEnd(this.GetEnemyTeam(fort));
    this.MarkSettled(false);
  }

  private static SettleThenEnd(fort: CDOTA_BaseNPC): void {
    if (this.gameEndTriggered) {
      this.KillFort(fort);
      return;
    }
    this.OnGameEnd(this.GetEnemyTeam(fort), () => this.KillFort(fort));
    Timers.CreateTimer(SETTLE_WAIT_SECONDS, () => {
      this.MarkSettled(false);
      this.KillFort(fort);
      return undefined;
    });
  }

  private static KillFort(fort: CDOTA_BaseNPC): void {
    if (!IsValidEntity(fort) || !fort.IsAlive()) return;
    fort.RemoveModifierByName(FORT_MIN_HEALTH_MODIFIER);
    fort.ForceKill(false);
  }

  private static GetEnemyTeam(fort: CDOTA_BaseNPC): DotaTeam {
    return fort.GetTeamNumber() === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS;
  }

  /** 结算界面只认第一次结果，之后的回调或超时不再改写 */
  private static MarkSettled(recorded: boolean): void {
    if (this.settled) return;
    this.settled = true;
    CustomNetTables.SetTableValue('ending_status', 'ending_status', { status: recorded ? 2 : 3 });
    // 引擎同时只跑几个 HTTP 请求，统计先发会把结算的重发挤到队尾
    const sendStats = this.pendingStats;
    this.pendingStats = undefined;
    sendStats?.();
  }

  private static pendingStats?: () => void;

  public static OnGameEnd(winnerTeamId: DotaTeam, onSettled?: () => void): void {
    if (this.gameEndTriggered) {
      return;
    }
    this.gameEndTriggered = true;

    print(`[GameEnd] OnGameEnd ${winnerTeamId}`);
    // build game end dto
    const gameEndDto = this.BuildGameEndDto(winnerTeamId);

    this.pendingStats = () => {
      try {
        HeroItemUsage.Finish(gameEndDto);
      } catch (error) {
        print(`[HeroItemUsage] failed: ${error}`);
      }
      this.SendAnalyticsEvent(gameEndDto);
    };
    // send game end dto
    Game.EndGame(gameEndDto, (recorded) => {
      this.MarkSettled(recorded);
      onSettled?.();
    });
    CustomNetTables.SetTableValue('ending_status', 'ending_data', { winner_team_id: winnerTeamId });
  }

  private static BuildGameEndDto(winnerTeamId: DotaTeam): GameEndDto {
    const difficulty = CustomNetTables.GetTableValue('game_difficulty', 'all')?.difficulty ?? 0;
    const gameOptions = this.BuildGameOptions()!;

    // 从号角吹响算起，与游戏内计时器、结算界面显示的时长一致，不含选人与准备阶段
    const dotaTime = GameRules.GetDOTATime(false, false);
    const difficultyMultiplier = GameEndPoint.GetDifficultyMultiplier(difficulty, GameRules.Option);

    const players: GameEndPlayerDto[] = [];
    // Pre-collect steamIds to determine real player count for team game check
    const allSteamIds: number[] = [];
    PlayerHelper.ForEachPlayer((playerId) => {
      allSteamIds.push(PlayerResource.GetSteamAccountID(playerId));
    });
    const realPlayerCount = allSteamIds.filter((id) => id > 0).length;
    const isTeamGame = realPlayerCount >= 2;
    print(
      `[GameEnd] realPlayerCount=${realPlayerCount} isTeamGame=${isTeamGame} steamIds=${json.encode(allSteamIds)}`,
    );

    PlayerHelper.ForEachPlayer((playerId) => {
      // 掉线玩家取不到 player 对象，英雄仍在，从英雄取才能让他们也进结算
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) {
        return;
      }

      const damageTaken = PlayerHelper.GetDamageTaken(playerId);
      const totalGoldEarned = PlayerHelper.GetTotalGoldEarned(playerId);
      const stuns = PlayerHelper.GetStuns(playerId);
      // 结算界面与上报取同一份，避免两处各读一次引擎后口径走偏。
      // 引擎给的是小数，取整后上报的才等于界面上显示的那个整数
      const strength = Math.floor(hero.GetStrength());
      const agility = Math.floor(hero.GetAgility());
      const intellect = Math.floor(hero.GetIntellect(false));

      const playerDto: GameEndPlayerDto = {
        heroName: PlayerResource.GetSelectedHeroName(playerId),
        steamId: PlayerResource.GetSteamAccountID(playerId),
        playerId: playerId,
        teamId: PlayerResource.GetTeam(playerId),
        isDisconnected: EventPlayerDisconnect.IsEscaped(playerId),
        level: PlayerResource.GetLevel(playerId),
        totalGoldEarned,
        kills: PlayerResource.GetKills(playerId),
        deaths: PlayerResource.GetDeaths(playerId),
        assists: PlayerResource.GetAssists(playerId),
        heroDamage: PlayerResource.GetRawPlayerDamage(playerId),
        damageTaken,
        healing: PlayerResource.GetHealing(playerId),
        lastHits: PlayerResource.GetLastHits(playerId),
        towerKills: PlayerResource.GetTowerKills(playerId),
        stuns,
        roshanKills: PlayerResource.GetRoshanKills(playerId),
        score: 0,
        battlePoints: 0,
        awaken: isAwakened(hero) ? 1 : 0,
      };
      if (playerDto.steamId > 0) {
        playerDto.strength = strength;
        playerDto.agility = agility;
        playerDto.intellect = intellect;
        this.FillLoadout(playerDto, hero);
      }
      playerDto.score = GameEndPoint.CalculatePlayerScore(playerDto);
      const baseBattlePoints = this.CalculatePlayerBattlePoints(
        playerDto,
        difficultyMultiplier,
        winnerTeamId,
        dotaTime,
      );

      const playerInfo = CustomNetTables.GetTableValue(
        'player_table',
        playerDto.steamId.toString(),
      );
      const conductPoint = playerInfo?.conductPoint ?? 100;
      const conductMultiplier = this.GetConductMultiplier(conductPoint, isTeamGame);
      // 对局积分 = 原始积分 × 行为分倍率（向上取整 0），不含每日任务奖励
      const matchPoints = Math.max(0, Math.round(baseBattlePoints * conductMultiplier));
      // 行为分倍率造成的增减（用于结算界面括号展示，正=加成 负=惩罚 0=无变化）
      const conductDelta = matchPoints - baseBattlePoints;

      // 掉线玩家、未获胜的一方不结算每日任务，哪怕指标已达标
      const dailyTaskEligible = !playerDto.isDisconnected && playerDto.teamId === winnerTeamId;
      const dailyTaskCompletion = dailyTaskEligible
        ? GameRules.DailyTask.EvaluateCompletion(playerId)
        : undefined;
      if (dailyTaskCompletion) {
        playerDto.dailyTask = dailyTaskCompletion.result;
      }
      const dailyTaskPoints = dailyTaskCompletion?.result.seasonPoint ?? 0;
      // 须在行为分倍率之后并入，否则候选卡上写的奖励值会被倍率放大/缩小
      playerDto.battlePoints = matchPoints + dailyTaskPoints;
      players.push(playerDto);

      print(
        `[GameEnd] player ${playerId} steamId=${playerDto.steamId} ` +
          `base=${baseBattlePoints} dailyTaskPoints=${dailyTaskPoints} total=${playerDto.battlePoints}`,
      );

      // 结算界面数据：points 是最终积分，conductDelta / dailyTask 仅用于明细展示
      CustomNetTables.SetTableValue('player_stats', playerId.toString(), {
        steamId: playerDto.steamId.toString(),
        heroDamage: playerDto.heroDamage,
        damagereceived: damageTaken,
        healing: playerDto.healing,
        points: playerDto.battlePoints,
        conductDelta,
        conductPoint,
        str: strength,
        agi: agility,
        int: intellect,
        towerKills: playerDto.towerKills,
        stuns: playerDto.stuns,
        dailyTask: dailyTaskCompletion?.candidate,
      });
    });

    const gameEndDto: GameEndDto = {
      isWin: winnerTeamId === DotaTeam.GOODGUYS,
      matchId: GameRules.Script_GetMatchID().toString(),
      customMatchId: Game.customMatchId,
      version: GameConfig.GAME_VERSION,
      difficulty,
      steamId: 0, // 非玩家单位的事件，固定0
      gameOptions,
      winnerTeamId,
      gameTimeMsec: Math.round(dotaTime * 1000),
      dotaTimeMsec: Math.round(dotaTime * 1000),
      countryCode: GA4.countryCode,
      playerCount: Math.max(1, players.filter((player) => player.steamId > 0).length),
      players,
      perf: LagTelemetry.Finish(),
    };

    return gameEndDto;
  }

  /** 游戏选项，房主还没设置时为空 */
  public static BuildGameOptions(): GameEndGameOptionsDto | undefined {
    const gameOptionsData = CustomNetTables.GetTableValue('game_options', 'game_options');
    if (!gameOptionsData) return undefined;
    return {
      multiplierRadiant: gameOptionsData.multiplier_radiant,
      multiplierDire: gameOptionsData.multiplier_dire,
      playerNumberRadiant: gameOptionsData.player_number_radiant,
      playerNumberDire: gameOptionsData.player_number_dire,
      towerPowerPct: gameOptionsData.tower_power_pct,
      respawnTimePct: gameOptionsData.respawn_time_pct,
    };
  }

  /** 采集结算界面展示的出装与抽选技能 */
  public static FillLoadout(
    playerDto: Pick<
      GameEndPlayerDto,
      'steamId' | 'items' | 'neutralItem' | 'neutralPassiveItem' | 'abilities'
    >,
    hero: CDOTA_BaseNPC_Hero,
  ): void {
    const items: string[] = [];
    for (let slot = 0; slot <= InventorySlot.SLOT_6; slot++) {
      items.push(this.GetItemName(hero, slot));
    }
    playerDto.items = items;
    playerDto.neutralItem = this.GetItemName(hero, InventorySlot.NEUTRAL_ACTIVE_SLOT);
    playerDto.neutralPassiveItem = this.GetItemName(hero, InventorySlot.NEUTRAL_PASSIVE_SLOT);

    const lotteryStatus = NetTableHelper.GetLotteryStatus(playerDto.steamId.toString());
    playerDto.abilities = [
      lotteryStatus.activeAbilityName ?? '',
      lotteryStatus.passiveAbilityName ?? '',
      lotteryStatus.passiveAbilityName2 ?? '',
    ];
  }

  private static GetItemName(hero: CDOTA_BaseNPC_Hero, slot: number): string {
    const item = hero.GetItemInSlot(slot);
    return item ? item.GetAbilityName() : '';
  }

  static CalculatePlayerBattlePoints(
    player: GameEndPlayerDto,
    difficultyMultiplier: number,
    winnerTeamId: DotaTeam,
    dotaTime: number,
  ): number {
    if (player.steamId === 0) {
      // 电脑不获得积分
      return 0;
    }
    const teamKills = PlayerResource.GetTeamKills(player.teamId);
    // 逃跑只算数据分，不给时间分
    const timeMultiplier = player.isDisconnected
      ? 0
      : GameEndPoint.GetParticipationRateMultiplier(player, teamKills);
    const gameTimePoints = GameEndPoint.GetGameTimePoints(dotaTime) * timeMultiplier;
    const basePoints = player.score + gameTimePoints;
    const points = basePoints * difficultyMultiplier;
    // 输了积分减半
    const winMultiplier = player.teamId === winnerTeamId ? 1 : 0.5;
    // 积分为整数，且不会为负数
    return Math.max(0, Math.round(points * winMultiplier));
  }

  /**
   * 根据行为分返回积分倍率。非组队局或 80-109 分时返回 1.0（无影响）。
   * ≥110 → 1.1 加成 / 60-79 → 0.8 惩罚 / <60 → 0.5 重惩罚
   */
  static GetConductMultiplier(conductPoint: number, isTeamGame: boolean): number {
    if (!isTeamGame) return 1;
    if (conductPoint >= 110) return 1.1;
    if (conductPoint >= 80) return 1;
    if (conductPoint >= 60) return 0.8;
    return 0.5;
  }

  private static SendAnalyticsEvent(gameEndDto: GameEndDto) {
    // 发送 GA4 游戏结束技能选择事件
    GA4PickAbilityTracker.SendAtGameEnd(gameEndDto);
    // 发送 GA4 每日任务选择/完成事件
    GA4DailyTaskTracker.SendAtGameEnd(gameEndDto);
  }
}
