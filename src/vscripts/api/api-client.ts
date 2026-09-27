import { GetApiTarget, GetForceProxy, GetLocalHostAPIKEY } from './api-client.local';
import { ApiRoute, type ApiTarget } from './api-route';

// enum http methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface ApiParameter {
  method: HttpMethod;
  path: string;
  querys?: { [key: string]: string };
  body?: object;
  successFunc: (data: string) => void;
  failureFunc?: (data: string) => void;
  /** 总尝试次数而非重试次数：1 表示只发一次不再重试，默认 3 表示首次加两次重试 */
  retryTimes?: number;
  timeoutSeconds?: number;
}

export type ProxyPathParams = { [key: string]: string };

// 服务端拿不到 HTTP 请求对象时，白名单路径转交客户端代理处理；由各业务模块自行注册
export type ProxyHandler = (
  target: ApiTarget,
  apiParameter: ApiParameter,
  pathParams: ProxyPathParams,
  callbackFunc: (result: CScriptHTTPResponse) => void,
) => void;

/**
 * 按注册的路由模式匹配请求路径，取出 `:` 开头那些段的值。
 * 代理路由把路径参数一律挪进 query，取出的值交给处理函数拼进去。
 */
export function matchProxyPath(pattern: string, path: string): ProxyPathParams | undefined {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  if (patternParts.length !== pathParts.length) return undefined;

  const pathParams: ProxyPathParams = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].indexOf(':') === 0) {
      pathParams[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return undefined;
    }
  }
  return pathParams;
}

// 4xx 是请求本身被拒，原样重发只会得到同样的结果；429 是后端实例不够时的限流，过一会儿能好
export function isRetryableStatus(statusCode: number): boolean {
  return statusCode === 0 || statusCode === 429 || statusCode >= 500;
}

export class ApiClient {
  private static TIMEOUT_SECONDS = 10;
  private static RETRY_TIMES = 3;
  public static PROBE_PATH = '/game/probe';
  private static PROBE_TIMEOUT_SECONDS = 5;

  public static LOCAL_APIKEY = 'Invalid_NotOnDedicatedServer';
  private static proxyHandlers = new Map<string, ProxyHandler>();

  // dont change this version, it is used to identify the server
  public static GetServerAuthKey() {
    const keyVersion = 'v3';
    return GetDedicatedServerKeyV3(keyVersion);
  }

  public static RegisterProxyHandler(pattern: string, handler: ProxyHandler): void {
    ApiClient.proxyHandlers.set(pattern, handler);
  }

  public static IsLocalhost() {
    const apiKey = this.GetServerAuthKey();
    return apiKey === ApiClient.LOCAL_APIKEY;
  }

  public static SelectRoute(onSelected: () => void): void {
    if (IsInToolsMode()) {
      const target = GetApiTarget();
      if (target !== 'auto') {
        this.setRoute(target, onSelected);
        return;
      }
    }

    let selected = false;
    let directDone = false;
    let directProbeAvailable = false;
    let directCountry: string | undefined;
    let cnProxyDone = false;
    let cnProxyAvailable = false;

    const select = (nextTarget: ApiTarget) => {
      if (selected) return;
      selected = true;
      this.setRoute(nextTarget, onSelected);
    };
    const chooseWhenComplete = () => {
      if (!directDone || !cnProxyDone) return;
      select(ApiRoute.ChooseTarget(directProbeAvailable, directCountry, cnProxyAvailable));
    };

    this.sendTo('direct', this.probeParameter(), (result) => {
      directDone = true;
      directProbeAvailable = result.StatusCode >= 200 && result.StatusCode < 300;
      directCountry = this.GetProbeCountry(result);
      print(
        `[ApiClient] direct probe status=${result.StatusCode} country=${directCountry ?? 'unavailable'}`,
      );
      if (directCountry && !ApiRoute.IsProxyCountry(directCountry)) {
        select('direct');
        return;
      }
      chooseWhenComplete();
    });

    this.sendTo('cn-proxy', this.probeParameter(), (result) => {
      cnProxyDone = true;
      cnProxyAvailable = result.StatusCode >= 200 && result.StatusCode < 300;
      print(`[ApiClient] cn-proxy probe status=${result.StatusCode}`);
      if (!cnProxyAvailable) {
        select('direct');
        return;
      }
      chooseWhenComplete();
    });
  }

  public static send(
    apiParameter: ApiParameter,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ) {
    this.sendTo(ApiRoute.GetTarget(), apiParameter, callbackFunc);
  }

  public static sendWithRetry(apiParameter: ApiParameter) {
    let retryCount = 0;
    const maxRetryTimes = apiParameter.retryTimes || ApiClient.RETRY_TIMES;
    const retry = () => {
      this.send(apiParameter, (result: CScriptHTTPResponse) => {
        // if 20X
        print(`[ApiClient] return with status code: ${result.StatusCode}`);
        if (result.StatusCode < 200 || result.StatusCode >= 300) {
          print(`[ApiClient] failed response body: ${result.Body}`);
        }
        if (result.StatusCode >= 200 && result.StatusCode < 300) {
          apiParameter.successFunc(result.Body);
        } else if (!isRetryableStatus(result.StatusCode)) {
          if (apiParameter.failureFunc) {
            apiParameter.failureFunc(result.Body);
          }
        } else {
          retryCount++;
          if (retryCount < maxRetryTimes) {
            print(`[ApiClient] getWithRetry retry ${retryCount}`);
            retry();
          } else {
            if (apiParameter.failureFunc) {
              apiParameter.failureFunc(result.Body);
            }
          }
        }
      });
    };
    retry();
  }

  // 白名单路径转交客户端代理发出，其余路径走一次失败回调，让调用方的失败链路正常结束，
  // 否则加载状态会永远停在「加载中」
  private static sendThroughProxy(
    target: ApiTarget,
    apiParameter: ApiParameter,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    // 腾讯云网关给每个响应强制加 Content-Disposition: attachment，网页控件会当成下载而不渲染，
    // 读不到标题还会弹出文件选择框。服务端直连用的是裸 HTTP 客户端，不看这个头，不受影响
    if (target === 'cn-proxy') {
      print('[ApiClient] cn-proxy unavailable through client proxy');
      callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      return;
    }
    const proxy = ApiClient.findProxyHandler(apiParameter.path);
    if (!proxy) {
      print('[ApiClient] http unavailable on this host');
      callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      return;
    }
    print(`[ApiClient] routing ${apiParameter.path} through client proxy`);
    proxy.handler(target, apiParameter, proxy.pathParams, callbackFunc);
  }

  private static findProxyHandler(
    path: string,
  ): { handler: ProxyHandler; pathParams: ProxyPathParams } | undefined {
    // 字面路由先命中，后来新增的带参数路由就吃不掉它，也不用关心注册顺序
    const literal = ApiClient.proxyHandlers.get(path);
    if (literal) return { handler: literal, pathParams: {} };

    for (const [pattern, handler] of ApiClient.proxyHandlers) {
      if (pattern.indexOf(':') < 0) continue;
      const pathParams = matchProxyPath(pattern, path);
      if (pathParams) return { handler, pathParams };
    }
    return undefined;
  }

  private static probeParameter(): ApiParameter {
    return {
      method: HttpMethod.GET,
      path: this.PROBE_PATH,
      successFunc: () => undefined,
      timeoutSeconds: this.PROBE_TIMEOUT_SECONDS,
    };
  }

  private static GetProbeCountry(result: CScriptHTTPResponse): string | undefined {
    if (result.StatusCode < 200 || result.StatusCode >= 300) return undefined;
    try {
      const body = json.decode(result.Body)[0] as { country?: string };
      return body.country;
    } catch {
      return undefined;
    }
  }

  private static setRoute(target: ApiTarget, onSelected: () => void): void {
    ApiRoute.SetTarget(target);
    print(`[ApiClient] selected API route: ${target}`);
    onSelected();
  }

  private static sendTo(
    target: ApiTarget,
    apiParameter: ApiParameter,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ) {
    const method = apiParameter.method;
    const path = apiParameter.path;
    const querys = apiParameter.querys;
    const body = apiParameter.body;
    const timeoutSeconds = apiParameter.timeoutSeconds || ApiClient.TIMEOUT_SECONDS;

    // 引擎的 SetHTTPRequestGetOrPostParameter 只对 GET/POST 行为可预期，
    // 对 DELETE 等方法不会拼到 URL；统一在这里手动拼 query string，所有方法行为一致。
    let fullPath = path;
    if (querys) {
      const parts: string[] = [];
      for (const key in querys) {
        parts.push(`${key}=${querys[key]}`);
      }
      if (parts.length > 0) {
        fullPath += (path.indexOf('?') >= 0 ? '&' : '?') + parts.join('&');
      }
    }

    const baseUrl = ApiRoute.GetBaseUrl(target);
    print(`[ApiClient] ${method} ${baseUrl}${fullPath} body ${json.encode(body)}`);
    // Dota Tools 里服务端能直连，调试白名单代理时用开关强制跳过直连
    const forceProxy = IsInToolsMode() && GetForceProxy();
    const request = forceProxy ? undefined : CreateHTTPRequestScriptVM(method, baseUrl + fullPath);
    if (!request) {
      ApiClient.sendThroughProxy(target, apiParameter, callbackFunc);
      return;
    }
    const apiKey = this.GetServerAuthKey();
    const isLocalhost = this.IsLocalhost();

    request.SetHTTPRequestNetworkActivityTimeout(timeoutSeconds);
    request.SetHTTPRequestHeaderValue(
      'x-api-key',
      isLocalhost ? GetLocalHostAPIKEY() || apiKey : apiKey,
    );
    if (body) {
      request.SetHTTPRequestRawPostBody('application/json', json.encode(body));
    }
    request.Send((result: CScriptHTTPResponse) => {
      callbackFunc(result);
    });
  }
}
