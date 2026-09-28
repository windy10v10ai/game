/** 团队任务分派：按回复 → 防守 → 交战 → 推进 → 发育的顺序把每个 bot 分到一个带目的地的任务。 */
import { distance, Lane, Point } from './lane-geometry';
import { ANCIENT_FARM_POWER, AVOID_POWER_RATIO } from './power';

export type TaskKind = 'recover' | 'defend' | 'fight' | 'regroup' | 'push' | 'farm' | 'hold';

export interface Task {
  kind: TaskKind;
  pos: Point;
  /** 防守的建筑、集火的敌方英雄或推进的目标建筑 */
  targetId?: number;
  lane?: Lane;
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
}

export interface DefendTarget {
  id: number;
  pos: Point;
  /** 基地与兵营受威胁即视为基地危急，不计成本回防 */
  isBase: boolean;
  importance: number;
  hpRatio: number;
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
  /** 打不过时附近 bot 的集合点 */
  rally: Point;
  /** 在敌方还没推掉的塔后面，不派人去打 */
  pastFront: boolean;
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
  now: number;
  /** 0–1 的随机数，选路时用 */
  random: () => number;
}

/** 选定的推进路线；目标塔倒了顺着同一路推下一座，不重选。 */
export interface LanePlan {
  picks: { lane: Lane }[];
  until: number;
}

export interface PlanResult {
  tasks: Map<number, Task>;
  plan?: LanePlan;
}
// 回防要带够余量，刚好持平的人数守不住塔
const DEFEND_POWER_MARGIN = 1.2;
// 全队赶过去也只有攻方一半战力时，外塔不值得去送
const DEFEND_GIVE_UP_RATIO = 0.5;
// 外塔最多抽走的人数比例，剩下的人继续推进，逼玩家回防
const DEFEND_MAX_SHARE = 0.6;
// 这个范围内的 bot 算已经到场
export const FIGHT_JOIN_RADIUS = 2500;
// 离某个 bot 这么近的敌方英雄才算交战点；远处的 bot 也会被叫过来，落单的玩家会被围剿
export const FIGHT_SUPPORT_RADIUS = 6000;
export const FIGHT_DANGER_RADIUS = 1500;
// 派去打架的战力要高出对面一截才稳
const FIGHT_POWER_MARGIN = 1.2;
// 集合的 bot 到了集合点这么近就算到场
const RALLY_ARRIVE_RADIUS = 800;
// 全队都打不过的敌人附近这么远的推进目标先不派人，免得走过去被逐个击破
const AVOID_LANE_RADIUS = 3000;
// 推塔手排在后面挑，相当于离交战点远了这么多
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
// 选定的路线至少保持这么久，否则每秒重算会走到一半掉头
const PLAN_LOCK_SECONDS = 90;
// 不要求这一波推掉塔，能把塔血磨下去一些就值得上，只避开上去毫无作用的塔
const TOWER_PUSH_RATIO = 0.5;
// 守塔的敌方英雄不超过我方这么多倍就尽量去推，而不是一直发育
const DEFENDED_PUSH_RATIO = 2;

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

  free = assignDefend(input, free, tasks);
  const fights = assignFights(input, free, tasks);
  const push = assignPush(input, fights.remaining, tasks, fights.avoid);
  assignFarm(input, push.unassigned, tasks);

  for (const bot of input.bots) {
    if (!tasks.has(bot.id)) {
      tasks.set(bot.id, { kind: 'hold', pos: input.fountain });
    }
  }
  return { tasks, plan: push.plan };
}

function byDistance(bots: PlanBot[], pos: Point): PlanBot[] {
  return [...bots].sort((a, b) => distance(a.pos, pos) - distance(b.pos, pos));
}

function assignDefend(input: PlanInput, free: PlanBot[], tasks: Map<number, Task>): PlanBot[] {
  const threats = [...input.defend].sort(
    (a, b) =>
      b.attackerPower * b.importance * (1.5 - b.hpRatio) -
      a.attackerPower * a.importance * (1.5 - a.hpRatio),
  );
  const maxOuterDefenders = Math.ceil(input.bots.length * DEFEND_MAX_SHARE);
  let remaining = free;
  for (const threat of threats) {
    const available = remaining.reduce((sum, bot) => sum + bot.power, 0);
    if (!threat.isBase && available < threat.attackerPower * DEFEND_GIVE_UP_RATIO) {
      continue;
    }
    const need = threat.attackerPower * DEFEND_POWER_MARGIN;
    let assigned = 0;
    let count = 0;
    const picked = new Set<number>();
    for (const bot of byDistance(remaining, threat.pos)) {
      if (assigned >= need || (!threat.isBase && count >= maxOuterDefenders)) {
        break;
      }
      tasks.set(bot.id, { kind: 'defend', pos: threat.pos, targetId: threat.id });
      picked.add(bot.id);
      assigned += bot.power;
      count++;
    }
    remaining = remaining.filter((bot) => !picked.has(bot.id));
  }
  return remaining;
}

/** 攻击输出排在全队前一半的 bot 算推塔手。 */
function findPushers(bots: PlanBot[]): Set<number> {
  const sorted = [...bots].sort((x, y) => y.attackDps - x.attackDps);
  return new Set(sorted.slice(0, Math.floor(sorted.length / 2)).map((bot) => bot.id));
}

/**
 * 交战按全队判断，要么不上、要么集合后一起上：
 * 全队加起来也打不过就不去，那一带也不派人推进，改去别的路；
 * 打得过就按距离叫够人，推塔手最后才挑；到场的人够了或已经打起来就直接上，否则先到集合点凑齐。
 */
function assignFights(
  input: PlanInput,
  free: PlanBot[],
  tasks: Map<number, Task>,
): { remaining: PlanBot[]; avoid: Point[] } {
  const pushers = findPushers(input.bots);
  const spots = [...input.fights].sort((a, b) => b.enemyPower - a.enemyPower);
  const avoid: Point[] = [];
  let remaining = free;
  for (const spot of spots) {
    const teamPower = remaining.reduce((sum, bot) => sum + bot.power, 0) + spot.allyPower;
    if (spot.enemyPower > teamPower * AVOID_POWER_RATIO) {
      avoid.push(spot.pos);
      continue;
    }
    if (spot.pastFront) {
      continue;
    }
    const need = spot.enemyPower * FIGHT_POWER_MARGIN - spot.allyPower;
    const order = [...remaining].sort(
      (a, b) =>
        distance(a.pos, spot.pos) +
        (pushers.has(a.id) ? PUSHER_DISTANCE_PENALTY : 0) -
        distance(b.pos, spot.pos) -
        (pushers.has(b.id) ? PUSHER_DISTANCE_PENALTY : 0),
    );
    const picked: PlanBot[] = [];
    let assigned = 0;
    for (const bot of order) {
      if (assigned >= need) {
        break;
      }
      picked.push(bot);
      assigned += bot.power;
    }
    if (picked.length === 0) {
      continue;
    }
    const arrived = picked
      .filter(
        (bot) =>
          distance(bot.pos, spot.pos) <= FIGHT_JOIN_RADIUS ||
          distance(bot.pos, spot.rally) <= RALLY_ARRIVE_RADIUS,
      )
      .reduce((sum, bot) => sum + bot.power, spot.allyPower);
    const task: Task =
      spot.engaged || spot.enemyPower <= arrived * AVOID_POWER_RATIO
        ? { kind: 'fight', pos: spot.pos, targetId: spot.focusId }
        : { kind: 'regroup', pos: spot.rally };
    const ids = new Set<number>();
    for (const bot of picked) {
      tasks.set(bot.id, task);
      ids.add(bot.id);
    }
    remaining = remaining.filter((bot) => !ids.has(bot.id));
  }
  return { remaining, avoid };
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
): { plan: LanePlan | undefined; unassigned: PlanBot[] } {
  if (free.length === 0) {
    return { plan: input.plan, unassigned: [] };
  }
  const pushPower = free.reduce((sum, bot) => sum + bot.power, 0);
  const candidates = input.lanes.filter(
    (lane) =>
      canPushWith(pushPower, lane) &&
      avoid.every((pos) => distance(pos, lane.stagingPos) > AVOID_LANE_RADIUS),
  );
  if (candidates.length === 0) {
    return { plan: input.plan, unassigned: free };
  }
  // 路数按全队能出力的人数定，被交战临时借走几个人不改路线
  const active = input.bots.filter((bot) => !bot.needsRecover).length;
  const desired = Math.min(MAX_PUSH_LANES, Math.max(1, Math.floor(active / MIN_LANE_GROUP)));
  let plan = input.plan;
  if (!plan || !keepsPlan(plan, input.lanes, candidates, desired, input.now)) {
    plan = pickLanes(candidates, free, pushPower, Math.min(desired, candidates.length), input);
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
    spread(pushing, chosen, tasks);
  }
  return { plan, unassigned: [...unassigned, ...dropWeakGroups(pushing, chosen, tasks)] };
}

/**
 * 锁定期内、路数够、每路还能推，就不换路。
 * 兵线暂时没到的路不在推进候选里，照样保留，等兵线回来。
 */
function keepsPlan(
  plan: LanePlan,
  lanes: PushLane[],
  candidates: PushLane[],
  desired: number,
  now: number,
): boolean {
  const spare = candidates.some((lane) => !plan.picks.some((pick) => pick.lane === lane.lane));
  const enough = plan.picks.length === desired || (plan.picks.length < desired && !spare);
  return (
    now < plan.until &&
    enough &&
    plan.picks.every(
      (pick) =>
        !lanes.some((lane) => lane.lane === pick.lane) ||
        candidates.some((lane) => lane.lane === pick.lane),
    )
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
  return { picks, until: input.now + PLAN_LOCK_SECONDS };
}

/** 按人数平均分到选定的几路；原本属于某一路的 bot 优先回到原路，其余去最近的一路。 */
function spread(bots: PlanBot[], used: PushLane[], tasks: Map<number, Task>): void {
  const capacity = Math.ceil(bots.length / used.length);
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
    const open = used.filter((lane) => (counts.get(lane.lane) ?? 0) < capacity);
    const choices = open.length > 0 ? open : used;
    let best = choices[0];
    for (const lane of choices) {
      if (distance(bot.pos, lane.stagingPos) < distance(bot.pos, best.stagingPos)) {
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

/** 推不动塔的 bot 去最近的发育点，远古野只有够强的 bot 才去。 */
function assignFarm(input: PlanInput, bots: PlanBot[], tasks: Map<number, Task>): void {
  for (const bot of bots) {
    let best: Point | undefined;
    for (const spot of input.farms) {
      if (spot.ancient && bot.power < ANCIENT_FARM_POWER) {
        continue;
      }
      if (!best || distance(bot.pos, spot.pos) < distance(bot.pos, best)) {
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
