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
    if (group === undefined) {
      return picked;
    }
    const owned = this.getHeroAbilityNames(hero);
    if (!group.some((n) => n !== picked.name && owned.includes(n))) {
      return picked;
    }
    const excluded = [...excludedNames, ...owned, picked.name];
    this.addMutuallyExclusiveNames(excluded);

    // 不走按档位概率表的 getRandomAbilities：单档数组会让概率表下标越界
    const pickedTier = tiers.find((t) => t.level === picked.level);
    const candidates: LotteryDto[] = [];
    const collect = (tier: Tier) => {
      for (const name of tier.names) {
        if (!excluded.includes(name)) {
          candidates.push({ name, level: tier.level });
        }
      }
    };
    if (pickedTier) {
      collect(pickedTier);
    }
    // 同档挑不出时退到全部档位，保证玩家一定拿到技能
    if (candidates.length === 0) {
      tiers.forEach(collect);
    }
    if (candidates.length === 0) {
      print('[Lottery] no replacement for conflicting pick ' + picked.name);
      return picked;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private static getHeroAbilityNames(hero: CDOTA_BaseNPC_Hero): string[] {
    const names: string[] = [];
    for (let i = 0; i < hero.GetAbilityCount(); i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (ability) {
        names.push(ability.GetAbilityName());
      }
    }
    return names;
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
      executedNames.push(...this.getHeroAbilityNames(currentHero));
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
