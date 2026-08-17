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
  targetPosition: Vector;
  expiresAt: number;
}

export class BotLaneRecovery {
  private readonly jungleRecoveryTasks = new Map<EntityIndex, JungleRecoveryTask>();
  private taskExecutorRunning = false;

  public Run(): void {
    const towers = this.FindFriendlyTowers();
    if (towers.length === 0) {
      return;
    }

    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsBotPlayerByPlayerId(playerId)) {
        return;
      }
      if (PlayerResource.GetTeam(playerId) !== DotaTeam.BADGUYS) {
        return;
      }

      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero || !hero.IsAlive() || hero.IsIllusion() || HeroUtil.NotActionable(hero)) {
        return;
      }
      if (hero.IsMuted()) {
        return;
      }

      const scroll = hero.FindItemInInventory('item_tpscroll');
      if (!scroll || !scroll.IsFullyCastable()) {
        return;
      }
      if (ActionFind.FindEnemyHeroes(hero, ENEMY_HERO_RADIUS).length > 0) {
        return;
      }

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
        return;
      }

      const preferredTowers = getPreferredRecoveryTowers(towers, decision.lane);
      const tower = preferredTowers[RandomInt(0, preferredTowers.length - 1)];
      const recoveryDistance =
        decision.reason === 'lane' ? nearestLaneTowerDistance : nearestTowerDistance;
      const landingPosition = tower.value
        .GetAbsOrigin()
        .__add(RandomVector(RandomInt(LANDING_RADIUS_MIN, LANDING_RADIUS_MAX)));

      hero.CastAbilityOnPosition(landingPosition, scroll, playerId);
      if (decision.reason === 'jungle' && tower.lane !== undefined) {
        this.CreateJungleRecoveryTask(hero, RECOVERY_TARGETS[tower.lane]);
      }
      print(
        `[BotLaneRecovery] hero=${hero.GetUnitName()} reason=${decision.reason} distance=${Math.floor(recoveryDistance!)} tower=${tower.value.GetUnitName()} landing=(${Math.floor(landingPosition.x)},${Math.floor(landingPosition.y)},${Math.floor(landingPosition.z)})`,
      );
    });
  }

  /** Returns whether lane recovery currently owns this hero's movement. */
  public IsJungleRecoveryMovementActive(hero: CDOTA_BaseNPC_Hero): boolean {
    return this.jungleRecoveryTasks.has(hero.GetEntityIndex());
  }

  /** Cancels the hero's post-teleport jungle recovery movement. */
  public CancelJungleRecoveryMovement(hero: CDOTA_BaseNPC_Hero): void {
    this.jungleRecoveryTasks.delete(hero.GetEntityIndex());
  }

  private CreateJungleRecoveryTask(hero: CDOTA_BaseNPC_Hero, targetPosition: Vector): void {
    this.jungleRecoveryTasks.set(hero.GetEntityIndex(), {
      hero,
      targetPosition,
      expiresAt: GameRules.GetDOTATime(false, true) + RECOVERY_TASK_DURATION,
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
      if (hero.IsNull() || !hero.IsAlive() || gameTime >= task.expiresAt) {
        this.jungleRecoveryTasks.delete(entityIndex);
        continue;
      }

      if (HeroUtil.NotActionable(hero)) {
        continue;
      }
      if (
        this.GetDistanceToPosition(hero, task.targetPosition) <= TARGET_REACHED_RADIUS ||
        this.HasNearbyEnemyHeroOrTower(hero)
      ) {
        this.jungleRecoveryTasks.delete(entityIndex);
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
