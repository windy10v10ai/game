import { DailyChallengePlayerSnapshotDto } from '../../common/dto/daily-challenge';
import { shouldReplaceDailyChallengeSnapshot } from './daily-challenge-snapshot-order';
import { DailyChallengeMatchContext } from '../modules/daily-challenge/daily-challenge-match-context';

export class DailyChallengePlayerSnapshotStore {
  private readonly snapshots = new Map<string, DailyChallengePlayerSnapshotDto>();

  get(steamId: string): DailyChallengePlayerSnapshotDto | undefined {
    return this.snapshots.get(steamId);
  }

  set(steamId: string, snapshot: DailyChallengePlayerSnapshotDto): boolean {
    const current = this.snapshots.get(steamId);
    if (current && !shouldReplaceDailyChallengeSnapshot(current, snapshot)) {
      return false;
    }
    this.snapshots.set(steamId, snapshot);
    return true;
  }

  seed(snapshots?: DailyChallengePlayerSnapshotDto[]): void {
    for (const snapshot of snapshots ?? []) {
      this.set(snapshot.steamId.toString(), snapshot);
    }
  }
}

export const dailyChallengePlayerSnapshotStore = new DailyChallengePlayerSnapshotStore();

export function indexDailyChallengeSnapshots(
  snapshots?: DailyChallengePlayerSnapshotDto[],
): Map<string, DailyChallengePlayerSnapshotDto> {
  const indexed = new Map<string, DailyChallengePlayerSnapshotDto>();
  for (const snapshot of snapshots ?? []) {
    indexed.set(snapshot.steamId.toString(), snapshot);
  }
  return indexed;
}

function restoreAcceptedTasks(
  snapshots: DailyChallengePlayerSnapshotDto[] | undefined,
  context: DailyChallengeMatchContext,
  acceptedAtGameTime: number,
): void {
  for (const snapshot of snapshots ?? []) {
    if (!snapshot.acceptedTask) continue;
    context.recordAcceptance(
      snapshot.steamId,
      snapshot.acceptedTask.assignmentId,
      acceptedAtGameTime,
      {},
    );
  }
}

export function initializeDailyChallengeMatchContext(
  snapshots: DailyChallengePlayerSnapshotDto[] | undefined,
  context: DailyChallengeMatchContext,
  matchStartedAtGameTime: number,
  matchStartedAt?: string,
) {
  const firstSnapshot = snapshots?.[0];
  if (!firstSnapshot) {
    return;
  }

  context.initialize(firstSnapshot.dayId, matchStartedAtGameTime, matchStartedAt);
  restoreAcceptedTasks(snapshots, context, matchStartedAtGameTime);
}

export interface DailyChallengeMatchStartResponse {
  dayId: string;
  matchStartedAt: string;
  dailyChallenges?: DailyChallengePlayerSnapshotDto[];
}

export function applyDailyChallengeMatchStart(
  response: DailyChallengeMatchStartResponse,
  context: DailyChallengeMatchContext,
  matchStartedAtGameTime: number,
  setSnapshot: (steamId: string, snapshot: DailyChallengePlayerSnapshotDto) => boolean | void,
) {
  if (!context.confirmMatchStart(response.dayId, matchStartedAtGameTime, response.matchStartedAt)) {
    return;
  }
  indexDailyChallengeSnapshots(response.dailyChallenges).forEach((snapshot, steamId) => {
    if (setSnapshot(steamId, snapshot) === false || !snapshot.acceptedTask) {
      return;
    }
    context.recordAcceptance(
      snapshot.steamId,
      snapshot.acceptedTask.assignmentId,
      matchStartedAtGameTime,
      {},
    );
  });
}
