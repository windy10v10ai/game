import { CMD } from './debug-cmd';
import { clearUnits, PerfAuto, spawnUnits } from './perf-auto';
import { PerfProfiler } from './perf-profiler';
import { PerfSampler } from './perf-sampler';

let profiling = false;

// 线上白名单也能开调试，性能命令会改动整局状态，只在工具模式放行
export function handlePerfDebugCommand(cmd: string, args: string[]) {
  if (!IsInToolsMode()) return;
  if (cmd === CMD.PERF) {
    if (PerfSampler.enabled) PerfSampler.stop();
    else PerfSampler.start();
  }
  if (cmd === CMD.PERF_MARK) {
    PerfSampler.setPhase(args[0] ?? 'manual');
  }
  if (cmd === CMD.PERF_PROF) {
    if (profiling) PerfProfiler.stop(PerfSampler.phase);
    else PerfProfiler.start();
    profiling = !profiling;
  }
  if (cmd === CMD.PERF_AUTO) {
    PerfAuto.run({
      phaseSeconds: Number(args[0] ?? 60),
      reps: Number(args[1] ?? 2),
      measureTimescale: Number(args[2] ?? 1),
      quitOnDone: false,
    });
  }
  if (cmd === CMD.AI_ON) {
    PerfSampler.aiThinkDisabled = false;
    print(`[perf] ai=on`);
  }
  if (cmd === CMD.AI_OFF) {
    PerfSampler.aiThinkDisabled = true;
    print(`[perf] ai=off`);
  }
  if (cmd === CMD.CLEAR_UNITS) {
    clearUnits();
  }
  if (cmd === CMD.SPAWN_UNITS) {
    spawnUnits(Number(args[0] ?? 100));
  }
}
