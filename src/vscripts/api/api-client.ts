import { ApiRoute, type ApiTarget } from './api-route';
import { GetApiTarget, GetLocalHostAPIKEY } from './api-client.local';

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
  retryTimes?: number;
  timeoutSeconds?: number;
}

export class ApiClient {
  private static TIMEOUT_SECONDS = 10;
  private static RETRY_TIMES = 3;
  private static PROBE_PATH = '/game/probe';
  private static PROBE_TIMEOUT_SECONDS = 5;

  public static LOCAL_APIKEY = 'Invalid_NotOnDedicatedServer';
  // dont change this version, it is used to identify the server
  public static GetServerAuthKey() {
    const keyVersion = 'v3';
    return GetDedicatedServerKeyV3(keyVersion);
  }

  public static IsLocalhost() {
    const apiKey = this.GetServerAuthKey();
    return apiKey === ApiClient.LOCAL_APIKEY;
  }

  public static SelectRoute(onSelected: () => void): void {
    if (IsInToolsMode()) {
      const target = GetApiTarget();
      if (target !== 'auto') {
        this.setRoute(target, onSelected, `tools target=${target}`);
        return;
      }
    }

    let selected = false;
    let directStatusCode: number | undefined;
    let directCountry: string | undefined;
    let cnProxyStatusCode: number | undefined;

    const selectionConditions = () => {
      const directStatus = directStatusCode === undefined ? 'pending' : directStatusCode;
      const country = directCountry ?? 'unavailable';
      const cnProxyStatus = cnProxyStatusCode === undefined ? 'pending' : cnProxyStatusCode;
      return `directStatus=${directStatus} directCountry=${country} cnProxyStatus=${cnProxyStatus}`;
    };
    const select = (nextTarget: ApiTarget) => {
      if (selected) return;
      selected = true;
      this.setRoute(nextTarget, onSelected, selectionConditions());
    };
    const chooseWhenComplete = () => {
      if (directStatusCode === undefined || cnProxyStatusCode === undefined) return;
      select(
        ApiRoute.ChooseTarget(directCountry, cnProxyStatusCode >= 200 && cnProxyStatusCode < 300),
      );
    };

    this.sendTo('direct', this.probeParameter(), (result) => {
      directStatusCode = result.StatusCode;
      directCountry = this.GetProbeCountry(result);
      print(
        `[ApiClient] direct probe status=${result.StatusCode} country=${directCountry ?? 'unavailable'} body=${result.Body}`,
      );
      if (directCountry && directCountry !== 'CN') {
        select('direct');
        return;
      }
      chooseWhenComplete();
    });

    this.sendTo('cn-proxy', this.probeParameter(), (result) => {
      cnProxyStatusCode = result.StatusCode;
      const available = result.StatusCode >= 200 && result.StatusCode < 300;
      print(`[ApiClient] cn-proxy probe status=${result.StatusCode} available=${available}`);
      if (!available) {
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
          print(`[ApiClient] success: ${result.Body}`);
          apiParameter.successFunc(result.Body);
        } else if (result.StatusCode === 401) {
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
      const body = json.decode(result.Body) as { country?: string };
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
    const request = CreateHTTPRequestScriptVM(method, baseUrl + fullPath);
    // 发布版的本地主机自 7.41f 起拿不到请求对象。走一次失败回调，
    // 让调用方的失败链路正常结束，否则加载状态会永远停在「加载中」。
    if (!request) {
      print('[ApiClient] http unavailable on this host');
      callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
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
