const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const languages = ['schinese', 'english', 'russian'];
const completedSections = [
  {
    name: 'UI',
    startKey: 'addon_game_name',
    endKey: 'dailytask_task_hero_stun_duration',
  },
];
const russianWithoutCyrillic = new Set([
  'addon_game_name',
  'DOTA_GameMode_15',
  'addon_option_title_br',
  'game_difficulty_n1',
  'game_difficulty_n2',
  'game_difficulty_n3',
  'game_difficulty_n4',
  'game_difficulty_n5',
  'game_difficulty_n6',
  'game_difficulty_n7',
  'game_difficulty_n8',
  'room_status_separator',
  'data_panel_member_point_rule_url',
  'member_platform_alipay',
  'member_platform_afdian',
  'member_platform_kofi',
]);

function parse(language) {
  const filePath = path.join(repoRoot, 'game', 'resource', `addon_${language}.txt`);
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const entries = [];
  const byKey = new Map();

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*"([^"]+)"\s+"(.*)"\s*$/);
    if (!match) continue;

    const entry = { key: match[1], value: match[2], line: index + 1 };
    entries.push(entry);
    const occurrences = byKey.get(entry.key) || [];
    occurrences.push(entry);
    byKey.set(entry.key, occurrences);
  }

  return { language, filePath, lines, entries, byKey };
}

function placeholders(value) {
  return (value.match(/%[A-Za-z0-9_]+%|%s|\{[A-Za-z0-9_]+\}|\$[A-Za-z0-9_]+/g) || []).sort();
}

function tags(value) {
  return (value.match(/\\n|<[^>]+>/gi) || []).map((tag) =>
    tag.replace(/#[0-9A-F]{6}/gi, (color) => color.toLowerCase()).toLowerCase(),
  );
}

function section(file, config) {
  const startLine = file.lines.findIndex((line) => {
    const match = line.match(/^\s*"([^"]+)"/);
    return match?.[1] === config.startKey;
  });
  const endLine = file.lines.findIndex((line) => {
    const match = line.match(/^\s*"([^"]+)"/);
    return match?.[1] === config.endKey;
  });

  if (startLine < 0 || endLine < startLine) return null;

  const structure = [];
  const entries = [];
  for (const [offset, line] of file.lines.slice(startLine, endLine + 1).entries()) {
    const entryMatch = line.match(/^\s*"([^"]+)"\s+"(.*)"\s*$/);
    if (entryMatch) {
      const entry = {
        key: entryMatch[1],
        value: entryMatch[2],
        line: startLine + offset + 1,
      };
      entries.push(entry);
      structure.push(`key:${entry.key}`);
    } else if (/^\s*\/\//.test(line)) {
      structure.push(`comment:${line.trim()}`);
    } else if (/^\s*$/.test(line)) {
      structure.push('blank');
    } else {
      structure.push(`other:${line.trim()}`);
    }
  }

  return { structure, entries };
}

function sameMultiset(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const files = languages.map(parse);
const errors = [];

for (const file of files) {
  for (const [key, occurrences] of file.byKey) {
    if (occurrences.length > 1) {
      errors.push(
        `${file.language}: duplicate key ${key} at lines ${occurrences.map((entry) => entry.line).join(', ')}`,
      );
    }
  }
}

const allKeys = new Set(files.flatMap((file) => file.entries.map((entry) => entry.key)));
for (const key of allKeys) {
  const translations = files
    .filter((file) => file.byKey.has(key))
    .map((file) => ({ language: file.language, value: file.byKey.get(key)[0].value }));
  if (translations.length < 2) continue;

  const expected = placeholders(translations[0].value);
  for (const translation of translations.slice(1)) {
    const actual = placeholders(translation.value);
    if (!sameMultiset(expected, actual)) {
      errors.push(
        `${key}: placeholder mismatch (${translations
          .map(
            (current) => `${current.language}: ${placeholders(current.value).join(', ') || 'none'}`,
          )
          .join('; ')})`,
      );
      break;
    }
  }
}

for (const config of completedSections) {
  const sections = files.map((file) => section(file, config));
  for (const [index, current] of sections.entries()) {
    if (!current)
      errors.push(`${files[index].language}: cannot find completed section ${config.name}`);
  }
  if (sections.some((current) => !current)) continue;

  const expectedStructure = sections[0].structure;
  for (const [index, current] of sections.slice(1).entries()) {
    if (JSON.stringify(expectedStructure) !== JSON.stringify(current.structure)) {
      const mismatch = Math.max(expectedStructure.length, current.structure.length);
      let position = 0;
      while (position < mismatch && expectedStructure[position] === current.structure[position]) {
        position++;
      }
      errors.push(
        `${files[index + 1].language}: ${config.name} structure differs at entry ${position + 1} ` +
          `(schinese: ${expectedStructure[position] || 'end'}; ` +
          `${files[index + 1].language}: ${current.structure[position] || 'end'})`,
      );
    }
  }

  const entriesByLanguage = sections.map(
    (current) => new Map(current.entries.map((entry) => [entry.key, entry])),
  );
  for (const entry of sections[0].entries) {
    const expectedTags = tags(entry.value);
    for (const [index, current] of entriesByLanguage.slice(1).entries()) {
      const translated = current.get(entry.key);
      if (!translated) continue;
      const actualTags = tags(translated.value);
      if (JSON.stringify(expectedTags) !== JSON.stringify(actualTags)) {
        errors.push(
          `${entry.key}: tag sequence mismatch (schinese: ${expectedTags.join(' ') || 'none'}; ${files[index + 1].language}: ${actualTags.join(' ') || 'none'})`,
        );
      }
    }
  }

  for (const entry of sections[2].entries) {
    if (!/[Ѐ-ӿ]/.test(entry.value) && !russianWithoutCyrillic.has(entry.key)) {
      errors.push(`russian:${entry.line}: ${entry.key} has no Cyrillic text`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[check-localization] ${error}`);
  console.error(`[check-localization] FAILED: ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(
  `[check-localization] OK: ${files.map((file) => `${file.language} ${file.entries.length} keys`).join(', ')}; strict sections: ${completedSections.map((sectionConfig) => sectionConfig.name).join(', ')}`,
);
