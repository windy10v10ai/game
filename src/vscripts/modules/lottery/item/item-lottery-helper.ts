import { LotteryDto } from '../../../../common/dto/lottery';
import { pickRandomTierByRate } from '../shared/random-tier';
import { itemTiers } from './lottery-items';

export class ItemLotteryHelper {
  // 累计阈值 [T5, T4, T3, T2, T1]
  private static readonly TIER_RATES_DEFAULT = [1, 5, 20, 60, 100];
  // INITIAL 点位屏蔽 T5/T4，避开引擎开局 30s 全价卖出窗口
  private static readonly TIER_RATES_INITIAL = [0, 0, 20, 60, 100];

  static getRandomItems(count: number, isInitial = false): LotteryDto[] {
    const rates = isInitial ? this.TIER_RATES_INITIAL : this.TIER_RATES_DEFAULT;
    const results: LotteryDto[] = [];
    const picked = new Set<string>();
    const maxAttempts = 10;
    for (let i = 0; i < count; i++) {
      let candidate: LotteryDto = { name: 'item_branches', level: 1 };
      let attempts = 0;
      do {
        const tier = pickRandomTierByRate(itemTiers, rates);
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
