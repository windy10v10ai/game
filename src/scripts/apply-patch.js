/**
 * 应用 typescript-to-lua patch 的辅助脚本
 *
 * 此脚本会从 patches/ 目录中查找 patch 文件并应用
 * 注意: patch 文件由 patch-package 自动管理，每次 npm install 时会自动应用
 *
 * 使用方法:
 *   node src/scripts/apply-patch.js
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const patchesDir = path.resolve(__dirname, '../../patches');
const nodeModulesPath = path.resolve(__dirname, '../../node_modules/typescript-to-lua');

/**
 * 查找 patch 文件
 * 从 patches/ 目录中查找 typescript-to-lua 的 patch 文件
 */
function findPatchFile() {
  // 检查 patches/ 目录是否存在
  if (!fs.existsSync(patchesDir)) {
    return null;
  }

  // 查找所有 typescript-to-lua 的 patch 文件
  const files = fs.readdirSync(patchesDir);
  const patchFile = files.find(file => file.startsWith('typescript-to-lua+') && file.endsWith('.patch'));

  if (patchFile) {
    const patchPath = path.resolve(patchesDir, patchFile);
    console.log(`✅ 找到 patch 文件: ${patchPath}`);
    return patchPath;
  }

  return null;
}

async function applyPatch() {
  console.log('正在应用 typescript-to-lua patch...\n');

  // 检查 node_modules 是否存在
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ 错误: node_modules/typescript-to-lua 不存在，请先运行 npm install');
    process.exit(1);
  }

  // 查找 patch 文件
  const patchFile = findPatchFile();

  if (!patchFile) {
    console.error('❌ 错误: 找不到 patch 文件');
    console.error('\n请将 patch 文件放到 patches/ 目录中');
    console.error('patch 文件命名格式: typescript-to-lua+<version>.patch');
    console.error('\n💡 提示: 现在 patch 由 patch-package 自动管理，');
    console.error('   每次运行 npm install 时会自动应用 patch');
    process.exit(1);
  }

  try {
    // 应用 patch
    console.log(`\n应用 patch: ${patchFile}`);
    execSync(`git apply --directory=node_modules/typescript-to-lua "${patchFile}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    });

    console.log('\n✅ Patch 应用成功！');
    console.log('\n💡 提示: patch 文件已由 patch-package 管理，');
    console.log('   每次运行 npm install 时会自动应用 patch');
  } catch (error) {
    console.error('\n❌ Patch 应用失败');
    console.error('\n可能的原因:');
    console.error('1. Patch 已经应用过了（这是正常的，可以继续下一步）');
    console.error('2. typescript-to-lua 版本不匹配');
    console.error('3. 文件已被修改');
    console.error('\n如果 patch 已经应用过，可以直接运行：');
    console.error('   npx patch-package typescript-to-lua');
    process.exit(1);
  }
}

applyPatch();
