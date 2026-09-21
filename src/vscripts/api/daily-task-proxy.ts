import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

const DAILY_TASK_PATTERN = '/daily-task/:steamId';
const DAILY_TASK_REFRESH_PATH = '/daily-task/refresh';
const PROXY_DAILY_TASK_PATH = '/proxy/daily-task';
const PROXY_DAILY_TASK_REFRESH_PATH = '/proxy/daily-task-refresh-post';

/** 把每日任务的读取与刷新转成 /proxy/daily-task 与 /proxy/daily-task-refresh-post */
export class DailyTaskProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(DAILY_TASK_PATTERN, DailyTaskProxy.HandleGet);
    ApiClient.RegisterProxyHandler(DAILY_TASK_REFRESH_PATH, DailyTaskProxy.HandleRefresh);
  }

  private static HandleGet(
    target: ApiTarget,
    _apiParameter: ApiParameter,
    pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    DailyTaskProxy.Send(
      target,
      PROXY_DAILY_TASK_PATH,
      { steamId: pathParams.steamId },
      pathParams.steamId,
      callbackFunc,
    );
  }

  private static HandleRefresh(
    target: ApiTarget,
    apiParameter: ApiParameter,
    _pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const body = apiParameter.body as { steamId: number };
    DailyTaskProxy.Send(
      target,
      PROXY_DAILY_TASK_REFRESH_PATH,
      { body: base64UrlEncode(json.encode(body)) },
      tostring(body.steamId),
      callbackFunc,
    );
  }

  private static Send(
    target: ApiTarget,
    proxyPath: string,
    querys: { [key: string]: string },
    steamId: string,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    ApiHtmlProxy.Send(
      target,
      proxyPath,
      querys,
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[DailyTaskProxy] steamId=${steamId} ${proxyPath} failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
    );
  }
}
