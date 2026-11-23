import { PlayerHelper } from '../modules/helper/player-helper';
import { ApiClient } from './api-client';
import { GetLocalHostAPIKEY } from './api-client.local';
import { ApiRoute, type ApiTarget } from './api-route';
import { RelayJob, RelayScheduler } from './relay-scheduler';

const ERROR_PREFIX = 'ERR:';
const API_KEY_PARAM = 'apiKey=';
const TIMEOUT_SECONDS = 10;
// 开局时客户端多半还没加载完，排队等通道的时间不该占用请求预算。
// 客户端会一直举手到服务端回执为止，慢机器晚到也接得上；这里的上限只是不让请求无限挂着
const QUEUE_TIMEOUT_SECONDS = 60;
// Each player has a separate widget set per line, so a broken line never drags down the other.
const RELAY_LINES = ['direct', 'cn-proxy'];
const COUNTRY_CODE_LENGTH = 2;

function lineOf(target: ApiTarget): string {
  return target === 'cn-proxy' ? 'cn-proxy' : 'direct';
}

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
  private static failedPlayers = new Map<string, Set<PlayerID>>();
  private static pending = new Map<string, PendingRequest>();
  private static scheduler = new RelayScheduler<PendingRequest>();
  private static countries = new Map<PlayerID, string>();
  // 引擎限制了网页控件联网时，所有真人客户端都会超时；一旦如此，本局不再白等超时，直接走离线分支
  private static succeededLines = new Set<string>();
  private static unavailableLines = new Set<string>();

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
    queueTimeoutSeconds = QUEUE_TIMEOUT_SECONDS,
  ): void {
    const line = lineOf(target);
    if (ApiHtmlProxy.unavailableLines.has(line)) {
      print(`[ApiHtmlProxy] relay unavailable, fail fast line=${line} path=${path}`);
      Timers.CreateTimer(0, () => onFailure('relay_unavailable'));
      return;
    }
    const requestId = ApiHtmlProxy.nextRequestId();
    const url = ApiHtmlProxy.buildUrl(target, path, querys, requestId);
    const request: PendingRequest = {
      requestId,
      line,
      path,
      url,
      onSuccess,
      onFailure,
      timerName: '',
      timeoutSeconds,
    };
    ApiHtmlProxy.startTimeout(request, queueTimeoutSeconds);
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
    const backupChannels = Number(event.backupChannels) || 0;
    const country =
      typeof event.country === 'string'
        ? event.country.slice(0, COUNTRY_CODE_LENGTH).toUpperCase()
        : '';
    // The client resends ready until the ack matches its report, so duplicates must be acked too.
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      CustomGameEventManager.Send_ServerToPlayer(player, 'api_html_proxy_ack', {
        channels,
        backupChannels,
        country,
      });
    }

    const capacityChanged =
      ApiHtmlProxy.scheduler.GetCapacity(playerId, 'direct') !== channels ||
      ApiHtmlProxy.scheduler.GetCapacity(playerId, 'cn-proxy') !== backupChannels;
    if (!capacityChanged && ApiHtmlProxy.countries.get(playerId) === country) return;

    ApiHtmlProxy.countries.set(playerId, country);
    ApiHtmlProxy.scheduler.SetCapacity(playerId, 'direct', channels);
    ApiHtmlProxy.scheduler.SetCapacity(playerId, 'cn-proxy', backupChannels);
    // Each client reads only its own entry to pick the website domain.
    CustomNetTables.SetTableValue('api_route', playerId.toString(), {
      channels,
      backupChannels,
      country,
    });
    print(
      `[ApiHtmlProxy] player ${playerId} ready channels=${channels} backupChannels=${backupChannels} country=${country}`,
    );
    if (capacityChanged) ApiHtmlProxy.pump();
  }

  // A line whose candidates have all failed gets its blacklist cleared, since there are only a few candidates.
  private static pump(): void {
    if (ApiHtmlProxy.scheduler.QueuedCount() === 0) return;
    let assignments = ApiHtmlProxy.scheduler.Drain(ApiHtmlProxy.canRelay);
    if (assignments.length === 0 && ApiHtmlProxy.resetExhaustedLines()) {
      assignments = ApiHtmlProxy.scheduler.Drain(ApiHtmlProxy.canRelay);
    }
    for (const { job, playerId } of assignments) {
      ApiHtmlProxy.dispatch(job, playerId);
    }
  }

  private static resetExhaustedLines(): boolean {
    let reset = false;
    for (const line of RELAY_LINES) {
      if (ApiHtmlProxy.unavailableLines.has(line)) continue;
      const failed = ApiHtmlProxy.failedPlayers.get(line);
      if (
        failed !== undefined &&
        failed.size > 0 &&
        !ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.canRelay, line) &&
        ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.isCandidate, line)
      ) {
        failed.clear();
        reset = true;
      }
    }
    return reset;
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
      ApiHtmlProxy.markRelayFailed(
        ApiHtmlProxy.scheduler.GetAssignedPlayer(request.requestId),
        request.line,
      );
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
    const line = ApiHtmlProxy.pending.get(event.requestId)?.line;
    if (line !== undefined) ApiHtmlProxy.markRelayFailed(playerId, line);
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
      ApiHtmlProxy.succeededLines.add(request.line);
      request.onSuccess(data);
    } else {
      print(`[ApiHtmlProxy] request ${requestId} path=${request.path} failed: ${reason}`);
      request.onFailure(reason ?? 'unknown');
    }
    // 释放了一个通道，补发排队的下一条
    ApiHtmlProxy.pump();
  }

  // Blacklists a player that failed to relay on a line so the caller's retry lands on someone else.
  // A request that times out while still queued was never dispatched, so nobody is blamed.
  private static markRelayFailed(relayPlayerId: PlayerID | undefined, line: string): void {
    if (relayPlayerId === undefined) return;
    let failed = ApiHtmlProxy.failedPlayers.get(line);
    if (failed === undefined) {
      failed = new Set<PlayerID>();
      ApiHtmlProxy.failedPlayers.set(line, failed);
    }
    if (failed.has(relayPlayerId)) return;
    failed.add(relayPlayerId);
    print(`[ApiHtmlProxy] player ${relayPlayerId} failed to relay line=${line}`);

    if (
      ApiHtmlProxy.succeededLines.has(line) ||
      ApiHtmlProxy.scheduler.HasCapacityPlayer(ApiHtmlProxy.canRelay, line)
    ) {
      return;
    }
    ApiHtmlProxy.unavailableLines.add(line);
    print(
      `[ApiHtmlProxy] every ready player failed to relay, line=${line} unavailable for this match`,
    );
    ApiHtmlProxy.failAllPending(line);
  }

  private static failAllPending(line: string): void {
    const requests: PendingRequest[] = [];
    ApiHtmlProxy.pending.forEach((request) => {
      if (request.line === line) requests.push(request);
    });
    for (const request of requests) {
      ApiHtmlProxy.cancelOnClient(request);
      ApiHtmlProxy.finish(request.requestId, undefined, 'relay_unavailable');
    }
  }

  // An unavailable line is never dispatched to, otherwise cancelling its in-flight requests would immediately re-dispatch queued ones.
  private static canRelay = (playerId: PlayerID, line: string): boolean =>
    !ApiHtmlProxy.unavailableLines.has(line) &&
    !ApiHtmlProxy.failedPlayers.get(line)?.has(playerId) &&
    ApiHtmlProxy.isCandidate(playerId);

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
