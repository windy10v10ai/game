import 'panorama-polyfill-x/lib/console';
import 'panorama-polyfill-x/lib/timers';
import React from 'react';
import { useEffect, useState } from 'react';
import { HomeStatusDto } from '../../../common/dto/home-status';
import { GetLocalPlayerSteamAccountID } from '@utils/utils';
import { StatsPage } from './components/StatsPage';
import { AchievementsPage } from './components/AchievementsPage';
import { SettingsPage } from './components/SettingsPage';
import { TabNavigation } from './components/TabNavigation';

type PageType = 'stats' | 'achievements' | 'settings';

/**
 * Home 主组件
 */
function Home() {
  const steamAccountId = GetLocalPlayerSteamAccountID();
  const [currentPage, setCurrentPage] = useState<PageType>('stats');

  // 定义主 Tab 配置
  const mainTabs = [
    { id: 'stats' as PageType, label: '统计' },
    { id: 'achievements' as PageType, label: '排行榜' },
    { id: 'settings' as PageType, label: '设置' },
  ];

  // 订阅 home_status Net Table
  const [homeStatus, setHomeStatus] = useState<HomeStatusDto | null>(() => {
    const data = CustomNetTables.GetTableValue('home_status', steamAccountId);
    return data as HomeStatusDto | null;
  });

  useEffect(() => {
    // 监听 home_status 变化
    const listenerId = CustomNetTables.SubscribeNetTableListener(
      'home_status',
      (_tableName, key, value) => {
        if (key === steamAccountId) {
          setHomeStatus(value as HomeStatusDto);
        }
      },
    );

    return () => {
      CustomNetTables.UnsubscribeNetTableListener(listenerId);
    };
  }, [steamAccountId]);

  return (
    <Panel className="home-container">
      {/* 标题栏 */}
      <Panel className="home-header">
        <Label className="home-title" text="玩家信息" />
      </Panel>

      {/* Tab 导航栏 */}
      <TabNavigation tabs={mainTabs} currentTab={currentPage} onTabChange={setCurrentPage} />

      {/* 页面内容 */}
      <Panel className="content-area">
        {currentPage === 'stats' && <StatsPage homeStatus={homeStatus} />}
        {currentPage === 'achievements' && <AchievementsPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </Panel>
    </Panel>
  );
}

export default Home;
