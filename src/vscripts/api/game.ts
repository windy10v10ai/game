import {
  DailyChallengeGameEndRewardDto,
  DailyChallengePlayerSnapshotDto,
} from '../../common/dto/daily-challenge';
import { GameConfig } from '../modules/GameConfig';
import { dailyChallengeMatchContext } from '../modules/daily-challenge/daily-challenge-match-context';
import { PlayerHelper } from '../modules/helper/player-helper';
import { GameEndDto } from './analytics/dto/game-end-dto';
import { GA4ConfigDto } from './analytics/ga4/dto/ga4-dto';
import { GA4 } from './analytics/ga4/ga4';
import { ApiClient, HttpMethod } from './api-client';
import {
  applyDailyChallengeMatchStart,
  dailyChallengePlayerSnapshotStore,
  DailyChallengeMatchStartResponse,
  initializeDailyChallengeMatchContext,
} from './daily-challenge-snapshot';
import { Player, PlayerInfoDto, PointInfoDto } from './player';

class GameStart {
  players!: PlayerInfoDto[];
  pointInfo!: PointInfoDto[];
  matchStartedAt?: string;
  dailyChallenges?: DailyChallengePlayerSnapshotDto[];
  ga4Config?: GA4ConfigDto; // Only present for official servers
}

interface GameEndResponse {
  result: string;
  dailyChallengeRewards?: DailyChallengeGameEndRewardDto[];
  dailyChallenges?: DailyChallengePlayerSnapshotDto[];
}

export function parseGameEndDailyChallengeRewardPoints(data: string): Map<number, number> {
  const pointsBySteamId = new Map<number, number>();
  try {
    const response = json.decode(data)[0] as GameEndResponse | string | undefined;
    if (!response || typeof response === 'string' || !response.dailyChallengeRewards) {
      return pointsBySteamId;
    }

    const seenAssignments = new Map<string, boolean>();
    for (const reward of response.dailyChallengeRewards) {
      if (
        reward.source !== 'personal' ||
        typeof reward.steamId !== 'number' ||
        typeof reward.seasonPoint !== 'number' ||
        reward.steamId <= 0 ||
        reward.seasonPoint <= 0 ||
        Math.floor(reward.seasonPoint) !== reward.seasonPoint ||
        !reward.dayId ||
        !reward.assignmentId
      ) {
        continue;
      }
      const rewardKey = `${reward.dayId}_${reward.steamId}_${reward.assignmentId}`;
      if (seenAssignments.has(rewardKey)) {
        continue;
      }
      seenAssignments.set(rewardKey, true);
      pointsBySteamId.set(
        reward.steamId,
        (pointsBySteamId.get(reward.steamId) ?? 0) + reward.seasonPoint,
      );
    }
  } catch (error) {
    print(`[Game] unable to parse game-end daily challenge rewards: ${error}`);
  }
  return pointsBySteamId;
}

function applyGameEndDailyChallengeSnapshots(data: string): void {
  try {
    const response = json.decode(data)[0] as GameEndResponse | string | undefined;
    if (!response || typeof response === 'string' || !response.dailyChallenges) {
      return;
    }

    const matchId = GameRules.Script_GetMatchID().toString();
    for (const incomingSnapshot of response.dailyChallenges) {
      if (
        typeof incomingSnapshot.steamId !== 'number' ||
        incomingSnapshot.steamId <= 0 ||
        typeof incomingSnapshot.dayId !== 'string' ||
        !incomingSnapshot.dayId
      ) {
        continue;
      }
      const steamId = incomingSnapshot.steamId;
      const steamIdKey = steamId.toString();
      const accepted = dailyChallengePlayerSnapshotStore.set(steamIdKey, incomingSnapshot);
      const snapshot = accepted
        ? incomingSnapshot
        : dailyChallengePlayerSnapshotStore.get(steamIdKey);
      if (!snapshot) {
        continue;
      }

      PlayerHelper.ForEachPlayer((playerId) => {
        if (PlayerResource.GetSteamAccountID(playerId) !== steamId) {
          return;
        }
        const player = PlayerResource.GetPlayer(playerId);
        if (!player) {
          return;
        }
        CustomGameEventManager.Send_ServerToPlayer(player, 'daily_challenge_action_result', {
          action: 'snapshot',
          requestId: `game-end-${matchId}-${steamId}`,
          success: true,
          code: 'game_end_synced',
          snapshot,
        });
      });
    }
  } catch (error) {
    print(`[Game] unable to apply game-end daily challenge snapshots: ${error}`);
  }
}

function applyGameEndDailyChallengeRewardPoints(data: string): void {
  const pointsBySteamId = parseGameEndDailyChallengeRewardPoints(data);
  if (pointsBySteamId.size === 0) {
    return;
  }

  PlayerHelper.ForEachPlayer((playerId) => {
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    const dailyChallengePoints = pointsBySteamId.get(steamId);
    if (!dailyChallengePoints) {
      return;
    }
    const playerStats = CustomNetTables.GetTableValue('player_stats', playerId.toString());
    if (!playerStats) {
      return;
    }
    CustomNetTables.SetTableValue('player_stats', playerId.toString(), {
      ...playerStats,
      dailyChallengePoints,
      totalSeasonPoints: playerStats.points + dailyChallengePoints,
    });
  });
}

export class Game {
  public static readonly GAME_START_URL = '/game/start';
  public static readonly GAME_END_URL = '/game/end';

  constructor() {}

  public static StartGame() {
    CustomNetTables.SetTableValue('loading_status', 'loading_status', {
      status: 1,
    });
    // get IsValidPlayer player's steamIds
    const steamIds: number[] = [];
    let playerCount = 0;
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      steamIds.push(steamId);
      playerCount++;
    });
    Player.playerCount = playerCount;

    const matchId = GameRules.Script_GetMatchID().toString();

    // 定义成功回调
    const onSuccess = (data: string) => {
      const gameStart = json.decode(data)[0] as GameStart;

      // Initialize GA4 if config is provided (only for official servers)
      if (gameStart.ga4Config) {
        GA4.Initialize(gameStart.ga4Config);
        print(`[Game] GA4 initialized with measurementId: ${gameStart.ga4Config.measurementId}`);
      } else {
        print('[Game] GA4 config not provided (non-official server)');
      }

      // 走 MergePlayerInfo 统一写入入口；首次 existing 为空，merge 等价覆盖
      for (const player of gameStart.players) {
        Player.MergePlayerInfo(player);
      }

      // 按 playerId 发布，方便加载界面用 GetLocalPlayerID 读取
      PlayerHelper.ForEachPlayer((playerId) => {
        const steamId = PlayerResource.GetSteamAccountID(playerId);
        const setting = Player.playerInfoMap.get(steamId.toString())?.playerSetting;
        if (!setting) return;
        if (setting.gamePresetDota || setting.gamePresetHard || setting.gamePresetCustom) {
          CustomNetTables.SetTableValue('game_preset', playerId.toString(), {
            dota: setting.gamePresetDota,
            hard: setting.gamePresetHard,
            custom: setting.gamePresetCustom,
          });
        }
      });

      // pointInfo 仅在开局一次性下发到 net table，无需保留在 class 中
      const pointInfoBySteamId = new Map<number, PointInfoDto[]>();
      for (const info of gameStart.pointInfo) {
        const list = pointInfoBySteamId.get(info.steamId) ?? [];
        list.push(info);
        pointInfoBySteamId.set(info.steamId, list);
      }
      pointInfoBySteamId.forEach((list, steamId) => {
        CustomNetTables.SetTableValue('point_info', steamId.toString(), list);
      });

      initializeDailyChallengeMatchContext(
        gameStart.dailyChallenges,
        dailyChallengeMatchContext,
        0,
        gameStart.matchStartedAt,
      );
      dailyChallengePlayerSnapshotStore.seed(gameStart.dailyChallenges);

      const status = gameStart.players.length > 0 ? 2 : 3;
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status,
      });
    };

    // 定义失败回调
    const onFailure = (_: string) => {
      CustomNetTables.SetTableValue('loading_status', 'loading_status', {
        status: 3,
      });
    };

    const apiParameter = {
      method: HttpMethod.GET,
      path: Game.GAME_START_URL,
      querys: { steamIds: steamIds.join(','), matchId, version: GameConfig.GAME_VERSION },
      successFunc: onSuccess,
      failureFunc: onFailure,
      retryTimes: 6,
    };

    ApiClient.sendWithRetry(apiParameter);
  }

  public static ConfirmDailyChallengeMatchStart() {
    const steamIds: number[] = [];
    PlayerHelper.ForEachPlayer((playerId) => {
      const steamId = PlayerResource.GetSteamAccountID(playerId);
      if (steamId > 0) {
        steamIds.push(steamId);
      }
    });
    if (steamIds.length === 0) {
      return;
    }

    // Capture the GAME_IN_PROGRESS anchor before the request. Retries and a slow
    // success callback must not move the ten-minute acceptance window forward.
    const matchStartedAtGameTime = GameRules.GetDOTATime(false, false);

    ApiClient.sendWithRetry({
      method: HttpMethod.GET,
      path: '/daily-challenge/match-start',
      querys: { steamIds: steamIds.join(',') },
      successFunc: (data: string) => {
        const response = json.decode(data)[0] as DailyChallengeMatchStartResponse;
        applyDailyChallengeMatchStart(
          response,
          dailyChallengeMatchContext,
          matchStartedAtGameTime,
          (steamId, snapshot) => dailyChallengePlayerSnapshotStore.set(steamId, snapshot),
        );
      },
      failureFunc: (data: string) => {
        print(`[Game] daily challenge match-start confirmation failed: ${data}`);
      },
      retryTimes: 6,
    });
  }

  public static EndGame(gameEndDto: GameEndDto) {
    CustomNetTables.SetTableValue('ending_status', 'ending_status', {
      status: 1,
    });

    const apiParameter = {
      method: HttpMethod.POST,
      path: Game.GAME_END_URL,
      body: gameEndDto,
      successFunc: (data: string) => {
        applyGameEndDailyChallengeRewardPoints(data);
        applyGameEndDailyChallengeSnapshots(data);
        // CustomNetTables.SetTableValue('ending_status', 'ending_status', {
        //   status: 2,
        // });
        print(`[Game] end game callback data ${data}`);
      },
      failureFunc: (data: string) => {
        // CustomNetTables.SetTableValue('ending_status', 'ending_status', {
        //   status: 3,
        // });
        print(`[Game] end game callback data ${data}`);
      },
    };

    ApiClient.sendWithRetry(apiParameter);
  }
}
