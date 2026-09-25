/**
 * 每队一个团队大脑：每秒按本队视野扫一次局面，给挂了 AI 的英雄分派任务。
 * 敌方英雄与小兵只认本队看得到的，建筑位置固定、始终可读。
 */
import { HeroUtil } from '../hero/hero-util';
import {
  buildLanePath,
  Lane,
  forwardProgress,
  LanePath,
  nearestLane,
  Point,
  pointAtProgress,
  progressFromForward,
  projectOnLane,
} from './lane-geometry';
import {
  combatPower,
  decayThreat,
  threatAfterDeath,
  threatAfterKill,
  threatMultiplier,
} from './power';
import { DefendTarget, planTasks, PushLane, SupportTarget, Task } from './team-plan';

// 看不到之后，前 5 秒按原位置用，15 秒内按移速扩大可能范围，再往后只记得这个英雄存在
const LAST_SEEN_EXACT = 5;
const LAST_SEEN_FORGET = 15;
const LANE_MAX_OFFSET = 2000;
const LANE_CREEP_MAX_OFFSET = 1200;
const BUILDING_THREAT_RADIUS = 1200;
const SUPPORT_ENEMY_RADIUS = 1000;
// 按最大血量算的掉血比例，过滤掉零星的小兵与塔伤害
const SUPPORT_HEALTH_DROP = 0.03;
// 兵线进到目标建筑这个距离内，才算可以开始推塔
const WAVE_AT_TARGET_DISTANCE = 900;
// 兵线没到时在塔攻击范围外等
const WAIT_OUTSIDE_TOWER = 1100;

export interface EnemyMemory {
  pos: Vector;
  time: number;
}

interface ThreatRecord {
  score: number;
  time: number;
}

interface BuildingInfo {
  unit: CDOTA_BaseNPC;
  lane: Lane | undefined;
  tier: number;
  importance: number;
  isBase: boolean;
}

export class TeamBrain {
  private readonly enemyTeam: DotaTeam;
  private readonly members = new Map<EntityIndex, CDOTA_BaseNPC_Hero>();
  private readonly recoverRequests = new Set<EntityIndex>();
  private readonly lastSeen = new Map<EntityIndex, EnemyMemory>();
  private readonly lastHealth = new Map<EntityIndex, number>();
  private readonly threats = new Map<EntityIndex, ThreatRecord>();
  private tasks = new Map<number, Task>();
  private mainLane: Lane | undefined;

  constructor(
    public readonly team: DotaTeam,
    private readonly lanes: LanePath[],
  ) {
    this.enemyTeam = team === DotaTeam.GOODGUYS ? DotaTeam.BADGUYS : DotaTeam.GOODGUYS;
  }

  /** 让英雄加入本队调度，英雄 AI 每次思考时调用。 */
  Join(hero: CDOTA_BaseNPC_Hero): void {
    this.members.set(hero.GetEntityIndex(), hero);
  }

  GetTask(hero: CDOTA_BaseNPC_Hero): Task | undefined {
    return this.tasks.get(hero.GetEntityIndex());
  }

  SetNeedsRecover(hero: CDOTA_BaseNPC_Hero, needs: boolean): void {
    if (needs) {
      this.recoverRequests.add(hero.GetEntityIndex());
    } else {
      this.recoverRequests.delete(hero.GetEntityIndex());
    }
  }

  /** 单位对本队的威胁战力：敌方英雄乘上最近战绩带来的威胁倍率。 */
  PowerOf(unit: CDOTA_BaseNPC): number {
    const power = UnitPower(unit);
    if (unit.GetTeamNumber() !== this.enemyTeam || !unit.IsRealHero()) {
      return power;
    }
    return power * threatMultiplier(this.ThreatScore(unit.GetEntityIndex()));
  }

  OnHeroKilled(killed: CDOTA_BaseNPC_Hero, killerHero: CDOTA_BaseNPC_Hero | undefined): void {
    const now = GameRules.GetGameTime();
    if (killed.GetTeamNumber() === this.enemyTeam) {
      const index = killed.GetEntityIndex();
      this.threats.set(index, { score: threatAfterDeath(this.ThreatScore(index)), time: now });
      return;
    }
    if (killerHero && killerHero.GetTeamNumber() === this.enemyTeam) {
      const index = killerHero.GetEntityIndex();
      this.threats.set(index, { score: threatAfterKill(this.ThreatScore(index)), time: now });
    }
  }

  private ThreatScore(index: EntityIndex): number {
    const record = this.threats.get(index);
    if (!record) {
      return 0;
    }
    return decayThreat(record.score, GameRules.GetGameTime() - record.time);
  }

  /** 每秒调用一次；assign 为 false 时只更新局面记忆，任务交给原生。 */
  Think(assign: boolean): void {
    this.PruneMembers();
    const heroes = HeroList.GetAllHeroes().filter(
      (hero) => IsValidEntity(hero) && hero.IsRealHero() && !hero.IsIllusion(),
    );
    const allies = heroes.filter((hero) => hero.GetTeamNumber() === this.team);
    const enemies = heroes.filter((hero) => hero.GetTeamNumber() === this.enemyTeam);
    const observer = allies[0];
    const now = GameRules.GetGameTime();
    const visibleEnemies: CDOTA_BaseNPC_Hero[] = [];
    for (const enemy of enemies) {
      if (enemy.IsAlive() && observer && observer.CanEntityBeSeenByMyTeam(enemy)) {
        visibleEnemies.push(enemy);
        this.lastSeen.set(enemy.GetEntityIndex(), { pos: enemy.GetAbsOrigin(), time: now });
      }
    }
    const support = this.FindSupportTargets(allies, visibleEnemies);
    if (!assign || this.members.size === 0) {
      this.tasks.clear();
      return;
    }

    const ourPower = allies.reduce((sum, hero) => sum + UnitPower(hero), 0);
    const enemyPower = enemies.reduce((sum, hero) => sum + this.PowerOf(hero), 0);
    const buildings = CollectBuildings();
    const fountain = HeroUtil.GetTeamFountainPosition(this.team) ?? Vector(0, 0, 0);
    const bots = [...this.members.values()]
      .filter((hero) => hero.IsAlive())
      .map((hero) => ({
        id: hero.GetEntityIndex() as number,
        pos: hero.GetAbsOrigin(),
        power: UnitPower(hero),
        needsRecover: this.recoverRequests.has(hero.GetEntityIndex()),
        previous: this.tasks.get(hero.GetEntityIndex()),
      }));

    const result = planTasks({
      bots,
      fountain,
      defend: this.FindDefendTargets(buildings, visibleEnemies),
      support,
      lanes: this.FindPushLanes(buildings, enemies, now),
      ourPower,
      enemyPower,
      mainLane: this.mainLane,
    });
    this.tasks = result.tasks;
    this.mainLane = result.mainLane;
  }

  private PruneMembers(): void {
    for (const [index, hero] of this.members) {
      if (!IsValidEntity(hero)) {
        this.members.delete(index);
        this.recoverRequests.delete(index);
      }
    }
  }

  /** 最近一次看到的位置，太久没看到时返回 undefined。 */
  RecallEnemy(index: EntityIndex): EnemyMemory | undefined {
    const memory = this.lastSeen.get(index);
    if (!memory || GameRules.GetGameTime() - memory.time > LAST_SEEN_FORGET) {
      return undefined;
    }
    return memory;
  }

  private FindSupportTargets(
    allies: CDOTA_BaseNPC_Hero[],
    visibleEnemies: CDOTA_BaseNPC_Hero[],
  ): SupportTarget[] {
    const targets: SupportTarget[] = [];
    for (const ally of allies) {
      const index = ally.GetEntityIndex();
      const health = ally.GetHealth();
      const previous = this.lastHealth.get(index) ?? health;
      this.lastHealth.set(index, health);
      if (!ally.IsAlive() || previous - health < ally.GetMaxHealth() * SUPPORT_HEALTH_DROP) {
        continue;
      }
      let enemyPower = 0;
      for (const enemy of visibleEnemies) {
        if (ally.GetRangeToUnit(enemy) <= SUPPORT_ENEMY_RADIUS) {
          enemyPower += this.PowerOf(enemy);
        }
      }
      if (enemyPower > 0) {
        targets.push({ id: index, pos: ally.GetAbsOrigin(), enemyPower });
      }
    }
    return targets;
  }

  private FindDefendTargets(
    buildings: BuildingInfo[],
    visibleEnemies: CDOTA_BaseNPC_Hero[],
  ): DefendTarget[] {
    const targets: DefendTarget[] = [];
    for (const building of buildings) {
      const unit = building.unit;
      if (unit.GetTeamNumber() !== this.team || unit.IsInvulnerable()) {
        continue;
      }
      let attackerPower = 0;
      for (const enemy of visibleEnemies) {
        if (unit.GetRangeToUnit(enemy) <= BUILDING_THREAT_RADIUS) {
          attackerPower += this.PowerOf(enemy);
        }
      }
      if (attackerPower <= 0) {
        continue;
      }
      targets.push({
        id: unit.GetEntityIndex(),
        pos: unit.GetAbsOrigin(),
        isBase: building.isBase,
        importance: building.importance,
        hpRatio: unit.GetHealth() / unit.GetMaxHealth(),
        attackerPower,
      });
    }
    return targets;
  }

  private FindPushLanes(
    buildings: BuildingInfo[],
    enemies: CDOTA_BaseNPC_Hero[],
    now: number,
  ): PushLane[] {
    const isRadiant = this.team === DotaTeam.GOODGUYS;
    const enemyTargets = buildings.filter(
      (building) =>
        building.unit.GetTeamNumber() === this.enemyTeam && !building.unit.IsInvulnerable(),
    );
    if (enemyTargets.length === 0) {
      return [];
    }
    const creepFront = this.FindCreepFronts(isRadiant);
    const lanePower = this.EnemyPowerByLane(enemies, now);
    const lanes: PushLane[] = [];
    for (const path of this.lanes) {
      // 本路的建筑推完了就打基地里离这一路最近的目标
      let candidates = enemyTargets.filter((building) => building.lane === path.lane);
      if (candidates.length === 0) {
        candidates = enemyTargets.filter((building) => building.lane === undefined);
      }
      let target: BuildingInfo | undefined;
      let targetForward = 0;
      for (const building of candidates) {
        const forward = forwardProgress(
          path,
          projectOnLane(path, building.unit.GetAbsOrigin()).progress,
          isRadiant,
        );
        if (!target || forward < targetForward) {
          target = building;
          targetForward = forward;
        }
      }
      if (!target) {
        continue;
      }
      const front = creepFront.get(path.lane);
      const waveAtTarget = front !== undefined && front >= targetForward - WAVE_AT_TARGET_DISTANCE;
      let stagingPos: Point = target.unit.GetAbsOrigin();
      if (!waveAtTarget) {
        const waitForward =
          front === undefined
            ? targetForward - WAIT_OUTSIDE_TOWER
            : Math.min(front, targetForward - WAIT_OUTSIDE_TOWER);
        stagingPos = pointAtProgress(path, progressFromForward(path, waitForward, isRadiant));
      }
      lanes.push({
        lane: path.lane,
        targetId: target.unit.GetEntityIndex(),
        stagingPos: Vector(stagingPos.x, stagingPos.y, 0),
        targetHpRatio: target.unit.GetHealth() / target.unit.GetMaxHealth(),
        waveAtTarget,
        enemyPower: lanePower.get(path.lane) ?? 0,
      });
    }
    return lanes;
  }

  /** 每路己方兵线最靠前的位置，用「朝敌方高地前进了多少」表示。 */
  private FindCreepFronts(isRadiant: boolean): Map<Lane, number> {
    const fronts = new Map<Lane, number>();
    const creeps = FindUnitsInRadius(
      this.team,
      Vector(0, 0, 0),
      undefined,
      FIND_UNITS_EVERYWHERE,
      UnitTargetTeam.FRIENDLY,
      UnitTargetType.CREEP,
      UnitTargetFlags.NONE,
      FindOrder.ANY,
      false,
    );
    for (const creep of creeps) {
      if (!IsLaneCreep(creep)) {
        continue;
      }
      const hit = nearestLane(this.lanes, creep.GetAbsOrigin(), LANE_CREEP_MAX_OFFSET);
      if (!hit) {
        continue;
      }
      const forward = forwardProgress(hit.path, hit.projection.progress, isRadiant);
      fronts.set(hit.path.lane, Math.max(fronts.get(hit.path.lane) ?? 0, forward));
    }
    return fronts;
  }

  /** 按最近看到的位置把敌方英雄战力分到各路，用于「去推玩家不在的那一路」。 */
  private EnemyPowerByLane(enemies: CDOTA_BaseNPC_Hero[], now: number): Map<Lane, number> {
    const result = new Map<Lane, number>();
    for (const enemy of enemies) {
      if (!enemy.IsAlive()) {
        continue;
      }
      const memory = this.lastSeen.get(enemy.GetEntityIndex());
      if (!memory || now - memory.time > LAST_SEEN_FORGET) {
        continue;
      }
      // 5 秒以上没看到时位置不准，只有离兵线很近才算在这一路
      const maxOffset =
        now - memory.time <= LAST_SEEN_EXACT
          ? LANE_MAX_OFFSET
          : LANE_MAX_OFFSET - enemy.GetIdealSpeed() * (now - memory.time - LAST_SEEN_EXACT);
      const hit = nearestLane(this.lanes, memory.pos, Math.max(maxOffset, 0));
      if (hit) {
        result.set(hit.path.lane, (result.get(hit.path.lane) ?? 0) + this.PowerOf(enemy));
      }
    }
    return result;
  }
}

export function UnitPower(unit: CDOTA_BaseNPC): number {
  if (!unit.IsAlive()) {
    return 0;
  }
  return combatPower({
    health: unit.GetHealth(),
    armor: unit.GetPhysicalArmorValue(false),
    attackDamage: unit.GetAverageTrueAttackDamage(undefined),
    attacksPerSecond: unit.GetAttacksPerSecond(false),
    level: unit.IsHero() ? unit.GetLevel() : 0,
    spellAmp: unit.IsHero() ? unit.GetSpellAmplification(false) : 0,
  });
}

function IsLaneCreep(creep: CDOTA_BaseNPC): boolean {
  const name = creep.GetUnitName();
  return (
    name.includes('creep_goodguys') || name.includes('creep_badguys') || name.includes('siege')
  );
}

const BUILDING_CLASSES = ['npc_dota_tower', 'npc_dota_barracks', 'npc_dota_fort'];

function CollectBuildings(): BuildingInfo[] {
  const result: BuildingInfo[] = [];
  for (const className of BUILDING_CLASSES) {
    for (const unit of Entities.FindAllByClassname(className) as CDOTA_BaseNPC[]) {
      if (unit.IsNull() || !unit.IsAlive()) {
        continue;
      }
      const name = unit.GetUnitName();
      const tier = BuildingTier(name);
      result.push({
        unit,
        lane: BuildingLane(name),
        tier,
        importance: tier,
        isBase: tier >= 4,
      });
    }
  }
  return result;
}

/** 外塔 1、二塔 2、高地塔 3、兵营 4、基地塔 5、基地 6，数值同时用作防守重要度。 */
function BuildingTier(name: string): number {
  if (name.includes('fort')) {
    return 6;
  }
  if (name.includes('tower4')) {
    return 5;
  }
  if (name.includes('rax')) {
    return 4;
  }
  if (name.includes('tower3')) {
    return 3;
  }
  if (name.includes('tower2')) {
    return 2;
  }
  return 1;
}

export function BuildingLane(name: string): Lane | undefined {
  if (name.includes('_top')) {
    return 'top';
  }
  if (name.includes('_mid')) {
    return 'mid';
  }
  if (name.includes('_bot')) {
    return 'bot';
  }
  return undefined;
}

/** 由开局时的防御塔拼出每路兵线，天辉高地塔在前、夜魇高地塔在后；基地放在两端让高地也能投影。 */
export function BuildLanePaths(): LanePath[] {
  const towers = Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[];
  const radiantFountain = HeroUtil.GetTeamFountainPosition(DotaTeam.GOODGUYS);
  const direFountain = HeroUtil.GetTeamFountainPosition(DotaTeam.BADGUYS);
  const paths: LanePath[] = [];
  for (const lane of ['top', 'mid', 'bot'] as const) {
    const laneTowers = towers.filter(
      (tower) => !tower.IsNull() && tower.IsAlive() && BuildingLane(tower.GetUnitName()) === lane,
    );
    if (laneTowers.length < 2) {
      continue;
    }
    const radiant = laneTowers
      .filter((tower) => tower.GetTeamNumber() === DotaTeam.GOODGUYS)
      .sort((a, b) => BuildingTier(b.GetUnitName()) - BuildingTier(a.GetUnitName()));
    const dire = laneTowers
      .filter((tower) => tower.GetTeamNumber() === DotaTeam.BADGUYS)
      .sort((a, b) => BuildingTier(a.GetUnitName()) - BuildingTier(b.GetUnitName()));
    const points: Point[] = [];
    if (radiantFountain) {
      points.push(radiantFountain);
    }
    for (const tower of radiant) {
      points.push(tower.GetAbsOrigin());
    }
    // 边路在地图角落拐弯，两座外塔直连会切掉拐角，拐角处的兵线就归不到这一路
    const radiantFront = radiant[radiant.length - 1];
    const direFront = dire[0];
    if (lane !== 'mid' && radiantFront && direFront) {
      const r = radiantFront.GetAbsOrigin();
      const d = direFront.GetAbsOrigin();
      points.push(lane === 'top' ? { x: r.x, y: d.y } : { x: d.x, y: r.y });
    }
    for (const tower of dire) {
      points.push(tower.GetAbsOrigin());
    }
    if (direFountain) {
      points.push(direFountain);
    }
    paths.push(buildLanePath(lane, points));
  }
  return paths;
}
