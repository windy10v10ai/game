// 端到端实机检查：起 Dota Tools 载入地图，开局后运行 game/scripts/vscripts/checks/<名字>.lua，按 [check] 行判定，关掉 Dota。
// 用法：npm run dota:check -- <名字> [--hero axe] [--timeout 秒] [--keep-open]
// 退出码 0 = 全部通过；1 = 有 FAIL、脚本报错、超时或没输出 DONE；2 = 参数、环境或命令本身出错
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');

const ROOT = path.resolve(__dirname, '..', '..');
const CHECK_DIR = path.join(ROOT, 'game', 'scripts', 'vscripts', 'checks');
// 开局前英雄还没生成，聊天命令找不到玩家英雄
const GAME_STARTED = "S:Gamerules: entering state 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS'";
const POLL_MS = 1000;
let launched = false;

function parseArgs(argv) {
  const options = { name: undefined, hero: undefined, timeout: 300, keepOpen: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--hero') options.hero = argv[++i];
    else if (argv[i] === '--timeout') options.timeout = Number(argv[++i]);
    else if (argv[i] === '--keep-open') options.keepOpen = true;
    else options.name = argv[i];
  }
  return options;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isDotaRunning = () => execSync('tasklist').toString().toLowerCase().includes('dota2.exe');

function logTail(file) {
  let offset = 0;
  let partial = '';
  return () => {
    if (!fs.existsSync(file)) return [];
    const size = fs.statSync(file).size;
    if (size <= offset) return [];
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(size - offset);
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);
    offset = size;
    const lines = (partial + buffer.toString('utf8')).split(/\r?\n/);
    partial = lines.pop();
    return lines;
  };
}

// Dota 只读 addon 目录链接到的那份 game/，在别的 checkout 里跑会测到别人的代码
async function assertLinkedCheckout(dotaPath) {
  const addonGame = path.join(dotaPath, 'game', 'dota_addons', getAddonName());
  if (fs.realpathSync(addonGame) !== fs.realpathSync(path.join(ROOT, 'game'))) {
    throw new Error(`Dota loads ${fs.realpathSync(addonGame)}, run this from that checkout`);
  }
}

async function stopDota() {
  if (isDotaRunning()) execSync('taskkill /IM dota2.exe /F');
  while (isDotaRunning()) await sleep(1000);
}

async function run(options) {
  const dotaPath = await getDotaPath();
  const logFile = path.join(dotaPath, 'game', 'dota', 'console.log');
  await assertLinkedCheckout(dotaPath);
  if (!options.name) throw new Error('usage: npm run dota:check -- <name> [--hero axe]');
  const scriptFile = path.join(CHECK_DIR, `${options.name}.lua`);
  if (!fs.existsSync(scriptFile)) throw new Error(`check script not found: ${scriptFile}`);
  // 不动用户正在用的 Dota；检查要从干净开局跑
  if (isDotaRunning()) throw new Error('Dota 2 is already running, close it first');

  fs.rmSync(logFile, { force: true });
  const launchArgs = options.hero ? ['--hero', options.hero] : [];
  execFileSync(process.execPath, [path.join(__dirname, 'launch.js'), ...launchArgs], {
    stdio: 'inherit',
  });
  launched = true;

  const read = logTail(logFile);
  const module = `checks.${options.name.replace(/[\\/]/g, '.')}`;
  const deadline = Date.now() + options.timeout * 1000;
  const result = { started: false, done: false, pass: 0, fail: 0, error: '' };
  while (Date.now() < deadline && !result.done && !result.error) {
    await sleep(POLL_MS);
    for (const line of read()) {
      if (!result.started && line.includes(GAME_STARTED)) {
        result.started = true;
        console.log(`[check] game started, running ${module}`);
        execFileSync(process.execPath, [
          path.join(__dirname, 'dota-cmd.js'),
          '--settle',
          '0',
          `say -run ${module}`,
        ]);
      }
      const check = line.match(/\[check\] (PASS|FAIL|DONE).*/);
      if (check) {
        console.log(check[0]);
        if (check[1] === 'PASS') result.pass++;
        if (check[1] === 'FAIL') result.fail++;
        if (check[1] === 'DONE') result.done = true;
      }
      if (line.includes(`run ${module} failed`)) result.error = line;
      if (result.started && line.includes('Script Runtime Error')) console.log(line);
    }
  }
  return result;
}

(async () => {
  const options = parseArgs(process.argv.slice(2));
  let result;
  try {
    result = await run(options);
  } catch (error) {
    console.error(`[check] ERROR ${error.message}`);
    if (launched && !options.keepOpen) await stopDota();
    process.exit(2);
  }
  if (!options.keepOpen) await stopDota();

  let reason = '';
  if (result.error) reason = `script failed: ${result.error.trim()}`;
  else if (!result.started) reason = 'timeout before the game started';
  else if (!result.done) reason = 'timeout before [check] DONE';
  else if (result.fail > 0) reason = `${result.fail} check(s) failed`;
  else if (result.pass === 0) reason = 'no checks ran';
  console.log(
    `[check] RESULT ${reason ? 'FAIL' : 'PASS'} pass=${result.pass} fail=${result.fail}${reason ? ` (${reason})` : ''}`,
  );
  process.exit(reason ? 1 : 0);
})();
