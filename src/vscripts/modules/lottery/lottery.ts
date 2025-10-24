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

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed2: false,
      },
    );
  }

  // ---- 随机技能 ----
  randomAbilityForPlayer(playerId: PlayerID, abilityType: AbilityItemType) {
    const abilityTable =
      abilityType === 'abilityActive'
        ? 'lottery_active_abilities'
        : abilityType === 'abilityPassive'
          ? 'lottery_passive_abilities'
          : 'lottery_passive_abilities_2';
    const abilityTiers = abilityType === 'abilityActive' ? abilityTiersActive : abilityTiersPassive;
    // 排除刷新前抽取的
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue(abilityTable, steamAccountID);
    const executedNames = !!lotteryAbilitiesRaw
      ? Object.values(lotteryAbilitiesRaw).map((item) => item.name)
      : [];

    // 如果是passive技能，则排除另外一组被动技能
    if (abilityType === 'abilityPassive' || abilityType === 'abilityPassive2') {
      const otherAbilityTable =
        abilityType === 'abilityPassive'
          ? 'lottery_passive_abilities_2'
          : 'lottery_passive_abilities';
      const otherAbilityAbilitiesRaw = CustomNetTables.GetTableValue(
        otherAbilityTable,
        steamAccountID,
      );
      const otherAbilityExecutedNames = !!otherAbilityAbilitiesRaw
        ? Object.values(otherAbilityAbilitiesRaw).map((item) => item.name)
        : [];
      executedNames.push(...otherAbilityExecutedNames);
    }

    // 随机技能
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(
      abilityTiers,
      this.randomCountBase,
      hero,
      executedNames,
    );

    // 会员额外技能
    const member = NetTableHelper.GetMember(steamAccountID);
    if (member.enable && member.level >= MemberLevel.PREMIUM) {
      const extraAbilities = LotteryHelper.getRandomAbilities(
        abilityTiers,
        this.randomCountExtra,
        hero,
        executedNames,
        true, // 使用高级别技能
      );
      abilityLotteryResults.push(...extraAbilities);
    }

    // 强制第一个被动技能为 固定技能
    if (abilityType === 'abilityPassive' && abilityLotteryResults.length > 0) {
      const specifiedAbility = this.getSpecifiedPassiveAbilityByFixedAbility();
      if (specifiedAbility) {
        abilityLotteryResults[0] = specifiedAbility;
      }
    }

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
  }

  /**
   * 获取固定技能，不存在则返回null
   */
  private getSpecifiedPassiveAbilityByFixedAbility(): LotteryDto | null {
    const fixedAbility = GameRules.Option.fixedAbility;

    if (fixedAbility === 'none') {
      return null;
    }

    // 从 abilityTiersPassive 中找到技能等级
    for (const tier of abilityTiersPassive) {
      if (tier.names.includes(fixedAbility)) {
        return { name: fixedAbility, level: tier.level };
      }
    }

    // 从 abilityTiersActive 中找到技能等级
    for (const tier of abilityTiersActive) {
      if (tier.names.includes(fixedAbility)) {
        return { name: fixedAbility, level: tier.level };
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

  // ---- 刷新 ----
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
    if (event.type === 'abilityActive') {
      if (lotteryStatus.isActiveAbilityRefreshed || lotteryStatus.activeAbilityName) {
        print('已经刷新/抽取过主动技能');
        return;
      }
    }
    // 将被动技能刷新检查改为：
    if (event.type === 'abilityPassive') {
      if (lotteryStatus.isPassiveAbilityRefreshed || lotteryStatus.passiveAbilityName) {
        print('已经刷新/抽取过被动技能');
        return;
      }
    }
    // 检查第二个被动技能槽位刷新
    if (event.type === 'abilityPassive2') {
      if (lotteryStatus.isPassiveAbilityRefreshed2 || lotteryStatus.passiveAbilityName2) {
        print('已经刷新/抽取过第二个被动技能');
        return;
      }
    }

    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID, event.type);

    // 记录刷新状态
    if (event.type === 'abilityActive') {
      lotteryStatus.isActiveAbilityRefreshed = true;
    } else if (event.type === 'abilityPassive') {
      lotteryStatus.isPassiveAbilityRefreshed = true;
    } else if (event.type === 'abilityPassive2') {
      lotteryStatus.isPassiveAbilityRefreshed2 = true;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  initAbilityReset(playerId: PlayerID) {
    print('[Lottery] initAbilityReset called for player: ' + playerId);

    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    // 增加技能重选次数
    const currentCount = lotteryStatus.abilityResettableCount ?? 0;
    lotteryStatus.abilityResettableCount = currentCount + 1;

    print('[Lottery] Ability reset count increased to: ' + lotteryStatus.abilityResettableCount);
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

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
    } else if (abilityType === 'abilityPassive') {
      lotteryStatus.passiveAbilityName = undefined;
      lotteryStatus.passiveAbilityLevel = undefined;
      lotteryStatus.isPassiveAbilityRefreshed = false;
    } else if (abilityType === 'abilityPassive2') {
      lotteryStatus.passiveAbilityName2 = undefined;
      lotteryStatus.passiveAbilityLevel2 = undefined;
      lotteryStatus.isPassiveAbilityRefreshed2 = false;
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
