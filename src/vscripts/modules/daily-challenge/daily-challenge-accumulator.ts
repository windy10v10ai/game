import { ChallengeMetric } from '../../../common/dto/daily-challenge';
import { DailyChallengeMetricValues } from './daily-challenge-match-context';

export class DailyChallengeMetricAccumulator {
  private readonly valuesByPlayerId = new Map<PlayerID, DailyChallengeMetricValues>();

  add(playerId: PlayerID, metric: ChallengeMetric, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    const values = this.valuesByPlayerId.get(playerId) ?? {};
    values[metric] = (values[metric] ?? 0) + value;
    this.valuesByPlayerId.set(playerId, values);
  }

  read(playerId: PlayerID): DailyChallengeMetricValues {
    const values = this.valuesByPlayerId.get(playerId);
    if (!values) {
      return {};
    }
    const snapshot: DailyChallengeMetricValues = {};
    for (const [metric, value] of Object.entries(values) as Array<[ChallengeMetric, number]>) {
      snapshot[metric] = Math.max(0, Math.floor(value));
    }
    return snapshot;
  }

  reset(): void {
    this.valuesByPlayerId.clear();
  }
}

export const dailyChallengeMetricAccumulator = new DailyChallengeMetricAccumulator();
