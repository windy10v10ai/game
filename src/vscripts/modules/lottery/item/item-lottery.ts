import { LotteryDto } from '../../../../common/dto/lottery';
import { GA4PickItemTracker } from '../../../api/analytics/ga4/ga4-pick-item-tracker';
import { MemberLevel, Player } from '../../../api/player';
import { PlayerMemberPointApi } from '../../../api/player-member-point';
import { reloadable } from '../../../utils/tstl-utils';
import { PlayerHelper } from '../../helper/player-helper';
import { ItemLotteryHelper, ItemLotteryPool } from './item-lottery-helper';

type ItemLotteryState = CustomNetTableDeclarations['lottery_item'][string];
type ItemLotteryRound = Pick<ItemLotteryState, 'candidates' | 'poolType' | 'isAttributeTome'>;

const ATTRIBUTE_TOME_CHOICES: LotteryDto[] = [
  { name: 'item_tome_of_strength', level: 0 },
  { name: 'item_tome_of_agility', level: 0 },
  { name: 'item_tome_of_intelligence', level: 0 },
];

const TREASURE_FRAGMENTS = new Set([
  'item_treasure_attribute_fragment',
  'item_treasure_inventory_fragment',
  'item_treasure_passive_fragment',
]);

@reloadable
export class ItemLottery {
  static readonly CANDIDATE_COUNT = 4;
  readonly paidRefreshCosts = [10, 20, 30, 50];
  readonly maxPaidRefreshCount = 5;

  private readonly queuedRounds = new Map<PlayerID, ItemLotteryRound[]>();
  private roundId = 0;

  constructor() {
    CustomGameEventManager.RegisterListener('lottery_pick_item', (_userId, event) => {
      this.pickItem(event.PlayerID, event);
    });
    CustomGameEventManager.RegisterListener('lottery_refresh_item', (_userId, event) => {
      this.refreshItem(event.PlayerID, event.roundId);
    });
  }

  onTriggered(
    opener: CDOTA_BaseNPC | undefined,
    pool: ItemLotteryPool = ItemLotteryPool.DEFAULT,
  ): void {
    if (!PlayerHelper.IsHumanPlayer(opener)) return;

    const playerId = opener!.GetPlayerOwnerID();
    if (playerId < 0) return;

    const round: ItemLotteryRound = {
      candidates: ItemLotteryHelper.getRandomItems(ItemLottery.CANDIDATE_COUNT, pool),
      poolType: pool,
      isAttributeTome: 0,
    };
    const active = CustomNetTables.GetTableValue('lottery_item', playerId.toString());
    if (active?.isAttributeTome === 1 || GameRules.Lottery.PassiveTome.isShowing(playerId)) {
      this.queueRound(playerId, round);
    } else {
      this.publish(playerId, round);
    }
  }

  onAttributeTomeUsed(playerId: PlayerID): void {
    const round: ItemLotteryRound = {
      candidates: ATTRIBUTE_TOME_CHOICES,
      poolType: ItemLotteryPool.DEFAULT,
      isAttributeTome: 1,
    };
    if (this.isShowing(playerId) || GameRules.Lottery.PassiveTome.isShowing(playerId)) {
      this.queueRound(playerId, round);
    } else {
      this.publish(playerId, round);
    }
  }

  isShowing(playerId: PlayerID): boolean {
    const active = CustomNetTables.GetTableValue('lottery_item', playerId.toString());
    return Object.values(active?.candidates ?? {}).length > 0;
  }

  /** 窗口空出来后显示排队中的下一轮，没有排队则返回 false */
  showQueued(playerId: PlayerID): boolean {
    const queue = this.queuedRounds.get(playerId);
    const nextRound = queue?.shift();
    if (queue?.length === 0) this.queuedRounds.delete(playerId);
    if (!nextRound) return false;
    this.publish(playerId, nextRound);
    return true;
  }

  pickItem(playerId: PlayerID, event: LotteryItemPickEventData): void {
    const raw = CustomNetTables.GetTableValue('lottery_item', playerId.toString());
    if (!raw || raw.roundId !== event.roundId) return;

    const candidates = Object.values(raw.candidates ?? {}) as unknown as LotteryDto[];
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

    // Avoid the purchase restrictions applied by CreateItem when given a purchaser.
    const item = CreateItem(matched.name, undefined, undefined);
    if (!item) return;
    const isFragment = TREASURE_FRAGMENTS.has(matched.name);
    if (isFragment) {
      // Inventory insertion can consume the fragment immediately when a recipe completes.
      item.SetPurchaser(hero);
    }
    hero.AddItem(item);
    if (!isFragment && IsValidEntity(item) && !item.IsNull()) {
      item.SetPurchaser(hero);
    }

    if (!this.showQueued(playerId)) {
      this.publish(playerId, {
        candidates: [],
        poolType: ItemLotteryPool.DEFAULT,
        isAttributeTome: 0,
      });
      // 物品窗口已关，轮到排队的被动技能书
      GameRules.Lottery.PassiveTome.showQueued(playerId);
    }

    print('[ItemLottery] player ' + playerId + ' picked ' + matched.name);
    if (raw.isAttributeTome !== 1) {
      GA4PickItemTracker.SendPick(playerId, matched.name, matched.level);
    }
  }

  refreshItem(playerId: PlayerID, roundId: number): void {
    const raw = CustomNetTables.GetTableValue('lottery_item', playerId.toString());
    if (
      !raw ||
      raw.roundId !== roundId ||
      raw.isAttributeTome === 1 ||
      Object.values(raw.candidates ?? {}).length === 0
    ) {
      return;
    }

    const steamAccountID = PlayerResource.GetSteamAccountID(playerId);
    if (Player.GetMemberLevel(steamAccountID) < MemberLevel.PREMIUM) {
      print('[ItemLottery] refresh denied, not PREMIUM, player ' + playerId);
      return;
    }

    const refreshed = raw.isRefreshed as unknown as boolean | number;
    let paidRefreshCount = raw.paidRefreshCount ?? 0;
    if (refreshed === true || refreshed === 1) {
      if (paidRefreshCount >= this.maxPaidRefreshCount) {
        print('[ItemLottery] paid refresh denied, refresh limit reached, player ' + playerId);
        return;
      }
      const cost = this.getPaidRefreshCost(paidRefreshCount);
      if (Player.GetUseableMemberPoint(steamAccountID) < cost) {
        print('[ItemLottery] paid refresh denied, insufficient member points, player ' + playerId);
        return;
      }
      Player.DeductUseableMemberPoint(steamAccountID, cost);
      PlayerMemberPointApi.UseMemberPoint(steamAccountID, cost, 'lottery_refresh_item');
      paidRefreshCount++;
    }

    const pool = (raw.poolType as ItemLotteryPool) ?? ItemLotteryPool.DEFAULT;
    const candidates = ItemLotteryHelper.getRandomItems(ItemLottery.CANDIDATE_COUNT, pool);
    this.publish(
      playerId,
      { candidates, poolType: pool, isAttributeTome: 0 },
      true,
      paidRefreshCount,
    );
    print('[ItemLottery] refreshed for player ' + playerId);
  }

  private queueRound(playerId: PlayerID, round: ItemLotteryRound): void {
    const queue = this.queuedRounds.get(playerId) ?? [];
    queue.push(round);
    this.queuedRounds.set(playerId, queue);
  }

  private publish(
    playerId: PlayerID,
    round: ItemLotteryRound,
    isRefreshed = false,
    paidRefreshCount = 0,
  ): void {
    this.roundId++;
    CustomNetTables.SetTableValue('lottery_item', playerId.toString(), {
      ...round,
      roundId: this.roundId,
      isRefreshed,
      paidRefreshCount,
    });
  }

  private getPaidRefreshCost(paidCount: number): number {
    const index = Math.min(paidCount, this.paidRefreshCosts.length - 1);
    return this.paidRefreshCosts[index];
  }
}
