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

/**
 * 每日任务 G1：模式门控 + 指标读取分发 + 达标判定 + 候选本地状态。
 * 结算上报（game-end.ts）与 UI 是后续 PR，本模块只暴露 EvaluateCompletion 供结算调用。
 */
@reloadable
export class DailyTask {
  private state: Map<PlayerID, DailyTaskPlayerState> = new Map();

  constructor() {
    CustomGameEventManager.RegisterListener('dailytask_select_candidate', (_, event) =>
      this.SelectCandidate(event.PlayerID, event.taskId),
    );
  }

  // mapName 开局即固定，判定保证一次成功，不用等玩家投票的难度定下来
  IsDailyTaskEnabled(): boolean {
    // 工具模式下忽略作弊/localhost，避免开发调试时被误判为禁用，与 GetDifficultyMultiplier 处理方式一致
    if (!IsInToolsMode()) {
      if (GameRules.IsCheatMode() || ApiClient.IsLocalhost()) {
        return false;
      }
    }
    return GetMapName() !== 'custom';
  }

  /** /game/start 响应解析后调用，dto 由 game.ts 按 steamId 匹配出 playerId 后传入 */
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

  /** 未知 taskId（不在当前候选里）直接忽略，不崩溃、不影响已选状态 */
  SelectCandidate(playerId: PlayerID, taskId: string): void {
    const state = this.state.get(playerId);
    if (!state) {
      return;
    }
    const candidate = state.candidates.find((c) => c.taskId === taskId);
    if (!candidate) {
      print(`[DailyTask] SelectCandidate: unknown taskId=${taskId} playerId=${playerId}`);
      return;
    }
    state.selectedTaskId = taskId;
    this.setDailyTaskTable(playerId);
  }

  /**
   * 结算判定入口，供后续 game-end.ts 改造调用。门控未通过 / 未选候选 / 候选未知 /
   * 英雄不匹配 / 指标未识别 / 未达标，均返回 undefined。
   */
  EvaluateCompletion(playerId: PlayerID): DailyTaskCompletionResult | undefined {
    if (!this.IsDailyTaskEnabled()) {
      return undefined;
    }
    const state = this.state.get(playerId);
    if (!state?.selectedTaskId) {
      return undefined;
    }
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
