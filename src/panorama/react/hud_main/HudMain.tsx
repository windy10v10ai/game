import React from 'react';
import { NavigationProvider } from './store/NavigationContext';
import { DialogProvider, DialogStack } from './store/DialogContext';
import { PageRouter } from './router/PageRouter';
import { HudEntryButton } from './components/HudEntryButton';

/**
 * hud_main 入口组件。
 *
 * 结构：
 *   <NavigationProvider>     // 当前页面 / 历史栈 / 跨 entry 事件监听
 *     <DialogProvider>       // 对话框栈（基础设施，业务用 useDialog 推入对话框节点）
 *       <HudEntryButton />   // 个人中心入口（imperative 挂到 Dota HUD 的 ButtonBar）
 *       <PageRouter />       // 根据 currentPage 渲染对应页面
 *       <DialogStack />      // 渲染当前对话框栈，浮在 PageRouter 之上
 *     </DialogProvider>
 *   </NavigationProvider>
 *
 * 默认 currentPage = null，仅 ButtonBar 上的入口按钮可见。
 * 其他 entry 也可通过 SendEventClientSide('hud_open_page', { page: 'profile' }) 唤起。
 */
function HudMain() {
  return (
    <NavigationProvider>
      <DialogProvider>
        <HudEntryButton />
        <PageRouter />
        <DialogStack />
      </DialogProvider>
    </NavigationProvider>
  );
}

export default HudMain;
