// 向运行中的 Dota 2 Tools 发控制台命令，并打印命令触发的新日志。
// 用法：npm run dota:cmd -- [--settle 毫秒] [--all] "say -item item_blink" "say -stat"
// Dota 需带 -netconport 启动（npm run launch 已带上）
const fs = require('fs');
const net = require('net');
const path = require('path');
const { getDotaPath, NETCON_PORT } = require('./utils');

// 协议与 VConsole 相同：12 字节头（类型、版本、总长度、句柄）+ 以 \0 结尾的命令
const PROTOCOL_VERSION = 0x00d40000;
// 刚连上时引擎还在回放缓冲日志，此时发来的命令会被丢弃
const HANDSHAKE_MS = 1500;
const COMMAND_GAP_MS = 300;
const KEEP_LINE = /\[test\]|\[Debug\]|Script Runtime Error|error/i;

function parseArgs(argv) {
  const options = { settle: 1500, all: false, commands: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--settle') options.settle = Number(argv[++i]);
    else if (argv[i] === '--all') options.all = true;
    else options.commands.push(argv[i]);
  }
  return options;
}

function packet(command) {
  const body = Buffer.from(`${command}\0`, 'utf8');
  const header = Buffer.alloc(12);
  header.write('CMND', 0);
  header.writeUInt32BE(PROTOCOL_VERSION, 4);
  header.writeUInt16BE(header.length + body.length, 8);
  return Buffer.concat([header, body]);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function send(commands) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(NETCON_PORT, '127.0.0.1');
    socket.on('data', () => {});
    socket.on('error', (error) =>
      reject(new Error(`cannot reach Dota on port ${NETCON_PORT}: ${error.message}`)),
    );
    socket.on('connect', async () => {
      await sleep(HANDSHAKE_MS);
      for (const command of commands) {
        socket.write(packet(command));
        await sleep(COMMAND_GAP_MS);
      }
      socket.end();
      resolve();
    });
  });
}

(async () => {
  const options = parseArgs(process.argv.slice(2));
  const logFile = path.join(await getDotaPath(), 'game', 'dota', 'console.log');
  const offset = fs.existsSync(logFile) ? fs.statSync(logFile).size : 0;

  await send(options.commands);
  await sleep(options.settle);

  if (!fs.existsSync(logFile)) return;
  const fd = fs.openSync(logFile, 'r');
  const buffer = Buffer.alloc(fs.statSync(logFile).size - offset);
  fs.readSync(fd, buffer, 0, buffer.length, offset);
  fs.closeSync(fd);
  const lines = buffer.toString('utf8').split(/\r?\n/);
  for (const line of lines) {
    if (options.all || KEEP_LINE.test(line)) console.log(line);
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
