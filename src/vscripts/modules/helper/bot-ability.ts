import { abilityTiersPassiveBot } from '../lottery/lottery-abilities-bot';
import { LotteryHelper } from '../lottery/lottery-helper';

export class BotAbility {
  // 每5级升级一次
  static readonly upgradeIntervalBotPower = 5;
  static readonly upgradeIntervalBotPassive = 10;

  // 存储每个bot的被动技能名称
  private static botPassiveAbilities: Map<number, string> = new Map();

  /**
   * 为bot添加技能
   */
  public static AddBotAbility(hero: CDOTA_BaseNPC_Hero): void {
    this.AddBotPower(hero);
    this.AddPassiveAbilityForBot(hero);
  }

  /**
   * 为bot添加随机被动技能
   */
  private static AddPassiveAbilityForBot(currentHero: CDOTA_BaseNPC_Hero): void {
    const isHighTier = GameRules.Option.direGoldXpMultiplier >= 9;
    const results = LotteryHelper.getRandomAbilities(
      abilityTiersPassiveBot,
      1,
      currentHero,
      [],
      isHighTier,
    );
    const abilityName = results[0].name;
    print(
      `[BotAbility] AddRandomPassiveAbilityForBot ${currentHero.GetName()}, ability: ${abilityName}, level: ${results[0].level}`,
    );
    currentHero.AddAbility(abilityName);

    // 记录bot的被动技能名称
    const heroIndex = currentHero.GetEntityIndex();
    this.botPassiveAbilities.set(heroIndex, abilityName);

    // 将bot被动技能信息设置到net table，供结算界面显示
    const playerId = currentHero.GetPlayerOwnerID();
    CustomNetTables.SetTableValue('bot_passive_abilities', playerId.toString(), {
      abilityName: abilityName,
    });
  }

  /**
   * 为bot添加bot_power_n6
   */
  private static AddBotPower(hero: CDOTA_BaseNPC_Hero): void {
    if (GameRules.Option.direGoldXpMultiplier >= 9) {
      // N6添加
      if (!hero.HasAbility('bot_power_n6')) {
        hero.AddAbility('bot_power_n6');
      }
    }
  }

  /**
   * 升级bot所有技能
   */
  public static LevelUpBotAbility(hero: CDOTA_BaseNPC_Hero): void {
    this.LevelUpBotPassiveAbility(hero);
    this.LevelUpBotPower(hero);
  }

  /**
   * 通用的技能升级方法
   */
  private static UpgradeAbilityToLevel(
    ability: CDOTABaseAbility | undefined,
    heroLevel: number,
    upgradeInterval: number,
  ): boolean {
    if (ability === undefined) {
      return false;
    }

    const expectedLevel = Math.floor(heroLevel / upgradeInterval);
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
   */
  private static LevelUpBotPassiveAbility(hero: CDOTA_BaseNPC_Hero): void {
    const heroIndex = hero.GetEntityIndex();
    const passiveAbilityName = this.botPassiveAbilities.get(heroIndex);

    if (!passiveAbilityName) {
      return;
    }

    const ability = hero.FindAbilityByName(passiveAbilityName);
    this.UpgradeAbilityToLevel(ability, hero.GetLevel(), this.upgradeIntervalBotPassive);
  }

  /**
   * 为bot升级bot_power_n6
   */
  private static LevelUpBotPower(hero: CDOTA_BaseNPC_Hero): void {
    // find bot_power_n6
    const ability = hero.FindAbilityByName('bot_power_n6');
    this.UpgradeAbilityToLevel(ability, hero.GetLevel(), this.upgradeIntervalBotPower);
  }
}
