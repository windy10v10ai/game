import { Point } from '../team/lane-geometry';

export function retreatPointFromDanger(
  origin: Point,
  danger: Point,
  fallback: Point,
  distance: number,
): Point {
  let dx = origin.x - danger.x;
  let dy = origin.y - danger.y;
  let length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) {
    dx = fallback.x - danger.x;
    dy = fallback.y - danger.y;
    length = Math.sqrt(dx * dx + dy * dy);
  }
  if (length < 1) {
    return origin;
  }
  return {
    x: origin.x + (dx / length) * distance,
    y: origin.y + (dy / length) * distance,
  };
}
