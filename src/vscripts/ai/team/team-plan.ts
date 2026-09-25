/** 团队任务分派：按回复 → 防守 → 交战 → 推进的顺序把每个 bot 分到一个带目的地的任务。 */
import { distance, Lane, Point } from './lane-geometry';
import { AVOID_POWER_RATIO } from './power';

export type TaskKind = 'recover' | 'defend' | 'fight' | 'regroup' | 'push' | 'hold';

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
  previous?: Task;
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
}

export interface PlanInput {
  bots: PlanBot[];
  fountain: Point;
  defend: DefendTarget[];
  fights: FightSpot[];
  lanes: PushLane[];
  ourPower: number;
  enemyPower: number;
  /** 上一轮集中推进的那一路，带惯性避免来回换路 */
  mainLane?: Lane;
}

export interface PlanResult {
  tasks: Map<number, Task>;
  mainLane?: Lane;
}

export type Strategy = 'advantage' | 'even' | 'disadvantage';

const ADVANTAGE_RATIO = 1.3;
const DISADVANTAGE_RATIO = 0.8;
// 回防要带够余量，刚好持平的人数守不住塔
const DEFEND_POWER_MARGIN = 1.2;
// 全队赶过去也只有攻方一半战力时，外塔不值得去送
const DEFEND_GIVE_UP_RATIO = 0.5;
// 外塔最多抽走的人数比例，剩下的人继续推进，逼玩家回防
const DEFEND_MAX_SHARE = 0.6;
// 这个范围内的 bot 可以赶来参战，打不过时这个范围内的 bot 一起撤
export const FIGHT_JOIN_RADIUS = 2500;
export const FIGHT_DANGER_RADIUS = 1500;
// 派去打架的战力要高出对面一截才稳
const FIGHT_POWER_MARGIN = 1.2;
// 推塔手排在后面挑，相当于离交战点远了这么多
const PUSHER_DISTANCE_PENALTY = 2000;
const EVEN_MAIN_SHARE = 0.6;
const MAIN_LANE_INERTIA = 0.3;
// 敌方英雄战力超过这一路我方人数战力时才算「玩家在这一路」
const LANE_PRESENCE_RATIO = 0.3;

export function pickStrategy(ourPower: number, enemyPower: number): Strategy {
  if (enemyPower <= 0) {
    return 'advantage';
  }
  const ratio = ourPower / enemyPower;
  if (ratio >= ADVANTAGE_RATIO) {
    return 'advantage';
  }
  if (ratio <= DISADVANTAGE_RATIO) {
    return 'disadvantage';
  }
  return 'even';
}

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
  free = assignFights(input, free, tasks);
  const mainLane = assignPush(input, free, tasks);

  for (const bot of input.bots) {
    if (!tasks.has(bot.id)) {
      tasks.set(bot.id, { kind: 'hold', pos: input.fountain });
    }
  }
  return { tasks, mainLane };
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
 * 能打的交战点从附近挑人去集火，推塔手最后才挑，战力够了就停，剩下的人继续推进；
 * 明显打不过时，附近的 bot 一起撤向集合点。
 */
function assignFights(input: PlanInput, free: PlanBot[], tasks: Map<number, Task>): PlanBot[] {
  const pushers = findPushers(input.bots);
  const spots = [...input.fights].sort((a, b) => b.enemyPower - a.enemyPower);
  let remaining = free;
  for (const spot of spots) {
    const nearby = remaining.filter((bot) => distance(bot.pos, spot.pos) <= FIGHT_JOIN_RADIUS);
    if (nearby.length === 0) {
      continue;
    }
    const available = nearby.reduce((sum, bot) => sum + bot.power, 0) + spot.allyPower;
    const picked = new Set<number>();
    if (spot.enemyPower > available * AVOID_POWER_RATIO) {
      for (const bot of nearby) {
        if (distance(bot.pos, spot.pos) <= FIGHT_DANGER_RADIUS) {
          tasks.set(bot.id, { kind: 'regroup', pos: spot.rally });
          picked.add(bot.id);
        }
      }
    } else {
      const need = spot.enemyPower * FIGHT_POWER_MARGIN - spot.allyPower;
      const order = [...nearby].sort(
        (a, b) =>
          distance(a.pos, spot.pos) +
          (pushers.has(a.id) ? PUSHER_DISTANCE_PENALTY : 0) -
          distance(b.pos, spot.pos) -
          (pushers.has(b.id) ? PUSHER_DISTANCE_PENALTY : 0),
      );
      let assigned = 0;
      for (const bot of order) {
        if (assigned >= need) {
          break;
        }
        tasks.set(bot.id, { kind: 'fight', pos: spot.pos, targetId: spot.focusId });
        picked.add(bot.id);
        assigned += bot.power;
      }
    }
    remaining = remaining.filter((bot) => !picked.has(bot.id));
  }
  return remaining;
}

function laneScore(lane: PushLane, pushPower: number, mainLane: Lane | undefined): number {
  let score = (lane.waveAtTarget ? 2 : 1) + (1 - lane.targetHpRatio);
  score -= (lane.enemyPower / Math.max(pushPower, 1)) * 2;
  if (lane.lane === mainLane) {
    score += MAIN_LANE_INERTIA;
  }
  return score;
}

function assignPush(input: PlanInput, free: PlanBot[], tasks: Map<number, Task>): Lane | undefined {
  if (free.length === 0 || input.lanes.length === 0) {
    return input.mainLane;
  }
  const pushPower = free.reduce((sum, bot) => sum + bot.power, 0);
  const ranked = [...input.lanes].sort(
    (a, b) => laneScore(b, pushPower, input.mainLane) - laneScore(a, pushPower, input.mainLane),
  );
  const strategy = pickStrategy(input.ourPower, input.enemyPower);

  if (strategy === 'advantage' || ranked.length === 1) {
    for (const bot of free) {
      tasks.set(bot.id, pushTask(ranked[0]));
    }
    return ranked[0].lane;
  }

  if (strategy === 'even') {
    const main = ranked[0];
    const mainCount = Math.ceil(free.length * EVEN_MAIN_SHARE);
    const toMain = byDistance(free, main.stagingPos).slice(0, mainCount);
    const mainIds = new Set(toMain.map((bot) => bot.id));
    for (const bot of toMain) {
      tasks.set(bot.id, pushTask(main));
    }
    spread(
      free.filter((bot) => !mainIds.has(bot.id)),
      ranked.slice(1),
      tasks,
    );
    return main.lane;
  }

  // 劣势时去玩家不在的几路分推，逼玩家来回跑；每路都有玩家时退而求其次挑敌方最弱的一路
  const perLanePower = pushPower / ranked.length;
  let empty = ranked.filter((lane) => lane.enemyPower <= perLanePower * LANE_PRESENCE_RATIO);
  if (empty.length === 0) {
    empty = [[...ranked].sort((a, b) => a.enemyPower - b.enemyPower)[0]];
  }
  spread(free, empty, tasks);
  return undefined;
}

/** 平均分到几路，已经在某一路推进的 bot 优先留在原路。 */
function spread(bots: PlanBot[], lanes: PushLane[], tasks: Map<number, Task>): void {
  if (lanes.length === 0) {
    return;
  }
  const capacity = Math.ceil(bots.length / lanes.length);
  const counts = new Map<Lane, number>();
  const pending: PlanBot[] = [];
  for (const bot of bots) {
    const stay = lanes.find((lane) => lane.lane === bot.previous?.lane);
    if (bot.previous?.kind === 'push' && stay && (counts.get(stay.lane) ?? 0) < capacity) {
      counts.set(stay.lane, (counts.get(stay.lane) ?? 0) + 1);
      tasks.set(bot.id, pushTask(stay));
    } else {
      pending.push(bot);
    }
  }
  for (const bot of pending) {
    const open = lanes.filter((lane) => (counts.get(lane.lane) ?? 0) < capacity);
    const choices = open.length > 0 ? open : lanes;
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

function pushTask(lane: PushLane): Task {
  return { kind: 'push', pos: lane.stagingPos, targetId: lane.targetId, lane: lane.lane };
}
