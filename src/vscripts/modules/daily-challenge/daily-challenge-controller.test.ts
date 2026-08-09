jest.mock('../../api/api-client', () => ({
  ApiClient: { sendWithRetry: jest.fn() },
  HttpMethod: { GET: 'GET', POST: 'POST', PUT: 'PUT', DELETE: 'DELETE' },
}));

import type { ApiParameter } from '../../api/api-client';
import { HttpMethod } from '../../api/api-client';
import { DailyChallengePlayerSnapshotDto } from '../../../common/dto/daily-challenge';
import {
  DailyChallengeController,
  DailyChallengeControllerDependencies,
} from './daily-challenge-controller';
import { DailyChallengeMatchContext } from './daily-challenge-match-context';

const createSnapshot = (): DailyChallengePlayerSnapshotDto => ({
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
  candidates: [
    {
      assignmentId: 'assignment-1',
      taskId: 'damage-1',
      revision: 1,
      scope: 'personal_general',
      metric: 'hero_damage',
      unit: 'damage',
      title: { cn: 'damage', en: 'damage', ru: 'damage' },
      description: { cn: 'damage', en: 'damage', ru: 'damage' },
      target: 500000,
      progress: 0,
      rewardSeasonPoint: 100,
    },
  ],
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
    nextCostMemberPoint: 0,
  },
});

interface TestDailyChallengeEvent {
  PlayerID: PlayerID;
  requestId: string;
  assignmentId?: string;
  steamId?: number;
}

type Listener = (userId: EntityIndex, event: TestDailyChallengeEvent) => void;

const createHarness = () => {
  const listeners = new Map<string, Listener>();
  const requests: ApiParameter[] = [];
  const snapshots: Array<{ steamId: string; snapshot: DailyChallengePlayerSnapshotDto }> = [];
  const memberPointBalances: Array<{ steamId: number; balance: number }> = [];
  const ignoredActiveEffects: Array<{ playerId: PlayerID; metric: string }> = [];
  const results: Array<{ playerId: PlayerID; result: Record<string, unknown> }> = [];
  const cachedSnapshots = new Map<string, DailyChallengePlayerSnapshotDto>([
    ['483215844', createSnapshot()],
  ]);
  let currentSteamId = 483215844;
  let gameTime = 300;
  let rejectNextSnapshotWrite = false;
  let metrics: Partial<
    Record<DailyChallengePlayerSnapshotDto['candidates'][number]['metric'], number>
  > = {
    hero_damage: 120000,
  };
  const scheduled: Array<{ seconds: number; callback: () => number | void }> = [];
  const deps: DailyChallengeControllerDependencies = {
    register: (eventName, listener) => listeners.set(eventName, listener),
    resolvePlayerId: (userId, eventPlayerId) =>
      userId === (77 as EntityIndex) && eventPlayerId === (3 as PlayerID)
        ? (3 as PlayerID)
        : undefined,
    getSteamId: () => currentSteamId,
    getSnapshot: (steamId) => cachedSnapshots.get(steamId),
    setSnapshot: (steamId, snapshot) => {
      if (rejectNextSnapshotWrite) {
        rejectNextSnapshotWrite = false;
        return false;
      }
      cachedSnapshots.set(steamId, snapshot);
      snapshots.push({ steamId, snapshot });
      return true;
    },
    setMemberPointBalance: (steamId, balance) => memberPointBalances.push({ steamId, balance }),
    sendResult: (playerId, result) =>
      results.push({ playerId, result: result as unknown as Record<string, unknown> }),
    sendApi: (request) => requests.push(request),
    decode: (data) => JSON.parse(data),
    getGameTime: () => gameTime,
    readMetrics: () => ({ ...metrics }),
    createRequestId: (action, steamId) => `match-1-${steamId}-${action}-generated`,
    schedule: (seconds, callback) => scheduled.push({ seconds, callback }),
    getPlayerIds: () => [3 as PlayerID],
  };
  const context = new DailyChallengeMatchContext();
  context.initialize('2026-08-04', 0);
  new DailyChallengeController(deps, context, {
    ignoreCurrentlyActiveEffectsForMetric: (playerId, metric) =>
      ignoredActiveEffects.push({ playerId, metric }),
  });
  return {
    listeners,
    requests,
    snapshots,
    memberPointBalances,
    ignoredActiveEffects,
    results,
    context,
    scheduled,
    setGameTime: (value: number) => (gameTime = value),
    setMetrics: (value: typeof metrics) => (metrics = value),
    setSteamId: (value: number) => (currentSteamId = value),
    clearSnapshot: (steamId = '483215844') => cachedSnapshots.delete(steamId),
    setCachedSnapshot: (snapshot: DailyChallengePlayerSnapshotDto) =>
      cachedSnapshots.set(snapshot.steamId.toString(), snapshot),
    rejectNextSnapshot: () => (rejectNextSnapshotWrite = true),
    getCachedSnapshot: (steamId = '483215844') => cachedSnapshots.get(steamId),
  };
};

describe('DailyChallengeController', () => {
  it('uses the authenticated event player, updates the net table and records the acceptance baseline', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-request-1',
      steamId: 123,
    });

    expect(harness.requests).toHaveLength(1);
    expect(harness.requests[0]).toMatchObject({
      method: HttpMethod.POST,
      path: '/daily-challenge/accept',
      querys: { steamId: '483215844' },
      body: {
        schemaVersion: 2,
        dayId: '2026-08-04',
        assignmentId: 'assignment-1',
        requestId: 'accept-request-1',
      },
    });

    const accepted = {
      ...createSnapshot(),
      acceptedTask: createSnapshot().candidates[0],
      needsSelection: false,
    };
    harness.requests[0].successFunc(
      JSON.stringify([{ code: 'accepted', snapshot: accepted, costMemberPoint: 0 }]),
    );

    expect(harness.snapshots[harness.snapshots.length - 1]).toMatchObject({
      steamId: '483215844',
      snapshot: { acceptedTask: { assignmentId: 'assignment-1' } },
    });
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'accept',
        success: true,
        snapshot: { acceptedTask: { assignmentId: 'assignment-1' } },
      },
    });
    expect(harness.context.getAcceptedState(483215844)).toMatchObject({
      assignmentId: 'assignment-1',
      baseline: { hero_damage: 120000 },
      eligibleForCurrentMatch: true,
    });
    expect(harness.ignoredActiveEffects).toEqual([{ playerId: 3, metric: 'hero_damage' }]);
  });

  it('accepts an object-shaped API response returned by the daily challenge endpoints', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-object-response',
    });

    const accepted = {
      ...createSnapshot(),
      acceptedTask: createSnapshot().candidates[0],
      needsSelection: false,
    };

    expect(() =>
      harness.requests[0].successFunc(
        JSON.stringify({ code: 'accepted', snapshot: accepted, costMemberPoint: 0 }),
      ),
    ).not.toThrow();
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'accept',
        success: true,
        code: 'accepted',
        snapshot: { acceptedTask: { assignmentId: 'assignment-1' } },
      },
    });
  });
  it('updates the snapshot after refresh and generates a stable request id before API retries', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_refresh')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: '',
    });

    expect(harness.requests[0]).toMatchObject({
      path: '/daily-challenge/refresh',
      body: {
        schemaVersion: 2,
        dayId: '2026-08-04',
        requestId: 'match-1-483215844-refresh-generated',
      },
    });
    const refreshed = {
      ...createSnapshot(),
      refresh: { ...createSnapshot().refresh, freeRefreshAvailable: false },
    };
    harness.requests[0].successFunc(
      JSON.stringify([
        { code: 'refreshed', snapshot: refreshed, costMemberPoint: 10, memberPointBalance: 90 },
      ]),
    );

    expect(harness.memberPointBalances).toEqual([{ steamId: 483215844, balance: 90 }]);
    expect(harness.snapshots).toHaveLength(1);
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'refresh',
        success: true,
        snapshot: { refresh: { freeRefreshAvailable: false } },
      },
    });
  });

  it('does not publish or record a stale accept response rejected by the snapshot store', () => {
    const harness = createHarness();
    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-stale-response',
    });
    const currentSnapshot = {
      ...createSnapshot(),
      updatedAt: '2026-08-04T03:00:00.000Z',
      acceptedTask: {
        ...createSnapshot().candidates[0],
        assignmentId: 'assignment-2',
        taskId: 'damage-2',
      },
      needsSelection: false,
    };
    harness.setCachedSnapshot(currentSnapshot);
    harness.rejectNextSnapshot();
    const staleSnapshot = {
      ...createSnapshot(),
      updatedAt: '2026-08-04T02:00:00.000Z',
      acceptedTask: createSnapshot().candidates[0],
      needsSelection: false,
    };

    harness.requests[0].successFunc(
      JSON.stringify({ code: 'accepted', snapshot: staleSnapshot, costMemberPoint: 0 }),
    );

    expect(harness.getCachedSnapshot()).toBe(currentSnapshot);
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'accept',
        snapshot: { acceptedTask: { assignmentId: 'assignment-2' } },
      },
    });
    expect(harness.context.getAcceptedState(483215844)).toBeUndefined();
  });

  it('refreshes the snapshot before syncing current-match progress without charging member points', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-before-sync',
    });
    const accepted = {
      ...createSnapshot(),
      acceptedTask: createSnapshot().candidates[0],
      needsSelection: false,
    };
    harness.requests[0].successFunc(
      JSON.stringify({ code: 'accepted', snapshot: accepted, costMemberPoint: 0 }),
    );
    harness.setMetrics({ hero_damage: 170000 });
    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-progress-1',
    });

    expect(harness.requests[1]).toMatchObject({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
      querys: { steamId: '483215844' },
    });
    harness.requests[1].successFunc(JSON.stringify(accepted));

    expect(harness.memberPointBalances).toHaveLength(0);
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'sync',
        requestId: 'sync-progress-1',
        success: true,
        code: 'synced',
        snapshot: {
          acceptedTask: { assignmentId: 'assignment-1', progress: 0 },
          currentMatchProgress: {
            assignmentId: 'assignment-1',
            provisionalProgress: 50000,
            lastSyncedAtGameTime: 300,
          },
        },
      },
    });
  });

  it('uses accumulated v2 metrics for the acceptance baseline and manual progress refresh', () => {
    const harness = createHarness();
    const snapshot = harness.getCachedSnapshot();
    if (!snapshot) throw new Error('expected cached daily challenge snapshot');
    snapshot.candidates[0] = {
      ...snapshot.candidates[0],
      metric: 'stun_duration_ms',
      unit: 'millisecond',
    };
    harness.setMetrics({ stun_duration_ms: 2000 });

    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-stun',
    });
    harness.requests[0].successFunc(
      JSON.stringify({
        code: 'accepted',
        snapshot: { ...snapshot, acceptedTask: snapshot.candidates[0], needsSelection: false },
        costMemberPoint: 0,
      }),
    );

    harness.setMetrics({ stun_duration_ms: 5500 });
    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-stun',
    });
    harness.requests[1].successFunc(
      JSON.stringify({ ...snapshot, acceptedTask: snapshot.candidates[0], needsSelection: false }),
    );

    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'sync',
        success: true,
        snapshot: { currentMatchProgress: { provisionalProgress: 3500 } },
      },
    });
  });

  it('refreshes the snapshot and rejects manual progress sync before a personal task is accepted', () => {
    const harness = createHarness();
    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-without-accepted-task',
    });
    expect(harness.requests[0]).toMatchObject({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
    });
    harness.requests[0].successFunc(JSON.stringify(createSnapshot()));

    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'sync',
        requestId: 'sync-without-accepted-task',
        success: false,
        code: 'accepted_task_unavailable',
      },
    });
  });

  it('keeps the automatic timer in one-second wait mode until match start is confirmed', () => {
    const harness = createHarness();

    const nextDelay = harness.scheduled[0].callback();

    expect(nextDelay).toBe(1);
    expect(harness.results).toHaveLength(0);
    expect(harness.requests).toHaveLength(0);
  });

  it('reconciles a stale accepted assignment against the refreshed snapshot', () => {
    const harness = createHarness();
    const snapshot = harness.getCachedSnapshot();
    if (!snapshot) throw new Error('expected cached daily challenge snapshot');
    snapshot.acceptedTask = snapshot.candidates[0];
    snapshot.needsSelection = false;
    harness.context.recordAcceptance(483215844, 'stale-assignment', 120, {
      hero_damage: 50000,
    });
    harness.setMetrics({ hero_damage: 120000 });

    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-stale-assignment',
    });
    harness.requests[0].successFunc(JSON.stringify(snapshot));

    expect(harness.context.getAcceptedState(483215844)).toMatchObject({
      assignmentId: 'assignment-1',
      acceptedAtGameTime: 120,
      baseline: { hero_damage: 120000 },
    });
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'sync',
        success: true,
        code: 'synced',
        snapshot: { currentMatchProgress: { provisionalProgress: 0 } },
      },
    });
  });

  it('refreshes the API snapshot before manual sync and resets the baseline when an external override changes the assignment', () => {
    const harness = createHarness();
    const current = harness.getCachedSnapshot();
    if (!current) throw new Error('expected cached daily challenge snapshot');
    const oldTask = {
      ...current.candidates[0],
      assignmentId: 'assignment-old-debuff',
      taskId: 'general_debuff_duration',
      metric: 'debuff_duration_ms' as const,
      unit: 'millisecond' as const,
    };
    harness.setCachedSnapshot({
      ...current,
      acceptedTask: oldTask,
      needsSelection: false,
      currentMatchProgress: {
        assignmentId: oldTask.assignmentId,
        provisionalProgress: 44000,
        lastSyncedAtGameTime: 280,
      },
    });
    harness.context.recordAcceptance(483215844, oldTask.assignmentId, 120, {
      debuff_duration_ms: 10000,
    });
    harness.setMetrics({ debuff_duration_ms: 54000, magical_damage: 120000 });

    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-after-external-override',
    });

    expect(harness.requests[0]).toMatchObject({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
      querys: { steamId: '483215844' },
    });
    const linaTask = {
      ...current.candidates[0],
      assignmentId: 'assignment-lina-magical',
      taskId: 'hero_lina_3',
      metric: 'magical_damage' as const,
      heroName: 'npc_dota_hero_lina',
    };
    harness.requests[0].successFunc(
      JSON.stringify({
        ...current,
        updatedAt: '2026-08-04T02:00:00.000Z',
        acceptedTask: linaTask,
        needsSelection: false,
      }),
    );

    expect(harness.getCachedSnapshot()).toMatchObject({
      acceptedTask: { assignmentId: 'assignment-lina-magical', taskId: 'hero_lina_3' },
      currentMatchProgress: {
        assignmentId: 'assignment-lina-magical',
        provisionalProgress: 0,
      },
    });
    expect(harness.context.getAcceptedState(483215844)).toMatchObject({
      assignmentId: 'assignment-lina-magical',
      acceptedAtGameTime: 120,
      baseline: { debuff_duration_ms: 54000, magical_damage: 120000 },
    });
    expect(harness.ignoredActiveEffects).toContainEqual({
      playerId: 3,
      metric: 'magical_damage',
    });
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'sync',
        success: true,
        code: 'synced',
        snapshot: {
          acceptedTask: { assignmentId: 'assignment-lina-magical' },
          currentMatchProgress: {
            assignmentId: 'assignment-lina-magical',
            provisionalProgress: 0,
          },
        },
      },
    });

    harness.setMetrics({ debuff_duration_ms: 54000, magical_damage: 170000 });
    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-same-overridden-assignment',
    });
    harness.requests[1].successFunc(
      JSON.stringify({
        ...current,
        updatedAt: '2026-08-04T02:00:00.000Z',
        acceptedTask: linaTask,
        needsSelection: false,
      }),
    );

    expect(harness.context.getAcceptedState(483215844)?.baseline).toEqual({
      debuff_duration_ms: 54000,
      magical_damage: 120000,
    });
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        snapshot: {
          acceptedTask: { assignmentId: 'assignment-lina-magical' },
          currentMatchProgress: { provisionalProgress: 50000 },
        },
      },
    });
  });

  it('keeps the cached snapshot and reports a failure when manual sync cannot refresh the API snapshot', () => {
    const harness = createHarness();
    const cached = harness.getCachedSnapshot();
    if (!cached) throw new Error('expected cached daily challenge snapshot');
    cached.acceptedTask = cached.candidates[0];
    cached.needsSelection = false;
    harness.context.recordAcceptance(483215844, cached.acceptedTask.assignmentId, 120, {
      hero_damage: 120000,
    });

    harness.listeners.get('daily_challenge_sync_progress')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'sync-api-failed',
    });
    harness.requests[0].failureFunc?.(JSON.stringify({ code: 'snapshot_unavailable' }));

    expect(harness.getCachedSnapshot()).toBe(cached);
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'sync',
        requestId: 'sync-api-failed',
        success: false,
        code: 'snapshot_unavailable',
      },
    });
  });

  it('schedules a five-minute automatic sync and republishes only temporary progress', () => {
    const harness = createHarness();
    expect(harness.scheduled[0]?.seconds).toBe(1);

    harness.listeners.get('daily_challenge_accept')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'accept-before-auto-sync',
    });
    const accepted = {
      ...createSnapshot(),
      acceptedTask: createSnapshot().candidates[0],
      needsSelection: false,
    };
    harness.requests[0].successFunc(
      JSON.stringify({ code: 'accepted', snapshot: accepted, costMemberPoint: 0 }),
    );
    harness.context.confirmMatchStart('2026-08-04', 0, '2026-08-04T00:00:00.000Z');
    harness.setGameTime(300);
    harness.setMetrics({ hero_damage: 180000 });
    const apiRequestCount = harness.requests.length;

    const nextDelay = harness.scheduled[0].callback();

    expect(nextDelay).toBe(300);
    expect(harness.requests).toHaveLength(apiRequestCount);
    expect(harness.getCachedSnapshot()?.acceptedTask?.progress).toBe(0);
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      result: {
        action: 'sync',
        success: true,
        code: 'auto_synced',
        snapshot: {
          acceptedTask: { progress: 0 },
          currentMatchProgress: {
            provisionalProgress: 60000,
            nextAutoSyncAtGameTime: 600,
          },
        },
      },
    });
  });

  it('serves a cached snapshot privately without another API request', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_request_snapshot')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'snapshot-cache-hit',
    });

    expect(harness.requests).toHaveLength(0);
    expect(harness.results).toHaveLength(1);
    expect(harness.results[0]).toMatchObject({
      playerId: 3,
      result: {
        action: 'snapshot',
        requestId: 'snapshot-cache-hit',
        success: true,
        code: 'snapshot',
        snapshot: { steamId: 483215844, dayId: '2026-08-04' },
      },
    });
  });

  it('loads a cache miss from the API, caches it, and sends it only to the authenticated player', () => {
    const harness = createHarness();
    harness.clearSnapshot();

    harness.listeners.get('daily_challenge_request_snapshot')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'snapshot-cache-miss',
    });

    expect(harness.requests[0]).toMatchObject({
      method: HttpMethod.GET,
      path: '/daily-challenge/snapshot',
      querys: { steamId: '483215844' },
    });
    harness.requests[0].successFunc(JSON.stringify([createSnapshot()]));

    expect(harness.getCachedSnapshot()).toMatchObject({ steamId: 483215844 });
    expect(harness.results).toHaveLength(1);
    expect(harness.results[0]).toMatchObject({
      playerId: 3,
      result: { success: true, snapshot: { steamId: 483215844 } },
    });
  });

  it('keeps an async snapshot response cached but does not send it after the PlayerID belongs to another Steam account', () => {
    const harness = createHarness();
    harness.clearSnapshot();

    harness.listeners.get('daily_challenge_request_snapshot')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'snapshot-identity-changed',
    });
    harness.setSteamId(999999999);
    harness.requests[0].successFunc(JSON.stringify([createSnapshot()]));

    expect(harness.getCachedSnapshot('483215844')).toMatchObject({ steamId: 483215844 });
    expect(harness.results).toHaveLength(0);
  });

  it('marks unread rewards viewed for the authenticated Steam account', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_view')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'view-1',
    });

    expect(harness.requests[0]).toMatchObject({
      method: HttpMethod.POST,
      path: '/daily-challenge/view',
      querys: { steamId: '483215844' },
      body: {
        schemaVersion: 2,
        dayId: '2026-08-04',
        requestId: 'view-1',
      },
    });
    const viewed = { ...createSnapshot(), unreadRewardCount: 0 };
    harness.requests[0].successFunc(
      JSON.stringify([{ code: 'viewed', snapshot: viewed, costMemberPoint: 0 }]),
    );

    expect(harness.snapshots[harness.snapshots.length - 1]).toMatchObject({
      snapshot: { unreadRewardCount: 0 },
    });
    expect(harness.results[harness.results.length - 1]).toMatchObject({
      playerId: 3,
      result: {
        action: 'view',
        success: true,
        code: 'viewed',
        snapshot: { unreadRewardCount: 0 },
      },
    });
  });

  it('omits optional cost data when publishing a snapshot result', () => {
    const harness = createHarness();
    harness.clearSnapshot();

    harness.listeners.get('daily_challenge_request_snapshot')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'snapshot-no-cost',
    });
    harness.requests[0].successFunc(JSON.stringify([createSnapshot()]));

    const result = harness.results[harness.results.length - 1].result;
    expect(result).toMatchObject({ action: 'snapshot', success: true, code: 'snapshot' });
    expect(result).not.toHaveProperty('costMemberPoint');
  });

  it('falls back to a stable error code when the API failure body is not JSON', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_refresh')?.(77 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      requestId: 'refresh-invalid-body',
    });

    expect(() => harness.requests[0].failureFunc?.('Invalid_NotOnDedicatedServer')).not.toThrow();
    expect(harness.results[harness.results.length - 1].result).toMatchObject({
      action: 'refresh',
      requestId: 'refresh-invalid-body',
      success: false,
      code: 'request_failed',
    });
  });

  it('rejects a forged PlayerID before reading SteamID or sending an API request', () => {
    const harness = createHarness();

    harness.listeners.get('daily_challenge_accept')?.(999 as EntityIndex, {
      PlayerID: 3 as PlayerID,
      assignmentId: 'assignment-1',
      requestId: 'forged',
    });

    expect(harness.requests).toHaveLength(0);
    expect(harness.snapshots).toHaveLength(0);
  });
});
