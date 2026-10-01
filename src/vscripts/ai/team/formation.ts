/**
 * 多个 bot 同去一处时的站位：横向拉开、朝着敌人来的方向，近战在前、远程在后或在两翼，
 * 任意两人之间留出一个范围技能打不到两人的间距。只算几何，每人保持在自己原本所在的那一侧，不交叉换位。
 */
import { Point } from './lane-geometry';

export interface FormationMember {
  id: number;
  pos: Point;
  melee: boolean;
}

/** 队友之间至少隔开这么远，常见范围技能一次最多打到两人。 */
export const FORMATION_SPACING = 350;
// 扇形两翼最多展开到正面两侧这么多弧度，再多就绕到敌人身后，排到外圈
const MAX_ARC_ANGLE = (75 * Math.PI) / 180;

/** 横排：近战一排在前、远程一排在后，面朝 facing（单位向量）。 */
export function lineSlots(
  anchor: Point,
  facing: Point,
  members: FormationMember[],
  spacing: number,
): Map<number, Point> {
  const side = { x: -facing.y, y: facing.x };
  const melee = members.filter((member) => member.melee);
  const ranged = members.filter((member) => !member.melee);
  const depth = melee.length > 0 && ranged.length > 0 ? spacing / 2 : 0;
  const slots = new Map<number, Point>();
  const placeRow = (row: FormationMember[], forward: number) => {
    const sorted = sortBy(row, (member) => project(member.pos, anchor, side));
    sorted.forEach((member, index) => {
      const lateral = (index - (sorted.length - 1) / 2) * spacing;
      slots.set(member.id, {
        x: anchor.x + facing.x * forward + side.x * lateral,
        y: anchor.y + facing.y * forward + side.y * lateral,
      });
    });
  };
  placeRow(melee, depth);
  placeRow(ranged, -depth);
  return slots;
}

/** 扇形：围着 center 排在 facing（单位向量，指向我方）一侧，近战占正面，远程往两翼排。 */
export function arcSlots(
  center: Point,
  facing: Point,
  members: FormationMember[],
  radius: number,
  spacing: number,
): Map<number, Point> {
  const angles: { angle: number; radius: number }[] = [];
  let ring = radius;
  let step = arcStep(ring, spacing);
  let index = 0;
  while (angles.length < members.length) {
    const offset = Math.ceil(index / 2) * step * (index % 2 === 1 ? 1 : -1);
    if (Math.abs(offset) > MAX_ARC_ANGLE) {
      ring += spacing;
      step = arcStep(ring, spacing);
      index = 0;
      continue;
    }
    angles.push({ angle: offset, radius: ring });
    index++;
  }
  const melee = members.filter((member) => member.melee);
  const ranged = members.filter((member) => !member.melee);
  const slots = new Map<number, Point>();
  const place = (group: FormationMember[], spots: { angle: number; radius: number }[]) => {
    const sortedMembers = sortBy(group, (member) => angleOf(member.pos, center, facing));
    const sortedSpots = sortBy(spots, (spot) => spot.angle);
    sortedMembers.forEach((member, i) => {
      const spot = sortedSpots[i];
      const direction = rotate(facing, spot.angle);
      slots.set(member.id, {
        x: center.x + direction.x * spot.radius,
        y: center.y + direction.y * spot.radius,
      });
    });
  };
  place(melee, angles.slice(0, melee.length));
  place(ranged, angles.slice(melee.length));
  return slots;
}

function arcStep(radius: number, spacing: number): number {
  return 2 * Math.asin(Math.min(1, spacing / (2 * radius)));
}

function project(pos: Point, origin: Point, axis: Point): number {
  return (pos.x - origin.x) * axis.x + (pos.y - origin.y) * axis.y;
}

function angleOf(pos: Point, center: Point, facing: Point): number {
  const x = pos.x - center.x;
  const y = pos.y - center.y;
  return Math.atan2(facing.x * y - facing.y * x, facing.x * x + facing.y * y);
}

function rotate(vector: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
}

// 先算好键再排，比较时现算的浮点误差会让 Lua 的排序报错
function sortBy<T>(items: T[], key: (item: T) => number): T[] {
  const keys = new Map<T, number>();
  items.forEach((item) => keys.set(item, key(item)));
  return [...items].sort((a, b) => keys.get(a)! - keys.get(b)!);
}
