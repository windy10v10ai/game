import { LotteryItemCandidate } from '../../../../common/dto/lottery-item';
import { pickRandomTierByRate } from '../shared/random-tier';
import { Tier } from '../shared/tier';
import { itemTiers } from './lottery-items';

export class ItemLotteryHelper {
  // 与 ability 共用同一组阈值，保持珍稀度感观一致
  private static readonly TIER_RATES = [1, 5, 20, 60, 100];

  /**
   * 抽 count 个不重复物品候选。重复 10 次仍重复时直接保留（容忍小池子重叠）。
   */
  static getRandomItems(count: number, tiers: Tier[] = itemTiers): LotteryItemCandidate[] {
    const results: LotteryItemCandidate[] = [];
    const picked = new Set<string>();
    const maxAttempts = 10;
    for (let i = 0; i < count; i++) {
      let candidate: LotteryItemCandidate = { name: 'item_branches', level: 1 };
      let attempts = 0;
      do {
        const tier = pickRandomTierByRate(tiers, this.TIER_RATES);
        const name = tier.names[Math.floor(Math.random() * tier.names.length)];
        candidate = { name, level: tier.level };
        attempts++;
      } while (picked.has(candidate.name) && attempts < maxAttempts);
      picked.add(candidate.name);
      results.push(candidate);
    }
    return results;
  }
}
