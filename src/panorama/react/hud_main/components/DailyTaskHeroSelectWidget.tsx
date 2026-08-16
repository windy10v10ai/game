import React, { useState } from 'react';
import { IsInHeroSelectionLayer } from '@utils/utils';
import { PrimaryButton } from '../../shared/components';
import { useNetTable } from '../../shared/hooks/useNetTable';
import { getDisplayCandidates } from '../pages/profile/tabs/dailytask/dailytask-ui';

const localize = (key: string): string => $.Localize(key);

/**
 * 选英雄阶段的每日任务候选速览：屏幕中下方常驻 3 行，可直接领取任务，不需要打开个人中心。
 */
export function DailyTaskHeroSelectWidget() {
  const playerId = Game.GetLocalPlayerID();
  const dailyTask = useNetTable('daily_task', playerId >= 0 ? String(playerId) : null);
  // hud_main 同时注册在三层，这个浮窗只在选英雄层渲染一份；所在层不会变，只判定一次
  const [inHeroSelectLayer] = useState(IsInHeroSelectionLayer);

  const handleSelect = (taskId: string) => {
    GameEvents.SendCustomGameEventToServer('dailytask_select_candidate', { taskId });
  };

  const displayCandidates = dailyTask?.enabled
    ? getDisplayCandidates(dailyTask.candidates, $.Language(), localize)
    : [];
  const hidden = !inHeroSelectLayer || displayCandidates.length === 0;

  return (
    <Panel className="dailytask-heroselect" style={{ visibility: hidden ? 'collapse' : 'visible' }}>
      {displayCandidates.map(({ candidate, title }) => {
        const selected = candidate.taskId === dailyTask?.selectedTaskId;
        return (
          <Panel key={candidate.taskId} className="dailytask-heroselect-row">
            <Panel className="dailytask-heroselect-row-left">
              <Panel className={`dailytask-star-badge dailytask-star-${candidate.star}`}>
                <Label className="dailytask-star-visual" text={'★'.repeat(candidate.star)} />
              </Panel>
              {candidate.heroName ? (
                <DOTAHeroImage
                  className="dailytask-heroselect-hero-icon"
                  heroname={candidate.heroName}
                  heroimagestyle="icon"
                />
              ) : null}
              <Label className="dailytask-heroselect-title" html={true} text={title} />
            </Panel>
            {selected ? (
              <Panel className="dailytask-heroselect-claimed-badge">
                <Label
                  className="dailytask-heroselect-claimed-label"
                  text={localize('#dailytask_selected_label')}
                />
              </Panel>
            ) : (
              <PrimaryButton
                className="dailytask-heroselect-select-btn"
                onClick={() => handleSelect(candidate.taskId)}
                label={localize('#dailytask_select_button')}
              />
            )}
          </Panel>
        );
      })}
    </Panel>
  );
}
