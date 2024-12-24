export class BotPower {
  // 每5级升级一次
  static readonly upgradeInterval = 5;

  public static AddBotPower(hero: CDOTA_BaseNPC_Hero): void {
    if (GameRules.Option.gameDifficulty === 5) {
      // N5添加
      if (!hero.HasAbility('bot_power_n5')) {
        hero.AddAbility('bot_power_n5');
      }
    }
    if (GameRules.Option.gameDifficulty === 6) {
      // N6添加
      if (!hero.HasAbility('bot_power_n6')) {
        hero.AddAbility('bot_power_n6');
      }
    }
  }

  public static LevelUpBotPower(hero: CDOTA_BaseNPC_Hero): void {
    // find bot_power_n5 or bot_power_n6
    let ability = hero.FindAbilityByName('bot_power_n5');
    if (!ability) {
      ability = hero.FindAbilityByName('bot_power_n6');
    }
    if (!ability) {
      return;
    }

    const heroLevel = hero.GetLevel();
    const expectedLevel = Math.floor(heroLevel / BotPower.upgradeInterval);
    const abiliyLevel = ability.GetLevel();
    if (expectedLevel > abiliyLevel) {
      ability.SetLevel(expectedLevel);
    }
  }
}
