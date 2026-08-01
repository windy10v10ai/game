/** bot 插眼的判定逻辑。输入全部由适配层采集后传入，不查询引擎。 */

import type { WardTypeConfig } from './ward-position-config';

/** 一律用平面距离：高台眼位的 z 差异不应影响施法距离与去重 */
export function hasPointWithin(center: Vector, points: readonly Vector[], radius: number): boolean {
  for (const point of points) {
    if (point.__sub(center).Length2D() <= radius) {
      return true;
    }
  }
  return false;
}

/**
 * castRange 内且附近没有己方同类眼的全部预设眼位，由调用方随机取一个。
 * 返回全集而非首个命中，是为了消除旧实现「永远偏向眼位表表头」的偏差。
 */
export function findAvailableCandidates(
  heroPos: Vector,
  positions: readonly Vector[],
  castRange: number,
  existingWards: readonly Vector[],
  sameWardRadius: number,
): Vector[] {
  const available: Vector[] = [];
  for (const position of positions) {
    if (position.__sub(heroPos).Length2D() > castRange) {
      continue;
    }
    if (hasPointWithin(position, existingWards, sameWardRadius)) {
      continue;
    }
    available.push(position);
  }
  return available;
}

export interface GroundPlacementInput {
  heroPos: Vector;
  config: WardTypeConfig;
  existingWards: readonly Vector[];
  friendTowers: readonly Vector[];
  friendForts: readonly Vector[];
  enemyTowers: readonly Vector[];
  inNoCastZone: boolean;
}

/** 脚下插眼须过全部范围条件，与预设眼位只查同类眼去重相对 */
export function canPlaceAtHeroPosition(input: GroundPlacementInput): boolean {
  if (input.inNoCastZone) {
    return false;
  }
  const config = input.config;
  if (hasPointWithin(input.heroPos, input.existingWards, config.sameWardRadius)) {
    return false;
  }
  if (hasPointWithin(input.heroPos, input.friendTowers, config.friendTowerRadius)) {
    return false;
  }
  if (hasPointWithin(input.heroPos, input.friendForts, config.friendFortRadius)) {
    return false;
  }
  if (hasPointWithin(input.heroPos, input.enemyTowers, config.enemyTowerRadius)) {
    return false;
  }
  return true;
}
