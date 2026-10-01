/**
 * 开塔防：按掉血速度估算塔还能撑几秒，快倒了才开，推得越快开得越早；越重要的建筑留的时间越多。
 * 二塔与兵营开了只是多拖几秒，要有回防的人能在塔防结束前赶到才值得占用冷却。
 */

// 塔防期间建筑无敌的秒数
export const GLYPH_DURATION = 5;
// 只剩一丝血时有人在打就开，掉血速度算不准也不至于看着塔倒
const GLYPH_LAST_HP = 0.1;
// 按建筑档位（外塔 1、二塔 2、高地塔 3、兵营 4、基地塔 5、基地 6）照当前速度几秒内会倒就开
const FALL_SECONDS_BY_TIER = [0, 6, 6, 8, 8, 8, 10];
const NEEDS_DEFENDERS_TIERS = [2, 4];

export interface GlyphInput {
  tier: number;
  hpRatio: number;
  /** 照最近的掉血速度还能撑几秒 */
  fallSeconds: number;
  /** 最近的回防者预计几秒后到，没有人回防为 Infinity */
  defenderEta: number;
}

/** 正在被敌方英雄攻击的建筑此刻是否该开塔防。 */
export function shouldUseGlyph(input: GlyphInput): boolean {
  if (input.hpRatio < GLYPH_LAST_HP) {
    return true;
  }
  if (input.fallSeconds > FALL_SECONDS_BY_TIER[Math.min(input.tier, 6)]) {
    return false;
  }
  if (NEEDS_DEFENDERS_TIERS.includes(input.tier)) {
    return input.defenderEta <= input.fallSeconds + GLYPH_DURATION;
  }
  return true;
}
