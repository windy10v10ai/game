import React from 'react';
import { NavigationProvider } from './store/NavigationContext';
import { PageRouter } from './router/PageRouter';
import { ProfileEntryButton } from './components/ProfileEntryButton';
import { MemberEntryButton } from './components/MemberEntryButton';
import { DailyTaskProgressWidget } from './components/DailyTaskProgressWidget';
import { DailyTaskHeroSelectWidget } from './components/DailyTaskHeroSelectWidget';

/**
 * hud_main 入口组件。
 *
 * 结构：
 *   <NavigationProvider>            // 当前页面 / 历史栈 / 跨 entry 事件监听
 *     <ProfileEntryButton />        // 个人中心入口（imperative 挂到 Dota HUD 的 ButtonBar）
 *     <MemberEntryButton />         // 会员入口（imperative 挂到 ButtonBar）
 *     <DailyTaskProgressWidget />   // 局内每日任务进度浮窗（仅游戏内 HUD 层渲染）
 *     <DailyTaskHeroSelectWidget /> // 选英雄阶段候选速览（仅选英雄层渲染）
 *     <PageRouter />                // 根据 currentPage 渲染对应页面
 *   </NavigationProvider>
 *
 * 默认 currentPage = null，仅入口按钮与两个浮窗可见。
 */
function HudMain() {
  return (
    <NavigationProvider>
      <ProfileEntryButton />
      <MemberEntryButton />
      <DailyTaskProgressWidget />
      <DailyTaskHeroSelectWidget />
      <PageRouter />
    </NavigationProvider>
  );
}

export default HudMain;
