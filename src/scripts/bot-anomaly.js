/**
 * 从开发模式的控制台日志里找自定义 AI 的异常：卡住不动、远路不传送、停下来挤成一团、打和撤来回切、
 * 长时间闲着、建筑挨打没人到场。只读日志，不参与游戏发布。
 * 用法：node src/scripts/bot-anomaly.js [console.log 路径]
 */
const fs = require('fs');
const path = require('path');
const { getDotaPath } = require('./utils');

const POS_LINE =
  /\[bot-pos\] t=(\d+) team=(\d+) (\S+) x=(-?\d+) y=(-?\d+) task=(\S+) target=(-?\d+) dist=(-?\d+) stance=(\S+) tp=(\S+) channel=(\d)/;
const TRACE_LINE = /\[bot-ai\] t=(\d+):(\d+) (\S+) hp=\d+% pw=\d+ stance=(\S+)/;
const DEFEND_LINE = /\[bot-ai\] team=(\d+) t=(\d+) defend=(\S+)/;

// 离任务点这么远还停着才算卡住，近了多半是到位后在等
const STUCK_DISTANCE = 1200;
const STUCK_MOVE = 150;
const STUCK_SECONDS = 10;
// 这么远、传送好了还在走路算远路不传送
const TELEPORT_DISTANCE = 6000;
const SLOW_SECONDS = 10;
// 两人都停着且挨这么近、持续这么久算挤在一起
const CLUMP_DISTANCE = 350;
const CLUMP_STILL = 100;
const CLUMP_SECONDS = 10;
const FLIP_WINDOW = 10;
const FLIP_COUNT = 3;
const IDLE_SECONDS = 20;
// 建筑被敌方英雄贴着打这么久还没有回防的人到它身边
const DEFEND_LATE_SECONDS = 10;
const DEFEND_ARRIVE = 1500;
const TOP = 10;

async function defaultLogPath() {
  const dotaPath = await getDotaPath();
  return path.join(dotaPath, 'game', 'dota', 'console.log');
}

/** 游戏时间倒退说明重开了一局，按局分开分析。 */
function splitGames(text) {
  const games = [];
  let current = null;
  let latest = -1;
  for (const line of text.split(/\r?\n/)) {
    const time = lineTime(line);
    if (time === undefined) continue;
    if (!current || time < latest - 60) {
      current = { pos: [], trace: [], defend: [] };
      games.push(current);
      latest = time;
    }
    latest = Math.max(latest, time);
    let match = POS_LINE.exec(line);
    if (match) {
      current.pos.push({
        t: Number(match[1]),
        team: match[2],
        hero: match[3],
        x: Number(match[4]),
        y: Number(match[5]),
        task: match[6],
        target: match[7],
        dist: Number(match[8]),
        stance: match[9],
        tp: match[10],
        channel: match[11] === '1',
      });
      continue;
    }
    match = TRACE_LINE.exec(line);
    if (match) {
      current.trace.push({
        t: Number(match[1]) * 60 + Number(match[2]),
        hero: match[3],
        stance: match[4],
      });
      continue;
    }
    match = DEFEND_LINE.exec(line);
    if (match) {
      current.defend.push({ team: match[1], t: Number(match[2]), targets: match[3] });
    }
  }
  return games;
}

function lineTime(line) {
  let match = /\[bot-pos\] t=(\d+)/.exec(line);
  if (match) return Number(match[1]);
  match = /\[bot-ai\] t=(\d+):(\d+)/.exec(line);
  if (match) return Number(match[1]) * 60 + Number(match[2]);
  match = /\[bot-ai\] team=\d+ t=(\d+)/.exec(line);
  return match ? Number(match[1]) : undefined;
}

function byHero(samples) {
  const map = new Map();
  for (const sample of samples) {
    if (!map.has(sample.hero)) map.set(sample.hero, []);
    map.get(sample.hero).push(sample);
  }
  return map;
}

const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clock = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

/** 连续满足条件、持续至少 minSeconds 的区间。 */
function runs(samples, keep, sameRun, minSeconds) {
  const result = [];
  let start = 0;
  for (let i = 0; i <= samples.length; i++) {
    const ok =
      i < samples.length &&
      keep(samples[i], samples[i - 1]) &&
      (i === start || sameRun(samples[i], samples[start]));
    if (ok) continue;
    if (i - 1 > start && samples[i - 1].t - samples[start].t >= minSeconds) {
      result.push(samples.slice(start, i));
    }
    start = i < samples.length && keep(samples[i], undefined) ? i : i + 1;
  }
  return result;
}

function detectStuck(heroes) {
  const found = [];
  for (const [hero, samples] of heroes) {
    const stuck = runs(
      samples,
      (s, prev) =>
        s.dist > STUCK_DISTANCE &&
        !s.channel &&
        s.task !== 'none' &&
        (!prev || gap(s, prev) < STUCK_MOVE),
      (s, first) => s.task === first.task && s.target === first.target,
      STUCK_SECONDS,
    );
    for (const run of stuck) {
      const first = run[0];
      found.push(
        `${hero} ${clock(first.t)}-${clock(run[run.length - 1].t)} ${first.task}>${first.target} 离任务点 ${first.dist} stance=${first.stance}`,
      );
    }
  }
  return found;
}

function detectSlowTravel(heroes) {
  const found = [];
  for (const [hero, samples] of heroes) {
    const slow = runs(
      samples,
      (s) =>
        s.dist > TELEPORT_DISTANCE &&
        s.tp === 'ready' &&
        !s.channel &&
        ['push', 'defend', 'fight'].includes(s.task),
      (s, first) => s.task === first.task && s.target === first.target,
      SLOW_SECONDS,
    );
    for (const run of slow) {
      found.push(
        `${hero} ${clock(run[0].t)}-${clock(run[run.length - 1].t)} ${run[0].task} 离任务点 ${run[0].dist}，传送就绪没用`,
      );
    }
  }
  return found;
}

function detectClumps(heroes) {
  const still = new Map();
  for (const [, samples] of heroes) {
    for (let i = 1; i < samples.length; i++) {
      if (gap(samples[i], samples[i - 1]) >= CLUMP_STILL) continue;
      const bucket = Math.round(samples[i].t / 5);
      if (!still.has(bucket)) still.set(bucket, []);
      still.get(bucket).push(samples[i]);
    }
  }
  const streak = new Map();
  const found = new Map();
  for (const bucket of [...still.keys()].sort((a, b) => a - b)) {
    const group = still.get(bucket);
    const pairs = new Set();
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.team !== b.team || gap(a, b) >= CLUMP_DISTANCE) continue;
        const key = [a.hero, b.hero].sort().join('+');
        pairs.add(key);
        const run = streak.get(key);
        const next =
          run && run.last === bucket - 1
            ? { ...run, last: bucket }
            : { first: bucket, last: bucket, a };
        streak.set(key, next);
        if ((next.last - next.first) * 5 >= CLUMP_SECONDS && !found.has(`${key}@${next.first}`)) {
          found.set(
            `${key}@${next.first}`,
            `${key} 从 ${clock(next.first * 5)} 起停在一起 ${(next.last - next.first) * 5}s+ task=${a.task} stance=${a.stance}`,
          );
        }
      }
    }
  }
  return [...found.values()];
}

function detectFlips(traces) {
  const found = [];
  for (const [hero, samples] of byHero(traces)) {
    const changes = samples.filter((s, i) => i === 0 || s.stance !== samples[i - 1].stance);
    for (let i = 0; i < changes.length; i++) {
      const window = changes.filter(
        (c) => c.t >= changes[i].t && c.t - changes[i].t <= FLIP_WINDOW,
      );
      let flips = 0;
      for (let k = 1; k < window.length; k++) {
        const pair = new Set([window[k - 1].stance, window[k].stance]);
        if (pair.has('fight') && pair.has('retreat')) flips++;
      }
      if (flips >= FLIP_COUNT) {
        found.push(`${hero} ${clock(changes[i].t)} 起 ${FLIP_WINDOW}s 内打/撤切换 ${flips} 次`);
        i += window.length - 1;
      }
    }
  }
  return found;
}

function detectIdle(heroes) {
  const found = [];
  for (const [hero, samples] of heroes) {
    const idle = runs(
      samples,
      (s) => s.task === 'none' || s.task === 'hold',
      () => true,
      IDLE_SECONDS,
    );
    for (const run of idle) {
      found.push(`${hero} ${clock(run[0].t)}-${clock(run[run.length - 1].t)} 没有任务`);
    }
  }
  return found;
}

/** 按回防日志还原每座建筑被贴着打的区间，区间开始后一段时间内没有回防者到它身边就记一条。 */
function detectLateDefense(game) {
  const found = [];
  const open = new Map();
  const close = (key, end) => {
    const start = open.get(key);
    open.delete(key);
    if (end - start < DEFEND_LATE_SECONDS) return;
    const [team, id] = key.split(':');
    const deadline = start + DEFEND_LATE_SECONDS;
    const arrived = game.pos.some(
      (s) =>
        s.team === team &&
        s.target === id &&
        s.task === 'defend' &&
        s.t >= start &&
        s.t <= deadline &&
        s.dist <= DEFEND_ARRIVE,
    );
    if (!arrived)
      found.push(
        `team=${team} 建筑 ${id} 从 ${clock(start)} 起被打，${DEFEND_LATE_SECONDS}s 内没有回防者到场`,
      );
  };
  for (const line of game.defend) {
    const engaged = new Set(
      line.targets
        .split(',')
        .filter((item) => item.split(':')[1] === 'engaged')
        .map((item) => `${line.team}:${item.split(':')[0]}`),
    );
    for (const key of [...open.keys()]) {
      if (key.startsWith(`${line.team}:`) && !engaged.has(key)) close(key, line.t);
    }
    for (const key of engaged) {
      if (!open.has(key)) open.set(key, line.t);
    }
  }
  const end = game.pos.length ? game.pos[game.pos.length - 1].t : 0;
  for (const key of [...open.keys()]) close(key, end);
  return found;
}

function section(title, items) {
  const lines = [`### ${title}：${items.length}`];
  for (const item of items.slice(0, TOP)) lines.push(`- ${item}`);
  if (items.length > TOP) lines.push(`- ……另有 ${items.length - TOP} 条`);
  return lines.join('\n');
}

function analyze(text) {
  const games = splitGames(text).filter((game) => game.pos.length > 0);
  if (games.length === 0) {
    return '日志里没有 [bot-pos] 记录：需要开发模式或自动测试局，且电脑已被自定义 AI 接管。';
  }
  return games
    .map((game, index) => {
      const heroes = byHero(game.pos);
      const span = `${clock(game.pos[0].t)}-${clock(game.pos[game.pos.length - 1].t)}`;
      return [
        `## 第 ${index + 1} 局（游戏时间 ${span}）`,
        section('卡住不动', detectStuck(heroes)),
        section('远路不传送', detectSlowTravel(heroes)),
        section('停下来挤在一起', detectClumps(heroes)),
        section('打撤来回切', detectFlips(game.trace)),
        section('长时间没任务', detectIdle(heroes)),
        section('建筑挨打没人到场', detectLateDefense(game)),
      ].join('\n\n');
    })
    .join('\n\n');
}

module.exports = { analyze };

if (require.main === module) {
  (async () => {
    const file = process.argv[2] || (await defaultLogPath());
    console.log(analyze(fs.readFileSync(file, 'utf8')));
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
