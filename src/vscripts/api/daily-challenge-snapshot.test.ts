import { DailyChallengePlayerSnapshotDto } from '../../common/dto/daily-challenge';
import { DailyChallengeMatchContext } from '../modules/daily-challenge/daily-challenge-match-context';
import {
  applyDailyChallengeMatchStart,
  DailyChallengePlayerSnapshotStore,
  indexDailyChallengeSnapshots,
  initializeDailyChallengeMatchContext,
} from './daily-challenge-snapshot';

const snapshot = {
  schemaVersion: 2,
  steamId: 483215844,
  dayId: '2026-08-04',
  status: 'open',
  startsAt: '2026-08-03T16:00:00.000Z',
  endsAt: '2026-08-04T16:00:00.000Z',
  updatedAt: '2026-08-04T01:00:00.000Z',
  globalRewardTiers: {
    topPercent: 10,
    middlePercent: 30,
    topRewardSeasonPoint: 100,
    middleRewardSeasonPoint: 90,
    baseRewardSeasonPoint: 80,
  },
  candidates: [],
  unreadRewardCount: 0,
  recentRewards: [],
  needsSelection: true,
  streak: {
    currentDays: 0,
    cycleTargetDays: 30,
    nextMilestoneDays: 3,
    nextMilestoneRewardSeasonPoint: 50,
  },
  refresh: {
    isMember: true,
    freeRefreshAvailable: true,
    paidRefreshesUsed: 0,
    paidRefreshesRemaining: 5,
    nextCostMemberPoint: 10,
  },
} as DailyChallengePlayerSnapshotDto;

describe('DailyChallengePlayerSnapshotStore', () => {
  it('keeps each Steam account snapshot isolated in the server-only cache', () => {
    const store = new DailyChallengePlayerSnapshotStore();
    const otherSnapshot = { ...snapshot, steamId: 999999999 };

    store.set('483215844', snapshot);
    store.set('999999999', otherSnapshot);

    expect(store.get('483215844')).toEqual(snapshot);
    expect(store.get('999999999')).toEqual(otherSnapshot);
    expect(store.get('missing')).toBeUndefined();
  });

  it('seeds all snapshots returned by game start without exposing a shared Net Table', () => {
    const store = new DailyChallengePlayerSnapshotStore();
    const otherSnapshot = { ...snapshot, steamId: 999999999 };

    store.seed([snapshot, otherSnapshot]);

    expect(store.get('483215844')).toEqual(snapshot);
    expect(store.get('999999999')).toEqual(otherSnapshot);
  });

  it('rejects an older async response from the same challenge day', () => {
    const store = new DailyChallengePlayerSnapshotStore();
    const acceptedSnapshot = {
      ...snapshot,
      updatedAt: '2026-08-04T01:05:00.000Z',
      needsSelection: false,
      acceptedTask: {
        assignmentId: 'assignment-latest',
        taskId: 'damage-latest',
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        target: 500000,
        progress: 0,
        rewardSeasonPoint: 100,
      },
    } as DailyChallengePlayerSnapshotDto;

    expect(store.set('483215844', acceptedSnapshot)).toBe(true);
    expect(store.set('483215844', snapshot)).toBe(false);
    expect(store.get('483215844')).toEqual(acceptedSnapshot);
  });

  it('rejects a previous challenge-day response even if it arrives later', () => {
    const store = new DailyChallengePlayerSnapshotStore();
    const nextDaySnapshot = {
      ...snapshot,
      dayId: '2026-08-05',
      updatedAt: '2026-08-05T00:00:00.000Z',
    };

    expect(store.set('483215844', nextDaySnapshot)).toBe(true);
    expect(
      store.set('483215844', {
        ...snapshot,
        updatedAt: '2026-08-06T00:00:00.000Z',
      }),
    ).toBe(false);
    expect(store.get('483215844')).toEqual(nextDaySnapshot);
  });
});

describe('indexDailyChallengeSnapshots', () => {
  it('keeps old game/start responses compatible when the optional field is absent', () => {
    expect(indexDailyChallengeSnapshots(undefined).size).toBe(0);
  });

  it('indexes snapshots by Steam account id for player-specific Net Tables', () => {
    const indexed = indexDailyChallengeSnapshots([snapshot]);

    expect(indexed.get('483215844')).toEqual(snapshot);
  });
});

describe('initializeDailyChallengeMatchContext', () => {
  it('locks the match context to the challenge day from the game/start snapshot', () => {
    const context = new DailyChallengeMatchContext();

    initializeDailyChallengeMatchContext([snapshot], context, 0);

    expect(context.getDayId()).toBe('2026-08-04');
  });

  it('keeps the server-recorded match start timestamp for game/end attribution', () => {
    const context = new DailyChallengeMatchContext();

    initializeDailyChallengeMatchContext([snapshot], context, 0, '2026-08-04T01:00:00.000Z');

    expect(context.getMatchStartedAt()).toBe('2026-08-04T01:00:00.000Z');
  });
  it('registers a task accepted before this match with a zero baseline', () => {
    const context = new DailyChallengeMatchContext();
    const acceptedSnapshot = {
      ...snapshot,
      needsSelection: false,
      acceptedTask: {
        assignmentId: 'assignment-accepted',
        taskId: 'damage-accepted',
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        target: 500000,
        progress: 0,
        rewardSeasonPoint: 100,
      },
    } as DailyChallengePlayerSnapshotDto;

    initializeDailyChallengeMatchContext([acceptedSnapshot], context, 0);

    expect(context.getAcceptedState(483215844)).toMatchObject({
      assignmentId: 'assignment-accepted',
      acceptedAtGameTime: 0,
      eligibleForCurrentMatch: true,
      baseline: {},
    });
    expect(context.getMetricDelta(483215844, 'hero_damage', 250000)).toBe(250000);
  });

  it('leaves the match context untouched when game/start has no challenge snapshots', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('existing-day', 0);

    initializeDailyChallengeMatchContext(undefined, context, 0);

    expect(context.getDayId()).toBe('existing-day');
  });
});

describe('applyDailyChallengeMatchStart', () => {
  it('replaces a setup-day snapshot when the real match start crosses the daily boundary', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-03', -120, '2026-08-03T23:58:00.000Z');
    const setSnapshot = jest.fn();
    const nextDaySnapshot = { ...snapshot, dayId: '2026-08-04' };

    applyDailyChallengeMatchStart(
      {
        dayId: '2026-08-04',
        matchStartedAt: '2026-08-04T00:00:05.000Z',
        dailyChallenges: [nextDaySnapshot],
      },
      context,
      0,
      setSnapshot,
    );

    expect(context.getDayId()).toBe('2026-08-04');
    expect(context.getMatchStartedAt()).toBe('2026-08-04T00:00:05.000Z');
    expect(context.isMatchStartConfirmed()).toBe(true);
    expect(setSnapshot).toHaveBeenCalledWith('483215844', nextDaySnapshot);
  });

  it('does not restore an accepted task from a snapshot rejected as stale', () => {
    const context = new DailyChallengeMatchContext();
    const staleAcceptedSnapshot = {
      ...snapshot,
      needsSelection: false,
      acceptedTask: {
        assignmentId: 'assignment-stale',
        taskId: 'damage-stale',
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        target: 500000,
        progress: 0,
        rewardSeasonPoint: 100,
      },
    } as DailyChallengePlayerSnapshotDto;

    applyDailyChallengeMatchStart(
      {
        dayId: '2026-08-04',
        matchStartedAt: '2026-08-04T00:00:05.000Z',
        dailyChallenges: [staleAcceptedSnapshot],
      },
      context,
      0,
      () => false,
    );

    expect(context.getAcceptedState(483215844)).toBeUndefined();
  });

  it('ignores a delayed match-start response from an older challenge day', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-05', 0, '2026-08-05T00:00:00.000Z');
    context.confirmMatchStart('2026-08-05', 0, '2026-08-05T00:00:05.000Z');
    context.recordAcceptance(483215844, 'current-day-assignment', 30, { hero_damage: 1000 });
    const setSnapshot = jest.fn();

    applyDailyChallengeMatchStart(
      {
        dayId: '2026-08-04',
        matchStartedAt: '2026-08-04T00:01:00.000Z',
        dailyChallenges: [snapshot],
      },
      context,
      60,
      setSnapshot,
    );

    expect(context.getDayId()).toBe('2026-08-05');
    expect(context.getMatchStartedAt()).toBe('2026-08-05T00:00:05.000Z');
    expect(context.getAcceptedState(483215844)?.assignmentId).toBe('current-day-assignment');
    expect(setSnapshot).not.toHaveBeenCalled();
  });
  it('restores accepted tasks from the confirmed match-start snapshot into the match context', () => {
    const context = new DailyChallengeMatchContext();
    const setSnapshot = jest.fn();
    const acceptedSnapshot = {
      ...snapshot,
      needsSelection: false,
      acceptedTask: {
        assignmentId: 'assignment-confirmed',
        taskId: 'damage-confirmed',
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        target: 500000,
        progress: 125000,
        rewardSeasonPoint: 100,
      },
    } as DailyChallengePlayerSnapshotDto;

    applyDailyChallengeMatchStart(
      {
        dayId: '2026-08-04',
        matchStartedAt: '2026-08-04T00:00:05.000Z',
        dailyChallenges: [acceptedSnapshot],
      },
      context,
      0,
      setSnapshot,
    );

    expect(context.getAcceptedState(483215844)).toMatchObject({
      assignmentId: 'assignment-confirmed',
      acceptedAtGameTime: 0,
      eligibleForCurrentMatch: true,
      baseline: {},
    });
    expect(context.getMetricDelta(483215844, 'hero_damage', 250000)).toBe(250000);
  });
});
