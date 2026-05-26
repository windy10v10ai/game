import { LotteryDto } from '../../../../common/dto/lottery';
import { pickRandomTierByRate } from '../shared/random-tier';
import { itemTiers } from './lottery-items';

export enum ItemLotteryPool {
  INITIAL = 'initial', // 开局点位：屏蔽 T5/T4，避开引擎全价卖出窗口
  DEFAULT = 'default', // 普通藏宝箱
  PREMIUM = 'premium', // 后期 / 肉山 / 会员：高 tier 加权
}

const POOL_RATES: Record<ItemLotteryPool, number[]> = {
  // 累计阈值 [T5, T4, T3, T2, T1]
  [ItemLotteryPool.INITIAL]: [0, 0, 10, 50, 100],
  [ItemLotteryPool.DEFAULT]: [1, 5, 20, 60, 100],
  [ItemLotteryPool.PREMIUM]: [5, 25, 60, 100, 100],
};

export class ItemLotteryHelper {
  static getRandomItems(
    count: number,
    pool: ItemLotteryPool = ItemLotteryPool.DEFAULT,
  ): LotteryDto[] {
    const rates = POOL_RATES[pool];
    const results: LotteryDto[] = [];
    const picked = new Set<string>();
    const maxAttempts = 10;
    for (let i = 0; i < count; i++) {
      let candidate: LotteryDto = { name: 'item_branches', level: 1 };
      let attempts = 0;
      do {
        const tierRow = pickRandomTierByRate(itemTiers, rates);
        const name = tierRow.names[Math.floor(Math.random() * tierRow.names.length)];
        candidate = { name, level: tierRow.level };
        attempts++;
      } while (picked.has(candidate.name) && attempts < maxAttempts);
      picked.add(candidate.name);
      results.push(candidate);
    }
    return results;
  }
}
