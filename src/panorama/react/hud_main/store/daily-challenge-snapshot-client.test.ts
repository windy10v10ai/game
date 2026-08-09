import { DailyChallengePlayerSnapshotDto } from '../../../../common/dto/daily-challenge';
import {
  DailyChallengeActionResultChannel,
  DailyChallengeNetworkActionResult,
  DailyChallengeSnapshotClient,
  DailyChallengeSnapshotClientDependencies,
} from './daily-challenge-snapshot-client';

const createNetworkSnapshot = () =>
  ({
    schemaVersion: 2,
    steamId: 483215844,
    dayId: '2026-08-04',
    status: 'open',
    startsAt: '2026-08-03T16:00:00.000Z',
    endsAt: '2026-08-04T16:00:00.000Z',
    globalRewardTiers: {
      topPercent: 10,
      middlePercent: 30,
      topRewardSeasonPoint: 100,
      middleRewardSeasonPoint: 90,
      baseRewardSeasonPoint: 80,
    },
    completedRoundCount: 1,
    currentRound: 2,
    totalRounds: 3,
    completedTasks: {
      1: {
        assignmentId: 'completed-assignment-1',
        taskId: 'completed-damage-1',
        revision: 1,
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        star: 1,
        title: { cn: '??', en: 'Damage', ru: '????' },
        description: { cn: '????', en: 'Deal damage', ru: '??????? ????' },
        target: 250000,
        progress: 250000,
        rewardSeasonPoint: 80,
      },
    },
    candidates: {
      1: {
        assignmentId: 'assignment-1',
        taskId: 'damage-1',
        revision: 1,
        scope: 'personal_general',
        metric: 'hero_damage',
        unit: 'damage',
        title: { cn: '伤害', en: 'Damage', ru: 'Урон' },
        description: { cn: '造成伤害', en: 'Deal damage', ru: 'Нанести урон' },
        target: 500000,
        progress: 0,
        star: 3,
        rewardSeasonPoint: 120,
      },
    },
    unreadRewardCount: 0,
    recentRewards: {},
    needsSelection: 1,
    streak: {
      currentDays: 0,
      cycleTargetDays: 30,
      nextMilestoneDays: 3,
      nextMilestoneRewardSeasonPoint: 50,
    },
    refresh: {
      isMember: 1,
      freeRefreshAvailable: 1,
      paidRefreshesUsed: 0,
      paidRefreshesRemaining: 5,
      nextCostMemberPoint: 10,
    },
  }) as unknown as Record<string, unknown>;

const createHarness = () => {
  const calls: string[] = [];
  const snapshots: DailyChallengePlayerSnapshotDto[] = [];
  const errors: string[] = [];
  let listener: ((data: DailyChallengeNetworkActionResult) => void) | undefined;
  let scheduled: (() => void) | undefined;
  const deps: DailyChallengeSnapshotClientDependencies = {
    subscribe: (nextListener) => {
      calls.push('subscribe');
      listener = nextListener;
      return 42;
    },
    unsubscribe: (id) => calls.push(`unsubscribe:${id}`),
    sendSnapshotRequest: (requestId) => calls.push(`request:${requestId}`),
    createRequestId: () => 'snapshot-request-1',
    scheduleTimeout: (callback) => {
      scheduled = callback;
      return 7;
    },
    cancelTimeout: (id) => calls.push(`cancel:${id}`),
    onSnapshot: (snapshot) => snapshots.push(snapshot),
    onLoadError: (code) => errors.push(code),
  };
  const client = new DailyChallengeSnapshotClient(deps);
  return {
    calls,
    snapshots,
    errors,
    client,
    emit: (data: DailyChallengeNetworkActionResult) => listener?.(data),
    timeout: () => scheduled?.(),
  };
};

describe('DailyChallengeSnapshotClient', () => {
  it('subscribes before requesting the initial private snapshot', () => {
    const harness = createHarness();

    harness.client.start();

    expect(harness.calls.slice(0, 2)).toEqual(['subscribe', 'request:snapshot-request-1']);
  });

  it('normalizes a private event snapshot and publishes it to the shared UI state', () => {
    const harness = createHarness();
    harness.client.start();

    harness.emit({
      action: 'snapshot',
      requestId: 'snapshot-request-1',
      success: 1,
      code: 'snapshot',
      snapshot: createNetworkSnapshot(),
    });

    expect(harness.snapshots[0]).toMatchObject({
      steamId: 483215844,
      needsSelection: true,
      completedRoundCount: 1,
      currentRound: 2,
      totalRounds: 3,
      candidates: [{ assignmentId: 'assignment-1', star: 3, rewardSeasonPoint: 120 }],
      recentRewards: [],
      refresh: { isMember: true, freeRefreshAvailable: true },
    });
    expect(harness.calls).toContain('cancel:7');
    expect(harness.errors.filter(Boolean)).toHaveLength(0);
  });

  it('accepts updated snapshots attached to accept, refresh, and view results', () => {
    const harness = createHarness();
    harness.client.start();

    for (const action of ['accept', 'refresh', 'view'] as const) {
      harness.emit({
        action,
        requestId: `${action}-1`,
        success: 1,
        code: `${action}ed`,
        snapshot: createNetworkSnapshot(),
      });
    }

    expect(harness.snapshots).toHaveLength(3);
  });

  it('rejects an older same-day snapshot that arrives after a newer accept result', () => {
    const harness = createHarness();
    harness.client.start();
    const acceptedTask = {
      assignmentId: 'assignment-2',
      taskId: 'damage-2',
      revision: 1,
      scope: 'personal_general',
      metric: 'hero_damage',
      unit: 'damage',
      star: 3,
      title: { cn: 'Damage', en: 'Damage', ru: 'Damage' },
      description: { cn: 'Deal damage', en: 'Deal damage', ru: 'Deal damage' },
      target: 500000,
      progress: 0,
      rewardSeasonPoint: 120,
    };

    harness.emit({
      action: 'accept',
      requestId: 'accept-2',
      success: 1,
      code: 'accepted',
      snapshot: {
        ...createNetworkSnapshot(),
        updatedAt: '2026-08-04T03:00:00.000Z',
        acceptedTask,
        needsSelection: 0,
      },
    });
    harness.emit({
      action: 'snapshot',
      requestId: 'snapshot-request-1',
      success: 1,
      code: 'snapshot',
      snapshot: {
        ...createNetworkSnapshot(),
        updatedAt: '2026-08-04T02:00:00.000Z',
      },
    });

    expect(harness.snapshots).toHaveLength(1);
    expect(harness.snapshots[0]).toMatchObject({
      updatedAt: '2026-08-04T03:00:00.000Z',
      acceptedTask: { assignmentId: 'assignment-2' },
    });
  });

  it('accepts a snapshot from a newer challenge day even when its updatedAt is earlier', () => {
    const harness = createHarness();
    harness.client.start();

    harness.emit({
      action: 'accept',
      requestId: 'accept-current-day',
      success: 1,
      code: 'accepted',
      snapshot: {
        ...createNetworkSnapshot(),
        dayId: '2026-08-04',
        updatedAt: '2026-08-04T15:00:00.000Z',
      },
    });
    harness.emit({
      action: 'snapshot',
      requestId: 'snapshot-request-1',
      success: 1,
      code: 'snapshot',
      snapshot: {
        ...createNetworkSnapshot(),
        dayId: '2026-08-05',
        startsAt: '2026-08-04T16:00:00.000Z',
        endsAt: '2026-08-05T16:00:00.000Z',
        updatedAt: '2026-08-04T16:00:01.000Z',
      },
    });

    expect(harness.snapshots).toHaveLength(2);
    expect(harness.snapshots[1].dayId).toBe('2026-08-05');
  });

  it('accepts same-version temporary progress updates with an equal updatedAt', () => {
    const harness = createHarness();
    harness.client.start();
    const updatedAt = '2026-08-04T03:00:00.000Z';

    harness.emit({
      action: 'accept',
      requestId: 'accept-progress',
      success: 1,
      code: 'accepted',
      snapshot: {
        ...createNetworkSnapshot(),
        updatedAt,
        currentMatchProgress: { provisionalProgress: 100000 },
      },
    });
    harness.emit({
      action: 'sync',
      requestId: 'sync-progress',
      success: 1,
      code: 'progress_synced',
      snapshot: {
        ...createNetworkSnapshot(),
        updatedAt,
        currentMatchProgress: { provisionalProgress: 200000 },
      },
    });

    expect(harness.snapshots).toHaveLength(2);
    expect(harness.snapshots[1].currentMatchProgress).toMatchObject({
      provisionalProgress: 200000,
    });
  });

  it('reports snapshot failures and timeouts without discarding future retries', () => {
    const harness = createHarness();
    harness.client.start();

    harness.emit({
      action: 'snapshot',
      requestId: 'snapshot-request-1',
      success: 0,
      code: 'request_failed',
    });
    harness.client.requestSnapshot();
    harness.timeout();

    expect(harness.errors.filter(Boolean)).toEqual(['request_failed', 'request_timeout']);
    expect(harness.calls.filter((call) => call.startsWith('request:'))).toHaveLength(2);
  });

  it('clears the remembered snapshot when disposed so a restarted instance can load fresh state', () => {
    const harness = createHarness();
    harness.client.start();
    harness.emit({
      action: 'accept',
      requestId: 'accept-before-dispose',
      success: 1,
      code: 'accepted',
      snapshot: {
        ...createNetworkSnapshot(),
        updatedAt: '2026-08-04T03:00:00.000Z',
      },
    });

    harness.client.dispose();
    harness.client.start();
    harness.emit({
      action: 'snapshot',
      requestId: 'snapshot-request-1',
      success: 1,
      code: 'snapshot',
      snapshot: createNetworkSnapshot(),
    });

    expect(harness.snapshots).toHaveLength(2);
  });

  it('unsubscribes and cancels the active timeout when disposed', () => {
    const harness = createHarness();
    harness.client.start();

    harness.client.dispose();

    expect(harness.calls).toContain('unsubscribe:42');
    expect(harness.calls).toContain('cancel:7');
  });
});

describe('DailyChallengeActionResultChannel', () => {
  it('fans out one upstream result and replays it once to a late page subscriber', () => {
    const channel = new DailyChallengeActionResultChannel();
    const first = jest.fn();
    const late = jest.fn();
    const result: DailyChallengeNetworkActionResult = {
      action: 'refresh',
      requestId: 'refresh-request-1',
      success: 1,
      code: 'refreshed',
      snapshot: createNetworkSnapshot(),
    };

    const unsubscribeFirst = channel.subscribe(first);
    channel.publish(result);
    const unsubscribeLate = channel.subscribe(late);

    expect(first).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(result);
    expect(late).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledWith(result);

    unsubscribeFirst();
    unsubscribeLate();
    channel.publish({ ...result, requestId: 'refresh-request-2' });

    expect(first).toHaveBeenCalledTimes(1);
    expect(late).toHaveBeenCalledTimes(1);
  });
});
