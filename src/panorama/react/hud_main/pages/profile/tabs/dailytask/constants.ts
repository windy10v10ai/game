export type DailyTaskSubTab = 'candidates' | 'history';

export const DAILY_TASK_SUB_TABS: { id: DailyTaskSubTab; label: string }[] = [
  { id: 'candidates', label: $.Localize('#dailytask_subtab_candidates') },
  { id: 'history', label: $.Localize('#dailytask_subtab_history') },
];
