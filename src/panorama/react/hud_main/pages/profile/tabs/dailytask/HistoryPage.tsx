import React from 'react';
import { useNetTable } from '../../../../../shared/hooks/useNetTable';
import { TOTAL_ROUNDS_PER_DAY } from './constants';
import { formatHistoryDate, getMetricShortLabel } from './dailytask-ui';

/**
 * 每日任务历史记录子页：每天一行，今天的进行中记录排在最前。
 * 每轮槽位展示头像+星级（同行，与候选卡一致）+ 简短指标标签，凑不满 3 轮的槽位留空对齐。
 */
export function HistoryPage() {
  const playerId = Game.GetLocalPlayerID();
  const dailyTask = useNetTable('daily_task', playerId >= 0 ? String(playerId) : null);

  // history 只记录"跨天时已归档的天"，今天还在累积的完成记录单独从 completedTasks 拼进列表最前
  const todayEntry =
    dailyTask && dailyTask.completedTasks.length > 0
      ? {
          dayId: dailyTask.dayId,
          tasks: dailyTask.completedTasks,
          seasonPoint: dailyTask.todaySeasonPoint,
        }
      : null;
  const entries = todayEntry
    ? [todayEntry, ...(dailyTask?.history ?? [])]
    : (dailyTask?.history ?? []);

  return (
    <Panel className="dailytask-history-root">
      <Label className="dailytask-history-title" text={$.Localize('#dailytask_subtab_history')} />
      <Label
        className="dailytask-hint"
        style={{ visibility: entries.length === 0 ? 'visible' : 'collapse' }}
        text={$.Localize('#dailytask_history_empty_hint')}
      />
      <Panel
        className="dailytask-history-header"
        style={{ visibility: entries.length === 0 ? 'collapse' : 'visible' }}
      >
        <Label
          className="dailytask-history-header-date"
          text={$.Localize('#dailytask_history_col_date')}
        />
        <Label
          className="dailytask-history-header-tasks"
          text={$.Localize('#dailytask_history_col_tasks')}
        />
        <Panel className="dailytask-history-spacer" />
        <Label
          className="dailytask-history-header-points"
          text={$.Localize('#dailytask_history_col_points')}
        />
      </Panel>
      <Panel
        className="dailytask-history-list"
        style={{ visibility: entries.length === 0 ? 'collapse' : 'visible' }}
      >
        {entries.map((entry) => {
          const isToday = entry.dayId === dailyTask?.dayId;
          return (
            <Panel
              key={entry.dayId}
              className={`dailytask-history-row${isToday ? ' dailytask-history-row-today' : ''}`}
            >
              <Label
                className="dailytask-history-date"
                text={
                  isToday ? $.Localize('#dailytask_history_today') : formatHistoryDate(entry.dayId)
                }
              />
              <Panel className="dailytask-history-slots">
                {Array.from({ length: TOTAL_ROUNDS_PER_DAY }, (_, index) => {
                  const task = entry.tasks[index];
                  const metricLabel = task
                    ? getMetricShortLabel(task.metric, (key) => $.Localize(key))
                    : undefined;
                  return (
                    <Panel key={index} className="dailytask-history-slot">
                      {task && (
                        <>
                          <Panel className="dailytask-history-slot-top">
                            {task.heroName && (
                              <DOTAHeroImage
                                className="dailytask-history-slot-hero"
                                heroname={task.heroName}
                                heroimagestyle="icon"
                              />
                            )}
                            <Label
                              className="dailytask-history-slot-star"
                              text={'★'.repeat(task.star)}
                            />
                          </Panel>
                          {metricLabel && (
                            <Label className="dailytask-history-slot-metric" text={metricLabel} />
                          )}
                        </>
                      )}
                    </Panel>
                  );
                })}
              </Panel>
              <Panel className="dailytask-history-spacer" />
              <Label
                className="dailytask-history-points"
                text={$.Localize('#dailytask_reward_hint').replace(
                  '{n}',
                  String(entry.seasonPoint),
                )}
              />
            </Panel>
          );
        })}
      </Panel>
    </Panel>
  );
}
