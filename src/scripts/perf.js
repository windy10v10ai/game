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
// 专用服负载高时会以处理超时为由踢掉唯一的客户端，没有玩家后游戏直接结算，脚本内存随即失控，只能立刻收场
const BROKEN =
  /Disconnect client .* from server|LUA Memory usage warning: The VM has hit a new high usage of \d{3},\d{3},\d{3} bytes/;

function parseArgs() {
  const options = {
    phaseSeconds: 40,
    reps: 1,
    warmupMinutes: 20,
    // 后期服务器连 1 倍速都跑不满，高倍率只是空转还可能卡死，2 倍够用
    timescale: 2,
    // 1 倍速才是玩家的真实感受，加速只用于热身
    measureTimescale: 1,
    // 每局的最长等待时间，超时强制结束这一局
    timeoutMinutes: 90,
    quitOnDone: true,
    mode: 'steps',
    soakMinutes: 40,
    soakTimescale: 2,
    // 开局满级加钱，低倍速也能很快进入后期
    boost: true,
    maxLevel: 50,
    // bot 英雄池的起始偏移，换一批英雄观察
    botOffset: 0,
    // 天辉人数与金钱经验倍率，0 为沿用对局选项；专用服的客户端默认只报 1 人、1.5 倍，固定为满编且与夜魇同倍率，--radiantPlayers 1 模拟 1v10
    radiantPlayers: 10,
    radiantMultiplier: 10,
    // 逗号分隔的英雄名，排到 bot 英雄池最前面，用于让指定英雄出场验证
    botHeroes: '',
    // 先跑 minGames 局；有条件各局结果不一致就逐局追加，最多 maxGames 局
    // 逗号分隔的条件名，只复测其中几项时用
    conditions: 'all',
    minGames: 3,
    maxGames: 5,
    spreadLimit: 10,
    // dedicated：本机专用服加普通客户端，服务器独占进程，和 launcher 给玩家的方式一致；tools：工具模式单进程，性能剖析只在这里可用
    server: 'dedicated',
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in options)) throw new Error(`unknown option --${key}`);
    const value = argv[i + 1];
    if (key === 'quitOnDone' || key === 'boost') options[key] = value !== 'false';
    else if (['mode', 'conditions', 'botHeroes', 'server'].includes(key)) options[key] = value;
    else options[key] = Number(value);
  }
  return options;
}

const LAUNCHER_ONLY = ['timeoutMinutes', 'minGames', 'maxGames', 'spreadLimit', 'server'];
const SERVER_PORT = 27015;
const SERVER_LOG = 'perf-dedicated.log';
const MAP_LOADED = 'Host activate: Loading (custom)';

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

// 出错时日志可达上 GB，整份读入会超出字符串上限；每次只读新增部分
function logTail(file) {
  let offset = 0;
  let partial = '';
  return () => {
    if (!fs.existsSync(file)) return [];
    const size = fs.statSync(file).size;
    if (size <= offset) return [];
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(Math.min(size - offset, 64 * 1024 * 1024));
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);
    offset += buffer.length;
    const lines = (partial + buffer.toString('utf8')).split(/\r?\n/);
    partial = lines.pop();
    return lines;
  };
}

// 汇总脚本需要的行：自身输出、Lua 报错、客户端未登记的 modifier、引擎慢思考警告
const KEEP_LINE =
  /\[perf|\[bot-ai\] (glyph|team=\d+ lanes|\S+ buyback)|Script Runtime Error|\[bot-team\] think error|unknown modifier type|thinking for [\d.]+ ms/;

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

// 失去焦点时引擎默认每帧主动睡一段，前后台切换会直接改变测到的帧率
const CLIENT_ARGS = ['-novid', '-condebug', '+engine_no_focus_sleep', '0'];

function launch(exe, args, label) {
  const child = spawn(exe, args, {
    detached: true,
    cwd: path.dirname(exe),
    stdio: 'ignore',
    windowsHide: true,
  });
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
  return child;
}

// 与 launcher 相同的启动方式，地图直接读本地开发目录，不需要发布；作弊用于放行加速
async function launchDedicated(exe, serverLog, addonName, label) {
  const server = launch(
    exe,
    [
      '-dedicated',
      '-console',
      '-allow_no_lobby_connect',
      '-ip',
      '127.0.0.1',
      '-port',
      String(SERVER_PORT),
      '-con_logfile',
      SERVER_LOG,
      '+sv_hibernate_when_empty',
      '0',
      '+dota_quit_after_game',
      '0',
      '+sv_cheats',
      '1',
      // 游戏脚本只在带这个服务器名的专用服上读取测试配置，见 perf-config.ts
      '+hostname',
      'windy10v10ai-perf-auto',
      `+map custom gamemode=15 customgamemode=${addonName} nomapvalidation=1`,
    ],
    label,
  );
  for (let i = 0; i < 60 && !readLog(serverLog).includes(MAP_LOADED); i++) await sleep(2000);
  if (!readLog(serverLog).includes(MAP_LOADED)) {
    throw new Error(`${label}: dedicated server did not load the map, see ${serverLog}`);
  }
  launch(exe, [...CLIENT_ARGS, '+connect', `127.0.0.1:${SERVER_PORT}`], label);
  return server;
}

async function runGame(options, gameConfig, label) {
  const dotaPath = await getDotaPath();
  const exe = path.join(dotaPath, 'game', 'bin', 'win64', 'dota2.exe');
  const logFile = path.join(dotaPath, 'game', 'dota', 'console.log');
  const serverLog = path.join(dotaPath, 'game', 'dota', SERVER_LOG);
  // Dota 启动时会从头重写日志，按旧长度续读会漏掉开头，干脆先删掉
  fs.rmSync(logFile, { force: true });
  fs.rmSync(serverLog, { force: true });
  const addonName = getAddonName();
  const dedicated = options.server === 'dedicated';

  writeConfig(gameConfig);
  console.log(`[perf] ${label}: launching Dota 2 (${options.server}), log: ${logFile}`);
  if (dedicated) {
    await launchDedicated(exe, serverLog, addonName, label);
  } else {
    launch(
      exe,
      [
        ...CLIENT_ARGS,
        '-tools',
        '-addon',
        addonName,
        '+dota_launch_custom_game',
        addonName,
        'custom',
      ],
      label,
    );
  }
  // 专用服的脚本输出在服务器日志，客户端帧数据仍在客户端日志
  const tails = dedicated ? [logTail(serverLog), logTail(logFile)] : [logTail(logFile)];
  const kept = [];
  let finished = false;
  let broken = '';
  let steps = 0;

  const deadline = Date.now() + options.timeoutMinutes * 60 * 1000;
  while (Date.now() < deadline && !finished && !broken) {
    await sleep(POLL_MS);
    for (const tail of tails) {
      for (const line of tail()) {
        if (KEEP_LINE.test(line)) kept.push(line);
        if (FINISHED.test(line)) finished = true;
        if (BROKEN.test(line)) broken = line;
        const step = line.match(/\[perf-auto\] step name=(\S+)/);
        if (step) console.log(`[perf] ${label}: ${step[1]} (${++steps})`);
      }
    }
  }
  removeConfig();
  // 服务器退出后客户端会停在断线界面，不会自己退出
  if ((dedicated || broken) && isDotaRunning()) execSync('taskkill /IM dota2.exe /F');
  if (broken) console.error(`[perf] ${label}: stopped early: ${broken.trim()}`);
  else if (!finished) {
    console.error(`[perf] ${label}: timeout before the game finished, keeping partial data`);
  }
  await waitDotaExit();
  return kept.join('\n');
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
  // 保持常亮的子进程会让事件循环一直不空，脚本不会自己退出
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
