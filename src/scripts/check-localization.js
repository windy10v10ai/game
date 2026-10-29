const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const languages = ['schinese', 'english', 'russian'];
// 已补齐俄文的区段：三语 key 必须一一对应且顺序一致
const completedSections = [
  { name: 'UI', startKey: 'addon_game_name', endKey: 'dailytask_task_hero_stun_duration' },
  {
    name: 'World & Shop',
    startKey: 'DOTA_Tooltip_modifier_tower_power',
    endKey: 'dota_item_build_windy_range_items',
  },
  {
    name: 'Player Buffs',
    startKey: 'DOTA_Tooltip_modifier_global_newbie',
    endKey: 'DOTA_Tooltip_modifier_global_member_premium_Description',
  },
  {
    name: 'Player Titles',
    startKey: 'DOTA_Tooltip_modifier_player_lumao',
    endKey: 'DOTA_Tooltip_modifier_player_nemesis_Description',
  },
  {
    name: 'Custom Abilities',
    startKey: 'DOTA_Tooltip_ability_ward_observer_slot',
    endKey: 'DOTA_Tooltip_modifier_fountain_anti_camp_lock_Description',
  },
];

function parse(language) {
  const filePath = path.join(repoRoot, 'game', 'resource', `addon_${language}.txt`);
  const entries = [];
  for (const [index, line] of fs.readFileSync(filePath, 'utf8').split(/\r?\n/).entries()) {
    const match = line.match(/^\s*"([^"]+)"\s+"(.*)"\s*$/);
    if (match) entries.push({ key: match[1], value: match[2], line: index + 1 });
  }
  return { language, entries, byKey: new Map(entries.map((entry) => [entry.key, entry])) };
}

function placeholders(value) {
  return (value.match(/%[A-Za-z0-9_]+%|%s|\{[A-Za-z0-9_]+\}|\$[A-Za-z0-9_]+/g) || []).sort().join(', ');
}

function sectionKeys(file, config) {
  const keys = file.entries.map((entry) => entry.key);
  const start = keys.indexOf(config.startKey);
  const end = keys.indexOf(config.endKey);
  return start < 0 || end < start ? null : keys.slice(start, end + 1);
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

for (const config of completedSections) {
  const [expected, ...others] = files.map((file) => sectionKeys(file, config));
  if (!expected) {
    errors.push(`schinese: cannot find section ${config.name}`);
    continue;
  }
  for (const [index, actual] of others.entries()) {
    const language = files[index + 1].language;
    if (!actual) {
      errors.push(`${language}: cannot find section ${config.name}`);
      continue;
    }
    const position = expected.findIndex((key, i) => key !== actual[i]);
    if (position >= 0 || actual.length !== expected.length) {
      const at = position >= 0 ? position : expected.length;
      errors.push(
        `${language}: ${config.name} key order differs at #${at + 1} (schinese: ${expected[at] || 'end'}; ${language}: ${actual[at] || 'end'})`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[check-localization] ${error}`);
  console.error(`[check-localization] FAILED: ${errors.length} problem(s)`);
  process.exit(1);
}

console.log(
  `[check-localization] OK: ${files.map((file) => `${file.language} ${file.entries.length} keys`).join(', ')}; sections: ${completedSections.map((config) => config.name).join(', ')}`,
);
