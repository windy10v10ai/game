/**
 * 启动器开出的专用服发不出 HTTP，只读请求改由同机的启动器代发：游戏写一行请求日志，
 * 启动器调后端后把响应写进 addon 目录里的 KV 文件，游戏轮询读取。
 * 行格式与文件格式写在 README.md「启动器代发读请求」，启动器按它实现，改动要两边同步。
 */
import { base64UrlDecode } from '../utils/base64url';

const REQUEST_PREFIX = '[WReq] v1';
export const RELAY_FILE = 'scripts/kv/launcher_relay.kv';
const POLL_INTERVAL_SECONDS = 0.5;
// 启动器代发有自己的重试与换线，留出余量再判它没响应
const GRACE_SECONDS = 4;
const NO_RESPONSE_STATUS = 408;

type RelayCallback = (result: CScriptHTTPResponse) => void;

interface PendingRequest {
  callback: RelayCallback;
  deadline: number;
}

interface RelayEntry {
  status?: number | string;
  body?: number | string;
}

// 文件里会累积响应正文，探测成功后不再重读
let relayAvailable = false;

/** 启动器开出的专用服才有代发，启动器没在本局写出 KV 文件（旧版启动器、自建服）视为不可用 */
export function UsesLauncherRelay(): boolean {
  if (relayAvailable) return true;
  if (!IsDedicatedServer()) return false;
  const kv = LoadKeyValues(RELAY_FILE) as Record<string, unknown> | undefined;
  relayAvailable = kv !== undefined && kv.launcher !== undefined;
  return relayAvailable;
}

/** 响应表里已到的请求逐个交付，返回仍在等待的请求号 */
export function resolveRelayResponses(
  entries: Record<string, RelayEntry>,
  pending: Map<number, PendingRequest>,
): void {
  for (const [id, request] of pending) {
    const entry = entries[String(id)];
    if (!entry) continue;
    pending.delete(id);
    const body = base64UrlDecode(String(entry.body ?? ''));
    if (body === undefined) {
      request.callback({ StatusCode: 0, Body: '' } as CScriptHTTPResponse);
      continue;
    }
    request.callback({ StatusCode: Number(entry.status), Body: body } as CScriptHTTPResponse);
  }
}

export class LauncherRelay {
  private static nextId = 1;
  private static pending = new Map<number, PendingRequest>();
  private static polling = false;

  /** 只代发 GET；成功与否都经回调交回，与直连的 CScriptHTTPResponse 同构 */
  public static Get(fullPath: string, timeoutSeconds: number, callback: RelayCallback) {
    const id = LauncherRelay.nextId++;
    LauncherRelay.pending.set(id, {
      callback,
      deadline: Time() + timeoutSeconds + GRACE_SECONDS,
    });
    print(`${REQUEST_PREFIX} ${id} ${timeoutSeconds} ${fullPath}`);
    LauncherRelay.StartPolling();
  }

  private static StartPolling() {
    if (LauncherRelay.polling) return;
    LauncherRelay.polling = true;
    // 启动器的响应按真实时间到达，游戏暂停或还没开始计时都不能停掉轮询
    Timers.CreateTimer({
      endTime: POLL_INTERVAL_SECONDS,
      useGameTime: false,
      callback: () => {
        LauncherRelay.Poll();
        if (LauncherRelay.pending.size > 0) return POLL_INTERVAL_SECONDS;
        LauncherRelay.polling = false;
        return undefined;
      },
    });
  }

  private static Poll() {
    const kv = LoadKeyValues(RELAY_FILE) as Record<string, RelayEntry> | undefined;
    if (kv) resolveRelayResponses(kv, LauncherRelay.pending);

    const now = Time();
    for (const [id, request] of LauncherRelay.pending) {
      if (now < request.deadline) continue;
      LauncherRelay.pending.delete(id);
      print(`[LauncherRelay] request ${id} got no response`);
      request.callback({ StatusCode: NO_RESPONSE_STATUS, Body: '' } as CScriptHTTPResponse);
    }
  }
}
