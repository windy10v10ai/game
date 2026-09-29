/** 位移落点：赶路与撤退跳满距离，切入跳到能打到目标的位置。 */

import { Point } from '../team/lane-geometry';

// 算出来的位移距离比这还短时多半没读到真实距离，不用
const MIN_RANGE = 600;
// 离目标比这还近时跳一下省不了什么，留着
const ENGAGE_MIN_GAP = 500;

function along(here: Point, dx: number, dy: number, length: number, distance: number): Point {
  return { x: here.x + (dx * length) / distance, y: here.y + (dy * length) / distance };
}

/** 朝目的地位移满距离的落点；剩下的路不够位移一次满距离时不交，留给切入或逃跑。 */
export function landingToward(here: Point, destination: Point, range: number): Point | undefined {
  const dx = destination.x - here.x;
  const dy = destination.y - here.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (range < MIN_RANGE || distance < range) {
    return undefined;
  }
  return along(here, dx, dy, range, distance);
}

/** 切入落点：近战落在目标身上，远程落在离目标 standOff 处，不贴脸送；够不着或已经够近时不跳。 */
export function engageLanding(
  here: Point,
  target: Point,
  range: number,
  standOff: number,
): Point | undefined {
  const dx = target.x - here.x;
  const dy = target.y - here.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const gap = distance - standOff;
  if (gap < ENGAGE_MIN_GAP || gap > range) {
    return undefined;
  }
  return along(here, dx, dy, gap, distance);
}
