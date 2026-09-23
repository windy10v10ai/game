import { PlayerHelper } from '../modules/helper/player-helper';
import { ApiClient } from './api-client';
import { GetLocalHostAPIKEY } from './api-client.local';
import { ApiRoute, type ApiTarget } from './api-route';

const ERROR_PREFIX = 'ERR:';
const API_KEY_PARAM = 'apiKey=';
const TIMEOUT_SECONDS = 10;
// 开局时客户端多半还没加载完，排队等它举手的时间不该占用请求预算。
// 取 60 秒对齐客户端脚本自己的就绪重试窗口：它等不到就不会再举手，再等也没用
const QUEUE_TIMEOUT_SECONDS = 60;

interface PendingRequest {
  requestId: string;
  path: string;
  url: string;
  onSuccess: (data: string) => void;
  onFailure: (reason: string) => void;
  timerName: string;
  relayPlayerId: PlayerID | undefined;
  timeoutSeconds: number;
}

/**
 * 遮掉网址里的 apiKey 再输出。日志会随 console.log 落盘，玩家拿得到。
 * 手写切片而非正则：TSTL 不支持 JS 正则。
 */
export function maskApiKey(url: string): string {
  const keyStart = url.indexOf(API_KEY_PARAM);
  if (keyStart < 0) return url;
  const valueStart = keyStart + API_KEY_PARAM.length;
  const valueEnd = url.indexOf('&', valueStart);
  const masked = `${url.slice(0, valueStart)}***`;
  return valueEnd < 0 ? masked : `${masked}${url.slice(valueEnd)}`;
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
export class ApiHtmlProxy {
  private static seq = 0;
  private static readyPlayerIds = new Set<PlayerID>();
  private static failedPlayerIds = new Set<PlayerID>();
  private static pending = new Map<string, PendingRequest>();
  private static queue: PendingRequest[] = [];

  public static Initialize(): void {
    CustomGameEventManager.RegisterListener<Record<string, never>>(
      'api_html_proxy_ready',
      (_, event) => ApiHtmlProxy.onClientReady(event.PlayerID),
    );
    CustomGameEventManager.RegisterListener<ApiHtmlProxyResponseEventData>(
      'api_html_proxy_response',
      (_, event) => ApiHtmlProxy.onResponse(event.PlayerID, event),
    );
    CustomGameEventManager.RegisterListener<ApiHtmlProxyFailureEventData>(
      'api_html_proxy_failure',
      (_, event) => ApiHtmlProxy.onFailure(event.PlayerID, event),
    );
  }

  public static Send(
    target: ApiTarget,
    path: string,
    querys: { [key: string]: string },
    onSuccess: (data: string) => void,
    onFailure: (reason: string) => void,
    timeoutSeconds = TIMEOUT_SECONDS,
  ): void {
    const requestId = ApiHtmlProxy.nextRequestId();
    const url = ApiHtmlProxy.buildUrl(target, path, querys, requestId);
    const request: PendingRequest = {
      requestId,
      path,
      url,
      onSuccess,
      onFailure,
      timerName: '',
      relayPlayerId: undefined,
      timeoutSeconds,
    };
    ApiHtmlProxy.startTimeout(request, QUEUE_TIMEOUT_SECONDS);
    ApiHtmlProxy.pending.set(requestId, request);

    const relayPlayerId = ApiHtmlProxy.selectRelayPlayer();
    if (relayPlayerId === undefined) {
      print(`[ApiHtmlProxy] no relay player ready, queueing ${requestId} path=${path}`);
      ApiHtmlProxy.queue.push(request);
      return;
    }
    ApiHtmlProxy.dispatch(request, relayPlayerId);
  }

  private static onClientReady(playerId: PlayerID): void {
    // 自定义 UI 脚本加载得比玩家槽位分配还早，最初几条 ready 带的是 -1，登记了也选不出人
    if (playerId < 0) return;

    // 客户端会重发 ready 直到收到回执，重复的 ready 也要回一次，否则回执丢失就会一直重发
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_ack', {});
    }

    if (ApiHtmlProxy.readyPlayerIds.has(playerId)) return;
    ApiHtmlProxy.readyPlayerIds.add(playerId);
    print(`[ApiHtmlProxy] player ${playerId} ready`);

    if (ApiHtmlProxy.queue.length === 0) return;
    const relayPlayerId = ApiHtmlProxy.selectRelayPlayer();
    if (relayPlayerId === undefined) return;

    const queued = ApiHtmlProxy.queue;
    ApiHtmlProxy.queue = [];
    for (const request of queued) {
      if (ApiHtmlProxy.pending.has(request.requestId)) {
        ApiHtmlProxy.dispatch(request, relayPlayerId);
      }
    }
  }

  private static dispatch(request: PendingRequest, relayPlayerId: PlayerID): void {
    const player = PlayerResource.GetPlayer(relayPlayerId);
    if (!player) {
      ApiHtmlProxy.queue.push(request);
      return;
    }
    request.relayPlayerId = relayPlayerId;
    ApiHtmlProxy.startTimeout(request, request.timeoutSeconds);
    print(
      `[ApiHtmlProxy] dispatch ${request.requestId} player=${relayPlayerId} url=${maskApiKey(
        request.url,
      )}`,
    );
    CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_request', {
      requestId: request.requestId,
      url: request.url,
    });
  }

  // 计时重开到本次派发，排队等客户端就绪的时间不占用请求自己的超时预算
  private static startTimeout(request: PendingRequest, seconds: number): void {
    if (request.timerName !== '') {
      Timers.RemoveTimer(request.timerName);
    }
    request.timerName = Timers.CreateTimer(seconds, () => {
      ApiHtmlProxy.markRelayFailed(request.relayPlayerId);
      ApiHtmlProxy.finish(request.requestId, undefined, 'timeout');
    });
  }

  private static onResponse(playerId: PlayerID, event: ApiHtmlProxyResponseEventData): void {
    if (!ApiHtmlProxy.isFromRelayPlayer(playerId, event.requestId)) return;

    const errorCode = parseProxyError(event.data);
    if (errorCode) {
      ApiHtmlProxy.finish(event.requestId, undefined, errorCode);
      return;
    }
    ApiHtmlProxy.finish(event.requestId, event.data, undefined);
  }

  private static onFailure(playerId: PlayerID, event: ApiHtmlProxyFailureEventData): void {
    if (!ApiHtmlProxy.isFromRelayPlayer(playerId, event.requestId)) return;

    print(`[ApiHtmlProxy] client failure ${event.requestId} reason=${event.reason}`);
    ApiHtmlProxy.markRelayFailed(playerId);
    ApiHtmlProxy.finish(event.requestId, undefined, event.reason);
  }

  // 回传只认当初派发给的那名玩家，别的客户端即便猜中 requestId 也顶替不了应答
  private static isFromRelayPlayer(playerId: PlayerID, requestId: string): boolean {
    const request = ApiHtmlProxy.pending.get(requestId);
    if (!request) return false;
    if (request.relayPlayerId !== playerId) {
      print(
        `[ApiHtmlProxy] ignore ${requestId} from player ${playerId}, relay is ${request.relayPlayerId}`,
      );
      return false;
    }
    return true;
  }

  private static finish(
    requestId: string,
    data: string | undefined,
    reason: string | undefined,
  ): void {
    const request = ApiHtmlProxy.pending.get(requestId);
    if (!request) return;
    ApiHtmlProxy.pending.delete(requestId);
    ApiHtmlProxy.queue = ApiHtmlProxy.queue.filter((r) => r.requestId !== requestId);
    Timers.RemoveTimer(request.timerName);

    if (data !== undefined) {
      request.onSuccess(data);
    } else {
      print(`[ApiHtmlProxy] request ${requestId} path=${request.path} failed: ${reason}`);
      request.onFailure(reason ?? 'unknown');
    }
  }

  // 拉黑代发失败过的玩家，让调用方已有的重试落到别人身上。
  // 排队阶段超时时请求还没派发出去，不归咎于任何玩家
  private static markRelayFailed(relayPlayerId: PlayerID | undefined): void {
    if (relayPlayerId === undefined) return;
    if (ApiHtmlProxy.failedPlayerIds.has(relayPlayerId)) return;
    ApiHtmlProxy.failedPlayerIds.add(relayPlayerId);
    print(`[ApiHtmlProxy] player ${relayPlayerId} failed to relay`);
  }

  private static selectRelayPlayer(): PlayerID | undefined {
    const relayPlayerId = ApiHtmlProxy.findRelayPlayer();
    if (relayPlayerId !== undefined) return relayPlayerId;

    // 候选通常只有三四人，一次抖动就永久排除会很快无人可用；全员失败过就清空重来
    ApiHtmlProxy.failedPlayerIds.clear();
    return ApiHtmlProxy.findRelayPlayer();
  }

  // 第一个已就绪、在线、steamId > 0 且没失败过的真人玩家；掉线或未就绪时顺延到下一个
  private static findRelayPlayer(): PlayerID | undefined {
    for (let playerId = 0; playerId < DOTA_MAX_TEAM_PLAYERS; playerId++) {
      if (
        PlayerResource.IsValidPlayer(playerId) &&
        !ApiHtmlProxy.failedPlayerIds.has(playerId) &&
        ApiHtmlProxy.readyPlayerIds.has(playerId) &&
        PlayerHelper.IsHumanPlayerByPlayerId(playerId) &&
        ApiHtmlProxy.isOnline(playerId)
      ) {
        return playerId;
      }
    }
    return undefined;
  }

  // 开局拉数据时客户端多半还停在 LOADING，只认 CONNECTED 会把所有请求都挡在队列里
  private static isOnline(playerId: PlayerID): boolean {
    const state = PlayerResource.GetConnectionState(playerId);
    return state === ConnectionState.CONNECTED || state === ConnectionState.LOADING;
  }

  private static nextRequestId(): string {
    ApiHtmlProxy.seq++;
    const random = Math.floor(Math.random() * 1000000000);
    return `p_${ApiHtmlProxy.seq}_${random}`;
  }

  private static buildUrl(
    target: ApiTarget,
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
    return `${ApiRoute.GetBaseUrl(target)}${path}?${parts.join('&')}`;
  }
}
