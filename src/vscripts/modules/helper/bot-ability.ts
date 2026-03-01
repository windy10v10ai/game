import { abilityTiersPassiveBot } from '../lottery/lottery-abilities-bot';
import { LotteryHelper } from '../lottery/lottery-helper';
import { GetBotBuildConfig } from './bot-build-config';

export class BotAbility {
  // 每5级升级一次
  static readonly upgradeIntervalBotPower = 5;
  static readonly upgradeIntervalBotPassive = 10;

  // 存储每个bot的被动技能名称
  private static botPassiveAbilities1: Map<number, string> = new Map();
  private static botPassiveAbilities2: Map<number, string> = new Map();

  // ----- 技能添加 -----
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
      2,
      currentHero,
      [],
      isHighTier,
    );
    const abilityName1 = results[0].name;
    const abilityName2 = results[1].name;
    print(
      `[BotAbility] AddRandomPassiveAbilityForBot ${currentHero.GetName()}, ability1: ${abilityName1}, level: ${results[0].level}, ability2: ${abilityName2}, level: ${results[1].level}`,
    );
    currentHero.AddAbility(abilityName1);
    currentHero.AddAbility(abilityName2);

    // 记录bot的被动技能名称
    const heroIndex = currentHero.GetEntityIndex();
    this.botPassiveAbilities1.set(heroIndex, abilityName1);
    this.botPassiveAbilities2.set(heroIndex, abilityName2);

    // 将bot被动技能信息设置到net table，供结算界面显示
    const playerId = currentHero.GetPlayerOwnerID();
    CustomNetTables.SetTableValue('bot_passive_abilities', playerId.toString(), {
      passiveAbilityName1: abilityName1,
      passiveAbilityName2: abilityName2,
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

  // ----- 技能升级 -----
  /**
   * 升级bot所有技能
   */
  public static LevelUpBotAbility(hero: CDOTA_BaseNPC_Hero): void {
    this.LevelUpBotBuildAbilities(hero);
    this.LevelUpBotPassiveAbility(hero);
    this.LevelUpBotPower(hero);
  }

  /**
   * 通用的技能升级方法
   * @param ability 技能对象
   * @param targetLevel 目标等级
   * @returns 升级次数
   */
  private static UpgradeAbilityToLevel(
    hero: CDOTA_BaseNPC_Hero,
    ability: CDOTABaseAbility | undefined,
    targetLevel: number,
  ): number {
    if (ability === undefined) {
      return 0;
    }

    const abilityLevel = ability.GetLevel();
    const maxLevel = ability.GetMaxLevel();

    // 如果技能已经达到最大等级，则不升级
    if (abilityLevel >= maxLevel) {
      return 0;
    }

    // 确保不超过最大等级
    const finalTargetLevel = Math.min(targetLevel, maxLevel);

    // 使用 UpgradeAbility 逐级升级，避免 SetLevel 的叠加问题
    const maxUpgrades = finalTargetLevel - abilityLevel;
    let upgradeCount = 0;
    while (ability.GetLevel() < finalTargetLevel && upgradeCount < maxUpgrades) {
      hero.UpgradeAbility(ability);
      upgradeCount++;
    }

    return upgradeCount;
  }

  /**
   * 根据bot build配置升级技能
   */
  private static LevelUpBotBuildAbilities(hero: CDOTA_BaseNPC_Hero): void {
    const heroName = hero.GetName();
    const buildConfig = GetBotBuildConfig(heroName);

    // 如果该英雄没有配置build，则跳过
    if (!buildConfig) {
      print(
        `[BotAbility] ERROR: LevelUpBotBuildAbilities ${hero.GetName()}, buildConfig not found`,
      );
      return;
    }

    const heroLevel = hero.GetLevel();
    // 计算每个技能的目标等级
    const abilityTargetLevels = this.CalculateAbilityTargetLevels(buildConfig, heroLevel);

    // 升级每个技能到目标等级
    for (const [abilityName, targetLevel] of Object.entries(abilityTargetLevels)) {
      const ability = hero.FindAbilityByName(abilityName);
      if (ability) {
        this.UpgradeAbilityToLevel(hero, ability, targetLevel);
      }
    }
  }

  /**
   * 根据build配置和英雄等级，计算每个技能的目标等级
   * @param buildConfig bot build配置
   * @param heroLevel 英雄当前等级
   * @returns 技能名称到目标等级的映射
   */
  private static CalculateAbilityTargetLevels(
    buildConfig: Record<string, string>,
    heroLevel: number,
  ): Record<string, number> {
    const abilityLevels: Record<string, number> = {};

    // 遍历build配置，统计每个技能在1到heroLevel之间的加点次数
    for (let level = 1; level <= heroLevel; level++) {
      const abilityName = buildConfig[level.toString()];
      if (abilityName && abilityName !== '') {
        if (!abilityLevels[abilityName]) {
          abilityLevels[abilityName] = 0;
        }
        abilityLevels[abilityName]++;
      }
    }

    return abilityLevels;
  }

  /**
   * 为bot升级被动技能
   */
  private static LevelUpBotPassiveAbility(hero: CDOTA_BaseNPC_Hero): void {
    const heroIndex = hero.GetEntityIndex();
    const heroLevel = hero.GetLevel();

    // 升级第一个被动技能：在 5, 15, 25... 级时升级（每10级，从5级开始）
    const passiveAbilityName1 = this.botPassiveAbilities1.get(heroIndex);
    if (passiveAbilityName1 && heroLevel >= 5) {
      const ability1 = hero.FindAbilityByName(passiveAbilityName1);
      const expectedLevel1 = Math.floor((heroLevel - 5) / 10) + 1;
      this.UpgradeAbilityToLevel(hero, ability1, expectedLevel1);
    }

    // 升级第二个被动技能：在 10, 20, 30... 级时升级（每10级，从10级开始）
    const passiveAbilityName2 = this.botPassiveAbilities2.get(heroIndex);
    if (passiveAbilityName2 && heroLevel >= 10) {
      const ability2 = hero.FindAbilityByName(passiveAbilityName2);
      const expectedLevel2 = Math.floor(heroLevel / 10);
      this.UpgradeAbilityToLevel(hero, ability2, expectedLevel2);
    }
  }

  /**
   * 为bot升级bot_power_n6
   */
  private static LevelUpBotPower(hero: CDOTA_BaseNPC_Hero): void {
    // find bot_power_n6
    const ability = hero.FindAbilityByName('bot_power_n6');
    const expectedLevel = Math.floor(hero.GetLevel() / this.upgradeIntervalBotPower);
    this.UpgradeAbilityToLevel(hero, ability, expectedLevel);
  }
}
