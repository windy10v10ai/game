import { TaskCandidateDto, TaskMetric } from '../../../../../../../common/dto/daily-task';
import { formatStatNumber } from '../../../../../shared/utils/format-stat-number';

// roshan_kills 单局归属唯一，不适合做英雄专属任务，只保留在通用任务里（spec 12.2）
const HERO_METRICS: readonly TaskMetric[] = [
  'kills',
  'assists',
  'last_hits',
  'tower_kills',
  'hero_damage',
  'healing',
  'total_gold_earned',
  'damage_taken',
  'stun_duration',
];
const GENERAL_ONLY_METRICS: readonly TaskMetric[] = ['roshan_kills'];

function getTaskLocalizationKey(candidate: Pick<TaskCandidateDto, 'scope' | 'metric'>): string {
  const scopeKey = candidate.scope === 'personal_hero' ? 'hero' : 'general';
  return `#dailytask_task_${scopeKey}_${candidate.metric}`;
}

function isKnownMetric(candidate: Pick<TaskCandidateDto, 'scope' | 'metric'>): boolean {
  if (candidate.scope === 'personal_hero') {
    return HERO_METRICS.includes(candidate.metric);
  }
  return HERO_METRICS.includes(candidate.metric) || GENERAL_ONLY_METRICS.includes(candidate.metric);
}

/**
 * 候选任务标题，metric 不认识或本地化模板缺失时返回 undefined（spec 5.4 未知候选保护）。
 * 返回值内嵌 HTML 高亮数值，渲染方需要 `html={true}`。
 */
export function getTaskTitle(
  candidate: Pick<TaskCandidateDto, 'scope' | 'metric' | 'heroName' | 'target'>,
  language: string,
  localize: (key: string) => string,
): string | undefined {
  if (!isKnownMetric(candidate)) return undefined;
  const key = getTaskLocalizationKey(candidate);
  const template = localize(key);
  if (template === key) return undefined;
  const hero = candidate.heroName ? localize(`#${candidate.heroName}`) : '';
  const target = formatStatNumber(candidate.target, language === 'schinese');
  // 数值强调沿用项目既有约定（如 awaken_unlock_intro_desc 的积分数字）：白色加粗
  const targetHtml = `<font color='#FFFFFF'><b>${target}</b></font>`;
  return template.replace(/\{hero\}/g, hero).replace(/\{target\}/g, targetHtml);
}

export interface DisplayCandidate {
  candidate: TaskCandidateDto;
  title: string;
}

/** 过滤未知候选并解析标题；一个候选不认识不连累同组另外两个（spec 5.4） */
export function getDisplayCandidates(
  candidates: TaskCandidateDto[],
  language: string,
  localize: (key: string) => string,
): DisplayCandidate[] {
  const result: DisplayCandidate[] = [];
  for (const candidate of candidates) {
    const title = getTaskTitle(candidate, language, localize);
    if (title !== undefined) {
      result.push({ candidate, title });
    }
  }
  return result;
}

/** history[].dayId 是 'YYYYMMDD'，格式化成 'MM-DD' 用于历史列表展示 */
export function formatHistoryDate(dayId: string): string {
  if (!/^\d{8}$/.test(dayId)) return dayId;
  return `${dayId.slice(4, 6)}-${dayId.slice(6, 8)}`;
}

const METRIC_SHORT_LABEL_KEYS: Record<TaskMetric, string> = {
  kills: '#dailytask_metric_short_kills',
  assists: '#dailytask_metric_short_assists',
  last_hits: '#dailytask_metric_short_last_hits',
  tower_kills: '#dailytask_metric_short_tower_kills',
  hero_damage: '#dailytask_metric_short_hero_damage',
  healing: '#dailytask_metric_short_healing',
  total_gold_earned: '#dailytask_metric_short_total_gold_earned',
  damage_taken: '#dailytask_metric_short_damage_taken',
  stun_duration: '#dailytask_metric_short_stun_duration',
  roshan_kills: '#dailytask_metric_short_roshan_kills',
};

/** 历史行槽位下方的简短指标标签；metric 不认识（本地化模板缺失）时返回 undefined */
export function getMetricShortLabel(
  metric: TaskMetric,
  localize: (key: string) => string,
): string | undefined {
  const key = METRIC_SHORT_LABEL_KEYS[metric];
  if (!key) return undefined;
  const label = localize(key);
  return label === key ? undefined : label;
}
