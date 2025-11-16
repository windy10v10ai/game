import { abilityTiersPassiveBot } from '../lottery/lottery-abilities-bot';
import { LotteryHelper } from '../lottery/lottery-helper';

export class BotAbility {
  // 每5级升级一次
  static readonly upgradeIntervalBotPower = 5;
  static readonly upgradeIntervalBotPassive = 10;
  static readonly upgradeIntervalBossAbility = 10; // ✅ 新增: Boss额外技能升级间隔

  // 存储每个bot的被动技能名称
  private static botPassiveAbilities: Map<number, string> = new Map();

  // FIXME boss相关内容实装未同步，暂时保留以缓解代码冲突
  // ✅ 新增: 存储每个bot的Boss额外技能列表
  private static botBossAbilities: Map<number, string[]> = new Map();

  // ✅ 新增: Boss技能池
  private static readonly bossAbilityPool = [
    'spectre_dispersion', // 折射
    'medusa_split_shot', // 分裂箭
    'tidehunter_anchor_smash', // 深海重击
    'phantom_assassin_coup_de_grace', // 恩赐解脱
    'dazzle_good_juju', // 善咒
    'ability_trigger_on_attacked', // 金蝴蝶
    'elder_titan_natural_order', // 自然秩序
    'medusa_mana_shield2', // 魔法盾
    'ability_trigger_learned_skills', // 蓝蝴蝶
    'ability_trigger_on_cast', // 红蝴蝶
    'ability_trigger_on_spell_reflect', // 绿蝴蝶
  ];

  /**
   * 为bot添加技能(包括普通被动和Boss额外技能)
   * @param hero 当前英雄
   * @param bossAbilityCount Boss额外技能数量,默认为0(非Boss)
   */
  public static AddBotAbility(hero: CDOTA_BaseNPC_Hero, bossAbilityCount: number = 0): void {
    this.AddBotPower(hero);
    this.AddPassiveAbilityForBot(hero);

    // FIXME boss相关内容实装未同步，暂时保留以缓解代码冲突
    // ✅ 新增: 如果是Boss,添加额外技能
    if (bossAbilityCount >= 0) {
      // this.AddBossAbilities(hero, bossAbilityCount);
    }
  }

  // FIXME boss相关内容实装未同步，暂时保留以缓解代码冲突
  /**
   * ✅ 新增: 为Boss添加额外技能
   * @param hero 当前英雄
   * @param count 要添加的技能数量
   */
  private static AddBossAbilities(hero: CDOTA_BaseNPC_Hero, count: number): void {
    if (count <= 0) {
      print(`[BotAbility] No boss abilities to add (count: ${count})`);
      return;
    }

    print(`[BotAbility] Adding ${count} boss abilities to ${hero.GetUnitName()}`);

    // 使用 Fisher-Yates 洗牌算法
    const shuffled = [...this.bossAbilityPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = RandomInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const addedAbilities: string[] = [];
    let addedCount = 0;
    let attemptIndex = 0;

    while (addedCount < count && attemptIndex < shuffled.length) {
      const abilityName = shuffled[attemptIndex];
      attemptIndex++;

      // 检查是否已经拥有该技能
      const existingAbility = hero.FindAbilityByName(abilityName);
      if (existingAbility !== undefined) {
        print(`[BotAbility] Hero already has ability ${abilityName}, trying next`);
        continue;
      }

      // 添加技能
      try {
        const ability = hero.AddAbility(abilityName);
        if (ability !== undefined) {
          ability.SetLevel(1); // 初始等级为1,后续通过LevelUp升级
          addedAbilities.push(abilityName);
          addedCount++;
          print(
            `[BotAbility] Successfully added boss ability ${abilityName} (${addedCount}/${count})`,
          );
        } else {
          print(
            `[BotAbility] Failed to add ability ${abilityName} (AddAbility returned undefined)`,
          );
        }
      } catch (error) {
        print(`[BotAbility] ERROR adding ability ${abilityName}: ${error}`);
      }
    }

    // 记录Boss技能列表
    if (addedAbilities.length > 0) {
      const heroIndex = hero.GetEntityIndex();
      this.botBossAbilities.set(heroIndex, addedAbilities);
      print(
        `[BotAbility] Recorded ${addedAbilities.length} boss abilities for ${hero.GetUnitName()}`,
      );
    }

    if (addedCount < count) {
      print(`[BotAbility] Warning: Only added ${addedCount}/${count} boss abilities`);
    }
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
    // FIXME boss相关内容实装未同步，暂时保留以缓解代码冲突
    // this.LevelUpBossAbilities(hero); // ✅ 新增: 升级Boss技能
  }

  // FIXME boss相关内容实装未同步，暂时保留以缓解代码冲突
  /**
   * ✅ 新增: 升级Boss额外技能
   */
  private static LevelUpBossAbilities(hero: CDOTA_BaseNPC_Hero): void {
    const heroIndex = hero.GetEntityIndex();
    const bossAbilities = this.botBossAbilities.get(heroIndex);

    if (!bossAbilities || bossAbilities.length === 0) {
      return;
    }

    // 升级每个Boss技能
    bossAbilities.forEach((abilityName) => {
      const ability = hero.FindAbilityByName(abilityName);
      if (ability !== undefined) {
        this.UpgradeAbilityToLevel(ability, hero.GetLevel(), this.upgradeIntervalBossAbility);
      }
    });
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
