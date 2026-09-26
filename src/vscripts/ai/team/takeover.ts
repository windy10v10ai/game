/** 何时关掉原生 bot、由自定义 AI 接管：对线期结束的信号由推塔、等级、时间三者任一给出。 */

export interface TakeoverInput {
  gameTime: number;
  /** 双方各自被推掉的防御塔数，取较大的一方 */
  towersLost: number;
  midOnly: boolean;
  averageBotLevel: number;
  pushLevel: number;
  direMultiplier: number;
}

// 补刀依赖原生，最早也要等对线进行一段时间
const EARLIEST_TAKEOVER = 5 * 60;
const FALLBACK_BASE_MINUTES = 12;
const FALLBACK_MIN_MINUTES = 8;
const FALLBACK_MAX_MINUTES = 15;
// 倍率每翻一倍，经济与经验快一截，后期提前约两分钟
const FALLBACK_MINUTES_PER_DOUBLE = 2;

export function takeoverFallbackSeconds(direMultiplier: number): number {
  const minutes =
    FALLBACK_BASE_MINUTES -
    (FALLBACK_MINUTES_PER_DOUBLE * Math.log(Math.max(direMultiplier, 1))) / Math.log(2);
  return Math.max(FALLBACK_MIN_MINUTES, Math.min(FALLBACK_MAX_MINUTES, minutes)) * 60;
}

/** 塔越强，bot 需要越高的等级才推得动。中路模式只有一路，更早开始推。 */
export function pushLevelFor(towerPower: number, midOnly: boolean): number {
  let level = 15;
  if (towerPower <= 200) {
    level = 12;
  } else if (towerPower <= 300) {
    level = 13;
  } else if (towerPower <= 400) {
    level = 14;
  }
  return midOnly ? Math.floor(level / 3) : level;
}

export function shouldTakeOver(input: TakeoverInput): boolean {
  if (input.gameTime < EARLIEST_TAKEOVER) {
    return false;
  }
  if (input.towersLost >= (input.midOnly ? 1 : 2)) {
    return true;
  }
  if (input.averageBotLevel >= input.pushLevel) {
    return true;
  }
  return input.gameTime >= takeoverFallbackSeconds(input.direMultiplier);
}
