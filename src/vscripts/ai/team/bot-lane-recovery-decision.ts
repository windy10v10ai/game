export type BotLane = 'top' | 'mid' | 'bot';

export type BotLaneRecoveryReason = 'lane' | 'jungle';

export interface BotLaneRecoveryDecisionInput {
  enemyLane: BotLane | undefined;
  hasFriendlyLaneCreep: boolean;
  distanceToLaneTower: number | undefined;
  isAttackingNeutral: boolean;
  isAttackingAncient: boolean;
  distanceToNearestTower: number | undefined;
  heroPositionX: number;
  heroPositionY: number;
}

export interface BotLaneRecoveryDecision {
  reason: BotLaneRecoveryReason;
  lane: BotLane | undefined;
}

export interface BotLaneRecoveryTower<T> {
  value: T;
  lane: BotLane | undefined;
  tier: number;
}

const LANE_RECOVERY_DISTANCE = 4000;
const JUNGLE_RECOVERY_DISTANCE = 1600;

export function resolveBotLaneRecovery(
  input: BotLaneRecoveryDecisionInput,
): BotLaneRecoveryDecision | undefined {
  if (
    input.enemyLane !== undefined &&
    !input.hasFriendlyLaneCreep &&
    input.distanceToLaneTower !== undefined &&
    input.distanceToLaneTower > LANE_RECOVERY_DISTANCE
  ) {
    return { reason: 'lane', lane: input.enemyLane };
  }

  // x + y > 0 为地图对角线右上侧的夜魇半区，bot 在天辉野区时不回线
  if (
    input.isAttackingNeutral &&
    !input.isAttackingAncient &&
    input.heroPositionX + input.heroPositionY > 0 &&
    input.distanceToNearestTower !== undefined &&
    input.distanceToNearestTower > JUNGLE_RECOVERY_DISTANCE
  ) {
    return { reason: 'jungle', lane: undefined };
  }

  return undefined;
}

export function getPreferredRecoveryTowers<T>(
  towers: readonly BotLaneRecoveryTower<T>[],
  lane: BotLane | undefined,
): BotLaneRecoveryTower<T>[] {
  const candidates = getRecoveryTowerCandidates(towers, lane);
  if (candidates.length === 0) {
    return [];
  }

  let lowestTier = candidates[0].tier;
  for (const tower of candidates) {
    lowestTier = Math.min(lowestTier, tower.tier);
  }
  return candidates.filter((tower) => tower.tier === lowestTier);
}

export function getRecoveryTowerCandidates<T>(
  towers: readonly BotLaneRecoveryTower<T>[],
  lane: BotLane | undefined,
): BotLaneRecoveryTower<T>[] {
  const laneTowers =
    lane === undefined ? [...towers] : towers.filter((tower) => tower.lane === lane);
  return laneTowers.length > 0 ? laneTowers : [...towers];
}
