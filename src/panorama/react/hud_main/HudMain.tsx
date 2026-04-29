import React from 'react';
import { NavigationProvider } from './store/NavigationContext';
import { PageRouter } from './router/PageRouter';
import { HudEntryButton } from './components/HudEntryButton';

/**
 * hud_main 入口组件。
 *
 * 结构：
 *   <NavigationProvider>     // 当前页面 / 历史栈 / 跨 entry 事件监听
 *     <HudEntryButton />     // 个人中心入口（imperative 挂到 Dota HUD 的 ButtonBar）
 *     <PageRouter />         // 根据 currentPage 渲染对应页面
 *   </NavigationProvider>
 *
 * 默认 currentPage = null，仅 ButtonBar 上的入口按钮可见。
 */
function HudMain() {
  return (
    <NavigationProvider>
      <HudEntryButton />
      <PageRouter />
    </NavigationProvider>
  );
}

export default HudMain;
