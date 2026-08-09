import { DailyChallengePlayerSnapshotDto } from '../../../common/dto/daily-challenge';
import { GameEndPlayerDto } from '../../api/analytics/dto/game-end-dto';

import {
  buildDailyChallengeMatchContributionForGameEnd,
  collectDailyChallengeMatchContribution,
} from './daily-challenge-contribution-collector';
import { DailyChallengeMatchContext } from './daily-challenge-match-context';

const createTask = (
  assignmentId: string,
  metric: DailyChallengePlayerSnapshotDto['candidates'][number]['metric'],
  scope: DailyChallengePlayerSnapshotDto['candidates'][number]['scope'] = 'personal_general',
  heroName?: string,
) => ({
  assignmentId,
  taskId: assignmentId,
  revision: 1,
  scope,
  metric,
  ...(heroName ? { heroName } : {}),
  unit: metric.includes('duration') ? ('millisecond' as const) : ('count' as const),
  title: { cn: assignmentId, en: assignmentId, ru: assignmentId },
  description: { cn: assignmentId, en: assignmentId, ru: assignmentId },
  target: 100,
  progress: 0,
  rewardSeasonPoint: 100,
});

const createSnapshot = (
  steamId: number,
  acceptedTask?: ReturnType<typeof createTask>,
  globalTask = createTask('global-healing', 'healing', 'global'),
): DailyChallengePlayerSnapshotDto => ({
  schemaVersion: 2,
  steamId,
  dayId: '2026-08-04',
  status: 'open',
  startsAt: '2026-08-04T00:00:00.000Z',
  endsAt: '2026-08-05T00:00:00.000Z',
  globalTask,
  globalRewardTiers: {
    topPercent: 10,
    middlePercent: 30,
    topRewardSeasonPoint: 100,
    middleRewardSeasonPoint: 90,
    baseRewardSeasonPoint: 80,
  },
  candidates: acceptedTask ? [acceptedTask] : [],
  ...(acceptedTask ? { acceptedTask } : {}),
  unreadRewardCount: 0,
  recentRewards: [],
  needsSelection: !acceptedTask,
  streak: {
    currentDays: 0,
    cycleTargetDays: 3,
    nextMilestoneDays: 3,
    nextMilestoneRewardSeasonPoint: 100,
  },
  refresh: {
    isMember: false,
    freeRefreshAvailable: false,
    paidRefreshesUsed: 0,
    paidRefreshesRemaining: 0,
    nextCostMemberPoint: 0,
  },
});

const createPlayer = (overrides: Partial<GameEndPlayerDto> = {}): GameEndPlayerDto => ({
  heroName: 'npc_dota_hero_lina',
  steamId: 483215844,
  playerId: 0 as PlayerID,
  teamId: 2,
  isDisconnected: false,
  level: 30,
  totalGoldEarned: 50000,
  kills: 12,
  deaths: 3,
  assists: 34,
  score: 0,
  battlePoints: 100,
  heroDamage: 500000,
  damageTaken: 320000,
  lastHits: 456,
  healing: 100000,
  towerKills: 7,
  awaken: 0,
  ...overrides,
});

describe('buildDailyChallengeMatchContributionForGameEnd', () => {
  it('uses the match context and player-specific snapshots to build the game/end extension', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    context.confirmMatchStart('2026-08-04', 0, '2026-08-04T01:00:00.000Z');
    const player = createPlayer();
    const challengeSnapshot = createSnapshot(player.steamId);

    const result = buildDailyChallengeMatchContributionForGameEnd({
      players: [player],
      context,
      getSnapshot: (steamId) => (steamId === player.steamId ? challengeSnapshot : undefined),
    });

    expect(result).toMatchObject({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [{ steamId: 483215844 }],
    });
  });

  it('keeps game/end compatible when challenge match attribution is unavailable', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);

    expect(
      buildDailyChallengeMatchContributionForGameEnd({
        players: [createPlayer()],
        context,
        getSnapshot: () => undefined,
      }),
    ).toBeUndefined();
  });
});
describe('collectDailyChallengeMatchContribution', () => {
  it('uses the acceptance baseline for the personal task and the full match value for the global task', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    context.recordAcceptance(483215844, 'personal-damage', 300, { hero_damage: 120000 });
    const snapshot = createSnapshot(483215844, createTask('personal-damage', 'hero_damage'));

    expect(
      collectDailyChallengeMatchContribution({
        dayId: '2026-08-04',
        matchStartedAt: '2026-08-04T01:00:00.000Z',
        players: [createPlayer()],
        snapshotsBySteamId: new Map([['483215844', snapshot]]),
        context,
      }),
    ).toEqual({
      schemaVersion: 2,
      dataVersion: 2,
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [
        {
          steamId: 483215844,
          normallySettled: true,
          acceptedAssignmentId: 'personal-damage',
          personalMetrics: [{ metric: 'hero_damage', value: 380000 }],
          globalMetrics: [{ metric: 'healing', value: 100000 }],
        },
      ],
    });
  });

  it('does not record personal progress before selection, while global progress still counts participation', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);

    const result = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer()],
      snapshotsBySteamId: new Map([['483215844', createSnapshot(483215844)]]),
      context,
    });

    expect(result.players[0]).toMatchObject({
      personalMetrics: [],
      globalMetrics: [{ metric: 'healing', value: 100000 }],
    });
    expect(result.players[0]).not.toHaveProperty('acceptedAssignmentId');
  });

  it('only counts a hero task when the player used the required hero', () => {
    const acceptedTask = createTask(
      'lina-damage',
      'hero_damage',
      'personal_hero',
      'npc_dota_hero_lina',
    );
    const snapshot = createSnapshot(483215844, acceptedTask);
    const matchingContext = new DailyChallengeMatchContext();
    matchingContext.initialize('2026-08-04', 0);
    matchingContext.recordAcceptance(483215844, acceptedTask.assignmentId, 0, {});

    const matching = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer()],
      snapshotsBySteamId: new Map([['483215844', snapshot]]),
      context: matchingContext,
    });
    const mismatching = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer({ heroName: 'npc_dota_hero_axe' })],
      snapshotsBySteamId: new Map([['483215844', snapshot]]),
      context: matchingContext,
    });

    expect(matching.players[0].personalMetrics).toEqual([{ metric: 'hero_damage', value: 500000 }]);
    expect(mismatching.players[0].personalMetrics).toEqual([]);
  });

  it('does not count a personal task accepted after ten minutes', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    context.recordAcceptance(483215844, 'personal-damage', 601, { hero_damage: 120000 });

    const result = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer()],
      snapshotsBySteamId: new Map([
        ['483215844', createSnapshot(483215844, createTask('personal-damage', 'hero_damage'))],
      ]),
      context,
    });

    expect(result.players[0]).toMatchObject({
      acceptedAssignmentId: 'personal-damage',
      personalMetrics: [],
    });
  });

  it('marks disconnected players as not normally settled for challenge progress', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);

    const result = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer({ isDisconnected: true }), createPlayer({ steamId: 0 })],
      snapshotsBySteamId: new Map([['483215844', createSnapshot(483215844)]]),
      context,
    });

    expect(result.players).toHaveLength(1);
    expect(result.players[0].normallySettled).toBe(false);
  });

  it('uses v2 accumulated metrics for acceptance deltas and full global contribution', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-04', 0);
    context.recordAcceptance(483215844, 'bot-kills', 0, { bot_kills: 2 });

    const result = collectDailyChallengeMatchContribution({
      dayId: '2026-08-04',
      matchStartedAt: '2026-08-04T01:00:00.000Z',
      players: [createPlayer()],
      snapshotsBySteamId: new Map([
        [
          '483215844',
          createSnapshot(
            483215844,
            createTask('bot-kills', 'bot_kills'),
            createTask('global-roshan', 'roshan_kills', 'global'),
          ),
        ],
      ]),
      context,
      readAccumulatedMetrics: () => ({ bot_kills: 7, roshan_kills: 3 }),
    });

    expect(result.dataVersion).toBe(2);
    expect(result.players[0]).toMatchObject({
      personalMetrics: [{ metric: 'bot_kills', value: 5 }],
      globalMetrics: [{ metric: 'roshan_kills', value: 3 }],
    });
  });

  it('does not attribute a match until GAME_IN_PROGRESS start has been confirmed', () => {
    const context = new DailyChallengeMatchContext();
    context.initialize('2026-08-03', -120, '2026-08-03T23:58:00.000Z');

    const result = buildDailyChallengeMatchContributionForGameEnd({
      players: [createPlayer()],
      context,
      getSnapshot: () => createSnapshot(483215844),
    });

    expect(result).toBeUndefined();
  });
});
