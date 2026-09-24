const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');
const { summarize } = require('./perf-summary');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_FILE = path.join(ROOT, 'game', 'scripts', 'vscripts', 'perf_auto_config.lua');
// 每轮一个子目录，和排查文档放在一起，今后对比历史数据直接从这里取
const RUNS_DIR = path.join(ROOT, 'docs', 'superpowers', 'specs', 'late-game-lag', 'runs');
const POLL_MS = 15000;
const FINISHED = /\[perf-auto\] (done|aborted)/;

function parseArgs() {
  const options = {
    phaseSeconds: 120,
    reps: 3,
    warmupMinutes: 40,
    timescale: 8,
    measureTimescale: 3,
    timeoutMinutes: 300,
    quitOnDone: true,
    mode: 'steps',
    soakMinutes: 60,
    soakTimescale: 8,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in options)) throw new Error(`unknown option --${key}`);
    const value = argv[i + 1];
    if (key === 'quitOnDone') options[key] = value !== 'false';
    else if (key === 'mode') options[key] = value;
    else options[key] = Number(value);
  }
  return options;
}

function writeConfig(options) {
  const fields = Object.entries(options)
    .filter(([key]) => key !== 'timeoutMinutes')
    .map(([key, value]) => `  ${key} = ${typeof value === 'string' ? `'${value}'` : value},`);
  const body = ['return {', ...fields, '}', ''].join('\n');
  fs.writeFileSync(CONFIG_FILE, body);
}

function removeConfig() {
  fs.rmSync(CONFIG_FILE, { force: true });
}

function readLog(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

// 汇总脚本需要的行：自身输出、Lua 报错、客户端未登记的 modifier、引擎慢思考警告
const KEEP_LINE = /\[perf|Script Runtime Error|unknown modifier type|thinking for [\d.]+ ms/;

(async () => {
  const options = parseArgs();
  if (execSync('tasklist').toString().toLowerCase().includes('dota2.exe')) {
    throw new Error('Dota 2 is already running, close it first');
  }

  const dotaPath = await getDotaPath();
  const win64 = path.join(dotaPath, 'game', 'bin', 'win64');
  const logFile = path.join(dotaPath, 'game', 'dota', 'console.log');
  // Dota 启动时会从头重写 console.log，按旧长度续读会漏掉开头，干脆先删掉
  fs.rmSync(logFile, { force: true });
  const addonName = getAddonName();

  writeConfig(options);
  process.on('exit', removeConfig);
  process.on('SIGINT', () => process.exit(130));

  console.log(`[perf] launching Dota 2, log: ${logFile}`);
  const child = spawn(
    path.join(win64, 'dota2.exe'),
    [
      '-novid',
      '-tools',
      '-condebug',
      '-addon',
      addonName,
      '+dota_launch_custom_game',
      addonName,
      'custom',
    ],
    { detached: true, cwd: win64, stdio: 'ignore' },
  );
  child.unref();

  const deadline = Date.now() + options.timeoutMinutes * 60 * 1000;
  let text = '';
  let lastStep = '';
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    text = readLog(logFile);
    const steps = text.match(/\[perf-auto\] step name=\S+/g);
    const step = steps ? steps[steps.length - 1] : '';
    if (step && step !== lastStep) {
      console.log(`[perf] ${step.replace('[perf-auto] step ', '')} (${steps.length})`);
      lastStep = step;
    }
    if (FINISHED.test(text)) break;
  }
  removeConfig();
  if (!FINISHED.test(text)) {
    console.error('[perf] timeout before the run finished, summarizing partial data');
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const runDir = path.join(RUNS_DIR, stamp);
  fs.mkdirSync(runDir, { recursive: true });
  const perfLines = text
    .split(/\r?\n/)
    .filter((line) => KEEP_LINE.test(line))
    .join('\n');
  fs.writeFileSync(path.join(runDir, 'raw.log'), perfLines);
  fs.writeFileSync(path.join(runDir, 'config.json'), JSON.stringify(options, null, 2));
  const report = summarize(perfLines);
  fs.writeFileSync(path.join(runDir, 'report.md'), report);
  console.log(report);
  console.log(`\n[perf] run saved to ${runDir}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
