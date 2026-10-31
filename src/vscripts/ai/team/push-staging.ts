const WAVE_AT_TARGET_DISTANCE = 900;
const WAIT_OUTSIDE_TOWER = 1100;
const STAGING_AHEAD = 800;

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
