import { GameEndDto, GameEndPlayerDto } from './analytics/dto/game-end-dto';
import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

const GAME_END_LOCAL_PATH = '/game/end/local';
const PROXY_GAME_END_LOCAL_PATH = '/proxy/game-end-local-post';

// 后端 DTO 没声明 playerId，带进网址只是白占字符
type GameEndPlayerPayload = Omit<GameEndPlayerDto, 'playerId'>;
export type GameEndPlayerRequest = Omit<GameEndDto, 'players'> & {
  players: GameEndPlayerPayload[];
};

/** 把整场结算按真人玩家拆成自包含请求，bot 行只在这里丢弃 */
export function splitGameEndByPlayer(gameEnd: GameEndDto): GameEndPlayerRequest[] {
  const requests: GameEndPlayerRequest[] = [];
  for (const player of gameEnd.players) {
    if (player.steamId <= 0) continue;
    const { playerId: _playerId, ...playerPayload } = player;
    requests.push({ ...gameEnd, players: [playerPayload] });
  }
  return requests;
}

/** 把 /game/end/local 按玩家拆成多条 /proxy/game-end-local-post 并行请求 */
export class GameEndProxy {
  public static Register(): void {
    ApiClient.RegisterProxyHandler(GAME_END_LOCAL_PATH, GameEndProxy.Handle);
  }

  private static Handle(
    target: ApiTarget,
    apiParameter: ApiParameter,
    _pathParams: ProxyPathParams,
    callbackFunc: (result: CScriptHTTPResponse) => void,
  ): void {
    const requests = splitGameEndByPlayer(apiParameter.body as GameEndDto);
    if (requests.length === 0) {
      print('[GameEndProxy] no human players to settle');
      callbackFunc({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      return;
    }

    let pending = requests.length;
    let succeeded = 0;

    const onOneDone = () => {
      pending--;
      if (pending > 0) return;
      // 失败的玩家结算就丢了：结算是累加写入，重发会让积分战绩翻倍
      callbackFunc({
        StatusCode: succeeded > 0 ? 200 : 0,
        Body: json.encode({ total: requests.length, succeeded }),
      } as CScriptHTTPResponse);
    };

    for (const request of requests) {
      const steamId = request.players[0].steamId;
      ApiHtmlProxy.Send(
        target,
        PROXY_GAME_END_LOCAL_PATH,
        { body: base64UrlEncode(json.encode(request)) },
        (data) => {
          succeeded++;
          // recorded 为 false 是被限额或冷却拒绝，不是错误
          if (!GameEndProxy.isRecorded(data)) {
            print(`[GameEndProxy] steamId=${steamId} settlement not recorded: ${data}`);
          }
          onOneDone();
        },
        (reason) => {
          print(`[GameEndProxy] steamId=${steamId} game-end proxy failed: ${reason}`);
          onOneDone();
        },
      );
    }
  }

  private static isRecorded(data: string): boolean {
    try {
      return (json.decode(data)[0] as { recorded?: boolean }).recorded === true;
    } catch {
      return false;
    }
  }
}
