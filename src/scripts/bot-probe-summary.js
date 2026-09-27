/**
 * 汇总 bot 观察工具按 phase 分段输出的计数，生成原生 bot 与自定义 AI 的行为画像。
 * 用法：node src/scripts/bot-probe-summary.js [console.log 路径]
 */
const fs = require('fs');
const path = require('path');
const { getDotaPath } = require('./utils');

const SEG_LINE = /\[bot-probe-seg\] phase=(\S+) cat=(\S+)(.*)$/;
const TOP = 12;

async function defaultLogPath() {
  const dotaPath = await getDotaPath();
  return path.join(dotaPath, 'game', 'dota', 'console.log');
}

// 同一条件的多次重复与各段基线分别合并
function phaseGroup(phase) {
  return phase.split('#')[0];
}

function parse(text) {
  const groups = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = SEG_LINE.exec(line);
    if (!match) continue;
    const [, phase, category, rest] = match;
    const group = phaseGroup(phase);
    if (!groups.has(group)) groups.set(group, new Map());
    const categories = groups.get(group);
    if (!categories.has(category)) categories.set(category, new Map());
    const bucket = categories.get(category);
    for (const pair of rest.trim().split(/\s+/)) {
      if (!pair) continue;
      const index = pair.lastIndexOf('=');
      const key = pair.slice(0, index);
      const value = Number(pair.slice(index + 1));
      bucket.set(key, (bucket.get(key) || 0) + value);
    }
  }
  return groups;
}

function total(bucket) {
  let sum = 0;
  for (const value of bucket.values()) sum += value;
  return sum;
}

// 把多段 key 按其中一段重新聚合，例如 act 的 region.situation.action 只看 action
function rollup(bucket, pick) {
  const result = new Map();
  if (!bucket) return result;
  for (const [key, value] of bucket) {
    const newKey = pick(key.split('.'));
    result.set(newKey, (result.get(newKey) || 0) + value);
  }
  return result;
}

function percentLine(bucket) {
  const sum = total(bucket);
  if (!sum) return '-';
  return [...bucket]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key} ${((value / sum) * 100).toFixed(0)}%`)
    .join(', ');
}

function rateLine(bucket, minutes, limit = TOP) {
  if (!bucket || !bucket.size) return '-';
  return [...bucket]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => `${key} ${(value / minutes).toFixed(1)}`)
    .join(', ');
}

function situationTable(act) {
  const bySituation = new Map();
  for (const [key, value] of act || []) {
    const [, situation, action] = key.split('.');
    if (!bySituation.has(situation)) bySituation.set(situation, new Map());
    const row = bySituation.get(situation);
    row.set(action, (row.get(action) || 0) + value);
  }
  const lines = ['| 局面 | 占比 | 动作分布 |', '|---|---|---|'];
  const sum = total(rollup(act, (parts) => parts[1]));
  for (const [situation, row] of [...bySituation].sort((a, b) => total(b[1]) - total(a[1]))) {
    const share = ((total(row) / sum) * 100).toFixed(0);
    lines.push(`| ${situation} | ${share}% | ${percentLine(row)} |`);
  }
  return lines.join('\n');
}

function summarizeGroup(name, categories) {
  const meta = categories.get('meta') || new Map();
  const minutes = (meta.get('seconds') || 0) / 60;
  const act = categories.get('act');
  const alive = meta.get('alive_s') || 0;
  const dead = meta.get('dead_s') || 0;
  const lowhp = categories.get('lowhp');
  const retreat = rollup(lowhp, (parts) => (parts[1] === 'retreat' ? 'retreat' : 'stay'));
  const out = [];
  out.push(`## ${name}（${minutes.toFixed(1)} 分钟游戏时间，存活 bot 秒 ${alive}，死亡占比 ${((dead / (alive + dead || 1)) * 100).toFixed(0)}%）`);
  out.push('');
  out.push(`- 动作：${percentLine(rollup(act, (parts) => parts[2]))}`);
  out.push(`- 区域：${percentLine(rollup(act, (parts) => parts[0]))}`);
  out.push(`- 自定义 AI mode：${percentLine(rollup(categories.get('mode'), (parts) => parts[0]))}`);
  out.push(`- 低血时：${percentLine(retreat)}（按局面 ${percentLine(rollup(lowhp, (parts) => parts[0]))}）`);
  out.push(`- 低蓝秒占比：${((meta.get('lowmana_s') || 0) / (alive || 1) * 100).toFixed(0)}%`);
  const teamAct = categories.get('team');
  for (const team of ['radiant', 'dire']) {
    const own = new Map([...(teamAct || [])].filter(([key]) => key.startsWith(`${team}.`)));
    if (!own.size) continue;
    out.push(`- ${team}：动作 ${percentLine(rollup(own, (p) => p[2]))}；区域 ${percentLine(rollup(own, (p) => p[1]))}`);
  }
  const defend = categories.get('defend');
  for (const team of ['radiant', 'dire']) {
    const own = new Map([...(defend || [])].filter(([key]) => key.endsWith(`.${team}`)));
    if (!own.size) continue;
    out.push(`- ${team} 建筑受威胁 ${(total(own) / minutes).toFixed(1)} 秒/分钟，在场友方 ${percentLine(rollup(own, (p) => p[2]))}`);
  }
  const defendRatio = categories.get('defend_ratio') || new Map();
  out.push(`- 建筑受威胁秒数（每分钟）：${rateLine(rollup(defend, (parts) => parts[0]), minutes)}`);
  out.push(`- 受威胁时在场友方英雄：${percentLine(rollup(defend, (parts) => parts[2]))}`);
  for (const kind of ['tower', 'barracks', 'fort']) {
    const attackers = defendRatio.get(`${kind}.attackers`);
    if (!attackers) continue;
    out.push(`  - ${kind}：平均攻方 ${(attackers / rollup(defend, (p) => p[0]).get(kind)).toFixed(1)} 人次/秒，守方/攻方 ${((defendRatio.get(`${kind}.defenders`) || 0) / attackers).toFixed(2)}，按位置 ${percentLine(rollup(new Map([...defend].filter(([k]) => k.startsWith(`${kind}.`))), (p) => p[1]))}`);
  }
  out.push('');
  out.push(situationTable(act));
  out.push('');
  out.push('每分钟次数：');
  out.push('');
  out.push(`- 原生指令：${rateLine(categories.get('norder'), minutes, 20)}`);
  out.push(`- 原生指令按执行单位：${rateLine(rollup(categories.get('norder'), (parts) => parts[0]), minutes)}`);
  out.push(`- 原生指令按类型：${rateLine(rollup(categories.get('norder'), (parts) => parts[1]), minutes)}`);
  out.push(`- 原生施放：${rateLine(categories.get('ncast'), minutes, 20)}`);
  out.push(`- 脚本指令（经过滤器）：${rateLine(categories.get('sorder'), minutes)}`);
  out.push(`- 脚本指令来源（全部入口）：${rateLine(categories.get('site'), minutes)}`);
  out.push(`- 施放事件：${rateLine(categories.get('used'), minutes, 20)}`);
  out.push(`- 购买：${rateLine(categories.get('buy'), minutes)}`);
  out.push(`- 事件：${rateLine(categories.get('event'), minutes)}`);
  out.push('');
  return out.join('\n');
}

(async () => {
  const logPath = process.argv[2] || (await defaultLogPath());
  const groups = parse(fs.readFileSync(logPath, 'utf8'));
  if (!groups.size) {
    console.error(`no [bot-probe-seg] lines in ${logPath}`);
    process.exit(1);
  }
  const report = [...groups].map(([name, categories]) => summarizeGroup(name, categories));
  console.log(`# bot 行为画像\n\n来源：${logPath}\n\n${report.join('\n')}`);
})();
