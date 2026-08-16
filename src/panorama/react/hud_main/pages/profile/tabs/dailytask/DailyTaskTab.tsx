import React from 'react';
import { useNetTable } from '../../../../../shared/hooks/useNetTable';
import { getDisplayCandidates } from './dailytask-ui';
import { TaskCandidateCard } from './TaskCandidateCard';

// 每天轮数，服务端当前默认值（spec 3.1），DTO 不下发，改动不影响契约
const TOTAL_ROUNDS_PER_DAY = 3;

/**
 * 每日任务 Tab：展示本局候选任务卡，点击本地选择一个，零网络请求。
 * 禁用态（自定义难度/作弊/localhost）与空候选态共享同一份固定 panel 树，
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

  const completedRoundCount = Math.min(TOTAL_ROUNDS_PER_DAY, dailyTask?.completedTasks.length ?? 0);
  const currentRound = Math.min(TOTAL_ROUNDS_PER_DAY, completedRoundCount + 1);
  const roundText = $.Localize('#dailytask_header_round')
    .replace('{round}', String(currentRound))
    .replace('{total}', String(TOTAL_ROUNDS_PER_DAY));

  return (
    <Panel className="dailytask-root">
      <Label className="dailytask-header-title" text={$.Localize('#dailytask_header_title')} />
      <Panel
        className="dailytask-header-status"
        style={{ visibility: showHint ? 'collapse' : 'visible' }}
      >
        <Label className="dailytask-header-round" text={roundText} />
        <Label
          className="dailytask-header-subtitle"
          text={$.Localize('#dailytask_header_subtitle')}
        />
      </Panel>
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
