import { ChallengeMetric } from '../../../common/dto/daily-challenge';

export type DailyChallengeMetricValues = Partial<Record<ChallengeMetric, number>>;

export interface DailyChallengeAcceptedMatchState {
  assignmentId: string;
  acceptedAtGameTime: number;
  eligibleForCurrentMatch: boolean;
  baseline: DailyChallengeMetricValues;
}

export class DailyChallengeMatchContext {
  private static readonly ACCEPT_WINDOW_SECONDS = 10 * 60;

  private dayId?: string;
  private matchStartedAtGameTime = 0;
  private matchStartedAt?: string;
  private matchStartConfirmed = false;
  private readonly acceptedBySteamId = new Map<number, DailyChallengeAcceptedMatchState>();

  initialize(dayId: string, matchStartedAtGameTime = 0, matchStartedAt?: string) {
    if (this.dayId === dayId) {
      if (matchStartedAt) {
        this.matchStartedAt = matchStartedAt;
      }
      return;
    }
    this.dayId = dayId;
    this.matchStartedAtGameTime = matchStartedAtGameTime;
    this.matchStartedAt = matchStartedAt;
    this.matchStartConfirmed = false;
    this.acceptedBySteamId.clear();
  }

  confirmMatchStart(
    dayId: string,
    matchStartedAtGameTime: number,
    matchStartedAt: string,
  ): boolean {
    if (this.dayId && dayId < this.dayId) {
      return false;
    }

    const isDuplicateSameDayConfirmation = this.dayId === dayId && this.matchStartConfirmed;
    if (this.dayId !== dayId) {
      this.acceptedBySteamId.clear();
    }
    this.dayId = dayId;
    if (!isDuplicateSameDayConfirmation) {
      this.matchStartedAtGameTime = matchStartedAtGameTime;
    }
    // The server timestamp may be refreshed, but the local GAME_IN_PROGRESS
    // anchor must remain the first one for the ten-minute acceptance window.
    this.matchStartedAt = matchStartedAt;
    this.matchStartConfirmed = true;
    return true;
  }

  isMatchStartConfirmed() {
    return this.matchStartConfirmed;
  }

  getDayId() {
    return this.dayId;
  }

  getMatchStartedAt() {
    return this.matchStartedAt;
  }

  recordAcceptance(
    steamId: number,
    assignmentId: string,
    acceptedAtGameTime: number,
    baseline: DailyChallengeMetricValues,
  ): DailyChallengeAcceptedMatchState {
    const existing = this.acceptedBySteamId.get(steamId);
    if (existing?.assignmentId === assignmentId) {
      return existing;
    }

    const elapsed = Math.max(0, acceptedAtGameTime - this.matchStartedAtGameTime);
    const state: DailyChallengeAcceptedMatchState = {
      assignmentId,
      acceptedAtGameTime,
      eligibleForCurrentMatch: elapsed <= DailyChallengeMatchContext.ACCEPT_WINDOW_SECONDS,
      baseline: { ...baseline },
    };
    this.acceptedBySteamId.set(steamId, state);
    return state;
  }

  getAcceptedState(steamId: number) {
    return this.acceptedBySteamId.get(steamId);
  }

  getMetricDelta(steamId: number, metric: ChallengeMetric, currentValue: number) {
    const state = this.acceptedBySteamId.get(steamId);
    if (!state?.eligibleForCurrentMatch) {
      return 0;
    }
    return Math.max(0, currentValue - (state.baseline[metric] ?? 0));
  }
}

export const dailyChallengeMatchContext = new DailyChallengeMatchContext();
