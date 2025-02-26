import { LotteryDto } from '../../../common/dto/lottery';
import { Tier } from './tier';

export class LotteryHelper {
  private static getRandomTier(tiers: Tier[]): Tier {
    const draw = Math.random() * 100;

    for (const tier of tiers) {
      if (draw <= tier.rate) {
        return tier;
      }
    }
    return tiers[tiers.length - 1];
  }

  private static getRandomLotteryDto(tiers: Tier[]): LotteryDto {
    const tier = this.getRandomTier(tiers);
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    const level = tier.level;
    return { name, level };
  }

  static getRandomAbilities(
    tiers: Tier[],
    count: number,
    currentHero: CDOTA_BaseNPC_Hero | undefined,
    executedNames: string[] = [],
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
        lotteryDto = this.getRandomLotteryDto(tiers);
        attempts++;
      } while (executedNames.includes(lotteryDto.name) && attempts < maxAttempts);
      lotteryResults.push(lotteryDto);
      executedNames.push(lotteryDto.name);
    }
    return lotteryResults;
  }
}
