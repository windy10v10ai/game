export class GameConfig {
  public static readonly GAME_VERSION = 'v4.42';
  public static readonly MEMBER_BUYBACK_CD = 120;
  public static readonly PRE_GAME_TIME = 60;
  // 英雄击杀经验系数
  public static readonly LOW_LEVEL_BASE_XP = 60;
  public static readonly LOW_LEVEL_XP_FACTOR = 0.072;
  public static readonly LEVEL_THRESHOLD = 30;
  public static readonly HIGH_LEVEL_BASE_XP = 3000;
  public static readonly HIGH_LEVEL_XP_FACTOR = 0.03;

  constructor() {
    SendToServerConsole('dota_max_physical_items_purchase_limit 9999'); // 用来解决物品数量限制问题

    GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 10); // 设置天辉队伍人数上限
    GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 10); // 设置夜魇队伍人数上限
    GameRules.LockCustomGameSetupTeamAssignment(false); // 锁定队伍分配
    GameRules.EnableCustomGameSetupAutoLaunch(true); // 是否自动开始游戏
    GameRules.SetCustomGameSetupAutoLaunchDelay(50); // 游戏设置时间
    GameRules.SetCustomGameSetupRemainingTime(3); // 游戏设置剩余时间
    // GameRules.SetCustomGameSetupTimeout(3); // 游戏设置阶段超时
    GameRules.SetHeroSelectionTime(50); // 选择英雄阶段的持续时间
    GameRules.SetHeroSelectPenaltyTime(10); // 选择英雄超时惩罚时间
    GameRules.SetStrategyTime(10); // 选完英雄的策略阶段的持续时间
    GameRules.SetShowcaseTime(0); // 选完英雄进游戏前的展示时间
    GameRules.SetPreGameTime(GameConfig.PRE_GAME_TIME); // 进入游戏后号角吹响前的准备时间
    // GameRules.SetPostGameTime(30); // 游戏结束后时长
    // GameRules.SetSameHeroSelectionEnabled(true); // 是否允许选择相同英雄
    // GameRules.SetStartingGold(0); // 设置初始金钱
    GameRules.SetGoldTickTime(1); // 设置工资发放间隔
    GameRules.SetGoldPerTick(3); // 设置工资发放数额
    // GameRules.SetHeroRespawnEnabled(false); // 是否允许英雄重生
    // GameRules.SetCustomGameAllowMusicAtGameStart(false); // 是否允许游戏开始时的音乐
    // GameRules.SetCustomGameAllowHeroPickMusic(false); // 是否允许英雄选择阶段的音乐
    // GameRules.SetCustomGameAllowBattleMusic(false); // 是否允许战斗阶段音乐
    GameRules.SetUseUniversalShopMode(true); // 是否启用全地图商店模式（在基地也可以购买神秘商店的物品）* 这个不是设置在任何地方都可以购买，如果要设置这个，需要将购买区域覆盖全地图
    // GameRules.SetHideKillMessageHeaders(true); // 是否隐藏顶部的英雄击杀信息
    GameRules.SetCustomGameEndDelay(30);
    GameRules.SetFilterMoreGold(true);
    GameRules.SetTimeOfDay(0.25); // 设置天亮时间与Dota2一致

    const game: CDOTABaseGameMode = GameRules.GetGameModeEntity();
    game.SetUseDefaultDOTARuneSpawnLogic(true); // 是否使用默认的神符生成逻辑
    // game.SetRemoveIllusionsOnDeath(true); // 是否在英雄死亡的时候移除幻象
    game.SetFreeCourierModeEnabled(true); // 是否启用免费信使模式
    game.SetSelectionGoldPenaltyEnabled(true); // 是否启用选择英雄时的金钱惩罚（超时每秒扣钱）
    game.SetLoseGoldOnDeath(false); // 是否在英雄死亡时扣除金钱
    game.SetCustomBuybackCostEnabled(true); // 是否启用自定义买活价格
    game.SetCustomGlyphCooldown(180); // 防御符文冷却时间

    // game.SetBuybackEnabled(false); // 是否允许买活
    // game.SetDaynightCycleDisabled(true); // 是否禁用白天黑夜循环
    // game.SetForceRightClickAttackDisabled(true); // 是否禁用右键攻击
    // game.SetHudCombatEventsDisabled(true); // 是否禁用战斗事件（左下角的战斗消息）
    // game.SetCustomGameForceHero(`npc_dota_hero_phoenix`); // 设置强制英雄（会直接跳过英雄选择阶段并直接为所有玩家选择这个英雄）
    // game.SetDeathOverlayDisabled(true); // 是否禁用死亡遮罩（灰色的遮罩）

    // 每点智力魔抗加成在modifier intelect_magic_resist.ts中控制
    game.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.AGILITY_ARMOR, 0.125); // 0.166 1/6
    game.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.STRENGTH_HP, 25); // 22
    game.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.ALL_DAMAGE, 0.5); // 22

    // 设置自定义的队伍人数上限，这里的设置是10个队伍，每个队伍1人
    // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.GOODGUYS, 1);
    // GameRules.SetCustomGameTeamMaxPlayers(DotaTeam.BADGUYS, 1);
    // for (let team = DotaTeam.CUSTOM_1; team <= DotaTeam.CUSTOM_8; ++team) {
    //     GameRules.SetCustomGameTeamMaxPlayers(team, 1);
    // }

    game.SetTowerBackdoorProtectionEnabled(true);
    game.SetMaximumAttackSpeed(700);
    game.SetMinimumAttackSpeed(20);

    if (IsInToolsMode()) {
      print('[GameConfig] IsInToolsMode set');
      // GameRules.SetCustomGameSetupAutoLaunchDelay(5);
      // GameRules.SetHeroSelectionTime(15);
      // GameRules.SetHeroSelectPenaltyTime(1); // 选择英雄超时惩罚时间
      // GameRules.SetStrategyTime(5);
      // GameRules.SetPreGameTime(15); // 进入游戏后号角吹响前的准备时间
    }
  }

  public static SetMaxLevelXPRequire() {
    // 设置自定义英雄每个等级所需经验，这里的经验是升级到这一级所需要的总经验）
    const xpRequireMap: { [key: number]: number } = {
      1: 0,
      2: 230,
      3: 600,
      4: 1100,
      5: 1750,
      6: 2550,
      7: 3500,
      8: 4600,
      9: 5800,
      10: 7100,
      11: 8500,
      12: 10000,
      13: 11600,
      14: 13300,
      15: 15100,
      16: 17000,
      17: 19000,
      18: 21100,
      19: 23300,
      20: 25600,
      21: 28100,
      22: 30850,
      23: 33850,
      24: 37100,
      25: 40600,
      26: 44600,
      27: 49100,
      28: 54100,
      29: 59600,
      30: 65600,
    };
    // 经验列表不能超过最大等级
    const maxLevel = GameRules.Option.maxLevel;
    for (let i = 31; i <= maxLevel; i++) {
      xpRequireMap[i] = xpRequireMap[i - 1] + i * 200;
    }
    GameRules.SetUseCustomHeroXPValues(true);
    const game: CDOTABaseGameMode = GameRules.GetGameModeEntity();
    game.SetCustomXPRequiredToReachNextLevel(xpRequireMap);
    game.SetUseCustomHeroLevels(true); // 是否启用自定义英雄等级
    game.SetCustomHeroMaxLevel(maxLevel); // 设置自定义英雄最大等级
    // print('[GameConfig] xpRequireMap:');
    // DeepPrintTable(xpRequireMap);
  }
}
