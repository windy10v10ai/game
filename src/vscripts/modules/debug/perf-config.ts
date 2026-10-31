import type { PerfAutoConfig } from './perf-auto';

// 与 `src/scripts/perf.js` 启动专用服时设置的服务器名一致
const PERF_HOSTNAME = 'windy10v10ai-perf-auto';

// 由 `npm run perf` 在编译产物目录临时写入，平时不存在。
// 专用服只认测试脚本在启动参数里设的服务器名：配置文件万一随发布版带出去，游廊与玩家自建服也不会进入自动测试
function loadConfig(): PerfAutoConfig | undefined {
  const perfServer = IsDedicatedServer() && Convars.GetStr('hostname') === PERF_HOSTNAME;
  if (!IsInToolsMode() && !perfServer) return undefined;
  const requireFn = (_G as unknown as { require: (this: void, name: string) => unknown }).require;
  const [ok, result] = pcall(requireFn, 'perf_auto_config');
  return ok ? (result as PerfAutoConfig) : undefined;
}

export const PERF_CONFIG = loadConfig();

/** 开发调试或自动性能测试中：打开调试日志、采样与快速开局。 */
export const IS_DEBUG_RUN = IsInToolsMode() || PERF_CONFIG !== undefined;
