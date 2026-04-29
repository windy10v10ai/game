import React, { useRef, useState } from 'react';
import { SubTabNavigation } from '../../../shared/components';
import { useNavigation } from '../../store/NavigationContext';
import { LeaderboardView } from './LeaderboardView';

type LeaderboardSubTabId = 'bravery' | 'achievements';

const SUB_TABS: { id: LeaderboardSubTabId; label: string }[] = [
  { id: 'bravery', label: '勇士积分排行榜' },
  { id: 'achievements', label: '成就排行榜' },
];

const BRAVERY_COLUMNS = [
  { className: 'leaderboard-col-rank', text: '排名' },
  { className: 'leaderboard-col-name', text: '玩家名称' },
];

const ACHIEVEMENTS_COLUMNS = [
  { className: 'leaderboard-col-rank', text: '排名' },
  { className: 'leaderboard-col-name', text: '玩家名称' },
  { className: 'leaderboard-col-achievements', text: '成就数' },
];

/**
 * 排行榜独立页面。
 *
 * 当前没有显式入口；后续可在个人中心旁加按钮、或点击勇士等级跳转等。
 */
export function LeaderboardPage() {
  const [currentSubTab, setCurrentSubTab] = useState<LeaderboardSubTabId>('bravery');
  const braveryListRef = useRef<Panel>(null);
  const achievementsListRef = useRef<Panel>(null);
  const { closePage } = useNavigation();

  return (
    <Panel className="modal-panel" hittest={true}>
      <Panel className="modal-header">
        <Label className="modal-title" text="排行榜" />
        <Button className="btn-close" onactivate={closePage} />
      </Panel>

      <Panel className="content-area">
        <Panel className="leaderboard-container">
          <Panel className="leaderboard-main-layout">
            <SubTabNavigation
              tabs={SUB_TABS}
              currentTab={currentSubTab}
              onTabChange={setCurrentSubTab}
            />

            {currentSubTab === 'bravery' && (
              <LeaderboardView
                title="勇士积分排行榜"
                currentRank="N/A"
                columns={BRAVERY_COLUMNS}
                listRef={braveryListRef}
              />
            )}

            {currentSubTab === 'achievements' && (
              <LeaderboardView
                title="成就排行榜"
                currentRank="N/A"
                columns={ACHIEVEMENTS_COLUMNS}
                listRef={achievementsListRef}
              />
            )}
          </Panel>
        </Panel>
      </Panel>
    </Panel>
  );
}
