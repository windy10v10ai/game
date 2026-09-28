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

/**
 * 去目的地的直线会穿过这座塔的攻击范围时，先绕到塔靠自家一侧的外圈。
 * 直接走过去会被塔打回来，退出去再走又被打回来，一直在塔边打转。
 */
export function detourAroundTower(
  origin: Point,
  destination: Point,
  tower: Point,
  radius: number,
  fountain: Point,
): Point | undefined {
  const sx = destination.x - origin.x;
  const sy = destination.y - origin.y;
  const lengthSquared = sx * sx + sy * sy;
  if (lengthSquared < 1) {
    return undefined;
  }
  const t = ((tower.x - origin.x) * sx + (tower.y - origin.y) * sy) / lengthSquared;
  if (t <= 0 || t >= 1) {
    return undefined;
  }
  const closest = { x: origin.x + sx * t, y: origin.y + sy * t };
  if (gap(closest, tower) >= radius) {
    return undefined;
  }
  const side = unit(-sy, sx);
  const left = { x: tower.x + side.x * radius, y: tower.y + side.y * radius };
  const right = { x: tower.x - side.x * radius, y: tower.y - side.y * radius };
  const leftGap = gap(left, fountain);
  const rightGap = gap(right, fountain);
  return leftGap <= rightGap ? left : right;
}
