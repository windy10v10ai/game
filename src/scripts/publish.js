'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getDotaPath, getAddonName } = require('./utils');

const STEAMCMD = 'C:\\App\\steamcmd\\steamcmd.exe';
const STEAMCMD_CONFIG = 'C:\\App\\steamcmd\\config\\config.vdf';
const WORKSHOP_ITEM_ID = '2307479570';
const APP_ID = '570';

function getSteamUsername() {
  const config = fs.readFileSync(STEAMCMD_CONFIG, 'utf8');
  const match = config.match(/"Accounts"\s*\{\s*"([^"]+)"/);
  if (!match) throw new Error('No cached SteamCMD account found. Run steamcmd.exe +login <username> first.');
  return match[1];
}

(async () => {
  const dotaPath = await getDotaPath();
  if (!dotaPath) throw new Error('Dota 2 installation not found.');

  const username = getSteamUsername();
  const contentFolder = path.join(dotaPath, 'game', 'dota_addons', getAddonName());

  const changeNote = (process.argv[2] || '').replace(/\\n/g, '\n');
  if (!changeNote) {
    console.error('[publish] Error: changenote is required. Usage: npm run deploy -- "Your update notes"');
    process.exit(1);
  }

  console.log(`[publish] Steam account: ${username}`);
  console.log(`[publish] Content folder: ${contentFolder}`);
  console.log(`[publish] Change note: ${changeNote || '(none)'}`);

  const vdf = [
    '"workshopitem"',
    '{',
    `\t"appid"\t\t"${APP_ID}"`,
    `\t"publishedfileid"\t"${WORKSHOP_ITEM_ID}"`,
    `\t"contentfolder"\t"${contentFolder.replace(/\\/g, '\\\\')}"`,
    `\t"changenote"\t"${changeNote.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
    '}',
  ].join('\n');

  const vdfPath = path.join(os.tmpdir(), 'windy10v10ai_workshop.vdf');
  fs.writeFileSync(vdfPath, vdf, 'utf8');
  console.log(`[publish] VDF written to ${vdfPath}`);

  try {
    execSync(
      `"${STEAMCMD}" +login ${username} +workshop_build_item "${vdfPath}" +quit`,
      { stdio: 'inherit' }
    );
    console.log('[publish] Workshop item updated successfully.');
  } finally {
    try { fs.unlinkSync(vdfPath); } catch (_) {}
  }
})().catch((err) => {
  console.error('[publish] Failed:', err.message || err);
  process.exit(1);
});
