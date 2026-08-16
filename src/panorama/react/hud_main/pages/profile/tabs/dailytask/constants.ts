// 每天轮数，服务端当前默认值（spec 3.1），DTO 不下发，改动不影响契约
export const TOTAL_ROUNDS_PER_DAY = 3;

export type DailyTaskSubTab = 'candidates' | 'history';

export const DAILY_TASK_SUB_TABS: { id: DailyTaskSubTab; label: string }[] = [
  { id: 'candidates', label: $.Localize('#dailytask_subtab_candidates') },
  { id: 'history', label: $.Localize('#dailytask_subtab_history') },
];
