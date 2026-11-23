import { LotteryDto } from '../../../../common/dto/lottery';
import { itemTiers, treasuredItems } from './lottery-items';

export enum ItemLotteryPool {
  TREASURED = 'treasured',
  INITIAL = 'initial',
  DEFAULT = 'default',
  PREMIUM = 'premium',
  ULTRA = 'ultra',
}

const POOL_RATES: Record<Exclude<ItemLotteryPool, ItemLotteryPool.TREASURED>, number[]> = {
  [ItemLotteryPool.INITIAL]: [0, 0, 0, 0, 0, 30, 100],
  [ItemLotteryPool.DEFAULT]: [1, 2, 4, 8, 30, 60, 100],
  [ItemLotteryPool.PREMIUM]: [2, 4, 8, 30, 60, 100, 100],
  [ItemLotteryPool.ULTRA]: [4, 10, 16, 40, 100, 100, 100],
};

export class ItemLotteryHelper {
  static getRandomItems(
    count: number,
    pool: ItemLotteryPool = ItemLotteryPool.DEFAULT,
  ): LotteryDto[] {
    const tiers =
      pool === ItemLotteryPool.TREASURED
        ? [{ level: 1, names: [...treasuredItems], weight: 1 }]
        : itemTiers.map(({ level, names }, index) => {
            const rates = POOL_RATES[pool];
            return { level, names: [...names], weight: rates[index] - (rates[index - 1] ?? 0) };
          });
    const results: LotteryDto[] = [];
    for (let index = 0; index < count; index++) {
      const available = tiers.filter((tier) => tier.weight > 0 && tier.names.length > 0);
      if (available.length === 0) break;

      let roll = RandomInt(
        1,
        available.reduce((total, tier) => total + tier.weight, 0),
      );
      for (const tier of available) {
        roll -= tier.weight;
        if (roll > 0) continue;

        const nameIndex = Math.floor(Math.random() * tier.names.length);
        const [name] = tier.names.splice(nameIndex, 1);
        results.push({ name, level: tier.level });
        break;
      }
    }
    return results;
  }
}
