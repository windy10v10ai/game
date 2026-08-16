import React from 'react';
import { useNetTable } from '../../../../../shared/hooks/useNetTable';
import { getDisplayCandidates } from './dailytask-ui';
import { TaskCandidateCard } from './TaskCandidateCard';

/**
 * 每日任务 Tab：展示本局候选任务卡，点击本地选择一个，零网络请求。
 * 禁用态（自定义地图/作弊/localhost）与空候选态共享同一份固定 panel 树，
 * 用 visibility 切换显隐，避免 panel 因条件返回不同结构而在 Panorama DOM 中缺失。
 */
export function DailyTaskTab() {
  const playerId = Game.GetLocalPlayerID();
  const dailyTask = useNetTable('daily_task', playerId >= 0 ? String(playerId) : null);

  const handleSelect = (taskId: string) => {
    GameEvents.SendCustomGameEventToServer('dailytask_select_candidate', { taskId });
  };

  const disabled = dailyTask?.enabled === false;
  const displayCandidates = dailyTask
    ? getDisplayCandidates(dailyTask.candidates, $.Language(), (key) => $.Localize(key))
    : [];
  const showHint = disabled || displayCandidates.length === 0;
  const hintKey = disabled ? '#dailytask_disabled_hint' : '#dailytask_empty_hint';

  return (
    <Panel className="dailytask-root">
      <Label
        className="dailytask-hint"
        style={{ visibility: showHint ? 'visible' : 'collapse' }}
        text={$.Localize(hintKey)}
      />
      <Panel
        className="dailytask-candidate-row"
        style={{ visibility: showHint ? 'collapse' : 'visible' }}
      >
        {displayCandidates.map(({ candidate, title }) => (
          <TaskCandidateCard
            key={candidate.taskId}
            candidate={candidate}
            title={title}
            selected={candidate.taskId === dailyTask?.selectedTaskId}
            onSelect={handleSelect}
          />
        ))}
      </Panel>
    </Panel>
  );
}
