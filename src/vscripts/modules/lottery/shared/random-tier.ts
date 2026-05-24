import { Tier } from './tier';

/**
 * 按 rates 累计阈值从 tiers 中随机挑一档。
 * rates 长度需与 tiers 一致，元素为 [1,100] 的累计阈值（如 [1,5,20,60,100]）。
 */
export function pickRandomTierByRate(tiers: Tier[], rates: number[]): Tier {
  const random = RandomInt(1, 100);
  for (let i = 0; i < rates.length; i++) {
    if (random <= rates[i]) {
      return tiers[i];
    }
  }
  return tiers[tiers.length - 1];
}
