import { DailyTaskStartDto } from '../../common/dto/daily-task';
import { GA4ConfigDto } from './analytics/ga4/dto/ga4-dto';
import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { PlayerInfoDto, PointInfoDto } from './player';

const GAME_START_PATH = '/game/start';
const PROXY_GAME_START_PATH = '/proxy/game-start';
const PROXY_PLAYER_INFO_PATH = '/proxy/player-info';
const PLAYER_INFO_INCLUDE = 'member,property,heroAwakening';

export interface GameStartPayload {
  players: PlayerInfoDto[];
  pointInfo: PointInfoDto[];
  dailyTasks?: DailyTaskStartDto[];
  ga4Config?: GA4ConfigDto;
}

export interface PerPlayerGameStartResult {
  steamId: number;
  gameStart?: GameStartPayload;
  playerInfo?: Partial<PlayerInfoDto>;
}

/**
 * 把按玩家拆开发出的 game-start / player-info 结果合并成与 /game/start 同构的响应。
 * 任一玩家有请求失败就整体丢弃这个玩家，不拼半份数据。
 */
export function mergeGameStartResults(
  results: PerPlayerGameStartResult[],
): GameStartPayload | undefined {
  const players: PlayerInfoDto[] = [];
  const pointInfo: PointInfoDto[] = [];
  let dailyTasks: DailyTaskStartDto[] | undefined;
  let ga4Config: GA4ConfigDto | undefined;

  for (const result of results) {
    const gameStart = result.gameStart;
    const playerInfo = result.playerInfo;
    if (!gameStart || !playerInfo || gameStart.players.length === 0) continue;

    const basePlayer = gameStart.players[0];
    players.push({ ...basePlayer, ...playerInfo } as PlayerInfoDto);
    pointInfo.push(...gameStart.pointInfo);
    if (gameStart.dailyTasks) {
      dailyTasks = (dailyTasks ?? []).concat(gameStart.dailyTasks);
    }
    if (!ga4Config && gameStart.ga4Config) {
      ga4Config = gameStart.ga4Config;
    }
  }

  if (players.length === 0) return undefined;
  return { players, pointInfo, dailyTasks, ga4Config };
}

/** 把 /game/start 按玩家拆成 /proxy/game-start + /proxy/player-info 并行请求，再合并回原结构 */
export class GameStartProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(GAME_START_PATH, GameStartProxy.Handle);
  }

  private static Handle(
    target: ApiTarget,
    apiParameter: ApiParameter,
    _pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const querys = apiParameter.querys ?? {};
    const steamIds = GameStartProxy.parseSteamIds(querys.steamIds);
    const matchId = querys.matchId ?? '';
    const version = querys.version ?? '';

    if (steamIds.length === 0) {
      print('[GameStartProxy] no steamIds to proxy');
      callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      return;
    }

    const results: PerPlayerGameStartResult[] = steamIds.map((steamId) => ({ steamId }));
    let pending = steamIds.length * 2;

    const finish = () => {
      const merged = mergeGameStartResults(results);
      if (!merged) {
        print('[GameStartProxy] all players failed, giving up');
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
        return;
      }
      callbackFunc({ StatusCode: 200, Body: json.encode(merged) } as CScriptHTTPResponse);
    };

    const onOneDone = () => {
      pending--;
      if (pending === 0) finish();
    };

    steamIds.forEach((steamId, index) => {
      const record = results[index];

      ApiHtmlProxy.Send(
        target,
        PROXY_GAME_START_PATH,
        { steamIds: String(steamId), matchId, version },
        (data) => {
          record.gameStart = GameStartProxy.decode<GameStartPayload>(data, 'game-start', steamId);
          onOneDone();
        },
        (reason) => {
          print(`[GameStartProxy] steamId=${steamId} game-start proxy failed: ${reason}`);
          onOneDone();
        },
      );

      ApiHtmlProxy.Send(
        target,
        PROXY_PLAYER_INFO_PATH,
        { steamId: String(steamId), include: PLAYER_INFO_INCLUDE },
        (data) => {
          record.playerInfo = GameStartProxy.decode<Partial<PlayerInfoDto>>(
            data,
            'player-info',
            steamId,
          );
          onOneDone();
        },
        (reason) => {
          print(`[GameStartProxy] steamId=${steamId} player-info proxy failed: ${reason}`);
          onOneDone();
        },
      );
    });
  }

  private static parseSteamIds(raw: string | undefined): number[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((id) => Number(id))
      .filter((id) => id > 0);
  }

  private static decode<T>(data: string, label: string, steamId: number): T | undefined {
    try {
      return json.decode(data)[0] as T;
    } catch {
      print(`[GameStartProxy] steamId=${steamId} ${label} decode failed`);
      return undefined;
    }
  }
}
