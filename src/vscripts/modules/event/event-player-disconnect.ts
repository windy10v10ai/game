import { reloadable } from '../../utils/tstl-utils';
import { GameEndPoint } from './game-end/game-end-point';

/** 记录真人掉线时刻，结算时据此区分重连中与逃跑 */
@reloadable
export class EventPlayerDisconnect {
  private static disconnectedAt = new Map<PlayerID, number>();
  private static simulated = new Set<PlayerID>();

  constructor() {
    ListenToGameEvent(
      'player_disconnect',
      (keys) => EventPlayerDisconnect.disconnectedAt.set(keys.PlayerID, GameRules.GetGameTime()),
      undefined,
    );
    ListenToGameEvent(
      'player_reconnected',
      (keys) => EventPlayerDisconnect.disconnectedAt.delete(keys.PlayerID),
      undefined,
    );
  }

  static IsEscaped(playerId: PlayerID): boolean {
    const state = this.simulated.has(playerId)
      ? ConnectionState.DISCONNECTED
      : PlayerResource.GetConnectionState(playerId);
    const at = this.disconnectedAt.get(playerId);
    return GameEndPoint.IsEscaped(
      state,
      at === undefined ? undefined : GameRules.GetGameTime() - at,
    );
  }

  /** 调试用：把玩家当作已掉线指定秒数，负数恢复在线 */
  static Simulate(playerId: PlayerID, seconds: number): void {
    if (seconds < 0) {
      this.simulated.delete(playerId);
      this.disconnectedAt.delete(playerId);
      return;
    }
    this.simulated.add(playerId);
    this.disconnectedAt.set(playerId, GameRules.GetGameTime() - seconds);
  }
}
