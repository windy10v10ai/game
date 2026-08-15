import { transformDailyChallenge } from './net-table-transform';

describe('daily challenge net table transform', () => {
  it('restores network arrays and booleans for Panorama', () => {
    const transformed = transformDailyChallenge({
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
      candidates: {
        1: { assignmentId: 'a', taskId: 'task-a' },
        2: { assignmentId: 'b', taskId: 'task-b' },
      },
      unreadRewardCount: 2,
      needsSelection: 1,
      streak: {
        currentDays: 2,
        cycleTargetDays: 30,
        nextMilestoneDays: 3,
        nextMilestoneRewardSeasonPoint: 50,
      },
      refresh: {
        isMember: 1,
        freeRefreshAvailable: 0,
        paidRefreshesUsed: 1,
        paidRefreshesRemaining: 4,
        nextCostMemberPoint: 20,
      },
      lastAction: {
        action: 'refresh',
        requestId: 'r1',
        success: 1,
        code: 'refreshed',
      },
    });

    expect(transformed.candidates.map((candidate) => candidate.assignmentId)).toEqual(['a', 'b']);
    expect(transformed.needsSelection).toBe(true);
    expect(transformed.refresh.isMember).toBe(true);
    expect(transformed.refresh.freeRefreshAvailable).toBe(false);
    expect(transformed.lastAction?.success).toBe(true);
  });
});
