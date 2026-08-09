const fs = require('fs');
const path = require('path');

const resourceRoot = path.resolve(__dirname, '../../../../../../game/resource');
const localizationFiles = ['addon_schinese.txt', 'addon_english.txt', 'addon_russian.txt'];
const expectedLanguageScript = {
  'addon_schinese.txt': /[\u4e00-\u9fff]/,
  'addon_english.txt': /[A-Za-z]/,
  'addon_russian.txt': /[\u0400-\u04ff]/,
};
const requiredKeys = [
  'daily_challenge_day',
  'daily_challenge_season_points',
  'daily_challenge_tab_today',
  'daily_challenge_tab_streak',
  'daily_challenge_tab_rewards',
  'daily_challenge_tab_rules',
  'daily_challenge_choose_one',
  'daily_challenge_round_progress',
  'daily_challenge_round_complete',
  'daily_challenge_personal_complete',
  'daily_challenge_personal_complete_summary',
  'daily_challenge_completed_task_reward',
  'daily_challenge_star_label',
  'daily_challenge_sync_progress',
  'daily_challenge_syncing',
  'daily_challenge_auto_sync',
  'daily_challenge_settlement_hint',
  'daily_challenge_task_reward_hint',
  'daily_challenge_progress_formal',
  'daily_challenge_progress_provisional',
  'daily_challenge_progress_target',
  'daily_challenge_streak_rule_title',
  'daily_challenge_streak_rule_body',
  'daily_challenge_rules_title',
  'daily_challenge_rule_1',
  'daily_challenge_rule_2',
  'daily_challenge_rule_3',
  'daily_challenge_rule_4',
  'daily_challenge_rule_5',
  'daily_challenge_rule_6',
  'daily_challenge_refresh_quota',
  'daily_challenge_refresh_free_available',
  'daily_challenge_refresh_free_used',
  'daily_challenge_refresh_free_member_only',
  'daily_challenge_end_screen_detail',
  'daily_challenge_end_screen_total_points',
  'daily_challenge_end_screen_match_points',
  'daily_challenge_end_screen_challenge_points',
  'daily_challenge_end_screen_conduct_modifier',
  'daily_challenge_action_synced',
  'daily_challenge_action_auto_synced',
  'daily_challenge_action_accepted_task_unavailable',
];

const taskTemplateMetrics = {
  general: [
    'hero_damage',
    'physical_damage',
    'magical_damage',
    'pure_damage',
    'damage_taken',
    'healing',
    'kills',
    'assists',
    'last_hits',
    'tower_kills',
    'bot_kills',
    'roshan_kills',
    'stun_duration_ms',
    'slow_duration_ms',
    'root_duration_ms',
    'silence_duration_ms',
    'taunt_duration_ms',
    'break_duration_ms',
    'debuff_duration_ms',
  ],
  global: ['bot_kills', 'roshan_kills', 'tower_kills', 'hero_damage'],
  hero: [
    'magical_damage',
    'stun_duration_ms',
    'physical_damage',
    'healing',
    'damage_taken',
    'slow_duration_ms',
    'assists',
    'debuff_duration_ms',
    'hero_damage',
    'root_duration_ms',
    'kills',
    'silence_duration_ms',
    'tower_kills',
    'pure_damage',
    'bot_kills',
    'taunt_duration_ms',
  ],
};
const requiredTaskTemplateKeys = Object.entries(taskTemplateMetrics).flatMap(([scope, metrics]) =>
  metrics.map((metric) => `daily_challenge_task_${scope}_${metric}`),
);

describe('daily challenge localization contract', () => {
  test.each(localizationFiles)('%s contains every player-facing PC layout token', (fileName) => {
    const text = fs.readFileSync(path.join(resourceRoot, fileName), 'utf8');

    for (const key of requiredKeys) {
      const tokenLine = text.match(new RegExp(`^[\\t ]*"${key}"[\\t ]+"[^"\\r\\n]+"[\\t ]*$`, 'm'));
      expect(tokenLine).not.toBeNull();
      expect(tokenLine?.[0]).toMatch(expectedLanguageScript[fileName]);
      expect(tokenLine?.[0]).not.toContain('???');
    }
  });

  test.each(localizationFiles)(
    '%s contains the 39 task templates with required placeholders',
    (fileName) => {
      const text = fs.readFileSync(path.join(resourceRoot, fileName), 'utf8');

      for (const key of requiredTaskTemplateKeys) {
        const tokenLine = text.match(new RegExp(`^[\t ]*"${key}"[\t ]+"([^"\r\n]+)"[\t ]*$`, 'm'));
        expect(tokenLine).not.toBeNull();
        expect(tokenLine?.[1]).toContain('{target}');
        expect(tokenLine?.[1]).not.toContain('???');
        if (key.startsWith('daily_challenge_task_hero_')) {
          expect(tokenLine?.[1]).toContain('{hero}');
        }
      }
    },
  );

  test.each(localizationFiles)('%s keeps one localization token per line', (fileName) => {
    const text = fs.readFileSync(path.join(resourceRoot, fileName), 'utf8');
    const malformedLines = text
      .split(/\r?\n/)
      .filter((line) => /"daily_challenge_[^"]+"/.test(line))
      .filter((line) => (line.match(/"daily_challenge_[^"]+"/g) ?? []).length > 1);

    expect(malformedLines).toEqual([]);
  });

  it('keeps the complete daily_challenge key set identical in all three languages', () => {
    const keySets = localizationFiles.map((fileName) => {
      const text = fs.readFileSync(path.join(resourceRoot, fileName), 'utf8');
      return [...text.matchAll(/^[\t ]*"(daily_challenge_[^"]+)"/gm)]
        .map((match) => match[1])
        .sort();
    });

    expect(keySets[1]).toEqual(keySets[0]);
    expect(keySets[2]).toEqual(keySets[0]);
  });

  test.each(localizationFiles)(
    '%s documents three rounds, random stars and automatic rewards',
    (fileName) => {
      const text = fs.readFileSync(path.join(resourceRoot, fileName), 'utf8');
      expect(text).toMatch(/"daily_challenge_rule_1"[^\r\n]*3/);
      expect(text).toMatch(/"daily_challenge_rule_2"[^\r\n]*(1|2|3)/);
      expect(text).toMatch(/"daily_challenge_rule_3"[^\r\n]*(80|100|120)/);
    },
  );
});
