export type DailyChallengeSnapshotVersion = 2;
export type ChallengeScope = 'global' | 'personal_general' | 'personal_hero';
export type ChallengeMetric =
  | 'bot_kills'
  | 'roshan_kills'
  | 'hero_damage'
  | 'physical_damage'
  | 'magical_damage'
  | 'pure_damage'
  | 'damage_taken'
  | 'healing'
  | 'kills'
  | 'assists'
  | 'last_hits'
  | 'tower_kills'
  | 'stun_duration_ms'
  | 'slow_duration_ms'
  | 'root_duration_ms'
  | 'silence_duration_ms'
  | 'taunt_duration_ms'
  | 'break_duration_ms'
  | 'debuff_duration_ms';
export type ChallengeUnit = 'count' | 'damage' | 'millisecond';
export type ChallengeDayStatus = 'open' | 'closing' | 'frozen' | 'rewarding' | 'settled';
export type DailyChallengeRewardSource = 'personal' | 'global' | 'streak';
export type DailyChallengeContributionTier = 'top' | 'middle' | 'base';
export type DailyChallengeStar = 1 | 2 | 3;

export interface DailyChallengeLocalizedTextDto {
  cn: string;
  en: string;
  ru: string;
}

export interface DailyChallengeTaskSnapshotDto {
  assignmentId: string;
  taskId: string;
  revision: number;
  scope: ChallengeScope;
  /** Frozen by v2 backend; optional while old cached snapshots age out. */
  configVersion?: number;
  /** Personal assignments include their current round; global assignments omit it. */
  round?: number;
  totalRounds?: number;
  metric: ChallengeMetric;
  heroName?: string;
  unit: ChallengeUnit;
  minDataVersion?: number;
  title: DailyChallengeLocalizedTextDto;
  description: DailyChallengeLocalizedTextDto;
  target: number;
  progress: number;
  rewardSeasonPoint: number;
  /** Personal tasks freeze their rolled star. Global tasks omit this field. */
  star?: DailyChallengeStar;
}

export interface DailyChallengeGlobalRewardTiersDto {
  topPercent: number;
  middlePercent: number;
  topRewardSeasonPoint: number;
  middleRewardSeasonPoint: number;
  baseRewardSeasonPoint: number;
}

export interface DailyChallengeStreakStateDto {
  currentDays: number;
  cycleTargetDays: number;
  nextMilestoneDays: number;
  nextMilestoneRewardSeasonPoint: number;
}

export interface DailyChallengeRefreshStateDto {
  isMember: boolean;
  freeRefreshAvailable: boolean;
  paidRefreshesUsed: number;
  paidRefreshesRemaining: number;
  nextCostMemberPoint: number;
}

export type DailyChallengeClientAction = 'accept' | 'refresh' | 'snapshot' | 'sync' | 'view';

export interface DailyChallengeLastActionDto {
  action: DailyChallengeClientAction;
  requestId: string;
  success: boolean;
  code: string;
  costMemberPoint?: number;
}

export interface DailyChallengeActionResultDto extends DailyChallengeLastActionDto {
  snapshot?: DailyChallengePlayerSnapshotDto;
}

export interface DailyChallengeCurrentMatchProgressDto {
  assignmentId: string;
  provisionalProgress: number;
  lastSyncedAtGameTime: number;
  nextAutoSyncAtGameTime?: number;
}

export interface DailyChallengeRewardHistoryDto {
  rewardId: string;
  dayId: string;
  source: DailyChallengeRewardSource;
  seasonPoint: number;
  createdAt: string;
  configVersionId?: string;
  configVersion?: number;
  assignmentId?: string;
  contributionTier?: DailyChallengeContributionTier;
  streakDays?: number;
  taskSnapshot?: DailyChallengeTaskSnapshotDto;
}
export interface DailyChallengePlayerSnapshotDto {
  schemaVersion: DailyChallengeSnapshotVersion;
  steamId: number;
  dayId: string;
  status: ChallengeDayStatus;
  startsAt: string;
  endsAt: string;
  /** Used to reject stale async snapshots from the same challenge day. */
  updatedAt?: string;
  globalTask?: DailyChallengeTaskSnapshotDto;
  globalRewardTiers: DailyChallengeGlobalRewardTiersDto;
  candidates: DailyChallengeTaskSnapshotDto[];
  acceptedTask?: DailyChallengeTaskSnapshotDto;
  /** Optional during rolling deployment; normalized to 0/1/3/[] by the Panorama client. */
  completedRoundCount?: number;
  currentRound?: number;
  totalRounds?: number;
  completedTasks?: DailyChallengeTaskSnapshotDto[];
  currentMatchProgress?: DailyChallengeCurrentMatchProgressDto;
  unreadRewardCount: number;
  recentRewards: DailyChallengeRewardHistoryDto[];
  needsSelection: boolean;
  streak: DailyChallengeStreakStateDto;
  refresh: DailyChallengeRefreshStateDto;
  lastAction?: DailyChallengeLastActionDto;
}

export interface DailyChallengeMetricContributionDto {
  metric: ChallengeMetric;
  value: number;
}

export interface DailyChallengePlayerContributionDto {
  steamId: number;
  normallySettled: boolean;
  acceptedAssignmentId?: string;
  personalMetrics: DailyChallengeMetricContributionDto[];
  globalMetrics: DailyChallengeMetricContributionDto[];
}

export interface DailyChallengeMatchContributionDto {
  schemaVersion: DailyChallengeSnapshotVersion;
  dataVersion: number;
  dayId: string;
  matchStartedAt: string;
  players: DailyChallengePlayerContributionDto[];
}

export interface DailyChallengeGameEndRewardDto {
  steamId: number;
  source: DailyChallengeRewardSource;
  seasonPoint: number;
  dayId: string;
  assignmentId: string;
}

export interface DailyChallengeRewardDetailDto {
  dayId: string;
  source: DailyChallengeRewardSource;
  configVersionId?: string;
  configVersion?: number;
  assignmentId?: string;
  contributionTier?: DailyChallengeContributionTier;
  streakDays?: number;
  taskSnapshot?: DailyChallengeTaskSnapshotDto;
}
