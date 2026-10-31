import { DailyTaskNetTableEntry, TaskCandidateDto } from '../../../../common/dto/daily-task';
import { TOTAL_ROUNDS_PER_DAY } from '../pages/profile/tabs/dailytask/dailytask-ui';

export type DailyTaskHudState =
  | { kind: 'hidden' }
  | { kind: 'unclaimed' }
  | { kind: 'hero_mismatch'; candidate: TaskCandidateDto }
  | { kind: 'progress'; candidate: TaskCandidateDto; value: number; completed: boolean };

export interface DailyTaskProgressRow {
  taskId: string;
  value: number;
}

/**
 * 计算局内任务进度组件当前应处的状态。
 * 服务端不为这个组件下发任何判定字段，全部由已有的 daily_task 行与进度行本地推导。
 */
export function getDailyTaskHudState(
  dailyTask: DailyTaskNetTableEntry | null,
  progress: DailyTaskProgressRow | null,
  localHeroName: string,
  gameStarted: boolean,
): DailyTaskHudState {
  if (!gameStarted || !dailyTask || !dailyTask.enabled) {
    return { kind: 'hidden' };
  }
  if (dailyTask.candidates.length === 0) {
    return { kind: 'hidden' };
  }
  if (dailyTask.completedTasks.length >= TOTAL_ROUNDS_PER_DAY) {
    return { kind: 'hidden' };
  }

  const candidate = dailyTask.candidates.find((c) => c.taskId === dailyTask.selectedTaskId);
  if (!candidate) {
    return { kind: 'unclaimed' };
  }

  // 候选在选人阶段就已下发，玩家可能选了任务却玩了别的英雄，这局必然拿不到
  if (candidate.scope === 'personal_hero' && candidate.heroName !== localHeroName) {
    return { kind: 'hero_mismatch', candidate };
  }

  // 改选任务的瞬间进度行还停留在旧任务上，此时按 0 渲染，等下一次推送对齐
  const value = progress && progress.taskId === candidate.taskId ? progress.value : 0;
  return { kind: 'progress', candidate, value, completed: value >= candidate.target };
}
