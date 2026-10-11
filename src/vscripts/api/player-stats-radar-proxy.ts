import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';

const PLAYER_STATS_RADAR_PATTERN = '/player/:steamId/stats/radar';
const PROXY_PLAYER_STATS_RADAR_PATH = '/proxy/player-stats-radar';

/** 把近期表现的读取转成 /proxy/player-stats-radar，路径里的 steamId 改走 query */
export class PlayerStatsRadarProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(PLAYER_STATS_RADAR_PATTERN, PlayerStatsRadarProxy.Handle);
  }

  private static Handle(
    target: ApiTarget,
    _apiParameter: ApiParameter,
    pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const steamId = pathParams.steamId;
    ApiHtmlProxy.Send(
      target,
      PROXY_PLAYER_STATS_RADAR_PATH,
      { steamId },
      (data) => {
        callbackFunc({ StatusCode: 200, Body: data } as CScriptHTTPResponse);
      },
      (reason) => {
        print(`[PlayerStatsRadarProxy] steamId=${steamId} proxy failed: ${reason}`);
        callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      },
    );
  }
}
