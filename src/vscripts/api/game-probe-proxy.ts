import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';

const PROXY_GAME_PROBE_PATH = '/proxy/game-probe';

/** 把开局选路的探测转成 /proxy/game-probe，两个候选地址各自探自己那条 */
export class GameProbeProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(ApiClient.PROBE_PATH, GameProbeProxy.Handle);
  }

  private static Handle(
    target: ApiTarget,
    apiParameter: ApiParameter,
    _pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    ApiHtmlProxy.Send(
      target,
      PROXY_GAME_PROBE_PATH,
      {},
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[GameProbeProxy] ${target} probe failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
      apiParameter.timeoutSeconds,
    );
  }
}
