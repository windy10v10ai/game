import React, { useEffect, useRef, useState } from 'react';
import { FindDotaHudElement, IsInGameHudLayer, WEBSITE_URL } from '@utils/utils';
import { WEBSITE_ICON } from './constants';

const BUTTON_ID = 'websiteButton';

// 按钮栏子按钮默认半透明，图标偏暗时不易辨认
const buttonStyle: Partial<VCSSStyleDeclaration> = {
  width: '42px',
  height: '42px',
  marginLeft: '2px',
  marginRight: '2px',
  verticalAlign: 'center',
  backgroundImage: `url('${WEBSITE_ICON}')`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  opacity: '0.8',
  transitionProperty: 'brightness',
  transitionDuration: '0.1s',
};

/** 按钮栏里的网站入口，点击用外部浏览器打开网站首页 */
export function WebsiteEntryButton() {
  const buttonRef = useRef<Panel | null>(null);
  const [hovered, setHovered] = useState(false);
  // hud_main 在多个层各加载一份，只挂游戏内 HUD 层那份，避免按钮栏出现重复按钮
  const inGameHud = IsInGameHudLayer();

  useEffect(() => {
    const button = buttonRef.current;
    if (!inGameHud || !button) return;

    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[WebsiteEntryButton] cannot locate ButtonBar: ', e);
    }
    if (!buttonBar) return;

    button.SetParent(buttonBar);
    // 其他入口按钮可能晚于本组件挂入，统一把网站入口排到按钮栏末尾
    const children = buttonBar.Children();
    const last = children[children.length - 1];
    if (last && last !== button) {
      buttonBar.MoveChildAfter(button, last);
    }
  }, [inGameHud]);

  return (
    <Button
      id={BUTTON_ID}
      ref={buttonRef}
      style={{
        ...buttonStyle,
        // 挂在 Dota HUD 下，自定义样式表的 :hover 作用不到，改用 state 高亮
        brightness: hovered ? '1.3' : '1',
        visibility: inGameHud ? 'visible' : 'collapse',
      }}
      onactivate={() => $.DispatchEvent('ExternalBrowserGoToURL', WEBSITE_URL)}
      onmouseover={(panel) => {
        setHovered(true);
        $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#website_open_button'));
      }}
      onmouseout={() => {
        setHovered(false);
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    />
  );
}
