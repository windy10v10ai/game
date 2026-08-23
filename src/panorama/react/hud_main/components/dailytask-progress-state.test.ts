import { DailyTaskNetTableEntry, TaskCandidateDto } from '../../../../common/dto/daily-task';
import { getDailyTaskHudState } from './dailytask-progress-state';

const LINA = 'npc_dota_hero_lina';

function makeCandidate(overrides: Partial<TaskCandidateDto> = {}): TaskCandidateDto {
  return {
    taskId: 'general_kills',
    scope: 'personal_general',
    metric: 'kills',
    star: 2,
    target: 20,
    rewardSeasonPoint: 80,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<DailyTaskNetTableEntry> = {}): DailyTaskNetTableEntry {
  return {
    steamId: 1,
    dayId: '20260816',
    candidates: [makeCandidate()],
    completedTasks: [],
    todaySeasonPoint: 0,
    history: [],
    refreshRemaining: 1,
    enabled: true,
    ...overrides,
  };
}

describe('getDailyTaskHudState', () => {
  it('游戏尚未开始时收起', () => {
    const entry = makeEntry({ selectedTaskId: 'general_kills' });
    expect(getDailyTaskHudState(entry, null, LINA, false).kind).toBe('hidden');
  });

  it('无数据、禁用态、空候选都收起', () => {
    expect(getDailyTaskHudState(null, null, LINA, true).kind).toBe('hidden');
    expect(getDailyTaskHudState(makeEntry({ enabled: false }), null, LINA, true).kind).toBe(
      'hidden',
    );
    expect(getDailyTaskHudState(makeEntry({ candidates: [] }), null, LINA, true).kind).toBe(
      'hidden',
    );
  });

  it('当日轮数已全部完成时收起', () => {
    const entry = makeEntry({
      completedTasks: [makeCandidate(), makeCandidate(), makeCandidate()],
    });
    expect(getDailyTaskHudState(entry, null, LINA, true).kind).toBe('hidden');
  });

  it('有候选但未选任务时提示未领取', () => {
    expect(getDailyTaskHudState(makeEntry(), null, LINA, true).kind).toBe('unclaimed');
  });

  it('选中的任务不在候选里时按未领取处理', () => {
    const entry = makeEntry({ selectedTaskId: 'not_in_candidates' });
    expect(getDailyTaskHudState(entry, null, LINA, true).kind).toBe('unclaimed');
  });

  it('英雄任务与本地英雄不符时进入不符态', () => {
    const candidate = makeCandidate({
      taskId: 'hero_kills',
      scope: 'personal_hero',
      heroName: LINA,
    });
    const entry = makeEntry({ candidates: [candidate], selectedTaskId: 'hero_kills' });
    const state = getDailyTaskHudState(entry, null, 'npc_dota_hero_lion', true);
    expect(state.kind).toBe('hero_mismatch');
  });

  it('英雄任务与本地英雄一致时正常计进度', () => {
    const candidate = makeCandidate({
      taskId: 'hero_kills',
      scope: 'personal_hero',
      heroName: LINA,
    });
    const entry = makeEntry({ candidates: [candidate], selectedTaskId: 'hero_kills' });
    const state = getDailyTaskHudState(entry, { taskId: 'hero_kills', value: 5 }, LINA, true);
    expect(state).toMatchObject({ kind: 'progress', value: 5, completed: false });
  });

  it('达标时标记完成', () => {
    const entry = makeEntry({ selectedTaskId: 'general_kills' });
    const state = getDailyTaskHudState(entry, { taskId: 'general_kills', value: 25 }, LINA, true);
    expect(state).toMatchObject({ kind: 'progress', value: 25, completed: true });
  });

  it('进度行属于旧任务时按 0 渲染', () => {
    const entry = makeEntry({ selectedTaskId: 'general_kills' });
    const state = getDailyTaskHudState(entry, { taskId: 'other_task', value: 99 }, LINA, true);
    expect(state).toMatchObject({ kind: 'progress', value: 0, completed: false });
  });

  it('还没收到进度推送时按 0 渲染', () => {
    const entry = makeEntry({ selectedTaskId: 'general_kills' });
    const state = getDailyTaskHudState(entry, null, LINA, true);
    expect(state).toMatchObject({ kind: 'progress', value: 0, completed: false });
  });
});
