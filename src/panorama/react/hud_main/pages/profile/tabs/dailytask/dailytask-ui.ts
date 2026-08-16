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

/** 候选任务标题，metric 不认识或本地化模板缺失时返回 undefined（spec 5.4 未知候选保护） */
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
  return template.replace(/\{hero\}/g, hero).replace(/\{target\}/g, target);
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
