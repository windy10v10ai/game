import { GameEndDto } from '../dto/game-end-dto';
import { PlayerHelper } from '../../../modules/helper/player-helper';
import { GA4Event } from './dto/ga4-dto';

export interface ItemSampleEntry {
  itemName: string;
  type: 'normal' | 'neutral_active' | 'neutral_passive';
  sampleCount: number;
  isCarriedAtEnd: boolean;
  endPatchSeconds: number; // 上次采样到游戏结束的时间差，仅 isCarriedAtEnd 时有效
}

// key = `${playerId}:${itemName}`
type SampleKey = string;

export class GA4ItemTracker {
  static readonly SAMPLE_INTERVAL_SECONDS = 30;

  private static samples = new Map<SampleKey, ItemSampleEntry & { playerId: PlayerID }>();
  private static isTracking = false;
  private static lastSampleDotatime = 0;

  public static StartTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.lastSampleDotatime = GameRules.GetGameTime();
    Timers.CreateTimer(this.SAMPLE_INTERVAL_SECONDS, () => {
      this.Sample();
      return this.SAMPLE_INTERVAL_SECONDS;
    });
    print('[GA4ItemTracker] Started item tracking');
  }

  private static Sample(): void {
    this.lastSampleDotatime = GameRules.GetGameTime();
    const sampleNumber = Math.round(this.lastSampleDotatime / this.SAMPLE_INTERVAL_SECONDS);
    print(`[GA4ItemTracker] Sample #${sampleNumber} at ${this.lastSampleDotatime}s`);

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;

      this.SampleHeroItems(playerId, hero);
    });
  }

  private static SampleHeroItems(playerId: PlayerID, hero: CDOTA_BaseNPC_Hero): void {
    for (let i = 0; i < 6; i++) {
      const item = hero.GetItemInSlot(i);
      if (item) {
        this.AddSample(playerId, item.GetAbilityName(), 'normal');
      }
    }

    const neutralActive = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
    if (neutralActive) {
      this.AddSample(playerId, neutralActive.GetAbilityName(), 'neutral_active');
    }

    const neutralPassive = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
    if (neutralPassive) {
      this.AddSample(playerId, neutralPassive.GetAbilityName(), 'neutral_passive');
    }
  }

  private static AddSample(
    playerId: PlayerID,
    itemName: string,
    type: ItemSampleEntry['type'],
  ): void {
    const key: SampleKey = `${playerId}:${itemName}`;
    const existing = this.samples.get(key);
    if (existing) {
      existing.sampleCount++;
    } else {
      this.samples.set(key, {
        playerId,
        itemName,
        type,
        sampleCount: 1,
        isCarriedAtEnd: false,
        endPatchSeconds: 0,
      });
    }
  }

  /** 游戏结束时调用：收集物品数据并发送 GA4 事件 */
  public static SendAtGameEnd(
    gameEndDto: GameEndDto,
    buildEvent: (
      eventName: string,
      steamId: number,
      params: { [key: string]: string | number | boolean },
    ) => GA4Event,
    sendEvents: (steamId: number, events: GA4Event[]) => void,
  ): void {
    const trackedItems = this.CollectAtGameEnd();
    const eventName = 'game_end_item_duration';

    gameEndDto.players.forEach((player) => {
      const playerItems = trackedItems.get(player.playerId);
      if (!playerItems || playerItems.length === 0) return;

      const isBot = player.steamId <= 0;
      const steamId = isBot ? 0 : player.steamId;

      const itemEvents: GA4Event[] = [];
      playerItems.forEach((entry) => {
        const eventParams: { [key: string]: string | number | boolean } = {
          hero_name: player.heroName,
          item_name: entry.itemName,
          type: entry.type,
          is_carried_at_end: entry.isCarriedAtEnd,
          is_bot: isBot,
          difficulty: gameEndDto.difficulty,
          team_id: player.teamId,
        };

        itemEvents.push(buildEvent(eventName, steamId, eventParams));
      });

      if (itemEvents.length > 0) {
        sendEvents(steamId, itemEvents);
      }
    });
  }

  private static CollectAtGameEnd(): Map<PlayerID, ItemSampleEntry[]> {
    const endDotatime = GameRules.GetGameTime();
    const endPatchSeconds = endDotatime - this.lastSampleDotatime;

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;

      for (let i = 0; i < 6; i++) {
        const item = hero.GetItemInSlot(i);
        if (item) {
          this.MarkCarriedAtEnd(playerId, item.GetAbilityName(), 'normal', endPatchSeconds);
        }
      }

      const neutralActive = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
      if (neutralActive) {
        this.MarkCarriedAtEnd(
          playerId,
          neutralActive.GetAbilityName(),
          'neutral_active',
          endPatchSeconds,
        );
      }

      const neutralPassive = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
      if (neutralPassive) {
        this.MarkCarriedAtEnd(
          playerId,
          neutralPassive.GetAbilityName(),
          'neutral_passive',
          endPatchSeconds,
        );
      }
    });

    const result = new Map<PlayerID, ItemSampleEntry[]>();
    this.samples.forEach((entry) => {
      const itemEntry: ItemSampleEntry = {
        itemName: entry.itemName,
        type: entry.type,
        sampleCount: entry.sampleCount,
        isCarriedAtEnd: entry.isCarriedAtEnd,
        endPatchSeconds: entry.endPatchSeconds,
      };
      const existing = result.get(entry.playerId);
      if (existing) {
        existing.push(itemEntry);
      } else {
        result.set(entry.playerId, [itemEntry]);
      }
    });

    return result;
  }

  private static MarkCarriedAtEnd(
    playerId: PlayerID,
    itemName: string,
    type: ItemSampleEntry['type'],
    endPatchSeconds: number,
  ): void {
    const key: SampleKey = `${playerId}:${itemName}`;
    const existing = this.samples.get(key);
    if (existing) {
      existing.isCarriedAtEnd = true;
      existing.endPatchSeconds = endPatchSeconds;
    } else {
      this.samples.set(key, {
        playerId,
        itemName,
        type,
        sampleCount: 0,
        isCarriedAtEnd: true,
        endPatchSeconds,
      });
    }
  }

  public static GetDurationSeconds(entry: ItemSampleEntry): number {
    const patch = entry.isCarriedAtEnd ? entry.endPatchSeconds : 0;
    return entry.sampleCount * this.SAMPLE_INTERVAL_SECONDS + patch;
  }
}
