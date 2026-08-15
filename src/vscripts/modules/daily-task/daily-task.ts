import {
  CompletedTaskDto,
  DailyTaskHistoryEntryDto,
  TaskCandidateDto,
} from '../../../common/dto/daily-task';
import { ApiClient } from '../../api/api-client';
import { DailyTaskStartDto } from '../../api/daily-task';
import { reloadable } from '../../utils/tstl-utils';
import { ReadTaskMetric } from './daily-task-metric-reader';

export interface DailyTaskCompletionResult {
  taskId: string;
  star: number;
  seasonPoint: number;
}

interface DailyTaskPlayerState {
  candidates: TaskCandidateDto[];
  completedTasks: CompletedTaskDto[];
  todaySeasonPoint: number;
  history: DailyTaskHistoryEntryDto[];
  selectedTaskId?: string;
}

/** 每日任务：判断本局是否可以参与、记录玩家选择的任务、结算时判断是否完成 */
@reloadable
export class DailyTask {
  private state: Map<PlayerID, DailyTaskPlayerState> = new Map();

  constructor() {
    CustomGameEventManager.RegisterListener('dailytask_select_candidate', (_, event) =>
      this.SelectCandidate(event.PlayerID, event.taskId),
    );
  }

  // 地图类型开局就已经确定，不用等玩家把难度投完票，判断能保证一次成功
  IsDailyTaskEnabled(): boolean {
    // 工具模式下不受作弊模式/本地环境影响，避免开发调试时被误判为禁用
    if (!IsInToolsMode()) {
      if (GameRules.IsCheatMode() || ApiClient.IsLocalhost()) {
        return false;
      }
    }
    return GetMapName() !== 'custom';
  }

  /** 游戏开始时初始化本局任务状态 */
  SetStartData(playerId: PlayerID, dto: DailyTaskStartDto): void {
    this.state.set(playerId, {
      candidates: dto.candidates,
      completedTasks: dto.completedTasks,
      todaySeasonPoint: dto.todaySeasonPoint,
      history: dto.history,
      selectedTaskId: undefined,
    });
    this.setDailyTaskTable(playerId);
  }

  /** 玩家选择一个候选任务 */
  SelectCandidate(playerId: PlayerID, taskId: string): void {
    const state = this.state.get(playerId);
    if (!state) {
      return;
    }
    // 选了一个不在候选里的任务，直接忽略，不崩溃、不影响已选状态
    const candidate = state.candidates.find((c) => c.taskId === taskId);
    if (!candidate) {
      print(`[DailyTask] SelectCandidate: unknown taskId=${taskId} playerId=${playerId}`);
      return;
    }
    state.selectedTaskId = taskId;
    this.setDailyTaskTable(playerId);
  }

  /** 判断这局是否完成了每日任务，用于游戏结算时计分 */
  EvaluateCompletion(playerId: PlayerID): DailyTaskCompletionResult | undefined {
    if (!this.IsDailyTaskEnabled()) {
      return undefined;
    }
    const state = this.state.get(playerId);
    if (!state?.selectedTaskId) {
      return undefined;
    }
    // 防御性检查：能被选中的任务本来就一定在候选列表里，这里理论上必然能找到
    const candidate = state.candidates.find((c) => c.taskId === state.selectedTaskId);
    if (!candidate) {
      return undefined;
    }
    if (candidate.scope === 'personal_hero') {
      const heroName = PlayerResource.GetSelectedHeroName(playerId);
      if (candidate.heroName !== heroName) {
        return undefined;
      }
    }
    // 无法识别的指标（老客户端遇到新任务池）按未达标处理
    const value = ReadTaskMetric(playerId, candidate.metric);
    if (value === undefined || value < candidate.target) {
      return undefined;
    }
    return {
      taskId: candidate.taskId,
      star: candidate.star,
      seasonPoint: candidate.rewardSeasonPoint,
    };
  }

  private setDailyTaskTable(playerId: PlayerID): void {
    const state = this.state.get(playerId);
    if (!state) {
      return;
    }
    CustomNetTables.SetTableValue('daily_task', playerId.toString(), {
      enabled: this.IsDailyTaskEnabled(),
      candidates: state.candidates,
      selectedTaskId: state.selectedTaskId,
      completedTasks: state.completedTasks,
      todaySeasonPoint: state.todaySeasonPoint,
      history: state.history,
    });
  }
}
