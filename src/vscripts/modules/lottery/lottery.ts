import { LotteryStatusDto } from '../../../common/dto/lottery-status';
import { reloadable } from '../../utils/tstl-utils';
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
          this.initLotteryAll();
        }
      },
      undefined,
    );

    // 玩家选择额能
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

  // ---- 物品逻辑 ----
  randomItemForPlayer(playerId: PlayerID) {
    const itemLotteryResults = LotteryHelper.getRandomItems(this.randomCountBase);

    CustomNetTables.SetTableValue(
      'lottery_items',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      itemLotteryResults,
    );
  }

  pickItem(userId: EntityIndex, event: LotteryPickEventDataWithPlayer) {
    const lotteryStatus = this.getLotteryStatus(event.PlayerID);
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
    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(event.PlayerID).toString(),
      lotteryStatus,
    );
  }

  refreshItem(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    const lotteryStatus = this.getLotteryStatus(event.PlayerID);
    if (lotteryStatus.isItemRefreshed || lotteryStatus.pickItemName) {
      print('已经刷新/抽取过物品');
      return;
    }

    // 刷新物品
    this.randomItemForPlayer(event.PlayerID);

    // 记录刷新状态
    lotteryStatus.isItemRefreshed = true;
    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(event.PlayerID).toString(),
      lotteryStatus,
    );
  }

  // ---- 技能逻辑 ----
  randomAbilityForPlayer(playerId: PlayerID) {
    const abilityLotteryResults = LotteryHelper.getRandomAbilities(this.randomCountBase);

    CustomNetTables.SetTableValue(
      'lottery_abilities',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      abilityLotteryResults,
    );
  }

  pickAbility(userId: EntityIndex, event: LotteryPickEventDataWithPlayer) {
    const lotteryStatus = this.getLotteryStatus(event.PlayerID);
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
    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(event.PlayerID).toString(),
      lotteryStatus,
    );
  }

  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    const lotteryStatus = this.getLotteryStatus(event.PlayerID);
    if (lotteryStatus.isAbilityRefreshed || lotteryStatus.pickAbilityName) {
      print('已经刷新/抽取过技能');
      return;
    }

    // 刷新技能
    this.randomAbilityForPlayer(event.PlayerID);

    // 记录刷新状态
    lotteryStatus.isAbilityRefreshed = true;
    CustomNetTables.SetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(event.PlayerID).toString(),
      lotteryStatus,
    );
  }

  private getLotteryStatus(playerId: PlayerID): LotteryStatusDto {
    const lotteryStatusData = CustomNetTables.GetTableValue(
      'lottery_status',
      PlayerResource.GetSteamAccountID(playerId).toString(),
    );
    if (!lotteryStatusData) {
      return { isItemRefreshed: false, isAbilityRefreshed: false };
    }
    return {
      pickItemName: lotteryStatusData.pickItemName,
      pickAbilityName: lotteryStatusData.pickAbilityName,
      isItemRefreshed: lotteryStatusData.isItemRefreshed === 1,
      isAbilityRefreshed: lotteryStatusData.isAbilityRefreshed === 1,
    };
  }
}
