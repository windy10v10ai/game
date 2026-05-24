import { LotteryDto } from '../../../../common/dto/lottery';
import { GA4PickItemTracker } from '../../../api/analytics/ga4/ga4-pick-item-tracker';
import { reloadable } from '../../../utils/tstl-utils';
import { PlayerHelper } from '../../helper/player-helper';
import { ItemLotteryHelper } from './item-lottery-helper';

/**
 * 物品抽奖：触发后弹 4 选 1，倒计时由客户端驱动，归零自动随机选 1。
 * 触发源（藏宝箱 / 未来 boss / 商店开箱）调 onTriggered 即可，本模块不关心来源。
 */
@reloadable
export class ItemLottery {
  static readonly CANDIDATE_COUNT = 4;

  constructor() {
    CustomGameEventManager.RegisterListener('lottery_pick_item', (_userId, event) => {
      this.pickItem(event.PlayerID, event);
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
    CustomNetTables.SetTableValue('lottery_item', playerId.toString(), candidates);
  }

  pickItem(playerId: PlayerID, event: LotteryPickItemEventData): void {
    const raw = CustomNetTables.GetTableValue('lottery_item', playerId.toString());
    if (!raw) {
      print('[ItemLottery] no pending lottery for player ' + playerId);
      return;
    }
    // TSTL 把 array 编码成 object 同步给客户端，读回时也是 object，按值列出
    const candidates = Object.values(raw) as unknown as LotteryDto[];
    const matched = candidates.find((c) => c.name === event.name && c.level === event.level);
    if (!matched) {
      print('[ItemLottery] candidate not found for player ' + playerId + ': ' + event.name);
      return;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[ItemLottery] hero not found for player ' + playerId);
      return;
    }

    // 用 CreateItem 提前指定 purchaser=undefined 再加进 inventory，
    // 让引擎从一开始就不把它当作"刚购买的"——既能立即使用，又按半价出售。
    const item = CreateItem(matched.name, undefined, undefined);
    if (item !== undefined) {
      hero.AddItem(item);
    }
    print('[ItemLottery] player ' + playerId + ' picked ' + matched.name);

    // 清空候选（写空数组，客户端 Object.values 长度 0 → UI collapse）。
    // 不能传 nil：Dota 引擎对 SetTableValue 传 nil 是 noop，不会删除行。
    CustomNetTables.SetTableValue('lottery_item', playerId.toString(), []);

    GA4PickItemTracker.SendPick(playerId, matched.name, matched.level);
  }
}
