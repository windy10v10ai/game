import { PlayerHelper } from '../modules/helper/player-helper';
import { ApiClient } from './api-client';
import { GetLocalHostAPIKEY } from './api-client.local';
import { ApiRoute } from './api-route';

const ERROR_PREFIX = 'ERR:';
const TIMEOUT_SECONDS = 10;

interface PendingRequest {
  requestId: string;
  path: string;
  url: string;
  onSuccess: (data: string) => void;
  onFailure: (reason: string) => void;
  timerName: string;
}

/**
 * 从代理响应体中取出 ERR:<code> 错误码；非 ERR 前缀视为成功数据。
 * API 恒返回 200，成败全靠 title 里这个前缀区分。
 */
export function parseProxyError(data: string): string | undefined {
  if (data.indexOf(ERROR_PREFIX) !== 0) return undefined;
  return data.slice(ERROR_PREFIX.length);
}

/**
 * 通用客户端代发 HTTP 传输层：游廊对局里服务端拿不到 CreateHTTPRequestScriptVM
 * 请求对象时，选一名已连接的真人玩家，用其客户端的 DOTAHTMLPanel 代发 GET 请求，
 * 响应经由 title 带回。不认识任何业务路径，拆分/合并由各业务调用方自行实现。
 */
export class ApiProxy {
  private static seq = 0;
  private static readyPlayerIds = new Set<PlayerID>();
  private static pending = new Map<string, PendingRequest>();
  private static queue: PendingRequest[] = [];

  public static Initialize(): void {
    CustomGameEventManager.RegisterListener<Record<string, never>>('api_proxy_ready', (_, event) =>
      ApiProxy.onClientReady(event.PlayerID),
    );
    CustomGameEventManager.RegisterListener<ApiProxyResponseEventData>(
      'api_proxy_response',
      (_, event) => ApiProxy.onResponse(event),
    );
    CustomGameEventManager.RegisterListener<ApiProxyFailureEventData>(
      'api_proxy_failure',
      (_, event) => ApiProxy.onFailure(event),
    );
  }

  public static Send(
    path: string,
    querys: { [key: string]: string },
    onSuccess: (data: string) => void,
    onFailure: (reason: string) => void,
  ): void {
    const requestId = ApiProxy.nextRequestId();
    const url = ApiProxy.buildUrl(path, querys, requestId);
    const request: PendingRequest = {
      requestId,
      path,
      url,
      onSuccess,
      onFailure,
      timerName: '',
    };
    request.timerName = Timers.CreateTimer(TIMEOUT_SECONDS, () => {
      ApiProxy.finish(requestId, undefined, 'timeout');
    });
    ApiProxy.pending.set(requestId, request);

    const relayPlayerId = ApiProxy.selectRelayPlayer();
    if (relayPlayerId === undefined) {
      print(`[ApiProxy] no relay player ready, queueing ${requestId} path=${path}`);
      ApiProxy.queue.push(request);
      return;
    }
    ApiProxy.dispatch(request, relayPlayerId);
  }

  private static onClientReady(playerId: PlayerID): void {
    if (ApiProxy.readyPlayerIds.has(playerId)) return;
    ApiProxy.readyPlayerIds.add(playerId);
    print(`[ApiProxy] player ${playerId} ready`);

    if (ApiProxy.queue.length === 0) return;
    const relayPlayerId = ApiProxy.selectRelayPlayer();
    if (relayPlayerId === undefined) return;

    const queued = ApiProxy.queue;
    ApiProxy.queue = [];
    for (const request of queued) {
      if (ApiProxy.pending.has(request.requestId)) {
        ApiProxy.dispatch(request, relayPlayerId);
      }
    }
  }

  private static dispatch(request: PendingRequest, relayPlayerId: PlayerID): void {
    const player = PlayerResource.GetPlayer(relayPlayerId);
    if (!player) {
      ApiProxy.queue.push(request);
      return;
    }
    print(`[ApiProxy] dispatch ${request.requestId} player=${relayPlayerId} url=${request.url}`);
    CustomGameEventManager.Send_ServerToPlayer(player, 'api_proxy_request', {
      requestId: request.requestId,
      url: request.url,
    });
  }

  private static onResponse(event: ApiProxyResponseEventData): void {
    const titleLength = event.requestId.length + 1 + event.data.length;
    print(
      `[ApiProxy] response ${event.requestId} titleLength(approx)=${titleLength} dataLength=${event.data.length}`,
    );
    const errorCode = parseProxyError(event.data);
    if (errorCode) {
      ApiProxy.finish(event.requestId, undefined, errorCode);
      return;
    }
    ApiProxy.finish(event.requestId, event.data, undefined);
  }

  private static onFailure(event: ApiProxyFailureEventData): void {
    print(`[ApiProxy] client failure ${event.requestId} reason=${event.reason}`);
    ApiProxy.finish(event.requestId, undefined, event.reason);
  }

  private static finish(
    requestId: string,
    data: string | undefined,
    reason: string | undefined,
  ): void {
    const request = ApiProxy.pending.get(requestId);
    if (!request) return;
    ApiProxy.pending.delete(requestId);
    ApiProxy.queue = ApiProxy.queue.filter((r) => r.requestId !== requestId);
    Timers.RemoveTimer(request.timerName);

    if (data !== undefined) {
      request.onSuccess(data);
    } else {
      print(`[ApiProxy] request ${requestId} path=${request.path} failed: ${reason}`);
      request.onFailure(reason ?? 'unknown');
    }
  }

  // 第一个已就绪、已连接、steamId > 0 的真人玩家；掉线或未就绪时顺延到下一个
  private static selectRelayPlayer(): PlayerID | undefined {
    for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
      if (
        PlayerResource.IsValidPlayer(playerId) &&
        ApiProxy.readyPlayerIds.has(playerId) &&
        PlayerHelper.IsHumanPlayerByPlayerId(playerId) &&
        PlayerResource.GetConnectionState(playerId) === ConnectionState.CONNECTED
      ) {
        return playerId;
      }
    }
    return undefined;
  }

  private static nextRequestId(): string {
    ApiProxy.seq++;
    const random = Math.floor(Math.random() * 1000000000);
    return `p_${ApiProxy.seq}_${random}`;
  }

  private static buildUrl(
    path: string,
    querys: { [key: string]: string },
    requestId: string,
  ): string {
    const apiKey = GetLocalHostAPIKEY() || ApiClient.GetServerAuthKey();
    const parts: string[] = [`requestId=${requestId}`];
    for (const key in querys) {
      parts.push(`${key}=${querys[key]}`);
    }
    parts.push(`apiKey=${apiKey}`);
    parts.push(`_=${Math.floor(Math.random() * 1000000000)}`);
    return `${ApiRoute.GetBaseUrl()}${path}?${parts.join('&')}`;
  }
}
