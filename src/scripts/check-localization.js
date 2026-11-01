const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const languages = ['schinese', 'english', 'russian'];

// KeyValues 里值可能跨物理行，按引号配对读取，避免漏掉这类 key
function parse(language) {
  const filePath = path.join(repoRoot, 'game', 'resource', `addon_${language}.txt`);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const entries = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const keyMatch = line.match(/^\s*"([^"]+)"\s+"/);
    if (!keyMatch) {
      index++;
      continue;
    }
    let pos = line.indexOf('"', line.indexOf('"') + 1) + 1;
    while (pos < line.length && /\s/.test(line[pos])) pos++;
    pos++;
    const startLine = index + 1;
    let value = '';
    let current = line;
    let lineIndex = index;
    let closed = false;
    while (!closed) {
      while (pos < current.length) {
        const char = current[pos];
        if (char === '\\') {
          value += char + (current[pos + 1] || '');
          pos += 2;
          continue;
        }
        if (char === '"') {
          closed = true;
          pos++;
          break;
        }
        value += char;
        pos++;
      }
      if (closed) break;
      lineIndex++;
      if (lineIndex >= lines.length) break;
      value += '\n';
      current = lines[lineIndex];
      pos = 0;
    }
    entries.push({ key: keyMatch[1], value, line: startLine });
    if (lineIndex > index) {
      index = lineIndex + 1;
      continue;
    }
    // 同一行写了两组 key-value 的存量写法，补上后一组
    const rest = line.slice(pos).match(/^\s*"([^"]+)"\s+"(.*)"\s*$/);
    if (rest) entries.push({ key: rest[1], value: rest[2], line: startLine });
    index++;
  }
  return { language, entries, byKey: new Map(entries.map((entry) => [entry.key, entry])) };
}

function placeholders(value) {
  return (value.match(/%[A-Za-z0-9_]+%|%s|\{[A-Za-z0-9_]+\}|\$[A-Za-z0-9_]+/g) || []).sort().join(', ');
}

const files = languages.map(parse);
const errors = [];

// 重复 key 只有一条生效，另一条的修改会被静默忽略
for (const file of files) {
  const seen = new Map();
  for (const entry of file.entries) {
    if (seen.has(entry.key)) {
      errors.push(`${file.language}: duplicate key ${entry.key} at lines ${seen.get(entry.key)}, ${entry.line}`);
    }
    seen.set(entry.key, entry.line);
  }
}

// 占位符不一致时游戏里会露出 %xxx% 原文
for (const [key, entry] of files[0].byKey) {
  const expected = placeholders(entry.value);
  for (const file of files.slice(1)) {
    const translated = file.byKey.get(key);
    if (translated && placeholders(translated.value) !== expected) {
      errors.push(
        `${key}: placeholder mismatch (schinese: ${expected || 'none'}; ${file.language}: ${placeholders(translated.value) || 'none'})`,
      );
    }
  }
}

// 三语 key 必须一一对应且顺序一致：缺 key 或顺序不同都会让译文错位
const expectedKeys = files[0].entries.map((entry) => entry.key);
for (const file of files.slice(1)) {
  const actualKeys = file.entries.map((entry) => entry.key);
  const position = expectedKeys.findIndex((key, i) => key !== actualKeys[i]);
  if (position >= 0 || actualKeys.length !== expectedKeys.length) {
    const at = position >= 0 ? position : expectedKeys.length;
    errors.push(
      `${file.language}: key order differs at #${at + 1} (schinese: ${expectedKeys[at] || 'end'}; ${file.language}: ${actualKeys[at] || 'end'})`,
    );
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[check-localization] ${error}`);
  console.error(`[check-localization] FAILED: ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(
  `[check-localization] OK: ${files.map((file) => `${file.language} ${file.entries.length} keys`).join(', ')}`,
);
