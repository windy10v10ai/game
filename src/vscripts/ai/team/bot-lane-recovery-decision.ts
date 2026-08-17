export type BotLane = 'top' | 'mid' | 'bot';

export type BotLaneRecoveryReason = 'lane' | 'jungle';

export interface BotLaneRecoveryDecisionInput {
  enemyLane: BotLane | undefined;
  hasFriendlyLaneCreep: boolean;
  distanceToLaneTower: number | undefined;
  hasNearbyNeutral: boolean;
  /** 己方是否还保有一塔或二塔 */
  hasFrontTower: boolean;
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

// lane 量的是该路防御塔，jungle 量的是最近的己方防御塔
const LANE_TRIGGER_TOWER_DISTANCE = 4000;
const JUNGLE_TRIGGER_TOWER_DISTANCE = 2000;

export function resolveBotLaneRecovery(
  input: BotLaneRecoveryDecisionInput,
): BotLaneRecoveryDecision | undefined {
  if (
    input.enemyLane !== undefined &&
    !input.hasFriendlyLaneCreep &&
    input.distanceToLaneTower !== undefined &&
    input.distanceToLaneTower > LANE_TRIGGER_TOWER_DISTANCE
  ) {
    return { reason: 'lane', lane: input.enemyLane };
  }

  // x + y > 0 为地图对角线右上侧的夜魇半区，bot 在天辉野区时不回线
  if (
    input.hasNearbyNeutral &&
    input.hasFrontTower &&
    input.heroPositionX + input.heroPositionY > 0 &&
    input.distanceToNearestTower !== undefined &&
    input.distanceToNearestTower > JUNGLE_TRIGGER_TOWER_DISTANCE
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
