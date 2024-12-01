import { LotteryDto } from '../../../common/dto/lottery';
import { abilityTiers } from './lottery-abilities';
import { itemTiers } from './lottery-items';
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

  private static getRandomLotteryDtos(
    tiers: Tier[],
    count: number,
    defaultName: string,
    executedNames: string[] = [],
  ): LotteryDto[] {
    const lotteryResults: LotteryDto[] = [];
    const maxAttempts = 10; // 最大尝试次数，避免无限循环
    for (let i = 0; i < count; i++) {
      let lotteryDto = { name: defaultName, level: 1 };
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

  static getRandomItems(count: number): LotteryDto[] {
    const defaultName = 'item_branches';
    return this.getRandomLotteryDtos(itemTiers, count, defaultName);
  }

  static getRandomAbilities(
    count: number,
    currentHero: CDOTA_BaseNPC_Hero | undefined,
  ): LotteryDto[] {
    // 获取英雄的技能
    const heroAbilities: string[] = [];
    if (currentHero) {
      for (let i = 0; i < currentHero.GetAbilityCount(); i++) {
        const ability = currentHero.GetAbilityByIndex(i);
        if (ability) {
          heroAbilities.push(ability.GetAbilityName());
        }
      }
    }
    const defaultName = 'earthshaker_aftershock';
    return this.getRandomLotteryDtos(abilityTiers, count, defaultName, heroAbilities);
  }
}
