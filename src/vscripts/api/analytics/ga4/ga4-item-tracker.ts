import { PlayerHelper } from '../../../modules/helper/player-helper';
import { GameEndDto } from '../dto/game-end-dto';
import { GA4 } from './ga4';

export interface ItemSampleEntry {
  itemName: string;
  type: 'normal' | 'neutral_active' | 'neutral_passive';
  sampleCount: number;
  isCarriedAtEnd: boolean;
}

// key = `${playerId}:${itemName}`
type SampleKey = string;

export class GA4ItemTracker {
  static readonly SAMPLE_INTERVAL_SECONDS = 30;

  private static samples = new Map<SampleKey, ItemSampleEntry & { playerId: PlayerID }>();
  private static isTracking = false;

  public static StartTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    Timers.CreateTimer(this.SAMPLE_INTERVAL_SECONDS, () => {
      this.Sample();
      return this.SAMPLE_INTERVAL_SECONDS;
    });
    print('[GA4ItemTracker] Started item tracking');
  }

  private static Sample(): void {
    const sampleNumber = Math.round(GameRules.GetGameTime() / this.SAMPLE_INTERVAL_SECONDS);
    print(`[GA4ItemTracker] Sample #${sampleNumber} at ${GameRules.GetGameTime()}s`);

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;
      this.SampleHeroItems(playerId, hero);
    });
  }

  private static SampleHeroItems(
    playerId: PlayerID,
    hero: CDOTA_BaseNPC_Hero,
    isGameEnd = false,
  ): void {
    for (let i = 0; i < 6; i++) {
      const item = hero.GetItemInSlot(i);
      if (item) this.AddSample(playerId, item.GetAbilityName(), 'normal', isGameEnd);
    }

    const neutralActive = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
    if (neutralActive)
      this.AddSample(playerId, neutralActive.GetAbilityName(), 'neutral_active', isGameEnd);

    const neutralPassive = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
    if (neutralPassive)
      this.AddSample(playerId, neutralPassive.GetAbilityName(), 'neutral_passive', isGameEnd);
  }

  private static AddSample(
    playerId: PlayerID,
    itemName: string,
    type: ItemSampleEntry['type'],
    isGameEnd = false,
  ): void {
    const key: SampleKey = `${playerId}:${itemName}`;
    const existing = this.samples.get(key);
    if (existing) {
      existing.sampleCount++;
      if (isGameEnd) existing.isCarriedAtEnd = true;
    } else {
      this.samples.set(key, {
        playerId,
        itemName,
        type,
        sampleCount: 1,
        isCarriedAtEnd: isGameEnd,
      });
    }
  }

  /** 游戏结束时调用：收集物品数据并发送 GA4 事件 */
  public static SendAtGameEnd(gameEndDto: GameEndDto): void {
    // 游戏结束时再采样一次（不足30s计为一次），同时标记 isCarriedAtEnd
    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;
      this.SampleHeroItems(playerId, hero, true);
    });

    // 按 playerId 聚合并发送
    const byPlayer = new Map<PlayerID, ItemSampleEntry[]>();
    this.samples.forEach((entry) => {
      const { playerId, ...itemEntry } = entry;
      const existing = byPlayer.get(playerId);
      if (existing) {
        existing.push(itemEntry);
      } else {
        byPlayer.set(playerId, [itemEntry]);
      }
    });

    const eventName = 'game_end_item_duration';
    gameEndDto.players.forEach((player) => {
      const playerItems = byPlayer.get(player.playerId);
      if (!playerItems || playerItems.length === 0) return;

      const steamId = player.steamId;
      const isBot = steamId <= 0;

      const win_metrics = player.teamId === gameEndDto.winnerTeamId ? 1 : 0;

      const itemEvents = playerItems.map((entry) =>
        GA4.BuildEvent(eventName, steamId, {
          hero_name: player.heroName,
          item_name: entry.itemName,
          type: entry.type,
          sample_count: entry.sampleCount,
          duration_seconds: entry.sampleCount * GA4ItemTracker.SAMPLE_INTERVAL_SECONDS,
          is_carried_at_end: entry.isCarriedAtEnd,
          difficulty: gameEndDto.difficulty,
          team_id: player.teamId,
          is_bot: isBot,
          win_metrics,
        }),
      );

      GA4.SendEvents(steamId, itemEvents);
    });
  }
}
