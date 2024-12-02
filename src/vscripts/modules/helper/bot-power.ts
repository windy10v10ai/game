export class BotPower {
  // 每5级升级一次
  static readonly upgradeInterval = 5;

  public static AddBotPower(hero: CDOTA_BaseNPC_Hero): void {
    if (GameRules.Option.gameDifficulty < 6) {
      // N6以下不添加
      return;
    }

    if (!hero.HasAbility('bot_power')) {
      hero.AddAbility('bot_power');
    }
  }

  public static LevelUpBotPower(hero: CDOTA_BaseNPC_Hero): void {
    if (!hero.HasAbility('bot_power')) {
      return;
    }

    const ability = hero.FindAbilityByName('bot_power');
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
