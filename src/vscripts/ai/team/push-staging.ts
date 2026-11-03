const WAVE_AT_TARGET_DISTANCE = 900;
const WAIT_OUTSIDE_TOWER = 1100;
const STAGING_AHEAD = 800;

// 越过敌方最前面那座建筑这么远，就算越过了还没推掉的塔
export const FRONT_MARGIN = 400;
// 外塔推完后追到四塔附近：四塔前面留这么多，正好落在射程边缘
const TIER4_CHASE_GAP = 300;

export interface PushStaging {
  waveAtTarget: boolean;
  stagingForward: number;
}

export function resolvePushStaging(
  front: number,
  targetForward: number,
  backdoorProtected: boolean,
): PushStaging {
  const waveAtTarget = !backdoorProtected && front >= targetForward - WAVE_AT_TARGET_DISTANCE;
  return {
    waveAtTarget,
    stagingForward: waveAtTarget
      ? targetForward
      : Math.min(front + STAGING_AHEAD, targetForward - WAIT_OUTSIDE_TOWER),
  };
}

export interface ChaseFrontInput {
  /** 本路推进目标的前进进度 */
  targetForward: number;
  /** 本路活着的敌方四塔的前进进度 */
  tier4Forwards: number[];
  /** 本路敌方基地的前进进度，基地不在时为空 */
  baseForward?: number;
  /** 敌方外塔（一塔、二塔）还没推完 */
  outerTowersLeft: boolean;
  /** 本队推掉过敌方三塔 */
  tower3Pushed: boolean;
}

/**
 * 外塔推完后追到哪：三塔都在时到靠外那座四塔附近，任一三塔倒后到基地附近，都不越到基地之后。
 * 外塔还在时就是推进目标本身，不越过没推掉的塔。
 */
export function resolveChaseFront(input: ChaseFrontInput): number {
  if (input.outerTowersLeft) {
    return input.targetForward;
  }
  if (input.tower3Pushed && input.baseForward !== undefined) {
    return Math.max(input.targetForward, input.baseForward - FRONT_MARGIN);
  }
  if (!input.tower3Pushed && input.tier4Forwards.length > 0) {
    return Math.max(
      input.targetForward,
      Math.min(...input.tier4Forwards) - TIER4_CHASE_GAP - FRONT_MARGIN,
    );
  }
  return input.targetForward;
}
