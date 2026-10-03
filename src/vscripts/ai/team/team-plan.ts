/** 团队任务分派：按回复 → 建筑被打的回防 → 交战 → 清兵与盯人的回防 → 肉山 → 推进 → 发育的顺序把每个 bot 分到一个带目的地的任务。 */
import { distance, Lane, Point } from './lane-geometry';
import { Activity } from './activity';
import { ANCIENT_FARM_POWER, AVOID_POWER_RATIO, KEEP_FIGHTING_RATIO } from './power';

export type TaskKind = 'recover' | 'defend' | 'fight' | 'roshan' | 'push' | 'farm' | 'hold';

export interface Task {
  kind: TaskKind;
  pos: Point;
  /** 防守的建筑、集火的敌方英雄或推进的目标建筑 */
  targetId?: number;
  lane?: Lane;
  /** 守基地，打不过也不撤 */
  hold?: boolean;
}

export interface PlanBot {
  id: number;
  pos: Point;
  power: number;
  needsRecover: boolean;
  /** 普攻输出，高的留下推塔，其余优先去打架 */
  attackDps: number;
  /** 最近一次被分去推进的那一路，临时去防守或打架后回到这一路 */
  pushLane?: Lane;
  /** 学会了控制技能或带着控制装备，敌人靠近基地时先派它去守 */
  control?: boolean;
  /** 学会了对小兵的范围技能 */
  waveClear?: boolean;
  /** 传送卷轴能用 */
  teleportReady?: boolean;
}

/**
 * engaged：敌方英雄已经贴着建筑；warning：敌方英雄正往基地来，还没动手；creeps：只有小兵推到基地。
 */
export type DefendStage = 'engaged' | 'warning' | 'creeps';

export interface DefendTarget {
  id: number;
  pos: Point;
  stage: DefendStage;
  /** 高地与基地：打不过也派人守，不像外塔那样放弃 */
  isBase: boolean;
  /** 基地塔与基地：派去的人守到快被打死才走 */
  core: boolean;
  importance: number;
  hpRatio: number;
  /** 来犯敌方英雄的战力；creeps 阶段为这波小兵扣掉附近己方建筑后剩下的战力，不大于 0 表示建筑守得住 */
  attackerPower: number;
}

/** 一处交战点：一团看得到的敌方英雄，以及附近的我方情况。 */
export interface FightSpot {
  pos: Point;
  /** 敌方英雄战力，敌人在自家塔下时含塔 */
  enemyPower: number;
  /** 附近不归团队调度的友方英雄（玩家）战力 */
  allyPower: number;
  /** 集火目标：这一团里血最少的敌方英雄 */
  focusId: number;
  /** 打不过时往哪撤 */
  rally: Point;
  /** 在敌方还没推掉的塔后面，不派人去打 */
  pastFront: boolean;
  /** 敌人躲在塔下，越塔时塔会先打死我方的人，不派人去打 */
  towerSafe?: boolean;
  /** 附近已经有 bot 和敌方英雄交上手 */
  engaged: boolean;
}

/** 一处发育点：一个野怪营地或一段没人守的兵线。 */
export interface FarmSpot {
  pos: Point;
  ancient: boolean;
}

export interface PushLane {
  lane: Lane;
  targetId: number;
  /** 本轮推进的落脚点：兵线前沿，或兵线没到时的塔外等待点 */
  stagingPos: Point;
  targetHpRatio: number;
  waveAtTarget: boolean;
  /** 最近出现在这一路的敌方英雄战力 */
  enemyPower: number;
  /** 目标建筑自身的战力，不会攻击的建筑为 0 */
  towerPower: number;
  /** 目标是高地塔、兵营或基地 */
  highGround?: boolean;
}

export interface RoshanInfo {
  id: number;
  pos: Point;
  power: number;
  /** 这只肉山刷出来多久了 */
  aliveSeconds: number;
  /** 这只肉山留给玩家的时间，每只随机 */
  waitSeconds: number;
}

export interface PlanInput {
  bots: PlanBot[];
  fountain: Point;
  defend: DefendTarget[];
  fights: FightSpot[];
  lanes: PushLane[];
  /** 推不动塔时去的发育点 */
  farms: FarmSpot[];
  /** 上一轮选定的推进路线，锁定期内不换 */
  plan?: LanePlan;
  /** 上一轮在打架的 bot 与各自的集火目标，打起来后按「继续打」的口径留下，不在阈值附近来回换 */
  fighting?: Map<number, number>;
  /** 敌方英雄的总战力，阵亡的按阵亡前算 */
  enemyPower?: number;
  /** 己方 bot 的总战力，口径同敌方，阵亡的按阵亡前算 */
  teamStrength?: number;
  /** 上一轮在高地外施压 */
  siege?: boolean;
  /** 全队合成一路推一波 */
  groupPush?: boolean;
  /** 敌方还有一塔、二塔没推掉，含暂时没有兵线的路 */
  outerTowersLeft?: boolean;
  /** 活着的肉山 */
  roshan?: RoshanInfo;
  /** 上一轮在打肉山的 bot */
  roshanSquad?: Set<number>;
  /** 不久前全队也打不过的交战点：敌人进了迷雾也先别回去推进 */
  avoided?: Point[];
  /** 做太久没进展、暂时歇着的事 */
  resting?: Set<Activity>;
  /** 推太久没进展的路，歇推进期间换别的路 */
  tiredLanes?: Lane[];
  /** 敌方上一座一塔或二塔被推掉的时间 */
  outerTowerFellAt?: number;
  now: number;
  /** 0–1 的随机数，选路时用 */
  random: () => number;
}

/** 选定的推进路线；目标塔倒了顺着同一路推下一座，不重选。 */
export interface LanePlan {
  picks: { lane: Lane }[];
  until: number;
  /** 抱团推进时选的路线，抱团开始或结束都立刻重选 */
  group: boolean;
}

export interface PlanResult {
  tasks: Map<number, Task>;
  plan?: LanePlan;
  /** 碾压敌方，在高地外施压而不直接冲 */
  siege: boolean;
  /** 本轮全队也打不过的交战点 */
  avoid: Point[];
}
// 回防要带够余量，刚好持平的人数守不住塔
const DEFEND_POWER_MARGIN = 1.2;
// 全队赶过去也够不上主动交战的门槛时，外塔不值得去送，和打架同一口径
const DEFEND_GIVE_UP_RATIO = 1 / AVOID_POWER_RATIO;
// 外塔最多抽走的人数比例，剩下的人继续推进，逼玩家回防
const DEFEND_MAX_SHARE = 0.6;
/** 离目的地超过这么远、卷轴又好着时 bot 会传送过去 */
export const TELEPORT_MIN_DISTANCE = 6000;
// 传送过去折算成走这么远：引导几秒加落地后走到位
const TELEPORT_ARRIVAL_DISTANCE = 2500;
// 扣掉建筑后还剩的小兵威胁按这个比例算：小兵不会集火也不躲技能，回去太多会错过推对面的机会
const CREEP_POWER_RATIO = 0.6;
// 建筑守得住的小兵，这么近以内有清兵快的人才去吃兵发育，远处的不回
const CREEP_FARM_RANGE = 4000;
// 预警时守在建筑后方这么远，敌人上来先挨塔打，也不会被当面抓
const DEFEND_GUARD_BACK = 600;
// 这个范围内的 bot 算已经到场
export const FIGHT_JOIN_RADIUS = 2500;
// 离某个 bot 这么近的敌方英雄才算交战点；远处的 bot 也会被叫过来，落单的玩家会被围剿
export const FIGHT_SUPPORT_RADIUS = 6000;
export const FIGHT_DANGER_RADIUS = 1500;
// 派来打的 bot 离交战点这么近才算跟得上，远处还在路上的不算进我方战力
export const FIGHT_FOLLOW_RADIUS = 3000;
// 半队强过敌方全队这么多倍才算占优：分两路与高地外施压
const AHEAD_RATIO = 1.2;
// 全队都打不过的敌人附近这么远的推进目标先不派人，免得走过去被逐个击破
const AVOID_LANE_RADIUS = 3000;
// 推塔手排在后面挑，相当于离交战点远了这么多；就在交战点旁边的推塔手照常叫，不站在一边看队友打
const PUSHER_DISTANCE_PENALTY = 2000;
// 推完一座塔顺着原路推下一座，比换到别的路划算
const PLAN_LANE_INERTIA = 1;
// 赶路每这么远，进攻机会分扣 1
const LANE_TRAVEL_SCALE = 4000;
// 一路人太少时玩家到哪杀到哪，毫无反抗力，还会被牵着满图跑
const MIN_LANE_GROUP = 3;
// 多于两路太分散，每路都凑不够人
const MAX_PUSH_LANES = 2;
// 只从机会分前几名里抽，太差的路不去
const LANE_PICK_POOL = 3;
// 在高地外施压时，实力降到碾压门槛的这个比例以下才改强攻
const SIEGE_KEEP_RATIO = 0.8;
// 推掉一座外塔后隔这么久才推下一座，给玩家留发育的空间
const TOWER_PUSH_INTERVAL = 120;
// 选定的路线至少保持这么久，否则每秒重算会走到一半掉头
const PLAN_LOCK_SECONDS = 90;
// 不要求这一波推掉塔，能把塔血磨下去一些就值得上，只避开上去毫无作用的塔
const TOWER_PUSH_RATIO = 0.5;
// 守塔的敌方英雄不超过我方这么多倍就尽量去推，而不是一直发育
const DEFENDED_PUSH_RATIO = 2;
// 肉山的技能与减甲算不进战力，派去的人要强出一截才稳稳打下来，不去打到一半被打回家
export const ROSHAN_POWER_MARGIN = 4;
// 留给玩家的时间过后又这么久肉山还在，放开人数限制全队一起去，不会永远不打
const ROSHAN_ALL_IN_AFTER = 180;
// 开打后剩下的人要比肉山（按它当前血量）强这么多才继续，被叫走一两个没事，走多了一起撤；肉山快死时门槛跟着降
const ROSHAN_KEEP_MARGIN = 2;
// 敌方英雄离肉山这么近时不去，免得刚歇下打架又在肉山坑撞上
const ROSHAN_CONTEST_RADIUS = 3000;
// 放开之前最多派半队，其余继续推进压制玩家
const ROSHAN_MAX_SHARE = 0.5;

export function planTasks(input: PlanInput): PlanResult {
  const tasks = new Map<number, Task>();
  let free: PlanBot[] = [];

  for (const bot of input.bots) {
    if (bot.needsRecover) {
      tasks.set(bot.id, { kind: 'recover', pos: input.fountain });
    } else {
      free.push(bot);
    }
  }

  // 建筑被英雄贴着打最急，其次打架；清兵与盯着来犯英雄不急，不从打架的人里抽
  free = assignDefend(input, free, tasks, ['engaged']);
  const fights = assignFights(input, free, tasks);
  const rest = assignDefend(input, fights.remaining, tasks, ['creeps', 'warning']);
  const siege = pressing(input);
  const avoid = [...fights.avoid, ...(input.avoided ?? [])];
  const push = assignPush(input, assignRoshan(input, rest, tasks), tasks, avoid, siege);
  assignFarm(input, push.unassigned, tasks, push.anchors);

  for (const bot of input.bots) {
    if (!tasks.has(bot.id)) {
      tasks.set(bot.id, { kind: 'hold', pos: input.fountain });
    }
  }
  return { tasks, plan: push.plan, siege, avoid: fights.avoid };
}

/** 赶到这里折算成走多远：卷轴好着的远处 bot 传送过来，比近处走路的更快。 */
function arrivalCost(bot: PlanBot, pos: Point): number {
  const gap = distance(bot.pos, pos);
  const teleport = bot.teleportReady === true && gap > TELEPORT_MIN_DISTANCE;
  return teleport ? TELEPORT_ARRIVAL_DISTANCE : gap;
}

/** 按谁先到排。 */
function byArrival(bots: PlanBot[], pos: Point): PlanBot[] {
  const cost = new Map<number, number>();
  for (const bot of bots) {
    cost.set(bot.id, arrivalCost(bot, pos));
  }
  return [...bots].sort((a, b) => cost.get(a.id)! - cost.get(b.id)!);
}

/** 已经打起来的先派，其次清推到基地的小兵，最后给还没动手的来犯英雄派一个人盯着。 */
function assignDefend(
  input: PlanInput,
  free: PlanBot[],
  tasks: Map<number, Task>,
  stages: DefendStage[],
): PlanBot[] {
  const stageOrder: Record<DefendStage, number> = { engaged: 0, creeps: 1, warning: 2 };
  const threats = input.defend
    .filter((threat) => stages.includes(threat.stage))
    .sort(
      (a, b) =>
        stageOrder[a.stage] - stageOrder[b.stage] ||
        b.attackerPower * b.importance * (1.5 - b.hpRatio) -
          a.attackerPower * a.importance * (1.5 - a.hpRatio),
    );
  const maxOuterDefenders = Math.ceil(input.bots.length * DEFEND_MAX_SHARE);
  let remaining = free;
  for (const threat of threats) {
    if (remaining.length === 0) {
      break;
    }
    if (threat.stage === 'warning') {
      const guard = byArrival(remaining, threat.pos).find((bot) => bot.control) ?? remaining[0];
      const guardPos = guardPosition(threat.pos, input.fountain);
      tasks.set(guard.id, { kind: 'defend', pos: guardPos, targetId: threat.id });
      remaining = remaining.filter((bot) => bot !== guard);
      continue;
    }
    if (threat.stage === 'creeps' && threat.attackerPower <= 0) {
      const pushers = findPushers(remaining);
      const farmer = byArrival(remaining, threat.pos).find(
        (bot) =>
          (bot.waveClear || pushers.has(bot.id)) &&
          distance(bot.pos, threat.pos) <= CREEP_FARM_RANGE,
      );
      if (farmer) {
        tasks.set(farmer.id, { kind: 'defend', pos: threat.pos, targetId: threat.id });
        remaining = remaining.filter((bot) => bot !== farmer);
      }
      continue;
    }
    const available = remaining.reduce((sum, bot) => sum + bot.power, 0);
    if (!threat.isBase && available < threat.attackerPower * DEFEND_GIVE_UP_RATIO) {
      continue;
    }
    // 高地起被英雄贴着打时全体回防，不按战力凑人：玩家强时估算的战力靠不住，少来几个只会被逐个击破
    const need =
      threat.isBase && threat.stage === 'engaged'
        ? Infinity
        : threat.attackerPower *
          (threat.stage === 'creeps' ? CREEP_POWER_RATIO : DEFEND_POWER_MARGIN);
    let candidates = byArrival(remaining, threat.pos);
    if (threat.stage === 'creeps') {
      // 小兵不会跑，派清得快的：有范围技能或普攻高的
      const pushers = findPushers(remaining);
      candidates = candidates.filter((bot) => bot.waveClear || pushers.has(bot.id));
    }
    let assigned = 0;
    let count = 0;
    const picked = new Set<number>();
    for (const bot of candidates) {
      if (assigned >= need || (!threat.isBase && count >= maxOuterDefenders)) {
        break;
      }
      const task: Task = { kind: 'defend', pos: threat.pos, targetId: threat.id };
      if (threat.core && threat.stage === 'engaged') {
        task.hold = true;
      }
      tasks.set(bot.id, task);
      picked.add(bot.id);
      assigned += bot.power;
      count++;
    }
    remaining = remaining.filter((bot) => !picked.has(bot.id));
  }
  return remaining;
}

function guardPosition(pos: Point, fountain: Point): Point {
  const gap = distance(pos, fountain);
  if (gap <= DEFEND_GUARD_BACK) {
    return fountain;
  }
  const ratio = DEFEND_GUARD_BACK / gap;
  return { x: pos.x + (fountain.x - pos.x) * ratio, y: pos.y + (fountain.y - pos.y) * ratio };
}

/** 攻击输出排在全队前一半的 bot 算推塔手。 */
function findPushers(bots: PlanBot[]): Set<number> {
  const sorted = [...bots].sort((x, y) => y.attackDps - x.attackDps);
  return new Set(sorted.slice(0, Math.floor(sorted.length / 2)).map((bot) => bot.id));
}

/**
 * 交战按全队判断，要么不上、要么满强度一起上：
 * 全队加起来也打不过就不去，那一带也不派人推进，改去别的路；
 * 打得过就按距离叫够人，推塔手最后才挑，赶得到的其余人也全来。大家直接朝交战点走，不在集合点站着等，
 * 进不进场由英雄层按跟得上的人够不够判断，先到的在外围等后面的人跟上。
 * 敌人先动手时，附近的人扛得住就一起接战。
 */
function assignFights(
  input: PlanInput,
  free: PlanBot[],
  tasks: Map<number, Task>,
): { remaining: PlanBot[]; avoid: Point[] } {
  const pushers = findPushers(input.bots);
  // 远处在打肉山的人和推塔手一样排在后面挑，凑够之后也不叫，免得肉山打到一半全队走开
  const onRoshan = (bot: PlanBot, gap: number) =>
    gap > FIGHT_FOLLOW_RADIUS && input.roshanSquad?.has(bot.id) === true;
  const spots = [...input.fights].sort((a, b) => b.enemyPower - a.enemyPower);
  const avoid: Point[] = [];
  let remaining = free;
  for (const spot of spots) {
    // 与英雄层进场同一口径，派出的人到齐后正好够上
    const need = spot.enemyPower / AVOID_POWER_RATIO - spot.allyPower;
    const enough = remaining.reduce((sum, bot) => sum + bot.power, 0) >= need;
    const fighters = remaining.filter((bot) => input.fighting?.get(bot.id) === spot.focusId);
    const nearby = remaining.filter(
      (bot) => distance(bot.pos, spot.pos) <= FIGHT_FOLLOW_RADIUS || fighters.includes(bot),
    );
    // 已经打起来、或上一轮已经决定打这个人时，扛得住就接着打，不丢下挨打的队友各自跑
    const holds =
      (spot.engaged || fighters.length > 0) &&
      spot.enemyPower <=
        (nearby.reduce((sum, bot) => sum + bot.power, 0) + spot.allyPower) * KEEP_FIGHTING_RATIO;
    // 歇打架时不派人，也别推到敌人跟前去；敌人动手时由英雄层就地还手
    if (!enough || input.resting?.has('fight')) {
      avoid.push(spot.pos);
    }
    if (input.resting?.has('fight')) {
      continue;
    }
    // 能来的人全来也凑不够就都不来，不派一部分人去送；打起来了也只叫附近的，远处的赶来只会逐个送
    if ((!enough && !holds) || spot.pastFront || spot.towerSafe === true) {
      continue;
    }
    const pool = enough ? remaining : nearby;
    // 先算好每人的代价再比较：比较时现算的浮点误差会让同一个人和自己比出大小，Lua 的排序会直接报错
    const cost = new Map<number, number>();
    for (const bot of pool) {
      const gap = distance(bot.pos, spot.pos);
      const busy = (pushers.has(bot.id) && gap > FIGHT_FOLLOW_RADIUS) || onRoshan(bot, gap);
      const penalty = busy ? PUSHER_DISTANCE_PENALTY : 0;
      // 已经在打的人排最前，换人会让刚交上手的人被换下来
      cost.set(bot.id, fighters.includes(bot) ? -1 : gap + penalty);
    }
    const order = [...pool].sort((a, b) => cost.get(a.id)! - cost.get(b.id)!);
    const picked: PlanBot[] = [];
    let assigned = 0;
    for (const bot of order) {
      // 凑够战力的人再远也叫；凑够之后赶得到的也来，打出满强度，不留一半人在别处带线
      const skip =
        !enough ||
        arrivalCost(bot, spot.pos) > FIGHT_SUPPORT_RADIUS ||
        onRoshan(bot, distance(bot.pos, spot.pos));
      if (assigned >= need && skip) {
        continue;
      }
      picked.push(bot);
      assigned += bot.power;
    }
    if (picked.length === 0) {
      continue;
    }
    const task: Task = { kind: 'fight', pos: spot.pos, targetId: spot.focusId };
    const ids = new Set<number>();
    for (const bot of picked) {
      tasks.set(bot.id, task);
      ids.add(bot.id);
    }
    remaining = remaining.filter((bot) => !ids.has(bot.id));
  }
  return { remaining, avoid };
}

/**
 * 肉山刷出来、留给玩家的时间过后，没有建筑要守、没在打架、半队以内的人就明显打得过时，派离得最近的几个人去打，
 * 其余照常推进；肉山一直没人打时放开到全队。
 * 开打后原班人马打到肉山死，不按开打门槛重算：双方都在掉血，每秒重算会打到一半全队走开、回头再来。
 */
function assignRoshan(input: PlanInput, free: PlanBot[], tasks: Map<number, Task>): PlanBot[] {
  const roshan = input.roshan;
  if (!roshan) {
    return free;
  }
  const squad = input.roshanSquad;
  const kept = free.filter((bot) => squad?.has(bot.id));
  const picked =
    kept.length > 0 ? keepRoshan(roshan, free, kept) : startRoshan(input, roshan, free, tasks);
  const task: Task = { kind: 'roshan', pos: roshan.pos, targetId: roshan.id };
  for (const bot of picked) {
    tasks.set(bot.id, task);
  }
  return free.filter((bot) => !picked.includes(bot));
}

/**
 * 已经在打的人不按开打门槛重算；被抽走太多、剩下的不再稳稳强过肉山时就近补人，补不上就一起撤，不留一两个人在坑里。
 */
function keepRoshan(roshan: RoshanInfo, free: PlanBot[], kept: PlanBot[]): PlanBot[] {
  const need = roshan.power * ROSHAN_KEEP_MARGIN;
  const picked = [...kept];
  let assigned = kept.reduce((sum, bot) => sum + bot.power, 0);
  const others = free.filter((bot) => !kept.includes(bot));
  const gap = new Map<number, number>();
  for (const bot of others) {
    gap.set(bot.id, distance(bot.pos, roshan.pos));
  }
  for (const bot of others.sort((a, b) => gap.get(a.id)! - gap.get(b.id)!)) {
    if (assigned >= need) {
      break;
    }
    picked.push(bot);
    assigned += bot.power;
  }
  return assigned >= need ? picked : [];
}

function startRoshan(
  input: PlanInput,
  roshan: RoshanInfo,
  free: PlanBot[],
  tasks: Map<number, Task>,
): PlanBot[] {
  const active = input.bots.filter((bot) => !bot.needsRecover);
  // 不比敌方全队强也去：玩家不在附近时偷肉山，被撞上按交战处理。
  // 有人在打架时不分人去，歇打架时才轮得到
  if (
    roshan.aliveSeconds < roshan.waitSeconds ||
    input.defend.length > 0 ||
    [...tasks.values()].some((task) => task.kind === 'fight') ||
    input.fights.some((fight) => distance(fight.pos, roshan.pos) <= ROSHAN_CONTEST_RADIUS)
  ) {
    return [];
  }
  const need = roshan.power * ROSHAN_POWER_MARGIN;
  const gap = new Map<number, number>();
  for (const bot of free) {
    gap.set(bot.id, distance(bot.pos, roshan.pos));
  }
  const picked: PlanBot[] = [];
  let assigned = 0;
  for (const bot of [...free].sort((a, b) => gap.get(a.id)! - gap.get(b.id)!)) {
    if (assigned >= need) {
      break;
    }
    picked.push(bot);
    assigned += bot.power;
  }
  const affordable =
    roshan.aliveSeconds >= roshan.waitSeconds + ROSHAN_ALL_IN_AFTER ||
    picked.length <= Math.ceil(active.length * ROSHAN_MAX_SHARE);
  return assigned >= need && affordable ? picked : [];
}

/** 这些战力能不能推这一路：能磨掉塔血，且守塔的敌方英雄没有强出太多。 */
function canPushWith(power: number, lane: PushLane): boolean {
  return (
    power >= lane.towerPower * TOWER_PUSH_RATIO && lane.enemyPower <= power * DEFENDED_PUSH_RATIO
  );
}

/** 这一路的进攻机会，扣掉 bot 赶过去的路程，顺着原路推下一座塔比 TP 去别的路划算。 */
function laneScore(
  lane: PushLane,
  bots: PlanBot[],
  pushPower: number,
  plan: LanePlan | undefined,
): number {
  let score = (lane.waveAtTarget ? 2 : 1) + (1 - lane.targetHpRatio);
  score -= (lane.enemyPower / Math.max(pushPower, 1)) * 2;
  if (plan?.picks.some((pick) => pick.lane === lane.lane)) {
    score += PLAN_LANE_INERTIA;
  }
  const travel = bots.reduce((sum, bot) => sum + distance(bot.pos, lane.stagingPos), 0);
  score -= travel / bots.length / LANE_TRAVEL_SCALE;
  return score;
}

/** 返回本轮的推进路线，以及推不动任何一路、需要去发育的 bot。 */
function assignPush(
  input: PlanInput,
  free: PlanBot[],
  tasks: Map<number, Task>,
  avoid: Point[],
  siege: boolean,
): { plan: LanePlan | undefined; unassigned: PlanBot[]; anchors: Point[] } {
  if (free.length === 0) {
    return { plan: input.plan, unassigned: [], anchors: [] };
  }
  // 路数按全队能出力的人数与战力定，被交战临时借走几个人不改路线
  const active = input.bots.filter((bot) => !bot.needsRecover).length;
  const teamPower = input.bots
    .filter((bot) => !bot.needsRecover)
    .reduce((sum, bot) => sum + bot.power, 0);
  const group = input.groupPush === true;
  const enemyPower = input.enemyPower ?? 0;
  const outerLeft = input.outerTowersLeft === true || input.lanes.some((lane) => !lane.highGround);
  // 推掉一座外塔后先缓一阵，在前线附近刷野清兵施压，不一路连推；抱团时一样缓，否则掉塔间隔还是很短
  const cooling =
    outerLeft &&
    input.now < (input.outerTowerFellAt ?? -Infinity) + TOWER_PUSH_INTERVAL &&
    (group || dominates(teamStrength(input), enemyPower));
  const held = input.lanes.filter((lane) => cooling || (lane.highGround && (outerLeft || siege)));
  // 推太久没进展的路先放一放，换一路推；没别的路可推就去发育或打肉山
  const tired = input.resting?.has('push') ? (input.tiredLanes ?? []) : [];
  const open = input.lanes.filter((lane) => !held.includes(lane) && !tired.includes(lane.lane));
  const pushPower = free.reduce((sum, bot) => sum + bot.power, 0);
  const candidates = open.filter(
    (lane) =>
      canPushWith(pushPower, lane) &&
      avoid.every((pos) => distance(pos, lane.stagingPos) > AVOID_LANE_RADIUS),
  );
  // 碾压时不直接上高地，在高地推进点附近刷野清兵施压，玩家露面就被叫来的人围剿
  const anchors = cooling || (siege && !outerLeft) ? held.map((lane) => lane.stagingPos) : [];
  if (candidates.length === 0) {
    return { plan: input.plan, unassigned: free, anchors };
  }
  const desired = group ? 1 : lanesFor(active, teamPower, enemyPower);
  // 锁定期内按全队战力判断原路线还能不能推：有人去打架、回家或阵亡只是暂时的，不因此换路
  let plan = input.plan;
  const heldPicked = plan?.picks.some(
    (pick) => held.some((lane) => lane.lane === pick.lane) || tired.includes(pick.lane),
  );
  if (
    !plan ||
    plan.group !== group ||
    heldPicked ||
    !keepsPlan(plan, open, teamPower, avoid, input.now)
  ) {
    plan = pickLanes(candidates, free, pushPower, Math.min(desired, candidates.length), input);
    plan.group = group;
  }
  const chosen: PushLane[] = [];
  const waiting = new Set<Lane>();
  for (const pick of plan.picks) {
    const lane = candidates.find((candidate) => candidate.lane === pick.lane);
    if (lane) {
      chosen.push(lane);
    } else {
      waiting.add(pick.lane);
    }
  }
  // 这一路的兵线暂时没了，这组人就近发育等下一波，不临时挤到另一路再走回来
  const unassigned = free.filter(
    (bot) => chosen.length === 0 || (bot.pushLane !== undefined && waiting.has(bot.pushLane)),
  );
  const pushing = free.filter((bot) => !unassigned.includes(bot));
  if (pushing.length > 0) {
    spread(pushing, chosen, tasks, Math.ceil(active / plan.picks.length));
  }
  return {
    plan,
    unassigned: [...unassigned, ...dropWeakGroups(pushing, chosen, tasks)],
    anchors,
  };
}

/** 碾压敌方、又不在抱团推进时，高地外施压而不直接冲；按实力算，不因一时有人阵亡或去打架就改强攻。 */
function pressing(input: PlanInput): boolean {
  // 在高地外刷野施压太久没进展就上高地，不一直绕着推进点转
  if (input.groupPush === true || input.resting?.has('farm')) {
    return false;
  }
  // 已经在施压时降到门槛以下一截才改强攻，不在门槛附近来回切
  const bar = input.siege ? SIEGE_KEEP_RATIO : 1;
  return dominates(teamStrength(input) / bar, input.enemyPower ?? 0);
}

function teamStrength(input: PlanInput): number {
  return (
    input.teamStrength ??
    input.bots.filter((bot) => !bot.needsRecover).reduce((sum, bot) => sum + bot.power, 0)
  );
}

/**
 * 人够两组、且半队人马就打得过敌方全队时才分两路：玩家弱时不被十人一波推平，玩家强时不被分路逐个击破。
 */
function lanesFor(active: number, teamPower: number, enemyPower: number): number {
  const byCount = Math.min(MAX_PUSH_LANES, Math.max(1, Math.floor(active / MIN_LANE_GROUP)));
  return dominates(teamPower, enemyPower) ? byCount : 1;
}

/**
 * 半队人马就打得过敌方全队：分两路推，高地外施压而不直接冲。
 * 两处用同一口径，强到敢分路就强到该收着打，调这一个判断就能整体调节奏。
 */
function dominates(teamPower: number, enemyPower: number): boolean {
  return teamPower / MAX_PUSH_LANES >= enemyPower * AHEAD_RATIO;
}

/**
 * 锁定期内每路还能推就不换路，路数随人数的变化留到锁定期满再调整。
 * 兵线暂时没到的路不在推进候选里，照样保留，等兵线回来。
 */
function keepsPlan(
  plan: LanePlan,
  lanes: PushLane[],
  teamPower: number,
  avoid: Point[],
  now: number,
): boolean {
  return (
    now < plan.until &&
    plan.picks.every((pick) => {
      const lane = lanes.find((entry) => entry.lane === pick.lane);
      return (
        !lane ||
        (canPushWith(teamPower, lane) &&
          avoid.every((pos) => distance(pos, lane.stagingPos) > AVOID_LANE_RADIUS))
      );
    })
  );
}

/** 从机会分前几名里按分数加权随机抽几路：每局路线都不一样，但机会大的路更常被选中。 */
function pickLanes(
  candidates: PushLane[],
  bots: PlanBot[],
  pushPower: number,
  count: number,
  input: PlanInput,
): LanePlan {
  let pool = candidates
    .map((lane) => ({ lane, weight: Math.exp(laneScore(lane, bots, pushPower, input.plan)) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, LANE_PICK_POOL);
  const picks: LanePlan['picks'] = [];
  while (picks.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = input.random() * total;
    let index = 0;
    while (index < pool.length - 1 && roll >= pool[index].weight) {
      roll -= pool[index].weight;
      index++;
    }
    const picked = pool[index].lane;
    picks.push({ lane: picked.lane });
    pool = pool.filter((entry) => entry.lane !== picked);
  }
  return { picks, until: input.now + PLAN_LOCK_SECONDS, group: false };
}

/**
 * 原本属于某一路的 bot 回到原路，其余去人最少的一路，同样少时去最近的。
 * 每路名额按全队人数算，交战临时借走几个人时留下的人不会被挤到另一路。
 */
function spread(
  bots: PlanBot[],
  used: PushLane[],
  tasks: Map<number, Task>,
  capacity: number,
): void {
  const counts = new Map<Lane, number>();
  const pending: PlanBot[] = [];
  for (const bot of bots) {
    const stay = used.find((lane) => lane.lane === bot.pushLane);
    if (stay && (counts.get(stay.lane) ?? 0) < capacity) {
      counts.set(stay.lane, (counts.get(stay.lane) ?? 0) + 1);
      tasks.set(bot.id, pushTask(stay));
    } else {
      pending.push(bot);
    }
  }
  for (const bot of pending) {
    let best = used[0];
    for (const lane of used) {
      const gap = (counts.get(lane.lane) ?? 0) - (counts.get(best.lane) ?? 0);
      if (
        gap < 0 ||
        (gap === 0 && distance(bot.pos, lane.stagingPos) < distance(bot.pos, best.stagingPos))
      ) {
        best = lane;
      }
    }
    counts.set(best.lane, (counts.get(best.lane) ?? 0) + 1);
    tasks.set(bot.id, pushTask(best));
  }
}

/** 分完之后某一路的人磨不动那座塔或守方强出太多，这一组改去发育，不上去送。 */
function dropWeakGroups(bots: PlanBot[], lanes: PushLane[], tasks: Map<number, Task>): PlanBot[] {
  const dropped: PlanBot[] = [];
  for (const lane of lanes) {
    const group = bots.filter((bot) => tasks.get(bot.id)?.lane === lane.lane);
    const power = group.reduce((sum, bot) => sum + bot.power, 0);
    if (group.length > 0 && !canPushWith(power, lane)) {
      for (const bot of group) {
        tasks.delete(bot.id);
        dropped.push(bot);
      }
    }
  }
  return dropped;
}

/** 推不动塔的 bot 去最近的发育点，在高地外施压时去离推进点最近的；远古野只有够强的 bot 才去。 */
function assignFarm(
  input: PlanInput,
  bots: PlanBot[],
  tasks: Map<number, Task>,
  anchors: Point[],
): void {
  const gapOf = (bot: PlanBot, pos: Point) =>
    anchors.length === 0
      ? distance(bot.pos, pos)
      : Math.min(...anchors.map((anchor) => distance(anchor, pos)));
  for (const bot of bots) {
    let best: Point | undefined;
    for (const spot of input.farms) {
      if (spot.ancient && bot.power < ANCIENT_FARM_POWER) {
        continue;
      }
      if (!best || gapOf(bot, spot.pos) < gapOf(bot, best)) {
        best = spot.pos;
      }
    }
    if (best) {
      tasks.set(bot.id, { kind: 'farm', pos: best });
    }
  }
}

function pushTask(lane: PushLane): Task {
  return { kind: 'push', pos: lane.stagingPos, targetId: lane.targetId, lane: lane.lane };
}
