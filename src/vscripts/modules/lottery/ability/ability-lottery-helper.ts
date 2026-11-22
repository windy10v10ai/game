import { LotteryDto } from '../../../../common/dto/lottery';
import { pickRandomTierByRate } from '../shared/random-tier';
import { Tier } from '../shared/tier';

// 7.42 起月刃的弹射是完整攻击，会再触发天生一对的额外攻击，额外攻击又带弹射，命中数不收敛。两个技能是引擎实现，无法在代码里拦截，只能不让同一个英雄同时拥有
const MUTUALLY_EXCLUSIVE_ABILITY_GROUPS: string[][] = [
  ['luna_moon_glaive', 'jakiro_double_trouble', 'jakiro_double_trouble2'],
];

export class AbilityLotteryHelper {
  /**
   * 把 names 里已有技能的互斥技能也加进去，让后续抽取一并排除
   */
  static addMutuallyExclusiveNames(executedNames: string[]): void {
    for (const group of MUTUALLY_EXCLUSIVE_ABILITY_GROUPS) {
      if (group.some((name) => executedNames.includes(name))) {
        for (const name of group) {
          if (!executedNames.includes(name)) {
            executedNames.push(name);
          }
        }
      }
    }
  }

  private static readonly BASE_TIER_RATES = [2, 5, 25, 60, 100];
  private static readonly PREMIUM_TIER_RATES = [5, 25, 60, 100, 100];

  private static getRandomLotteryDto(tiers: Tier[], isHighTier: boolean = false): LotteryDto {
    const rates = isHighTier ? this.PREMIUM_TIER_RATES : this.BASE_TIER_RATES;
    const tier = pickRandomTierByRate(tiers, rates);
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    return { name, level: tier.level };
  }

  /**
   * 候选生成后英雄才拿到互斥技能时（被动书与主抽奖的候选互不知情），选中的技能会凑齐互斥组。
   * 在同档里换一个不冲突的，玩家仍然得到一个技能，书和选择机会都不浪费
   */
  static resolveConflictingPick(
    hero: CDOTA_BaseNPC_Hero,
    picked: LotteryDto,
    tiers: Tier[],
    excludedNames: string[] = [],
  ): LotteryDto {
    const group = MUTUALLY_EXCLUSIVE_ABILITY_GROUPS.find((g) => g.includes(picked.name));
    if (group === undefined || !group.some((n) => n !== picked.name && hero.HasAbility(n))) {
      return picked;
    }
    const sameTier = tiers.filter((t) => t.level === picked.level);
    return this.getRandomAbilities(sameTier.length > 0 ? sameTier : tiers, 1, hero, [
      ...excludedNames,
      picked.name,
    ])[0];
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

    this.addMutuallyExclusiveNames(executedNames);

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
      this.addMutuallyExclusiveNames(executedNames);
    }
    return lotteryResults;
  }
}
