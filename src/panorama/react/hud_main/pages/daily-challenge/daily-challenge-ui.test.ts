import {
  DailyChallengeRequestTimeout,
  DailyChallengeRetryableActionRequest,
  DailyChallengeViewedRequestState,
  createDailyChallengeRequestId,
  fillGlobalRewardTier,
  formatAutoSyncCountdown,
  formatChallengeValue,
  formatDailyChallengeRoundProgress,
  getChallengeProgressLayers,
  getDailyChallengeEntryIndicator,
  getDailyChallengeAcceptButtonState,
  getDailyChallengeRefreshIntent,
  getDailyChallengeRefreshQuota,
  getDailyChallengeFreeRefreshStateLocalizationKey,
  getDailyChallengeRoundState,
  getDailyChallengeTaskStar,
  getDailyChallengeTaskLocalizationKey,
  getDailyChallengeTaskTitle,
  getDailyChallengeStarVisual,
  getDailyChallengeRewardSourceLocalizationKey,
  getDailyChallengeRewardTaskTitle,
  getDailyChallengeContributionTierLocalizationKey,
  isSuccessfulNetworkBoolean,
  normalizeDailyChallengePlayerSnapshot,
} from './daily-challenge-ui';

describe('daily challenge UI helpers', () => {
  it('shows accept/refresh progress separately from a genuinely closed challenge day', () => {
    expect(getDailyChallengeAcceptButtonState('accept', 'open')).toEqual({
      enabled: false,
      labelKey: '#daily_challenge_accepting',
    });
    expect(getDailyChallengeAcceptButtonState('refresh', 'open')).toEqual({
      enabled: false,
      labelKey: '#daily_challenge_refreshing',
    });
    expect(getDailyChallengeAcceptButtonState(undefined, 'settled')).toEqual({
      enabled: false,
      labelKey: '#daily_challenge_accept_locked',
    });
    expect(getDailyChallengeAcceptButtonState(undefined, 'open')).toEqual({
      enabled: true,
      labelKey: '#daily_challenge_accept',
    });
  });

  it('prioritizes unread reward count over the selection red dot', () => {
    expect(getDailyChallengeEntryIndicator(3, true)).toEqual({ kind: 'count', text: '3' });
    expect(getDailyChallengeEntryIndicator(0, true)).toEqual({ kind: 'dot' });
    expect(getDailyChallengeEntryIndicator(0, false)).toEqual({ kind: 'none' });
  });

  it('resolves task copy through scope and metric localization templates', () => {
    expect(
      getDailyChallengeTaskLocalizationKey({ scope: 'personal_general', metric: 'hero_damage' }),
    ).toBe('#daily_challenge_task_general_hero_damage');
    expect(
      getDailyChallengeTaskLocalizationKey({ scope: 'personal_hero', metric: 'magical_damage' }),
    ).toBe('#daily_challenge_task_hero_magical_damage');
    expect(getDailyChallengeTaskLocalizationKey({ scope: 'global', metric: 'roshan_kills' })).toBe(
      '#daily_challenge_task_global_roshan_kills',
    );
  });

  it('fills localized hero and target placeholders from the task snapshot', () => {
    const localize = (key: string) => {
      if (key === '#daily_challenge_task_hero_magical_damage') {
        return 'Use {hero} to deal {target} magical damage';
      }
      if (key === '#npc_dota_hero_crystal_maiden') return 'Crystal Maiden';
      return key;
    };

    expect(
      getDailyChallengeTaskTitle(
        {
          scope: 'personal_hero',
          metric: 'magical_damage',
          heroName: 'npc_dota_hero_crystal_maiden',
          target: 500000,
          unit: 'damage',
        },
        'english',
        localize,
      ),
    ).toBe('Use Crystal Maiden to deal 500K magical damage');
  });

  it('renders millisecond goals as player-facing seconds', () => {
    expect(formatChallengeValue(300000, 'millisecond', 'schinese')).toBe('300\u79d2');
    expect(formatChallengeValue(300000, 'millisecond', 'english')).toBe('300s');
  });

  it('keeps formal and provisional progress as separate capped bar segments', () => {
    const partial = getChallengeProgressLayers(112000, 34000, 300000);
    expect(partial.formalPercent).toBeCloseTo(112000 / 3000);
    expect(partial.provisionalPercent).toBeCloseTo(34000 / 3000);
    expect(partial.displayedProgress).toBe(146000);

    const capped = getChallengeProgressLayers(290000, 50000, 300000);
    expect(capped.formalPercent).toBeCloseTo(290000 / 3000);
    expect(capped.provisionalPercent).toBeCloseTo(10000 / 3000);
    expect(capped.displayedProgress).toBe(300000);
  });

  it('replaces every repeated round-progress placeholder for player-facing copy', () => {
    expect(
      formatDailyChallengeRoundProgress('? {current}/{total} ? ? ??? {completed}/{total}', 1, 0, 3),
    ).toBe('? 1/3 ? ? ??? 0/3');
  });

  it('formats the next automatic sync as a PC-game countdown', () => {
    expect(formatAutoSyncCountdown(600, 328)).toBe('04:32');
    expect(formatAutoSyncCountdown(600, 601)).toBe('00:00');
  });

  it('accepts Panorama network booleans without treating numeric success as failure', () => {
    expect(isSuccessfulNetworkBoolean(true)).toBe(true);
    expect(isSuccessfulNetworkBoolean(1)).toBe(true);
    expect(isSuccessfulNetworkBoolean(false)).toBe(false);
    expect(isSuccessfulNetworkBoolean(0)).toBe(false);
  });

  it('includes game time and sequence in request ids to avoid hot-reload collisions', () => {
    expect(createDailyChallengeRequestId('refresh', '2026-08-04', 3, 123456, 1)).toBe(
      'dc-refresh-2026-08-04-3-123456-1',
    );
    expect(createDailyChallengeRequestId('refresh', '2026-08-04', 3, 123457, 1)).not.toBe(
      createDailyChallengeRequestId('refresh', '2026-08-04', 3, 123456, 1),
    );
  });

  it('fills global reward tiers from the frozen daily snapshot instead of hardcoded copy', () => {
    expect(fillGlobalRewardTier('前{percent}%  {points}赛季积分', 100, 10)).toBe(
      '前10%  100赛季积分',
    );
    expect(fillGlobalRewardTier('其余贡献玩家  {points}赛季积分', 80)).toBe(
      '其余贡献玩家  80赛季积分',
    );
  });

  it('routes refresh attempts according to membership, balance and lock state', () => {
    expect(
      getDailyChallengeRefreshIntent({ locked: true, isMember: true, cost: 0, balance: 0 }),
    ).toBe('locked');
    expect(
      getDailyChallengeRefreshIntent({ locked: false, isMember: false, cost: 0, balance: 0 }),
    ).toBe('open_member');
    expect(
      getDailyChallengeRefreshIntent({ locked: false, isMember: true, cost: 50, balance: 40 }),
    ).toBe('open_points');
    expect(
      getDailyChallengeRefreshIntent({ locked: false, isMember: true, cost: 50, balance: 50 }),
    ).toBe('refresh');
  });

  it('labels free refresh quota as member-only for non-members', () => {
    expect(getDailyChallengeFreeRefreshStateLocalizationKey(false, false)).toBe(
      '#daily_challenge_refresh_free_member_only',
    );
    expect(getDailyChallengeFreeRefreshStateLocalizationKey(true, true)).toBe(
      '#daily_challenge_refresh_free_available',
    );
    expect(getDailyChallengeFreeRefreshStateLocalizationKey(true, false)).toBe(
      '#daily_challenge_refresh_free_used',
    );
  });

  it('normalizes three-round snapshots while remaining compatible with old array-shaped payloads', () => {
    const normalized = normalizeDailyChallengePlayerSnapshot({
      completedRoundCount: 2,
      currentRound: 3,
      totalRounds: 3,
      completedTasks: {
        1: { assignmentId: 'round-1', star: 1, rewardSeasonPoint: 80 },
        2: { assignmentId: 'round-2', star: 3, rewardSeasonPoint: 120 },
      },
    } as never);

    expect(normalized.completedTasks).toEqual([
      expect.objectContaining({ assignmentId: 'round-1', star: 1 }),
      expect.objectContaining({ assignmentId: 'round-2', star: 3 }),
    ]);
    expect(getDailyChallengeRoundState(normalized)).toEqual({
      completedRoundCount: 2,
      currentRound: 3,
      totalRounds: 3,
      isComplete: false,
    });

    expect(getDailyChallengeRoundState({ completedTasks: [] } as never)).toEqual({
      completedRoundCount: 0,
      currentRound: 1,
      totalRounds: 3,
      isComplete: false,
    });
  });

  it('uses the frozen task star and keeps legacy personal tasks readable as two-star tasks', () => {
    expect(getDailyChallengeTaskStar({ star: 1 } as never)).toBe(1);
    expect(getDailyChallengeTaskStar({ star: 3 } as never)).toBe(3);
    expect(getDailyChallengeTaskStar({ scope: 'personal_general' } as never)).toBe(2);
    expect(getDailyChallengeStarVisual(1)).toBe('★');
    expect(getDailyChallengeStarVisual(3)).toBe('★★★');
  });

  it('shows one daily refresh quota shared by every round instead of resetting per round', () => {
    expect(
      getDailyChallengeRefreshQuota({
        isMember: true,
        freeRefreshAvailable: false,
        paidRefreshesUsed: 2,
        paidRefreshesRemaining: 3,
        nextCostMemberPoint: 10,
      }),
    ).toEqual({
      freeRefreshAvailable: false,
      paidRefreshesUsed: 2,
      paidRefreshesRemaining: 3,
      paidRefreshLimit: 5,
    });
  });

  it('marks the day complete only after all three personal rounds are finished', () => {
    expect(
      getDailyChallengeRoundState({
        completedRoundCount: 3,
        currentRound: 3,
        totalRounds: 3,
        completedTasks: [],
      } as never),
    ).toEqual({ completedRoundCount: 3, currentRound: 3, totalRounds: 3, isComplete: true });
  });

  it('only resolves the matching pending request and releases it after timeout', () => {
    let scheduled: (() => void) | undefined;
    const cancel = jest.fn();
    const tracker = new DailyChallengeRequestTimeout((_seconds, callback) => {
      scheduled = callback;
      return 77;
    }, cancel);
    const timedOut = jest.fn();

    tracker.start('request-1', timedOut);

    expect(tracker.isActive('request-1')).toBe(true);
    expect(tracker.finish('another-request')).toBe(false);
    expect(cancel).not.toHaveBeenCalled();

    scheduled?.();

    expect(timedOut).toHaveBeenCalledTimes(1);
    expect(tracker.isActive('request-1')).toBe(false);
    expect(tracker.finish('request-1')).toBe(false);
  });

  it('cancels the timeout when the matching request finishes', () => {
    const cancel = jest.fn();
    const tracker = new DailyChallengeRequestTimeout(() => 88, cancel);

    tracker.start('request-2', jest.fn());

    expect(tracker.finish('request-2')).toBe(true);
    expect(cancel).toHaveBeenCalledWith(88);
    expect(tracker.isActive('request-2')).toBe(false);
  });
  it('reuses the same refresh request id after a timeout until the operation is resolved', () => {
    const state = new DailyChallengeRetryableActionRequest();
    const create = jest
      .fn()
      .mockReturnValueOnce('refresh-request-1')
      .mockReturnValueOnce('refresh-request-2');

    expect(state.getOrCreate('refresh', '2026-08-04', create)).toBe('refresh-request-1');
    expect(state.getOrCreate('refresh', '2026-08-04', create)).toBe('refresh-request-1');
    expect(create).toHaveBeenCalledTimes(1);

    expect(state.resolve('refresh-request-1')).toBe(true);
    expect(state.getOrCreate('refresh', '2026-08-04', create)).toBe('refresh-request-2');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('only confirms reward viewing after server success and allows the same key to retry on failure', () => {
    const state = new DailyChallengeViewedRequestState();

    expect(state.begin('2026-08-04:2', 'view-request-1')).toBe(true);
    expect(state.begin('2026-08-04:2', 'view-request-duplicate')).toBe(false);
    expect(state.finish('view-request-1', false)).toEqual({ matched: true, shouldRetry: true });
    expect(state.begin('2026-08-04:2', 'view-request-2')).toBe(true);
    expect(state.finish('view-request-2', true)).toEqual({ matched: true, shouldRetry: false });
    expect(state.begin('2026-08-04:2', 'view-request-3')).toBe(false);
    expect(state.begin('2026-08-04:3', 'view-request-4')).toBe(true);
  });
  it('uses game localization templates for player-facing reward history titles', () => {
    expect(
      getDailyChallengeRewardTaskTitle(
        {
          rewardId: 'reward-1',
          dayId: '2026-08-04',
          source: 'personal',
          seasonPoint: 100,
          createdAt: '2026-08-05T00:00:00.000Z',
          taskSnapshot: {
            assignmentId: 'assignment-1',
            taskId: 'damage-1',
            scope: 'personal_general',
            metric: 'hero_damage',
            unit: 'damage',
            target: 500000,
            progress: 500000,
            rewardSeasonPoint: 100,
          },
        },
        'schinese',
        (key) =>
          key === '#daily_challenge_task_general_hero_damage'
            ? '累计对敌方 Bot 造成{target}伤害'
            : key,
      ),
    ).toBe('累计对敌方 Bot 造成50万伤害');
    expect(
      getDailyChallengeRewardTaskTitle(
        {
          rewardId: 'reward-2',
          dayId: '2026-08-04',
          source: 'streak',
          seasonPoint: 50,
          createdAt: '2026-08-05T00:00:00.000Z',
        },
        'english',
        (key) => key,
      ),
    ).toBe('');
  });
  it('maps reward history sources and global contribution tiers to player-facing localization keys', () => {
    expect(getDailyChallengeRewardSourceLocalizationKey('personal')).toBe(
      '#daily_challenge_reward_source_personal',
    );
    expect(getDailyChallengeRewardSourceLocalizationKey('global')).toBe(
      '#daily_challenge_reward_source_global',
    );
    expect(getDailyChallengeRewardSourceLocalizationKey('streak')).toBe(
      '#daily_challenge_reward_source_streak',
    );
    expect(getDailyChallengeContributionTierLocalizationKey('top')).toBe(
      '#daily_challenge_reward_tier_top',
    );
    expect(getDailyChallengeContributionTierLocalizationKey('middle')).toBe(
      '#daily_challenge_reward_tier_middle',
    );
    expect(getDailyChallengeContributionTierLocalizationKey('base')).toBe(
      '#daily_challenge_reward_tier_base',
    );
  });
});
