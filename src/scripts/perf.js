const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');
const { summarize, unstableConditions } = require('./perf-summary');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_FILE = path.join(ROOT, 'game', 'scripts', 'vscripts', 'perf_auto_config.lua');
// 每轮一个子目录，和排查文档放在一起，今后对比历史数据直接从这里取
const RUNS_DIR = path.join(ROOT, 'docs', 'superpowers', 'specs', 'late-game-lag', 'runs');
const POLL_MS = 15000;
const FINISHED = /\[perf-auto\] (done|aborted)/;

function parseArgs() {
  const options = {
    phaseSeconds: 40,
    reps: 1,
    warmupMinutes: 20,
    timescale: 8,
    // 1 倍速才是玩家的真实感受，加速只用于热身
    measureTimescale: 1,
    // 每局的最长等待时间，超时强制结束这一局
    timeoutMinutes: 90,
    quitOnDone: true,
    mode: 'steps',
    soakMinutes: 40,
    soakTimescale: 8,
    // bot 英雄池的起始偏移，换一批英雄观察
    botOffset: 0,
    // 先跑 minGames 局；有条件各局结果不一致就逐局追加，最多 maxGames 局
    // 逗号分隔的条件名，只复测其中几项时用
    conditions: 'all',
    minGames: 3,
    maxGames: 5,
    spreadLimit: 10,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in options)) throw new Error(`unknown option --${key}`);
    const value = argv[i + 1];
    if (key === 'quitOnDone') options[key] = value !== 'false';
    else if (key === 'mode' || key === 'conditions') options[key] = value;
    else options[key] = Number(value);
  }
  return options;
}

const LAUNCHER_ONLY = ['timeoutMinutes', 'minGames', 'maxGames', 'spreadLimit'];

function writeConfig(options) {
  const fields = Object.entries(options)
    .filter(([key]) => !LAUNCHER_ONLY.includes(key))
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

// 显示器休眠后 Dota 不再出画面，客户端帧数据全部失效；测试期间向系统申请保持常亮，进程退出即失效，不改电源设置
function keepDisplayAwake() {
  const script = [
    'Add-Type -Name Power -Namespace Perf -MemberDefinition \'[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags);\'',
    '[Perf.Power]::SetThreadExecutionState([uint32]2147483651) | Out-Null',
    'while ($true) { Start-Sleep -Seconds 60 }',
  ].join('; ');
  const child = spawn(
    'powershell',
    ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')],
    { stdio: 'ignore' },
  );
  process.on('exit', () => child.kill());
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isDotaRunning = () => execSync('tasklist').toString().toLowerCase().includes('dota2.exe');

// 下一局启动前必须等上一局的进程完全退出，否则新进程会被拒绝或接管旧窗口
async function waitDotaExit() {
  for (let i = 0; i < 12 && isDotaRunning(); i++) await sleep(10000);
  if (isDotaRunning()) execSync('taskkill /IM dota2.exe /F');
  while (isDotaRunning()) await sleep(2000);
}

async function runGame(options, gameConfig, label) {
  const dotaPath = await getDotaPath();
  const win64 = path.join(dotaPath, 'game', 'bin', 'win64');
  const logFile = path.join(dotaPath, 'game', 'dota', 'console.log');
  // Dota 启动时会从头重写 console.log，按旧长度续读会漏掉开头，干脆先删掉
  fs.rmSync(logFile, { force: true });
  const addonName = getAddonName();

  writeConfig(gameConfig);
  console.log(`[perf] ${label}: launching Dota 2, log: ${logFile}`);
  const child = spawn(
    path.join(win64, 'dota2.exe'),
    [
      '-novid',
      '-tools',
      '-condebug',
      '-addon',
      addonName,
      // 失去焦点时引擎默认每帧主动睡一段，前后台切换会直接改变测到的帧率
      '+engine_no_focus_sleep',
      '0',
      '+dota_launch_custom_game',
      addonName,
      'custom',
    ],
    { detached: true, cwd: win64, stdio: 'ignore' },
  );
  child.unref();
  // Windows 给前台窗口更高调度优先级，固定为高优先级后前后台差别变小，测试期间可以正常用电脑
  setTimeout(() => {
    try {
      execSync(
        `powershell -NoProfile -Command "(Get-Process -Id ${child.pid}).PriorityClass = 'High'"`,
      );
    } catch (error) {
      console.error(`[perf] ${label}: failed to raise process priority`);
    }
  }, 5000);

  const deadline = Date.now() + options.timeoutMinutes * 60 * 1000;
  let text = '';
  let lastStep = '';
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    text = readLog(logFile);
    const steps = text.match(/\[perf-auto\] step name=\S+/g);
    const step = steps ? steps[steps.length - 1] : '';
    if (step && step !== lastStep) {
      console.log(`[perf] ${label}: ${step.replace('[perf-auto] step ', '')} (${steps.length})`);
      lastStep = step;
    }
    if (FINISHED.test(text)) break;
  }
  removeConfig();
  if (!FINISHED.test(text)) {
    console.error(`[perf] ${label}: timeout before the game finished, keeping partial data`);
  }
  await waitDotaExit();
  return text
    .split(/\r?\n/)
    .filter((line) => KEEP_LINE.test(line))
    .join('\n');
}

(async () => {
  const options = parseArgs();
  if (isDotaRunning()) throw new Error('Dota 2 is already running, close it first');
  process.on('exit', removeConfig);
  process.on('SIGINT', () => process.exit(130));
  keepDisplayAwake();

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const runDir = path.join(RUNS_DIR, stamp);
  fs.mkdirSync(runDir, { recursive: true });

  // 每局重新开一局游戏，各局热身到同一游戏时间，局与局之间没有累积；浸泡测试只看一局的变化趋势
  const maxGames = options.mode === 'soak' ? 1 : options.maxGames;
  const minGames = Math.min(options.minGames, maxGames);
  const logs = [];
  let unstable = [];
  for (let game = 1; game <= maxGames; game++) {
    const gameConfig = {
      ...options,
      repStart: (game - 1) * options.reps + 1,
      // 局数随结果追加，事先不知道哪局是最后一局，不可还原的收尾步骤放在第一局
      includeTail: game === 1,
    };
    const log = await runGame(options, gameConfig, `game ${game}`);
    fs.writeFileSync(path.join(runDir, `game-${game}.log`), log);
    logs.push(log);
    if (game < minGames) continue;
    unstable = unstableConditions(logs.join('\n'), options.spreadLimit);
    if (!unstable.length) break;
    console.log(`[perf] after ${game} games, unstable: ${unstable.join(', ')}`);
  }

  const merged = logs.join('\n');
  fs.writeFileSync(path.join(runDir, 'raw.log'), merged);
  fs.writeFileSync(
    path.join(runDir, 'config.json'),
    JSON.stringify({ ...options, games: logs.length, unstable }, null, 2),
  );
  const report = summarize(merged, { spreadLimit: options.spreadLimit });
  fs.writeFileSync(path.join(runDir, 'report.md'), report);
  console.log(report);
  console.log(`\n[perf] run saved to ${runDir}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
