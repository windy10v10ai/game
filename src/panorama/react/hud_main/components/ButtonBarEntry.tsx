import React, { useEffect, useRef, useState } from 'react';
import { FindDotaHudElement, IsInGameHudLayer, IsInHeroSelectionLayer } from '@utils/utils';

const BUTTON_SIZE = '46px';

// 选英雄层的定位由 hud-hero-select-entry-btn 负责
const BUTTON_BAR_SPACING: Partial<VCSSStyleDeclaration> = {
  marginLeft: '2px',
  marginRight: '2px',
  verticalAlign: 'center',
};

interface ButtonBarEntryProps {
  id: string;
  icon: string;
  tooltip: string;
  /** 图案铺满整张图的图标缩小一些，与自带留白的图标看起来一样大、间距一样宽 */
  iconScale?: number;
  onActivate: () => void;
  /** 选英雄阶段按钮栏不可见，需要时改在本层左上角显示 */
  showInHeroSelect?: boolean;
}

/** Dota 左上角按钮栏里的一个自定义入口 */
export function ButtonBarEntry({
  id,
  icon,
  tooltip,
  iconScale = 100,
  onActivate,
  showInHeroSelect = false,
}: ButtonBarEntryProps) {
  const buttonRef = useRef<Panel | null>(null);
  const [hovered, setHovered] = useState(false);
  // hud_main 在多个层各加载一份，只有游戏内 HUD 层那份挂进按钮栏，避免重复
  const inGameHud = IsInGameHudLayer();
  const inHeroSelect = showInHeroSelect && IsInHeroSelectionLayer();

  useEffect(() => {
    const button = buttonRef.current;
    if (!inGameHud || !button) return;

    let buttonBar: Panel | null = null;
    try {
      buttonBar = FindDotaHudElement('ButtonBar');
    } catch (e) {
      $.Msg('[ButtonBarEntry] cannot locate ButtonBar: ', e);
    }
    if (!buttonBar) return;

    // 挂出去的按钮脱离了 React 的管理，热重载卸载时删不掉，新按钮挂入前先清掉旧的
    const stale = buttonBar.FindChild(id);
    if (stale && stale !== button) {
      stale.DeleteAsync(0);
    }
    // 各入口按渲染顺序依次追加到末尾，按钮栏里的先后即入口列表的先后
    button.SetParent(buttonBar);
  }, [inGameHud, id]);

  return (
    <Button
      id={id}
      ref={buttonRef}
      className={inHeroSelect ? 'hud-hero-select-entry-btn' : ''}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        ...(inHeroSelect ? {} : BUTTON_BAR_SPACING),
        backgroundImage: `url('${icon}')`,
        backgroundSize: `${iconScale}% ${iconScale}%`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // 按钮栏子按钮默认半透明，图标偏暗时不易辨认
        opacity: '1',
        // 挂在 Dota HUD 下，自定义样式表的 :hover 作用不到，改用 state 高亮
        brightness: hovered ? '1.2' : '1',
        transitionProperty: 'brightness',
        transitionDuration: '0.1s',
        visibility: inGameHud || inHeroSelect ? 'visible' : 'collapse',
      }}
      onactivate={onActivate}
      onmouseover={(panel) => {
        setHovered(true);
        $.DispatchEvent('DOTAShowTextTooltip', panel, tooltip);
      }}
      onmouseout={() => {
        setHovered(false);
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    />
  );
}
