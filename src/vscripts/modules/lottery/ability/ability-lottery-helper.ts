import { LotteryDto } from '../../../../common/dto/lottery';
import { pickRandomTierByRate } from '../shared/random-tier';
import { Tier } from '../shared/tier';

export class AbilityLotteryHelper {
  private static readonly BASE_TIER_RATES = [1, 5, 20, 60, 100];
  private static readonly PREMIUM_TIER_RATES = [5, 25, 60, 100, 100];

  private static getRandomLotteryDto(tiers: Tier[], isHighTier: boolean = false): LotteryDto {
    const rates = isHighTier ? this.PREMIUM_TIER_RATES : this.BASE_TIER_RATES;
    const tier = pickRandomTierByRate(tiers, rates);
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    return { name, level: tier.level };
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
    const maxAttempts = 10;
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
