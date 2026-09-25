/** 团队任务分派：按回复 → 防守 → 支援 → 推进的顺序把每个 bot 分到一个带目的地的任务。 */
import { distance, Lane, Point } from './lane-geometry';

export type TaskKind = 'recover' | 'defend' | 'support' | 'push' | 'hold';

export interface Task {
  kind: TaskKind;
  pos: Point;
  /** 防守的建筑、支援的英雄或推进的目标建筑 */
  targetId?: number;
  lane?: Lane;
}

export interface PlanBot {
  id: number;
  pos: Point;
  power: number;
  needsRecover: boolean;
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

export interface SupportTarget {
  id: number;
  pos: Point;
  enemyPower: number;
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
  support: SupportTarget[];
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
const SUPPORT_RANGE = 3000;
const SUPPORT_MAX_HELPERS = 3;
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
  free = assignSupport(input, free, tasks);
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

function assignSupport(input: PlanInput, free: PlanBot[], tasks: Map<number, Task>): PlanBot[] {
  const targets = [...input.support].sort((a, b) => b.enemyPower - a.enemyPower);
  let remaining = free;
  for (const target of targets) {
    let assigned = 0;
    let count = 0;
    const picked = new Set<number>();
    for (const bot of byDistance(remaining, target.pos)) {
      if (bot.id === target.id) {
        continue;
      }
      if (
        assigned >= target.enemyPower ||
        count >= SUPPORT_MAX_HELPERS ||
        distance(bot.pos, target.pos) > SUPPORT_RANGE
      ) {
        break;
      }
      tasks.set(bot.id, { kind: 'support', pos: target.pos, targetId: target.id });
      picked.add(bot.id);
      assigned += bot.power;
      count++;
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
