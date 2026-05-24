import { ItemLotteryDto } from '../../../../common/dto/lottery-item';
import { reloadable } from '../../../utils/tstl-utils';
import { PlayerHelper } from '../../helper/player-helper';
import { ItemLotteryHelper } from './item-lottery-helper';

/**
 * 物品抽奖：触发后弹 4 选 1，倒计时未选自动随机选 1。
 * 触发源（藏宝箱 / 未来 boss / 商店开箱）调 onTriggered 即可，本模块不关心来源。
 */
@reloadable
export class ItemLottery {
  static readonly CANDIDATE_COUNT = 4;
  static readonly EXPIRE_SECONDS = 12;

  constructor() {
    CustomGameEventManager.RegisterListener('lottery_pick_item', (_userId, event) => {
      this.pickItem(event.PlayerID, event.index);
    });
  }

  /**
   * 触发一次抽奖。opener 非人类（bot/中立）直接返回，奖励丢失。
   */
  onTriggered(opener: CDOTA_BaseNPC | undefined): void {
    if (!PlayerHelper.IsHumanPlayer(opener)) {
      return;
    }
    const playerId = opener!.GetPlayerOwnerID();
    if (playerId < 0) return;

    const candidates = ItemLotteryHelper.getRandomItems(ItemLottery.CANDIDATE_COUNT);
    const dto: ItemLotteryDto = {
      candidates,
      expireAt: GameRules.GetGameTime() + ItemLottery.EXPIRE_SECONDS,
      pickedIndex: -1,
    };
    CustomNetTables.SetTableValue('item_lottery', playerId.toString(), dto);
  }

  pickItem(playerId: PlayerID, index: number): void {
    const dto = CustomNetTables.GetTableValue('item_lottery', playerId.toString());
    if (!dto || !dto.candidates) {
      print('[ItemLottery] no pending lottery for player ' + playerId);
      return;
    }
    if (dto.pickedIndex >= 0) {
      print('[ItemLottery] already picked for player ' + playerId);
      return;
    }
    const candidates = dto.candidates as unknown as Record<string, { name: string; level: number }>;
    const candidate = candidates[index.toString()];
    if (!candidate) {
      print('[ItemLottery] invalid index ' + index + ' for player ' + playerId);
      return;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[ItemLottery] hero not found for player ' + playerId);
      return;
    }

    const item = hero.AddItemByName(candidate.name);
    if (item !== undefined) {
      // 抽到的物品不可出售，防卖钱
      item.SetSellable(false);
    }
    print('[ItemLottery] player ' + playerId + ' picked ' + candidate.name);

    // 写回 pickedIndex 让客户端隐藏 UI，下次触发时被新数据覆盖
    const next: ItemLotteryDto = {
      candidates: dto.candidates as unknown as { name: string; level: number }[],
      expireAt: dto.expireAt as number,
      pickedIndex: index,
    };
    CustomNetTables.SetTableValue('item_lottery', playerId.toString(), next);
  }
}
