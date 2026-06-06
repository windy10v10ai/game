import { AbilityItemType, LotteryDto } from '../../../../common/dto/lottery';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { ApiClient } from '../../../api/api-client';
import { PlayerMemberPointApi } from '../../../api/player-member-point';
import { MemberLevel, Player } from '../../../api/player';
import { reloadable } from '../../../utils/tstl-utils';
import { NetTableHelper } from '../../helper/net-table-helper';
import { PlayerHelper } from '../../helper/player-helper';
import { AbilityLotteryHelper } from './ability-lottery-helper';
import { AbilityItemTypes } from './ability-item-type';
import { abilityTiersActive, abilityTiersPassive } from './lottery-abilities';

@reloadable
export class AbilityLottery {
  readonly randomCountBase = 6;
  readonly randomCountExtra = 2;

  // 付费刷新累进消耗：首次免费后，第 n 次付费(n 从 0)取此表，封顶 50
  readonly paidRefreshCosts = [10, 20, 30, 50];

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
    this.randomAbilityForPlayer(playerId, AbilityItemTypes.Active);
    this.randomAbilityForPlayer(playerId, AbilityItemTypes.Passive);
    this.randomAbilityForPlayer(playerId, AbilityItemTypes.Passive2);

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      {
        isActiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed: false,
        isPassiveAbilityRefreshed2: false,
        activePaidRefreshCount: 0,
        passivePaidRefreshCount: 0,
        passivePaidRefreshCount2: 0,
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
    if (abilityType === AbilityItemTypes.Active) return 'lottery_active_abilities';
    if (abilityType === AbilityItemTypes.Passive) return 'lottery_passive_abilities';
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
    if (abilityType === AbilityItemTypes.Passive || abilityType === AbilityItemTypes.Passive2) {
      const otherTable =
        abilityType === AbilityItemTypes.Passive
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
    const abilityTiers =
      abilityType === AbilityItemTypes.Active ? abilityTiersActive : abilityTiersPassive;
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);

    // 获取已排除的技能
    const executedNames = this.getExcludedAbilityNames(abilityType, steamAccountID);

    // 生成随机技能
    const abilityLotteryResults = AbilityLotteryHelper.getRandomAbilities(
      abilityTiers,
      this.randomCountBase,
      hero,
      executedNames,
    );

    // 添加会员额外技能
    const memberLevel = Player.GetMemberLevel(Number(steamAccountID));
    if (memberLevel >= MemberLevel.PREMIUM) {
      const extraAbilities = AbilityLotteryHelper.getRandomAbilities(
        abilityTiers,
        this.randomCountExtra,
        hero,
        executedNames,
        true,
      );
      abilityLotteryResults.push(...extraAbilities);
    }

    // 应用固定技能
    if (abilityLotteryResults.length > 0) {
      const specifiedAbilityInfo = this.getSpecifiedAbilityByFixedAbility();
      if (specifiedAbilityInfo) {
        // 固定技能逻辑
        const { ability: specifiedAbility, isActive } = specifiedAbilityInfo;
        if (isActive && abilityType === AbilityItemTypes.Active) {
          abilityLotteryResults[0] = specifiedAbility;
        } else if (!isActive && abilityType === AbilityItemTypes.Passive) {
          abilityLotteryResults[0] = specifiedAbility;
        }
      }
      if (IsInToolsMode()) {
        // 开发测试用固定技能
        if (abilityType === AbilityItemTypes.Active) {
          abilityLotteryResults[0] = { name: 'pudge_meat_hook_lua', level: 2 };
        }
      }
    }

    CustomNetTables.SetTableValue(abilityTable, steamAccountID, abilityLotteryResults);
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
    if (abilityType === AbilityItemTypes.Active && lotteryStatus.activeAbilityName) {
      print('已经抽取过主动技能');
      return;
    }
    if (abilityType === AbilityItemTypes.Passive && lotteryStatus.passiveAbilityName) {
      print('已经抽取过被动技能');
      return;
    }
    if (abilityType === AbilityItemTypes.Passive2 && lotteryStatus.passiveAbilityName2) {
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
    if (abilityType === AbilityItemTypes.Active) {
      lotteryStatus.activeAbilityName = event.name;
      lotteryStatus.activeAbilityLevel = event.level;
    } else if (abilityType === AbilityItemTypes.Passive) {
      lotteryStatus.passiveAbilityName = event.name;
      lotteryStatus.passiveAbilityLevel = event.level;
      // 增加被动技能选择计数
    } else if (abilityType === AbilityItemTypes.Passive2) {
      lotteryStatus.passiveAbilityName2 = event.name;
      lotteryStatus.passiveAbilityLevel2 = event.level;
    }
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  // ---- 刷新 ----
  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventData & CustomGameEventDataBase) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    const abilityType = event.type;
    if (
      abilityType !== AbilityItemTypes.Active &&
      abilityType !== AbilityItemTypes.Passive &&
      abilityType !== AbilityItemTypes.Passive2
    ) {
      print('刷新技能类型错误');
      return;
    }

    // 已选技能的槽位锁定，不可再刷新
    const pickedName = this.getPickedName(lotteryStatus, abilityType);
    if (pickedName) {
      print('已经抽取过技能，不能刷新');
      return;
    }

    if (!Player.IsMemberStatic(Number(steamAccountID))) {
      print('非会员不能刷新');
      return;
    }

    const isRefreshed = this.isSlotRefreshed(lotteryStatus, abilityType);
    if (!isRefreshed) {
      // 免费刷新：首次不消耗积分
      this.randomAbilityForPlayer(event.PlayerID, abilityType);
      this.setSlotRefreshed(lotteryStatus, abilityType, true);
      CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
      return;
    }

    // 付费刷新仅限官方服务器
    if (ApiClient.IsLocalhost()) {
      print('非官方服务器不能付费刷新');
      return;
    }

    const paidCount = this.getSlotPaidCount(lotteryStatus, abilityType);
    const cost = this.getPaidRefreshCost(paidCount);

    // 乐观更新：不等 API 回包，直接重抽并本地预扣积分；回包再以服务端真实积分纠正
    const steamId = Number(steamAccountID);
    if (Player.GetUseableMemberPoint(steamId) < cost) {
      print('会员积分不足，无法付费刷新');
      return;
    }
    Player.DeductUseableMemberPoint(steamId, cost);
    PlayerMemberPointApi.UseMemberPoint(steamId, cost, 'lottery_refresh_ability');

    this.randomAbilityForPlayer(event.PlayerID, abilityType);
    this.setSlotPaidCount(lotteryStatus, abilityType, paidCount + 1);
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  /** 第 paidCount 次付费(从 0 起)的积分消耗，封顶为表内最后一档 */
  private getPaidRefreshCost(paidCount: number): number {
    const index = Math.min(paidCount, this.paidRefreshCosts.length - 1);
    return this.paidRefreshCosts[index];
  }

  private getPickedName(
    lotteryStatus: LotteryStatusDto,
    abilityType: AbilityItemType,
  ): string | undefined {
    if (abilityType === AbilityItemTypes.Active) return lotteryStatus.activeAbilityName;
    if (abilityType === AbilityItemTypes.Passive) return lotteryStatus.passiveAbilityName;
    return lotteryStatus.passiveAbilityName2;
  }

  private isSlotRefreshed(lotteryStatus: LotteryStatusDto, abilityType: AbilityItemType): boolean {
    if (abilityType === AbilityItemTypes.Active) return lotteryStatus.isActiveAbilityRefreshed;
    if (abilityType === AbilityItemTypes.Passive) return lotteryStatus.isPassiveAbilityRefreshed;
    return lotteryStatus.isPassiveAbilityRefreshed2;
  }

  private setSlotRefreshed(
    lotteryStatus: LotteryStatusDto,
    abilityType: AbilityItemType,
    value: boolean,
  ) {
    if (abilityType === AbilityItemTypes.Active) {
      lotteryStatus.isActiveAbilityRefreshed = value;
    } else if (abilityType === AbilityItemTypes.Passive) {
      lotteryStatus.isPassiveAbilityRefreshed = value;
    } else {
      lotteryStatus.isPassiveAbilityRefreshed2 = value;
    }
  }

  private getSlotPaidCount(lotteryStatus: LotteryStatusDto, abilityType: AbilityItemType): number {
    if (abilityType === AbilityItemTypes.Active) return lotteryStatus.activePaidRefreshCount;
    if (abilityType === AbilityItemTypes.Passive) return lotteryStatus.passivePaidRefreshCount;
    return lotteryStatus.passivePaidRefreshCount2;
  }

  private setSlotPaidCount(
    lotteryStatus: LotteryStatusDto,
    abilityType: AbilityItemType,
    value: number,
  ) {
    if (abilityType === AbilityItemTypes.Active) {
      lotteryStatus.activePaidRefreshCount = value;
    } else if (abilityType === AbilityItemTypes.Passive) {
      lotteryStatus.passivePaidRefreshCount = value;
    } else {
      lotteryStatus.passivePaidRefreshCount2 = value;
    }
  }

  /**
   * 初始化技能重选次数
   */
  InitAbilityReset(playerId: PlayerID): boolean {
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);

    // 增加技能重选次数
    const currentCount = lotteryStatus.abilityResettableCount ?? 0;
    lotteryStatus.abilityResettableCount = currentCount + 1;
    lotteryStatus.showAbilityResetButton = true;

    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
    return true;
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
    if (abilityType === AbilityItemTypes.Active) {
      pickedAbilityName = lotteryStatus.activeAbilityName;
    } else if (abilityType === AbilityItemTypes.Passive) {
      pickedAbilityName = lotteryStatus.passiveAbilityName;
    } else if (abilityType === AbilityItemTypes.Passive2) {
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

    // 清除对应的技能名称和等级，付费刷新计数一并归零（消耗梯度回到第一档）
    if (abilityType === AbilityItemTypes.Active) {
      lotteryStatus.activeAbilityName = undefined;
      lotteryStatus.activeAbilityLevel = undefined;
      lotteryStatus.isActiveAbilityRefreshed = false;
      lotteryStatus.activePaidRefreshCount = 0;
    } else if (abilityType === AbilityItemTypes.Passive) {
      lotteryStatus.passiveAbilityName = undefined;
      lotteryStatus.passiveAbilityLevel = undefined;
      lotteryStatus.isPassiveAbilityRefreshed = false;
      lotteryStatus.passivePaidRefreshCount = 0;
    } else if (abilityType === AbilityItemTypes.Passive2) {
      lotteryStatus.passiveAbilityName2 = undefined;
      lotteryStatus.passiveAbilityLevel2 = undefined;
      lotteryStatus.isPassiveAbilityRefreshed2 = false;
      lotteryStatus.passivePaidRefreshCount2 = 0;
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

declare global {
  function InitAbilityReset(playerId: PlayerID): boolean;
}

_G.InitAbilityReset = (playerId: PlayerID) => {
  return GameRules.Lottery.Ability.InitAbilityReset(playerId);
};
