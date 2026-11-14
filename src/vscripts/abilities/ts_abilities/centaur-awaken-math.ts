/** 半人马战行者觉醒的纯计算：反击之力的窗口累计与上限、护盾量与合并 */

export interface CentaurDamageSample {
  time: number;
  damage: number;
}

/** 只留仍在窗口内的样本 */
export function filterRecentDamage(
  samples: readonly CentaurDamageSample[],
  currentTime: number,
  windowSeconds: number,
): CentaurDamageSample[] {
  const earliestTime = currentTime - windowSeconds;
  return samples.filter((sample) => sample.time >= earliestTime);
}

export function sumRecentDamage(
  samples: readonly CentaurDamageSample[],
  currentTime: number,
  windowSeconds: number,
): number {
  let total = 0;
  for (const sample of filterRecentDamage(samples, currentTime, windowSeconds)) {
    total += sample.damage;
  }
  return total;
}

export function calculateNormalDoubleEdgeDamage(
  baseDamage: number,
  strength: number,
  strengthDamagePct: number,
): number {
  return baseDamage + (strength * strengthDamagePct) / 100;
}

/** 反击之力：窗口内承伤按比例转化，不超过普通双刃剑伤害的上限百分比 */
export function calculateStoredDamage(
  recentDamage: number,
  conversionPct: number,
  normalDamage: number,
  capPct: number,
): number {
  return Math.min((recentDamage * conversionPct) / 100, (normalDamage * capPct) / 100);
}

export function calculateShieldAmount(consumedDamage: number, shieldPct: number): number {
  return (consumedDamage * shieldPct) / 100;
}

/** 再次获得护盾时取较大值，不叠加 */
export function mergeShieldAmount(remainingShield: number, newShield: number): number {
  return Math.max(remainingShield, newShield);
}
