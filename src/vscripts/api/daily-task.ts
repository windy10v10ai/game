import {
  CompletedTaskDto,
  DailyTaskHistoryEntryDto,
  TaskCandidateDto,
} from '../../common/dto/daily-task';

// /game/start 响应里 dailyTasks 数组的单项形状（每个 steamId 一条）
export class DailyTaskStartDto {
  steamId!: number;
  dayId!: string;
  candidates!: TaskCandidateDto[];
  completedTasks!: CompletedTaskDto[];
  todaySeasonPoint!: number;
  history!: DailyTaskHistoryEntryDto[];
}
