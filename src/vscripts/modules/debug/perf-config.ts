import type { PerfAutoConfig } from './perf-auto';

// 由 `npm run perf` 在编译产物目录临时写入，平时不存在，正常开发不会进入自动测试。
// 本机专用服不是工具模式，靠测试脚本开的作弊区分；游廊对局不开作弊，误带上配置文件也不会生效
function loadConfig(): PerfAutoConfig | undefined {
  if (!IsInToolsMode() && !(IsDedicatedServer() && GameRules.IsCheatMode())) return undefined;
  const requireFn = (_G as unknown as { require: (this: void, name: string) => unknown }).require;
  const [ok, result] = pcall(requireFn, 'perf_auto_config');
  return ok ? (result as PerfAutoConfig) : undefined;
}

export const PERF_CONFIG = loadConfig();

/** 开发调试或自动性能测试中：打开调试日志、采样与快速开局。 */
export const IS_DEBUG_RUN = IsInToolsMode() || PERF_CONFIG !== undefined;
