/**
 * 每队一个团队大脑：每秒按本队视野扫一次局面，给挂了 AI 的英雄分派任务。
 * 敌方英雄与小兵只认本队看得到的，建筑位置固定、始终可读。
 */
import { HeroUtil } from '../hero/hero-util';
import {
  buildLanePath,
  distance,
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
import {
  DefendTarget,
  FIGHT_DANGER_RADIUS,
  FIGHT_JOIN_RADIUS,
  FarmSpot,
  FightSpot,
  planTasks,
  PushLane,
  Task,
} from './team-plan';

// 看不到之后，前 5 秒按原位置用，15 秒内按移速扩大可能范围，再往后只记得这个英雄存在
const LAST_SEEN_EXACT = 5;
const LAST_SEEN_FORGET = 15;
// 交战与防守记住刚消失的敌人这么久：追人追到消失的位置，逃跑也不因敌人一消失就掉头
const FIGHT_MEMORY = 3;
// 与团队大脑的思考间隔一致
const POWER_CACHE_SECONDS = 1;
const LANE_MAX_OFFSET = 2000;
const LANE_CREEP_MAX_OFFSET = 1200;
const BUILDING_THREAT_RADIUS = 1200;
// 彼此在这个距离内的敌方英雄算同一处交战点
const FIGHT_CLUSTER_RADIUS = 1200;
// 敌人离自家塔这么近时，塔也算进对面的战力
const FIGHT_TOWER_RADIUS = 900;
// 超过敌方最前面那座塔这么远，就算越过了还没推掉的塔
const FRONT_MARGIN = 400;
// 同一片野区的野怪合成一个发育点
const FARM_CAMP_RADIUS = 800;
// 集合点允许与交战点差不多深入，推塔的队友往往就站在交战点旁边
const RALLY_FORWARD_SLACK = 1000;
// 兵线进到目标建筑这个距离内，才算可以开始推塔
const WAVE_AT_TARGET_DISTANCE = 900;
// 兵线没到时在塔攻击范围外等
const WAIT_OUTSIDE_TOWER = 1100;
// 兵线在 bot 赶路途中还会往前走，落脚点放在兵线前沿再往前一段
const STAGING_AHEAD = 800;

export interface EnemyMemory {
  pos: Vector;
  time: number;
}

/** 一处交战点的完整判断依据，团队分派与英雄交战判断共用。 */
export interface FightView extends FightSpot {
  enemyIds: EntityIndex[];
  enemyNames: string[];
  /** 已在交战范围内的友方英雄，加上被派来这里打的 bot */
  ourPower: number;
  ourNames: string[];
  withTower: boolean;
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
  private visible = new Set<EntityIndex>();
  private readonly threats = new Map<EntityIndex, ThreatRecord>();
  private tasks = new Map<number, Task>();
  private mainLane: Lane | undefined;
  private fights: FightView[] = [];
  // 每路敌方最前面还没推掉的建筑，按己方视角的前进距离记
  private readonly fronts = new Map<Lane, number>();

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
    this.visible = new Set<EntityIndex>();
    const recentEnemies: CDOTA_BaseNPC_Hero[] = [];
    for (const enemy of enemies) {
      if (!enemy.IsAlive()) {
        continue;
      }
      const index = enemy.GetEntityIndex();
      if (observer && observer.CanEntityBeSeenByMyTeam(enemy)) {
        this.visible.add(index);
        this.lastSeen.set(index, { pos: enemy.GetAbsOrigin(), time: now });
      }
      const memory = this.lastSeen.get(index);
      if (memory && now - memory.time <= FIGHT_MEMORY) {
        recentEnemies.push(enemy);
      }
    }
    if (!assign || this.members.size === 0) {
      this.tasks.clear();
      this.fights = [];
      return;
    }
    const buildings = CollectBuildings();
    const lanePower = this.EnemyPowerByLane(enemies, now);
    // 推进目标同时决定了每路的前线，交战点要按前线判断，先算推进
    const lanes = this.FindPushLanes(buildings, lanePower);
    this.fights = this.BuildFights(recentEnemies, allies);

    const ourPower = allies.reduce((sum, hero) => sum + UnitPower(hero), 0);
    const enemyPower = enemies.reduce((sum, hero) => sum + this.PowerOf(hero), 0);
    const fountain = HeroUtil.GetTeamFountainPosition(this.team) ?? Vector(0, 0, 0);
    const bots = [...this.members.values()]
      .filter((hero) => hero.IsAlive())
      .map((hero) => ({
        id: hero.GetEntityIndex() as number,
        pos: hero.GetAbsOrigin(),
        power: UnitPower(hero),
        needsRecover: this.recoverRequests.has(hero.GetEntityIndex()),
        attackDps: hero.GetAverageTrueAttackDamage(undefined) * hero.GetAttacksPerSecond(false),
        previous: this.tasks.get(hero.GetEntityIndex()),
      }));

    const result = planTasks({
      bots,
      fountain,
      defend: this.FindDefendTargets(buildings, recentEnemies),
      fights: this.fights,
      lanes,
      farms: this.FindFarmSpots(lanePower, observer),
      ourPower,
      enemyPower,
      mainLane: this.mainLane,
    });
    this.tasks = result.tasks;
    this.mainLane = result.mainLane;
    this.CountCommittedFighters();
  }

  /** 英雄看到敌人时取所在交战点的判断依据；这一秒刚出现的交战点按同一口径现算。 */
  AssessFight(hero: CDOTA_BaseNPC_Hero, enemies: CDOTA_BaseNPC[]): FightView {
    for (const fight of this.fights) {
      if (enemies.some((enemy) => fight.enemyIds.includes(enemy.GetEntityIndex()))) {
        return fight;
      }
    }
    const allies = HeroList.GetAllHeroes().filter(
      (ally) => IsValidEntity(ally) && ally.IsRealHero() && ally.GetTeamNumber() === this.team,
    );
    return this.BuildFight(enemies, allies);
  }

  private BuildFights(enemies: CDOTA_BaseNPC[], allies: CDOTA_BaseNPC_Hero[]): FightView[] {
    const fights: FightView[] = [];
    const used = new Set<EntityIndex>();
    for (const enemy of enemies) {
      if (used.has(enemy.GetEntityIndex())) {
        continue;
      }
      const group = enemies.filter(
        (other) =>
          !used.has(other.GetEntityIndex()) &&
          distance(this.PositionOf(enemy), this.PositionOf(other)) <= FIGHT_CLUSTER_RADIUS,
      );
      for (const member of group) {
        used.add(member.GetEntityIndex());
      }
      // 离我方英雄都很远的敌人不构成交战点
      const fight = this.BuildFight(group, allies);
      if (
        allies.some(
          (ally) => ally.IsAlive() && distance(ally.GetAbsOrigin(), fight.pos) <= FIGHT_JOIN_RADIUS,
        )
      ) {
        fights.push(fight);
      }
    }
    return fights;
  }

  private BuildFight(enemies: CDOTA_BaseNPC[], allies: CDOTA_BaseNPC_Hero[]): FightView {
    let x = 0;
    let y = 0;
    let enemyPower = 0;
    let focus = enemies[0];
    for (const enemy of enemies) {
      const pos = this.PositionOf(enemy);
      x += pos.x / enemies.length;
      y += pos.y / enemies.length;
      enemyPower += this.PowerOf(enemy);
      if (enemy.GetHealth() < focus.GetHealth()) {
        focus = enemy;
      }
    }
    const pos = Vector(x, y, 0);
    const tower = this.FindTowerNear(this.enemyTeam, pos, FIGHT_TOWER_RADIUS);
    if (tower) {
      enemyPower += UnitPower(tower);
    }
    let allyPower = 0;
    let ourPower = 0;
    const ourNames: string[] = [];
    for (const ally of allies) {
      if (!ally.IsAlive()) {
        continue;
      }
      const gap = distance(ally.GetAbsOrigin(), pos);
      if (!this.members.has(ally.GetEntityIndex()) && gap <= FIGHT_JOIN_RADIUS) {
        allyPower += UnitPower(ally);
      }
      if (gap <= FIGHT_DANGER_RADIUS) {
        ourPower += UnitPower(ally);
        ourNames.push(HeroShortName(ally));
      }
    }
    return {
      pos,
      enemyPower,
      allyPower,
      focusId: focus.GetEntityIndex(),
      rally: this.FindRally(pos),
      enemyIds: enemies.map((enemy) => enemy.GetEntityIndex()),
      enemyNames: enemies.map(HeroShortName),
      ourPower,
      ourNames,
      withTower: tower !== undefined,
      pastFront: this.IsPastFront(pos),
    };
  }

  /** 被派来打的 bot 还在路上时也算进这处交战点的我方战力，队友之间判断一致。 */
  private CountCommittedFighters(): void {
    for (const fight of this.fights) {
      for (const [id, task] of this.tasks) {
        const bot = this.members.get(id as EntityIndex);
        if (
          !bot ||
          task.kind !== 'fight' ||
          task.targetId !== fight.focusId ||
          distance(bot.GetAbsOrigin(), fight.pos) <= FIGHT_DANGER_RADIUS
        ) {
          continue;
        }
        fight.ourPower += UnitPower(bot);
        fight.ourNames.push(HeroShortName(bot));
      }
    }
  }

  /** 集合点：交战范围外、不比交战点更深入敌方的最近 bot 或己方塔，都没有就回泉水。 */
  private FindRally(pos: Vector): Vector {
    const fountain = HeroUtil.GetTeamFountainPosition(this.team) ?? pos;
    const depth = distance(pos, fountain) + RALLY_FORWARD_SLACK;
    const candidates: CDOTA_BaseNPC[] = [...this.members.values()];
    for (const tower of Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[]) {
      if (tower.GetTeamNumber() === this.team) {
        candidates.push(tower);
      }
    }
    let best: Vector | undefined;
    let bestDistance = Infinity;
    for (const unit of candidates) {
      if (!IsValidEntity(unit) || !unit.IsAlive()) {
        continue;
      }
      const gap = distance(unit.GetAbsOrigin(), pos);
      if (
        gap > FIGHT_DANGER_RADIUS &&
        gap < bestDistance &&
        distance(unit.GetAbsOrigin(), fountain) <= depth
      ) {
        best = unit.GetAbsOrigin();
        bestDistance = gap;
      }
    }
    return best ?? fountain;
  }

  private FindTowerNear(team: DotaTeam, pos: Vector, radius: number): CDOTA_BaseNPC | undefined {
    for (const tower of Entities.FindAllByClassname('npc_dota_tower') as CDOTA_BaseNPC[]) {
      if (
        !tower.IsNull() &&
        tower.IsAlive() &&
        tower.GetTeamNumber() === team &&
        distance(tower.GetAbsOrigin(), pos) <= radius
      ) {
        return tower;
      }
    }
    return undefined;
  }

  private PruneMembers(): void {
    for (const [index, hero] of this.members) {
      if (!IsValidEntity(hero)) {
        this.members.delete(index);
        this.recoverRequests.delete(index);
      }
    }
  }

  /** 看得见的敌人取当前位置；看不见的只用最后看到的位置，不读真实位置。 */
  private PositionOf(enemy: CDOTA_BaseNPC): Vector {
    const memory = this.lastSeen.get(enemy.GetEntityIndex());
    if (memory && !this.visible.has(enemy.GetEntityIndex())) {
      return memory.pos;
    }
    return enemy.GetAbsOrigin();
  }

  /** 最近一次看到的位置，太久没看到时返回 undefined。 */
  RecallEnemy(index: EntityIndex): EnemyMemory | undefined {
    const memory = this.lastSeen.get(index);
    if (!memory || GameRules.GetGameTime() - memory.time > LAST_SEEN_FORGET) {
      return undefined;
    }
    return memory;
  }

  private FindDefendTargets(
    buildings: BuildingInfo[],
    recentEnemies: CDOTA_BaseNPC_Hero[],
  ): DefendTarget[] {
    const targets: DefendTarget[] = [];
    for (const building of buildings) {
      const unit = building.unit;
      if (unit.GetTeamNumber() !== this.team || unit.IsInvulnerable()) {
        continue;
      }
      let attackerPower = 0;
      for (const enemy of recentEnemies) {
        if (distance(unit.GetAbsOrigin(), this.PositionOf(enemy)) <= BUILDING_THREAT_RADIUS) {
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

  /** 这个位置是否在某一路敌方还没推掉的塔后面，bot 不越过它追人或打架。 */
  IsPastFront(pos: Point): boolean {
    const hit = nearestLane(this.lanes, pos, Infinity);
    if (!hit) {
      return false;
    }
    const front = this.fronts.get(hit.path.lane) ?? Infinity;
    const forward = forwardProgress(
      hit.path,
      hit.projection.progress,
      this.team === DotaTeam.GOODGUYS,
    );
    return forward > front + FRONT_MARGIN;
  }

  private FindPushLanes(buildings: BuildingInfo[], lanePower: Map<Lane, number>): PushLane[] {
    const isRadiant = this.team === DotaTeam.GOODGUYS;
    const enemyTargets = buildings.filter(
      (building) =>
        building.unit.GetTeamNumber() === this.enemyTeam && !building.unit.IsInvulnerable(),
    );
    this.fronts.clear();
    if (enemyTargets.length === 0) {
      return [];
    }
    const creepFront = this.FindCreepFronts(isRadiant);
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
      this.fronts.set(path.lane, targetForward);
      const front = creepFront.get(path.lane);
      const waveAtTarget = front !== undefined && front >= targetForward - WAVE_AT_TARGET_DISTANCE;
      let stagingPos: Point = target.unit.GetAbsOrigin();
      if (!waveAtTarget) {
        const waitForward =
          front === undefined
            ? targetForward - WAIT_OUTSIDE_TOWER
            : Math.min(front + STAGING_AHEAD, targetForward - WAIT_OUTSIDE_TOWER);
        stagingPos = pointAtProgress(path, progressFromForward(path, waitForward, isRadiant));
      }
      lanes.push({
        lane: path.lane,
        targetId: target.unit.GetEntityIndex(),
        stagingPos: Vector(stagingPos.x, stagingPos.y, 0),
        targetHpRatio: target.unit.GetHealth() / target.unit.GetMaxHealth(),
        waveAtTarget,
        enemyPower: lanePower.get(path.lane) ?? 0,
        towerPower: UnitPower(target.unit),
      });
    }
    return lanes;
  }

  /**
   * 推不动塔时的发育点：离自己近的野怪营地（两边野区都算），以及没有敌方英雄的路上看得到的敌方兵线。
   * 野怪营地位置固定、玩家都知道，按位置直接读，不要求视野；远古野打不过，不算。
   */
  private FindFarmSpots(lanePower: Map<Lane, number>, observer: CDOTA_BaseNPC): FarmSpot[] {
    const spots: FarmSpot[] = [];
    const units = FindUnitsInRadius(
      this.team,
      Vector(0, 0, 0),
      undefined,
      FIND_UNITS_EVERYWHERE,
      UnitTargetTeam.ENEMY,
      UnitTargetType.CREEP,
      UnitTargetFlags.NOT_ANCIENTS,
      FindOrder.ANY,
      false,
    );
    for (const unit of units) {
      const pos = unit.GetAbsOrigin();
      if (unit.GetTeamNumber() !== DotaTeam.NEUTRALS) {
        if (!IsLaneCreep(unit) || !observer.CanEntityBeSeenByMyTeam(unit)) {
          continue;
        }
        const hit = nearestLane(this.lanes, pos, LANE_CREEP_MAX_OFFSET);
        if (!hit || (lanePower.get(hit.path.lane) ?? 0) > 0 || this.IsPastFront(pos)) {
          continue;
        }
      }
      const spot = spots.find((other) => distance(other.pos, pos) <= FARM_CAMP_RADIUS);
      if (spot) {
        spot.power += UnitPower(unit);
      } else {
        spots.push({ pos, power: UnitPower(unit) });
      }
    }
    return spots;
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

export function HeroShortName(unit: CDOTA_BaseNPC): string {
  return unit.GetUnitName().replace('npc_dota_hero_', '');
}

const powerCache = new Map<EntityIndex, number>();
let powerCacheTime = -Infinity;

/** 单位战力。两队的团队大脑与所有英雄共用一份，每秒每个单位只算一次。 */
export function UnitPower(unit: CDOTA_BaseNPC): number {
  const now = GameRules.GetGameTime();
  if (now - powerCacheTime >= POWER_CACHE_SECONDS) {
    powerCache.clear();
    powerCacheTime = now;
  }
  const index = unit.GetEntityIndex();
  const cached = powerCache.get(index);
  if (cached !== undefined) {
    return cached;
  }
  const power = ComputePower(unit);
  powerCache.set(index, power);
  return power;
}

function ComputePower(unit: CDOTA_BaseNPC): number {
  if (!unit.IsAlive()) {
    return 0;
  }
  const isHero = unit.IsHero();
  return combatPower({
    health: unit.GetHealth(),
    armor: unit.GetPhysicalArmorValue(false),
    // 引擎允许不传伤害来源，类型声明把它标成了必填
    magicResist: unit.Script_GetMagicalArmorValue(undefined as unknown as object),
    attackDamage: unit.GetAverageTrueAttackDamage(undefined),
    attacksPerSecond: unit.GetAttacksPerSecond(false),
    level: isHero ? unit.GetLevel() : 0,
    spellAmp: isHero ? unit.GetSpellAmplification(false) : 0,
    spellReady: isHero ? SpellReadiness(unit) : 1,
  });
}

/** 已学的主动技能与身上的主动物品里，现在能放的比例；不区分技能强弱。 */
function SpellReadiness(unit: CDOTA_BaseNPC): number {
  if (HeroUtil.NotActionable(unit)) {
    return 0;
  }
  let total = 0;
  let ready = 0;
  for (let i = 0; i < unit.GetAbilityCount(); i++) {
    const ability = unit.GetAbilityByIndex(i);
    if (!ability || ability.GetLevel() < 1 || ability.IsHidden() || ability.IsPassive()) {
      continue;
    }
    total++;
    if (ability.IsFullyCastable()) {
      ready++;
    }
  }
  for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
    const item = unit.GetItemInSlot(slot);
    if (!item || item.IsPassive()) {
      continue;
    }
    total++;
    if (item.IsFullyCastable()) {
      ready++;
    }
  }
  return total === 0 ? 1 : ready / total;
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
