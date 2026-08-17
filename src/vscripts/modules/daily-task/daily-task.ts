import {
  DailyTaskResultDto,
  DailyTaskStartDto,
  TaskCandidateDto,
} from '../../../common/dto/daily-task';
import { reloadable } from '../../utils/tstl-utils';
import { GameEndPoint } from '../event/game-end/game-end-point';
import { EnvironmentHelper } from '../helper/environment-helper';
import { ReadTaskMetric } from './daily-task-metric-reader';

interface DailyTaskPlayerState extends DailyTaskStartDto {
  selectedTaskId?: string;
}

export interface DailyTaskCompletion {
  /** 上报给 /game/end 的字段，仅此 */
  result: DailyTaskResultDto;
  /** 结算页展示用，同一次查找顺带取出，不重复判定 */
  candidate: TaskCandidateDto;
}

/** 每日任务：判断本局是否可以参与、记录玩家选择的任务、结算时判断是否完成 */
@reloadable
export class DailyTask {
  private state: Map<PlayerID, DailyTaskPlayerState> = new Map();
  private readonly PROGRESS_PUSH_INTERVAL = 1;

  constructor() {
    CustomGameEventManager.RegisterListener('dailytask_select_candidate', (_, event) =>
      this.SelectCandidate(event.PlayerID, event.taskId),
    );
    // 自定义模式的极端配置判定依赖 GameRules.Option，值在加载界面异步写入，
    // 可能晚于 SetStartData 的首次快照，需要在配置变化时重新同步 enabled
    CustomGameEventManager.RegisterListener('game_options_change', () => this.RefreshEnabled());
    this.startProgressPush();
  }

  // 地图类型开局就已经确定，不用等玩家把难度投完票，判断能保证一次成功
  IsDailyTaskEnabled(): boolean {
    if (EnvironmentHelper.IsInvalidGameEnvironment()) {
      return false;
    }
    if (GetMapName() !== 'custom') {
      return true;
    }
    // 每日任务奖励分固定，不受自定义模式综合积分倍率影响，极端配置单独拦截
    return !GameEndPoint.IsExtremeCustomMode(GameRules.Option);
  }

  /** 游戏开始时初始化本局任务状态 */
  SetStartData(playerId: PlayerID, dto: DailyTaskStartDto): void {
    this.state.set(playerId, { ...dto, selectedTaskId: undefined });
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
    // 立即推一次，改选后 HUD 不用等下一个 tick 才对齐
    this.pushProgress(playerId);
  }

  private startProgressPush(): void {
    Timers.CreateTimer(this.PROGRESS_PUSH_INTERVAL, () => {
      const gameState = GameRules.State_Get();
      if (gameState < GameState.PRE_GAME) {
        return this.PROGRESS_PUSH_INTERVAL;
      }
      if (this.IsDailyTaskEnabled()) {
        this.state.forEach((_, playerId) => this.pushProgress(playerId));
      }
      // 结算后指标不再变化，补推的这一次与 EvaluateCompletion 同口径。
      // 停表后 net table 行仍保留，客户端继续显示终值
      if (gameState >= GameState.POST_GAME) {
        return undefined;
      }
      return this.PROGRESS_PUSH_INTERVAL;
    });
  }

  private RefreshEnabled(): void {
    this.state.forEach((_, playerId) => this.setDailyTaskTable(playerId));
  }

  /** 只读查询：本局选中的候选（未选择返回 undefined），供 GA4 等统计模块使用 */
  GetSelectedCandidate(playerId: PlayerID): TaskCandidateDto | undefined {
    return this.findSelectedCandidate(this.state.get(playerId));
  }

  private findSelectedCandidate(state?: DailyTaskPlayerState): TaskCandidateDto | undefined {
    if (!state?.selectedTaskId) {
      return undefined;
    }
    return state.candidates.find((c) => c.taskId === state.selectedTaskId);
  }

  private pushProgress(playerId: PlayerID): void {
    const state = this.state.get(playerId);
    const candidate = this.findSelectedCandidate(state);
    if (!candidate) {
      return;
    }
    const value = ReadTaskMetric(playerId, candidate.metric);
    if (value === undefined) {
      return;
    }
    CustomNetTables.SetTableValue('daily_task_progress', playerId.toString(), {
      taskId: candidate.taskId,
      value,
    });
  }

  /** 判断这局是否完成了每日任务，用于游戏结算时计分与结算页展示 */
  EvaluateCompletion(playerId: PlayerID): DailyTaskCompletion | undefined {
    if (!this.IsDailyTaskEnabled()) {
      return undefined;
    }
    const state = this.state.get(playerId);
    const candidate = this.findSelectedCandidate(state);
    if (!state || !candidate) {
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
      result: {
        taskId: candidate.taskId,
        star: candidate.star,
        seasonPoint: candidate.rewardSeasonPoint,
        dayId: state.dayId,
      },
      candidate,
    };
  }

  private setDailyTaskTable(playerId: PlayerID): void {
    const state = this.state.get(playerId);
    if (!state) {
      return;
    }
    CustomNetTables.SetTableValue('daily_task', playerId.toString(), {
      ...state,
      enabled: this.IsDailyTaskEnabled(),
    });
  }
}
