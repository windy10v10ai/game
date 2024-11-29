import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';
import { LotteryHelper } from './lottery-helper';

@reloadable
export class Lottery {
  // TODO 改回3个
  readonly randomCountBase = 5;

  constructor() {
    // 启动物品抽奖
    ListenToGameEvent(
      'game_rules_state_change',
      () => {
        if (GameRules.State_Get() === GameState.PRE_GAME) {
          // TODO remove this
          // wait 1 second before starting the item lottery
          Timers.CreateTimer({
            endTime: 1,
            callback: () => {
              this.initItemLotteryAll();
            },
          });
        }
      },
      undefined,
    );

    // 玩家选择物品
    CustomGameEventManager.RegisterListener('lottery_pick_item', (userId, event) => {
      this.pickItem(userId, event);
    });
    // 玩家刷新物品
    CustomGameEventManager.RegisterListener('lottery_refresh_item', (userId, event) => {
      this.refreshItem(userId, event);
    });
  }

  initItemLotteryAll() {
    print('StartItemLottery');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.initItemLottery(playerId);
    });
  }

  initItemLottery(playerId: PlayerID) {
    this.randomItemForPlayer(playerId);
    this.randomAbilityForPlayer(playerId);
    // TODO 初始化抽选状态
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
    print(`pickItem ${event.name}`);
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    // 添加物品
    hero.AddItemByName(event.name);

    // TODO 记录选择的物品
  }

  refreshItem(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    // TODO 如果已经抽取了，不再刷新

    this.randomItemForPlayer(event.PlayerID);
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
    print(`pickAbility ${event.name}`);
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    // 添加技能
    hero.AddAbility(event.name);

    // TODO 记录选择的技能
  }

  refreshAbility(userId: EntityIndex, event: LotteryRefreshEventDataWithPlayer) {
    // TODO 如果已经抽取了，不再刷新

    this.randomAbilityForPlayer(event.PlayerID);
  }
}
