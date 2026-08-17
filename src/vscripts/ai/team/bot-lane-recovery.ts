import { PlayerHelper } from '../../modules/helper/player-helper';
import { ActionFind } from '../action/action-find';
import { HeroUtil } from '../hero/hero-util';
import {
  BotLane,
  BotLaneRecoveryDecision,
  BotLaneRecoveryTower,
  getRecoveryTowerCandidates,
  getPreferredRecoveryTowers,
  resolveBotLaneRecovery,
} from './bot-lane-recovery-decision';

const ENEMY_HERO_RADIUS = 1600;
const ENEMY_LANE_CREEP_RADIUS = 1800;
const FRIENDLY_LANE_CREEP_RADIUS = 2400;
const LANDING_RADIUS_MIN = 300;
const LANDING_RADIUS_MAX = 600;
const TARGET_REACHED_RADIUS = 100;
const ENEMY_INTERRUPT_RADIUS = 900;
const RECOVERY_TASK_DURATION = 10;
const RECOVERY_TASK_INTERVAL = 0.1;

const RECOVERY_TARGETS: Record<BotLane, Vector> = {
  top: Vector(-6434, 3555, 128),
  mid: Vector(-507, -406, 0),
  bot: Vector(5907, -5259, 128),
};

interface JungleRecoveryTask {
  hero: CDOTA_BaseNPC_Hero;
  heroName: string;
  targetPosition: Vector;
  expiresAt: number;
  teleportStarted: boolean;
  movementStarted: boolean;
}

type JungleRecoveryEndReason =
  | 'invalid_hero'
  | 'dead'
  | 'timeout'
  | 'reached_target'
  | 'enemy_nearby'
  | 'retreat';

interface RecoveryCandidate {
  playerId: PlayerID;
  hero: CDOTA_BaseNPC_Hero;
  scroll: CDOTA_Item;
}

interface RecoveryPlan {
  decision: BotLaneRecoveryDecision;
  recoveryDistance: number;
}

export class BotLaneRecovery {
  private readonly jungleRecoveryTasks = new Map<EntityIndex, JungleRecoveryTask>();
  private taskExecutorRunning = false;

  public Run(): void {
    const towers = this.FindFriendlyTowers();
    if (towers.length === 0) {
      return;
    }

    PlayerHelper.ForEachPlayer((playerId) => this.TryRecoverBot(playerId, towers));
  }

  private TryRecoverBot(
    playerId: PlayerID,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
  ): void {
    const candidate = this.GetRecoveryCandidate(playerId);
    if (!candidate) {
      return;
    }
    const plan = this.ResolveRecoveryPlan(candidate.hero, towers);
    if (!plan) {
      return;
    }
    this.ExecuteRecovery(candidate, towers, plan);
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
      ActionFind.FindEnemyHeroes(hero, ENEMY_HERO_RADIUS).length > 0
    ) {
      return undefined;
    }
    return { playerId, hero, scroll };
  }

  private ResolveRecoveryPlan(
    hero: CDOTA_BaseNPC_Hero,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
  ): RecoveryPlan | undefined {
    const enemyLaneCreeps = this.FindLaneCreeps(
      hero,
      ENEMY_LANE_CREEP_RADIUS,
      UnitTargetTeam.ENEMY,
    );
    const friendlyLaneCreeps = this.FindLaneCreeps(
      hero,
      FRIENDLY_LANE_CREEP_RADIUS,
      UnitTargetTeam.FRIENDLY,
    );
    const enemyLaneCreep = enemyLaneCreeps[0];
    const lane =
      enemyLaneCreep !== undefined ? this.GetLane(enemyLaneCreep.GetAbsOrigin()) : undefined;
    const laneTowers = getRecoveryTowerCandidates(towers, lane);
    const nearestLaneTowerDistance = this.GetNearestTowerDistance(hero, laneTowers);
    const nearestTowerDistance = this.GetNearestTowerDistance(hero, towers);
    const attackTarget = hero.GetAttackTarget();
    const hasAttackTarget =
      attackTarget !== undefined && !attackTarget.IsNull() && attackTarget.IsAlive();
    const decision = resolveBotLaneRecovery({
      enemyLane: lane,
      hasFriendlyLaneCreep: friendlyLaneCreeps.length > 0,
      distanceToLaneTower: nearestLaneTowerDistance,
      isAttackingNeutral: hasAttackTarget && attackTarget.GetTeamNumber() === DotaTeam.NEUTRALS,
      isAttackingAncient: hasAttackTarget && attackTarget.IsAncient(),
      distanceToNearestTower: nearestTowerDistance,
    });
    if (!decision) {
      return undefined;
    }

    const recoveryDistance =
      decision.reason === 'lane' ? nearestLaneTowerDistance : nearestTowerDistance;
    if (recoveryDistance === undefined) {
      return undefined;
    }
    return { decision, recoveryDistance };
  }

  private ExecuteRecovery(
    candidate: RecoveryCandidate,
    towers: readonly BotLaneRecoveryTower<CDOTA_BaseNPC>[],
    plan: RecoveryPlan,
  ): void {
    const preferredTowers = getPreferredRecoveryTowers(towers, plan.decision.lane);
    if (preferredTowers.length === 0) {
      return;
    }
    const tower = preferredTowers[RandomInt(0, preferredTowers.length - 1)];
    const landingPosition = tower.value
      .GetAbsOrigin()
      .__add(RandomVector(RandomInt(LANDING_RADIUS_MIN, LANDING_RADIUS_MAX)));

    candidate.hero.CastAbilityOnPosition(landingPosition, candidate.scroll, candidate.playerId);
    if (plan.decision.reason === 'jungle' && tower.lane !== undefined) {
      this.CreateJungleRecoveryTask(candidate.hero, RECOVERY_TARGETS[tower.lane]);
    }
    print(
      `[BotLaneRecovery] ${plan.decision.reason} tp_order hero=${candidate.hero.GetUnitName()} distance=${Math.floor(plan.recoveryDistance)} tower=${tower.value.GetUnitName()} landing=(${Math.floor(landingPosition.x)},${Math.floor(landingPosition.y)},${Math.floor(landingPosition.z)})`,
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

  private CreateJungleRecoveryTask(hero: CDOTA_BaseNPC_Hero, targetPosition: Vector): void {
    this.jungleRecoveryTasks.set(hero.GetEntityIndex(), {
      hero,
      heroName: hero.GetUnitName(),
      targetPosition,
      expiresAt: GameRules.GetDOTATime(false, true) + RECOVERY_TASK_DURATION,
      teleportStarted: false,
      movementStarted: false,
    });
    this.StartTaskExecutor();
  }

  private StartTaskExecutor(): void {
    if (this.taskExecutorRunning) {
      return;
    }
    this.taskExecutorRunning = true;

    Timers.CreateTimer(RECOVERY_TASK_INTERVAL, () => {
      this.UpdateJungleRecoveryTasks();
      if (this.jungleRecoveryTasks.size === 0) {
        this.taskExecutorRunning = false;
        return undefined;
      }
      return RECOVERY_TASK_INTERVAL;
    });
  }

  private UpdateJungleRecoveryTasks(): void {
    const gameTime = GameRules.GetDOTATime(false, true);
    for (const [entityIndex, task] of this.jungleRecoveryTasks) {
      const hero = task.hero;
      if (hero.IsNull()) {
        this.EndJungleRecoveryMovement(entityIndex, 'invalid_hero');
        continue;
      }
      if (!hero.IsAlive()) {
        this.EndJungleRecoveryMovement(entityIndex, 'dead');
        continue;
      }
      if (gameTime >= task.expiresAt) {
        this.EndJungleRecoveryMovement(entityIndex, 'timeout');
        continue;
      }

      if (hero.HasModifier('modifier_teleporting')) {
        if (!task.teleportStarted) {
          task.teleportStarted = true;
          print(`[BotLaneRecovery] jungle tp_start hero=${task.heroName}`);
        }
        continue;
      }
      if (!task.teleportStarted) {
        continue;
      }
      if (HeroUtil.NotActionable(hero)) {
        continue;
      }
      if (this.GetDistanceToPosition(hero, task.targetPosition) <= TARGET_REACHED_RADIUS) {
        this.EndJungleRecoveryMovement(entityIndex, 'reached_target');
        continue;
      }
      if (this.HasNearbyEnemyHeroOrTower(hero)) {
        this.EndJungleRecoveryMovement(entityIndex, 'enemy_nearby');
        continue;
      }

      if (!task.movementStarted) {
        task.movementStarted = true;
        print(
          `[BotLaneRecovery] jungle move_start hero=${hero.GetUnitName()} target=(${Math.floor(task.targetPosition.x)},${Math.floor(task.targetPosition.y)},${Math.floor(task.targetPosition.z)})`,
        );
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
    if (task.movementStarted) {
      print(`[BotLaneRecovery] jungle move_end hero=${task.heroName} reason=${reason}`);
    }
  }

  private HasNearbyEnemyHeroOrTower(hero: CDOTA_BaseNPC_Hero): boolean {
    if (ActionFind.FindEnemyHeroes(hero, ENEMY_INTERRUPT_RADIUS).length > 0) {
      return true;
    }
    const buildings = ActionFind.FindEnemyBuildingsInvulnerable(hero, ENEMY_INTERRUPT_RADIUS);
    return buildings.some((building) => building.GetUnitName().includes('tower'));
  }

  private GetDistanceToPosition(hero: CDOTA_BaseNPC_Hero, position: Vector): number {
    return hero.GetAbsOrigin().__sub(position).Length2D();
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
