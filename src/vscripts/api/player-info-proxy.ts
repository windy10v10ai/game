import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';

const PLAYER_INFO_PATTERN = '/player/:steamId/info';
const PROXY_PLAYER_INFO_PATH = '/proxy/player-info';

/** 把玩家信息刷新转成 /proxy/player-info，路径里的 steamId 改走 query */
export class PlayerInfoProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(PLAYER_INFO_PATTERN, PlayerInfoProxy.Handle);
  }

  private static Handle(
    target: ApiTarget,
    apiParameter: ApiParameter,
    pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const steamId = pathParams.steamId;
    const querys: { [key: string]: string } = { steamId };
    const include = apiParameter.querys?.include;
    if (include) {
      querys.include = include;
    }

    ApiHtmlProxy.Send(
      target,
      PROXY_PLAYER_INFO_PATH,
      querys,
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[PlayerInfoProxy] steamId=${steamId} proxy failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
    );
  }
}
