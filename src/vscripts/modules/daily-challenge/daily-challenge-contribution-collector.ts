import {
  DailyChallengeMatchContributionDto,
  DailyChallengeMetricContributionDto,
  DailyChallengePlayerSnapshotDto,
  DailyChallengeTaskSnapshotDto,
} from '../../../common/dto/daily-challenge';
import { GameEndPlayerDto } from '../../api/analytics/dto/game-end-dto';
import { dailyChallengeMetricAccumulator } from './daily-challenge-accumulator';
import {
  DailyChallengeMatchContext,
  DailyChallengeMetricValues,
} from './daily-challenge-match-context';
import {
  createDailyChallengeBaseMetricSnapshot,
  mergeDailyChallengeMetricSnapshots,
} from './daily-challenge-metric-snapshot';

export const DAILY_CHALLENGE_MATCH_DATA_VERSION = 2 as const;

export interface DailyChallengeContributionCollectorInput {
  dayId: string;
  matchStartedAt: string;
  players: GameEndPlayerDto[];
  snapshotsBySteamId: Map<string, DailyChallengePlayerSnapshotDto>;
  context: DailyChallengeMatchContext;
  readAccumulatedMetrics?: (playerId: PlayerID) => DailyChallengeMetricValues;
}

function createPlayerMetricSnapshot(
  player: GameEndPlayerDto,
  accumulated: DailyChallengeMetricValues,
): DailyChallengeMetricValues {
  return mergeDailyChallengeMetricSnapshots(
    createDailyChallengeBaseMetricSnapshot({
      heroDamage: player.heroDamage,
      damageTaken: player.damageTaken,
      healing: player.healing,
      kills: player.kills,
      assists: player.assists,
      lastHits: player.lastHits,
      towerKills: player.towerKills,
    }),
    accumulated,
  );
}

function collectGlobalMetric(
  metrics: DailyChallengeMetricValues,
  task?: DailyChallengeTaskSnapshotDto,
): DailyChallengeMetricContributionDto[] {
  if (!task || task.scope !== 'global') {
    return [];
  }
  const value = metrics[task.metric];
  return value === undefined ? [] : [{ metric: task.metric, value }];
}

function collectPersonalMetric(
  player: GameEndPlayerDto,
  metrics: DailyChallengeMetricValues,
  snapshot: DailyChallengePlayerSnapshotDto,
  context: DailyChallengeMatchContext,
): {
  acceptedAssignmentId?: string;
  personalMetrics: DailyChallengeMetricContributionDto[];
} {
  const task = snapshot.acceptedTask;
  if (!task || task.scope === 'global') {
    return { personalMetrics: [] };
  }

  const acceptedState = context.getAcceptedState(player.steamId);
  if (!acceptedState || acceptedState.assignmentId !== task.assignmentId) {
    return { personalMetrics: [] };
  }

  const acceptedAssignmentId = task.assignmentId;
  if (!acceptedState.eligibleForCurrentMatch) {
    return { acceptedAssignmentId, personalMetrics: [] };
  }
  if (task.scope === 'personal_hero' && task.heroName !== player.heroName) {
    return { acceptedAssignmentId, personalMetrics: [] };
  }

  const currentValue = metrics[task.metric];
  if (currentValue === undefined) {
    return { acceptedAssignmentId, personalMetrics: [] };
  }

  return {
    acceptedAssignmentId,
    personalMetrics: [
      {
        metric: task.metric,
        value: context.getMetricDelta(player.steamId, task.metric, currentValue),
      },
    ],
  };
}

function isNormallySettledByCurrentGameEndRules(player: GameEndPlayerDto): boolean {
  return (
    !player.isDisconnected &&
    Number.isFinite(player.battlePoints) &&
    player.battlePoints >= 0 &&
    player.battlePoints <= 500
  );
}

export interface DailyChallengeGameEndCollectorInput {
  players: GameEndPlayerDto[];
  context: DailyChallengeMatchContext;
  getSnapshot: (steamId: number) => DailyChallengePlayerSnapshotDto | undefined;
  readAccumulatedMetrics?: (playerId: PlayerID) => DailyChallengeMetricValues;
}

export function buildDailyChallengeMatchContributionForGameEnd({
  players,
  context,
  getSnapshot,
  readAccumulatedMetrics,
}: DailyChallengeGameEndCollectorInput): DailyChallengeMatchContributionDto | undefined {
  const dayId = context.getDayId();
  const matchStartedAt = context.getMatchStartedAt();
  if (!context.isMatchStartConfirmed() || !dayId || !matchStartedAt) {
    return undefined;
  }

  const snapshotsBySteamId = new Map<string, DailyChallengePlayerSnapshotDto>();
  for (const player of players) {
    if (player.steamId <= 0) continue;
    const snapshot = getSnapshot(player.steamId);
    if (snapshot) {
      snapshotsBySteamId.set(player.steamId.toString(), snapshot);
    }
  }

  return collectDailyChallengeMatchContribution({
    dayId,
    matchStartedAt,
    players,
    snapshotsBySteamId,
    context,
    readAccumulatedMetrics,
  });
}
export function collectDailyChallengeMatchContribution({
  dayId,
  matchStartedAt,
  players,
  snapshotsBySteamId,
  context,
  readAccumulatedMetrics = (playerId) => dailyChallengeMetricAccumulator.read(playerId),
}: DailyChallengeContributionCollectorInput): DailyChallengeMatchContributionDto {
  return {
    schemaVersion: 2,
    dataVersion: DAILY_CHALLENGE_MATCH_DATA_VERSION,
    dayId,
    matchStartedAt,
    players: players
      .filter((player) => player.steamId > 0)
      .map((player) => {
        const snapshot = snapshotsBySteamId.get(player.steamId.toString());
        const metrics = createPlayerMetricSnapshot(player, readAccumulatedMetrics(player.playerId));
        if (!snapshot || snapshot.dayId !== dayId) {
          return {
            steamId: player.steamId,
            normallySettled: isNormallySettledByCurrentGameEndRules(player),
            personalMetrics: [],
            globalMetrics: [],
          };
        }

        return {
          steamId: player.steamId,
          normallySettled: isNormallySettledByCurrentGameEndRules(player),
          ...collectPersonalMetric(player, metrics, snapshot, context),
          globalMetrics: collectGlobalMetric(metrics, snapshot.globalTask),
        };
      }),
  };
}
