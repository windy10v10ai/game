/**
 * 启动器开出的专用服，结算经网页控件中转失败的玩家改为写日志，由同机的启动器读取后上传。
 * 行格式与分段规则写在 README.md「备用方案：启动器日志结算」，启动器按它解析，改动要两边同步。
 */
import type { GameEndPlayerRequest } from './game-end-proxy';
import { base64UrlEncode } from '../utils/base64url';

const LOG_PREFIX = '[WSettle] v1';
const LOG_DONE_PREFIX = '[WSettle] done v1';
// 低于日志单行的已知上限，留出余量
export const SETTLE_LOG_CHUNK_SIZE = 3000;

/** 只有启动器开出的专用服有同机的启动器读日志，游廊局失败不兜底 */
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

/** 逐个失败的玩家写日志，末尾写一条汇总行，返回写出的人数 */
export function printSettleLog(requests: GameEndPlayerRequest[]): number {
  if (requests.length === 0) return 0;
  const matchKey = requests[0].customMatchId || requests[0].matchId;
  for (const request of requests) {
    const lines = buildSettleLogLines(matchKey, request.players[0].steamId, json.encode(request));
    for (const line of lines) print(line);
  }
  // 份数是这次写出的人数，启动器靠它区分全员与部分
  print(`${LOG_DONE_PREFIX} ${matchKey} ${requests.length}`);
  return requests.length;
}
