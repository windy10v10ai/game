const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPointInfo(language) {
  const localized = {
    '#daily_challenge_reward_source_personal': '个人任务',
    '#daily_challenge_reward_source_global': '共同任务',
    '#daily_challenge_reward_source_streak': '连续完成奖励',
    '#daily_challenge_reward_tier_top': '最高贡献档',
    '#daily_challenge_reward_tier_middle': '中间贡献档',
    '#daily_challenge_reward_tier_base': '基础贡献档',
    '#daily_challenge_reward_history_day': '挑战日 {day}',
    '#daily_challenge_reward_streak_days': '连续完成 {days} 天',
  };
  const dollar = jest.fn(() => ({ id: 'panel_id', style: {} }));
  dollar.Msg = jest.fn();
  dollar.Schedule = jest.fn();
  dollar.Language = () => language;
  dollar.Localize = (key) => localized[key] ?? key;
  const context = {
    $: dollar,
    CustomNetTables: { GetTableValue: jest.fn() },
    GetSteamAccountID: jest.fn(),
  };
  const source = fs.readFileSync(
    path.resolve(__dirname, '../../content/panorama/layout/custom_game/point_info/point_info.js'),
    'utf8',
  );
  vm.runInNewContext(source, context);
  return context;
}

describe('legacy point info daily challenge details', () => {
  it('uses frozen task copy and contribution tier without exposing internal ids', () => {
    const context = loadPointInfo('schinese');
    const display = context.BuildDailyChallengeRewardDisplay({
      dayId: '2026-08-04',
      source: 'global',
      configVersionId: 'internal-config',
      assignmentId: 'internal-assignment',
      contributionTier: 'top',
      taskSnapshot: {
        unit: 'damage',
        target: 500000,
        title: { cn: '共同造成{target}伤害', en: 'Deal {target} damage', ru: '' },
      },
    });

    expect({ ...display }).toEqual({
      source: '共同任务',
      task: '共同造成50万伤害',
      meta: '挑战日 2026-08-04 · 最高贡献档',
    });
    expect(JSON.stringify(display)).not.toContain('internal-config');
    expect(JSON.stringify(display)).not.toContain('internal-assignment');
  });

  it('shows streak days when no task snapshot exists', () => {
    const context = loadPointInfo('schinese');
    expect({
      ...context.BuildDailyChallengeRewardDisplay({
        dayId: '2026-08-04',
        source: 'streak',
        streakDays: 7,
      }),
    }).toEqual({
      source: '连续完成奖励',
      task: '',
      meta: '挑战日 2026-08-04 · 连续完成 7 天',
    });
  });
});
