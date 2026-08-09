import {
  ChallengeDayStatus,
  DailyChallengeClientAction,
  DailyChallengeContributionTier,
  DailyChallengePlayerSnapshotDto,
  DailyChallengeRefreshStateDto,
  DailyChallengeRewardHistoryDto,
  DailyChallengeRewardSource,
  DailyChallengeStar,
  DailyChallengeTaskSnapshotDto,
} from '../../../../../common/dto/daily-challenge';
import { formatStatNumber } from '../../../shared/utils/format-stat-number';

type LocalizedText = { cn: string; en: string; ru: string };
type ChallengeUnit = 'count' | 'damage' | 'millisecond';

export type DailyChallengeEntryIndicator =
  | { kind: 'none' }
  | { kind: 'dot' }
  | { kind: 'count'; text: string };

export type DailyChallengeRefreshIntent = 'locked' | 'open_member' | 'open_points' | 'refresh';

export interface DailyChallengeAcceptButtonState {
  enabled: boolean;
  labelKey: string;
}

export function getDailyChallengeAcceptButtonState(
  pendingAction: DailyChallengeClientAction | undefined,
  dayStatus: ChallengeDayStatus,
): DailyChallengeAcceptButtonState {
  if (pendingAction === 'accept') {
    return { enabled: false, labelKey: '#daily_challenge_accepting' };
  }
  if (pendingAction === 'refresh') {
    return { enabled: false, labelKey: '#daily_challenge_refreshing' };
  }
  if (pendingAction !== undefined || dayStatus !== 'open') {
    return { enabled: false, labelKey: '#daily_challenge_accept_locked' };
  }
  return { enabled: true, labelKey: '#daily_challenge_accept' };
}

export interface DailyChallengeRoundState {
  completedRoundCount: number;
  currentRound: number;
  totalRounds: number;
  isComplete: boolean;
}

export interface DailyChallengeRefreshQuota {
  freeRefreshAvailable: boolean;
  paidRefreshesUsed: number;
  paidRefreshesRemaining: number;
  paidRefreshLimit: number;
}

function toNonNegativeInteger(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : fallback;
}

export function normalizeDailyChallengePlayerSnapshot(
  snapshot: DailyChallengePlayerSnapshotDto,
): DailyChallengePlayerSnapshotDto {
  const rawCompletedTasks = (
    snapshot as unknown as {
      completedTasks?:
        | DailyChallengeTaskSnapshotDto[]
        | Record<string, DailyChallengeTaskSnapshotDto>;
    }
  ).completedTasks;
  const completedTasks = Array.isArray(rawCompletedTasks)
    ? rawCompletedTasks
    : rawCompletedTasks
      ? Object.values(rawCompletedTasks)
      : [];
  const totalRounds = Math.max(1, toNonNegativeInteger(snapshot.totalRounds, 3));
  const completedRoundCount = Math.min(
    totalRounds,
    toNonNegativeInteger(snapshot.completedRoundCount, completedTasks.length),
  );
  const currentRound =
    completedRoundCount >= totalRounds
      ? totalRounds
      : Math.max(
          1,
          Math.min(
            totalRounds,
            toNonNegativeInteger(snapshot.currentRound, completedRoundCount + 1),
          ),
        );

  return {
    ...snapshot,
    completedRoundCount,
    currentRound,
    totalRounds,
    completedTasks,
  };
}

export function getDailyChallengeRoundState(
  snapshot: Pick<
    DailyChallengePlayerSnapshotDto,
    'completedRoundCount' | 'currentRound' | 'totalRounds' | 'completedTasks'
  >,
): DailyChallengeRoundState {
  const normalized = normalizeDailyChallengePlayerSnapshot(
    snapshot as DailyChallengePlayerSnapshotDto,
  );
  const totalRounds = normalized.totalRounds ?? 3;
  const completedRoundCount = normalized.completedRoundCount ?? 0;
  return {
    completedRoundCount,
    currentRound: normalized.currentRound ?? Math.min(totalRounds, completedRoundCount + 1),
    totalRounds,
    isComplete: completedRoundCount >= totalRounds,
  };
}

export function getDailyChallengeTaskStar(
  task: Pick<DailyChallengeTaskSnapshotDto, 'star'>,
): DailyChallengeStar {
  return task.star === 1 || task.star === 3 ? task.star : 2;
}

export function getDailyChallengeStarVisual(star: DailyChallengeStar): string {
  return '★'.repeat(star);
}

export function getDailyChallengeFreeRefreshStateLocalizationKey(
  isMember: boolean,
  freeRefreshAvailable: boolean,
): string {
  if (!isMember) return '#daily_challenge_refresh_free_member_only';
  return freeRefreshAvailable
    ? '#daily_challenge_refresh_free_available'
    : '#daily_challenge_refresh_free_used';
}

export function getDailyChallengeRefreshQuota(
  refresh: DailyChallengeRefreshStateDto,
): DailyChallengeRefreshQuota {
  const paidRefreshesUsed = toNonNegativeInteger(refresh.paidRefreshesUsed, 0);
  const paidRefreshesRemaining = toNonNegativeInteger(refresh.paidRefreshesRemaining, 0);
  return {
    freeRefreshAvailable: refresh.freeRefreshAvailable,
    paidRefreshesUsed,
    paidRefreshesRemaining,
    paidRefreshLimit: paidRefreshesUsed + paidRefreshesRemaining,
  };
}

export class DailyChallengeRetryableActionRequest {
  private request: {
    action: DailyChallengeClientAction;
    dayId: string;
    requestId: string;
  } | null = null;

  getOrCreate(
    action: DailyChallengeClientAction,
    dayId: string,
    createRequestId: () => string,
  ): string {
    if (this.request?.action === action && this.request.dayId === dayId) {
      return this.request.requestId;
    }
    const requestId = createRequestId();
    this.request = { action, dayId, requestId };
    return requestId;
  }

  matches(requestId: string): boolean {
    return this.request?.requestId === requestId;
  }

  resolve(requestId: string): boolean {
    if (!this.matches(requestId)) return false;
    this.request = null;
    return true;
  }
}

export class DailyChallengeViewedRequestState {
  private confirmedKey = '';
  private pending: { viewedKey: string; requestId: string } | null = null;

  begin(viewedKey: string, requestId: string): boolean {
    if (this.confirmedKey === viewedKey || this.pending !== null) return false;
    this.pending = { viewedKey, requestId };
    return true;
  }

  finish(requestId: string, success: boolean): { matched: boolean; shouldRetry: boolean } {
    if (this.pending?.requestId !== requestId) {
      return { matched: false, shouldRetry: false };
    }
    const viewedKey = this.pending.viewedKey;
    this.pending = null;
    if (success) this.confirmedKey = viewedKey;
    return { matched: true, shouldRetry: !success };
  }
}

export class DailyChallengeRequestTimeout<THandle> {
  private activeRequestId: string | null = null;
  private handle: THandle | null = null;

  constructor(
    private readonly schedule: (seconds: number, callback: () => void) => THandle,
    private readonly cancel: (handle: THandle) => void,
    private readonly timeoutSeconds = 8,
  ) {}

  start(requestId: string, onTimeout: () => void): void {
    this.dispose();
    this.activeRequestId = requestId;
    this.handle = this.schedule(this.timeoutSeconds, () => {
      if (this.activeRequestId !== requestId) return;
      this.activeRequestId = null;
      this.handle = null;
      onTimeout();
    });
  }

  isActive(requestId: string): boolean {
    return this.activeRequestId === requestId;
  }

  finish(requestId: string): boolean {
    if (!this.isActive(requestId)) return false;
    if (this.handle !== null) this.cancel(this.handle);
    this.activeRequestId = null;
    this.handle = null;
    return true;
  }

  dispose(): void {
    if (this.handle !== null) this.cancel(this.handle);
    this.activeRequestId = null;
    this.handle = null;
  }
}

export function getDailyChallengeRewardSourceLocalizationKey(
  source: DailyChallengeRewardSource,
): string {
  return `#daily_challenge_reward_source_${source}`;
}

export function getDailyChallengeRewardTaskTitle(
  reward: DailyChallengeRewardHistoryDto,
  language: string,
): string {
  const task = reward.taskSnapshot;
  if (!task) return '';
  return fillChallengeTarget(task.title, task.target, task.unit, language);
}

export function getDailyChallengeContributionTierLocalizationKey(
  tier: DailyChallengeContributionTier,
): string {
  return `#daily_challenge_reward_tier_${tier}`;
}

export function getDailyChallengeEntryIndicator(
  unreadRewardCount: number,
  needsSelection: boolean,
): DailyChallengeEntryIndicator {
  if (unreadRewardCount > 0) {
    return { kind: 'count', text: String(Math.min(99, Math.floor(unreadRewardCount))) };
  }
  return needsSelection ? { kind: 'dot' } : { kind: 'none' };
}

export function getLocalizedChallengeText(text: LocalizedText, language: string): string {
  if (language === 'schinese') return text.cn;
  if (language === 'russian') return text.ru;
  return text.en;
}

export function formatChallengeValue(value: number, unit: ChallengeUnit, language: string): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  if (unit === 'millisecond') {
    const seconds = safeValue / 1000;
    const formatted = Number.isInteger(seconds)
      ? String(seconds)
      : seconds.toFixed(1).replace(/\.0$/, '');
    return language === 'schinese' ? `${formatted}秒` : `${formatted}s`;
  }
  return formatStatNumber(safeValue, language === 'schinese');
}

export function fillChallengeTarget(
  text: LocalizedText,
  target: number,
  unit: ChallengeUnit,
  language: string,
): string {
  return getLocalizedChallengeText(text, language).replace(
    /\{target\}/g,
    formatChallengeValue(target, unit, language),
  );
}

export function getDailyChallengeRefreshIntent(input: {
  locked: boolean;
  isMember: boolean;
  cost: number;
  balance: number;
}): DailyChallengeRefreshIntent {
  if (input.locked) return 'locked';
  if (!input.isMember) return 'open_member';
  if (input.cost > input.balance) return 'open_points';
  return 'refresh';
}

export function getChallengeProgressPercent(progress: number, target: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(100, (progress / target) * 100));
}

export function getChallengeProgressLayers(
  progress: number,
  provisionalProgress: number,
  target: number,
): { formalPercent: number; provisionalPercent: number; displayedProgress: number } {
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
  if (safeTarget === 0) {
    return { formalPercent: 0, provisionalPercent: 0, displayedProgress: 0 };
  }
  const safeFormal = Math.max(0, Math.min(safeTarget, Number.isFinite(progress) ? progress : 0));
  const remaining = Math.max(0, safeTarget - safeFormal);
  const safeProvisional = Math.max(
    0,
    Math.min(remaining, Number.isFinite(provisionalProgress) ? provisionalProgress : 0),
  );
  return {
    formalPercent: (safeFormal / safeTarget) * 100,
    provisionalPercent: (safeProvisional / safeTarget) * 100,
    displayedProgress: safeFormal + safeProvisional,
  };
}

export function formatDailyChallengeRoundProgress(
  template: string,
  currentRound: number,
  completedRoundCount: number,
  totalRounds: number,
): string {
  return template
    .split('{current}')
    .join(String(currentRound))
    .split('{completed}')
    .join(String(completedRoundCount))
    .split('{total}')
    .join(String(totalRounds));
}

export function formatAutoSyncCountdown(nextSyncAtGameTime: number, gameTime: number): string {
  const remaining = Math.max(0, Math.ceil(nextSyncAtGameTime - gameTime));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
export function isSuccessfulNetworkBoolean(value: boolean | 0 | 1): boolean {
  return value === true || value === 1;
}

export function createDailyChallengeRequestId(
  action: DailyChallengeClientAction,
  dayId: string,
  playerId: number,
  gameTimeMs: number,
  sequence: number,
): string {
  return `dc-${action}-${dayId}-${playerId}-${Math.max(0, Math.floor(gameTimeMs))}-${Math.max(
    0,
    Math.floor(sequence),
  )}`;
}
export function fillGlobalRewardTier(template: string, points: number, percent?: number): string {
  return template
    .replace(/\{points\}/g, String(Math.max(0, Math.floor(points))))
    .replace(/\{percent\}/g, String(Math.max(0, Math.floor(percent ?? 0))));
}
