import { ApiClient, HttpMethod } from './api-client';

interface PlayerStatsRadarResponse {
  matchCount: number;
  minMatchCount: number;
  radar: PlayerStatsRadar | null;
}

/** 玩家打开战绩页时取一次近期表现，结果只回给该玩家 */
export class PlayerStatsRadarApi {
  // 基准每天才算一次，一局内结果不会变；取不到也记下，离线局反复打开不再重发
  private static readonly results = new Map<PlayerID, PlayerStatsRadarResultEventData>();
  private static readonly pending = new Set<PlayerID>();

  constructor() {
    CustomGameEventManager.RegisterListener('player_stats_radar_request', (_, event) =>
      PlayerStatsRadarApi.Load(event.PlayerID),
    );
  }

  private static Load(playerId: PlayerID) {
    const cached = PlayerStatsRadarApi.results.get(playerId);
    if (cached) {
      PlayerStatsRadarApi.Reply(playerId, cached);
      return;
    }
    if (PlayerStatsRadarApi.pending.has(playerId)) return;

    const steamId = PlayerResource.GetSteamAccountID(playerId);
    if (steamId <= 0) {
      PlayerStatsRadarApi.Finish(playerId, { status: 'failed', matchCount: 0, minMatchCount: 0 });
      return;
    }

    PlayerStatsRadarApi.pending.add(playerId);
    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: `/player/${steamId}/stats/radar`,
      successFunc: (data) => {
        const response = json.decode(data)[0] as PlayerStatsRadarResponse;
        const result: PlayerStatsRadarResultEventData = {
          status: 'ready',
          matchCount: response.matchCount,
          minMatchCount: response.minMatchCount,
        };
        if (response.radar) {
          result.radar = response.radar;
        }
        PlayerStatsRadarApi.Finish(playerId, result);
      },
      failureFunc: (data) => {
        print(`[PlayerStatsRadarApi] steamId=${steamId} failed: ${data}`);
        PlayerStatsRadarApi.Finish(playerId, { status: 'failed', matchCount: 0, minMatchCount: 0 });
      },
    });
  }

  private static Finish(playerId: PlayerID, result: PlayerStatsRadarResultEventData) {
    PlayerStatsRadarApi.pending.delete(playerId);
    PlayerStatsRadarApi.results.set(playerId, result);
    PlayerStatsRadarApi.Reply(playerId, result);
  }

  private static Reply(playerId: PlayerID, result: PlayerStatsRadarResultEventData) {
    const player = PlayerResource.GetPlayer(playerId);
    if (!player) return;
    CustomGameEventManager.Send_ServerToPlayer(player, 'player_stats_radar_result', result);
  }
}
