import { LotteryDto } from '../../../common/dto/lottery';
import { Tier } from './tier';

export class LotteryHelper {
  // 基础概率设置
  private static readonly BASE_TIER_RATES = {
    5: 1, // 1%概率获得5级技能
    4: 5, // 5%概率获得4级技能
    3: 20, // 20%概率获得3级技能
    2: 60, // 60%概率获得2级技能
    1: 100, // 100%概率获得1级技能
  };

  // 高级会员的概率设置
  private static readonly PREMIUM_TIER_RATES = {
    5: 10, // 10%概率获得5级技能
    4: 30, // 30%概率获得4级技能
    3: 60, // 60%概率获得3级技能
  };

  private static getRandomTier(tiers: Tier[]): Tier {
    const draw = Math.random() * 100;

    // 使用基础概率设置
    for (const tier of tiers) {
      const rate = this.BASE_TIER_RATES[tier.level as keyof typeof this.BASE_TIER_RATES] || 0;
      if (draw <= rate) {
        return tier;
      }
    }
    return tiers[tiers.length - 1];
  }

  // TODO 测试
  private static getRandomHighTier(tiers: Tier[]): Tier {
    // 只考虑level 3以上的技能
    const highTiers = tiers.filter((tier) => tier.level >= 3);
    const draw = Math.random() * 100;

    // 使用高级会员的概率设置
    for (const tier of highTiers) {
      const premiumRate =
        this.PREMIUM_TIER_RATES[tier.level as keyof typeof this.PREMIUM_TIER_RATES] || 0;
      if (draw <= premiumRate) {
        return tier;
      }
    }
    return highTiers[highTiers.length - 1];
  }

  private static getRandomLotteryDto(tiers: Tier[], isHighTier: boolean = false): LotteryDto {
    const tier = isHighTier ? this.getRandomHighTier(tiers) : this.getRandomTier(tiers);
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
