export type TaskScope = 'personal_general' | 'personal_hero';

export type TaskMetric =
  | 'kills'
  | 'assists'
  | 'last_hits'
  | 'tower_kills'
  | 'hero_damage'
  | 'healing'
  | 'total_gold_earned'
  | 'damage_taken'
  | 'stun_duration'
  | 'roshan_kills';

export interface TaskCandidateDto {
  taskId: string;
  scope: TaskScope;
  metric: TaskMetric;
  star: number;
  target: number;
  rewardSeasonPoint: number;
  // 仅 PERSONAL_HERO 存在
  heroName?: string;
}

export interface CompletedTaskDto {
  taskId: string;
  star: number;
}

export interface DailyTaskHistoryEntryDto {
  dayId: string;
  tasks: CompletedTaskDto[];
  seasonPoint: number;
}

/** /game/end 上报的完成结果，未完成任务时整个对象不发送 */
export interface DailyTaskResultDto {
  taskId: string;
  star: number;
  seasonPoint: number;
  /** 本局归属的任务日，取自 /game/start 响应，用于服务端判断任务归属日期 */
  dayId: string;
}

/** /game/start 响应里 dailyTasks 数组的单项形状（每个 steamId 一条） */
export interface DailyTaskStartDto {
  steamId: number;
  dayId: string;
  candidates: TaskCandidateDto[];
  completedTasks: CompletedTaskDto[];
  todaySeasonPoint: number;
  history: DailyTaskHistoryEntryDto[];
}

/** daily_task net table 单个玩家条目 */
export interface DailyTaskNetTableEntry extends Omit<DailyTaskStartDto, 'steamId' | 'dayId'> {
  enabled: boolean;
  selectedTaskId?: string;
}
