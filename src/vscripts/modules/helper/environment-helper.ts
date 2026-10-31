export class EnvironmentHelper {
  /** 判断当前是否为无效游戏环境 */
  static IsInvalidGameEnvironment(): boolean {
    return !IsInToolsMode() && GameRules.IsCheatMode();
  }
}
