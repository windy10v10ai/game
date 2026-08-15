export class EnvironmentHelper {
  /** 判断当前是否为有效游戏环境（排除作弊模式与本地主机） */
  static IsValidGameEnvironment(isLocalhost: boolean): boolean {
    // 工具模式下始终视为有效环境，方便开发调试
    if (IsInToolsMode()) {
      return true;
    }
    return !GameRules.IsCheatMode() && !isLocalhost;
  }
}
