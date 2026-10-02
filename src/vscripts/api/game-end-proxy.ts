import { GameEndDto, GameEndPlayerDto } from './analytics/dto/game-end-dto';
import { ApiClient, ApiParameter, ProxyPathParams } from './api-client';
import { ApiHtmlProxy } from './api-html-proxy';
import { type ApiTarget } from './api-route';
import { base64UrlEncode } from '../utils/base64url';

const GAME_END_LOCAL_PATH = '/game/end/local';
const PROXY_GAME_END_LOCAL_PATH = '/proxy/game-end-local-post';
const MAX_ATTEMPTS = 3;
// 超时的那次可能还在后端处理，隔一会儿再发，让冷却先记上、挡住重复结算
const RETRY_DELAY_SECONDS = 5;
// 后端明确拒收的请求原样重发结果不变
const NON_RETRYABLE_REASONS = ['bad_request', 'unauthorized', 'not_found', 'too_long'];
// 逐人重试已经用尽，外层若再整体重发会让次数相乘
const ALL_FAILED_STATUS = 408;

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

export function canRetryGameEnd(reason: string, attempt: number): boolean {
  return attempt < MAX_ATTEMPTS && NON_RETRYABLE_REASONS.indexOf(reason) < 0;
}

/** 把 /game/end/local 按玩家拆成多条 /proxy/game-end-local-post 并行请求，失败的玩家单独重试 */
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

    const onOneDone = (ok: boolean) => {
      if (ok) succeeded++;
      pending--;
      if (pending > 0) return;
      callbackFunc({
        StatusCode: succeeded > 0 ? 200 : ALL_FAILED_STATUS,
        Body: json.encode({ total: requests.length, succeeded }),
      } as CScriptHTTPResponse);
    };

    for (const request of requests) {
      GameEndProxy.sendOne(target, request, 1, onOneDone);
    }
  }

  // 结算是累加写入，重试安全靠后端按玩家的冷却：已记上的那次会让重发被拒而不是重复加分
  private static sendOne(
    target: ApiTarget,
    request: GameEndPlayerRequest,
    attempt: number,
    onDone: (ok: boolean) => void,
  ): void {
    const steamId = request.players[0].steamId;
    ApiHtmlProxy.Send(
      target,
      PROXY_GAME_END_LOCAL_PATH,
      { body: base64UrlEncode(json.encode(request)) },
      (data) => {
        // recorded 为 false 是被限额或冷却拒绝，不是错误
        if (!GameEndProxy.isRecorded(data)) {
          print(`[GameEndProxy] steamId=${steamId} settlement not recorded: ${data}`);
        }
        onDone(true);
      },
      (reason) => {
        print(`[GameEndProxy] steamId=${steamId} attempt=${attempt} failed: ${reason}`);
        if (!canRetryGameEnd(reason, attempt)) {
          onDone(false);
          return;
        }
        Timers.CreateTimer(RETRY_DELAY_SECONDS, () => {
          GameEndProxy.sendOne(target, request, attempt + 1, onDone);
        });
      },
    );
  }

  private static isRecorded(data: string): boolean {
    try {
      return (json.decode(data)[0] as { recorded?: boolean }).recorded === true;
    } catch {
      return false;
    }
  }
}
