/**
 * 启动器开出的专用服发不出 HTTP，结算改为逐人写日志，由同机的启动器读取后代发。
 * 行格式与分段规则写在 README.md「启动器日志结算」，启动器按它解析，改动要两边同步。
 */
import { GameEndDto } from './analytics/dto/game-end-dto';
import { splitGameEndByPlayer } from './game-end-proxy';
import { base64UrlEncode } from '../utils/base64url';

const LOG_PREFIX = '[WSettle] v1';
// 低于日志单行的已知上限，留出余量
export const SETTLE_LOG_CHUNK_SIZE = 3000;

/** 启动器开出的专用服用日志结算，其余启动方式不变 */
export function UsesLauncherSettleLog(): boolean {
  return IsDedicatedServer();
}

/** 把一名玩家的请求体切成若干行，同一玩家的各行连续输出 */
export function buildSettleLogLines(
  matchKey: string,
  steamId: number,
  requestJson: string,
): string[] {
  const encoded = base64UrlEncode(requestJson);
  const total = Math.max(1, Math.ceil(encoded.length / SETTLE_LOG_CHUNK_SIZE));
  const lines: string[] = [];
  for (let index = 0; index < total; index++) {
    const chunk = encoded.substring(
      index * SETTLE_LOG_CHUNK_SIZE,
      (index + 1) * SETTLE_LOG_CHUNK_SIZE,
    );
    lines.push(`${LOG_PREFIX} ${matchKey} ${steamId} ${index + 1}/${total} ${chunk}`);
  }
  return lines;
}

/** 逐个真人玩家写日志，返回写出的人数 */
export function printSettleLog(gameEnd: GameEndDto): number {
  const matchKey = gameEnd.customMatchId || gameEnd.matchId;
  const requests = splitGameEndByPlayer(gameEnd);
  for (const request of requests) {
    const lines = buildSettleLogLines(matchKey, request.players[0].steamId, json.encode(request));
    for (const line of lines) print(line);
  }
  return requests.length;
}
