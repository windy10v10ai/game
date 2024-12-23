import React from 'react';
import { ItemOrAbility } from './LotteryRow';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { MemberDto } from '../../../../vscripts/api/player';
import { GetOpenMemberUrl } from '@utils/utils';

interface RefreshButtonProps {
  type: ItemOrAbility;
  lotteryStatus: LotteryStatusDto | null;
  member: MemberDto | null;
}

const buttonStyle: Partial<VCSSStyleDeclaration> = {
  horizontalAlign: 'center',
  verticalAlign: 'bottom',
};

const imageStyle: Partial<VCSSStyleDeclaration> = {
  marginBottom: '20px',
  width: '50px',
  height: '50px',
};

const getTooltipTextToken = (
  type: ItemOrAbility,
  isMember: boolean | undefined,
  isRefreshed: boolean | undefined,
  pickedName: string | undefined,
) => {
  if (!isMember) {
    return type === 'item'
      ? '#lottery_tooltip_item_refresh_not_member'
      : '#lottery_tooltip_ability_refresh_not_member';
  }
  if (isRefreshed) {
    return type === 'item'
      ? '#lottery_tooltip_item_refresh_used'
      : '#lottery_tooltip_ability_refresh_used';
  }
  if (pickedName) {
    return type === 'item'
      ? '#lottery_tooltip_item_refresh_picked'
      : '#lottery_tooltip_ability_refresh_picked';
  }
  return type === 'item' ? '#lottery_tooltip_item_refresh' : '#lottery_tooltip_ability_refresh';
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type, lotteryStatus, member }) => {
  // 根据会员 抽选状态判断是否禁用
  const isMember = member?.enable;
  const isRefreshed =
    type === 'item' ? lotteryStatus?.isItemRefreshed : lotteryStatus?.isAbilityRefreshed;
  const pickedName = type === 'item' ? lotteryStatus?.pickItemName : lotteryStatus?.pickAbilityName;
  const enabled = isMember && !isRefreshed && !pickedName;
  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // 提示文本
  const tooltipTextToken = getTooltipTextToken(type, isMember, isRefreshed, pickedName);
  const tooltipText = $.Localize(tooltipTextToken);

  // 刷新事件
  const refreshEventName = type === 'item' ? 'lottery_refresh_item' : 'lottery_refresh_ability';

  const handleButtonClick = () => {
    if (!isMember) {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
      return;
    }
    if (isRefreshed) {
      return;
    }
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      PlayerID: Game.GetLocalPlayerID(),
    });
  };
  return (
    <Button
      onactivate={handleButtonClick}
      style={buttonStyle}
      onmouseover={(panel) => $.DispatchEvent('DOTAShowTextTooltip', panel, tooltipText)}
      onmouseout={() => $.DispatchEvent('DOTAHideTextTooltip')}
    >
      <Image src={imageSrc} style={imageStyle} />
    </Button>
  );
};

export default RefreshButton;
