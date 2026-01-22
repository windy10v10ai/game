import { useState, useRef } from 'react';
import { LeaderboardView } from './LeaderboardView';
import { SubTabNavigation } from './SubTabNavigation';

type SubTabType = 'bravery' | 'achievements';

/**
 * 排行榜页面组件
 * 包含勇士积分排行榜和成就排行榜两个子标签页
 */
export function AchievementsPage() {
  const [currentSubTab, setCurrentSubTab] = useState<SubTabType>('bravery');
  const braveryListRef = useRef<Panel>(null);
  const achievementsListRef = useRef<Panel>(null);

  // Sub Tab 导航栏配置
  const subTabs = [
    { id: 'bravery', label: '勇士积分排行榜' },
    { id: 'achievements', label: '成就排行榜' },
  ];

  // 勇士积分排行榜列配置
  const braveryColumns = [
    { className: 'leaderboard-col-rank', text: '排名' },
    { className: 'leaderboard-col-name', text: '玩家名称' },
  ];

  // 成就排行榜列配置
  const achievementsColumns = [
    { className: 'leaderboard-col-rank', text: '排名' },
    { className: 'leaderboard-col-name', text: '玩家名称' },
    { className: 'leaderboard-col-achievements', text: '成就数' },
  ];

  // 取得玩家信息
  const currentBraveryRank = 'N/A';
  const currentAchievementsRank = 'N/A';

  // 处理 tab 切换
  const handleTabChange = (tabId: string) => {
    setCurrentSubTab(tabId as SubTabType);
  };

  return (
    <Panel className="leaderboard-container">
      {/* Sub Tab 导航栏和内容区域容器 */}
      <Panel className="leaderboard-main-layout">
        {/* Sub Tab 导航栏 */}
        <SubTabNavigation tabs={subTabs} currentTab={currentSubTab} onTabChange={handleTabChange} />

        {/* 页面内容 */}
        {currentSubTab === 'bravery' && (
          <LeaderboardView
            title="勇士积分排行榜"
            currentRank={currentBraveryRank}
            columns={braveryColumns}
            listRef={braveryListRef}
          />
        )}

        {currentSubTab === 'achievements' && (
          <LeaderboardView
            title="成就排行榜"
            currentRank={currentAchievementsRank}
            columns={achievementsColumns}
            listRef={achievementsListRef}
          />
        )}
      </Panel>
    </Panel>
  );
}
