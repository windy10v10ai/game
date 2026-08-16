import { getTaskTitle, getDisplayCandidates } from './dailytask-ui';
import { TaskCandidateDto } from '../../../../../../../common/dto/daily-task';

const TEMPLATES: Record<string, string> = {
  '#dailytask_task_general_kills': '本局击杀英雄达到 {target} 次',
  '#dailytask_task_hero_hero_damage': '使用 {hero} 单局对敌方英雄造成 {target} 点伤害',
  '#dailytask_task_general_roshan_kills': '本局击杀 {target} 次肉山',
  // roshan_kills 不应出现英雄任务模板，这条只用于验证 scope 限制不依赖模板是否存在
  '#dailytask_task_hero_roshan_kills': '不应被使用',
  '#npc_dota_hero_lina': '莉娜',
};

const localize = (key: string): string => TEMPLATES[key] ?? key;

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

describe('getTaskTitle', () => {
  it('渲染通用任务标题并替换 target', () => {
    expect(getTaskTitle(makeCandidate(), 'schinese', localize)).toBe(
      "本局击杀英雄达到 <font color='#FFFFFF'><b>20</b></font> 次",
    );
  });

  it('渲染英雄任务标题并替换 hero 与 target', () => {
    const candidate = makeCandidate({
      taskId: 'hero_lina_1',
      scope: 'personal_hero',
      metric: 'hero_damage',
      heroName: 'npc_dota_hero_lina',
      target: 500000,
    });
    expect(getTaskTitle(candidate, 'schinese', localize)).toBe(
      "使用 莉娜 单局对敌方英雄造成 <font color='#FFFFFF'><b>50万</b></font> 点伤害",
    );
  });

  it('本地化模板缺失时返回 undefined（老客户端遇到新任务池）', () => {
    const candidate = makeCandidate({ metric: 'assists' });
    expect(getTaskTitle(candidate, 'schinese', localize)).toBeUndefined();
  });

  it('未识别的 metric 返回 undefined', () => {
    const candidate = makeCandidate({ metric: 'unknown_metric' as TaskCandidateDto['metric'] });
    expect(getTaskTitle(candidate, 'schinese', localize)).toBeUndefined();
  });

  it('roshan_kills 只在通用候选下识别，英雄候选即使有模板也判未知', () => {
    const generalCandidate = makeCandidate({ metric: 'roshan_kills', target: 2 });
    const heroCandidate = makeCandidate({
      scope: 'personal_hero',
      metric: 'roshan_kills',
      heroName: 'npc_dota_hero_lina',
    });
    expect(getTaskTitle(generalCandidate, 'schinese', localize)).toBe(
      "本局击杀 <font color='#FFFFFF'><b>2</b></font> 次肉山",
    );
    expect(getTaskTitle(heroCandidate, 'schinese', localize)).toBeUndefined();
  });
});

describe('getDisplayCandidates', () => {
  it('过滤掉未知候选，保留的候选携带正确解析出的标题，不连累其他候选', () => {
    const known = makeCandidate();
    const unknown = makeCandidate({
      taskId: 'general_unknown',
      metric: 'unknown_metric' as TaskCandidateDto['metric'],
    });
    const result = getDisplayCandidates([known, unknown], 'schinese', localize);
    expect(result).toEqual([
      { candidate: known, title: "本局击杀英雄达到 <font color='#FFFFFF'><b>20</b></font> 次" },
    ]);
  });
});
