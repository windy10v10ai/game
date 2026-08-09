import React from 'react';
import { useNavigation } from '../store/NavigationContext';
import { ProfilePage } from '../pages/profile';
import { ProfileTabId } from '../pages/profile/ProfilePage';
import { ShopPage } from '../pages/shop';
import { LeaderboardPage } from '../pages/leaderboard';
import { DailyChallengePage } from '../pages/daily-challenge';

/**
 * 根据当前 currentPage 渲染对应 Page 组件。
 * currentPage 为 null 时返回 null（hud_main 整体不可见）。
 */
export function PageRouter() {
  const { currentPage, currentParam } = useNavigation();
  if (!currentPage) return null;

  switch (currentPage) {
    case 'profile':
      return <ProfilePage initialTab={currentParam as ProfileTabId | undefined} />;
    case 'shop':
      return <ShopPage />;
    case 'leaderboard':
      return <LeaderboardPage />;
    case 'daily-challenge':
      return <DailyChallengePage />;
    default: {
      const _exhaustive: never = currentPage;
      return null;
    }
  }
}
