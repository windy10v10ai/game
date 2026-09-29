/**
 * 每队一个团队大脑：每秒按本队视野扫一次局面，给挂了 AI 的英雄分派任务。
 * 敌方英雄与小兵只认本队看得到的，建筑位置固定、始终可读。
 */
import { IS_DEBUG_RUN } from '../../modules/debug/perf-config';
import { AbilityRegistry } from '../ability/ability-registry';
import { TargetSide } from '../ability/ability-spec';
import { HeroUtil } from '../hero/hero-util';
import { ItemRegistry } from '../item/item-registry';
import { CachedBuildings, CachedTowers, TowerAttackRange } from './building-cache';
import { arcSlots, FORMATION_SPACING, lineSlots } from './formation';
import { shouldUseGlyph } from './glyph';
import {
  buildLanePath,
  distance,
  Lane,
  forwardProgress,
  laneEntry,
  LanePath,
  nearestLane,
  Point,
  pointAtProgress,
  progressFromForward,
  projectOnLane,
} from './lane-geometry';
import { resolvePushStaging } from './push-staging';
import { ControlSummons } from './summon-control';
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
  FIGHT_FOLLOW_RADIUS,
  FIGHT_JOIN_RADIUS,
  FIGHT_SUPPORT_RADIUS,
  FarmSpot,
  FightSpot,
  LanePlan,
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
// 去打架的人在目标这么远处排成扇形，从几个方向围上去
const FIGHT_ARC_RADIUS = 500;
// 回防时按这么近的敌人定朝向
const DEFEND_FACING_RADIUS = 3000;
// 被硬控的敌方英雄战力按这个比例算
const DISABLED_POWER_FACTOR = 0.5;
// 交战点在建筑射程外这么远以内也算建筑参战，英雄走几步就进射程
const FIGHT_TOWER_MARGIN = 300;
// 超过敌方最前面那座塔这么远，就算越过了还没推掉的塔
const FRONT_MARGIN = 400;
// 同一片野区的野怪合成一个发育点
const FARM_CAMP_RADIUS = 800;
// 集合点允许与交战点差不多深入，推塔的队友往往就站在交战点旁边
const RALLY_FORWARD_SLACK = 1000;
// 同一座建筑同时有人往上传会叠加引导时间，引导结束后再多留一会儿
const LANDING_RESERVE_EXTRA = 1;
// 预计到达比同一目标最晚的人早这么多以内就可以出发
const TELEPORT_ALIGN_SLACK = 1.5;
// 没有继续报告的等待者视为不再等，比团队大脑的思考间隔长一点
const TELEPORT_WAIT_EXPIRE = 1.5;
// 敌方英雄离基地建筑这么近就先派一个人去守，打起来再叫其他人
const BASE_WARNING_RADIUS = 2000;
// 小兵不会跑，推到基地这么近就提前回去清
const BASE_CREEP_RADIUS = 2500;
// 英雄会不会控制、能不能清兵随学技能和换装备变化，隔一会儿重算
const ROLE_CACHE_SECONDS = 10;
// 掉血速度按最近这么多秒算
const GLYPH_DAMAGE_WINDOW = 3;
// TP 落地后走到被打的建筑边上的秒数
const TELEPORT_LANDING_WALK = 1;
// 离复活还有这么久以上才值得买活
const BUYBACK_MIN_RESPAWN = 15;
// 活着的队友战力已经比来犯敌人高出这么多时，不必再买活回防
const BUYBACK_BASE_MARGIN = 1.2;
// 来犯敌人超过我方全队这么多倍时，买活也守不住
const BUYBACK_HOPELESS_RATIO = 3;
// 团战离泉水这么近时买活后走得过去，否则要有这么近的己方建筑可以 TP
const BUYBACK_WALK_RANGE = 5000;
const BUYBACK_TP_RANGE = 2000;

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

interface HeroRole {
  control: boolean;
  waveClear: boolean;
  until: number;
}

interface TeleportPlan {
  arrival: number;
  /** 已经开始引导，到达前一直算数；否则要持续报告 */
  committed: boolean;
  reported: number;
}

export class TeamBrain {
  private readonly enemyTeam: DotaTeam;
  private readonly members = new Map<EntityIndex, CDOTA_BaseNPC_Hero>();
  private readonly recoverRequests = new Set<EntityIndex>();
  private readonly engagedMembers = new Set<EntityIndex>();
  private readonly lastSeen = new Map<EntityIndex, EnemyMemory>();
  private visible = new Set<EntityIndex>();
  private readonly threats = new Map<EntityIndex, ThreatRecord>();
  private tasks = new Map<number, Task>();
  private plan: LanePlan | undefined;
  private readonly pushLanes = new Map<number, Lane>();
  private readonly landingReserved = new Map<EntityIndex, number>();
  private readonly teleports = new Map<number, Map<EntityIndex, TeleportPlan>>();
  private readonly roles = new Map<EntityIndex, HeroRole>();
  private readonly slots = new Map<number, Point>();
  private lastDefendKey = '';
  // 阵亡的 bot 没有当前战力，买活判断用它最后活着时的战力
  private readonly lastPower = new Map<EntityIndex, number>();
  private glyphReadyAt = 0;
  private readonly buildingHealth = new Map<EntityIndex, { time: number; health: number }[]>();
  private outerTowers = -1;
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

  /** 和同去一处的队友一起排开时，这个 bot 该站的位置；独自一人时没有。 */
  SlotOf(hero: CDOTA_BaseNPC_Hero): Point | undefined {
    return this.slots.get(hero.GetEntityIndex());
  }

  /** 英雄报告自己是否正在和敌方英雄交手，团队据此判断哪处交战已经打起来。 */
  SetEngaged(hero: CDOTA_BaseNPC_Hero, engaged: boolean): void {
    if (engaged) {
      this.engagedMembers.add(hero.GetEntityIndex());
    } else {
      this.engagedMembers.delete(hero.GetEntityIndex());
    }
  }

  SetNeedsRecover(hero: CDOTA_BaseNPC_Hero, needs: boolean): void {
    if (needs) {
      this.recoverRequests.add(hero.GetEntityIndex());
    } else {
      this.recoverRequests.delete(hero.GetEntityIndex());
    }
  }

  /** 可以 TP 过去、这会儿没人往上传的己方建筑。 */
  FindLandings(): CDOTA_BaseNPC[] {
    const now = GameRules.GetGameTime();
    return CachedBuildings().filter(
      (unit) =>
        unit.GetTeamNumber() === this.team &&
        (this.landingReserved.get(unit.GetEntityIndex()) ?? -Infinity) <= now,
    );
  }

  /** 同一目标里有人预计到得晚很多时先等一等，让大家差不多同时落地。 */
  ShouldWaitToTeleport(hero: CDOTA_BaseNPC_Hero, targetId: number, eta: number): boolean {
    const now = GameRules.GetGameTime();
    const plans = this.TeleportsFor(targetId, now);
    const arrival = now + eta;
    plans.set(hero.GetEntityIndex(), { arrival, committed: false, reported: now });
    let latest = arrival;
    for (const plan of plans.values()) {
      latest = Math.max(latest, plan.arrival);
    }
    return arrival < latest - TELEPORT_ALIGN_SLACK;
  }

  CommitTeleport(
    hero: CDOTA_BaseNPC_Hero,
    landing: CDOTA_BaseNPC,
    targetId: number | undefined,
    channel: number,
    eta: number,
  ): void {
    const now = GameRules.GetGameTime();
    this.landingReserved.set(landing.GetEntityIndex(), now + channel + LANDING_RESERVE_EXTRA);
    if (targetId !== undefined) {
      this.TeleportsFor(targetId, now).set(hero.GetEntityIndex(), {
        arrival: now + eta,
        committed: true,
        reported: now,
      });
    }
  }

  private TeleportsFor(targetId: number, now: number): Map<EntityIndex, TeleportPlan> {
    let plans = this.teleports.get(targetId);
    if (!plans) {
      plans = new Map();
      this.teleports.set(targetId, plans);
    }
    for (const [index, plan] of plans) {
      const alive = plan.committed
        ? now < plan.arrival
        : now - plan.reported < TELEPORT_WAIT_EXPIRE;
      if (!alive) {
        plans.delete(index);
      }
    }
    return plans;
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
    const defend = this.FindDefendTargets(buildings, recentEnemies);
    if (IS_DEBUG_RUN) {
      const key = defend.map((target) => `${target.id}:${target.stage}`).join(',');
      if (key !== this.lastDefendKey) {
        this.lastDefendKey = key;
        const text = defend
          .map((target) => `${target.id}:${target.stage}:${Math.floor(target.attackerPower)}`)
          .join(',');
        const time = Math.floor(GameRules.GetDOTATime(false, true));
        print(`[bot-ai] team=${this.team} t=${time} defend=${text === '' ? '-' : text}`);
      }
    }
    if (this.team === DotaTeam.BADGUYS) {
      this.UseGlyph(buildings, recentEnemies, now);
    }
    const lanePower = this.EnemyPowerByLane(enemies, now);
    // 推进目标同时决定了每路的前线，交战点要按前线判断，先算推进
    const lanes = this.FindPushLanes(buildings, lanePower);
    this.fights = this.BuildFights(recentEnemies, allies);

    const fountain = HeroUtil.GetTeamFountainPosition(this.team) ?? Vector(0, 0, 0);
    const bots = [...this.members.values()]
      .filter((hero) => hero.IsAlive())
      .map((hero) => ({
        id: hero.GetEntityIndex() as number,
        pos: hero.GetAbsOrigin(),
        power: UnitPower(hero),
        needsRecover: this.recoverRequests.has(hero.GetEntityIndex()),
        attackDps: hero.GetAverageTrueAttackDamage(undefined) * hero.GetAttacksPerSecond(false),
        pushLane: this.pushLanes.get(hero.GetEntityIndex()),
        ...this.RoleOf(hero, now),
      }));

    const result = planTasks({
      bots,
      fountain,
      defend,
      fights: this.fights,
      lanes,
      farms: this.FindFarmSpots(lanePower, observer),
      fighting: this.FightingTargets(),
      plan: this.plan,
      now,
      random: () => RandomFloat(0, 1),
    });
    this.tasks = result.tasks;
    this.AssignSlots(recentEnemies);
    if (IS_DEBUG_RUN && result.plan && result.plan !== this.plan) {
      const picks = result.plan.picks.map((pick) => pick.lane).join(',');
      const lanesNow = lanes.map((lane) => lane.lane).join(',');
      print(`[bot-ai] team=${this.team} lanes=${picks} pushable=${lanesNow}`);
    }
    this.plan = result.plan;
    for (const [id, task] of this.tasks) {
      if (task.kind === 'push' && task.lane) {
        this.pushLanes.set(id, task.lane);
      }
    }
    this.CountCommittedFighters();
    ControlSummons(this.team, [...this.members.values()]);
    this.ConsiderBuyback(defend, allies);
  }

  /** 阵亡的 bot 在基地危急、或附近团战买活后能扳回时买活；双方悬殊到买了也守不住就不买。 */
  private ConsiderBuyback(defend: DefendTarget[], allies: CDOTA_BaseNPC_Hero[]): void {
    // 买活的人算进战力，后面的人看到已经够了就不再买
    let alivePower = allies.reduce((sum, hero) => sum + UnitPower(hero), 0);
    const baseAttack = defend
      // 兵营起才算基地危急，高地塔失守不值得花钱买活
      .filter((target) => target.importance >= 4 && target.stage === 'engaged')
      .reduce((max, target) => Math.max(max, target.attackerPower), 0);
    for (const [index, hero] of this.members) {
      if (hero.IsAlive()) {
        this.lastPower.set(index, UnitPower(hero));
        continue;
      }
      if (
        hero.GetTimeUntilRespawn() < BUYBACK_MIN_RESPAWN ||
        hero.GetBuybackCooldownTime() > 0 ||
        hero.IsBuybackDisabledByDevilsBargain() ||
        PlayerResource.GetGold(hero.GetPlayerOwnerID()) < hero.GetBuybackCost()
      ) {
        continue;
      }
      const power = this.lastPower.get(index) ?? 0;
      const holdBase =
        baseAttack > 0 &&
        alivePower < baseAttack * BUYBACK_BASE_MARGIN &&
        baseAttack <= (alivePower + power) * BUYBACK_HOPELESS_RATIO;
      const turnFight = this.fights.find(
        (fight) =>
          fight.engaged &&
          fight.enemyPower > fight.ourPower &&
          fight.enemyPower <= fight.ourPower + power &&
          this.CanReachAfterBuyback(hero, fight.pos),
      );
      if (!holdBase && !turnFight) {
        continue;
      }
      hero.Buyback();
      alivePower += power;
      if (turnFight) {
        turnFight.ourPower += power;
      }
      print(`[bot-ai] ${HeroShortName(hero)} buyback base=${holdBase ? 1 : 0}`);
    }
  }

  private CanReachAfterBuyback(hero: CDOTA_BaseNPC_Hero, pos: Point): boolean {
    const fountain = HeroUtil.GetTeamFountainPosition(this.team);
    if (fountain && distance(fountain, pos) <= BUYBACK_WALK_RANGE) {
      return true;
    }
    const scroll = hero.FindItemInInventory('item_tpscroll');
    return (
      scroll !== undefined &&
      scroll.GetCooldownTimeRemaining() <= 0 &&
      this.FindLandings().some((unit) => distance(unit.GetAbsOrigin(), pos) <= BUYBACK_TP_RANGE)
    );
  }

  /** 开塔防：正被敌方英雄攻击的建筑照当前掉血速度快倒了才开，一塔倒掉后塔防刷新。 */
  private UseGlyph(
    buildings: BuildingInfo[],
    recentEnemies: CDOTA_BaseNPC_Hero[],
    now: number,
  ): void {
    const outer = buildings.filter(
      (building) => building.unit.GetTeamNumber() === this.team && building.tier === 1,
    ).length;
    if (outer < this.outerTowers) {
      this.glyphReadyAt = 0;
    }
    this.outerTowers = outer;
    // 冷却中也要记血量，冷却一好就能算出掉血速度
    const fallSeconds = new Map<EntityIndex, number>();
    for (const building of buildings) {
      const unit = building.unit;
      if (unit.GetTeamNumber() === this.team) {
        fallSeconds.set(unit.GetEntityIndex(), this.FallSeconds(unit, now));
      }
    }
    const caller = [...this.members.values()].find((hero) => hero.IsAlive());
    if (now < this.glyphReadyAt || !caller) {
      return;
    }
    for (const building of buildings) {
      const unit = building.unit;
      if (unit.GetTeamNumber() !== this.team || unit.IsInvulnerable()) {
        continue;
      }
      const attacked = recentEnemies.some(
        (enemy) => distance(unit.GetAbsOrigin(), this.PositionOf(enemy)) <= BUILDING_THREAT_RADIUS,
      );
      if (!attacked) {
        continue;
      }
      const hp = unit.GetHealth() / unit.GetMaxHealth();
      const glyph = shouldUseGlyph({
        tier: building.tier,
        hpRatio: hp,
        fallSeconds: fallSeconds.get(unit.GetEntityIndex()) ?? Infinity,
        defenderEta: this.DefenderEta(unit),
      });
      if (glyph) {
        ExecuteOrderFromTable({
          UnitIndex: caller.GetEntityIndex(),
          OrderType: UnitOrder.GLYPH,
          Queue: false,
        });
        this.glyphReadyAt = now + GameRules.GetGameModeEntity().GetCustomGlyphCooldown();
        print(`[bot-ai] glyph ${unit.GetUnitName()} hp=${Math.floor(hp * 100)}`);
        return;
      }
    }
  }

  /** 上一轮派去守这座建筑的人里，最快几秒能到；能 TP 的按引导时间算。 */
  private DefenderEta(building: CDOTA_BaseNPC): number {
    let best = Infinity;
    for (const [id, task] of this.tasks) {
      const hero = this.members.get(id as EntityIndex);
      if (task.kind !== 'defend' || task.targetId !== building.GetEntityIndex() || !hero) {
        continue;
      }
      if (!hero.IsAlive()) {
        continue;
      }
      let eta = hero.GetRangeToUnit(building) / Math.max(hero.GetIdealSpeed(), 1);
      const scroll = hero.FindItemInInventory('item_tpscroll');
      if (scroll !== undefined && scroll.IsFullyCastable()) {
        eta = Math.min(eta, scroll.GetChannelTime() + TELEPORT_LANDING_WALK);
      }
      best = Math.min(best, eta);
    }
    return best;
  }

  /** 按最近几秒的掉血速度，这座建筑还能撑几秒。 */
  private FallSeconds(unit: CDOTA_BaseNPC, now: number): number {
    const index = unit.GetEntityIndex();
    const health = unit.GetHealth();
    const samples = (this.buildingHealth.get(index) ?? []).filter(
      (sample) => now - sample.time <= GLYPH_DAMAGE_WINDOW,
    );
    samples.push({ time: now, health });
    this.buildingHealth.set(index, samples);
    const oldest = samples[0];
    const rate = (oldest.health - health) / Math.max(now - oldest.time, 1);
    return rate > 0 ? health / rate : Infinity;
  }

  /** 直线赶路会穿过敌方塔区时，在目的地所在那一路上找一个能直接走过去的入口，顺着兵线绕过去。 */
  LaneEntry(
    from: Point,
    destination: Point,
    blocked: (point: Point) => boolean,
  ): Point | undefined {
    const hit = nearestLane(this.lanes, destination, Infinity);
    if (!hit) {
      return undefined;
    }
    const isRadiant = this.team === DotaTeam.GOODGUYS;
    const maxForward = forwardProgress(hit.path, hit.projection.progress, isRadiant);
    return laneEntry(hit.path, from, maxForward, isRadiant, blocked);
  }

  /** 离英雄这么近的交战点里最近的一处，没被派去打的英雄据此判断要不要提前离开。 */
  NearestFight(hero: CDOTA_BaseNPC_Hero, radius: number): FightView | undefined {
    let best: FightView | undefined;
    let bestGap = radius;
    for (const fight of this.fights) {
      const gap = distance(hero.GetAbsOrigin(), fight.pos);
      if (gap <= bestGap) {
        best = fight;
        bestGap = gap;
      }
    }
    return best;
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
          (ally) =>
            ally.IsAlive() && distance(ally.GetAbsOrigin(), fight.pos) <= FIGHT_SUPPORT_RADIUS,
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
      // 被硬控的敌人这几秒还不了手，打折算让附近的 bot 抓住机会上
      const disabled = HeroUtil.NotActionable(enemy);
      enemyPower += this.PowerOf(enemy) * (disabled ? DISABLED_POWER_FACTOR : 1);
      if (disabled !== HeroUtil.NotActionable(focus)) {
        if (disabled) {
          focus = enemy;
        }
      } else if (enemy.GetHealth() < focus.GetHealth()) {
        focus = enemy;
      }
    }
    const pos = Vector(x, y, 0);
    const enemyTowerPower = BuildingPowerNear(this.enemyTeam, pos);
    enemyPower += enemyTowerPower;
    // 己方塔、兵营与基地也算我方战力，玩家上高地时 bot 守得更积极；玩家的建筑同样算进敌方
    let allyPower = BuildingPowerNear(this.team, pos);
    let ourPower = allyPower;
    let engaged = false;
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
        engaged = engaged || this.engagedMembers.has(ally.GetEntityIndex());
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
      withTower: enemyTowerPower > 0,
      pastFront: this.IsPastFront(pos),
      engaged,
    };
  }

  /** 同去一处的 bot 按队形分好站位：推进与回防横排朝敌人，打架在目标我方一侧排成扇形。 */
  private AssignSlots(recentEnemies: CDOTA_BaseNPC_Hero[]): void {
    this.slots.clear();
    const groups = new Map<string, { task: Task; heroes: CDOTA_BaseNPC_Hero[] }>();
    for (const [id, task] of this.tasks) {
      const hero = this.members.get(id as EntityIndex);
      if (!hero || (task.kind !== 'push' && task.kind !== 'defend' && task.kind !== 'fight')) {
        continue;
      }
      const key = `${task.kind}:${task.targetId ?? -1}:${Math.floor(task.pos.x)}:${Math.floor(task.pos.y)}`;
      const group = groups.get(key);
      if (group) {
        group.heroes.push(hero);
      } else {
        groups.set(key, { task, heroes: [hero] });
      }
    }
    for (const { task, heroes } of groups.values()) {
      if (heroes.length < 2) {
        continue;
      }
      const members = heroes.map((hero) => ({
        id: hero.GetEntityIndex() as number,
        pos: hero.GetAbsOrigin(),
        melee: !hero.IsRangedAttacker(),
      }));
      const facing = this.FacingOf(task, members, recentEnemies);
      const slots =
        task.kind === 'fight'
          ? arcSlots(task.pos, facing, members, FIGHT_ARC_RADIUS, FORMATION_SPACING)
          : lineSlots(task.pos, facing, members, FORMATION_SPACING);
      for (const [id, slot] of slots) {
        // 站位落在树林、悬崖里时站回集合点本身，靠英雄层的让位散开
        this.slots.set(id, GridNav.IsTraversable(Vector(slot.x, slot.y, 0)) ? slot : task.pos);
      }
    }
  }

  /** 队形的朝向（单位向量）：推进朝目标建筑，回防朝最近的来犯敌人，打架朝我方来的方向。 */
  private FacingOf(
    task: Task,
    members: { pos: Point }[],
    recentEnemies: CDOTA_BaseNPC_Hero[],
  ): Point {
    const anchor = task.pos;
    let toward: Point | undefined;
    if (task.kind === 'fight') {
      const x = members.reduce((sum, member) => sum + member.pos.x, 0) / members.length;
      const y = members.reduce((sum, member) => sum + member.pos.y, 0) / members.length;
      toward = { x, y };
    } else if (task.kind === 'push' && task.targetId !== undefined) {
      const building = EntIndexToHScript(task.targetId as EntityIndex) as CDOTA_BaseNPC | undefined;
      toward = building && IsValidEntity(building) ? building.GetAbsOrigin() : undefined;
    } else if (task.kind === 'defend') {
      let best = DEFEND_FACING_RADIUS;
      for (const enemy of recentEnemies) {
        const gap = distance(this.PositionOf(enemy), anchor);
        if (gap < best) {
          best = gap;
          toward = this.PositionOf(enemy);
        }
      }
    }
    if (toward === undefined) {
      // 没有明确的敌人方向时背对自家泉水，敌人多从这一侧来
      const fountain = HeroUtil.GetTeamFountainPosition(this.team);
      toward = fountain
        ? { x: 2 * anchor.x - fountain.x, y: 2 * anchor.y - fountain.y }
        : { x: anchor.x + 1, y: anchor.y };
    }
    const dx = toward.x - anchor.x;
    const dy = toward.y - anchor.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return length > 1 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  }

  private FightingTargets(): Map<number, number> {
    const fighting = new Map<number, number>();
    for (const [id, task] of this.tasks) {
      if (task.kind === 'fight' && task.targetId !== undefined) {
        fighting.set(id, task.targetId);
      }
    }
    return fighting;
  }

  /** 被派来打或回防、快要赶到的 bot 也算进这处交战点的我方战力，队友之间判断一致；还远的不算，免得先到的人以为有援军硬上。 */
  private CountCommittedFighters(): void {
    for (const fight of this.fights) {
      for (const [id, task] of this.tasks) {
        const bot = this.members.get(id as EntityIndex);
        if (
          !bot ||
          (task.kind !== 'fight' && task.kind !== 'defend') ||
          (task.kind === 'fight' && task.targetId !== fight.focusId) ||
          distance(bot.GetAbsOrigin(), fight.pos) <= FIGHT_DANGER_RADIUS ||
          distance(bot.GetAbsOrigin(), fight.pos) > FIGHT_FOLLOW_RADIUS
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
    for (const tower of CachedTowers()) {
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

  private PruneMembers(): void {
    for (const [index, hero] of this.members) {
      if (!IsValidEntity(hero)) {
        this.members.delete(index);
        this.pushLanes.delete(index);
        this.recoverRequests.delete(index);
        this.engagedMembers.delete(index);
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

  /**
   * 敌方英雄贴着任一建筑算已经打起来；离基地建筑近但还没动手算预警；基地附近只有小兵时按小兵派人清。
   * 预警与小兵各自归到离它最近的基地建筑，同一拨人不在几座建筑上重复派人。
   */
  private FindDefendTargets(
    buildings: BuildingInfo[],
    recentEnemies: CDOTA_BaseNPC_Hero[],
  ): DefendTarget[] {
    const own = buildings.filter(
      (building) => building.unit.GetTeamNumber() === this.team && !building.unit.IsInvulnerable(),
    );
    const targets: DefendTarget[] = [];
    const engagedIds = new Set<EntityIndex>();
    const engagedEnemies = new Set<CDOTA_BaseNPC_Hero>();
    for (const building of own) {
      const attackers = recentEnemies.filter(
        (enemy) =>
          distance(building.unit.GetAbsOrigin(), this.PositionOf(enemy)) <= BUILDING_THREAT_RADIUS,
      );
      if (attackers.length === 0) {
        continue;
      }
      attackers.forEach((enemy) => engagedEnemies.add(enemy));
      engagedIds.add(building.unit.GetEntityIndex());
      targets.push(
        this.DefendTargetOf(
          building,
          'engaged',
          attackers.reduce((sum, enemy) => sum + this.PowerOf(enemy), 0),
        ),
      );
    }

    const base = own.filter((building) => building.isBase);
    const warning = new Map<BuildingInfo, number>();
    for (const enemy of recentEnemies) {
      if (engagedEnemies.has(enemy)) {
        continue;
      }
      const near = NearestBuilding(base, this.PositionOf(enemy), BASE_WARNING_RADIUS);
      if (near) {
        warning.set(near, (warning.get(near) ?? 0) + this.PowerOf(enemy));
      }
    }
    for (const [building, power] of warning) {
      targets.push(this.DefendTargetOf(building, 'warning', power));
    }

    const creeps = new Map<BuildingInfo, number>();
    const center = base.find((building) => building.tier === 6) ?? base[0];
    if (center !== undefined) {
      // 以基地为圆心搜一次盖住所有基地建筑的范围，高地兵多时不会被几座建筑重复搜到
      const origin = center.unit.GetAbsOrigin();
      const reach = base.reduce(
        (max, building) => Math.max(max, distance(building.unit.GetAbsOrigin(), origin)),
        0,
      );
      const units = FindUnitsInRadius(
        this.team,
        origin,
        undefined,
        reach + BASE_CREEP_RADIUS,
        UnitTargetTeam.ENEMY,
        UnitTargetType.BASIC,
        UnitTargetFlags.FOW_VISIBLE + UnitTargetFlags.NO_INVIS,
        FindOrder.ANY,
        false,
      );
      for (const creep of units) {
        if (!creep.IsCreep() || creep.IsNeutralUnitType()) {
          continue;
        }
        const near = NearestBuilding(base, creep.GetAbsOrigin(), BASE_CREEP_RADIUS);
        if (near) {
          creeps.set(near, (creeps.get(near) ?? 0) + UnitPower(creep));
        }
      }
    }
    for (const [building, power] of creeps) {
      if (!engagedIds.has(building.unit.GetEntityIndex())) {
        targets.push(this.DefendTargetOf(building, 'creeps', power));
      }
    }
    return targets;
  }

  private DefendTargetOf(
    building: BuildingInfo,
    stage: DefendTarget['stage'],
    attackerPower: number,
  ): DefendTarget {
    const unit = building.unit;
    return {
      id: unit.GetEntityIndex(),
      pos: unit.GetAbsOrigin(),
      stage,
      isBase: building.isBase,
      core: building.tier >= 5,
      importance: building.importance,
      hpRatio: unit.GetHealth() / unit.GetMaxHealth(),
      attackerPower,
    };
  }

  /** 会不会控制、能不能范围清兵，都以施法规则为准：跳过已被控目标的算控制，对小兵放的算清兵。 */
  private RoleOf(hero: CDOTA_BaseNPC_Hero, now: number): { control: boolean; waveClear: boolean } {
    const index = hero.GetEntityIndex();
    const cached = this.roles.get(index);
    if (cached && now < cached.until) {
      return cached;
    }
    let control = false;
    let waveClear = false;
    for (let i = 0; i < hero.GetAbilityCount(); i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (!ability || ability.GetLevel() <= 0) {
        continue;
      }
      for (const spec of AbilityRegistry.get(ability.GetAbilityName()) ?? []) {
        control = control || spec.condition?.target?.unitCondition?.notActionable === true;
        waveClear = waveClear || spec.targetSide === TargetSide.EnemyCreep;
      }
    }
    for (let slot = InventorySlot.SLOT_1; slot <= InventorySlot.SLOT_6; slot++) {
      const item = hero.GetItemInSlot(slot);
      if (!item) {
        continue;
      }
      for (const spec of ItemRegistry.get(item.GetAbilityName()) ?? []) {
        control = control || spec.condition?.target?.unitCondition?.notActionable === true;
      }
    }
    const role = { control, waveClear, until: now + ROLE_CACHE_SECONDS };
    this.roles.set(index, role);
    return role;
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
      // 这一路没有己方小兵时不去推，一个人站在塔前等只会被抓
      if (front === undefined) {
        continue;
      }
      const staging = resolvePushStaging(
        front,
        targetForward,
        target.unit.HasModifier('modifier_backdoor_protection_active'),
      );
      let stagingPos: Point = target.unit.GetAbsOrigin();
      if (!staging.waveAtTarget) {
        stagingPos = pointAtProgress(
          path,
          progressFromForward(path, staging.stagingForward, isRadiant),
        );
      }
      lanes.push({
        lane: path.lane,
        targetId: target.unit.GetEntityIndex(),
        stagingPos: Vector(stagingPos.x, stagingPos.y, 0),
        targetHpRatio: target.unit.GetHealth() / target.unit.GetMaxHealth(),
        waveAtTarget: staging.waveAtTarget,
        enemyPower: lanePower.get(path.lane) ?? 0,
        towerPower: UnitPower(target.unit),
      });
    }
    return lanes;
  }

  /**
   * 推不动塔时的发育点：离自己近的野怪营地（两边野区都算），以及没有敌方英雄的路上看得到的敌方兵线。
   * 野怪营地位置固定、玩家都知道，按位置直接读，不要求视野。
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
      UnitTargetFlags.NONE,
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
      const ancient = unit.IsAncient();
      if (spot) {
        spot.ancient = spot.ancient || ancient;
      } else {
        spots.push({ pos, ancient });
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

function CollectBuildings(): BuildingInfo[] {
  return CachedBuildings().map((unit) => {
    const name = unit.GetUnitName();
    const tier = BuildingTier(name);
    // 高地塔起打不过也要派人守
    return { unit, lane: BuildingLane(name), tier, importance: tier, isBase: tier >= 3 };
  });
}

/** 射程能盖到这个位置的一方建筑的战力之和，几座挨着的高地建筑一起算。 */
function BuildingPowerNear(team: DotaTeam, pos: Point): number {
  let power = 0;
  for (const unit of CachedBuildings()) {
    if (
      unit.GetTeamNumber() === team &&
      unit.HasAttackCapability() &&
      distance(unit.GetAbsOrigin(), pos) <= TowerAttackRange(unit) + FIGHT_TOWER_MARGIN
    ) {
      power += UnitPower(unit);
    }
  }
  return power;
}

function NearestBuilding(
  buildings: BuildingInfo[],
  pos: Point,
  radius: number,
): BuildingInfo | undefined {
  let best: BuildingInfo | undefined;
  let bestDistance = radius;
  for (const building of buildings) {
    const gap = distance(building.unit.GetAbsOrigin(), pos);
    if (gap <= bestDistance) {
      best = building;
      bestDistance = gap;
    }
  }
  return best;
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
