import { PlayerHelper } from '../../modules/helper/player-helper';
import { ActionFind } from '../action/action-find';
import { HeroUtil } from '../hero/hero-util';
import {
  BotLane,
  BotLaneRecoveryTower,
  getRecoveryTowerCandidates,
  getPreferredRecoveryTowers,
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
const TASK_ENEMY_INTERRUPT_RADIUS = 900;
const TASK_TICK_INTERVAL = 0.1;

// 时长从 TP 指令下达起算，含约 3 秒引导。TP 塔取候选中的最低层级，配合前排塔门槛只会是一塔或二塔
const RECOVERY_TARGETS: Record<
  BotLane,
  { position: Vector; tier1Duration: number; tier2Duration: number }
> = {
  top: { position: Vector(-6434, 3555, 128), tier1Duration: 10, tier2Duration: 20 },
  mid: { position: Vector(-507, -406, 0), tier1Duration: 6, tier2Duration: 11 },
  bot: { position: Vector(5758, -5708, 128), tier1Duration: 10, tier2Duration: 15 },
};

interface JungleRecoveryTask {
  hero: CDOTA_BaseNPC_Hero;
  heroName: string;
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

interface RecoveryCandidate {
  playerId: PlayerID;
  hero: CDOTA_BaseNPC_Hero;
  scroll: CDOTA_Item;
}

export class BotLaneRecovery {
  private readonly jungleRecoveryTasks = new Map<EntityIndex, JungleRecoveryTask>();
  private taskExecutorRunning = false;

  public Run(): void {
    const towers = this.FindFriendlyTowers();
    if (towers.length === 0) {
      return;
    }

    const hasFrontTower = towers.some((tower) => tower.tier <= FRONT_TOWER_MAX_TIER);
    PlayerHelper.ForEachPlayer((playerId) => {
      const candidate = this.GetRecoveryCandidate(playerId);
      if (candidate) {
        this.ExecuteRecovery(candidate, towers, hasFrontTower);
      }
    });
  }

  private GetRecoveryCandidate(playerId: PlayerID): RecoveryCandidate | undefined {
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

    const scroll = hero.FindItemInInventory('item_tpscroll');
    if (
      !scroll ||
      !scroll.IsFullyCastable() ||
      ActionFind.FindEnemyHeroes(hero, CANDIDATE_ENEMY_HERO_RADIUS).length > 0
    ) {
      return undefined;
    }
    return { playerId, hero, scroll };
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

    const preferredTowers = getPreferredRecoveryTowers(towers, decision.lane);
    const tower = preferredTowers[RandomInt(0, preferredTowers.length - 1)];
    const landingPosition = tower.value
      .GetAbsOrigin()
      .__add(RandomVector(RandomInt(LANDING_OFFSET_MIN, LANDING_OFFSET_MAX)));

    candidate.hero.CastAbilityOnPosition(landingPosition, candidate.scroll, candidate.playerId);
    if (decision.reason === 'jungle' && tower.lane !== undefined) {
      this.CreateJungleRecoveryTask(candidate.hero, tower.lane, tower.tier);
    }
    print(
      `[BotLaneRecovery] ${decision.reason} tp_order hero=${candidate.hero.GetUnitName()} tower=${tower.value.GetUnitName()} landing=(${Math.floor(landingPosition.x)},${Math.floor(landingPosition.y)},${Math.floor(landingPosition.z)})`,
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

  private CreateJungleRecoveryTask(hero: CDOTA_BaseNPC_Hero, lane: BotLane, tier: number): void {
    const target = RECOVERY_TARGETS[lane];
    const duration = tier >= 2 ? target.tier2Duration : target.tier1Duration;
    this.jungleRecoveryTasks.set(hero.GetEntityIndex(), {
      hero,
      heroName: hero.GetUnitName(),
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
          print(`[BotLaneRecovery] jungle tp_start hero=${task.heroName}`);
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
          `[BotLaneRecovery] jungle move_start hero=${hero.GetUnitName()} target=(${Math.floor(task.targetPosition.x)},${Math.floor(task.targetPosition.y)},${Math.floor(task.targetPosition.z)})`,
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
      print(`[BotLaneRecovery] jungle move_end hero=${task.heroName} reason=${reason}`);
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
      if (tower.IsNull() || !tower.IsAlive() || tower.GetTeamNumber() !== DotaTeam.BADGUYS) {
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
