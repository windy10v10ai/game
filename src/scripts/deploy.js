const fs = require('fs');
const path = require('path');

async function removeIfExists(p) {
  try {
    await fs.promises.rm(p, { recursive: true, force: true });
  } catch (e) {
    // Best-effort cleanup; do not block deploy flow.
    console.warn(`[predeploy] Failed to remove ${p}:`, e.message || e);
  }
}

(async () => {
  const gameDir = path.resolve(__dirname, '..', '..', 'game');
  const targets = [
    'tools_thumbnail_cache.sqlite3',
    'tools_thumbnail_cache.sqlite3-shm',
    'tools_thumbnail_cache.sqlite3-wal',
  ].map((name) => path.join(gameDir, name));

  for (const p of targets) {
    await removeIfExists(p);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

