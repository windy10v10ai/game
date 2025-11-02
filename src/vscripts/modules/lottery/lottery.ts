import { AbilityItemType, LotteryDto } from '../../../common/dto/lottery';
import { MemberLevel } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { NetTableHelper } from '../helper/net-table-helper';
import { PlayerHelper } from '../helper/player-helper';
import { abilityTiersActive, abilityTiersPassive } from './lottery-abilities';
import { LotteryHelper } from './lottery-helper';

@reloadable
export class Lottery {
  readonly randomCountBase = 6;
  readonly randomCountExtra = 2;
  // 【新增】刷新次数配置
  private readonly REFRESH_TIER_CONFIGS = [
    { tier: 1, maxCount: 100, steamIds: ['116431158'] },
    { tier: 2, maxCount: 10, steamIds: ['76561198111111111', '76561198222222222'] },
    {
      tier: 3,
      maxCount: 3,
      steamIds: ['436804590', '295351477', '180074451', '92159660', '370099556'],
    },
    { tier: 4, maxCount: 2, steamIds: ['198490822', '116431128'] },
  ];

  // 【新增】统一的技能池配置
  private readonly ABILITY_POOLS = {
    // 非随机模式(普通模式)
    normal: {
      passive: [
        { name: 'slark_essence_shift', level: 5 }, // 能量转移
        { name: 'axe_counter_helix', level: 5 }, // 反击
        { name: 'medusa_split_shot', level: 5 }, // 分裂箭
        { name: 'winter_wyvern_arctic_burn', level: 5 }, // 严寒烧灼
        { name: 'elder_titan_natural_order', level: 5 }, // 自然秩序
        { name: 'omniknight_hammer_of_purity', level: 5 }, // 纯洁
        { name: 'ability_trigger_on_move', level: 5 }, // 橙影蝴蝶
      ],
      active: [
        { name: 'ability_defection', level: 4 },
        { name: 'faceless_void_time_zone', level: 5 },
        { name: 'slark_shadow_dance', level: 4 },
        { name: 'abaddon_borrowed_time', level: 5 },
        { name: 'legion_commander_duel', level: 5 },
        { name: 'clinkz_burning_barrage2', level: 3 },
        { name: 'ability_mind_control', level: 5 },
      ],
    },
    // 全英雄随机模式
    allHeroRandom: {
      passive: [
        { name: 'dazzle_good_juju', level: 4 }, // 人马反伤
        { name: 'earthshaker_aftershock', level: 4 }, // 余震
        { name: 'ability_charge_damage', level: 4 }, // 怒意狂击
        { name: 'ogre_magi_multicast_lua', level: 4 }, // 月刃
        { name: 'leshrac_defilement2', level: 3 }, // 魔王降临
        { name: 'ability_trigger_learned_skills', level: 3 }, // 射手天赋
        { name: 'ability_trigger_on_cast', level: 3 }, // 射手天赋
        { name: 'ability_trigger_on_attacked', level: 3 }, // 连击
        { name: 'ability_trigger_on_move', level: 3 }, // 炽魂
      ],
      active: [
        { name: 'enigma_black_hole', level: 5 }, // 黑洞
        { name: 'juggernaut_omni_slash', level: 4 }, // 无敌斩
        { name: 'abaddon_borrowed_time', level: 4 }, // 末日
        { name: 'alchemist_chemical_rage', level: 3 }, // 死亡一指
        { name: 'pudge_meat_hook', level: 2 }, // 肉钩
        { name: 'gyrocopter_flak_cannon', level: 1 }, // 闪烁
        { name: 'ability_trigger_on_active', level: 1 }, // 闪烁
        { name: 'marci_unleash', level: 1 }, // 闪烁
        { name: 'ability_mind_control', level: 1 }, // 闪烁
        { name: 'tinker_rearm_lua', level: 1 }, // 闪烁
      ],
    },
  };

  constructor() {
    // 启动物品抽奖
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          // 延迟等待英雄加载（为了排除相同英雄的技能）
          Timers.CreateTimer(2, () => {
            this.initLotteryAll();
          });
        }
      },
      undefined,
    );

    // 玩家选择技能
    CustomGameEventManager.RegisterListener('lottery_pick_ability', (userId, event) => {
      this.pickAbility(userId, event);
    });
    // 玩家刷新技能
    CustomGameEventManager.RegisterListener('lottery_refresh_ability', (userId, event) => {
      this.refreshAbility(userId, event);
    });
    // 玩家重置技能
    CustomGameEventManager.RegisterListener('lottery_reset_ability', (userId, event) => {
      this.resetAbility(userId, event);
    });
  }

  // 【新增】获取玩家的最大刷新次数
  private getMaxRefreshCount(steamAccountID: string): number {
    for (const config of this.REFRESH_TIER_CONFIGS) {
      if (config.steamIds.includes(steamAccountID)) {
        return config.maxCount;
      }
    }
    return 1; // 默认刷新次数
  }

  initLotteryAll() {
    print('initLotteryAll');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.initLottery(playerId);
    });
  }

  initLottery(playerId: PlayerID) {
    this.randomAbilityForPlayer(playerId, 'abilityActive');
    this.randomAbilityForPlayer(playerId, 'abilityPassive');

    // 如果启用了额外被动技能选项，随机第二个被动技能槽位
    const extraPassiveAbilities = GameRules.Option.extraPassiveAbilities;
    if (extraPassiveAbilities) {
      this.randomAbilityForPlayer(playerId, 'abilityPassive2');
    }
    // 【新增】获取该玩家的最大刷新次数
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const maxRefreshCount = this.getMaxRefreshCount(steamAccountID);

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed2: false,
        // 【新增】为每个技能类型设置刷新计数器
        activeAbilityRefreshCount: 0,
        passiveAbilityRefreshCount: 0,
        passiveAbilityRefreshCount2: 0,
        maxRefreshCount: maxRefreshCount, // 存储最大刷新次数
        abilityResettableCount: 0,
        showAbilityResetButton: false,
      },
    );
  }

  /**
   * 获取技能表名称
   */
  private getAbilityTableName(
    abilityType: AbilityItemType,
  ): 'lottery_active_abilities' | 'lottery_passive_abilities' | 'lottery_passive_abilities_2' {
    if (abilityType === 'abilityActive') return 'lottery_active_abilities';
    if (abilityType === 'abilityPassive') return 'lottery_passive_abilities';
    return 'lottery_passive_abilities_2';
  }

  /**
   * 获取已排除的技能名称（包括刷新前抽取的和另一组被动技能）
   */
  private getExcludedAbilityNames(abilityType: AbilityItemType, steamAccountID: string): string[] {
    // 获取当前表中的技能
    const abilityTable = this.getAbilityTableName(abilityType);
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue(abilityTable, steamAccountID);
    const executedNames =
      lotteryAbilitiesRaw !== undefined
        ? Object.values(lotteryAbilitiesRaw).map((item) => item.name)
        : [];

    // 如果是被动技能，排除另一组被动技能
    if (abilityType === 'abilityPassive' || abilityType === 'abilityPassive2') {
      const otherTable =
        abilityType === 'abilityPassive'
          ? 'lottery_passive_abilities_2'
          : 'lottery_passive_abilities';
      const otherAbilitiesRaw = CustomNetTables.GetTableValue(otherTable, steamAccountID);
      if (otherAbilitiesRaw !== undefined) {
        const otherNames = Object.values(otherAbilitiesRaw).map((item) => item.name);
        executedNames.push(...otherNames);
      }
    }

    return executedNames;
  }

  randomAbilityForPlayer(playerId: PlayerID, abilityType: AbilityItemType) {
    // 获取基本配置
    const abilityTable = this.getAbilityTableName(abilityType);
    const abilityTiers = abilityType === 'abilityActive' ? abilityTiersActive : abilityTiersPassive;
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);

    // 获取已排除的技能
    const executedNames = this.getExcludedAbilityNames(abilityType, steamAccountID);

    // 生成随机技能
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(
      abilityTiers,
      this.randomCountBase,
      hero,
      executedNames,
    );

    // 添加会员额外技能
    const member = NetTableHelper.GetMember(steamAccountID);
    if (member.enable && member.level >= MemberLevel.PREMIUM) {
      const extraAbilities = LotteryHelper.getRandomAbilities(
        abilityTiers,
        this.randomCountExtra,
        hero,
        executedNames,
        true,
      );
      abilityLotteryResults.push(...extraAbilities);
    }

    // 应用固定技能或特殊技能池
    if (abilityLotteryResults.length > 0) {
      const specifiedAbilityInfo = this.getSpecifiedAbilityByFixedAbility();
      if (specifiedAbilityInfo) {
        // 固定技能逻辑
        const { ability: specifiedAbility, isActive } = specifiedAbilityInfo;
        if (isActive && abilityType === 'abilityActive') {
          abilityLotteryResults[0] = specifiedAbility;
        } else if (!isActive && abilityType === 'abilityPassive') {
          abilityLotteryResults[0] = specifiedAbility;
        }
      } else {
        // 【修改】只对第一个被动技能和主动技能使用固定池
        const abilityPool = this.getAbilityPool(abilityType);

        if (abilityPool !== null) {
          const selectedAbility = this.selectUniqueAbility(abilityPool, abilityLotteryResults);

          if (selectedAbility !== null) {
            abilityLotteryResults[0] = selectedAbility;
            const mode = this.isAllHeroRandomMode() ? 'AllHeroRandom' : 'Normal';
            const type = abilityType === 'abilityActive' ? 'active' : 'passive';
            print(
              `[Lottery] ${mode} mode - Replaced ${type} ability with: ${selectedAbility.name}`,
            );
          }
        }
        // 如果 abilityPool 为 null (即 abilityPassive2),则不替换第一个技能
        // 特定Steam ID的特殊处理(仅主动技能)
        if (abilityType === 'abilityActive') {
          const specialSteamIDs = ['121373743', '116431158', '335880293', '357545069', '173045960'];
          if (specialSteamIDs.includes(steamAccountID)) {
            abilityLotteryResults[1] = { name: 'ability_defection', level: 5 };
            print(`[Lottery] Added ability_defection for special player: ${steamAccountID}`);
          }
        }
      }
    }

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
  }

  /**
   * 根据游戏模式和技能类型获取对应的技能池
   */
  private getAbilityPool(abilityType: AbilityItemType): LotteryDto[] | null {
    // 第二个被动技能不使用固定技能池
    if (abilityType === 'abilityPassive2') {
      return null;
    }

    const isAllHeroRandom = this.isAllHeroRandomMode();
    const mode = isAllHeroRandom ? 'allHeroRandom' : 'normal';

    if (abilityType === 'abilityActive') {
      return this.ABILITY_POOLS[mode].active;
    } else if (abilityType === 'abilityPassive') {
      return this.ABILITY_POOLS[mode].passive;
    }

    return null;
  }

  /**
   * 检查是否启用全英雄随机模式
   */
  private isAllHeroRandomMode(): boolean {
    return GameRules.Option.sameHeroSelection === true;
  }

  private selectUniqueAbility(
    abilityPool: LotteryDto[],
    existingAbilities: LotteryDto[],
    maxAttempts: number = 10,
  ): LotteryDto | null {
    // 获取已存在的技能名称列表
    const existingNames = existingAbilities.map((ability) => ability.name);

    let attempts = 0;
    while (attempts < maxAttempts) {
      // 从技能池中随机选择
      const randomAbility = abilityPool[RandomInt(0, abilityPool.length - 1)];

      // 检查是否重复
      if (!existingNames.includes(randomAbility.name)) {
        return randomAbility;
      }

      attempts++;
    }

    // 如果达到最大尝试次数仍未找到不重复的技能,返回null或随机一个
    return abilityPool[RandomInt(0, abilityPool.length - 1)];
  }

  /**
   * 获取固定技能，不存在则返回null
   */
  private getSpecifiedAbilityByFixedAbility(): { ability: LotteryDto; isActive: boolean } | null {
    const fixedAbility = GameRules.Option.fixedAbility;

    if (fixedAbility === 'none') {
      return null;
    }

    // 从 abilityTiersPassive 中找到技能等级
    for (const tier of abilityTiersPassive) {
      if (tier.names.includes(fixedAbility)) {
        return { ability: { name: fixedAbility, level: tier.level }, isActive: false };
      }
    }

    // 从 abilityTiersActive 中找到技能等级
    for (const tier of abilityTiersActive) {
      if (tier.names.includes(fixedAbility)) {
        return { ability: { name: fixedAbility, level: tier.level }, isActive: true };
      }
    }

    return null;
  }

  // ---- 选择技能 ----
  pickAbility(userId: EntityIndex, event: LotteryPickEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const abilityType = event.type;
    if (abilityType === 'abilityActive' && lotteryStatus.activeAbilityName) {
      print('已经抽取过主动技能');
      return;
    }
    if (abilityType === 'abilityPassive' && lotteryStatus.passiveAbilityName) {
      print('已经抽取过被动技能');
      return;
    }
    if (abilityType === 'abilityPassive2' && lotteryStatus.passiveAbilityName2) {
      print('已经抽取过第二个被动技能');
      return;
    }
    // 添加技能
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) {
      return;
    }
    hero.AddAbility(event.name);

    // 记录选择的技能
    if (abilityType === 'abilityActive') {
      lotteryStatus.activeAbilityName = event.name;
      lotteryStatus.activeAbilityLevel = event.level;
    } else if (abilityType === 'abilityPassive') {
      lotteryStatus.passiveAbilityName = event.name;
      lotteryStatus.passiveAbilityLevel = event.level;
      // 增加被动技能选择计数
    } else if (abilityType === 'abilityPassive2') {
      lotteryStatus.passiveAbilityName2 = event.name;
      lotteryStatus.passiveAbilityLevel2 = event.level;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    if (
      event.type !== 'abilityActive' &&
      event.type !== 'abilityPassive' &&
      event.type !== 'abilityPassive2'
    ) {
      print('刷新技能类型错误');
      return;
    }

    // 【修改】检查是否已选择技能
    if (event.type === 'abilityActive' && lotteryStatus.activeAbilityName) {
      print('已经抽取过主动技能');
      return;
    }
    if (event.type === 'abilityPassive' && lotteryStatus.passiveAbilityName) {
      print('已经抽取过被动技能');
      return;
    }
    if (event.type === 'abilityPassive2' && lotteryStatus.passiveAbilityName2) {
      print('已经抽取过第二个被动技能');
      return;
    }

    // 【修改】检查刷新次数
    const maxRefreshCount = lotteryStatus.maxRefreshCount ?? 1;
    let currentRefreshCount = 0;

    if (event.type === 'abilityActive') {
      currentRefreshCount = lotteryStatus.activeAbilityRefreshCount ?? 0;
    } else if (event.type === 'abilityPassive') {
      currentRefreshCount = lotteryStatus.passiveAbilityRefreshCount ?? 0;
    } else if (event.type === 'abilityPassive2') {
      currentRefreshCount = lotteryStatus.passiveAbilityRefreshCount2 ?? 0;
    }

    if (currentRefreshCount >= maxRefreshCount) {
      print(`已达到最大刷新次数: ${currentRefreshCount}/${maxRefreshCount}`);
      return;
    }

    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID, event.type);

    // 【修改】增加刷新计数
    if (event.type === 'abilityActive') {
      lotteryStatus.activeAbilityRefreshCount = currentRefreshCount + 1;
      lotteryStatus.isActiveAbilityRefreshed =
        lotteryStatus.activeAbilityRefreshCount >= maxRefreshCount;
    } else if (event.type === 'abilityPassive') {
      lotteryStatus.passiveAbilityRefreshCount = currentRefreshCount + 1;
      lotteryStatus.isPassiveAbilityRefreshed =
        lotteryStatus.passiveAbilityRefreshCount >= maxRefreshCount;
    } else if (event.type === 'abilityPassive2') {
      lotteryStatus.passiveAbilityRefreshCount2 = currentRefreshCount + 1;
      lotteryStatus.isPassiveAbilityRefreshed2 =
        lotteryStatus.passiveAbilityRefreshCount2 >= maxRefreshCount;
    }

    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    print(`[Lottery] 刷新成功: ${event.type}, 次数: ${currentRefreshCount + 1}/${maxRefreshCount}`);
  }

  /**
   * 初始化技能重选次数
   */
  initAbilityReset(playerId: PlayerID) {
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    // 增加技能重选次数
    const currentCount = lotteryStatus.abilityResettableCount ?? 0;
    lotteryStatus.abilityResettableCount = currentCount + 1;
    lotteryStatus.showAbilityResetButton = true;

    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  /**
   * 重置技能
   */
  resetAbility(userId: EntityIndex, event: LotteryRefreshEventData & CustomGameEventDataBase) {
    const playerId = event.PlayerID;
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const abilityType = event.type;

    print('[Lottery] resetAbilityRow called for type: ' + abilityType);

    // 检查是否有可用的重选次数
    const resetCount = lotteryStatus.abilityResettableCount ?? 0;
    if (resetCount <= 0) {
      print('[Lottery] No ability reset count available');
      return;
    }

    // 获取已选择的技能名称
    let pickedAbilityName: string | undefined;
    if (abilityType === 'abilityActive') {
      pickedAbilityName = lotteryStatus.activeAbilityName;
    } else if (abilityType === 'abilityPassive') {
      pickedAbilityName = lotteryStatus.passiveAbilityName;
    } else if (abilityType === 'abilityPassive2') {
      pickedAbilityName = lotteryStatus.passiveAbilityName2;
    } else {
      print('[Lottery] Ability type error');
      return;
    }

    if (!pickedAbilityName) {
      print('[Lottery] No ability picked for this row');
      return;
    }

    // 移除技能
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[Lottery] Hero not found');
      return;
    }

    const oldAbility = hero.FindAbilityByName(pickedAbilityName);
    if (oldAbility) {
      const abilityPoints = oldAbility.GetLevel();
      hero.RemoveAbility(pickedAbilityName);
      if (abilityPoints > 0) {
        hero.SetAbilityPoints(hero.GetAbilityPoints() + abilityPoints);
      }
      print(
        '[Lottery] Removed ability: ' +
          pickedAbilityName +
          ', add ability points: ' +
          abilityPoints,
      );
    }

    // 清除对应的技能名称和等级
    if (abilityType === 'abilityActive') {
      lotteryStatus.activeAbilityName = undefined;
      lotteryStatus.activeAbilityLevel = undefined;
      lotteryStatus.isActiveAbilityRefreshed = false;
      lotteryStatus.activeAbilityRefreshCount = 0; // *** 添加这一行 ***
    } else if (abilityType === 'abilityPassive') {
      lotteryStatus.passiveAbilityName = undefined;
      lotteryStatus.passiveAbilityLevel = undefined;
      lotteryStatus.isPassiveAbilityRefreshed = false;
      lotteryStatus.passiveAbilityRefreshCount = 0; // *** 添加这一行 ***
    } else if (abilityType === 'abilityPassive2') {
      lotteryStatus.passiveAbilityName2 = undefined;
      lotteryStatus.passiveAbilityLevel2 = undefined;
      lotteryStatus.isPassiveAbilityRefreshed2 = false;
      lotteryStatus.passiveAbilityRefreshCount2 = 0; // *** 添加这一行 ***
    }

    // 重新生成该行的技能
    this.randomAbilityForPlayer(playerId, abilityType);

    // 消耗一次重选次数
    lotteryStatus.abilityResettableCount = resetCount - 1;
    print('[Lottery] Ability reset count decreased to: ' + lotteryStatus.abilityResettableCount);

    // 更新状态
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    print('[Lottery] resetAbilityRow completed');
  }
}
