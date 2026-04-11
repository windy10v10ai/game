const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getAddonName, getDotaPath } = require('./utils');

async function ensureThumbnailCachePlaceholders() {
  const gameDir = path.resolve(__dirname, '..', '..', 'game');
  const placeholderNames = [
    'tools_thumbnail_cache.sqlite3',
    'tools_thumbnail_cache.sqlite3-shm',
    'tools_thumbnail_cache.sqlite3-wal',
  ];

  for (const name of placeholderNames) {
    const p = path.join(gameDir, name);
    try {
      const stat = await fs.promises.stat(p);
      if (stat.isDirectory()) continue;
      // If it's a file, try to remove it so we can replace with a directory.
      await fs.promises.unlink(p);
    } catch (e) {
      if (e && e.code !== 'ENOENT') {
        // Best-effort: if it's locked/in use, we can't guarantee placeholder creation.
        console.warn(`[launch] Cannot prepare placeholder for ${p}:`, e.message || e);
        continue;
      }
    }

    try {
      await fs.promises.mkdir(p, { recursive: true });
    } catch (e) {
      console.warn(`[launch] Failed to create placeholder directory ${p}:`, e.message || e);
    }
  }
}

(async () => {
  // 在启动 Dota2 Tools 之前先放置同名占位目录，阻止 Tools 创建/锁定 tools_thumbnail_cache.sqlite3*，避免发布时因这些缓存文件导致崩溃。
  await ensureThumbnailCachePlaceholders();

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
