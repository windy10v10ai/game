const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const flash3Dir = path.join(repoRoot, 'game', 'resource', 'flash3', 'images', 'items');
const contentDir = path.join(repoRoot, 'content', 'panorama', 'images', 'items');
const xmlPath = path.join(contentDir, 'images_items.xml');

function pngNames(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .map((f) => path.basename(f, path.extname(f)));
}

function xmlEntries() {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const entries = [];
  const re = /<Image\s+id="([^"]*)"[^>]*src="file:\/\/\{images\}\/items\/([^"]*)\.png"/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    entries.push({ id: m[1], name: m[2] });
  }
  return entries;
}

function diff(a, b) {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x)).sort();
}

function report(label, names) {
  if (names.length === 0) return false;
  console.error(`[check-images] ${label} (${names.length}): ${names.join(', ')}`);
  return true;
}

const flash3 = pngNames(flash3Dir);
const content = pngNames(contentDir);
const entries = xmlEntries();
const referenced = entries.map((e) => e.name);

let failed = false;
failed = report('缺少 content 副本，需从 flash3 复制', diff(flash3, content)) || failed;
failed = report('content 多余，flash3 中不存在', diff(content, flash3)) || failed;
failed = report('未登记进 images_items.xml', diff(content, referenced)) || failed;
failed = report('images_items.xml 引用了不存在的 png', diff(referenced, content)) || failed;

// id 与 src 文件名一致即天然唯一，无需再单独查重
failed =
  report(
    'images_items.xml 中 id 与 src 文件名不一致',
    entries.filter((e) => e.id !== e.name).map((e) => `${e.id} -> ${e.name}`),
  ) || failed;

if (failed) {
  console.error('[check-images] 物品图标三处（flash3 png / content png / xml 引用）不一致');
  process.exit(1);
}

console.log(`[check-images] OK: ${flash3.length} 个物品图标三处一致`);
