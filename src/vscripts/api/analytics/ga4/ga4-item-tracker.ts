import { PlayerHelper } from '../../../modules/helper/player-helper';

export interface ItemSampleEntry {
  itemName: string;
  sampleCount: number;
  isCarriedAtEnd: boolean;
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
        this.AddSample(playerId, item.GetAbilityName());
      }
    }

    const neutralActive = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
    if (neutralActive) {
      this.AddSample(playerId, neutralActive.GetAbilityName());
    }

    const neutralPassive = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
    if (neutralPassive) {
      this.AddSample(playerId, neutralPassive.GetAbilityName());
    }
  }

  private static AddSample(playerId: PlayerID, itemName: string): void {
    const key: SampleKey = `${playerId}:${itemName}`;
    const existing = this.samples.get(key);
    if (existing) {
      existing.sampleCount++;
    } else {
      this.samples.set(key, { playerId, itemName, sampleCount: 1, isCarriedAtEnd: false });
    }
  }

  /**
   * 游戏结束时调用：
   * - 对当前持有的物品标记 isCarriedAtEnd = true
   * - 计算结束时补丁时长（上次采样到游戏结束的时间差）
   * - 返回按 playerId 聚合的 Map
   */
  public static CollectAtGameEnd(): Map<PlayerID, ItemSampleEntry[]> {
    const endDotatime = GameRules.GetGameTime();
    const endPatchSeconds = endDotatime - this.lastSampleDotatime;

    PlayerHelper.ForEachPlayer((playerId) => {
      const hero = PlayerResource.GetSelectedHeroEntity(playerId);
      if (!hero) return;

      // 遍历所有物品槽位，标记游戏结束时仍持有的物品
      for (let i = 0; i < 6; i++) {
        const item = hero.GetItemInSlot(i);
        if (item) {
          this.MarkCarriedAtEnd(playerId, item.GetAbilityName(), endPatchSeconds);
        }
      }

      const neutralActive = hero.GetItemInSlot(InventorySlot.NEUTRAL_ACTIVE_SLOT);
      if (neutralActive) {
        this.MarkCarriedAtEnd(playerId, neutralActive.GetAbilityName(), endPatchSeconds);
      }

      const neutralPassive = hero.GetItemInSlot(InventorySlot.NEUTRAL_PASSIVE_SLOT);
      if (neutralPassive) {
        this.MarkCarriedAtEnd(playerId, neutralPassive.GetAbilityName(), endPatchSeconds);
      }
    });

    // 聚合为 Map<PlayerID, ItemSampleEntry[]>
    const result = new Map<PlayerID, ItemSampleEntry[]>();
    this.samples.forEach((entry) => {
      const existing = result.get(entry.playerId);
      const itemEntry: ItemSampleEntry = {
        itemName: entry.itemName,
        sampleCount: entry.sampleCount,
        isCarriedAtEnd: entry.isCarriedAtEnd,
      };
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
    endPatchSeconds: number,
  ): void {
    const key: SampleKey = `${playerId}:${itemName}`;
    const existing = this.samples.get(key);
    if (existing) {
      existing.isCarriedAtEnd = true;
      // 将结束时补丁折算为采样次数（不足一个间隔时保留小数等效加到 duration_seconds）
      // 这里直接通过 endPatchSeconds 在发送时计算，不修改 sampleCount
      // 用 _endPatchSeconds 附加到 entry 供 ga4.ts 使用
      (
        existing as ItemSampleEntry & { playerId: PlayerID; endPatchSeconds?: number }
      ).endPatchSeconds = endPatchSeconds;
    } else {
      // 游戏结束时才出现的物品（上次采样后才买的）
      this.samples.set(key, {
        playerId,
        itemName,
        sampleCount: 0,
        isCarriedAtEnd: true,
        endPatchSeconds,
      } as ItemSampleEntry & { playerId: PlayerID; endPatchSeconds?: number });
    }
  }

  /**
   * 获取某个 entry 的实际持有时长（秒）
   * sampleCount × INTERVAL + endPatchSeconds（仅 isCarriedAtEnd 时有补丁）
   */
  public static GetDurationSeconds(entry: ItemSampleEntry & { endPatchSeconds?: number }): number {
    const patch = entry.isCarriedAtEnd ? (entry.endPatchSeconds ?? 0) : 0;
    return entry.sampleCount * this.SAMPLE_INTERVAL_SECONDS + patch;
  }
}
