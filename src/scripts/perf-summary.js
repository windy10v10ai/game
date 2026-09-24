const fs = require('fs');

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

// 只取最后一次自动测试的输出，console.log 会在多次启动间累积
function lastRun(text) {
  const lines = text.split(/\r?\n/);
  let start = 0;
  lines.forEach((line, i) => {
    if (line.includes('[perf] start')) start = i;
  });
  return lines.slice(start);
}

function summarize(text) {
  const lines = lastRun(text);
  const windows = {};
  const steps = {};
  const prof = {};
  for (const line of lines) {
    const at = line.indexOf('[perf');
    if (at < 0) continue;
    const body = line.slice(at);
    const f = parseFields(body);
    if (body.startsWith('[perf] ') && f.tick) {
      (windows[f.phase] ??= []).push(f);
    } else if (body.startsWith('[perf-auto] step')) {
      steps[f.name] = { ref: f.ref, timescale: Number(f.timescale) };
    } else if (body.startsWith('[perf-prof] ') && f.level) {
      ((prof[f.phase] ??= {})[f.level] ??= []).push({ name: f.name, ms: Number(f.ms) });
    }
  }

  const stat = (phase) => {
    const ws = windows[phase] ?? [];
    const num = (k) => ws.map((w) => Number(w[k]));
    const tick = mean(num('tick'));
    const seconds = ws.length * 10;
    return {
      n: ws.length,
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

  const out = [];
  out.push('# 性能自动测试汇总', '');

  const early = stat('early');
  if (early.n) {
    out.push(
      `测量自检（开局 1 倍速）：tick ${fmt(early.tick)}，maxGap ${early.maxGap}ms，单位 ${fmt(early.units, 0)}。tick 接近 30 说明测量本身可靠。`,
      '',
    );
  }

  // 同名多次重复合并，逐次与各自对照组比，再取平均，避免两次之间的整体漂移混进差值
  const groups = {};
  for (const [name, meta] of Object.entries(steps)) {
    (groups[baseName(name)] ??= []).push({ name, ...meta });
  }

  out.push('## 第一层：条件对照', '');
  out.push(
    '| 条件 | 对照 | 倍率 | 次数 | tick/s | ms/tick | 变化 | 速度比 | maxGap ms | 尖峰/分 | AI ms/tick | 单位 | modifier |',
  );
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [group, runs] of Object.entries(groups)) {
    const stats = runs.map((r) => stat(r.name));
    const deltas = runs
      .map((r, i) => {
        if (r.ref === r.name) return NaN;
        const ref = stat(r.ref);
        return ((stats[i].msPerTick - ref.msPerTick) / ref.msPerTick) * 100;
      })
      .filter(Number.isFinite);
    const deltaText = deltas.length
      ? `${pct(mean(deltas))}${deltas.length > 1 ? `（${deltas.map(pct).join(' / ')}）` : ''}`
      : '对照组';
    const m = (k) => mean(stats.map((s) => s[k]));
    const saturated = runs[0].timescale > 1 && m('speed') < runs[0].timescale * 0.9;
    out.push(
      `| ${group} | ${baseName(runs[0].ref)} | ${runs[0].timescale}${runs[0].timescale > 1 && !saturated ? '（未跑满）' : ''} | ${runs.length} | ${fmt(m('tick'))} | ${fmt(m('msPerTick'), 2)} | ${deltaText} | ${fmt(m('speed'), 2)} | ${fmt(Math.max(...stats.map((s) => s.maxGap)), 0)} | ${fmt(m('hitchPerMin'))} | ${fmt(m('aiMsPerTick'), 2)} | ${fmt(m('units'), 0)} | ${fmt(m('mods'), 0)} |`,
    );
  }
  out.push(
    '',
    '「变化」是 ms/tick 相对对照组的变化，负数表示关掉该条件后每 tick 省下的时间。加速倍率下服务器跑满时 ms/tick 才等于真实处理耗时。',
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
  }

  return out.join('\n');
}

module.exports = { summarize };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node src/scripts/perf-summary.js <console.log>');
    process.exit(1);
  }
  console.log(summarize(fs.readFileSync(file, 'utf8')));
}
