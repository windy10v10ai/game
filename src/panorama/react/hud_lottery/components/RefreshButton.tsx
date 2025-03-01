import React from 'react';
import { LotteryStatusDto } from '../../../../common/dto/lottery-status';
import { MemberDto } from '../../../../vscripts/api/player';
import { GetOpenMemberUrl } from '@utils/utils';
import { AbilityItemType } from '../../../../common/dto/lottery';

interface RefreshButtonProps {
  type: AbilityItemType;
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
  type: AbilityItemType,
  isMember: boolean | undefined,
  isRefreshed: boolean | undefined,
  pickedName: string | undefined,
) => {
  if (!isMember) {
    return '#lottery_tooltip_ability_refresh_not_member';
  }
  if (isRefreshed) {
    return '#lottery_tooltip_ability_refresh_used';
  }
  if (pickedName) {
    return '#lottery_tooltip_ability_refresh_picked';
  }
  return '#lottery_tooltip_ability_refresh';
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type, lotteryStatus, member }) => {
  // 根据会员 抽选状态判断是否禁用
  const isMember = member?.enable;
  const isRefreshed =
    type === 'abilityActive'
      ? lotteryStatus?.isActiveAbilityRefreshed
      : lotteryStatus?.isPassiveAbilityRefreshed;
  const pickedName =
    type === 'abilityActive' ? lotteryStatus?.activeAbilityName : lotteryStatus?.passiveAbilityName;
  const enabled = isMember && !isRefreshed && !pickedName;
  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // 提示文本
  const tooltipTextToken = getTooltipTextToken(type, isMember, isRefreshed, pickedName);
  const tooltipText = $.Localize(tooltipTextToken);

  // 刷新事件
  const refreshEventName = 'lottery_refresh_ability';

  const handleButtonClick = () => {
    if (!isMember) {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
      return;
    }
    if (isRefreshed) {
      return;
    }
    GameEvents.SendCustomGameEventToServer(refreshEventName, {
      type,
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
