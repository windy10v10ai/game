import { LotteryDto } from '../../../common/dto/lottery';
import { PlayerHelper } from '../../helper/player-helper';
import { reloadable } from '../../utils/tstl-utils';
import { itemTier, Tier } from './tier-data';

@reloadable
export class Lottery {
  readonly normalItemCount = 3;
  readonly memberItemCount = 1;

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
              this.StartItemLottery();
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

  StartItemLottery() {
    print('StartItemLottery');
    PlayerHelper.ForEachPlayer((playerId) => {
      if (!PlayerHelper.IsHumanPlayerByPlayerId(playerId)) {
        return;
      }
      this.RandomItemForPlayer(playerId);
    });
  }

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

  RandomItemForPlayer(playerId: PlayerID) {
    // 抽取3个普通物品和1个会员物品，如果有重复的，重新抽取
    const items = this.getRandomNames(
      itemTier,
      this.normalItemCount + this.memberItemCount,
      'item_branches',
    );
    const itemNamesNormal = items.slice(0, this.normalItemCount);
    const itemNamesMember = items.slice(this.normalItemCount);

    // 将抽选结果放到nettable lottery中
    const lotteryDto: LotteryDto = {
      itemNamesNormal,
      itemNamesMember,
      pickItemName: undefined,
    };
    CustomNetTables.SetTableValue(
      'lottery',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      lotteryDto,
    );
  }

  pickItem(userId: EntityIndex, event: LotteryPickItemEventData) {
    print('Choose item');
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    const steamAccountId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const lotteryDto = CustomNetTables.GetTableValue(
      'lottery',
      steamAccountId.toString(),
    ) as LotteryDto;

    if (lotteryDto.pickItemName) {
      return;
    }

    // 添加物品
    hero.AddItemByName(event.item);
    lotteryDto.pickItemName = event.item;
    CustomNetTables.SetTableValue('lottery', steamAccountId.toString(), lotteryDto);
  }

  // 刷新物品
  refreshItem(userId: EntityIndex, event: LotteryRefreshItemEventData) {
    print('Refresh item');
    const steamAccountId = PlayerResource.GetSteamAccountID(event.PlayerID);
    const lotteryRaw = CustomNetTables.GetTableValue('lottery', steamAccountId.toString());

    print('lotteryRaw');
    DeepPrintTable(lotteryRaw);
    const lotteryDto: LotteryDto = {
      itemNamesNormal: Object.values(lotteryRaw?.itemNamesNormal) || [],
      itemNamesMember: Object.values(lotteryRaw?.itemNamesMember) || [],
      pickItemName: lotteryRaw?.pickItemName,
    };

    print('lotteryDto');
    DeepPrintTable(lotteryDto);
    lotteryDto.itemNamesNormal.push(lotteryDto.itemNamesMember[0]);

    print('lotteryDto add');
    DeepPrintTable(lotteryDto);

    // 如果已经抽取了，不再刷新
    // TODO 测试时注释掉
    // if (lotteryDto.pickItemName) {
    //   return;
    // }

    this.RandomItemForPlayer(event.PlayerID);
  }
}
