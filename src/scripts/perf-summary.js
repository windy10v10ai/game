const fs = require('fs');
const path = require('path');

const VSCRIPTS_DIR = path.resolve(__dirname, '..', '..', 'game', 'scripts', 'vscripts');

function parseFields(line) {
  const fields = {};
  for (const token of line.split(/\s+/)) {
    const eq = token.indexOf('=');
    if (eq > 0) fields[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return fields;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const fmt = (x, digits = 1) => (Number.isFinite(x) ? x.toFixed(digits) : '-');
const pct = (x) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(1)}%` : '-');
const baseName = (name) => name.split('#')[0];
// 客户端每 10 秒报一次，明显超过说明界面脚本中途停过
const CLIENT_WINDOW_MAX_SECONDS = 15;

function parseRun(text) {
  const lines = text.split(/\r?\n/);
  const windows = {};
  const steps = {};
  const prof = {};
  const frames = {};
  let clientStalls = 0;
  let phase = 'before';
  for (const line of lines) {
    const at = line.indexOf('[perf');
    if (at < 0) continue;
    const body = line.slice(at);
    const f = parseFields(body);
    if (body.startsWith('[perf] ') && f.phase && !f.tick) {
      phase = f.phase;
    } else if (body.startsWith('[perf-client] ')) {
      // 显示器休眠、窗口最小化时界面脚本停止运行，窗口会被拉长到几分钟，这种数据不代表帧率
      if (
        Number(f.sec) > CLIENT_WINDOW_MAX_SECONDS ||
        Number(f.maxFrame) > CLIENT_WINDOW_MAX_SECONDS * 1000
      ) {
        clientStalls++;
        continue;
      }
      // 客户端不知道实验段，按日志先后归到最近一次切换的段
      (frames[phase] ??= []).push(f);
    } else if (body.startsWith('[perf] ') && f.tick) {
      (windows[f.phase] ??= []).push(f);
    } else if (body.startsWith('[perf-auto] step')) {
      steps[f.name] = { ref: f.ref, timescale: Number(f.timescale) };
    } else if (body.startsWith('[perf-prof] ') && f.level) {
      ((prof[f.phase] ??= {})[f.level] ??= []).push({ name: f.name, ms: Number(f.ms) });
    }
  }
  return { lines, windows, steps, prof, frames, clientStalls };
}

function statOf(windows, frames = {}) {
  return (phase) => {
    const ws = windows[phase] ?? [];
    const num = (k) => ws.map((w) => Number(w[k]));
    const fs = frames[phase] ?? [];
    const frameNum = (k) => fs.map((w) => Number(w[k]));
    const tick = mean(num('tick'));
    const seconds = ws.length * 10;
    return {
      fps: mean(frameNum('fps')),
      frameMs: mean(frameNum('frameMs')),
      maxFrame: fs.length ? Math.max(...frameNum('maxFrame')) : NaN,
      n: ws.length,
      gameTime: ws.length ? ws[0].t : '-',
      tick,
      // 服务器跑满时每 tick 真实耗时；未跑满时包含等待，只能说明「不卡」
      msPerTick: 1000 / tick,
      speed: mean(num('speed')),
      maxGap: Math.max(...num('maxGap')),
      hitchPerMin: seconds ? (num('hitch').reduce((a, b) => a + b, 0) * 60) / seconds : NaN,
      aiMsPerTick: mean(num('ai')) / tick,
      units: mean(num('units')),
      creeps: mean(num('creeps')),
      mods: mean(num('mods')),
      mem: mean(num('mem')),
    };
  };
}

// 同名多次重复（多局、多轮）合并成一组，逐次与各自对照组比，避免各次之间的整体漂移混进差值
function conditionGroups(steps, stat) {
  const groups = {};
  for (const [name, meta] of Object.entries(steps)) {
    (groups[baseName(name)] ??= []).push({ name, ...meta });
  }
  return Object.entries(groups).map(([group, runs]) => {
    const deltasOf = (key) =>
      runs
        .map((r) => {
          if (r.ref === r.name) return NaN;
          // 对照可以是前后两段基线，取均值抵消同一局里的累积漂移
          const ref = mean(r.ref.split(',').map((name) => stat(name)[key]));
          return ((stat(r.name)[key] - ref) / ref) * 100;
        })
        .filter(Number.isFinite);
    const tickDeltas = deltasOf('msPerTick');
    const frameDeltas = deltasOf('frameMs');
    // 帧时间是玩家直接感受到的，有客户端数据时以它判断稳定与否
    const deltas = frameDeltas.length ? frameDeltas : tickDeltas;
    return { group, runs, tickDeltas, frameDeltas, deltas };
  });
}

function deltaText(deltas, spreadLimit) {
  if (!deltas.length) return '-';
  const each = deltas.length > 1 ? `（${deltas.map(pct).join(' / ')}）` : '';
  return `${isUnstable(deltas, spreadLimit) ? '不稳定 ' : ''}${pct(mean(deltas))}${each}`;
}

// 各次变化方向不一致或极差超过阈值（百分点），说明波动盖过了条件本身的效果
function isUnstable(deltas, spreadLimit) {
  if (deltas.length < 2) return false;
  const sameSign = deltas.every((d) => d >= 0) || deltas.every((d) => d <= 0);
  return !sameSign || Math.max(...deltas) - Math.min(...deltas) > spreadLimit;
}

/** 返回各次结果还不一致的条件名，多局测试据此决定是否加局。 */
function unstableConditions(text, spreadLimit) {
  const { windows, steps, frames } = parseRun(text);
  return conditionGroups(steps, statOf(windows, frames))
    .filter(({ deltas }) => isUnstable(deltas, spreadLimit))
    .map(({ group }) => group);
}

function summarize(text, { spreadLimit = 10 } = {}) {
  const { lines, windows, steps, prof, frames, clientStalls } = parseRun(text);
  const stat = statOf(windows, frames);

  const out = [];
  out.push('# 性能自动测试汇总', '');
  out.push(...summarizeKeyMetrics(steps, stat));
  if (clientStalls) {
    out.push(
      `**注意**：客户端帧日志中断 ${clientStalls} 次（界面脚本停止运行，常见于显示器休眠、窗口最小化），这些窗口已丢弃，相关段的画面指标可能缺失。`,
      '',
    );
  }

  const early = stat('early');
  if (early.n) {
    out.push(
      `测量自检（开局 1 倍速）：tick ${fmt(early.tick)}，maxGap ${early.maxGap}ms，单位 ${fmt(early.units, 0)}。tick 接近 30 说明测量本身可靠。`,
      '',
    );
  }

  out.push('## 第一层：条件对照', '');
  out.push(
    '| 条件 | 对照 | 倍率 | 次数 | 帧时间变化 | tick 耗时变化 | 画面 FPS | 帧 ms | 最长帧 ms | tick/s | ms/tick | 速度比 | maxGap ms | 尖峰/分 | AI ms/tick | 单位 | modifier |',
  );
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const { group, runs, tickDeltas, frameDeltas } of conditionGroups(steps, stat)) {
    const stats = runs.map((r) => stat(r.name));
    const isRef = runs.every((r) => r.ref === r.name);
    const m = (k) => mean(stats.map((s) => s[k]));
    // tick 率达不到倍率要求才说明服务器跑满，ms/tick 才是处理耗时；没跑满时 ms/tick 被封顶在 33ms 附近
    const saturated = m('tick') < 30 * runs[0].timescale * 0.97;
    out.push(
      `| ${group} | ${runs[0].ref.includes(',') ? '前后基线' : baseName(runs[0].ref)} | ${runs[0].timescale}${saturated ? '' : '（未跑满）'} | ${runs.length} | ${isRef ? '对照组' : deltaText(frameDeltas, spreadLimit)} | ${isRef ? '对照组' : deltaText(tickDeltas, spreadLimit)} | ${fmt(m('fps'))} | ${fmt(m('frameMs'))} | ${fmt(Math.max(...stats.map((s) => s.maxFrame)), 0)} | ${fmt(m('tick'))} | ${fmt(m('msPerTick'), 2)} | ${fmt(m('speed'), 2)} | ${fmt(Math.max(...stats.map((s) => s.maxGap)), 0)} | ${fmt(m('hitchPerMin'))} | ${fmt(m('aiMsPerTick'), 2)} | ${fmt(m('units'), 0)} | ${fmt(m('mods'), 0)} |`,
    );
  }
  out.push(
    '',
    `「帧时间变化」是画面平均帧时间相对对照组的变化，玩家直接感受到的就是它，排名以它为准；「tick 耗时变化」是服务器每 tick 耗时的变化。负数表示关掉该条件后省下的时间，括号里是逐次的值。服务器没跑满（tick 已到 30）时 tick 耗时被封顶，差值偏小。标「不稳定」的条件各次方向不一致或相差超过 ${spreadLimit} 个百分点，不作结论。`,
    '',
  );

  const profPhases = Object.keys(prof);
  if (profPhases.length) {
    const merged = {};
    for (const phase of profPhases) {
      const tick = stat(phase).tick;
      for (const [level, rows] of Object.entries(prof[phase])) {
        for (const row of rows) {
          const key = `${level}\u0000${row.name}`;
          (merged[key] ??= []).push(row.ms / tick);
        }
      }
    }
    const byLevel = (level) =>
      Object.entries(merged)
        .filter(([k]) => k.startsWith(`${level}\u0000`))
        .map(([k, v]) => ({ name: k.split('\u0000')[1], ms: mean(v) }))
        .sort((a, b) => b.ms - a.ms);
    const profTick = mean(profPhases.map((p) => stat(p).msPerTick));
    const categories = byLevel('category');
    // perf 是采样器自身的开销，不算进业务 Lua 的总量
    const luaTotal = categories.filter((c) => c.name !== 'perf').reduce((a, b) => a + b.ms, 0);

    out.push('## Lua 耗时归因', '');
    out.push(
      `采样阶段每 tick 共 ${fmt(profTick, 2)}ms，其中业务 Lua（不含采样器自身）${fmt(luaTotal, 2)}ms（${fmt((luaTotal / profTick) * 100)}%）。采样本身有少量开销，占比比绝对值更可信。`,
      '',
    );
    const table = (title, rows, limit) => {
      out.push(`### ${title}`, '', '| 名称 | ms/tick | 占 Lua |', '|---|---|---|');
      for (const r of rows.slice(0, limit)) {
        out.push(`| \`${r.name}\` | ${fmt(r.ms, 3)} | ${fmt((r.ms / luaTotal) * 100)}% |`);
      }
      out.push('');
    };
    table('第一层：分类', categories, 20);
    table('第二层：文件', byLevel('file'), 25);
    table('第三层：函数', byLevel('function'), 25);
    out.push(...summarizeRoots(byLevel('root'), luaTotal));
  }

  out.push(...summarizeSoak(windows.soak ?? []));
  const realtime = stat('realtime');
  if (realtime.n && !steps.realtime) {
    out.push(
      `浸泡终点 1 倍速：tick ${fmt(realtime.tick)}（${fmt(realtime.msPerTick, 2)}ms/tick），速度比 ${fmt(realtime.speed, 2)}，maxGap ${fmt(realtime.maxGap, 0)}ms，画面 FPS ${fmt(realtime.fps)}，帧 ${fmt(realtime.frameMs)}ms，最长帧 ${fmt(realtime.maxFrame, 0)}ms。`,
      '',
    );
  }
  out.push(...summarizeWarnings(lines));
  return out.join('\n');
}

// 只有 1 倍速段反映玩家真实感受，放在报告最前面
function summarizeKeyMetrics(steps, stat) {
  const groups = {};
  for (const [name, meta] of Object.entries(steps)) {
    if (meta.timescale === 1) (groups[baseName(name)] ??= []).push(name);
  }
  if (!steps.realtime && stat('realtime').n) groups.realtime = ['realtime'];
  if (!Object.keys(groups).length) return [];
  const out = [
    '## 关键指标（1 倍速）',
    '',
    '| 段 | 次数 | 画面 FPS | 平均帧 ms | 最长帧 ms | 服务器 tick/s | 速度比 | 游戏时间 |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const [group, names] of Object.entries(groups)) {
    const stats = names.map(stat);
    const m = (k) => mean(stats.map((s) => s[k]));
    out.push(
      `| ${group} | ${names.length} | ${fmt(m('fps'))} | ${fmt(m('frameMs'))} | ${fmt(Math.max(...stats.map((s) => s.maxFrame)), 0)} | ${fmt(m('tick'))} | ${fmt(m('speed'), 2)} | ${stats.map((s) => s.gameTime).join(' / ')} |`,
    );
  }
  out.push('', '正常值：tick 30、速度比 1.0、最长帧 < 100ms；画面 FPS 越高越好。', '');
  return out;
}

const sourceLines = {};

// 定义行形如 `function A.prototype.B(self)`、`function A:B()`、`x.B = function(`，取最后一段作函数名
function functionNameAt(file, line) {
  if (!(file in sourceLines)) {
    const full = path.join(VSCRIPTS_DIR, file);
    sourceLines[file] = fs.existsSync(full) ? fs.readFileSync(full, 'utf8').split(/\r?\n/) : [];
  }
  const text = sourceLines[file][line - 1];
  if (!text) return '?';
  const match = text.match(/function\s+([\w.:]+)\s*\(/) ?? text.match(/([\w.:]+)\s*=\s*function\b/);
  return match ? match[1].split(/[.:]/).pop() : '(匿名)';
}

// 入口类型决定优化手段：属性回调只能降单次成本，定时思考和计时器还能降频
function entryKind(file, name) {
  if (file.startsWith('timers')) return '计时器';
  if (name.startsWith('GetModifier')) return '属性回调';
  if (name === 'OnIntervalThink') return '定时思考';
  if (/^On[A-Z]/.test(name)) return '事件';
  return '其他';
}

// 按引擎调进 Lua 的入口归账：同一个函数被不同路径调用时，能分清钱花在哪条路径上
function summarizeRoots(rows, luaTotal) {
  if (!rows.length) return [];
  const entries = rows.map((r) => {
    const [file, line] = r.name.split(':');
    const fn = functionNameAt(file, Number(line));
    return { ...r, fn, kind: entryKind(file, fn) };
  });
  const kinds = {};
  for (const e of entries) kinds[e.kind] = (kinds[e.kind] ?? 0) + e.ms;
  const share = (ms) => `${fmt((ms / luaTotal) * 100)}%`;
  const out = ['### 入口：按类型', '', '| 类型 | ms/tick | 占 Lua |', '|---|---|---|'];
  for (const [kind, ms] of Object.entries(kinds).sort((a, b) => b[1] - a[1])) {
    out.push(`| ${kind} | ${fmt(ms, 3)} | ${share(ms)} |`);
  }
  out.push(
    '',
    '只统计排进前几十名的入口，合计略低于业务 Lua 总量。',
    '',
    '### 入口：按函数',
    '',
    '| 入口 | 函数 | 类型 | ms/tick | 占 Lua |',
    '|---|---|---|---|---|',
  );
  for (const e of entries.slice(0, 25)) {
    out.push(`| \`${e.name}\` | \`${e.fn}\` | ${e.kind} | ${fmt(e.ms, 3)} | ${share(e.ms)} |`);
  }
  out.push('');
  return out;
}

// 浸泡测试按游戏时间分桶：每 tick 耗时和只增不减的数量一起看，区分「单位本来就多」和「东西越积越多」
function summarizeSoak(rows) {
  if (!rows.length) return [];
  const BUCKET_MINUTES = 5;
  const buckets = {};
  for (const row of rows) {
    const [minutes] = row.t.split(':').map(Number);
    const bucket = Math.floor(minutes / BUCKET_MINUTES) * BUCKET_MINUTES;
    (buckets[bucket] ??= []).push(row);
  }
  const out = ['## 浸泡测试：随游戏时间的变化', ''];
  out.push(
    '| 游戏分钟 | ms/tick | 速度比 | maxGap ms | 单位 | modifier | 实体 | thinker | 计时器 | Lua MB |',
    '|---|---|---|---|---|---|---|---|---|---|',
  );
  for (const [bucket, ws] of Object.entries(buckets).sort((a, b) => a[0] - b[0])) {
    const m = (k) => mean(ws.map((w) => Number(w[k])));
    out.push(
      `| ${bucket}–${Number(bucket) + BUCKET_MINUTES} | ${fmt(1000 / m('tick'), 2)} | ${fmt(m('speed'), 2)} | ${fmt(Math.max(...ws.map((w) => Number(w.maxGap))), 0)} | ${fmt(m('units'), 0)} | ${fmt(m('mods'), 0)} | ${fmt(m('ents'), 0)} | ${fmt(m('thinkers'), 0)} | ${fmt(m('timers'), 0)} | ${fmt(m('mem'), 1)} |`,
    );
  }
  out.push('', '加速倍率下服务器跑满时 ms/tick 才是真实处理耗时；早期跑不满时它包含等待时间。', '');
  return out;
}

// 报错和慢思考按所在实验段计数：用来判断它们是否只在高负载段出现，也作为耗时归因的补充
function summarizeWarnings(lines) {
  const byPhase = {};
  const errors = {};
  const unknownModifiers = {};
  const thinkers = {};
  let phase = 'before';
  const bump = (phaseKey, field, value = 1) => {
    const row = (byPhase[phaseKey] ??= { errors: 0, unknown: 0, slow: 0, slowMs: 0 });
    row[field] += value;
  };
  for (const line of lines) {
    const phaseMatch = line.match(/\[perf\] phase=(\S+)$/);
    if (phaseMatch) {
      phase = phaseMatch[1];
      continue;
    }
    const error = line.match(/Script Runtime Error: \.*(.*?:\d+):/);
    if (error) {
      const key = error[1].replace(/^.*vscripts[\\/]/, '').replace(/\\/g, '/');
      errors[key] = (errors[key] ?? 0) + 1;
      bump(phase, 'errors');
      continue;
    }
    const unknown = line.match(/unknown modifier type (\S+?)!?$/);
    if (unknown) {
      unknownModifiers[unknown[1]] = (unknownModifiers[unknown[1]] ?? 0) + 1;
      bump(phase, 'unknown');
      continue;
    }
    const slow = line.match(/SERVER: (\S+?)\(.*thinking for ([\d.]+) ms/);
    if (slow) {
      const ms = Number(slow[2]);
      const row = (thinkers[slow[1]] ??= { count: 0, total: 0, max: 0 });
      row.count++;
      row.total += ms;
      row.max = Math.max(row.max, ms);
      bump(phase, 'slow');
      bump(phase, 'slowMs', ms);
    }
  }

  const out = [];
  if (!Object.keys(byPhase).length) return out;
  out.push('## 报错与引擎慢思考（按实验段）', '');
  out.push(
    '| 实验段 | Lua 报错 | 未登记 modifier | 慢思考次数 | 慢思考总 ms |',
    '|---|---|---|---|---|',
  );
  for (const [name, row] of Object.entries(byPhase)) {
    out.push(`| ${name} | ${row.errors} | ${row.unknown} | ${row.slow} | ${fmt(row.slowMs, 0)} |`);
  }
  out.push('');
  const top = (map, limit) =>
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  if (Object.keys(errors).length) {
    out.push('### Lua 报错位置', '', '| 位置 | 次数 |', '|---|---|');
    for (const [key, count] of top(errors, 15)) out.push(`| \`${key}\` | ${count} |`);
    out.push('');
  }
  if (Object.keys(unknownModifiers).length) {
    out.push('### 未登记的 modifier', '', '| modifier | 次数 |', '|---|---|');
    for (const [key, count] of top(unknownModifiers, 15)) out.push(`| \`${key}\` | ${count} |`);
    out.push('');
  }
  if (Object.keys(thinkers).length) {
    out.push(
      '### 引擎慢思考（按单位）',
      '',
      '引擎对单次思考超时的单位打出的警告，覆盖 Lua 与原版 bot。',
      '',
      '| 单位 | 次数 | 总 ms | 最大 ms |',
      '|---|---|---|---|',
    );
    const rows = Object.entries(thinkers).sort((a, b) => b[1].total - a[1].total);
    for (const [unit, row] of rows.slice(0, 20)) {
      out.push(`| \`${unit}\` | ${row.count} | ${fmt(row.total, 0)} | ${fmt(row.max, 1)} |`);
    }
    out.push('');
  }
  return out;
}

module.exports = { summarize, unstableConditions };

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node src/scripts/perf-summary.js <log> [more logs...]');
    process.exit(1);
  }
  console.log(summarize(files.map((file) => fs.readFileSync(file, 'utf8')).join('\n')));
}
