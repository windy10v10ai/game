/** 启动器联机开房：识别这类专用服，并在选队阶段把房间人数与正在连接的玩家同步给选队界面 */

// 与启动器联机开房时给专用服设的服务器名一致
const LAUNCHER_ROOM_HOSTNAME = 'windy10v10ai-room';
// 专用服与主机的启动器跑在同一台电脑上，端口与启动器约定
const LAUNCHER_ROOM_URL = 'http://127.0.0.1:27080/room';
const POLL_SECONDS = 2;

interface LauncherRoomResponse {
  entering?: string[];
  inGame?: number;
  maxPlayers?: number;
}

export function IsLauncherRoom(): boolean {
  return IsDedicatedServer() && Convars.GetStr('hostname') === LAUNCHER_ROOM_HOSTNAME;
}

export function WatchLauncherRoom(): void {
  if (!IsLauncherRoom()) return;
  let failed = false;
  Timers.CreateTimer(0, () => {
    if (GameRules.State_Get() > GameState.CUSTOM_GAME_SETUP) return undefined;
    CreateHTTPRequestScriptVM('GET', LAUNCHER_ROOM_URL).Send((result) => {
      if (result.StatusCode !== 200) {
        // 读不到名单时选队界面不显示这一条，只记一次日志供排查
        if (!failed) print(`[LauncherRoom] roster unavailable: ${result.StatusCode}`);
        failed = true;
        return;
      }
      let room: LauncherRoomResponse;
      try {
        room = json.decode(result.Body)[0] as LauncherRoomResponse;
      } catch {
        return;
      }
      CustomNetTables.SetTableValue('launcher_room', 'launcher_room', {
        entering: room.entering ?? [],
        inGame: room.inGame ?? 0,
        maxPlayers: room.maxPlayers ?? 0,
      });
    });
    return POLL_SECONDS;
  });
}
