import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

const PLAYER_WRITE_ROUTES: { pattern: string; proxyPath: string }[] = [
  { pattern: '/player/:steamId/setting', proxyPath: '/proxy/player-setting-put' },
  { pattern: '/player/:steamId/game-preset', proxyPath: '/proxy/player-game-preset-put' },
  { pattern: '/player/member-points/use', proxyPath: '/proxy/player-member-points-use-post' },
  { pattern: '/player/conduct', proxyPath: '/proxy/player-conduct-post' },
];

/** 把游戏内的玩家小写入（快捷键设置、游戏预设、会员积分、行为分）转成对应的代发路由 */
export class PlayerWriteProxy {
  public static Register(): void {
    for (const route of PLAYER_WRITE_ROUTES) {
      ApiClient.RegisterProxyHandler(route.pattern, (target, apiParameter, pathParams, callback) =>
        PlayerWriteProxy.Handle(route.proxyPath, target, apiParameter, pathParams, callback),
      );
    }
  }

  private static Handle(
    proxyPath: string,
    target: ApiTarget,
    apiParameter: ApiParameter,
    pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const querys: { [key: string]: string } = {
      body: base64UrlEncode(json.encode(apiParameter.body ?? {})),
    };
    if (pathParams.steamId !== undefined) {
      querys.steamId = pathParams.steamId;
    }

    ApiHtmlProxy.Send(
      target,
      proxyPath,
      querys,
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[PlayerWriteProxy] ${proxyPath} failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
    );
  }
}
