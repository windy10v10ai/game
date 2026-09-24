const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');
const { summarize } = require('./perf-summary');

const ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_FILE = path.join(ROOT, 'game', 'scripts', 'vscripts', 'perf_auto_config.lua');
const REPORT_DIR = path.join(ROOT, 'docs', 'superpowers', 'perf');
const POLL_MS = 15000;
const FINISHED = /\[perf-auto\] (done|aborted)/;

function parseArgs() {
  const options = {
    phaseSeconds: 60,
    reps: 2,
    warmupMinutes: 30,
    timescale: 8,
    measureTimescale: 16,
    timeoutMinutes: 90,
    quitOnDone: true,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in options)) throw new Error(`unknown option --${key}`);
    options[key] = key === 'quitOnDone' ? argv[i + 1] !== 'false' : Number(argv[i + 1]);
  }
  return options;
}

function writeConfig(options) {
  const { phaseSeconds, reps, warmupMinutes, timescale, measureTimescale, quitOnDone } = options;
  const body = `return { phaseSeconds = ${phaseSeconds}, reps = ${reps}, warmupMinutes = ${warmupMinutes}, timescale = ${timescale}, measureTimescale = ${measureTimescale}, quitOnDone = ${quitOnDone} }\n`;
  fs.writeFileSync(CONFIG_FILE, body);
}

function removeConfig() {
  fs.rmSync(CONFIG_FILE, { force: true });
}

function readFrom(file, offset) {
  if (!fs.existsSync(file)) return '';
  const size = fs.statSync(file).size;
  if (size <= offset) return '';
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.alloc(size - offset);
  fs.readSync(fd, buffer, 0, buffer.length, offset);
  fs.closeSync(fd);
  return buffer.toString('utf8');
}

(async () => {
  const options = parseArgs();
  if (execSync('tasklist').toString().toLowerCase().includes('dota2.exe')) {
    throw new Error('Dota 2 is already running, close it first');
  }

  const dotaPath = await getDotaPath();
  const win64 = path.join(dotaPath, 'game', 'bin', 'win64');
  const logFile = path.join(dotaPath, 'game', 'dota', 'console.log');
  const offset = fs.existsSync(logFile) ? fs.statSync(logFile).size : 0;
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
    text = readFrom(logFile, offset);
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

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const perfLines = text
    .split(/\r?\n/)
    .filter((line) => line.includes('[perf'))
    .join('\n');
  fs.writeFileSync(path.join(REPORT_DIR, `${stamp}.log`), perfLines);
  const report = summarize(perfLines);
  const reportFile = path.join(REPORT_DIR, `${stamp}.md`);
  fs.writeFileSync(reportFile, report);
  console.log(report);
  console.log(`\n[perf] report saved to ${reportFile}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
