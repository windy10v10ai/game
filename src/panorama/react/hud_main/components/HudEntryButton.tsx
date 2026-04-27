import { useEffect, useRef } from 'react';
import { FindDotaHudElement } from '@utils/utils';
import { useNavigation } from '../store/NavigationContext';

const BUTTON_ID = 'OpenProfileButton';
const TOOLTIP_TEXT = '打开个人中心';

/**
 * hud_main 常驻入口按钮（生涯入口）。
 *
 * 渲染目标不是 React tree，而是 Dota HUD 的 ButtonBar（爱发电/Patreon 按钮所在容器），
 * 因此用 imperative 方式：useEffect 中通过 $.CreatePanel 挂到 ButtonBar，组件卸载时 DeleteAsync。
 *
 * 行为：
 *   - 点击：若当前未打开 home，则 openPage('home')；若已打开任何 hud_main 页面，则 closePage()。
 *   - 按钮自身始终常驻，不随页面状态隐藏。
 */
export function HudEntryButton() {
  const { currentPage, openPage, closePage } = useNavigation();

  // 用 ref 同步最新 navigation 状态，避免 onactivate 闭包捕获过期值
  const navRef = useRef({ currentPage, openPage, closePage });
  useEffect(() => {
    navRef.current = { currentPage, openPage, closePage };
  }, [currentPage, openPage, closePage]);

  useEffect(() => {
    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[HudEntryButton] cannot locate Hud root: ', e);
    }
    if (!buttonBar) {
      return () => {
        /* noop */
      };
    }

    // 复用既有按钮 panel（脚本热重载场景），否则新建
    const existing = buttonBar.FindChild(BUTTON_ID);
    const button = existing ?? $.CreatePanel('Button', buttonBar, BUTTON_ID);

    // 显式放大按钮尺寸（默认 ButtonBar 子按钮偏小），并把图标作为整面背景。
    button.style.width = '52px';
    button.style.height = '52px';
    button.style.marginLeft = '4px';
    button.style.marginRight = '4px';
    button.style.backgroundImage = "url('file://{images}/custom_game/profile/icon_profile.png')";
    button.style.backgroundSize = '100% 100%';
    button.style.backgroundRepeat = 'no-repeat';

    button.SetPanelEvent('onactivate', () => {
      const nav = navRef.current;
      // toggle：已打开任何页面则关闭；否则打开个人中心
      if (nav.currentPage !== null) {
        nav.closePage();
      } else {
        nav.openPage('profile');
      }
    });

    button.SetPanelEvent('onmouseover', () => {
      $.DispatchEvent('DOTAShowTextTooltip', button, TOOLTIP_TEXT);
    });

    button.SetPanelEvent('onmouseout', () => {
      $.DispatchEvent('DOTAHideTextTooltip');
    });

    return () => {
      // hud_main 整个卸载时清理按钮（正常游戏中不会触发；仅热重载场景）
      button.ClearPanelEvent('onactivate');
      button.ClearPanelEvent('onmouseover');
      button.ClearPanelEvent('onmouseout');
      button.DeleteAsync(0);
    };
  }, []);

  // 这个组件不渲染任何 React 节点，按钮挂到外部 ButtonBar
  return null;
}
