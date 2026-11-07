import React, { useEffect, useRef } from 'react';

// 与服务端 item-lottery.ts、passive-tome-lottery.ts 的付费刷新档位保持一致
export const PAID_REFRESH_COSTS = [10, 20, 30, 50];
export const MAX_PAID_REFRESH_COUNT = 5;

export const getPaidRefreshCost = (paidCount: number) =>
  PAID_REFRESH_COSTS[Math.min(paidCount, PAID_REFRESH_COSTS.length - 1)];

const refreshButtonStyle: Partial<VCSSStyleDeclaration> = {
  marginLeft: '5px',
  marginRight: '5px',
  verticalAlign: 'center',
};

const refreshImageStyle: Partial<VCSSStyleDeclaration> = {
  width: '40px',
  height: '40px',
};

interface LotteryRefreshButtonProps {
  tooltipText: string;
  // 可正常刷新时显示亮色图标，其余状态（引导、已达上限）灰显但仍可点击
  canRefresh: boolean;
  onClick: () => void;
}

function LotteryRefreshButton({ tooltipText, canRefresh, onClick }: LotteryRefreshButtonProps) {
  const imageSrc = canRefresh
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // DOTAShowTextTooltip 是快照式：悬停期间文案变化（刷新后进入下一档）不会自动更新，需主动重发
  const hoverPanelRef = useRef<Panel | null>(null);
  useEffect(() => {
    if (hoverPanelRef.current) {
      $.DispatchEvent('DOTAShowTextTooltip', hoverPanelRef.current, tooltipText);
    }
  }, [tooltipText]);

  return (
    <Button
      onactivate={onClick}
      style={refreshButtonStyle}
      onmouseover={(panel) => {
        hoverPanelRef.current = panel;
        $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText);
      }}
      onmouseout={() => {
        hoverPanelRef.current = null;
        $.DispatchEvent('DOTAHideTextTooltip');
      }}
    >
      <Image src={imageSrc} style={refreshImageStyle} />
    </Button>
  );
}

export default LotteryRefreshButton;
