/** 兵线几何：由开局时双方防御塔位置拼出每路折线，把地图坐标换算成「沿兵线前进了多少」。 */

export interface Point {
  x: number;
  y: number;
}

export type Lane = 'top' | 'mid' | 'bot';

export const LANES: readonly Lane[] = ['top', 'mid', 'bot'];

/** 一路兵线的折线，从天辉高地一侧排到夜魇高地一侧。 */
export interface LanePath {
  lane: Lane;
  points: Point[];
  length: number;
}

export interface LaneProjection {
  /** 从天辉一端量起的路程 */
  progress: number;
  /** 离折线的垂直距离 */
  offset: number;
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function buildLanePath(lane: Lane, points: Point[]): LanePath {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return { lane, points, length };
}

export function projectOnLane(path: LanePath, point: Point): LaneProjection {
  let best: LaneProjection = { progress: 0, offset: Infinity };
  let walked = 0;
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1];
    const b = path.points[i];
    const segment = distance(a, b);
    let t = 0;
    if (segment > 0) {
      t = ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (segment * segment);
      t = Math.max(0, Math.min(1, t));
    }
    const foot = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const offset = distance(point, foot);
    if (offset < best.offset) {
      best = { progress: walked + segment * t, offset };
    }
    walked += segment;
  }
  return best;
}

export function pointAtProgress(path: LanePath, progress: number): Point {
  let remaining = Math.max(0, Math.min(path.length, progress));
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1];
    const b = path.points[i];
    const segment = distance(a, b);
    if (remaining <= segment || i === path.points.length - 1) {
      const t = segment > 0 ? Math.min(1, remaining / segment) : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= segment;
  }
  return path.points[path.points.length - 1];
}

/** 找离这个点最近的一路；离所有兵线都太远（野区、高地深处）时返回 undefined。 */
export function nearestLane(
  paths: readonly LanePath[],
  point: Point,
  maxOffset: number,
): { path: LanePath; projection: LaneProjection } | undefined {
  let result: { path: LanePath; projection: LaneProjection } | undefined;
  for (const path of paths) {
    const projection = projectOnLane(path, point);
    if (projection.offset > maxOffset) {
      continue;
    }
    if (!result || projection.offset < result.projection.offset) {
      result = { path, projection };
    }
  }
  return result;
}

/**
 * 把「沿兵线前进」统一成己方视角：天辉从 0 往上走，夜魇从另一端往回走。
 * 返回值越大，说明越靠近敌方高地。
 */
export function forwardProgress(path: LanePath, progress: number, isRadiant: boolean): number {
  return isRadiant ? progress : path.length - progress;
}

export function progressFromForward(path: LanePath, forward: number, isRadiant: boolean): number {
  return isRadiant ? forward : path.length - forward;
}

// 找兵线入口时每次往己方退这么远再试
const LANE_ENTRY_STEP = 1000;

/**
 * 直走会穿过敌方塔区时的兵线入口：从出发点在这路上的位置（不超过目的地）往己方一侧退，
 * 取第一个直走过去不被挡的点，再顺着兵线过去。
 */
export function laneEntry(
  path: LanePath,
  from: Point,
  maxForward: number,
  isRadiant: boolean,
  blocked: (point: Point) => boolean,
): Point | undefined {
  const start = forwardProgress(path, projectOnLane(path, from).progress, isRadiant);
  for (let forward = Math.min(start, maxForward); forward >= 0; forward -= LANE_ENTRY_STEP) {
    const point = pointAtProgress(path, progressFromForward(path, forward, isRadiant));
    if (!blocked(point)) {
      return point;
    }
  }
  return undefined;
}
