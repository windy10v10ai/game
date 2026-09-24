interface LuaDebug {
  sethook(this: void, hook?: (this: void) => void, mask?: string, count?: number): void;
  getinfo(
    this: void,
    level: number,
    what: string,
  ): { source: string; linedefined: number } | undefined;
}

// 每 1000 条指令采样一次，开销在几个百分点内，精度足够排出前几名
const HOOK_COUNT = 1000;
// 两次采样间隔超过这个值，说明中间跨过了引擎自己的帧处理，不能算到 Lua 头上
const MAX_SLICE = 0.01;
const TOP_FUNCTIONS = 40;

// 路径相对 vscripts 目录，按顺序取第一条命中的前缀，顺序决定归属
const CATEGORY_RULES: [string, string][] = [
  // 采样器自身的开销单独成类，不混进业务代码
  ['modules/debug/perf-', 'perf'],
  ['ai/', 'ai'],
  ['modifiers/property/', 'property'],
  ['modules/property/', 'property'],
  ['items/', 'items'],
  ['modifiers/global/', 'global-modifiers'],
  ['modifiers/', 'modifiers'],
  ['abilities/', 'abilities'],
  ['lua_abilities/', 'abilities'],
  ['heroes/', 'abilities'],
  ['modules/filter/', 'filters'],
  ['timers', 'timers'],
  ['lualib_bundle', 'lualib'],
];

// short_src 超过 60 字符会被截成省略号，只能从完整路径里截掉 vscripts 之前的部分
function shortPath(source: string): string {
  const path = source.split('\\').join('/');
  const at = path.indexOf('vscripts/');
  return at >= 0 ? path.substring(at + 'vscripts/'.length) : path;
}

function categoryOf(file: string): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (file.startsWith(pattern)) return category;
  }
  return 'other';
}

/**
 * 用 Lua 调试钩子做采样式耗时归因，按分类、文件、函数三层输出到控制台。
 */
export class PerfProfiler {
  private static running = false;
  private static startReal = 0;
  private static lastSample = 0;
  private static costs = new Map<string, number>();

  static available(): boolean {
    const dbg = (_G as unknown as { debug?: LuaDebug }).debug;
    return dbg?.sethook !== undefined && dbg.getinfo !== undefined;
  }

  static start() {
    if (this.running || !this.available()) {
      print(`[perf-prof] unavailable=${!this.available()}`);
      return;
    }
    const dbg = (_G as unknown as { debug: LuaDebug }).debug;
    this.running = true;
    this.costs = new Map();
    this.startReal = Plat_FloatTime();
    this.lastSample = this.startReal;
    dbg.sethook(
      () => {
        const now = Plat_FloatTime();
        const slice = now - this.lastSample;
        this.lastSample = now;
        if (slice > MAX_SLICE) return;
        const info = dbg.getinfo(2, 'S');
        if (!info) return;
        const key = `${shortPath(info.source)}:${info.linedefined}`;
        this.costs.set(key, (this.costs.get(key) ?? 0) + slice);
      },
      '',
      HOOK_COUNT,
    );
  }

  static stop(label: string) {
    if (!this.running) return;
    (_G as unknown as { debug: LuaDebug }).debug.sethook();
    this.running = false;
    const realDt = Plat_FloatTime() - this.startReal;
    const toMs = (seconds: number) => string.format('%.3f', (seconds * 1000) / realDt);

    const files = new Map<string, number>();
    const categories = new Map<string, number>();
    const functions: [string, number][] = [];
    for (const [key, cost] of this.costs) {
      const file = key.split(':')[0];
      files.set(file, (files.get(file) ?? 0) + cost);
      const category = categoryOf(file);
      categories.set(category, (categories.get(category) ?? 0) + cost);
      functions.push([key, cost]);
    }
    const sorted = (entries: Iterable<[string, number]>) =>
      [...entries].sort((a, b) => b[1] - a[1]);

    print(`[perf-prof] begin phase=${label} seconds=${Math.floor(realDt)}`);
    for (const [name, cost] of sorted(categories)) {
      print(`[perf-prof] phase=${label} level=category name=${name} ms=${toMs(cost)}`);
    }
    for (const [name, cost] of sorted(files).slice(0, TOP_FUNCTIONS)) {
      print(`[perf-prof] phase=${label} level=file name=${name} ms=${toMs(cost)}`);
    }
    for (const [name, cost] of sorted(functions).slice(0, TOP_FUNCTIONS)) {
      print(`[perf-prof] phase=${label} level=function name=${name} ms=${toMs(cost)}`);
    }
    print(`[perf-prof] end phase=${label}`);
  }
}
