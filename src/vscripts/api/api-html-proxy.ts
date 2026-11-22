import { PlayerHelper } from '../modules/helper/player-helper';
import { ApiClient } from './api-client';
import { GetLocalHostAPIKEY } from './api-client.local';
import { ApiRoute, type ApiTarget } from './api-route';
import { RelayJob, RelayScheduler } from './relay-scheduler';

const ERROR_PREFIX = 'ERR:';
const API_KEY_PARAM = 'apiKey=';
const TIMEOUT_SECONDS = 10;
// 开局时客户端多半还没加载完，排队等通道的时间不该占用请求预算。
// 取 60 秒对齐客户端脚本自己的就绪重试窗口：它等不到就不会再举手，再等也没用
const QUEUE_TIMEOUT_SECONDS = 60;
// 代发只走 api.windy10v10ai.com 一条线路：国内网关给每个响应强加 Content-Disposition: attachment，
// 网页控件加载不了中转页，国内玩家连不上就进离线模式。ApiClient 对 cn-proxy 目标已直接失败，到不了这里
const RELAY_LINE = 'direct';

interface PendingRequest extends RelayJob {
  path: string;
  url: string;
  onSuccess: (data: string) => void;
  onFailure: (reason: string) => void;
  timerName: string;
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
 * 请求对象时，选一名已连接的真人玩家，用其客户端预建的网页控件（中转页）代发 GET 请求，
 * 响应经由 title 带回。不认识任何业务路径，拆分/合并由各业务调用方自行实现。
 * 同时在途的请求数受玩家就绪通道数限制，多出来的在服务端排队。
 */
export class ApiHtmlProxy {
  private static seq = 0;
  private static failedPlayerIds = new Set<PlayerID>();
  private static pending = new Map<string, PendingRequest>();
  private static scheduler = new RelayScheduler<PendingRequest>();
  // 引擎限制了网页控件联网时，所有真人客户端都会超时；一旦如此，本局不再白等超时，直接走离线分支
  private static relaySucceeded = false;
  private static relayUnavailable = false;

  public static GetBodyBudget(target: ApiTarget, path: string): number {
    const url = ApiHtmlProxy.buildUrl(target, path, { body: '' }, 'p_9999999999_999999999');
    // Reserve room for the cache-busting suffix and request counter to grow.
    return Math.max(0, 7000 - url.length - 32);
  }

  public static Initialize(): void {
    CustomGameEventManager.RegisterListener<ApiHtmlProxyReadyEventData>(
      'api_html_proxy_ready',
      (_, event) => ApiHtmlProxy.onClientReady(event.PlayerID, event),
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
    if (ApiHtmlProxy.relayUnavailable) {
      print(`[ApiHtmlProxy] relay unavailable, fail fast path=${path}`);
      Timers.CreateTimer(0, () => onFailure('relay_unavailable'));
      return;
    }
    const requestId = ApiHtmlProxy.nextRequestId();
    const url = ApiHtmlProxy.buildUrl(target, path, querys, requestId);
    const request: PendingRequest = {
      requestId,
      line: RELAY_LINE,
      path,
      url,
      onSuccess,
      onFailure,
      timerName: '',
      timeoutSeconds,
    };
    ApiHtmlProxy.startTimeout(request, QUEUE_TIMEOUT_SECONDS);
    ApiHtmlProxy.pending.set(requestId, request);
    ApiHtmlProxy.scheduler.Enqueue(request);
    ApiHtmlProxy.pump();
    if (ApiHtmlProxy.scheduler.GetAssignedPlayer(requestId) === undefined) {
      print(`[ApiHtmlProxy] no free channel, queueing ${requestId} path=${path}`);
    }
  }

  private static onClientReady(playerId: PlayerID, event: ApiHtmlProxyReadyEventData): void {
    // 自定义 UI 脚本加载得比玩家槽位分配还早，最初几条 ready 带的是 -1，登记了也选不出人
    if (playerId < 0) return;

    const channels = Number(event.channels) || 0;
    // 客户端会重发 ready 直到回执与自己的通道数一致，重复的 ready 也要回，否则回执丢失就会一直重发
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_ack', { channels });
    }

    if (ApiHtmlProxy.scheduler.GetCapacity(playerId, RELAY_LINE) === channels) return;
    ApiHtmlProxy.scheduler.SetCapacity(playerId, RELAY_LINE, channels);
    print(`[ApiHtmlProxy] player ${playerId} ready channels=${channels}`);
    ApiHtmlProxy.pump();
  }

  // 把队列里能派的都派出去；全员失败过就清空黑名单重来，候选通常只有三四人
  private static pump(): void {
    if (ApiHtmlProxy.scheduler.QueuedCount() === 0) return;
    let assignments = ApiHtmlProxy.scheduler.Drain(ApiHtmlProxy.canRelay);
    if (
      assignments.length === 0 &&
      ApiHtmlProxy.failedPlayerIds.size > 0 &&
      !ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.canRelay) &&
      ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.isCandidate)
    ) {
      ApiHtmlProxy.failedPlayerIds.clear();
      assignments = ApiHtmlProxy.scheduler.Drain(ApiHtmlProxy.canRelay);
    }
    for (const { job, playerId } of assignments) {
      ApiHtmlProxy.dispatch(job, playerId);
    }
  }

  private static dispatch(request: PendingRequest, relayPlayerId: PlayerID): void {
    const player = PlayerResource.GetPlayer(relayPlayerId);
    if (!player) return;
    // 计时重开到本次派发，排队等通道的时间不占用请求自己的超时预算
    ApiHtmlProxy.startTimeout(request, request.timeoutSeconds);
    const active = ApiHtmlProxy.scheduler.Active(relayPlayerId, request.line);
    print(
      `[ApiHtmlProxy] dispatch ${request.requestId} player=${relayPlayerId} line=${request.line} active=${active} queued=${ApiHtmlProxy.scheduler.QueuedCount()} url=${maskApiKey(
        request.url,
      )}`,
    );
    CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_request', {
      requestId: request.requestId,
      url: request.url,
    });
  }

  private static startTimeout(request: PendingRequest, seconds: number): void {
    if (request.timerName !== '') {
      Timers.RemoveTimer(request.timerName);
    }
    request.timerName = Timers.CreateTimer(seconds, () => {
      ApiHtmlProxy.cancelOnClient(request);
      ApiHtmlProxy.markRelayFailed(ApiHtmlProxy.scheduler.GetAssignedPlayer(request.requestId));
      ApiHtmlProxy.finish(request.requestId, undefined, 'timeout');
    });
  }

  // 服务端超时早于客户端控件自己的超时，不让它继续加载，否则调用方重发时同一请求有两份在途
  private static cancelOnClient(request: PendingRequest): void {
    const relayPlayerId = ApiHtmlProxy.scheduler.GetAssignedPlayer(request.requestId);
    if (relayPlayerId === undefined) return;
    const player = PlayerResource.GetPlayer(relayPlayerId);
    if (!player) return;
    CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_cancel', {
      requestId: request.requestId,
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
    if (!ApiHtmlProxy.pending.has(requestId)) return false;
    const relayPlayerId = ApiHtmlProxy.scheduler.GetAssignedPlayer(requestId);
    if (relayPlayerId !== playerId) {
      print(
        `[ApiHtmlProxy] ignore ${requestId} from player ${playerId}, relay is ${relayPlayerId}`,
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
    ApiHtmlProxy.scheduler.Release(requestId);
    Timers.RemoveTimer(request.timerName);

    if (data !== undefined) {
      ApiHtmlProxy.relaySucceeded = true;
      request.onSuccess(data);
    } else {
      print(`[ApiHtmlProxy] request ${requestId} path=${request.path} failed: ${reason}`);
      request.onFailure(reason ?? 'unknown');
    }
    // 释放了一个通道，补发排队的下一条
    ApiHtmlProxy.pump();
  }

  // 拉黑代发失败过的玩家，让调用方已有的重试落到别人身上。
  // 排队阶段超时时请求还没派发出去，不归咎于任何玩家
  private static markRelayFailed(relayPlayerId: PlayerID | undefined): void {
    if (relayPlayerId === undefined) return;
    if (ApiHtmlProxy.failedPlayerIds.has(relayPlayerId)) return;
    ApiHtmlProxy.failedPlayerIds.add(relayPlayerId);
    print(`[ApiHtmlProxy] player ${relayPlayerId} failed to relay`);

    if (
      ApiHtmlProxy.relaySucceeded ||
      ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.canRelay)
    ) {
      return;
    }
    ApiHtmlProxy.relayUnavailable = true;
    print('[ApiHtmlProxy] every ready player failed to relay, relay unavailable for this match');
    ApiHtmlProxy.failAllPending();
  }

  private static failAllPending(): void {
    const requests: PendingRequest[] = [];
    ApiHtmlProxy.pending.forEach((request) => requests.push(request));
    for (const request of requests) {
      ApiHtmlProxy.cancelOnClient(request);
      ApiHtmlProxy.finish(request.requestId, undefined, 'relay_unavailable');
    }
  }

  private static canRelay = (playerId: PlayerID): boolean =>
    !ApiHtmlProxy.failedPlayerIds.has(playerId) && ApiHtmlProxy.isCandidate(playerId);

  // 已登记通道、在线、steamId > 0 的真人玩家；掉线的顺延到下一个
  private static isCandidate = (playerId: PlayerID): boolean =>
    PlayerResource.IsValidPlayer(playerId) &&
    PlayerResource.GetPlayer(playerId) !== undefined &&
    PlayerHelper.IsHumanPlayerByPlayerId(playerId) &&
    ApiHtmlProxy.isOnline(playerId);

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
