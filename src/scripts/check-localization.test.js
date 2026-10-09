const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const languages = ['schinese', 'english', 'russian'];
let root;
let script;
let lines;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'windy-localization-'));
  fs.mkdirSync(path.join(root, 'src', 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'game', 'resource'), { recursive: true });
  script = path.join(root, 'src', 'scripts', 'check-localization.js');
  fs.copyFileSync(path.join(__dirname, 'check-localization.js'), script);
  lines = languages.map((language) => {
    const russian = language === 'russian';
    return [
      '"lang"',
      '{',
      `"Language" "${language}"`,
      '"Tokens"',
      '{',
      '"addon_game_name" "Windy"',
      '"dailytask_task_hero_stun_duration" "Оглушение {target}"',
      '"DOTA_Tooltip_modifier_tower_power" "Усиление строений"',
      '// 战斗效果',
      '',
      '"DOTA_Tooltip_modifier_tower_power_Description" "Урон: <font color=\'#FFFFFF\'>%damage%</font>"',
      '"DOTA_Tooltip_ability_creep_buff_bonus_damage" "+$damage"',
      '"dota_item_build_windy_range_items" "Предметы для дальнего боя"',
      `"DOTA_Tooltip_modifier_global_newbie" "${russian ? 'Защита новичка' : 'Newbie Protection'}"`,
      '// 玩家BUFF',
      '',
      '"DOTA_Tooltip_modifier_global_newbie_Description" "<br>Здоровье: %health%"',
      '"DOTA_Tooltip_modifier_global_member_normal_Description" "Обычная подписка"',
      '// 会员',
      '"DOTA_Tooltip_modifier_global_member_premium" "Премиум-подписка"',
      '"DOTA_Tooltip_modifier_global_member_premium_Description" "Бонус %damage%"',
      '// 定制称号',
      '"DOTA_Tooltip_modifier_player_lumao" "定制称号"',
      '"DOTA_Tooltip_modifier_player_nemesis_Description" "开服限定称号"',
      '}',
      '}',
    ];
  });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function run() {
  for (const [index, language] of languages.entries()) {
    fs.writeFileSync(
      path.join(root, 'game', 'resource', `addon_${language}.txt`),
      lines[index].join('\r\n'),
    );
  }
  return spawnSync(process.execPath, [script], { encoding: 'utf8' });
}

function replace(language, oldText, newText) {
  const index = languages.indexOf(language);
  lines[index] = lines[index].map((line) => line.replace(oldText, newText));
}

test('accepts copied Chinese titles and pure numeric labels', () => {
  const result = run();
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});

test('rejects a missing world translation', () => {
  lines[2] = lines[2].filter((line) => !line.includes('tower_power_Description'));
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/structure differs/);
});

test('rejects an untranslated Russian world label', () => {
  replace('russian', 'Усиление строений', 'Building Power');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/tower_power has no Cyrillic text/);
});

test('rejects a missing world section boundary', () => {
  lines[2] = lines[2].filter((line) => !line.includes('dota_item_build_windy_range_items'));
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/cannot find completed section/);
});

test('rejects mismatched world comments', () => {
  replace('english', '// 战斗效果', '// World effects');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/structure differs/);
});

test('rejects mismatched world blank lines', () => {
  lines[1].splice(lines[1].indexOf('// 战斗效果') + 1, 1);
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/structure differs/);
});

test('rejects mismatched world tags', () => {
  replace('russian', '</font>', '</font><br>');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/tag sequence mismatch/);
});

test('rejects a missing copied buff description', () => {
  lines[2] = lines[2].filter((line) => !line.includes('global_newbie_Description'));
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/structure differs/);
});

test('still rejects mismatched placeholders in copied buffs', () => {
  replace('russian', '%health%', '%mana%');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/placeholder mismatch/);
});

test('still rejects mismatched tags in copied buffs', () => {
  replace('russian', '<br>Здоровье: %health%', 'Здоровье: %health%');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/tag sequence mismatch/);
});

test('still rejects duplicate keys', () => {
  lines[2].splice(8, 0, '"DOTA_Tooltip_modifier_tower_power" "Усиление"');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/duplicate key/);
});

test('rejects copied Chinese premium membership names', () => {
  replace('russian', 'Премиум-подписка', '高级会员BUFF');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/global_member_premium has no Cyrillic text/);
});

test('rejects untranslated premium membership descriptions', () => {
  replace('russian', 'Бонус %damage%', 'Bonus %damage%');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/global_member_premium_Description has no Cyrillic text/);
});

test('rejects copied Chinese newbie protection names', () => {
  replace('russian', 'Защита новичка', '新手保护');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/global_newbie has no Cyrillic text/);
});

test('rejects untranslated regular membership descriptions', () => {
  replace('russian', 'Обычная подписка', 'Regular membership');
  const result = run();
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/global_member_normal_Description has no Cyrillic text/);
});
