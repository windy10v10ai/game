import { abilityTiersPassive } from '../lottery/lottery-abilities';
import { LotteryHelper } from '../lottery/lottery-helper';

export class BotAbility {
  // 每5级升级一次
  static readonly upgradeInterval = 5;

  // 存储每个bot的被动技能名称
  private static botPassiveAbilities: Map<number, string> = new Map();

  public static AddBotAbility(hero: CDOTA_BaseNPC_Hero): void {
    this.AddBotPower(hero);
    this.AddRandomPassiveAbilityForBot(hero);
  }

  /**
   * 为bot添加随机被动技能
   * 使用BASE_TIER_RATES概率从abilityTiersPassive中选择一个技能
   * @param currentHero 当前英雄，用于排除重复技能
   * @param executedNames 已有技能列表，用于排除重复
   * @returns 随机选择的被动技能
   */
  private static AddRandomPassiveAbilityForBot(currentHero: CDOTA_BaseNPC_Hero): void {
    const isHighTier = GameRules.Option.direGoldXpMultiplier >= 9;
    const results = LotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      1,
      currentHero,
      [],
      isHighTier,
    );
    const abilityName = results[0].name;
    print(
      `[BotPower] AddRandomPassiveAbilityForBot ${currentHero.GetName()}, ability: ${abilityName}, level: ${results[0].level}`,
    );
    currentHero.AddAbility(abilityName);

    // 记录bot的被动技能名称
    const heroIndex = currentHero.GetEntityIndex();
    this.botPassiveAbilities.set(heroIndex, abilityName);
  }

  /**
   * 为bot添加bot_power_n5或bot_power_n6
   * @param hero 当前英雄
   */
  private static AddBotPower(hero: CDOTA_BaseNPC_Hero): void {
    if (GameRules.Option.direGoldXpMultiplier >= 9) {
      // N6添加
      if (!hero.HasAbility('bot_power_n6')) {
        hero.AddAbility('bot_power_n6');
      }
    } else if (GameRules.Option.direGoldXpMultiplier >= 7) {
      // N5添加
      if (!hero.HasAbility('bot_power_n5')) {
        hero.AddAbility('bot_power_n5');
      }
    }
  }

  public static LevelUpBotAbility(hero: CDOTA_BaseNPC_Hero): void {
    this.LevelUpBotPower(hero);
    this.LevelUpBotPassiveAbility(hero);
  }

  /**
   * 通用的技能升级方法
   * @param ability 要升级的技能
   * @param heroLevel 英雄等级
   * @returns 是否成功升级
   */
  private static UpgradeAbilityToLevel(
    ability: CDOTABaseAbility | undefined,
    heroLevel: number,
  ): boolean {
    if (!ability) {
      return false;
    }

    const expectedLevel = Math.floor(heroLevel / this.upgradeInterval);
    const abilityLevel = ability.GetLevel();
    const maxLevel = ability.GetMaxLevel();

    // 如果技能已经达到最大等级，则不升级
    if (abilityLevel >= maxLevel) {
      return false;
    }

    if (expectedLevel > abilityLevel) {
      // 确保不超过最大等级
      const targetLevel = Math.min(expectedLevel, maxLevel);
      ability.SetLevel(targetLevel);
      return true;
    }

    return false;
  }

  /**
   * 为bot升级被动技能
   * @param hero 当前英雄
   */
  private static LevelUpBotPassiveAbility(hero: CDOTA_BaseNPC_Hero): void {
    const heroIndex = hero.GetEntityIndex();
    const passiveAbilityName = this.botPassiveAbilities.get(heroIndex);

    if (!passiveAbilityName) {
      return;
    }

    const ability = hero.FindAbilityByName(passiveAbilityName);
    this.UpgradeAbilityToLevel(ability, hero.GetLevel());
  }

  /**
   * 为bot升级bot_power_n5或bot_power_n6
   * @param hero 当前英雄
   */
  private static LevelUpBotPower(hero: CDOTA_BaseNPC_Hero): void {
    // find bot_power_n5 or bot_power_n6
    let ability = hero.FindAbilityByName('bot_power_n5');
    if (!ability) {
      ability = hero.FindAbilityByName('bot_power_n6');
    }

    this.UpgradeAbilityToLevel(ability, hero.GetLevel());
  }
}
