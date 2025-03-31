import { LotteryDto } from '../../../common/dto/lottery';
import { Tier } from './tier';

export class LotteryHelper {
  // 基础概率设置（5-1级）
  private static readonly BASE_TIER_RATES = [1, 5, 20, 60, 100];

  // 高级会员概率设置（5-1级）
  private static readonly PREMIUM_TIER_RATES = [1, 10, 30, 60, 100];

  private static getRandomTier(tiers: Tier[]): Tier {
    const random = RandomInt(1, 100);

    // 根据概率选择等级
    for (let i = 0; i < this.BASE_TIER_RATES.length; i++) {
      if (random <= this.BASE_TIER_RATES[i]) {
        return tiers[i];
      }
    }

    return tiers[tiers.length - 1];
  }

  private static getRandomHighTier(tiers: Tier[]): Tier {
    const random = RandomInt(1, 100);

    // 根据概率选择等级
    for (let i = 0; i < this.PREMIUM_TIER_RATES.length; i++) {
      if (random <= this.PREMIUM_TIER_RATES[i]) {
        return tiers[i];
      }
    }

    return tiers[tiers.length - 1];
  }

  private static getRandomLotteryDto(tiers: Tier[], isHighTier: boolean = false): LotteryDto {
    const tier = isHighTier ? this.getRandomHighTier(tiers) : this.getRandomTier(tiers);
    print(`tier: ${tier.level}`);
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    const level = tier.level;
    return { name, level };
  }

  static getRandomAbilities(
    tiers: Tier[],
    count: number,
    currentHero: CDOTA_BaseNPC_Hero | undefined,
    executedNames: string[] = [],
    isHighTier: boolean = false,
  ): LotteryDto[] {
    // 排除英雄的重复技能
    if (currentHero) {
      for (let i = 0; i < currentHero.GetAbilityCount(); i++) {
        const ability = currentHero.GetAbilityByIndex(i);
        if (ability) {
          executedNames.push(ability.GetAbilityName());
        }
      }
    }

    const lotteryResults: LotteryDto[] = [];
    const maxAttempts = 10; // 最大尝试次数，避免无限循环
    for (let i = 0; i < count; i++) {
      let lotteryDto = { name: 'earthshaker_aftershock', level: 1 };
      let attempts = 0;
      do {
        lotteryDto = this.getRandomLotteryDto(tiers, isHighTier);
        attempts++;
      } while (executedNames.includes(lotteryDto.name) && attempts < maxAttempts);
      lotteryResults.push(lotteryDto);
      executedNames.push(lotteryDto.name);
    }
    return lotteryResults;
  }
}
