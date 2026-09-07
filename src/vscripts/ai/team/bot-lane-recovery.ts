import { PlayerHelper } from '../../modules/helper/player-helper';
import { ActionFind } from '../action/action-find';
import { HeroUtil } from '../hero/hero-util';
import {
  BotLane,
  BotLaneRecoveryReason,
  BotLaneRecoveryTower,
  getPreferredRecoveryTowers,
  getRecoveryTowerCandidates,
  resolveBotLaneRecovery,
} from './bot-lane-recovery-decision';

const CANDIDATE_ENEMY_HERO_RADIUS = 1600;
// 敌方小兵用于定位线路，己方小兵用于判断是否已在线上
const LANE_ENEMY_CREEP_RADIUS = 1800;
const LANE_FRIENDLY_CREEP_RADIUS = 2400;
const JUNGLE_NEUTRAL_RADIUS = 700;
const FRONT_TOWER_MAX_TIER = 2;
const LANDING_OFFSET_MIN = 300;
const LANDING_OFFSET_MAX = 600;
const TASK_TARGET_REACHED_RADIUS = 100;
const TASK_ENEMY_INTERRUPT_RADIUS = 700; // 敌方英雄或塔在此范围内会中断强制位移
const TASK_TICK_INTERVAL = 0.1;
const FOUNTAIN_RADIUS = 1600;
// 与正常回城补给的分界线：低于此线属于还在补给，高于则视为无谓滞留
const FOUNTAIN_EVICTION_STATE_PERCENT = 90;
const FOUNTAIN_EVICTION_INTERVAL = 10;
// 撤退英雄每个 think 刷新一次抑制，取一个能覆盖数个 think 间隔的窗口
const RETREAT_SUPPRESS_DURATION = 1.5;

// 时长从 TP 指令下达起算，含约 3 秒引导。TP 塔取候选中的最低层级，配合前排塔门槛只会是一塔或二塔
const RECOVERY_TARGETS: Record<
  BotLane,
  { position: Vector; tier1Duration: number; tier2Duration: number }
> = {
  top: { position: Vector(-6434, 3555, 128), tier1Duration: 15, tier2Duration: 25 },
  mid: { position: Vector(-867, -719, 128), tier1Duration: 10, tier2Duration: 20 },
  bot: { position: Vector(5614, -5562, 128), tier1Duration: 15, tier2Duration: 25 },
};

interface JungleRecoveryTask {
  hero: CDOTA_BaseNPC_Hero;
  heroName: string;
  source: TeleportReason;
  targetPosition: Vector;
  expiresAt: number;
  phase: 'waiting_for_tp' | 'teleporting' | 'moving';
}

type JungleRecoveryEndReason =
  | 'unavailable'
  | 'timeout'
  | 'reached_target'
  | 'enemy_nearby'
  | 'retreat';

type TeleportReason = BotLaneRecoveryReason | 'fountain';

interface RecoveryCandidate {
  playerId: PlayerID;
  hero: CDOTA_BaseNPC_Hero;
  scroll: CDOTA_Item;
}

export class BotLaneRecovery {
  private readonly jungleRecoveryTasks = new Map<EntityIndex, JungleRecoveryTask>();
  private readonly fountainEvictionNextTime = new Map<EntityIndex, number>();
  private readonly retreatSuppressedUntil = new Map<EntityIndex, number>();
  private taskExecutorRunning = false;

  public Run(): void {
    const towers = this.FindFriendlyTowers();
    if (towers.length === 0) {
      return;
    }

    const hasFrontTower = towers.some((tower) => tower.tier <= FRONT_TOWER_MAX_TIER);
    PlayerHelper.ForEachPlayer((playerId) => {
      const candidate = this.GetBotCandidate(playerId);
      if (!candidate) {
        return;
      }
      if (this.TryEvictFromFountain(candidate, towers, hasFrontTower)) {
        return;
      }
      if (this.IsRecoveryCandidate(candidate)) {
        this.ExecuteRecovery(candidate, towers, hasFrontTower);
      }
    });
  }

  private GetBotCandidate(playerId: PlayerID): RecoveryCandidate | undefined {
    if (
      !PlayerHelper.IsBotPlayerByPlayerId(playerId) ||
      PlayerResource.GetTeam(playerId) !== DotaTeam.BADGUYS
    ) {
      return undefined;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (
      !hero ||
      !hero.IsAlive() ||
      hero.IsIllusion() ||
      HeroUtil.NotActionable(hero) ||
      hero.IsMuted()
    ) {
      return undefined;
    }
    if (this.jungleRecoveryTasks.has(hero.GetEntityIndex())) {
      return undefined;
    }
    if (
      GameRules.GetDOTATime(false, true) <
      (this.retreatSuppressedUntil.get(hero.GetEntityIndex()) ?? 0)
    ) {
      return undefined;
    }

    const scroll = hero.FindItemInInventory('item_tpscroll');
    if (!scroll) {
      return undefined;
    }
    return { playerId, hero, scroll };
  }

  // 泉水驱逐会自行刷新冷却，因此可施放判定只属于回线路径
  private IsRecoveryCandidate(candidate: RecoveryCandidate): boolean {
    return (
      candidate.scroll.IsFullyCastable() &&
      ActionFind.FindEnemyHeroes(candidate.hero, CANDIDATE_ENEMY_HERO_RADIUS).length === 0
    );
  }

  private ExecuteRecovery(
    candidate: RecoveryCandidate,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
    hasFrontTower: boolean,
  ): void {
    const hero = candidate.hero;
    const enemyLaneCreeps = this.FindLaneCreeps(
      hero,
      LANE_ENEMY_CREEP_RADIUS,
      UnitTargetTeam.ENEMY,
    );
    const friendlyLaneCreeps = this.FindLaneCreeps(
      hero,
      LANE_FRIENDLY_CREEP_RADIUS,
      UnitTargetTeam.FRIENDLY,
    );
    const enemyLaneCreep = enemyLaneCreeps[0];
    const lane =
      enemyLaneCreep !== undefined ? this.GetLane(enemyLaneCreep.GetAbsOrigin()) : undefined;
    const laneTowers = getRecoveryTowerCandidates(towers, lane);
    const nearestLaneTowerDistance = this.GetNearestTowerDistance(hero, laneTowers);
    const nearestTowerDistance = this.GetNearestTowerDistance(hero, towers);
    const heroPosition = hero.GetAbsOrigin();
    const decision = resolveBotLaneRecovery({
      enemyLane: lane,
      hasFriendlyLaneCreep: friendlyLaneCreeps.length > 0,
      distanceToLaneTower: nearestLaneTowerDistance,
      hasNearbyNeutral: this.HasNearbyNeutral(hero),
      hasFrontTower,
      distanceToNearestTower: nearestTowerDistance,
      heroPositionX: heroPosition.x,
      heroPositionY: heroPosition.y,
    });
    if (!decision) {
      return;
    }

    this.CastRecoveryTeleport(
      candidate,
      towers,
      decision.lane,
      decision.reason,
      decision.reason === 'jungle',
    );
  }

  /**
   * 把 Bot 从己方泉水传送回前排塔并接管上线。
   *
   * 原生 Bot AI 会在满状态下毫无收益地 TP 回泉水，且 TP 冷却好转后重复该动作。
   */
  private TryEvictFromFountain(
    candidate: RecoveryCandidate,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
    hasFrontTower: boolean,
  ): boolean {
    // 只剩三塔说明已被推到高地，此时留在泉水是合理防守位
    if (!hasFrontTower) {
      return false;
    }

    const hero = candidate.hero;
    const entityIndex = hero.GetEntityIndex();
    const gameTime = GameRules.GetDOTATime(false, true);
    if (gameTime < (this.fountainEvictionNextTime.get(entityIndex) ?? 0)) {
      return false;
    }
    if (!this.IsAtFountain(hero)) {
      return false;
    }
    if (
      hero.GetHealthPercent() < FOUNTAIN_EVICTION_STATE_PERCENT ||
      hero.GetManaPercent() < FOUNTAIN_EVICTION_STATE_PERCENT
    ) {
      return false;
    }

    this.fountainEvictionNextTime.set(entityIndex, gameTime + FOUNTAIN_EVICTION_INTERVAL);
    // 施放后引擎重新开始冷却，Bot 在这期间无法自行 TP 回泉水
    candidate.scroll.EndCooldown();
    this.CastRecoveryTeleport(candidate, towers, undefined, 'fountain', true);
    return true;
  }

  private IsAtFountain(hero: CDOTA_BaseNPC_Hero): boolean {
    const fountainPosition = HeroUtil.GetTeamFountainPosition(DotaTeam.BADGUYS);
    if (!fountainPosition) {
      return false;
    }
    return hero.GetAbsOrigin().__sub(fountainPosition).Length2D() <= FOUNTAIN_RADIUS;
  }

  private CastRecoveryTeleport(
    candidate: RecoveryCandidate,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
    lane: BotLane | undefined,
    reason: TeleportReason,
    createTask: boolean,
  ): void {
    const preferredTowers = getPreferredRecoveryTowers(towers, lane);
    const tower = preferredTowers[RandomInt(0, preferredTowers.length - 1)];
    const landingPosition = tower.value
      .GetAbsOrigin()
      .__add(RandomVector(RandomInt(LANDING_OFFSET_MIN, LANDING_OFFSET_MAX)));

    candidate.hero.CastAbilityOnPosition(landingPosition, candidate.scroll, candidate.playerId);
    if (createTask && tower.lane !== undefined) {
      this.CreateJungleRecoveryTask(candidate.hero, tower.lane, tower.tier, reason);
    }
    print(
      `[BotLaneRecovery] ${reason} tp_order hero=${candidate.hero.GetUnitName()} tower=${tower.value.GetUnitName()} landing=(${Math.floor(landingPosition.x)},${Math.floor(landingPosition.y)},${Math.floor(landingPosition.z)})`,
    );
  }

  /** Returns whether lane recovery currently owns this hero's movement. */
  public IsJungleRecoveryMovementActive(hero: CDOTA_BaseNPC_Hero): boolean {
    return this.jungleRecoveryTasks.has(hero.GetEntityIndex());
  }

  /** Cancels the hero's post-teleport jungle recovery movement. */
  public CancelJungleRecoveryMovement(hero: CDOTA_BaseNPC_Hero): void {
    this.EndJungleRecoveryMovement(hero.GetEntityIndex(), 'retreat');
  }

  /** 撤退期间不把该英雄纳入团队回线候选。 */
  public SuppressForRetreat(hero: CDOTA_BaseNPC_Hero): void {
    this.retreatSuppressedUntil.set(
      hero.GetEntityIndex(),
      GameRules.GetDOTATime(false, true) + RETREAT_SUPPRESS_DURATION,
    );
  }

  private CreateJungleRecoveryTask(
    hero: CDOTA_BaseNPC_Hero,
    lane: BotLane,
    tier: number,
    source: TeleportReason,
  ): void {
    const target = RECOVERY_TARGETS[lane];
    const duration = tier >= 2 ? target.tier2Duration : target.tier1Duration;
    this.jungleRecoveryTasks.set(hero.GetEntityIndex(), {
      hero,
      heroName: hero.GetUnitName(),
      source,
      targetPosition: target.position,
      expiresAt: GameRules.GetDOTATime(false, true) + duration,
      phase: 'waiting_for_tp',
    });
    this.StartTaskExecutor();
  }

  private StartTaskExecutor(): void {
    if (this.taskExecutorRunning) {
      return;
    }
    this.taskExecutorRunning = true;

    Timers.CreateTimer(TASK_TICK_INTERVAL, () => {
      this.UpdateJungleRecoveryTasks();
      if (this.jungleRecoveryTasks.size === 0) {
        this.taskExecutorRunning = false;
        return undefined;
      }
      return TASK_TICK_INTERVAL;
    });
  }

  private UpdateJungleRecoveryTasks(): void {
    const gameTime = GameRules.GetDOTATime(false, true);
    for (const [entityIndex, task] of this.jungleRecoveryTasks) {
      const hero = task.hero;
      if (hero.IsNull() || !hero.IsAlive()) {
        this.EndJungleRecoveryMovement(entityIndex, 'unavailable');
        continue;
      }
      if (gameTime >= task.expiresAt) {
        this.EndJungleRecoveryMovement(entityIndex, 'timeout');
        continue;
      }

      const isTeleporting = hero.HasModifier('modifier_teleporting');
      if (task.phase === 'waiting_for_tp') {
        if (isTeleporting) {
          task.phase = 'teleporting';
          print(`[BotLaneRecovery] ${task.source} tp_start hero=${task.heroName}`);
        }
        continue;
      }
      if (isTeleporting) {
        continue;
      }
      if (HeroUtil.NotActionable(hero)) {
        continue;
      }
      if (hero.GetAbsOrigin().__sub(task.targetPosition).Length2D() <= TASK_TARGET_REACHED_RADIUS) {
        this.EndJungleRecoveryMovement(entityIndex, 'reached_target');
        continue;
      }
      if (this.HasNearbyEnemyHeroOrTower(hero)) {
        this.EndJungleRecoveryMovement(entityIndex, 'enemy_nearby');
        continue;
      }

      if (task.phase === 'teleporting') {
        task.phase = 'moving';
        print(
          `[BotLaneRecovery] ${task.source} move_start hero=${hero.GetUnitName()} target=(${Math.floor(task.targetPosition.x)},${Math.floor(task.targetPosition.y)},${Math.floor(task.targetPosition.z)})`,
        );
      }
      // 正在攻击时不重复下指令，否则高频命令会持续打断攻击前摇
      if (hero.IsAttacking()) {
        continue;
      }
      ExecuteOrderFromTable({
        OrderType: UnitOrder.ATTACK_MOVE,
        UnitIndex: hero.GetEntityIndex(),
        Position: task.targetPosition,
        Queue: false,
      });
    }
  }

  private EndJungleRecoveryMovement(
    entityIndex: EntityIndex,
    reason: JungleRecoveryEndReason,
  ): void {
    const task = this.jungleRecoveryTasks.get(entityIndex);
    if (!task) {
      return;
    }
    this.jungleRecoveryTasks.delete(entityIndex);
    if (task.phase === 'moving') {
      print(`[BotLaneRecovery] ${task.source} move_end hero=${task.heroName} reason=${reason}`);
    }
  }

  private HasNearbyEnemyHeroOrTower(hero: CDOTA_BaseNPC_Hero): boolean {
    if (ActionFind.FindEnemyHeroes(hero, TASK_ENEMY_INTERRUPT_RADIUS).length > 0) {
      return true;
    }
    const buildings = ActionFind.FindEnemyBuildingsInvulnerable(hero, TASK_ENEMY_INTERRUPT_RADIUS);
    return buildings.some((building) => building.GetUnitName().includes('tower'));
  }

  private HasNearbyNeutral(hero: CDOTA_BaseNPC_Hero): boolean {
    const creeps = ActionFind.FindEnemyCreeps(hero, JUNGLE_NEUTRAL_RADIUS);
    return creeps.some((creep) => creep.GetTeamNumber() === DotaTeam.NEUTRALS);
  }

  private FindFriendlyTowers(): BotLaneRecoveryTower<CDOTA_BaseNPC>[] {
    const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
    const result: BotLaneRecoveryTower<CDOTA_BaseNPC>[] = [];
    for (const tower of towers) {
      // 无敌塔是被前排塔保护的后排塔，不代表前线位置，回线距离与 TP 目标都只参照最外层塔
      if (
        tower.IsNull() ||
        !tower.IsAlive() ||
        tower.IsInvulnerable() ||
        tower.GetTeamNumber() !== DotaTeam.BADGUYS
      ) {
        continue;
      }

      const tier = this.GetTowerTier(tower.GetUnitName());
      if (!tier) {
        continue;
      }
      result.push({ value: tower, lane: this.GetTowerLane(tower.GetUnitName()), tier });
    }
    return result;
  }

  private FindLaneCreeps(
    hero: CDOTA_BaseNPC_Hero,
    radius: number,
    teamFilter: UnitTargetTeam,
  ): CDOTA_BaseNPC[] {
    const creeps = ActionFind.Find(
      hero,
      radius,
      teamFilter,
      UnitTargetType.CREEP,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
    );
    return creeps.filter((creep) => this.IsLaneCreep(creep));
  }

  private IsLaneCreep(creep: CDOTA_BaseNPC): boolean {
    const name = creep.GetUnitName();
    return name.includes('creep_goodguys') || name.includes('creep_badguys');
  }

  private GetNearestTowerDistance(
    hero: CDOTA_BaseNPC_Hero,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
  ): number | undefined {
    if (towers.length === 0) {
      return undefined;
    }
    let distance = hero.GetRangeToUnit(towers[0].value);
    for (const tower of towers) {
      distance = Math.min(distance, hero.GetRangeToUnit(tower.value));
    }
    return distance;
  }

  private GetTowerTier(name: string): number | undefined {
    if (name.includes('tower1')) {
      return 1;
    }
    if (name.includes('tower2')) {
      return 2;
    }
    if (name.includes('tower3')) {
      return 3;
    }
    return undefined;
  }

  private GetTowerLane(name: string): BotLane | undefined {
    if (name.includes('top')) {
      return 'top';
    }
    if (name.includes('mid')) {
      return 'mid';
    }
    if (name.includes('bot')) {
      return 'bot';
    }
    return undefined;
  }

  private GetLane(position: Vector): BotLane | undefined {
    if (Math.abs(Math.abs(position.x) - Math.abs(position.y)) < 1500) {
      return 'mid';
    }
    if (position.x > 0 && position.y < 0) {
      return 'bot';
    }
    if (position.x < 0 && position.y > 0) {
      return 'top';
    }
    return undefined;
  }
}
