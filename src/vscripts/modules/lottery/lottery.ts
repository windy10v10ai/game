import { LotteryDto } from '../../../common/dto/lottery';
import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';
import { itemTier, Tier } from './lottery-tier';

@reloadable
export class Lottery {
  // TODO 改回3个
  readonly randomItemCountBase = 5;

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
    const itemLotteryResults = this.randomAllLotteryResults(
      itemTier,
      this.randomItemCountBase,
      'item_branches',
    );

    CustomNetTables.SetTableValue(
      'lottery_items',
      PlayerResource.GetSteamAccountID(playerId).toString(),
      itemLotteryResults,
    );
  }

  pickItem(userId: EntityIndex, event: LotteryPickEventDataWithPlayer) {
    print('pickItem');
    const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);

    if (!hero) {
      return;
    }

    // 添加物品
    hero.AddItemByName(event.name);

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
  private randomOneLotteryDto(tiers: Tier[]): LotteryDto {
    const tier = this.getRandomTier(tiers);
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    const level = tier.level;
    return { name, level };
  }

  // 随机抽选count个name
  private randomAllLotteryResults(tiers: Tier[], count: number, defaultName: string): LotteryDto[] {
    const lotteryResults: LotteryDto[] = [];
    const maxAttempts = 10; // 最大尝试次数，避免无限循环
    for (let i = 0; i < count; i++) {
      let lotteryDto = { name: defaultName, level: 1 };
      let attempts = 0;
      do {
        lotteryDto = this.randomOneLotteryDto(tiers);
        attempts++;
      } while (
        lotteryResults.map((lotteryDto) => lotteryDto.name).includes(lotteryDto.name) &&
        attempts < maxAttempts
      );
      lotteryResults.push(lotteryDto);
    }
    return lotteryResults;
  }
}
