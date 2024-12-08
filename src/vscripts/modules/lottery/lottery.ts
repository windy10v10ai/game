import { Analytic } from '../../api/analytics';
import { reloadable } from '../../utils/tstl-utils';
import { GameConfig } from '../GameConfig';
import { NetTableHelper } from '../helper/net-table-helper';
import { PlayerHelper } from '../helper/player-helper';
import { LotteryHelper } from './lottery-helper';

@reloadable
export class Lottery {
  readonly randomCountBase = 3;

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
    // 玩家选择物品
    CustomGameEventManager.RegisterListener('lottery_pick_item', (userId, event) => {
      this.pickItem(userId, event);
    });
    // 玩家刷新物品
    CustomGameEventManager.RegisterListener('lottery_refresh_item', (userId, event) => {
      this.refreshItem(userId, event);
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
    this.randomItemForPlayer(playerId);
    this.randomAbilityForPlayer(playerId);

    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      { isItemRefreshed: false, isAbilityRefreshed: false },
    );
  }

  // ---- 随机抽选 ----
  randomItemForPlayer(playerId: PlayerID) {
    // 排除刷新前抽取的
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryItemsRaw = CustomNetTables.GetTableValue('lottery_items', steamAccountID);
    const executedNames = !!lotteryItemsRaw
      ? Object.values(lotteryItemsRaw).map((item) => item.name)
      : [];
    const itemLotteryResults = LotteryHelper.getRandomItems(this.randomCountBase, executedNames);

    CustomNetTables.SetTableValue(
      'lottery_items',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      itemLotteryResults,
    );
  }

  randomAbilityForPlayer(playerId: PlayerID) {
    // 排除刷新前抽取的
    const steamAccountID = PlayerResource.GetSteamAccountID(playerId).toString();
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue('lottery_abilities', steamAccountID);
    const executedNames = !!lotteryAbilitiesRaw
      ? Object.values(lotteryAbilitiesRaw).map((item) => item.name)
      : [];
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(
      this.randomCountBase,
      hero,
      executedNames,
    );

    CustomNetTables.SetTableValue(
      'lottery_abilities',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      abilityLotteryResults,
    );
  }

  // ---- 玩家选择 ----
  pickItem(userId: EntityIndex, event: LotteryPickEventDataWithPlayer) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (lotteryStatus.pickItemName) {
      print('已经抽取过物品');
      return;
    }

    // 添加物品
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) {
      return;
    }
    hero.AddItemByName(event.name);

    // 记录选择的物品
    lotteryStatus.pickItemName = event.name;
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  pickAbility(userId: EntityIndex, event: LotteryPickEventDataWithPlayer) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (lotteryStatus.pickAbilityName) {
      print('已经抽取过技能');
      return;
    }

    // 添加技能
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
    if (!hero) {
      return;
    }
    hero.AddAbility(event.name);

    // 记录选择的技能
    lotteryStatus.pickAbilityName = event.name;
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);

    // 发送分析事件
    const lotteryAbilitiesRaw = CustomNetTables.GetTableValue('lottery_abilities', steamAccountID);
    const level =
      Object.values(lotteryAbilitiesRaw).find((item) => item.name === event.name)?.level ?? 1;
    // find rate by event name

    Analytic.SendPickAbilityEvent({
      steamAccountId: PlayerResource.GetSteamAccountID(event.PlayerID),
      matchId: GameRules.Script_GetMatchID().toString(),
      name: event.name,
      level,
      difficulty: GameRules.Option.gameDifficulty,
      version: GameConfig.GAME_VERSION,
    });
  }

  // ---- 玩家刷新 ----
  refreshItem(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (lotteryStatus.isItemRefreshed || lotteryStatus.pickItemName) {
      print('已经刷新/抽取过物品');
      return;
    }
    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新物品');
      return;
    }

    // 刷新物品
    this.randomItemForPlayer(event.PlayerID);

    // 记录刷新状态
    lotteryStatus.isItemRefreshed = true;
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }

  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    const steamAccountID = PlayerResource.GetSteamAccountID(event.PlayerID).toString();
    const lotteryStatus = NetTableHelper.GetLotteryStatus(steamAccountID);
    if (lotteryStatus.isAbilityRefreshed || lotteryStatus.pickAbilityName) {
      print('已经刷新/抽取过技能');
      return;
    }
    const member = NetTableHelper.GetMember(steamAccountID);
    if (!member.enable) {
      print('非会员不能刷新物品');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID);

    // 记录刷新状态
    lotteryStatus.isAbilityRefreshed = true;
    CustomNetTables.SetTableValue('lottery_status', steamAccountID, lotteryStatus);
  }
}
