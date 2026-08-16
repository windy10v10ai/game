import React, { useState } from 'react';
import { SubTabNavigation } from '../../../../../shared/components';
import { CandidatesPage } from './CandidatesPage';
import { DAILY_TASK_SUB_TABS, DailyTaskSubTab } from './constants';
import { HistoryPage } from './HistoryPage';

export function DailyTaskTab() {
  const [subTab, setSubTab] = useState<DailyTaskSubTab>('candidates');

  return (
    <Panel className="dailytask-layout">
      <SubTabNavigation tabs={DAILY_TASK_SUB_TABS} currentTab={subTab} onTabChange={setSubTab} />
      <Panel className="dailytask-content">
        {subTab === 'candidates' && <CandidatesPage />}
        {subTab === 'history' && <HistoryPage />}
      </Panel>
    </Panel>
  );
}
