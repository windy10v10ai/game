import { GA4 } from './ga4';

/** 数值表示难度递增；0 兜底用于反查失败 */
export enum TreasureTier {
  UNKNOWN = 0,
  INITIAL = 1,
  EASY = 2,
  JUNGLE = 3,
  HARD = 4,
}

export class GA4TreasureTracker {
  private static readonly EVENT_NAME = 'treasure_open';

  /** 玩家靠近触发开宝箱时调用 */
  public static SendOpen(
    opener: CDOTA_BaseNPC,
    spawnCount: number,
    point: Vector,
    tier: TreasureTier,
  ): void {
    const playerId = opener.GetPlayerOwnerID();
    const steamId =
      playerId >= 0 && PlayerResource.IsValidPlayerID(playerId)
        ? PlayerResource.GetSteamAccountID(playerId)
        : 0;
    const isBot = steamId <= 0;

    const event = GA4.BuildEvent(this.EVENT_NAME, steamId, {
      steam_id: steamId,
      hero_name: opener.GetUnitName(),
      team_id: opener.GetTeamNumber(),
      is_bot: isBot,
      level: spawnCount,
      // 与 treasure.ts 中点位定义文本对齐，便于统计每个点被开次数
      point: `Vector(${point.x}, ${point.y}, ${point.z})`,
      tier,
      game_time: Math.floor(GameRules.GetDOTATime(false, true)),
    });

    GA4.SendEvent(steamId, event);
  }
}
