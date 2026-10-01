/**
 * 抱团推进：平时分路发育推进，敌方英雄大半阵亡且复活还要一阵时，或很久没抱过团时，全队合成一路推一波。
 * 敌人复活回来、或推得够久了就散回分推，两次之间隔一段冷却，保持「偶尔来一波」。
 */

export interface GroupPushState {
  /** 这一波抱团开始的时间，没在抱团时为空 */
  activeSince?: number;
  /** 这之前不再抱团 */
  cooldownUntil: number;
  /** 到这个时间还没抱过团就抱一次 */
  fallbackAt: number;
}

export interface GroupPushInput {
  now: number;
  /** 阵亡敌方英雄的战力占敌方总战力的比例 */
  enemyDownShare: number;
  /** 阵亡敌方英雄里最长的剩余复活时间 */
  longestRespawn: number;
}

// 敌方大半战力阵亡才算打开了缺口
const DOWN_SHARE = 0.5;
// 复活太快时推不了多少，不值得全队集合
const MIN_RESPAWN = 15;
// 敌人复活回来后至少再推这么久，集合一趟不白走
const MIN_SECONDS = 40;
const MAX_SECONDS = 90;
const COOLDOWN_SECONDS = 180;
const FALLBACK_SECONDS = 300;
// 接管后先分路推一阵再考虑抱团
const FIRST_COOLDOWN_SECONDS = 60;

export function startGroupPush(now: number): GroupPushState {
  return { cooldownUntil: now + FIRST_COOLDOWN_SECONDS, fallbackAt: now + FALLBACK_SECONDS };
}

export function updateGroupPush(state: GroupPushState, input: GroupPushInput): GroupPushState {
  const opening = input.enemyDownShare >= DOWN_SHARE && input.longestRespawn >= MIN_RESPAWN;
  if (state.activeSince !== undefined) {
    const elapsed = input.now - state.activeSince;
    const enemyDown = input.enemyDownShare >= DOWN_SHARE;
    if (elapsed < MAX_SECONDS && (enemyDown || elapsed < MIN_SECONDS)) {
      return state;
    }
    return {
      cooldownUntil: input.now + COOLDOWN_SECONDS,
      fallbackAt: input.now + FALLBACK_SECONDS,
    };
  }
  if (input.now >= state.cooldownUntil && (opening || input.now >= state.fallbackAt)) {
    return { ...state, activeSince: input.now };
  }
  return state;
}
