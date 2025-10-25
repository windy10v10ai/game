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

const getIsRefreshed = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.isActiveAbilityRefreshed;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.isPassiveAbilityRefreshed;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.isPassiveAbilityRefreshed2;
  }
  return false;
};

const getPickedName = (type: AbilityItemType, lotteryStatus: LotteryStatusDto | null) => {
  if (type === 'abilityActive') {
    return lotteryStatus?.activeAbilityName;
  }
  if (type === 'abilityPassive') {
    return lotteryStatus?.passiveAbilityName;
  }
  if (type === 'abilityPassive2') {
    return lotteryStatus?.passiveAbilityName2;
  }
  return undefined;
};

const RefreshButton: React.FC<RefreshButtonProps> = ({ type, lotteryStatus, member }) => {
  // 根据会员 抽选状态判断是否禁用
  const isMember = member?.enable;
  // 【修改】获取刷新次数信息
  const maxRefreshCount = lotteryStatus?.maxRefreshCount ?? 1;
  let currentRefreshCount = 0;

  if (type === 'abilityActive') {
    currentRefreshCount = lotteryStatus?.activeAbilityRefreshCount ?? 0;
  } else if (type === 'abilityPassive') {
    currentRefreshCount = lotteryStatus?.passiveAbilityRefreshCount ?? 0;
  } else if (type === 'abilityPassive2') {
    currentRefreshCount = lotteryStatus?.passiveAbilityRefreshCount2 ?? 0;
  }

  const remainingRefreshCount = maxRefreshCount - currentRefreshCount;
  const isRefreshed = remainingRefreshCount <= 0;
  const pickedName = getPickedName(type, lotteryStatus);
  const enabled = isMember && !isRefreshed && !pickedName;
  const imageSrc = enabled
    ? 'file://{images}/custom_game/lottery/icon_rerolltoken.png'
    : 'file://{images}/custom_game/lottery/icon_rerolltoken_disabled.png';

  // 【修改】提示文本包含剩余次数
  let tooltipText = $.Localize(getTooltipTextToken(type, isMember, isRefreshed, pickedName));
  if (isMember && !isRefreshed && !pickedName) {
    tooltipText += `\n剩余刷新次数: ${remainingRefreshCount}/${maxRefreshCount}`;
  }

  // 刷新事件
  const refreshEventName = 'lottery_refresh_ability';

  const handleButtonClick = () => {
    if (!isMember) {
      $.DispatchEvent('ExternalBrowserGoToURL', GetOpenMemberUrl());
      return;
    }

    if (isRefreshed) {
      $.Msg('[RefreshButton] Already refreshed, ignoring click');
      return;
    }

    $.Msg('[RefreshButton] Sending refresh event');
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
