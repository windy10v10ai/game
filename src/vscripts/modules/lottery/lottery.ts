import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';
import { itemTier, Tier } from './lottery-tier';

@reloadable
export class Lottery {
  readonly randomItemCountBase = 3;

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
    // TODO 初始化抽选状态
  }

  randomItemForPlayer(playerId: PlayerID) {
    const itemNames = this.getRandomNames(itemTier, this.randomItemCountBase, 'item_branches');

    CustomNetTables.SetTableValue(
      'lottery_items',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      itemNames,
    );
  }

  pickItem(userId: EntityIndex, event: LotteryPickItemEventData) {
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    // 添加物品
    hero.AddItemByName(event.item);

    // TODO 记录选择的物品
  }

  // 刷新物品
  refreshItem(userId: EntityIndex, event: LotteryRefreshItemEventData) {
    // TODO 如果已经抽取了，不再刷新

    this.randomItemForPlayer(event.PlayerID);
  }

  // ----------------- private -----------------
  // 随机决定tier
  private getRandomTier(tiers: Tier[]): Tier {
    const draw = Math.random() * 100;

    for (const tier of tiers) {
      if (draw <= tier.rate) {
        return tier;
      }
    }
    return tiers[tiers.length - 1];
  }

  // 随机抽选一个name
  private getRandomName(tiers: Tier[]): string {
    const names = this.getRandomTier(tiers).names;
    return names[Math.floor(Math.random() * names.length)];
  }

  // 随机抽选count个name
  private getRandomNames(tiers: Tier[], count: number, defaultName: string): string[] {
    const names: string[] = [];
    const maxAttempts = 10; // 最大尝试次数，避免无限循环
    for (let i = 0; i < count; i++) {
      let name = defaultName; // 默认物品，不应该被抽到
      let attempts = 0;
      do {
        name = this.getRandomName(tiers);
        attempts++;
      } while (names.includes(name) && attempts < maxAttempts);
      names.push(name);
    }
    return names;
  }
}
