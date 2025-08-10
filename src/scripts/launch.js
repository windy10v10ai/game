const { exec, spawn } = require('child_process');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');

(async () => {
  const dotaPath = await getDotaPath();
  const win64 = path.join(dotaPath, 'game', 'bin', 'win64');
  const addonName = getAddonName();

  exec('tasklist', (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }

    if (!stdout.toLowerCase().includes('dota2.exe')) {
      // 启动 Dota 2 并传递控制台命令
      console.log('Dota 2 is not running. Starting Dota 2...');
      const args = [
        '-novid',
        '-tools',
        '-addon',
        addonName,
        '+dota_launch_custom_game',
        addonName,
        'custom',
      ];

      const child = spawn(path.join(win64, 'dota2.exe'), args, {
        detached: true,
        cwd: win64,
        stdio: 'ignore',
      });

      child.unref();
    } else {
      console.log('Dota 2 is already running.');
    }
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
