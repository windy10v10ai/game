import type { DailyChallengePlayerSnapshotDto } from '../../common/dto/daily-challenge';

export function shouldReplaceDailyChallengeSnapshot(
  current: DailyChallengePlayerSnapshotDto,
  incoming: DailyChallengePlayerSnapshotDto,
): boolean {
  if (incoming.dayId !== current.dayId) {
    return incoming.dayId > current.dayId;
  }
  if (current.updatedAt && !incoming.updatedAt) {
    return false;
  }
  if (!current.updatedAt || !incoming.updatedAt) {
    return true;
  }
  return incoming.updatedAt >= current.updatedAt;
}
