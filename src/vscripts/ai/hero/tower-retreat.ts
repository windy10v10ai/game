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
