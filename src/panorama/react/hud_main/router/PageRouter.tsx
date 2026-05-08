import React from 'react';
import { useNavigation } from '../store/NavigationContext';
import { ProfilePage } from '../pages/profile';
import { ProfileTabId } from '../pages/profile/ProfilePage';
import { ShopPage } from '../pages/shop';
import { LeaderboardPage } from '../pages/leaderboard';

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
    default: {
      // 编译期穷尽性检查：新增 PageId 未处理时 TS 会报错
      const _exhaustive: never = currentPage;
      return null;
    }
  }
}
