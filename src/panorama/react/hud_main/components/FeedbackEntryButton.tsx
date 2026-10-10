import React, { useEffect, useRef, useState } from 'react';
import { FindDotaHudElement, IsInGameHudLayer } from '@utils/utils';
import { useNavigation } from '../store/NavigationContext';
import { FEEDBACK_ICON } from './constants';

const BUTTON_ID = 'feedbackButton';
const WEBSITE_BUTTON_ID = 'websiteButton';

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  width: '42px',
  height: '42px',
  marginLeft: '2px',
  marginRight: '2px',
  verticalAlign: 'center',
  backgroundImage: `url('${FEEDBACK_ICON}')`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  opacity: '1',
  transitionProperty: 'brightness',
  transitionDuration: '0.1s',
};

/** 按钮栏里的反馈入口，打开个人主页的反馈页，已打开任何页面时再点即关闭 */
export function FeedbackEntryButton() {
  const buttonRef = useRef<Panel | null>(null);
  const [hovered, setHovered] = useState(false);
  const { currentPage, openPage, closePage } = useNavigation();
  // hud_main 在多个层各加载一份，只挂游戏内 HUD 层那份，避免按钮栏出现重复按钮
  const inGameHud = IsInGameHudLayer();

  useEffect(() => {
    const button = buttonRef.current;
    if (!inGameHud || !button) return;

    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[FeedbackEntryButton] cannot locate ButtonBar: ', e);
    }
    if (!buttonBar) return;

    button.SetParent(buttonBar);
    // 网站入口会把自己排到末尾，反馈入口固定排在它前面，挂入先后不影响顺序
    const website = buttonBar.FindChild(WEBSITE_BUTTON_ID);
    if (website) {
      buttonBar.MoveChildBefore(button, website);
    }
  }, [inGameHud]);

  return (
    <Button
      id={BUTTON_ID}
      ref={buttonRef}
      style={{
        ...buttonStyle,
        // 挂在 Dota HUD 下，自定义样式表的 :hover 作用不到，改用 state 高亮
        brightness: hovered ? '1.2' : '1',
        visibility: inGameHud ? 'visible' : 'collapse',
      }}
      onactivate={() => (currentPage !== null ? closePage() : openPage('profile', 'feedback'))}
      onmouseover={(panel) => {
        setHovered(true);
        $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize('#feedback_open_button'));
      }}
      onmouseout={() => {
        setHovered(false);
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    />
  );
}
