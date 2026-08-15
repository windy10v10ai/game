export class EnvironmentHelper {
  /** 判断当前是否为无效游戏环境（作弊模式或本地主机） */
  static IsInvalidGameEnvironment(isLocalhost: boolean): boolean {
    // 工具模式下始终视为有效环境，方便开发调试
    if (IsInToolsMode()) {
      return false;
    }
    return GameRules.IsCheatMode() || isLocalhost;
  }
}
