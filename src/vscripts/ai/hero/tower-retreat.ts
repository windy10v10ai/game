import { Point } from '../team/lane-geometry';

function gap(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

function unit(dx: number, dy: number): Point {
  const length = Math.sqrt(dx * dx + dy * dy);
  return length < 1 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
}

/**
 * 退出塔区的落脚点：同时背离附近每一座危险的塔，再偏向自家泉水。
 * 只背离一座塔时，夹在两座塔中间会被两边来回赶，走不出去。
 */
export function retreatPointFromTowers(
  origin: Point,
  towers: Point[],
  fountain: Point,
  distance: number,
): Point {
  let dx = 0;
  let dy = 0;
  for (const tower of towers) {
    const away = unit(origin.x - tower.x, origin.y - tower.y);
    dx += away.x;
    dy += away.y;
  }
  const home = unit(fountain.x - origin.x, fountain.y - origin.y);
  let direction = unit(dx + home.x, dy + home.y);
  if (direction.x === 0 && direction.y === 0) {
    direction = home;
  }
  return { x: origin.x + direction.x * distance, y: origin.y + direction.y * distance };
}

// 越塔抓人时，打死目标的时间要比塔打死一个队友的时间短出这一截，追击走位与技能前摇都要时间
const DIVE_MARGIN = 1.5;

export interface TowerDiveInput {
  /** 塔下敌方英雄合计的有效血量 */
  enemyHealth: number;
  /** 一起越塔的我方合计输出 */
  teamDps: number;
  /** 附近敌方塔合计的输出 */
  towerDps: number;
  /** 越塔的人平均有效血量，塔一次只打一个人 */
  diverHealth: number;
}

/** 越塔抓人：在塔打死一个队友之前就能把人打死才值得，人多输出高就敢越，塔太强就不去。 */
export function canDiveTower(input: TowerDiveInput): boolean {
  if (input.teamDps <= 0) {
    return false;
  }
  if (input.towerDps <= 0) {
    return true;
  }
  return (input.enemyHealth / input.teamDps) * DIVE_MARGIN <= input.diverHealth / input.towerDps;
}

// 扛塔的时间要比塔倒的时间多出这一截，普攻有空档、塔血估算也有误差
const OUTLAST_MARGIN = 1.2;

export interface TowerOutlastInput {
  heroHealth: number;
  /** 扛到只剩这么多血就该走，留给撤出射程 */
  heroReserve: number;
  towerDpsOnHero: number;
  towerHealth: number;
  /** 塔下我方英雄一起打塔的普攻输出 */
  teamDpsOnTower: number;
}

/** 顶着塔打：照塔打自己的速度，能撑到塔被打倒才值得，够肉的后期英雄不必兵线一没就走。 */
export function canOutlastTower(input: TowerOutlastInput): boolean {
  if (input.teamDpsOnTower <= 0) {
    return false;
  }
  if (input.towerDpsOnHero <= 0) {
    return true;
  }
  const survive = (input.heroHealth - input.heroReserve) / input.towerDpsOnHero;
  const fall = input.towerHealth / input.teamDpsOnTower;
  return survive >= fall * OUTLAST_MARGIN;
}

/** 去目的地的直线是否穿过这座塔周围这么大的范围。 */
export function passesTower(
  origin: Point,
  destination: Point,
  tower: Point,
  radius: number,
): boolean {
  const sx = destination.x - origin.x;
  const sy = destination.y - origin.y;
  const lengthSquared = sx * sx + sy * sy;
  if (lengthSquared < 1) {
    return false;
  }
  const t = ((tower.x - origin.x) * sx + (tower.y - origin.y) * sy) / lengthSquared;
  const clamped = Math.max(0, Math.min(1, t));
  return gap({ x: origin.x + sx * clamped, y: origin.y + sy * clamped }, tower) < radius;
}
