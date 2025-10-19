import { MemberLevel } from '../../api/player';
import { reloadable } from '../../utils/tstl-utils';
import { NetTableHelper } from '../helper/net-table-helper';
import { PlayerHelper } from '../helper/player-helper';
import { abilityTiersActive, abilityTiersPassive } from './lottery-abilities';
import { LotteryHelper } from './lottery-helper';

@reloadable
export class Lottery {
  readonly randomCountBase = 5;
  readonly randomCountExtra = 2;
  // 新增：每个玩家的被动技能选择计数器
  private passiveAbilityPickCount: Map<string, number> = new Map();

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

    // 监听技能重选物品使用
    ListenToGameEvent(
      'dota_item_used',
      (event) => {
        const itemName = event.itemname;
        if (itemName === 'item_tome_of_skill_reset') {
          print('[Lottery] Skill reset item detected!');
          const playerId = event.PlayerID as PlayerID;
          print('[Lottery] Player ID: ' + playerId);
          this.initSkillReset(playerId);
        }
      },
      undefined,
    );

    // 注册技能重选事件 - 显式指定泛型类型
    CustomGameEventManager.RegisterListener<LotteryPickEventData>(
      'skill_reset_pick',
      (userId, event) => {
        this.pickSkillReset(userId, event);
      },
    );
    // 注册技能重选移除事件
    CustomGameEventManager.RegisterListener<LotteryPickEventData>(
      'skill_reset_remove',
      (userId, event) => {
        this.removeSkillInReset(userId, event);
      },
    );
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
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();

    // 初始化被动技能选择计数器
    this.passiveAbilityPickCount.set(steamAccountID, 0);

    this.randomAbilityForPlayer(playerId, true);
    this.randomAbilityForPlayer(playerId, false);

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
        passiveAbilityCount: 0, // 添加初始化
      },
    );

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      return;
    }
  }

  // 在 lottery.ts 中添加方法
  private getAbilityCountByMaxLevel(): number {
    const maxLevel = GameRules.Option.maxLevel;
    if (maxLevel >= 200) {
      return 4;
    } else if (maxLevel === 100) {
      return 3;
    } else {
      return 2;
    }
  }

  private getSpecifiedPassiveAbilityByStartingGold(): { name: string; level: number } | null {
    const startingGold = GameRules.Option.startingGoldPlayer;

    const abilityMap: { [key: number]: { name: string; level: number } } = {
      4999: { name: 'medusa_split_shot', level: 5 },
      4998: { name: 'winter_wyvern_arctic_burn', level: 5 },
      4997: { name: 'dazzle_good_juju', level: 5 },
      4996: { name: 'ogre_magi_multicast_lua', level: 4 },
      4995: { name: 'leshrac_defilement2', level: 4 },
      4994: { name: 'tinker_eureka2', level: 3 },
      4993: { name: 'death_prophet_witchcraft2', level: 3 },
      4992: { name: 'earthshaker_aftershock', level: 4 },
      4991: { name: 'jakiro_double_trouble2', level: 3 },
      4990: { name: 'spectre_dispersion', level: 3 },
      4989: { name: 'abyssal_underlord_firestorm2', level: 3 },
      4988: { name: 'bloodseeker_thirst', level: 3 },
      4987: { name: 'luna_moon_glaive', level: 4 },
      4986: { name: 'templar_assassin_psi_blades', level: 5 },
      4985: { name: 'faceless_void_time_lock', level: 4 },
      4984: { name: 'slardar_bash', level: 4 },
      4983: { name: 'ability_trigger_learned_skills', level: 5 },
    };

    return abilityMap[startingGold] || null;
  }

  private getAbilityNumberByStartingGoldNumber(): number {
    const startingGold = GameRules.Option.startingGoldPlayer;

    // 4999-4982 之间返回 2
    if (startingGold >= 4982 && startingGold <= 4999) {
      return 2;
    }
    // 4981 返回 3
    else if (startingGold === 4981) {
      return 3;
    }
    // 其他情况返回 1
    else {
      return 1;
    }
  }

  // ---- 随机技能 ----
  randomAbilityForPlayer(playerId: PlayerID, isActive: boolean) {
    const abilityTable = isActive ? 'lottery_active_abilities' : 'lottery_passive_abilities';
    const abilityTiers = isActive ? abilityTiersActive : abilityTiersPassive;
    // 排除刷新前抽取的
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue(abilityTable, steamAccountID);
    const executedNames = !!lotteryAbilitiesRaw
      ? Object.values(lotteryAbilitiesRaw).map((item) => item.name)
      : [];

    // 随机技能
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(
      abilityTiers,
      this.randomCountBase,
      hero,
      executedNames,
    );

    const member = NetTableHelper.GetMember(steamAccountID);
    if (member.enable && member.level >= MemberLevel.PREMIUM) {
      const extraAbilities = LotteryHelper.getRandomAbilities(
        abilityTiers,
        this.getAbilityCountByMaxLevel(),
        hero,
        executedNames,
        true, // 使用高级别技能
      );
      abilityLotteryResults.push(...extraAbilities);
    }

    // 修改修改修改开始 - 强制第一个被动技能为 高级技能

    if (!isActive && abilityLotteryResults.length > 0) {
      const hudiexiaoying = RandomInt(1, 1);
      if (hudiexiaoying === 1) {
        const hudie = RandomInt(0, 1);
        if (hudie === 0)
          abilityLotteryResults[0] = { name: 'ability_trigger_on_cast', level: 5 }; // level可调整
        else abilityLotteryResults[0] = { name: 'ability_trigger_learned_skills', level: 5 }; // level可调整
      }
      // 新增: 只有在强制随机英雄模式下才应用特殊技能逻辑
      const isForceRandomHero = GameRules.Option.sameHeroSelection;

      if (isForceRandomHero) {
        const randomIndex = RandomInt(0, 5);
        if (randomIndex === 0)
          abilityLotteryResults[0] = { name: 'ogre_magi_multicast_lua', level: 4 }; // level可调整
        if (randomIndex === 1) abilityLotteryResults[0] = { name: 'dazzle_good_juju', level: 5 }; // level可调整
        if (randomIndex === 2) abilityLotteryResults[0] = { name: 'leshrac_defilement2', level: 4 }; // level可调整
        if (randomIndex === 3)
          abilityLotteryResults[0] = { name: 'death_prophet_witchcraft2', level: 3 }; // level可调整
        if (randomIndex === 4) abilityLotteryResults[0] = { name: 'medusa_split_shot', level: 5 }; // level可调整
        if (randomIndex === 5)
          abilityLotteryResults[0] = { name: 'ability_trigger_learned_skills', level: 3 }; // level可调整
      }
      // 添加基于初始金钱的额外技能
      const specifiedAbility = this.getSpecifiedPassiveAbilityByStartingGold();
      if (specifiedAbility) {
        abilityLotteryResults[1] = specifiedAbility;
        //print(`为玩家 ${playerId} 指定第二个被动技能: ${specifiedAbility.name} (等级 ${specifiedAbility.level})`);
      }
    }

    // 修改修改修改开始 - 强制第一个主动技能为 高级技能
    if (isActive && abilityLotteryResults.length > 0) {
      const randomIndex = RandomInt(0, 6);
      if (randomIndex === 0) abilityLotteryResults[0] = { name: 'marci_unleash', level: 3 }; // level可调整
      if (randomIndex === 1) abilityLotteryResults[0] = { name: 'dazzle_bad_juju', level: 3 }; // level可调整
      if (randomIndex === 2)
        abilityLotteryResults[0] = { name: 'ember_spirit_sleight_of_fist', level: 3 }; // level可调整
      if (randomIndex === 3)
        abilityLotteryResults[0] = { name: 'gyrocopter_flak_cannon', level: 5 }; // level可调整
      if (randomIndex === 4)
        abilityLotteryResults[0] = { name: 'alchemist_chemical_rage', level: 5 }; // level可调整
      if (randomIndex === 5) abilityLotteryResults[0] = { name: 'tinker_rearm_lua', level: 3 }; // level可调整
      if (randomIndex === 6) abilityLotteryResults[0] = { name: 'juggernaut_omni_slash', level: 3 }; // level可调整
    }
    // 修改修改结束

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
  }

  // ---- 选择 ----
  pickAbility(userId: EntityIndex, event: LotteryPickEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const abilityType = event.type;
    if (lotteryStatus.activeAbilityName && abilityType === 'abilityActive') {
      print('已经抽取过主动技能');
      return;
    }
    // 改为计数已选择的被动技能数量：
    if (abilityType === 'abilityPassive') {
      const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
      if (!hero) return;

      // 计算已有的被动技能数量
      // 获取当前玩家的被动技能选择次数
      const passiveCount = this.passiveAbilityPickCount.get(steamAccountID) || 0;
      const abilitynumber = this.getAbilityNumberByStartingGoldNumber();
      if (passiveCount >= abilitynumber) {
        print('已经抽取过' + passiveCount + '个被动技能');
        return;
      }
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
      lotteryStatus.activeAbilityCount = 1;
    } else {
      lotteryStatus.passiveAbilityName = event.name;
      lotteryStatus.passiveAbilityLevel = event.level;
      // 增加被动技能选择计数
      const currentCount = this.passiveAbilityPickCount.get(steamAccountID) || 0;
      this.passiveAbilityPickCount.set(steamAccountID, currentCount + 1);
      // 新增:将计数同步到网络表
      lotteryStatus.passiveAbilityCount = currentCount + 1;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    // 发送分析事件
    // Analytic.SendPickAbilityEvent({
    //   steamId: PlayerResource.GetSteamAccountID(event.PlayerID),
    //   matchId: GameRules.Script_GetMatchID().toString(),
    //   name: event.name,
    //   type: abilityType,
    //   level: event.level,
    //   difficulty: GameRules.Option.gameDifficulty,
    //   version: GameConfig.GAME_VERSION,
    // });
  }

  // ---- 刷新 ----
  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (event.type !== 'abilityActive' && event.type !== 'abilityPassive') {
      print('刷新技能类型错误');
      return;
    }
    if (event.type === 'abilityActive') {
      if (lotteryStatus.isActiveAbilityRefreshed || lotteryStatus.activeAbilityName) {
        print('已经刷新/抽取过主动技能');
        return;
      }
    }
    // 将被动技能刷新检查改为：
    if (event.type === 'abilityPassive') {
      const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
      if (hero) {
        const passiveCount = this.passiveAbilityPickCount.get(steamAccountID) || 0;
        const abilitynumber = this.getAbilityNumberByStartingGoldNumber();
        if (lotteryStatus.isPassiveAbilityRefreshed || passiveCount >= abilitynumber) {
          print('已经刷新/抽取过' + passiveCount + '个被动技能');
          return;
        }
      }
    }

    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新物品');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID, event.type === 'abilityActive');

    // 记录刷新状态
    if (event.type === 'abilityActive') {
      lotteryStatus.isActiveAbilityRefreshed = true;
    } else {
      lotteryStatus.isPassiveAbilityRefreshed = true;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  initSkillReset(playerId: PlayerID) {
    print('[Lottery] initSkillReset called for player: ' + playerId);

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[Lottery] ERROR: Hero not found for player: ' + playerId);
      return;
    }

    print('[Lottery] Hero found: ' + hero.GetUnitName());

    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    // 关键修复: 清除所有技能名称,避免遗留上次重选的数据
    lotteryStatus.activeAbilityName = undefined;
    lotteryStatus.passiveAbilityName = undefined;
    lotteryStatus.activeAbilityLevel = undefined;
    lotteryStatus.passiveAbilityLevel = undefined;

    // 重置计数器
    lotteryStatus.skillResetRemovedCount = 0;
    lotteryStatus.skillResetPickedCount = 0;
    lotteryStatus.isSkillResetMode = true;

    const currentAbilities: any[] = [];

    // 从英雄身上读取实际的lottery技能
    for (let i = 0; i < hero.GetAbilityCount(); i++) {
      const ability = hero.GetAbilityByIndex(i);
      if (ability && !ability.IsHidden() && !ability.IsAttributeBonus()) {
        const abilityName = ability.GetAbilityName();

        // 只保留lottery技能,排除英雄原生技能和物品
        if (
          !abilityName.includes('special_bonus') &&
          !abilityName.includes('generic_hidden') &&
          !abilityName.startsWith('item_')
        ) {
          // 检查是否为lottery技能(在abilityTiersActive或abilityTiersPassive中)
          const isLotteryAbility = this.isLotteryAbility(abilityName);
          if (isLotteryAbility) {
            currentAbilities.push({
              name: abilityName,
              level: ability.GetLevel(),
            });
            print('[Lottery] Found lottery ability: ' + abilityName);
          }
        }
      }
    }

    print('[Lottery] Current lottery abilities count: ' + currentAbilities.length);

    // 上排显示当前的lottery技能
    CustomNetTables.SetTableValue('lottery_active_abilities', steamAccountID, currentAbilities);

    // 下排显示随机的新技能(主动+被动混合)
    this.randomSkillResetAbilities(playerId, false);

    // 更新状态
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    print('[Lottery] initSkillReset completed successfully');
  }

  // 辅助方法:检查技能是否为lottery技能
  private isLotteryAbility(abilityName: string): boolean {
    // 检查主动技能池
    for (const tier of abilityTiersActive) {
      if (tier.names.includes(abilityName)) {
        return true;
      }
    }

    // 检查被动技能池
    for (const tier of abilityTiersPassive) {
      if (tier.names.includes(abilityName)) {
        return true;
      }
    }

    return false;
  }

  // 为技能重选生成随机技能
  randomSkillResetAbilities(playerId: PlayerID, isActive: boolean) {
    const abilityTable = isActive ? 'lottery_active_abilities' : 'lottery_passive_abilities';
    const abilityTiers = isActive ? abilityTiersActive : abilityTiersPassive;
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const executedNames: string[] = [];

    // 生成2个主动技能
    const activeAbilities = LotteryHelper.getRandomAbilities(
      abilityTiersActive,
      2,
      hero,
      executedNames,
      true,
    );

    // 将主动技能名称加入列表
    activeAbilities.forEach((ability) => executedNames.push(ability.name));

    // 生成4个被动技能
    const passiveAbilities = LotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      4,
      hero,
      executedNames,
      true,
    );

    // 合并主动和被动技能
    const abilityLotteryResults = [...activeAbilities, ...passiveAbilities];

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
  }

  pickSkillReset(userId: EntityIndex, event: LotteryPickEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) return;

    const pickedCount = lotteryStatus.skillResetPickedCount ?? 0;
    if (pickedCount >= 1) {
      print('[Lottery] Already picked a skill, ignoring');
      return;
    }

    hero.AddAbility(event.name);

    // 更新技能名称(用于快捷键绑定)
    if (event.type === 'abilityActive') {
      lotteryStatus.activeAbilityName = event.name;
      lotteryStatus.activeAbilityLevel = event.level;
    } else {
      lotteryStatus.passiveAbilityName = event.name;
      lotteryStatus.passiveAbilityLevel = event.level;
    }

    lotteryStatus.skillResetPickedCount = pickedCount + 1;

    const removedCount = lotteryStatus.skillResetRemovedCount ?? 0;

    // 检查是否完成重选
    if (removedCount >= 1 && pickedCount + 1 >= 1) {
      print('[Lottery] Both remove and pick completed, clearing skill reset mode');

      // 计算英雄应该拥有的lottery技能总数
      const gameOptions = CustomNetTables.GetTableValue('game_options', 'game_options');
      const startingGold = gameOptions?.starting_gold_player ?? 5000;

      let maxPassiveCount = 1;
      if (startingGold >= 4982 && startingGold < 5000) {
        maxPassiveCount = 2;
      } else if (startingGold === 4981) {
        maxPassiveCount = 3;
      }
      print('[Lottery] startingGold', startingGold);
      print('[Lottery] startingGold', maxPassiveCount);

      const totalLotterySkills = maxPassiveCount + 1; // 被动技能数 + 1个主动技能

      print('[Lottery] startingGold', hero.GetAbilityCount() - totalLotterySkills - 1);
      print('[Lottery] startingGold', hero.GetAbilityCount());
      // 重新检测英雄的所有lottery技能,取最后几个
      const lotteryAbilities: Array<{ name: string; level: number; ability: CDOTABaseAbility }> =
        [];
      for (let i = hero.GetAbilityCount() - totalLotterySkills; i < hero.GetAbilityCount(); i++) {
        const ability = hero.GetAbilityByIndex(i);
        if (ability) {
          const abilityName = ability.GetAbilityName();
          // 检查是否为lottery技能
          const isLotteryAbility = this.isLotteryAbility(abilityName);
          lotteryAbilities.push({
            name: abilityName,
            level: ability.GetLevel(),
            ability: ability,
          });
        }
      }
      // 获取技能对象用于判断行为
      const abilityObjects: Array<{ name: string; level: number; ability: CDOTABaseAbility }> = [];

      for (const lotteryAbility of lotteryAbilities) {
        for (let i = hero.GetAbilityCount() - totalLotterySkills; i < hero.GetAbilityCount(); i++) {
          const ability = hero.GetAbilityByIndex(i);
          if (ability && ability.GetAbilityName() === lotteryAbility.name) {
            abilityObjects.push({
              name: lotteryAbility.name,
              level: lotteryAbility.level,
              ability: ability,
            });
            break;
          }
        }
      }
      /// 分类技能
      const activeAbilities: typeof abilityObjects = [];
      const activeEffectPassiveAbilities: typeof abilityObjects = []; // 有主动效果的被动技能
      const purePassiveAbilities: typeof abilityObjects = [];

      print('[Lottery] === 开始技能分类 ===');
      print('[Lottery] 待分类技能总数: ' + abilityObjects.length);
      for (const abilityObj of abilityObjects) {
        const isPassive = this.isPassiveAbility(abilityObj.name);
        const behavior = abilityObj.ability.GetBehavior() as number;
        const isToggle = this.IsAbilityBehavior(behavior, 0x00000008); // TOGGLE
        const isAutocast = this.IsAbilityBehavior(behavior, 0x00000020); // AUTOCAST

        print('[Lottery] --- 技能: ' + abilityObj.name + ' ---');
        print('[Lottery]   behavior值: ' + behavior);
        print('[Lottery]   isPassive: ' + isPassive);
        print('[Lottery]   isToggle: ' + isToggle);
        print('[Lottery]   isAutocast: ' + isAutocast);
        if (isPassive) {
          // 被动技能中,如果有toggle或autocast标记,说明有主动效果
          if (isToggle || isAutocast) {
            activeEffectPassiveAbilities.push(abilityObj);
            print('[Lottery]   分类结果: 有主动效果的被动技能');
          } else {
            purePassiveAbilities.push(abilityObj);
            print('[Lottery]   分类结果: 纯被动技能');
          }
        } else {
          // 非被动技能视为主动技能
          activeAbilities.push(abilityObj);
          print('[Lottery]   分类结果: 主动技能');
        }
      }

      print('[Lottery] === 分类统计 ===');
      print('[Lottery] 主动技能数量: ' + activeAbilities.length);
      if (activeAbilities.length > 0) {
        print('[Lottery] 主动技能列表: ' + activeAbilities.map((a) => a.name).join(', '));
      }

      print('[Lottery] 有主动效果的被动技能数量: ' + activeEffectPassiveAbilities.length);
      if (activeEffectPassiveAbilities.length > 0) {
        print(
          '[Lottery] 有主动效果的被动技能列表: ' +
            activeEffectPassiveAbilities.map((a) => a.name).join(', '),
        );
      }

      print('[Lottery] 纯被动技能数量: ' + purePassiveAbilities.length);
      if (purePassiveAbilities.length > 0) {
        print('[Lottery] 纯被动技能列表: ' + purePassiveAbilities.map((a) => a.name).join(', '));
      }

      // 按优先级选择两个技能绑定到快捷键
      const selectedAbilities: typeof abilityObjects = [];

      print('[Lottery] === 开始优先级选择 ===');

      // 优先级1: 主动技能
      selectedAbilities.push(...activeAbilities);
      print('[Lottery] 优先级1(主动技能)后,已选择: ' + selectedAbilities.length + ' 个');

      // 优先级2: 有主动效果的被动技能
      if (selectedAbilities.length < 2) {
        const beforeCount = selectedAbilities.length;
        selectedAbilities.push(...activeEffectPassiveAbilities);
        print(
          '[Lottery] 优先级2(有主动效果的被动)后,已选择: ' +
            selectedAbilities.length +
            ' 个 (新增 ' +
            (selectedAbilities.length - beforeCount) +
            ' 个)',
        );
      }

      // 优先级3: 纯被动技能 - 从后往前选
      if (selectedAbilities.length < 2) {
        const beforeCount = selectedAbilities.length;
        const remainingSlots = 2 - selectedAbilities.length;

        // 从后往前取需要的数量
        const passivesToAdd = purePassiveAbilities.slice(-remainingSlots);
        selectedAbilities.push(...passivesToAdd);

        print(
          '[Lottery] 优先级3(纯被动,从后往前)后,已选择: ' +
            selectedAbilities.length +
            ' 个 (新增 ' +
            (selectedAbilities.length - beforeCount) +
            ' 个)',
        );
      }

      print('[Lottery] === 最终选择结果 ===');
      print('[Lottery] 最终选中技能数量: ' + selectedAbilities.length);

      // 更新快捷键绑定
      if (selectedAbilities.length > 0) {
        lotteryStatus.activeAbilityName = selectedAbilities[0].name;
        lotteryStatus.activeAbilityLevel = selectedAbilities[0].level;
        print('[Lottery] Updated active keybinding: ' + selectedAbilities[0].name);
      }

      if (selectedAbilities.length > 1) {
        lotteryStatus.passiveAbilityName = selectedAbilities[1].name;
        lotteryStatus.passiveAbilityLevel = selectedAbilities[1].level;
        print('[Lottery] Updated passive keybinding: ' + selectedAbilities[1].name);
      }
      lotteryStatus.isSkillResetMode = false;
      lotteryStatus.skillResetRemovedCount = 0;
      lotteryStatus.skillResetPickedCount = 0;

      // 重选完成后,设置计数为1
      lotteryStatus.activeAbilityCount = 1;
      lotteryStatus.passiveAbilityCount = 1;
    } else {
      lotteryStatus.isSkillResetMode = true;
    }

    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  private isPassiveAbility(abilityName: string): boolean {
    for (const tier of abilityTiersPassive) {
      if (tier.names.includes(abilityName)) {
        return true;
      }
    }
    return false;
  }

  IsAbilityBehavior(behavior: number, judge: number): boolean {
    // 确保 behavior 是数字类型
    let behaviorNum = behavior;
    if (typeof behavior !== 'number') {
      behaviorNum = tonumber(tostring(behavior)) ?? 0;
    }

    // 检查 judge 的位是否在 behavior 中被设置
    return (behaviorNum & judge) !== 0;
  }

  removeSkillInReset(userId: EntityIndex, event: LotteryPickEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    // 检查是否已经移除过技能
    const removedCount = lotteryStatus.skillResetRemovedCount ?? 0;
    if (removedCount >= 1) {
      print('[Lottery] Already removed a skill, ignoring');
      return;
    }

    // 移除技能
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) return;

    const oldAbility = hero.FindAbilityByName(event.name);
    if (oldAbility) {
      const abilityPoints = oldAbility.GetLevel();
      hero.RemoveAbility(event.name);
      if (abilityPoints > 0) {
        hero.SetAbilityPoints(hero.GetAbilityPoints() + abilityPoints);
      }
    }

    // 关键修改: 不清除技能名称,保持原值
    // 这样在 pickSkillReset 中可以从上排恢复未被替换的技能

    // 更新计数器并检查是否完成
    lotteryStatus.skillResetRemovedCount = removedCount + 1;
    lotteryStatus.skillResetPickedCount = lotteryStatus.skillResetPickedCount ?? 0; // 显式保留

    const pickedCount = lotteryStatus.skillResetPickedCount;

    // 检查是否完成重选(移除和选择都至少一次)
    if (removedCount + 1 >= 1 && pickedCount >= 1) {
      print('[Lottery] Both remove and pick completed, clearing skill reset mode');
      lotteryStatus.isSkillResetMode = false;
      lotteryStatus.skillResetRemovedCount = 0;
      lotteryStatus.skillResetPickedCount = 0;
      lotteryStatus.passiveAbilityCount = 1;
      lotteryStatus.activeAbilityCount = 1;
    } else {
      print('[Lottery] Not completed yet, keeping skill reset mode active');
      lotteryStatus.isSkillResetMode = true;
    }

    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    // 更新上排显示,移除已删除的技能
    const activeAbilities = CustomNetTables.GetTableValue(
      'lottery_active_abilities',
      steamAccountID,
    );
    if (activeAbilities !== undefined) {
      const abilities = Object.values(activeAbilities) as any[];
      const updatedAbilities = abilities.filter((ability: any) => ability.name !== event.name);
      CustomNetTables.SetTableValue('lottery_active_abilities', steamAccountID, updatedAbilities);
    }

    print('[Lottery] Skill removed: ' + event.name);
    print('[Lottery] Remove count: ' + (removedCount + 1));
  }
}
